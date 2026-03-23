/**
 * @file src/app/api/admin/users/route.ts
 * @description Admin API for listing users with tenant-aware RBAC filtering.
 * @compliance POPIA: User data is tenant-scoped via RLS and app-layer checks.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  createAdminRouteClient,
  getRequestMetadata,
  logImpersonationActionIfNeeded,
  requireAuthenticatedSession,
} from '@/lib/auth/admin-session';
import { isAdminRole, isPlatformAdmin, normalizeRole } from '@/lib/auth/roles';

const VALID_ASSIGNABLE_ROLES_ARRAY = [
  'viewer',
  'analyst',
  'power_user',
  'admin',
  'VIEWER',
  'ANALYST',
  'POWER_USER',
  'TENANT_ADMIN',
] as const;

const VALID_ASSIGNABLE_ROLES = new Set<string>(VALID_ASSIGNABLE_ROLES_ARRAY);

interface UserProfile {
  id: string;
  email: string | null;
  full_name: string | null;
  role: string;
  tenant_id: string | null;
  created_at: string;
}

// GET /api/admin/users — List users in caller scope
export async function GET(request: NextRequest) {
  try {
    const { client } = createAdminRouteClient(request);
    const session = await requireAuthenticatedSession(client);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: caller } = await client
      .from('profiles')
      .select('role, tenant_id')
      .eq('id', session.user.id)
      .single();

    if (!caller || !isAdminRole(caller.role)) {
      return NextResponse.json({ error: 'Forbidden: admin role required' }, { status: 403 });
    }

    let query = client
      .from('profiles')
      .select('id, email, full_name, role, tenant_id, created_at')
      .order('created_at', { ascending: false });

    if (!isPlatformAdmin(caller.role)) {
      query = query.eq('tenant_id', caller.tenant_id);
    }

    const { data: users, error } = await query;
    if (error) throw error;

    const normalizedUsers = (users ?? []).map((user: UserProfile) => {
      const canonicalRole = normalizeRole(user.role);
      let uiRole = 'viewer';
      if (canonicalRole === 'PLATFORM_ADMIN' || canonicalRole === 'TENANT_ADMIN') uiRole = 'admin';
      if (canonicalRole === 'POWER_USER') uiRole = 'power_user';
      if (canonicalRole === 'ANALYST') uiRole = 'analyst';
      return { ...user, role: uiRole };
    });

    return NextResponse.json({ data: normalizedUsers, tier: 'LIVE' });
  } catch (error: unknown) {
    console.error('[Admin Users GET]:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// PATCH /api/admin/users — Assign role to a user
export async function PATCH(request: NextRequest) {
  try {
    const { client } = createAdminRouteClient(request);
    const metadata = getRequestMetadata(request);
    const session = await requireAuthenticatedSession(client);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: caller } = await client
      .from('profiles')
      .select('id, role, tenant_id')
      .eq('id', session.user.id)
      .single();

    if (!caller || !isAdminRole(caller.role)) {
      return NextResponse.json({ error: 'Forbidden: admin role required' }, { status: 403 });
    }

    const body = await request.json();
    const { userId, role } = body;

    if (!userId || !role) {
      return NextResponse.json({ error: 'userId and role are required' }, { status: 400 });
    }

    if (!VALID_ASSIGNABLE_ROLES.has(role)) {
      return NextResponse.json(
        { error: `Invalid role. Must be one of: ${VALID_ASSIGNABLE_ROLES_ARRAY.join(', ')}` },
        { status: 400 }
      );
    }

    const { data: targetUser } = await client
      .from('profiles')
      .select('id, tenant_id')
      .eq('id', userId)
      .single();

    if (!targetUser) {
      return NextResponse.json({ error: 'Target user not found' }, { status: 404 });
    }

    if (!isPlatformAdmin(caller.role) && targetUser.tenant_id !== caller.tenant_id) {
      return NextResponse.json({ error: 'Forbidden: tenant mismatch' }, { status: 403 });
    }

    const { error } = await client.rpc('assign_user_role', {
      target_user_id: userId,
      new_role: role,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    await logImpersonationActionIfNeeded(client, request, {
      action: 'admin.users.role_change',
      tenantId: targetUser.tenant_id,
      requestId: metadata.requestId,
      ipAddress: metadata.ipAddress,
      extra: { target_user_id: userId, new_role: role },
    });

    return NextResponse.json({ success: true, message: `Role updated to ${role}` });
  } catch (error: unknown) {
    console.error('[Admin Users PATCH]:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

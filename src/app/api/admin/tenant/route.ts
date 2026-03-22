/**
 * @file src/app/api/admin/tenant/route.ts
 * @description Tenant creation flow for admins — create new tenant and set up initial admin.
 * @compliance POPIA: Tenant creation audited. New tenant inherits platform DPIA scope.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { getRequestMetadata, logImpersonationActionIfNeeded } from '@/lib/auth/admin-session';
import { isAdminRole } from '@/lib/auth/roles';

function createClient(request: NextRequest) {
  const response = NextResponse.next();
  return {
    client: createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) { return request.cookies.get(name)?.value; },
          set(name: string, value: string, options: CookieOptions) {
            response.cookies.set({ name, value, ...options });
          },
          remove(name: string, options: CookieOptions) {
            response.cookies.set({ name, value: '', ...options });
          },
        },
      }
    ),
    response,
  };
}

// POST /api/admin/tenant — Create a new tenant
export async function POST(request: NextRequest) {
  try {
    const { client } = createClient(request);
    const metadata = getRequestMetadata(request);
    const { data: { session } } = await client.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only existing admins can create new tenants
    const { data: caller } = await client
      .from('profiles')
      .select('role, tenant_id')
      .eq('id', session.user.id)
      .single();

    if (!caller || !isAdminRole(caller.role)) {
      return NextResponse.json({ error: 'Forbidden: admin role required' }, { status: 403 });
    }

    const body = await request.json();
    const { name, slug } = body;

    if (!name || !slug) {
      return NextResponse.json({ error: 'name and slug are required' }, { status: 400 });
    }

    // Validate slug format
    if (!/^[a-z0-9-]+$/.test(slug)) {
      return NextResponse.json({ error: 'Slug must be lowercase alphanumeric with hyphens only' }, { status: 400 });
    }

    // Atomic tenant creation: tenant + settings + TENANT_ADMIN assignment
    const { data: result, error: rpcError } = await client.rpc('create_tenant_atomic', {
      p_name: name,
      p_slug: slug,
      p_admin_user_id: session.user.id,
    });

    if (rpcError) {
      if (rpcError.code === '23505') {
        return NextResponse.json({ error: 'A tenant with this slug already exists' }, { status: 409 });
      }
      throw rpcError;
    }

    // Audit log
    await client.from('audit_log').insert({
      tenant_id: result.tenant_id,
      user_id: session.user.id,
      event_type: 'tenant_create',
      details: { new_tenant_id: result.tenant_id, name, slug },
    });

    await logImpersonationActionIfNeeded(client, request, {
      action: 'admin.tenant.create',
      tenantId: result.tenant_id,
      requestId: metadata.requestId,
      ipAddress: metadata.ipAddress,
      extra: { new_tenant_id: result.tenant_id, slug },
    });

    return NextResponse.json({
      success: true,
      tenant: { id: result.tenant_id, name: result.name, slug: result.slug },
      message: `Tenant "${name}" created. You are now TENANT_ADMIN. Invite users to join.`,
    });
  } catch (error: any) {
    console.error('[Admin Tenant POST]:', error);
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}

/**
 * @file src/app/api/admin/audit/route.ts
 * @description Audit log API for tenant admins to view security events.
 * @compliance POPIA: Audit logs are tenant-isolated via RLS.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/auth-helpers-nextjs';
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

// GET /api/admin/audit — View recent audit log entries
export async function GET(request: NextRequest) {
  try {
    const { client } = createClient(request);
    const { data: { session } } = await client.auth.getSession();

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

    const url = new URL(request.url);
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100);
    const eventType = url.searchParams.get('event_type');

    let query = client
      .from('audit_log')
      .select('id, event_type, details, created_at, user_id')
      .eq('tenant_id', caller.tenant_id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (eventType) {
      query = query.eq('event_type', eventType);
    }

    const { data: events, error } = await query;

    if (error) throw error;

    return NextResponse.json({ data: events });
  } catch (error: any) {
    console.error('[Admin Audit GET]:', error);
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}

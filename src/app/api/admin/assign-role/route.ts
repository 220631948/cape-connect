/**
 * @file src/app/api/admin/assign-role/route.ts
 * @description Secure role assignment API via Supabase RPC.
 * @compliance POPIA: Role changes are audited via SECURITY DEFINER function.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

const VALID_ROLES = new Set(['viewer', 'analyst', 'power_user', 'admin']);

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

export async function POST(request: NextRequest) {
  try {
    const { client } = createClient(request);
    const { data: { session } } = await client.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { userId, role } = body;

    if (!userId || !role) {
      return NextResponse.json({ error: 'userId and role are required' }, { status: 400 });
    }

    if (!VALID_ROLES.has(role)) {
      return NextResponse.json({ error: `Invalid role. Must be one of: ${Array.from(VALID_ROLES).join(', ')}` }, { status: 400 });
    }

    // Call the RPC function (handles admin check + audit internally)
    const { error } = await client.rpc('assign_user_role', {
      target_user_id: userId,
      new_role: role,
    });

    if (error) {
      console.error('[Assign Role RPC Error]:', error);
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json({ success: true, message: `Role updated to ${role}` });
  } catch (error: any) {
    console.error('[Admin Assign Role POST]:', error);
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}

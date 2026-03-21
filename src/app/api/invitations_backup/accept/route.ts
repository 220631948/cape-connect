/**
 * @file src/app/api/invitations/accept/route.ts
 * @description Accept an invitation and update the user profile.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

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

    const { invitationId, token } = await request.json();

    if (!invitationId && !token) {
      return NextResponse.json({ error: 'Invitation ID or Token is required' }, { status: 400 });
    }

    // 1. Fetch and verify invitation
    let query = client
      .from('tenant_invitations')
      .select('*')
      .eq('status', 'pending')
      .gt('expires_at', new Date().toISOString());

    if (invitationId) {
      query = query.eq('id', invitationId).eq('email', session.user.email);
    } else {
      query = query.eq('token', token);
    }

    const { data: invitation, error: inviteError } = await query.maybeSingle();

    if (inviteError || !invitation) {
      return NextResponse.json({ error: 'Invalid or expired invitation' }, { status: 404 });
    }

    // 2. Update profile
    const { error: profileError } = await client
      .from('profiles')
      .update({
        tenant_id: invitation.tenant_id,
        role: invitation.role
      })
      .eq('id', session.user.id);

    if (profileError) throw profileError;

    // 3. Mark invitation as accepted
    const { error: updateInviteError } = await client
      .from('tenant_invitations')
      .update({ status: 'accepted' })
      .eq('id', invitation.id);

    if (updateInviteError) throw updateInviteError;

    return NextResponse.json({ success: true, message: 'Invitation accepted' });
  } catch (error: any) {
    console.error('[Invitation Accept POST]:', error);
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}

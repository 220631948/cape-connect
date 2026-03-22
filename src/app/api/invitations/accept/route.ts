/**
 * @file src/app/api/invitations/accept/route.ts
 * @description Accept an invitation — with 410 for expired tokens and existing member guard.
 *
 * POPIA ANNOTATION
 * Personal data handled: user ID, email, role, tenant ID
 * Purpose: invitation acceptance and tenant membership management
 * Lawful basis: consent (user explicitly accepts)
 * Retention: profile data persisted; invitation marked accepted
 * Subject rights: access ✓ | correction ✓ | deletion ✓ | objection ✓
 */

import { NextRequest, NextResponse } from 'next/server';
import { type CookieOptions, createServerClient } from '@supabase/ssr';
import { validateBody } from '@/lib/validation';
import { acceptInvitationSchema } from '@/lib/validation/schemas/invitations';

function createClient(request: NextRequest) {
  const response = NextResponse.next();
  return {
    client: createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value;
          },
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

    const validation = await validateBody(request, acceptInvitationSchema);
    if (!validation.success) {
      return validation.response;
    }
    const { invitationId, token } = validation.data;

    // Step 1: Fetch invitation WITHOUT date filter (to distinguish expired vs invalid)
    let query = client
      .from('tenant_invitations')
      .select('*')
      .eq('status', 'pending');

    if (invitationId) {
      query = query.eq('id', invitationId).eq('email', session.user.email);
    } else {
      query = query.eq('token', token);
    }

    const { data: invitation, error: inviteError } = await query.maybeSingle();

    // Step 2: Not found at all → 404
    if (inviteError || !invitation) {
      return NextResponse.json(
        { error: 'Invalid invitation — not found' },
        { status: 404 }
      );
    }

    // Step 3: Found but expired → 410 Gone with CTA
    const expiresAt = new Date(invitation.expires_at);
    if (expiresAt.getTime() <= Date.now()) {
      return NextResponse.json(
        {
          error: 'Invitation expired',
          cta: 'Request new invite',
          invited_by_email: invitation.invited_by ?? null,
        },
        { status: 410 }
      );
    }

    // Step 4: Check if user is already a member of this tenant
    const { data: profile } = await client
      .from('profiles')
      .select('tenant_id')
      .eq('id', session.user.id)
      .single();

    if (profile && profile.tenant_id === invitation.tenant_id) {
      // Already a member — mark accepted but do NOT overwrite profile
      await client
        .from('tenant_invitations')
        .update({ status: 'accepted' })
        .eq('id', invitation.id);

      return NextResponse.json({
        success: true,
        already_member: true,
        message: 'You are already a member of this tenant.',
      });
    }

    // Step 5: New member — update profile with tenant_id and role
    const { error: profileError } = await client
      .from('profiles')
      .update({
        tenant_id: invitation.tenant_id,
        role: invitation.role,
      })
      .eq('id', session.user.id);

    if (profileError) throw profileError;

    // Step 6: Mark invitation as accepted
    const { error: updateInviteError } = await client
      .from('tenant_invitations')
      .update({ status: 'accepted' })
      .eq('id', invitation.id);

    if (updateInviteError) throw updateInviteError;

    return NextResponse.json({
      success: true,
      already_member: false,
      message: 'Invitation accepted',
    });
  } catch (error: any) {
    console.error('[Invitation Accept POST]:', error);
    return NextResponse.json(
      { error: error.message || 'Internal error' },
      { status: 500 }
    );
  }
}

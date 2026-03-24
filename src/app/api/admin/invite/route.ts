/**
 * @file src/app/api/admin/invite/route.ts
 * @description Tenant admin API for inviting users by email.
 * @compliance POPIA: Invitation emails are tenant-scoped. Tokens expire in 7 days.
 */

import {NextRequest, NextResponse} from 'next/server';
import {type CookieOptions, createServerClient} from '@supabase/ssr';
import {getRequestMetadata, logImpersonationActionIfNeeded} from '@/lib/auth/admin-session';
import {isAdminRole} from '@/lib/auth/roles';
import {validateBody} from '@/lib/validation';
import {inviteUserSchema} from '@/lib/validation/schemas/admin';
import { sendInvitationEmail } from '@/lib/email';

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
                        response.cookies.set({name, value, ...options});
                    },
                    remove(name: string, options: CookieOptions) {
                        response.cookies.set({name, value: '', ...options});
                    },
                },
            }
        ),
        response,
    };
}

// POST /api/admin/invite — Invite a user by email
export async function POST(request: NextRequest) {
    try {
        const {client} = createClient(request);
        const metadata = getRequestMetadata(request);
        const {data: {session}} = await client.auth.getSession();

        if (!session) {
            return NextResponse.json({error: 'Unauthorized'}, {status: 401});
        }

        // Check caller is admin
        const {data: caller} = await client
            .from('profiles')
            .select('role, tenant_id')
            .eq('id', session.user.id)
            .single();

        if (!caller || !isAdminRole(caller.role)) {
            return NextResponse.json({error: 'Forbidden: admin role required'}, {status: 403});
        }

        const validation = await validateBody(request, inviteUserSchema);
        if (!validation.success) {
            return (validation as import('@/lib/validation').ValidationFailure).response;
        }
        const {email, role} = validation.data;

        // Create invitation
        const {data: invitation, error} = await client
            .from('tenant_invitations')
            .insert({
                tenant_id: caller.tenant_id,
                email,
                role,
                invited_by: session.user.id,
            })
            .select()
            .single();

        if (error) {
            if (error.code === '23505') { // unique constraint violation
                return NextResponse.json({error: 'A pending invitation already exists for this email'}, {status: 409});
            }
            throw error;
        }

        // Audit log
        await client.from('audit_log').insert({
            tenant_id: caller.tenant_id,
            user_id: session.user.id,
            event_type: 'user_invite',
            details: {email, role, invitation_id: invitation.id},
        });

        await logImpersonationActionIfNeeded(client, request, {
            action: 'admin.invite.create',
            tenantId: caller.tenant_id,
            requestId: metadata.requestId,
            ipAddress: metadata.ipAddress,
            extra: {invited_email: email, invited_role: role, invitation_id: invitation.id},
        });

        // Send invitation email
        let deliveryStatus = 'pending';
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
        const invitationLink = `${appUrl}/invitations/accept?token=${invitation.token}`;

        // Send invitation email using Resend (centralized logic in @/lib/email)
        const emailResult = await sendInvitationEmail(email, role, invitationLink);

        if (emailResult.success) {
            deliveryStatus = 'sent';
        } else {
            console.error('[Admin Invite POST]: Email failed to send:', emailResult.error);
            deliveryStatus = 'failed';
        }

        // Update the delivery status in the database
        await client.from('tenant_invitations')
            .update({ delivery_status: deliveryStatus })
            .eq('id', invitation.id);

        return NextResponse.json({
            success: true,
            message: emailResult.success
              ? `Invitation sent to ${email}`
              : `Invitation created but email delivery failed for ${email}`,
            invitation: {
                id: invitation.id,
                email: invitation.email,
                role: invitation.role,
                expires_at: invitation.expires_at,
                delivery_status: deliveryStatus,
                // Only include token in dev mode
                ...(process.env.NODE_ENV === 'development' && {token: invitation.token}),
            },
            emailError: emailResult.success ? undefined : emailResult.error
        });
    } catch (error: any) {
        console.error('[Admin Invite POST]:', error);
        return NextResponse.json({error: error.message || 'Internal error'}, {status: 500});
    }
}

// GET /api/admin/invite — List pending invitations
export async function GET(request: NextRequest) {
    try {
        const {client} = createClient(request);
        const {data: {session}} = await client.auth.getSession();

        if (!session) {
            return NextResponse.json({error: 'Unauthorized'}, {status: 401});
        }

        const {data: caller} = await client
            .from('profiles')
            .select('role, tenant_id')
            .eq('id', session.user.id)
            .single();

        if (!caller || !isAdminRole(caller.role)) {
            return NextResponse.json({error: 'Forbidden'}, {status: 403});
        }

        const {data: invitations, error} = await client
            .from('tenant_invitations')
            .select('id, email, role, status, created_at, expires_at')
            .eq('tenant_id', caller.tenant_id)
            .order('created_at', {ascending: false});

        if (error) throw error;

        return NextResponse.json({data: invitations});
    } catch (error: any) {
        console.error('[Admin Invite GET]:', error);
        return NextResponse.json({error: error.message || 'Internal error'}, {status: 500});
    }
}

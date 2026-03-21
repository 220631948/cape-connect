/**
 * @file src/app/api/invitations/decline/route.ts
 * @description Decline an invitation.
 */

import {NextRequest, NextResponse} from 'next/server';
import {type CookieOptions, createServerClient} from '@supabase/auth-helpers-nextjs';
import {validateBody} from '@/lib/validation';
import {declineInvitationSchema} from '@/lib/validation/schemas/invitations';

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

export async function POST(request: NextRequest) {
    try {
        const {client} = createClient(request);
        const {data: {session}} = await client.auth.getSession();

        if (!session) {
            return NextResponse.json({error: 'Unauthorized'}, {status: 401});
        }

        const validation = await validateBody(request, declineInvitationSchema);
        if (!validation.success) {
            return validation.response;
        }
        const {invitationId} = validation.data;

        // 1. Mark invitation as declined
        const {error: updateInviteError} = await client
            .from('tenant_invitations')
            .update({status: 'declined'})
            .eq('id', invitationId)
            .eq('email', session.user.email);

        if (updateInviteError) throw updateInviteError;

        return NextResponse.json({success: true, message: 'Invitation declined'});
    } catch (error: any) {
        console.error('[Invitation Decline POST]:', error);
        return NextResponse.json({error: error.message || 'Internal error'}, {status: 500});
    }
}

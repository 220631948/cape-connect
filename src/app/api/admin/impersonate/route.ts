/**
 * @file src/app/api/admin/impersonate/route.ts
 * @description Starts a short-lived, audited impersonation session for admins.
 *
 * POPIA ANNOTATION
 * Personal data handled: user identifiers, role metadata, IP address, reason text
 * Purpose: break-glass support and tenant-scoped administrative assistance
 * Lawful basis: legitimate interests
 * Retention: audit + session lifecycle retention policy
 * Subject rights: access ✓ | correction ✓ | deletion ✓ | objection ✓
 */

import {NextRequest, NextResponse} from 'next/server';
import {
    copyAuthCookies,
    createAdminRouteClient,
    getProfileByUserId,
    getRequestMetadata,
    insertAuditEvent,
    requireAuthenticatedSession,
    resolveActiveImpersonation,
    resolveAdminActor,
    setImpersonationCookie,
    verifyReauthentication,
} from '@/lib/auth/admin-session';
import {issueImpersonationToken} from '@/lib/auth/impersonation-token';
import {isStartImpersonationRateLimited} from '@/lib/auth/impersonation-rate-limit';
import {canImpersonate, normalizeRole} from '@/lib/auth/roles';
import {validateBody} from '@/lib/validation';
import {impersonateSchema} from '@/lib/validation/schemas/admin';

export async function POST(request: NextRequest) {
    try {
        const validation = await validateBody(request, impersonateSchema);
        if (!validation.success) {
            return validation.response;
        }
        const {
            target_user_id: targetUserId,
            reason,
            current_password: currentPassword,
            mfa_code: mfaCode,
            duration_seconds: durationSeconds
        } = validation.data;

        const {client, response: authResponse} = createAdminRouteClient(request);
        const metadata = getRequestMetadata(request);

        const session = await requireAuthenticatedSession(client);
        if (!session) {
            return NextResponse.json({error: 'Unauthorized'}, {status: 401});
        }

        const rateLimitKey = `${session.user.id}:${metadata.ipAddress ?? 'unknown'}`;
        if (isStartImpersonationRateLimited(rateLimitKey)) {
            return NextResponse.json(
                {error: 'Too many impersonation attempts. Try again shortly.'},
                {status: 429, headers: {'Retry-After': '60'}}
            );
        }

        const existingImpersonation = await resolveActiveImpersonation(client, request);
        if (existingImpersonation) {
            return NextResponse.json(
                {error: 'Already impersonating a user. Stop current session first.'},
                {status: 409}
            );
        }

        const actorResult = await resolveAdminActor(client, session.user.id);
        if (!actorResult.ok) {
            return NextResponse.json({error: actorResult.error}, {status: actorResult.status});
        }

        const reauth = await verifyReauthentication(client, session.user.email, currentPassword, mfaCode);
        if (!reauth.ok) {
            return NextResponse.json({error: reauth.error}, {status: 401});
        }

        const targetProfile = await getProfileByUserId(client, targetUserId);
        if (!targetProfile) {
            return NextResponse.json({error: 'Target user not found'}, {status: 404});
        }

        const decision = canImpersonate(actorResult.profile, targetProfile);
        if (!decision.allowed) {
            return NextResponse.json({error: decision.reason ?? 'Forbidden'}, {status: 403});
        }

        const tokenJti = crypto.randomUUID();
        const issued = await issueImpersonationToken({
            sub: targetProfile.id,
            impersonatedBy: actorResult.profile.id,
            impersonatorRole: normalizeRole(actorResult.profile.role),
            tenantId: targetProfile.tenant_id,
            jti: tokenJti,
            ttlSeconds: durationSeconds,
        });

        const auditId = await insertAuditEvent(client, {
            tenantId: targetProfile.tenant_id,
            actorUserId: actorResult.profile.id,
            eventType: 'impersonation_started',
            details: {
                original_user_id: targetProfile.id,
                impersonator_id: actorResult.profile.id,
                impersonator_role: normalizeRole(actorResult.profile.role),
                tenant_id: targetProfile.tenant_id,
                request_id: metadata.requestId,
                reason: reason ?? null,
                token_exp: issued.claims.exp,
            },
            ipAddress: metadata.ipAddress,
        });

        const {error: sessionInsertError} = await client.from('impersonation_sessions').insert({
            impersonator_id: actorResult.profile.id,
            target_user_id: targetProfile.id,
            tenant_id: targetProfile.tenant_id,
            impersonator_role: normalizeRole(actorResult.profile.role),
            reason: reason ?? null,
            audit_id: auditId,
            token_jti: tokenJti,
            request_id: metadata.requestId,
            ip_address: metadata.ipAddress,
            expires_at: new Date(issued.claims.exp * 1000).toISOString(),
            active: true,
        });

        if (sessionInsertError) {
            return NextResponse.json(
                {error: sessionInsertError.message || 'Failed to create impersonation session'},
                {status: 500}
            );
        }

        const jsonResponse = NextResponse.json({
            impersonation_token: issued.token,
            expires_in: issued.expiresIn,
            audit_id: auditId,
            impersonation: {
                target_user_id: targetProfile.id,
                target_name: targetProfile.full_name,
                target_email: targetProfile.email,
                tenant_id: targetProfile.tenant_id,
            },
        });

        copyAuthCookies(authResponse, jsonResponse);
        setImpersonationCookie(jsonResponse, issued.token, issued.claims.exp);
        return jsonResponse;
    } catch (error: any) {
        console.error('[Admin Impersonate POST]:', error);
        return NextResponse.json({error: error?.message || 'Internal error'}, {status: 500});
    }
}

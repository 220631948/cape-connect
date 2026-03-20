/**
 * @file src/app/api/admin/stop-impersonation/route.ts
 * @description Ends an active impersonation session and restores normal admin context.
 *
 * POPIA ANNOTATION
 * Personal data handled: user identifiers, role metadata, IP address
 * Purpose: secure termination and auditing of delegated admin sessions
 * Lawful basis: legitimate interests
 * Retention: audit + session lifecycle retention policy
 * Subject rights: access ✓ | correction ✓ | deletion ✓ | objection ✓
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  clearImpersonationCookie,
  copyAuthCookies,
  createAdminRouteClient,
  getRequestMetadata,
  insertAuditEvent,
  resolveActiveImpersonation,
} from '@/lib/auth/admin-session';
import { isStopImpersonationRateLimited } from '@/lib/auth/impersonation-rate-limit';

export async function POST(request: NextRequest) {
  try {
    const { client, response: authResponse } = createAdminRouteClient(request);
    const metadata = getRequestMetadata(request);

    const activeImpersonation = await resolveActiveImpersonation(client, request);
    if (!activeImpersonation) {
      return NextResponse.json({ error: 'No active impersonation session' }, { status: 404 });
    }

    const rateLimitKey = `${activeImpersonation.impersonatorId}:${metadata.ipAddress ?? 'unknown'}`;
    if (isStopImpersonationRateLimited(rateLimitKey)) {
      return NextResponse.json(
        { error: 'Too many stop requests. Try again shortly.' },
        { status: 429, headers: { 'Retry-After': '60' } }
      );
    }

    const { error: updateError } = await client
      .from('impersonation_sessions')
      .update({
        active: false,
        ended_at: new Date().toISOString(),
      })
      .eq('id', activeImpersonation.sessionId)
      .eq('active', true);

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message || 'Failed to close impersonation session' },
        { status: 500 }
      );
    }

    await insertAuditEvent(client, {
      tenantId: activeImpersonation.target.tenant_id,
      actorUserId: activeImpersonation.impersonatorId,
      eventType: 'impersonation_ended',
      details: {
        original_user_id: activeImpersonation.target.id,
        impersonator_id: activeImpersonation.impersonatorId,
        impersonator_role: activeImpersonation.impersonatorRole,
        tenant_id: activeImpersonation.target.tenant_id,
        request_id: metadata.requestId,
      },
      ipAddress: metadata.ipAddress,
    });

    // Rotate/refresh session identifier after privileged context change.
    await client.auth.refreshSession();

    const jsonResponse = NextResponse.json({ success: true });
    copyAuthCookies(authResponse, jsonResponse);
    clearImpersonationCookie(jsonResponse);
    return jsonResponse;
  } catch (error: any) {
    console.error('[Admin Stop Impersonation POST]:', error);
    return NextResponse.json({ error: error?.message || 'Internal error' }, { status: 500 });
  }
}

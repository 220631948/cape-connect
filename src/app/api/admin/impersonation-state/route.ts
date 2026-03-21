/**
 * @file src/app/api/admin/impersonation-state/route.ts
 * @description Returns active impersonation context for UI/middleware consumers.
 *
 * POPIA ANNOTATION
 * Personal data handled: user identifiers, names, emails, role metadata
 * Purpose: transparent display of active administrative impersonation context
 * Lawful basis: legitimate interests
 * Retention: request-scoped response payload; persistent records remain in audit/session tables
 * Subject rights: access ✓ | correction ✓ | deletion ✓ | objection ✓
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  copyAuthCookies,
  createAdminRouteClient,
  getProfileByUserId,
  requireAuthenticatedSession,
  resolveActiveImpersonation,
} from '@/lib/auth/admin-session';

export async function GET(request: NextRequest) {
  try {
    const { client, response: authResponse } = createAdminRouteClient(request);
    const session = await requireAuthenticatedSession(client);

    if (!session) {
      return NextResponse.json(
        { is_impersonating: false, current_user_id: null },
        { headers: { 'Cache-Control': 'no-store' } }
      );
    }

    const activeImpersonation = await resolveActiveImpersonation(client, request);
    if (!activeImpersonation) {
      const jsonResponse = NextResponse.json(
        { is_impersonating: false, current_user_id: session.user.id },
        { headers: { 'Cache-Control': 'no-store' } }
      );
      copyAuthCookies(authResponse, jsonResponse);
      return jsonResponse;
    }

    const impersonator = await getProfileByUserId(client, activeImpersonation.impersonatorId);

    const jsonResponse = NextResponse.json(
      {
        is_impersonating: true,
        current_user_id: session.user.id,
        session_id: activeImpersonation.sessionId,
        started_at: activeImpersonation.startedAt,
        expires_at: activeImpersonation.expiresAt,
        target_user: {
          id: activeImpersonation.target.id,
          name: activeImpersonation.target.full_name,
          email: activeImpersonation.target.email,
          role: activeImpersonation.target.role,
          tenant_id: activeImpersonation.target.tenant_id,
        },
        impersonator: {
          id: activeImpersonation.impersonatorId,
          role: activeImpersonation.impersonatorRole,
          name: impersonator?.full_name ?? null,
          email: impersonator?.email ?? null,
        },
      },
      { headers: { 'Cache-Control': 'no-store' } }
    );

    copyAuthCookies(authResponse, jsonResponse);
    return jsonResponse;
  } catch (error: unknown) {
    console.error('[Admin Impersonation State GET]:', error);
    const message = error instanceof Error ? error.message : 'Internal error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

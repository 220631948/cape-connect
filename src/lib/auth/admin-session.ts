/**
 * @file src/lib/auth/admin-session.ts
 * @description Shared admin/auth helpers for secure impersonation routes.
 *
 * POPIA ANNOTATION
 * Personal data handled: user identifiers, role metadata, tenant identifiers, IP metadata
 * Purpose: RBAC enforcement, impersonation lifecycle controls, and audit trails
 * Lawful basis: legitimate interests
 * Retention: request-scoped (except records inserted into audit/session tables)
 * Subject rights: access ✓ | correction ✓ | deletion ✓ | objection ✓
 */

import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';
import { type ImpersonationTokenClaims, verifyImpersonationToken } from './impersonation-token';
import { type RoleProfile, isAdminRole } from './roles';

export interface ProfileRow extends RoleProfile {
  email: string | null;
  full_name: string | null;
}

export interface RequestMetadata {
  ipAddress: string | null;
  requestId: string;
}

export interface ActiveImpersonationContext {
  claims: ImpersonationTokenClaims;
  sessionId: string;
  target: ProfileRow;
  startedAt: string;
  expiresAt: string;
  impersonatorId: string;
  impersonatorRole: string;
}

export function createAdminRouteClient(request: NextRequest) {
  const response = NextResponse.next();

  const client = createServerClient(
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
  );

  return { client, response };
}

export function getRequestMetadata(request: NextRequest): RequestMetadata {
  const requestId =
    request.headers.get('x-request-id') ||
    request.headers.get('x-vercel-id') ||
    crypto.randomUUID();

  const ipAddress =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    null;

  return { requestId, ipAddress };
}

export async function getProfileByUserId(client: any, userId: string): Promise<ProfileRow | null> {
  const { data, error } = await client
    .from('profiles')
    .select('id, tenant_id, role, email, full_name')
    .eq('id', userId)
    .single();

  if (error || !data) return null;
  return data as ProfileRow;
}

export async function requireAuthenticatedSession(client: any) {
  const {
    data: { session },
  } = await client.auth.getSession();

  return session ?? null;
}

export function extractImpersonationToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice('Bearer '.length).trim();
  }

  return request.cookies.get('capegis_impersonation')?.value ?? null;
}

export async function resolveActiveImpersonation(
  client: any,
  request: NextRequest
): Promise<ActiveImpersonationContext | null> {
  const token = extractImpersonationToken(request);
  if (!token) return null;

  try {
    const claims = await verifyImpersonationToken(token);
    const { data: sessionRow, error: sessionError } = await client
      .from('impersonation_sessions')
      .select(
        'id, token_jti, active, started_at, expires_at, target_user_id, impersonator_id, impersonator_role'
      )
      .eq('token_jti', claims.jti)
      .eq('active', true)
      .single();

    if (sessionError || !sessionRow) return null;

    const expiresAt = new Date(sessionRow.expires_at);
    if (Number.isNaN(expiresAt.getTime()) || expiresAt.getTime() <= Date.now()) {
      return null;
    }

    const target = await getProfileByUserId(client, sessionRow.target_user_id);
    if (!target) return null;

    if (target.id !== claims.sub || target.tenant_id !== claims.tenant_id) {
      return null;
    }

    return {
      claims,
      sessionId: sessionRow.id,
      target,
      startedAt: sessionRow.started_at,
      expiresAt: sessionRow.expires_at,
      impersonatorId: sessionRow.impersonator_id,
      impersonatorRole: sessionRow.impersonator_role,
    };
  } catch {
    return null;
  }
}

export async function verifyReauthentication(
  client: any,
  userEmail: string | null | undefined,
  currentPassword: string | null | undefined,
  mfaCode?: string
): Promise<{ ok: boolean; error?: string }> {
  if (!userEmail) return { ok: false, error: 'Unable to resolve current user email' };
  if (!currentPassword) return { ok: false, error: 'Current password is required' };

  const signInResult = await client.auth.signInWithPassword({
    email: userEmail,
    password: currentPassword,
  });

  if (signInResult.error) {
    return { ok: false, error: 'Reauthentication failed' };
  }

  const mfaApi = (client.auth as any).mfa;
  if (!mfaApi?.listFactors) return { ok: true };

  const factorsResult = await mfaApi.listFactors();
  const factors = [
    ...(factorsResult?.data?.totp ?? []),
    ...(factorsResult?.data?.phone ?? []),
  ].filter((factor: any) => factor.status === 'verified');

  if (factors.length === 0) return { ok: true };
  if (!mfaCode) return { ok: false, error: 'MFA code is required' };

  if (typeof mfaApi.challengeAndVerify === 'function') {
    const verifyResult = await mfaApi.challengeAndVerify({
      factorId: factors[0].id,
      code: mfaCode,
    });
    if (verifyResult?.error) {
      return { ok: false, error: 'MFA verification failed' };
    }
  }

  return { ok: true };
}

export async function insertAuditEvent(
  client: any,
  params: {
    tenantId: string;
    actorUserId: string;
    eventType: string;
    details: Record<string, unknown>;
    ipAddress?: string | null;
  }
): Promise<string | null> {
  const { data, error } = await client
    .from('audit_log')
    .insert({
      tenant_id: params.tenantId,
      user_id: params.actorUserId,
      event_type: params.eventType,
      details: params.details,
      ip_address: params.ipAddress ?? null,
    })
    .select('id')
    .single();

  if (error || !data) return null;
  return data.id as string;
}

export function setImpersonationCookie(response: NextResponse, token: string, expiresAtUnix: number) {
  const maxAge = Math.max(expiresAtUnix - Math.floor(Date.now() / 1000), 1);

  response.cookies.set({
    name: 'capegis_impersonation',
    value: token,
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge,
  });
}

export function clearImpersonationCookie(response: NextResponse) {
  response.cookies.set({
    name: 'capegis_impersonation',
    value: '',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  });
}

export function copyAuthCookies(source: NextResponse, target: NextResponse) {
  source.cookies.getAll().forEach((cookie) => {
    target.cookies.set(cookie);
  });
}

export async function resolveAdminActor(client: any, sessionUserId: string) {
  const profile = await getProfileByUserId(client, sessionUserId);
  if (!profile) return { ok: false as const, status: 403, error: 'Profile not found' };
  if (!isAdminRole(profile.role)) {
    return { ok: false as const, status: 403, error: 'Forbidden: admin role required' };
  }
  return { ok: true as const, profile };
}

export async function logImpersonationActionIfNeeded(
  client: any,
  request: NextRequest,
  params: {
    action: string;
    tenantId: string;
    requestId: string;
    ipAddress?: string | null;
    extra?: Record<string, unknown>;
  }
) {
  const impersonation = await resolveActiveImpersonation(client, request);
  if (!impersonation) return;

  await insertAuditEvent(client, {
    tenantId: params.tenantId,
    actorUserId: impersonation.impersonatorId,
    eventType: 'impersonation_action',
    details: {
      action: params.action,
      original_user_id: impersonation.target.id,
      impersonator_id: impersonation.impersonatorId,
      impersonator_role: impersonation.impersonatorRole,
      tenant_id: params.tenantId,
      request_id: params.requestId,
      path: request.nextUrl.pathname,
      method: request.method,
      ...params.extra,
    },
    ipAddress: params.ipAddress,
  });
}

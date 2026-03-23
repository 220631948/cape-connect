/**
 * @file src/lib/auth/impersonation-token.ts
 * @description Minimal HS256 JWT utilities for impersonation sessions.
 *
 * POPIA ANNOTATION
 * Personal data handled: user identifiers in signed token claims
 * Purpose: short-lived delegated identity for audited admin impersonation
 * Lawful basis: legitimate interests
 * Retention: token TTL (default 15 minutes)
 * Subject rights: access ✓ | correction ✓ | deletion ✓ | objection ✓
 */

const IMPERSONATION_ALG = 'HS256';
const DEFAULT_TTL_SECONDS = 60 * 15;

export interface ImpersonationTokenClaims {
  sub: string;
  impersonated_by: string;
  impersonator_role: string;
  is_impersonation: true;
  tenant_id: string;
  jti: string;
  iat: number;
  exp: number;
}

interface IssueInput {
  sub: string;
  impersonatedBy: string;
  impersonatorRole: string;
  tenantId: string;
  jti: string;
  ttlSeconds?: number;
}

interface JwtHeader {
  alg: string;
  typ: 'JWT';
}

function getSecret(): string {
  const secret = process.env.IMPERSONATION_JWT_SECRET;
  if (secret) return secret;
  if (process.env.NODE_ENV === 'test') return 'test-impersonation-secret-only';
  throw new Error('IMPERSONATION_JWT_SECRET is required');
}

function utf8Encode(value: string): Uint8Array {
  return new TextEncoder().encode(value);
}

function utf8Decode(bytes: Uint8Array): string {
  return new TextDecoder().decode(bytes);
}

function toBase64Url(bytes: Uint8Array): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(bytes).toString('base64url');
  }

  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function fromBase64Url(value: string): Uint8Array {
  if (typeof Buffer !== 'undefined') {
    return new Uint8Array(Buffer.from(value, 'base64url'));
  }

  const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64 + '='.repeat((4 - (base64.length % 4 || 4)) % 4);

  // Modern browsers and JS environments (like Edge runtime)
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
  if (typeof (Uint8Array as any).fromBase64 === 'function') {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-explicit-any
    return (Uint8Array as any).fromBase64(padded) as Uint8Array;
  }

  // Fallback for older environments without Buffer or Uint8Array.fromBase64
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function signHmacSha256(payload: string, secret: string): Promise<Uint8Array> {
  const encoder = new TextEncoder();
  const secretBytes = encoder.encode(secret);
  const payloadBytes = encoder.encode(payload);

  const key = await crypto.subtle.importKey(
    'raw',
    secretBytes,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', key, payloadBytes);
  return new Uint8Array(signature);
}

function constantTimeEquals(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;

  let result = 0;
  for (let i = 0; i < a.length; i += 1) {
    result |= a[i] ^ b[i];
  }
  return result === 0;
}

function parsePayload(token: string): Record<string, unknown> {
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('Invalid impersonation token format');
  }

  const payloadJson = utf8Decode(fromBase64Url(parts[1]));
  return JSON.parse(payloadJson) as Record<string, unknown>;
}

function asClaims(payload: Record<string, unknown>): ImpersonationTokenClaims {
  const claims = payload as Partial<ImpersonationTokenClaims>;
  const requiredStrings: Array<keyof ImpersonationTokenClaims> = [
    'sub',
    'impersonated_by',
    'impersonator_role',
    'tenant_id',
    'jti',
  ];

  for (const key of requiredStrings) {
    if (typeof claims[key] !== 'string' || !claims[key]) {
      throw new Error(`Invalid impersonation claim: ${key}`);
    }
  }

  if (claims.is_impersonation !== true) {
    throw new Error('Invalid impersonation claim: is_impersonation');
  }

  if (typeof claims.iat !== 'number' || typeof claims.exp !== 'number') {
    throw new Error('Invalid impersonation claim timestamps');
  }

  return claims as ImpersonationTokenClaims;
}

export async function issueImpersonationToken(input: IssueInput): Promise<{
  token: string;
  expiresIn: number;
  claims: ImpersonationTokenClaims;
}> {
  const ttl = input.ttlSeconds ?? DEFAULT_TTL_SECONDS;
  const now = Math.floor(Date.now() / 1000);

  const header: JwtHeader = { alg: IMPERSONATION_ALG, typ: 'JWT' };
  const claims: ImpersonationTokenClaims = {
    sub: input.sub,
    impersonated_by: input.impersonatedBy,
    impersonator_role: input.impersonatorRole,
    is_impersonation: true,
    tenant_id: input.tenantId,
    jti: input.jti,
    iat: now,
    exp: now + ttl,
  };

  const encodedHeader = toBase64Url(utf8Encode(JSON.stringify(header)));
  const encodedPayload = toBase64Url(utf8Encode(JSON.stringify(claims)));
  const signingInput = `${encodedHeader}.${encodedPayload}`;
  const signature = await signHmacSha256(signingInput, getSecret());

  return {
    token: `${signingInput}.${toBase64Url(signature)}`,
    expiresIn: ttl,
    claims,
  };
}

export async function verifyImpersonationToken(token: string): Promise<ImpersonationTokenClaims> {
  const [encodedHeader, encodedPayload, encodedSignature] = token.split('.');
  if (!encodedHeader || !encodedPayload || !encodedSignature) {
    throw new Error('Invalid impersonation token format');
  }

  const header = JSON.parse(utf8Decode(fromBase64Url(encodedHeader))) as JwtHeader;
  if (header.alg !== IMPERSONATION_ALG || header.typ !== 'JWT') {
    throw new Error('Invalid impersonation token header');
  }

  const signingInput = `${encodedHeader}.${encodedPayload}`;
  const expectedSignature = await signHmacSha256(signingInput, getSecret());
  const receivedSignature = fromBase64Url(encodedSignature);

  if (!constantTimeEquals(expectedSignature, receivedSignature)) {
    throw new Error('Invalid impersonation token signature');
  }

  const claims = asClaims(parsePayload(token));
  const now = Math.floor(Date.now() / 1000);

  if (claims.exp <= now) {
    throw new Error('Impersonation token expired');
  }

  return claims;
}

export function decodeImpersonationTokenUnsafe(token: string): ImpersonationTokenClaims {
  return asClaims(parsePayload(token));
}

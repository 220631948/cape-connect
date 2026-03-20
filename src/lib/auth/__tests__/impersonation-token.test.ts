import { describe, expect, it } from 'vitest';
import {
  decodeImpersonationTokenUnsafe,
  issueImpersonationToken,
  verifyImpersonationToken,
} from '../impersonation-token';

describe('impersonation-token', () => {
  it('issues and verifies token with required claims', async () => {
    const { token, claims } = await issueImpersonationToken({
      sub: 'target-user',
      impersonatedBy: 'admin-user',
      impersonatorRole: 'TENANT_ADMIN',
      tenantId: 'tenant-1',
      jti: 'session-1',
      ttlSeconds: 120,
    });

    const decoded = decodeImpersonationTokenUnsafe(token);
    expect(decoded.sub).toBe('target-user');
    expect(decoded.impersonated_by).toBe('admin-user');
    expect(decoded.is_impersonation).toBe(true);

    const verified = await verifyImpersonationToken(token);
    expect(verified.sub).toBe(claims.sub);
    expect(verified.tenant_id).toBe(claims.tenant_id);
    expect(verified.jti).toBe(claims.jti);
  });

  it('rejects expired token', async () => {
    const { token } = await issueImpersonationToken({
      sub: 'target-user',
      impersonatedBy: 'admin-user',
      impersonatorRole: 'TENANT_ADMIN',
      tenantId: 'tenant-1',
      jti: 'expired-session',
      ttlSeconds: -1,
    });

    await expect(verifyImpersonationToken(token)).rejects.toThrow('expired');
  });

  it('rejects tampered token signature', async () => {
    const { token } = await issueImpersonationToken({
      sub: 'target-user',
      impersonatedBy: 'admin-user',
      impersonatorRole: 'TENANT_ADMIN',
      tenantId: 'tenant-1',
      jti: 'session-2',
      ttlSeconds: 120,
    });

    const [header, payload] = token.split('.');
    const tampered = `${header}.${payload}.invalid-signature`;
    await expect(verifyImpersonationToken(tampered)).rejects.toThrow('signature');
  });
});

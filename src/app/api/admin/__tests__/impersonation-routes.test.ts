import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextResponse } from 'next/server';

const mockSession = {
  user: {
    id: 'admin-user',
    email: 'admin@example.com',
  },
};

const mockClient = {
  from: vi.fn(),
  auth: {
    refreshSession: vi.fn().mockResolvedValue({ data: {}, error: null }),
  },
};

const mocks = vi.hoisted(() => ({
  createAdminRouteClient: vi.fn(),
  requireAuthenticatedSession: vi.fn(),
  resolveAdminActor: vi.fn(),
  resolveActiveImpersonation: vi.fn(),
  verifyReauthentication: vi.fn(),
  getProfileByUserId: vi.fn(),
  getRequestMetadata: vi.fn(),
  insertAuditEvent: vi.fn(),
  copyAuthCookies: vi.fn(),
  setImpersonationCookie: vi.fn(),
  clearImpersonationCookie: vi.fn(),
  issueImpersonationToken: vi.fn(),
  canImpersonate: vi.fn(),
  isStartImpersonationRateLimited: vi.fn(),
  isStopImpersonationRateLimited: vi.fn(),
}));

vi.mock('@/lib/auth/admin-session', () => ({
  createAdminRouteClient: mocks.createAdminRouteClient,
  requireAuthenticatedSession: mocks.requireAuthenticatedSession,
  resolveAdminActor: mocks.resolveAdminActor,
  resolveActiveImpersonation: mocks.resolveActiveImpersonation,
  verifyReauthentication: mocks.verifyReauthentication,
  getProfileByUserId: mocks.getProfileByUserId,
  getRequestMetadata: mocks.getRequestMetadata,
  insertAuditEvent: mocks.insertAuditEvent,
  copyAuthCookies: mocks.copyAuthCookies,
  setImpersonationCookie: mocks.setImpersonationCookie,
  clearImpersonationCookie: mocks.clearImpersonationCookie,
}));

vi.mock('@/lib/auth/impersonation-token', () => ({
  issueImpersonationToken: mocks.issueImpersonationToken,
}));

vi.mock('@/lib/auth/roles', () => ({
  canImpersonate: mocks.canImpersonate,
  normalizeRole: (role: string) => role,
}));

vi.mock('@/lib/auth/impersonation-rate-limit', () => ({
  isStartImpersonationRateLimited: mocks.isStartImpersonationRateLimited,
  isStopImpersonationRateLimited: mocks.isStopImpersonationRateLimited,
}));

describe('admin impersonation routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mocks.createAdminRouteClient.mockReturnValue({
      client: mockClient,
      response: NextResponse.next(),
    });
    mocks.requireAuthenticatedSession.mockResolvedValue(mockSession);
    mocks.resolveAdminActor.mockResolvedValue({
      ok: true,
      profile: { id: 'admin-user', tenant_id: 'tenant-1', role: 'TENANT_ADMIN' },
    });
    mocks.resolveActiveImpersonation.mockResolvedValue(null);
    mocks.verifyReauthentication.mockResolvedValue({ ok: true });
    mocks.getProfileByUserId.mockResolvedValue({
      id: 'target-user',
      tenant_id: 'tenant-1',
      role: 'VIEWER',
      full_name: 'Target User',
      email: 'target@example.com',
    });
    mocks.getRequestMetadata.mockReturnValue({
      requestId: 'req-1',
      ipAddress: '127.0.0.1',
    });
    mocks.insertAuditEvent.mockResolvedValue('audit-1');
    mocks.issueImpersonationToken.mockResolvedValue({
      token: 'mock.token.value',
      expiresIn: 900,
      claims: {
        sub: 'target-user',
        impersonated_by: 'admin-user',
        impersonator_role: 'TENANT_ADMIN',
        is_impersonation: true,
        tenant_id: 'tenant-1',
        jti: 'jti-1',
        iat: 1,
        exp: 9999999999,
      },
    });
    mocks.canImpersonate.mockReturnValue({ allowed: true });
    mocks.isStartImpersonationRateLimited.mockReturnValue(false);
    mocks.isStopImpersonationRateLimited.mockReturnValue(false);

    mockClient.from.mockImplementation((table: string) => {
      if (table === 'impersonation_sessions') {
        return {
          insert: vi.fn().mockResolvedValue({ error: null }),
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ error: null }),
            }),
          }),
        };
      }
      throw new Error(`Unexpected table ${table}`);
    });
  });

  it('starts impersonation successfully', async () => {
    const { POST } = await import('../impersonate/route');
    const request = new Request('http://localhost/api/admin/impersonate', {
      method: 'POST',
      body: JSON.stringify({
        target_user_id: 'target-user',
        current_password: 'secret',
      }),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(request as any);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.impersonation_token).toBe('mock.token.value');
    expect(mocks.setImpersonationCookie).toHaveBeenCalled();
  });

  it('blocks impersonation when authorization fails', async () => {
    mocks.canImpersonate.mockReturnValueOnce({ allowed: false, reason: 'Tenant mismatch' });
    const { POST } = await import('../impersonate/route');
    const request = new Request('http://localhost/api/admin/impersonate', {
      method: 'POST',
      body: JSON.stringify({
        target_user_id: 'target-user',
        current_password: 'secret',
      }),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(request as any);
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.error).toContain('Tenant mismatch');
  });

  it('stops impersonation successfully', async () => {
    mocks.resolveActiveImpersonation.mockResolvedValueOnce({
      sessionId: 'session-1',
      target: { id: 'target-user', tenant_id: 'tenant-1' },
      impersonatorId: 'admin-user',
      impersonatorRole: 'TENANT_ADMIN',
    });

    const { POST } = await import('../stop-impersonation/route');
    const request = new Request('http://localhost/api/admin/stop-impersonation', {
      method: 'POST',
    });

    const response = await POST(request as any);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(mocks.clearImpersonationCookie).toHaveBeenCalled();
  });
});

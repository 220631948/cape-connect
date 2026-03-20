import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextResponse } from 'next/server';

const mocks = vi.hoisted(() => ({
  createAdminRouteClient: vi.fn(),
  requireAuthenticatedSession: vi.fn(),
  getRequestMetadata: vi.fn(),
  logImpersonationActionIfNeeded: vi.fn(),
  isAdminRole: vi.fn(),
  isPlatformAdmin: vi.fn(),
  normalizeRole: vi.fn(),
}));

vi.mock('@/lib/auth/admin-session', () => ({
  createAdminRouteClient: mocks.createAdminRouteClient,
  requireAuthenticatedSession: mocks.requireAuthenticatedSession,
  getRequestMetadata: mocks.getRequestMetadata,
  logImpersonationActionIfNeeded: mocks.logImpersonationActionIfNeeded,
}));

vi.mock('@/lib/auth/roles', () => ({
  isAdminRole: mocks.isAdminRole,
  isPlatformAdmin: mocks.isPlatformAdmin,
  normalizeRole: mocks.normalizeRole,
}));

describe('/api/admin/users PATCH', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    const profileSingle = vi
      .fn()
      .mockResolvedValueOnce({
        data: { id: 'admin-user', role: 'TENANT_ADMIN', tenant_id: 'tenant-1' },
      })
      .mockResolvedValueOnce({
        data: { id: 'target-user', tenant_id: 'tenant-1' },
      });

    const client = {
      from: vi.fn().mockImplementation((table: string) => {
        if (table !== 'profiles') throw new Error(`Unexpected table ${table}`);
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: profileSingle,
            }),
            order: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: [{ id: 'user-1', role: 'VIEWER' }],
                error: null,
              }),
            }),
          }),
        };
      }),
      rpc: vi.fn().mockResolvedValue({ error: null }),
    };

    mocks.createAdminRouteClient.mockReturnValue({ client, response: NextResponse.next() });
    mocks.requireAuthenticatedSession.mockResolvedValue({
      user: { id: 'admin-user', email: 'admin@example.com' },
    });
    mocks.getRequestMetadata.mockReturnValue({ requestId: 'req-1', ipAddress: '127.0.0.1' });
    mocks.isAdminRole.mockReturnValue(true);
    mocks.isPlatformAdmin.mockReturnValue(false);
    mocks.normalizeRole.mockImplementation((value: string) => value);
  });

  it('logs impersonation_action for important role changes', async () => {
    const { PATCH } = await import('../users/route');
    const request = new Request('http://localhost/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: 'target-user', role: 'viewer' }),
    });

    const response = await PATCH(request as any);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(mocks.logImpersonationActionIfNeeded).toHaveBeenCalledOnce();
  });
});

import { describe, expect, vi, beforeEach } from 'vitest';
import { test, fc } from '@fast-check/vitest';
import { PATCH } from '../../app/api/admin/users/route';
import { NextRequest } from 'next/server';
import { createAdminRouteClient, requireAuthenticatedSession } from '@/lib/auth/admin-session';

vi.mock('@/lib/auth/admin-session', () => ({
  createAdminRouteClient: vi.fn(),
  requireAuthenticatedSession: vi.fn(),
  getRequestMetadata: vi.fn(() => ({ requestId: 'r1', ipAddress: '127.0.0.1' })),
  logImpersonationActionIfNeeded: vi.fn().mockResolvedValue(undefined),
}));

describe('Cross-Tenant PATCH Properties', () => {
  let mockSupabase: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(),
      rpc: vi.fn().mockResolvedValue({ error: null }),
    };
    (createAdminRouteClient as any).mockReturnValue({ client: mockSupabase });
    (requireAuthenticatedSession as any).mockResolvedValue({ user: { id: 'admin1' } });
  });

  const tenantsArb = fc.record({
    callerTenant: fc.uuid(),
    targetTenant: fc.uuid()
  }).filter(({ callerTenant, targetTenant }) => callerTenant !== targetTenant);

  test.prop([tenantsArb], { numRuns: 20 })('returns 403 when TENANT_ADMIN attempts to modify user in another tenant', async ({ callerTenant, targetTenant }) => {
    // Mock caller profile
    mockSupabase.single
      .mockResolvedValueOnce({ data: { id: 'admin1', role: 'TENANT_ADMIN', tenant_id: callerTenant }, error: null }) // caller
      .mockResolvedValueOnce({ data: { id: 'target1', tenant_id: targetTenant }, error: null }); // target user

    const req = new NextRequest('http://localhost/api/admin/users', {
      method: 'PATCH',
      body: JSON.stringify({ userId: 'target1', role: 'viewer' }),
    });

    const res = await PATCH(req);
    const json = await res.json();

    expect(res.status).toBe(403);
    expect(json.error).toBe('Forbidden: tenant mismatch');
  });

  test.prop([tenantsArb], { numRuns: 20 })('allows PLATFORM_ADMIN to modify user in any tenant', async ({ callerTenant, targetTenant }) => {
    // Mock caller profile as PLATFORM_ADMIN
    mockSupabase.single
      .mockResolvedValueOnce({ data: { id: 'admin1', role: 'PLATFORM_ADMIN', tenant_id: callerTenant }, error: null }) // caller
      .mockResolvedValueOnce({ data: { id: 'target1', tenant_id: targetTenant }, error: null }); // target user

    const req = new NextRequest('http://localhost/api/admin/users', {
      method: 'PATCH',
      body: JSON.stringify({ userId: 'target1', role: 'viewer' }),
    });

    const res = await PATCH(req);
    const json = await res.json();

    // Should NOT be 403 mismatch
    expect(res.status).not.toBe(403);
    // It might be 500 or 200 depending on RPC mock, but NOT 403 mismatch
    if (res.status === 200) {
      expect(json.success).toBe(true);
    }
  });
});

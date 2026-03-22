import { describe, it, expect, vi } from 'vitest';
import { test, fc } from '@fast-check/vitest';
import { withTenantContext } from '../../lib/supabase/server';

describe('withTenantContext Properties', () => {
  test.prop([fc.uuid()])('always calls set_tenant_context with the provided UUID', async (tenantId) => {
    const mockRpc = vi.fn().mockResolvedValue({ error: null });
    const mockSupabase = {
      rpc: mockRpc
    } as any;

    await withTenantContext(mockSupabase, tenantId);

    expect(mockRpc).toHaveBeenCalledWith('set_tenant_context', {
      tenant_id: tenantId // Corrected from _tenant_id
    });
  });

  test.prop([fc.string({ minLength: 1 })])('calls RPC with any non-empty string tenantId', async (tenantId) => {
    const mockRpc = vi.fn().mockResolvedValue({ error: null });
    const mockSupabase = { rpc: mockRpc } as any;

    await withTenantContext(mockSupabase, tenantId);
    expect(mockRpc).toHaveBeenCalledWith('set_tenant_context', { tenant_id: tenantId });
  });

  it('throws when tenantId is empty', async () => {
    const mockRpc = vi.fn();
    const mockSupabase = { rpc: mockRpc } as any;
    await expect(withTenantContext(mockSupabase, ''))
      .rejects.toThrow('withTenantContext: tenantId is required');
  });

  it('throws verbose error when RPC returns error', async () => {
    const mockRpc = vi.fn().mockResolvedValue({ error: { message: 'Database error' } });
    const mockSupabase = { rpc: mockRpc } as any;

    await expect(withTenantContext(mockSupabase, '550e8400-e29b-41d4-a716-446655440000'))
      .rejects.toThrow(/withTenantContext: failed to set tenant context — Database error/);
  });
});

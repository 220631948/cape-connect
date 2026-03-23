import { describe, it, expect, vi } from 'vitest';
import { withTenantContext } from '../../lib/supabase/server';

describe('withTenantContext', () => {
  it('calls set_tenant_context RPC with the provided tenantId', async () => {
    const mockRpc = vi.fn().mockResolvedValue({ error: null });
    const mockClient = { rpc: mockRpc };
    const tenantId = 'test-tenant-id';

    await withTenantContext(mockClient as any, tenantId);

    expect(mockRpc).toHaveBeenCalledWith('set_tenant_context', { tenant_id: tenantId });
  });

  it('throws error if tenantId is missing', async () => {
    const mockClient = { rpc: vi.fn() };
    
    await expect(withTenantContext(mockClient as any, null))
      .rejects.toThrow('tenantId is required');
    
    await expect(withTenantContext(mockClient as any, undefined))
      .rejects.toThrow('tenantId is required');
  });

  it('throws error if RPC fails', async () => {
    const mockRpc = vi.fn().mockResolvedValue({ error: { message: 'DB Error' } });
    const mockClient = { rpc: mockRpc };
    const tenantId = 'test-tenant-id';

    await expect(withTenantContext(mockClient as any, tenantId))
      .rejects.toThrow('failed to set tenant context — DB Error');
  });
});

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useSessionRole } from '../../hooks/useSessionRole';
import { createClient } from '@supabase/supabase-js';

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(),
}));

describe('useSessionRole', () => {
  let mockSupabase: any;

  beforeEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://test.com';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key';

    mockSupabase = {
      auth: {
        getUser: vi.fn(),
      },
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(),
    };
    (createClient as any).mockReturnValue(mockSupabase);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('returns GUEST if no user session exists', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });

    const { result } = renderHook(() => useSessionRole());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.role).toBe('GUEST');
    expect(result.current.tenantId).toBe(null);
  });

  it('returns correctly resolved role and tenantId from profiles', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'user-123' } } });
    mockSupabase.from().select().eq().single.mockResolvedValue({
      data: { role: 'TENANT_ADMIN', tenant_id: 'tenant-abc' },
      error: null,
    });

    const { result } = renderHook(() => useSessionRole());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.role).toBe('TENANT_ADMIN');
    expect(result.current.tenantId).toBe('tenant-abc');
  });

  it('defaults to GUEST if profile fetch fails', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'user-123' } } });
    mockSupabase.from().select().eq().single.mockResolvedValue({
      data: null,
      error: { message: 'Not found' },
    });

    const { result } = renderHook(() => useSessionRole());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.role).toBe('GUEST');
  });
});

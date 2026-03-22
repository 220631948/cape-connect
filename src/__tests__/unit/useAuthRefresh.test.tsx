import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAuthRefresh } from '../../hooks/useAuthRefresh';
import { createClient } from '@supabase/supabase-js';

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(),
}));

describe('useAuthRefresh', () => {
  let mockSupabase: any;
  let mockSubscription: any;

  beforeEach(() => {
    vi.useFakeTimers();
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://test.com';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key';

    mockSubscription = { unsubscribe: vi.fn() };
    mockSupabase = {
      auth: {
        onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: mockSubscription } }),
        getSession: vi.fn(),
        refreshSession: vi.fn(),
      },
    };
    (createClient as any).mockReturnValue(mockSupabase);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('sets up interval and auth state change listener on mount', () => {
    renderHook(() => useAuthRefresh());

    expect(createClient).toHaveBeenCalled();
    expect(mockSupabase.auth.onAuthStateChange).toHaveBeenCalled();
  });

  it('proactively refreshes session when near expiry', async () => {
    const expires_at = Math.floor(Date.now() / 1000) + 200; // 200s < 300s threshold
    mockSupabase.auth.getSession.mockResolvedValue({ data: { session: { expires_at } } });
    mockSupabase.auth.refreshSession.mockResolvedValue({ error: null });

    renderHook(() => useAuthRefresh());

    // Faster than REFRESH_CHECK_INTERVAL_MS
    await act(async () => {
      vi.advanceTimersByTime(61000);
    });

    expect(mockSupabase.auth.refreshSession).toHaveBeenCalled();
  });

  it('does not refresh if session is far from expiry', async () => {
    const expires_at = Math.floor(Date.now() / 1000) + 1000; // 1000s > 300s threshold
    mockSupabase.auth.getSession.mockResolvedValue({ data: { session: { expires_at } } });

    renderHook(() => useAuthRefresh());

    await act(async () => {
      vi.advanceTimersByTime(61000);
    });

    expect(mockSupabase.auth.refreshSession).not.toHaveBeenCalled();
  });

  it('shows toast on refresh failure', async () => {
    const expires_at = Math.floor(Date.now() / 1000) + 200;
    mockSupabase.auth.getSession.mockResolvedValue({ data: { session: { expires_at } } });
    mockSupabase.auth.refreshSession.mockResolvedValue({ error: { message: 'Refresh failed' } });

    const appendSpy = vi.spyOn(document.body, 'appendChild');

    renderHook(() => useAuthRefresh());

    await act(async () => {
      vi.advanceTimersByTime(61000);
    });

    expect(appendSpy).toHaveBeenCalled();
    const toast = document.querySelector('[data-testid="auth-refresh-toast"]');
    expect(toast).not.toBeNull();
    expect(toast?.textContent).toBe('Session expired. Please sign in again.');
  });
});

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useInvitations } from '../../hooks/useInvitations';
import React from 'react';

describe('useInvitations', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('fetches invitations on mount', async () => {
    const mockInvitations = [{ id: '1', email: 'test@test.com', role: 'viewer', status: 'pending' }];
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ data: mockInvitations }),
    });

    const { result } = renderHook(() => useInvitations());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.invitations).toEqual(mockInvitations);
  });

  it('retries once after 3s on fetch failure', async () => {
    (global.fetch as any)
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] }),
      });

    renderHook(() => useInvitations());

    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));

    // advanceTimersByTimeAsync handles microtasks and awaits the callback
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3100);
    });

    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(2));
  });

  it('shows error after second failure', async () => {
    (global.fetch as any).mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useInvitations());

    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(3100);
    });

    await waitFor(() => expect(result.current.fetchError).not.toBeNull());
    expect(result.current.fetchError).toBe('Could not load invitations. Check your connection.');
  });

  it('optimistically removes invitation on accept', async () => {
    const mockInvitations = [{ id: '1', email: 'test@test.com', role: 'viewer', status: 'pending' }];
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ data: mockInvitations }),
    });

    const { result } = renderHook(() => useInvitations());
    await waitFor(() => expect(result.current.loading).toBe(false));

    (global.fetch as any).mockResolvedValue({ ok: true, json: async () => ({ data: [] }) });

    await act(async () => {
      result.current.acceptInvitation('1');
    });

    expect(result.current.invitations).toHaveLength(0);
  });
});

import { describe, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { test, fc } from '@fast-check/vitest';
import { useInvitations } from '../../hooks/useInvitations';
import React from 'react';

describe('useInvitations Retry Properties', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  const failureArb = fc.constantFrom(
    { type: 'error', value: new Error('Network error') },
    { type: 'response', value: { ok: false, status: 500, statusText: 'Internal Server Error' } },
    { type: 'response', value: { ok: false, status: 503, statusText: 'Service Unavailable' } }
  );

  test.prop([failureArb], { numRuns: 20 })('retries exactly once for any failure type', async (failure) => {
    const fetchMock = global.fetch as any;
    fetchMock.mockClear();
    
    // First call fails
    if (failure.type === 'error') {
      fetchMock.mockRejectedValueOnce(failure.value);
    } else {
      fetchMock.mockResolvedValueOnce(failure.value);
    }

    // Second call succeeds
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: [] }),
    });

    renderHook(() => useInvitations());

    // Wait for first call
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    // Advance timers to trigger retry
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3100);
    });

    // Verify exactly two calls
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
  });

  test.prop([failureArb], { numRuns: 20 })('shows error after second failure of any type', async (failure) => {
    const fetchMock = global.fetch as any;
    fetchMock.mockClear();
    
    // Both calls fail
    if (failure.type === 'error') {
      fetchMock.mockRejectedValue(failure.value);
    } else {
      fetchMock.mockResolvedValue(failure.value);
    }

    const { result } = renderHook(() => useInvitations());

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(3100);
    });

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(result.current.fetchError).not.toBeNull());
  });
});

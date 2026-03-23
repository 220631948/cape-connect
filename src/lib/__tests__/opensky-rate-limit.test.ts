import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('opensky-rate-limit: syncDailyWindow', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.resetModules();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should not reset state if the UTC day has not changed', async () => {
    // Set the initial time to 12:00 UTC on a specific day
    vi.setSystemTime(new Date('2023-10-10T12:00:00Z'));

    // Dynamically import so the module initializes with the current fake time
    const rateLimit = await import('../opensky-rate-limit');

    // Modify the state
    rateLimit.incrementRequestCount();
    rateLimit.recordRateLimitError();

    let state = rateLimit.getRateLimitState();
    expect(state.requestsToday).toBe(1);
    expect(state.consecutiveErrors).toBe(1);
    expect(state.windowDate).toBe('2023-10-10');

    // Fast forward to later in the same UTC day
    vi.setSystemTime(new Date('2023-10-10T23:59:59Z'));

    // Call syncDailyWindow
    rateLimit.syncDailyWindow();

    // State should remain unchanged
    state = rateLimit.getRateLimitState();
    expect(state.requestsToday).toBe(1);
    expect(state.consecutiveErrors).toBe(1);
    expect(state.windowDate).toBe('2023-10-10');
  });

  it('should completely reset the state if the UTC day has changed', async () => {
    // Set the initial time to 12:00 UTC
    vi.setSystemTime(new Date('2023-10-10T12:00:00Z'));

    const rateLimit = await import('../opensky-rate-limit');

    // Modify the state
    rateLimit.incrementRequestCount();
    rateLimit.recordRateLimitError();

    let state = rateLimit.getRateLimitState();
    expect(state.requestsToday).toBe(1);
    expect(state.consecutiveErrors).toBe(1);

    // Fast forward to the next UTC day
    vi.setSystemTime(new Date('2023-10-11T00:00:01Z'));

    // Call syncDailyWindow
    rateLimit.syncDailyWindow();

    // State should be reset and windowDate updated
    state = rateLimit.getRateLimitState();
    expect(state.requestsToday).toBe(0);
    expect(state.consecutiveErrors).toBe(0);
    expect(state.backoffMs).toBe(0);
    expect(state.backoffUntil).toBe(0);
    expect(state.windowDate).toBe('2023-10-11');
  });
});

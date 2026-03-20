/**
 * @file src/lib/opensky-rate-limit.ts
 * @description In-memory rate-limit state for OpenSky API.
 */

import { RateLimitState } from '@/types/opensky';

const BACKOFF_BASE_MS = 1_000;  // 1 second
const BACKOFF_MAX_MS  = 30_000; // 30 seconds

function todayUTC(): string { return new Date().toISOString().slice(0, 10); }

const _rateLimit: RateLimitState = {
  requestsToday: 0, windowDate: todayUTC(),
  backoffMs: 0, backoffUntil: 0, consecutiveErrors: 0,
};

export function syncDailyWindow(): void {
  const today = todayUTC();
  if (_rateLimit.windowDate !== today) {
    _rateLimit.requestsToday = 0;
    _rateLimit.windowDate = today;
    _rateLimit.consecutiveErrors = 0;
    _rateLimit.backoffMs = 0;
    _rateLimit.backoffUntil = 0;
  }
}

/** Returns a read-only snapshot of the current rate-limit state. */
export function getRateLimitState(): Readonly<RateLimitState> {
  syncDailyWindow();
  return { ..._rateLimit };
}

export function recordSuccess(): void {
  _rateLimit.consecutiveErrors = 0;
  _rateLimit.backoffMs = 0;
  _rateLimit.backoffUntil = 0;
}

export function recordRateLimitError(): void {
  _rateLimit.consecutiveErrors += 1;
  const exp = Math.min(_rateLimit.consecutiveErrors - 1, 5); // 1s → 2s → 4s → … → 30s
  _rateLimit.backoffMs = Math.min(BACKOFF_BASE_MS * Math.pow(2, exp), BACKOFF_MAX_MS);
  _rateLimit.backoffUntil = Date.now() + _rateLimit.backoffMs;
}

export function isBackingOff(): boolean { return _rateLimit.backoffUntil > Date.now(); }

export function incrementRequestCount(): void {
  _rateLimit.requestsToday += 1;
}

export function getRequestsToday(): number {
  return _rateLimit.requestsToday;
}

/**
 * @file src/lib/auth/impersonation-rate-limit.ts
 * @description In-memory rate limiter for high-risk impersonation endpoints.
 */

const WINDOW_MS = 60_000;
const START_LIMIT = 5;
const STOP_LIMIT = 20;

const store = new Map<string, { count: number; resetAt: number }>();

function hit(key: string, limit: number): boolean {
  const now = Date.now();
  const current = store.get(key);

  if (!current || now >= current.resetAt) {
    store.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }

  current.count += 1;
  return current.count > limit;
}

export function isStartImpersonationRateLimited(key: string): boolean {
  return hit(`start:${key}`, START_LIMIT);
}

export function isStopImpersonationRateLimited(key: string): boolean {
  return hit(`stop:${key}`, STOP_LIMIT);
}

'use client';

/**
 * @file src/hooks/useLiveData.ts
 * @description React hook implementing the Three-Tier Fallback pattern for real-time
 *   data with configurable polling. Delegates all cache/fallback logic to the API
 *   route — this hook is a pure client-side polling wrapper.
 *
 * POPIA ANNOTATION
 * Personal data handled: Indirectly — hook fetches data that may include flight callsigns
 *   and aircraft identifiers (MEDIUM risk, handled by upstream API route)
 * Purpose: Client-side polling for real-time data with automatic tier fallback
 * Lawful basis: Legitimate interests (UI responsiveness for airspace visualization)
 * Retention: React state only — no client-side persistence
 * Subject rights: access ✓ | correction ✗ | deletion ✓ (state cleared on unmount) | objection ✓
 * POPIA risk level: LOW (no direct PII handling — delegated to API route)
 * Review date: 2026-06-01
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import type { DataTier } from '@/lib/utils/fallback';

// ---------------------------------------------------------------------------
// Public interfaces
// ---------------------------------------------------------------------------

export interface UseLiveDataOptions<T> {
  /** Source name for SourceBadge (e.g. "OpenSky Network") */
  source: string;
  /** Data year for SourceBadge (e.g. 2026) */
  year: number;
  /** Cache-key endpoint used by the API route (e.g. "/states/all?bbox=cape_town") */
  endpoint: string;
  /** URL of the Next.js API route that owns three-tier fallback logic */
  liveUrl: string;
  /** Path to mock GeoJSON served from /public (e.g. "/mock/flights-cape-town.geojson") */
  mockPath: string;
  /** Polling interval in ms (default: 30 000) */
  pollInterval?: number;
  /** Cache TTL hint forwarded to the API route in hours (default: 0.5 = 30 min) */
  ttlHours?: number;
  /** Whether polling is active (default: true) */
  enabled?: boolean;
  /** Optional client-side transform applied after receiving data from the API route */
  transform?: (raw: unknown) => T;
}

export interface UseLiveDataResult<T> {
  data: T | null;
  tier: DataTier | null;
  source: string;
  year: number;
  isLoading: boolean;
  error: Error | null;
  lastUpdated: Date | null;
}

// ---------------------------------------------------------------------------
// Shape of the JSON envelope the API route must return
// ---------------------------------------------------------------------------

interface ApiRouteEnvelope<T> {
  data: T;
  tier: DataTier;
  source: string;
  year: number;
  timestamp: string;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * useLiveData
 *
 * Polls a Next.js API route that implements Three-Tier Fallback
 * (LIVE → CACHED → MOCK).  The hook itself is transport-only:
 *   - It never touches Supabase or external APIs directly.
 *   - It trusts the API route's `{ data, tier, source, year, timestamp }` envelope.
 *   - It cancels in-flight requests on unmount / option change via AbortController.
 *
 * @example
 * const { data, tier, isLoading } = useLiveData<FlightFeatureCollection>({
 *   source: 'OpenSky Network',
 *   year: 2026,
 *   endpoint: '/states/all?bbox=cape_town',
 *   liveUrl: '/api/flights/live',
 *   mockPath: '/mock/flights-cape-town.geojson',
 *   pollInterval: 30_000,
 * });
 */
export function useLiveData<T>(
  options: UseLiveDataOptions<T>
): UseLiveDataResult<T> {
  const {
    source,
    year,
    endpoint,
    liveUrl,
    mockPath,
    pollInterval = 30_000,
    ttlHours = 0.5,
    enabled = true,
    transform,
  } = options;

  // ------------------------------------------------------------------
  // State
  // ------------------------------------------------------------------
  const [data, setData] = useState<T | null>(null);
  const [tier, setTier] = useState<DataTier | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Stable refs so the fetch callback never captures stale closures
  const abortRef = useRef<AbortController | null>(null);
  const transformRef = useRef(transform);
  transformRef.current = transform;

  // ------------------------------------------------------------------
  // Core fetch function
  // ------------------------------------------------------------------
  const fetchData = useCallback(async () => {
    // Cancel any previous in-flight request before starting a new one
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      // Build the URL — forward hints so the API route can optimise its
      // own cache strategy (endpoint, ttlHours, mockPath are informational).
      const url = new URL(liveUrl, globalThis.location?.origin ?? 'http://localhost');
      url.searchParams.set('endpoint', endpoint);
      url.searchParams.set('mockPath', mockPath);
      url.searchParams.set('ttlHours', String(ttlHours));

      const response = await fetch(url.toString(), {
        // Force a fresh network request — the API route owns revalidation.
        cache: 'no-store',
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(
          `API route responded with ${response.status} ${response.statusText}`
        );
      }

      const envelope = (await response.json()) as ApiRouteEnvelope<unknown>;

      // Optionally transform the raw payload on the client
      const resolved = transformRef.current
        ? transformRef.current(envelope.data)
        : (envelope.data as T);

      setData(resolved);
      setTier(envelope.tier);
      setLastUpdated(new Date(envelope.timestamp));
      setError(null);
    } catch (err) {
      // AbortError is expected on cleanup — do not surface it as an error
      if (err instanceof DOMException && err.name === 'AbortError') return;

      const fetchError =
        err instanceof Error ? err : new Error('Unknown fetch error');
      console.error(`[useLiveData] Fetch failed for source "${source}":`, fetchError);
      setError(fetchError);
    } finally {
      setIsLoading(false);
    }
  }, [liveUrl, endpoint, mockPath, ttlHours, source]);

  // ------------------------------------------------------------------
  // Effect: initial fetch + polling
  // ------------------------------------------------------------------
  useEffect(() => {
    if (!enabled) {
      setIsLoading(false);
      return;
    }

    // Fetch immediately on mount / option change
    setIsLoading(true);
    fetchData();

    // Schedule subsequent polls
    const intervalId = setInterval(() => {
      fetchData();
    }, pollInterval);

    return () => {
      clearInterval(intervalId);
      // Cancel any in-flight request on unmount or before next effect run
      abortRef.current?.abort();
    };
  }, [enabled, fetchData, pollInterval]);

  // ------------------------------------------------------------------
  // Return
  // ------------------------------------------------------------------
  return {
    data,
    tier,
    source,
    year,
    isLoading,
    error,
    lastUpdated,
  };
}

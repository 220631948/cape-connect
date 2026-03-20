/**
 * @file src/lib/opensky-api.ts
 * @description OpenSky Network ADS-B API client for real-time flight tracking
 *   over the Cape Town / Western Cape bounding box.
 *   Server-side only — credentials never reach the browser bundle.
 *
 * POPIA ANNOTATION
 * Personal data handled: Aircraft callsigns (may identify pilot/owner), ICAO24 registration numbers,
 *   flight patterns (may reveal personal movements of private aircraft owners)
 * Purpose: Real-time airspace visualization for urban planning and emergency response context
 * Lawful basis: Legitimate interests (ADS-B is publicly broadcast data; public airspace safety)
 * Retention: Real-time display only; api_cache TTL 30s; no long-term personal data storage
 * Subject rights: access ✓ (via OpenSky Network) | correction ✗ (source data) | deletion ✓ (cache auto-expires) | objection ✓ (guest mode aggregate only)
 * POPIA risk level: MEDIUM (private aircraft patterns can reveal personal movements)
 * Review date: 2026-06-01
 */

import type {
  OpenSkyConfig,
  OpenSkyStatesResponse,
  OpenSkyStateVector,
  FlightTemporalEntry,
} from '@/types/opensky';

import {
  syncDailyWindow,
  recordSuccess,
  recordRateLimitError,
  isBackingOff,
  incrementRequestCount,
  getRequestsToday
} from './opensky-rate-limit';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

export const OPENSKY_CONFIG: OpenSkyConfig = {
  baseUrl: 'https://opensky-network.org/api',
  endpoints: {
    statesAll: '/states/all',
    tracksAll: '/tracks/all',
  },
  rateLimit: {
    anonymous: 100,       // requests per day (unauthenticated)
    authenticated: 4000,  // requests per day (with credentials)
  },
  pollInterval: 10_000,   // 10 seconds between polls
  timeout: 5_000,         // 5-second AbortController timeout
};

/** Cape Town / Western Cape bounding box (EPSG:4326) */
export const CAPE_TOWN_BBOX = {
  lamin: -34.5,
  lamax: -33.0,
  lomin: 18.0,
  lomax: 19.5,
} as const;

// ---------------------------------------------------------------------------
// Typed error classes
// ---------------------------------------------------------------------------

/** Thrown on HTTP 429 or when the local daily cap is reached.
 *  The three-tier fallback catches this to drop straight to CACHED. */
export class RateLimitError extends Error {
  readonly statusCode: number;
  readonly retryAfterMs: number;
  constructor(message: string, statusCode = 429, retryAfterMs = 0) {
    super(message);
    this.name = 'RateLimitError';
    this.statusCode = statusCode;
    this.retryAfterMs = retryAfterMs;
  }
}

/** Thrown when the AbortController cancels the fetch after the timeout. */
export class TimeoutError extends Error {
  constructor(timeoutMs: number) {
    super(`OpenSky request timed out after ${timeoutMs}ms`);
    this.name = 'TimeoutError';
  }
}

// ---------------------------------------------------------------------------
// Authentication helpers (server-side only — NO NEXT_PUBLIC_ prefix)
// ---------------------------------------------------------------------------

/** Returns true when OPENSKY_USERNAME / OPENSKY_PASSWORD are absent. */
export function isAnonymousMode(): boolean {
  return !process.env.OPENSKY_USERNAME || !process.env.OPENSKY_PASSWORD;
}

/**
 * buildAuthHeader — Basic-Auth from server-side env vars.
 * Returns undefined in anonymous mode; callers omit the Authorization header.
 * SECURITY: These env vars must NEVER use the NEXT_PUBLIC_ prefix.
 */
export function buildAuthHeader(): string | undefined {
  const username = process.env.OPENSKY_USERNAME;
  const password = process.env.OPENSKY_PASSWORD;
  if (!username || !password) return undefined;
  const encoded = Buffer.from(`${username}:${password}`).toString('base64');
  return `Basic ${encoded}`;
}

// ---------------------------------------------------------------------------
// Array → named-field mapping (OpenSky returns positional arrays)
// ---------------------------------------------------------------------------

/** Map a raw positional 18-element array to a typed OpenSkyStateVector. */
function mapArrayToStateVector(raw: unknown[]): OpenSkyStateVector {
  return {
    icao24:          (raw[0]  as string)          ?? '',
    callsign:        raw[1] != null ? (raw[1] as string).trim() || null : null,
    origin_country:  (raw[2]  as string)          ?? '',
    time_position:   (raw[3]  as number | null)   ?? null,
    last_contact:    (raw[4]  as number)          ?? 0,
    longitude:       (raw[5]  as number | null)   ?? null,
    latitude:        (raw[6]  as number | null)   ?? null,
    baro_altitude:   (raw[7]  as number | null)   ?? null,
    on_ground:       (raw[8]  as boolean)         ?? false,
    velocity:        (raw[9]  as number | null)   ?? null,
    true_track:      (raw[10] as number | null)   ?? null,
    vertical_rate:   (raw[11] as number | null)   ?? null,
    sensors:         (raw[12] as number[] | null) ?? null,
    geo_altitude:    (raw[13] as number | null)   ?? null,
    squawk:          (raw[14] as string | null)   ?? null,
    spi:             (raw[15] as boolean)         ?? false,
    position_source: (raw[16] as number)          ?? 0,
    category:        (raw[17] as number)          ?? 0,
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * fetchFlightStates — fetches live ADS-B vectors from OpenSky for Cape Town.
 */
export async function fetchFlightStates(): Promise<OpenSkyStatesResponse> {
  syncDailyWindow();

  const dailyCap = isAnonymousMode()
    ? OPENSKY_CONFIG.rateLimit.anonymous
    : OPENSKY_CONFIG.rateLimit.authenticated;

  const requestsToday = getRequestsToday();
  if (requestsToday >= dailyCap) {
    throw new RateLimitError(
      `OpenSky daily cap reached: ${requestsToday}/${dailyCap} requests used today`,
      429
    );
  }

  if (isBackingOff()) {
    throw new RateLimitError(`OpenSky back-off active`, 429);
  }

  const url = new URL(`${OPENSKY_CONFIG.baseUrl}${OPENSKY_CONFIG.endpoints.statesAll}`);
  url.searchParams.set('lamin', String(CAPE_TOWN_BBOX.lamin));
  url.searchParams.set('lamax', String(CAPE_TOWN_BBOX.lamax));
  url.searchParams.set('lomin', String(CAPE_TOWN_BBOX.lomin));
  url.searchParams.set('lomax', String(CAPE_TOWN_BBOX.lomax));

  const controller = new AbortController();
  const timerId = setTimeout(() => controller.abort(), OPENSKY_CONFIG.timeout);

  const headers: Record<string, string> = { 'Accept': 'application/json' };
  const authHeader = buildAuthHeader();
  if (authHeader) headers['Authorization'] = authHeader;

  let response: Response;
  try {
    response = await fetch(url.toString(), { method: 'GET', headers, signal: controller.signal });
  } catch (err: unknown) {
    clearTimeout(timerId);
    if (err instanceof Error && err.name === 'AbortError') throw new TimeoutError(OPENSKY_CONFIG.timeout);
    throw err;
  } finally {
    clearTimeout(timerId);
  }

  if (response.status === 429) {
    recordRateLimitError();
    throw new RateLimitError('OpenSky returned HTTP 429 — Too Many Requests', 429);
  }

  if (!response.ok) {
    throw new Error(`OpenSky API error: HTTP ${response.status} ${response.statusText}`);
  }

  const raw = await response.json() as { time: number; states: unknown[][] | null };
  incrementRequestCount();
  recordSuccess();

  const states: OpenSkyStateVector[] = Array.isArray(raw.states)
    ? raw.states.map(mapArrayToStateVector)
    : [];

  return { time: raw.time, states };
}

/**
 * fetchHistoricalTrack — fetches a full flight track for an aircraft at a specific time.
 */
export async function fetchHistoricalTrack(
  icao24: string,
  time = 0
): Promise<FlightTemporalEntry[]> {
  syncDailyWindow();

  const url = new URL(`${OPENSKY_CONFIG.baseUrl}${OPENSKY_CONFIG.endpoints.tracksAll}`);
  url.searchParams.set('icao24', icao24);
  url.searchParams.set('time', String(time));

  const controller = new AbortController();
  const timerId = setTimeout(() => controller.abort(), OPENSKY_CONFIG.timeout);

  const headers: Record<string, string> = { 'Accept': 'application/json' };
  const authHeader = buildAuthHeader();
  if (authHeader) headers['Authorization'] = authHeader;

  let response: Response;
  try {
    response = await fetch(url.toString(), { method: 'GET', headers, signal: controller.signal });
  } catch (err: unknown) {
    clearTimeout(timerId);
    if (err instanceof Error && err.name === 'AbortError') throw new TimeoutError(OPENSKY_CONFIG.timeout);
    throw err;
  } finally {
    clearTimeout(timerId);
  }

  if (response.status === 429) {
    recordRateLimitError();
    throw new RateLimitError('OpenSky returned HTTP 429');
  }

  if (!response.ok) throw new Error(`OpenSky API error: HTTP ${response.status}`);

  const data = await response.json() as { icao24: string; callsign: string | null; path: any[] | null };
  incrementRequestCount();
  recordSuccess();

  if (!data.path) return [];

  return data.path.map((point: any[]) => ({
    icao24: data.icao24,
    callsign: data.callsign?.trim() || undefined,
    timestamp: new Date(point[0] * 1000).toISOString(),
    position: [point[2], point[1], point[3] || 0],
    heading: point[4] || 0,
    on_ground: point[5] || false,
  }));
}

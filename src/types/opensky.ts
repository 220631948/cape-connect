/**
 * @file src/types/opensky.ts
 * @description Type definitions for the OpenSky Network ADS-B API.
 *   Covers state vectors, API responses, configuration, rate limiting,
 *   and GeoJSON feature properties for client-side rendering.
 */

// ---------------------------------------------------------------------------
// Core API types — mirrors the OpenSky REST response schema exactly
// ---------------------------------------------------------------------------

/**
 * OpenSkyStateVector
 * One row in the `states` array returned by the OpenSky /states/all endpoint.
 * Field order matches the positional array that OpenSky returns; we map to
 * named keys inside the API client before handing off to consumers.
 * Reference: https://openskynetwork.github.io/opensky-api/rest.html
 */
export interface OpenSkyStateVector {
  /** Unique ICAO 24-bit address of the transponder (hex string, e.g. "3c6444") */
  icao24: string;

  /** Callsign of the vehicle — trimmed; null if not available */
  callsign: string | null;

  /** Country name inferred from the ICAO 24-bit address */
  origin_country: string;

  /**
   * Unix timestamp (seconds) of the last position update.
   * Null if position has not been updated since last_contact.
   */
  time_position: number | null;

  /** Unix timestamp (seconds) of the last ADS-B message received */
  last_contact: number;

  /** WGS-84 longitude (degrees). Null if not available. */
  longitude: number | null;

  /** WGS-84 latitude (degrees). Null if not available. */
  latitude: number | null;

  /**
   * Barometric altitude (metres). Null if aircraft is on ground or
   * the information is not available.
   */
  baro_altitude: number | null;

  /** True if the aircraft is on the ground */
  on_ground: boolean;

  /** Ground velocity (m/s). Null if not available. */
  velocity: number | null;

  /**
   * True track in decimal degrees (0° = North, clockwise).
   * Null if not available.
   */
  true_track: number | null;

  /**
   * Vertical rate (m/s). Positive = climbing, negative = descending.
   * Null if not available.
   */
  vertical_rate: number | null;

  /**
   * IDs of the receivers which contributed to this state vector.
   * Null if not available (anonymous connection).
   */
  sensors: number[] | null;

  /**
   * Geometric altitude (metres) — from GNSS / baro differential.
   * Null if not available.
   */
  geo_altitude: number | null;

  /** Transponder code (squawk). Null if not available. */
  squawk: string | null;

  /** Special purpose indicator (SPI) flag */
  spi: boolean;

  /**
   * Origin of the state vector's position field.
   * 0 = ADS-B, 1 = ASTERIX, 2 = MLAT, 3 = FLARM
   */
  position_source: number;

  /**
   * Aircraft category.
   * 0 = No info, 1 = No ADS-B emitter category, 2 = Light (<15 500 lb),
   * 3 = Small (15 500–75 000 lb), 4 = Large (75 000–300 000 lb),
   * 5 = High vortex large, 6 = Heavy (>300 000 lb), 7 = High performance,
   * 8 = Rotorcraft, 9 = Glider/sailplane, 10 = Lighter-than-air,
   * 11 = Parachutist/skydiver, 12 = Ultralight/hang-glider,
   * 13 = Reserved, 14 = UAV/drone, 15 = Space/transatmospheric,
   * 16 = Surface vehicle (emergency), 17 = Surface vehicle (service),
   * 18 = Point obstacle, 19 = Cluster obstacle, 20 = Line obstacle
   */
  category: number;
}

// ---------------------------------------------------------------------------
// API response envelope
// ---------------------------------------------------------------------------

/**
 * OpenSkyStatesResponse
 * Top-level object returned by GET /states/all.
 */
export interface OpenSkyStatesResponse {
  /** Unix timestamp (seconds) of the snapshot */
  time: number;

  /**
   * Array of state vectors. May be null when the bbox returns no traffic
   * or when the API rate-limit is hit (the client maps null → []).
   */
  states: OpenSkyStateVector[] | null;
}

// ---------------------------------------------------------------------------
// Client configuration
// ---------------------------------------------------------------------------

/** OpenSky endpoint paths relative to baseUrl */
export interface OpenSkyEndpoints {
  statesAll: string;
  tracksAll: string;
}

/** Tier-specific rate limit thresholds (requests per day) */
export interface OpenSkyRateLimits {
  anonymous: number;
  authenticated: number;
}

/**
 * OpenSkyConfig
 * Immutable configuration consumed by the API client module.
 */
export interface OpenSkyConfig {
  /** Base URL, e.g. "https://opensky-network.org/api" */
  baseUrl: string;

  /** Named endpoint paths */
  endpoints: OpenSkyEndpoints;

  /** Daily request limits per authentication tier */
  rateLimit: OpenSkyRateLimits;

  /** Milliseconds between scheduled poll cycles */
  pollInterval: number;

  /** Milliseconds before an in-flight request is aborted */
  timeout: number;
}

// ---------------------------------------------------------------------------
// Rate-limit state (in-memory tracking)
// ---------------------------------------------------------------------------

/**
 * RateLimitState
 * Tracks daily request counts and exponential back-off state.
 * Kept in module scope; resets automatically at midnight UTC.
 */
export interface RateLimitState {
  /** Number of requests dispatched in the current UTC calendar day */
  requestsToday: number;

  /** ISO date string (YYYY-MM-DD UTC) of the current counting window */
  windowDate: string;

  /** Current back-off delay in milliseconds (0 = no back-off active) */
  backoffMs: number;

  /** Timestamp (ms) when the back-off expires; 0 = not backing off */
  backoffUntil: number;

  /** Number of consecutive rate-limit errors (drives exponential growth) */
  consecutiveErrors: number;
}

// ---------------------------------------------------------------------------
// Tracks API types — GET /tracks/all
// ---------------------------------------------------------------------------

/**
 * OpenSkyTrackPoint
 * Positional array returned in the `path` field of the tracks response.
 * [0] time (Unix s), [1] lat, [2] lon, [3] baro_alt, [4] true_track, [5] on_ground
 */
export type OpenSkyTrackPoint = [number, number, number, number | null, number | null, boolean];

/**
 * OpenSkyTracksResponse
 * Top-level object returned by GET /tracks/all.
 */
export interface OpenSkyTracksResponse {
  icao24: string;
  callsign: string | null;
  startTime: number;
  endTime: number;
  /** List of waypoints. May be null if no track found. */
  path: OpenSkyTrackPoint[] | null;
}

/**
 * FlightTemporalEntry
 * Transformed waypoint used for 4DGS replay and time-dynamic rendering.
 */
export interface FlightTemporalEntry {
  icao24: string;
  timestamp: string; // ISO 8601
  /** [longitude, latitude, altitude_metres] */
  position: [number, number, number];
  heading: number;
  on_ground: boolean;
  callsign?: string;
}

// ---------------------------------------------------------------------------
// GeoJSON output properties
// ---------------------------------------------------------------------------

/**
 * AircraftFeatureProperties
 * Properties attached to each GeoJSON Point feature produced by the
 * `toGeoJSON()` helper in the API client.  These flow directly to the
 * MapLibre layer and the Flight Detail panel.
 */
export interface AircraftFeatureProperties {
  /** ICAO 24-bit hex address — used as the stable feature ID */
  icao24: string;

  /** Display callsign (empty string if null from API) */
  callsign: string;

  /** Country name of registration */
  origin_country: string;

  /** Barometric altitude in metres; null when on ground or unavailable */
  baro_altitude: number | null;

  /** Geometric altitude in metres; null when unavailable */
  geo_altitude: number | null;

  /** Ground speed in m/s; null when unavailable */
  velocity: number | null;

  /** Heading in degrees (0° = North, clockwise); null when unavailable */
  true_track: number | null;

  /** Vertical rate in m/s; null when unavailable */
  vertical_rate: number | null;

  /** True when the aircraft is reported as on-ground */
  on_ground: boolean;

  /** Transponder squawk code; null when unavailable */
  squawk: string | null;

  /**
   * Position source code.
   * 0 = ADS-B | 1 = ASTERIX | 2 = MLAT | 3 = FLARM
   */
  position_source: number;

  /** Aircraft category code (0–20; see OpenSkyStateVector.category) */
  category: number;

  /** Unix seconds of the last position update */
  time_position: number | null;

  /** Unix seconds of the last ADS-B contact */
  last_contact: number;

  /**
   * Data freshness badge token consumed by the DataSourceBadge component.
   * Value: "LIVE" | "CACHED" | "MOCK"
   */
  data_tier: 'LIVE' | 'CACHED' | 'MOCK';
}

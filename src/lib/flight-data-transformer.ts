/**
 * @file src/lib/flight-data-transformer.ts
 * @description Transforms raw OpenSky Network state vectors into MapLibre-renderable
 *   GeoJSON FeatureCollections. Pure utility — no I/O, no side-effects.
 *
 * POPIA ANNOTATION
 * Personal data handled: Aircraft callsigns (may identify specific pilots),
 *   ICAO24 registration numbers (linkable to SACAA owner records),
 *   flight patterns (private aircraft movements reveal personal data)
 * Purpose: Transform OpenSky API response into MapLibre-renderable GeoJSON
 *   for airspace visualization
 * Lawful basis: Legitimate interests (ADS-B publicly broadcast; public safety)
 * Retention: Transformation only — no storage; output consumed by ephemeral UI layer
 * Subject rights: access ✓ | correction ✗ (source data) | deletion ✓ (no persistence) | objection ✓ (guest mode)
 * POPIA risk level: MEDIUM
 * Review date: 2026-06-01
 */

import type { OpenSkyStateVector } from '@/types/opensky';

// ---------------------------------------------------------------------------
// Bounding box — Cape Town airspace (FACT/CPT region)
// Rule 9: west: 18.0, south: -34.5, east: 19.5, north: -33.0
// ---------------------------------------------------------------------------

/** Geographic bounding box for the Cape Town airspace region (EPSG:4326). */
export const CAPE_TOWN_BBOX = {
  west: 18.0,
  south: -34.5,
  east: 19.5,
  north: -33.0,
} as const;

// ---------------------------------------------------------------------------
// Airline callsign pattern
// Matches IATA/ICAO prefixes for scheduled South African & regional carriers:
//   SAA  — South African Airways
//   FA   — FlySafair
//   MN   — Comair (British Airways codeshare)
//   4Z   — Airlink
//   BA   — British Airways (occasional CPT service)
//   QR   — Qatar Airways
//   EK   — Emirates
//   ET   — Ethiopian Airlines
//   KQ   — Kenya Airways
//   LH   — Lufthansa
//   TK   — Turkish Airlines
//   RB   — Air Botswana
//   UD   — Hex Air / Airfast
//   7P   — Batik Air
// Pattern: 2-3 uppercase letter/digit prefix + 1-4 digit suffix.
// ---------------------------------------------------------------------------

/**
 * Regex that matches recognised airline/commercial-operator callsigns.
 * Private piston / GA callsigns (ZS-XXX, national registrations) do NOT match.
 */
export const AIRLINE_CALLSIGN_PATTERN =
  /^(SAA|FA|MN|4Z|BA|QR|EK|ET|KQ|LH|TK|RB|UD|7P|CCA|AFR|DLH|UAE|THY|MSR|SVA|KAL|AIC|TAP|IBE|AZA|RAM|RWD|QFA|FIN|CSN|SWR)\d{1,4}[A-Z]?$/;

// ---------------------------------------------------------------------------
// Helper: bbox check (manual — no Turf dependency per spec)
// ---------------------------------------------------------------------------

/**
 * Returns true when [lng, lat] falls within the Cape Town bounding box.
 * Uses strict inequalities; points exactly on the edge are included.
 *
 * @param lng - WGS84 longitude (degrees)
 * @param lat - WGS84 latitude (degrees)
 */
export function isInCapeTownBbox(lng: number, lat: number): boolean {
  return (
    lng >= CAPE_TOWN_BBOX.west &&
    lng <= CAPE_TOWN_BBOX.east &&
    lat >= CAPE_TOWN_BBOX.south &&
    lat <= CAPE_TOWN_BBOX.north
  );
}

// ---------------------------------------------------------------------------
// Helper: airline callsign check
// ---------------------------------------------------------------------------

/**
 * Returns true when the provided callsign matches a known scheduled airline
 * or commercial operator prefix.  Trims whitespace before matching.
 *
 * @param callsign - Raw callsign string from the state vector
 */
export function isAirlineCallsign(callsign: string): boolean {
  return AIRLINE_CALLSIGN_PATTERN.test(callsign.trim());
}

// ---------------------------------------------------------------------------
// GeoJSON output types (inline to avoid namespace import issues)
// ---------------------------------------------------------------------------

/** Properties attached to each aircraft GeoJSON feature. */
export interface FlightFeatureProperties {
  icao24: string;
  callsign: string;
  heading: number;
  altitude: number;
  velocity: number;
  on_ground: boolean;
  origin_country: string;
  last_contact: number;
}

/** A GeoJSON Point feature representing one aircraft. */
export interface FlightFeature {
  type: 'Feature';
  geometry: {
    type: 'Point';
    coordinates: [number, number]; // [lng, lat]
  };
  properties: FlightFeatureProperties;
}

/** GeoJSON FeatureCollection of aircraft positions. */
export interface FlightFeatureCollection {
  type: 'FeatureCollection';
  features: FlightFeature[];
}

// ---------------------------------------------------------------------------
// Core transformer
// ---------------------------------------------------------------------------

/**
 * toFlightGeoJSON
 *
 * Converts an array of raw OpenSky state vectors into a GeoJSON
 * FeatureCollection ready for a MapLibre `geojson` source.
 *
 * Processing pipeline:
 *   1. Drop states with null longitude or latitude.
 *   2. Drop states outside the Cape Town bounding box.
 *   3. Deduplicate by `icao24`, keeping the entry with the most recent
 *      `time_position` (or `last_contact` as a tiebreaker).
 *   4. In guest mode, further filter to airline callsigns only (POPIA Rule 6).
 *   5. Map each surviving state to a GeoJSON Point Feature.
 *
 * @param states    - Raw state vectors from OpenSky API (or empty array).
 * @param guestMode - When true, strips private aircraft (POPIA compliance).
 * @returns         GeoJSON FeatureCollection with zero or more Point features.
 */
export function toFlightGeoJSON(
  states: OpenSkyStateVector[],
  guestMode = false
): FlightFeatureCollection {
  // --- Step 1: filter out null-position entries ---
  const withPosition = states.filter(
    (s): s is OpenSkyStateVector & { longitude: number; latitude: number } =>
      s.longitude !== null && s.latitude !== null
  );

  // --- Step 2: filter to Cape Town bbox ---
  const inBbox = withPosition.filter((s) =>
    isInCapeTownBbox(s.longitude, s.latitude)
  );

  // --- Step 3: deduplicate by icao24, keep most recent time_position ---
  const byIcao24 = new Map<string, (typeof inBbox)[number]>();
  for (const state of inBbox) {
    const existing = byIcao24.get(state.icao24);
    if (!existing) {
      byIcao24.set(state.icao24, state);
      continue;
    }
    // Compare time_position first; fall back to last_contact
    const incomingTime = state.time_position ?? state.last_contact;
    const existingTime = existing.time_position ?? existing.last_contact;
    if (incomingTime > existingTime) {
      byIcao24.set(state.icao24, state);
    }
  }

  let deduplicated = Array.from(byIcao24.values());

  // --- Step 4: guest mode — airline callsigns only (POPIA Rule 6) ---
  if (guestMode) {
    deduplicated = deduplicated.filter((s) => {
      const cs = s.callsign?.trim() ?? '';
      return cs.length > 0 && isAirlineCallsign(cs);
    });
  }

  // --- Step 5: map to GeoJSON features ---
  const features: FlightFeature[] = deduplicated.map((s) => ({
    type: 'Feature',
    geometry: {
      type: 'Point',
      // longitude / latitude are guaranteed non-null by step 1 filter
      coordinates: [s.longitude as number, s.latitude as number],
    },
    properties: {
      icao24: s.icao24,
      callsign: s.callsign?.trim() || 'N/A',
      heading: s.true_track ?? 0,
      altitude: s.geo_altitude ?? s.baro_altitude ?? 0,
      velocity: s.velocity ?? 0,
      on_ground: s.on_ground,
      origin_country: s.origin_country,
      last_contact: s.last_contact,
    },
  }));

  return {
    type: 'FeatureCollection',
    features,
  };
}

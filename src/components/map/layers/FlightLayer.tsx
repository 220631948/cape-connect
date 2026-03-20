/**
 * POPIA ANNOTATION
 * Personal data handled: Aircraft callsigns displayed on map (may identify pilots/owners),
 *   ICAO24 identifiers visible in popups (linkable to SACAA records)
 * Purpose: Real-time airspace visualization layer for Cape Town urban planning and emergency context
 * Lawful basis: Legitimate interests (ADS-B publicly broadcast; no consent required for public data display)
 * Retention: Display only — no storage; React state cleared on component unmount
 * Subject rights: access ✓ | correction ✗ | deletion ✓ (auto on unmount) | objection ✓ (guestMode prop)
 * POPIA risk level: MEDIUM (callsigns + patterns = identifiable for private aircraft)
 * Review date: 2026-06-01
 */

/**
 * @file src/components/map/layers/FlightLayer.tsx
 * @description MapLibre Layer for real-time OpenSky Network flight tracking.
 * @compliance Rule 1: SourceBadge always visible. Rule 2: LIVE→CACHED→MOCK fallback via /api/flights.
 */

'use client';

import React, { useEffect, useState } from 'react';
import maplibregl from 'maplibre-gl';
import SourceBadge from '@/components/ui/SourceBadge';

// ─── Constants ───────────────────────────────────────────────────────────────

const SOURCE_ID = 'opensky-flights';
const ICON_LAYER_ID = 'opensky-aircraft-icon';
const LABEL_LAYER_ID = 'opensky-callsign-label';
const POLL_INTERVAL_MS = 30_000;

// ─── Types ───────────────────────────────────────────────────────────────────

interface FlightLayerProps {
  map: maplibregl.Map | null;
  visible?: boolean;
  guestMode?: boolean;
}

interface FlightTier {
  source: string;
  year: number;
  tier: 'LIVE' | 'CACHED' | 'MOCK';
  timestamp?: string;
}

interface FlightsApiResponse {
  data: GeoJSON.FeatureCollection;
  source: string;
  year: number;
  tier: 'LIVE' | 'CACHED' | 'MOCK';
  timestamp?: string;
}

// ─── Component ───────────────────────────────────────────────────────────────

export const FlightLayer: React.FC<FlightLayerProps> = ({
  map,
  visible = true,
  guestMode = false,
}) => {
  const [flightTier, setFlightTier] = useState<FlightTier | null>(null);

  useEffect(() => {
    if (!map) return;

    let intervalId: ReturnType<typeof setInterval>;
    let destroyed = false;

    // ── 1. Load aircraft icon image ─────────────────────────────────────────
    const loadIcon = (): Promise<void> =>
      new Promise((resolve) => {
        const img = new Image(32, 32);
        img.src = '/sprites/aircraft-icon.svg';
        img.onload = () => {
          if (!map.hasImage('aircraft-icon')) {
            map.addImage('aircraft-icon', img);
          }
          resolve();
        };
        img.onerror = () => resolve(); // Non-fatal — layer still renders
      });

    // ── 2. Add GeoJSON source ───────────────────────────────────────────────
    const addSource = () => {
      if (!map.getSource(SOURCE_ID)) {
        map.addSource(SOURCE_ID, {
          type: 'geojson',
          data: { type: 'FeatureCollection', features: [] },
        });
      }
    };

    // ── 3. Add symbol layers ────────────────────────────────────────────────
    const addLayers = () => {
      if (!map.getLayer(ICON_LAYER_ID)) {
        map.addLayer({
          id: ICON_LAYER_ID,
          type: 'symbol',
          source: SOURCE_ID,
          minzoom: 6,
          maxzoom: 18,
          layout: {
            'icon-image': 'aircraft-icon',
            'icon-size': 1.0,
            'icon-rotate': ['get', 'heading'],
            'icon-allow-overlap': true,
            'icon-ignore-placement': true,
          },
          paint: {
            'icon-opacity': visible ? 0.9 : 0,
          },
        });
      }

      if (!map.getLayer(LABEL_LAYER_ID)) {
        map.addLayer({
          id: LABEL_LAYER_ID,
          type: 'symbol',
          source: SOURCE_ID,
          minzoom: 8,
          maxzoom: 18,
          layout: {
            'text-field': ['get', 'callsign'],
            'text-font': ['Noto Sans Regular'],
            'text-size': 11,
            'text-offset': [0, 1.5],
            'text-anchor': 'top',
          },
          paint: {
            'text-color': '#00d4ff',
            'text-halo-color': '#0a0a0f',
            'text-halo-width': 2,
            'text-opacity': visible ? 1 : 0,
          },
        });
      }
    };

    // ── 4. Fetch and update flight data ─────────────────────────────────────
    const fetchFlights = async () => {
      if (destroyed) return;
      try {
        const res = await fetch(`/api/flights?guest=${guestMode}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json: FlightsApiResponse = await res.json();

        if (destroyed) return;

        const source = map.getSource(SOURCE_ID) as maplibregl.GeoJSONSource | undefined;
        if (source) {
          source.setData(json.data);
        }

        setFlightTier({
          source: json.source,
          year: json.year,
          tier: json.tier,
          timestamp: json.timestamp
        });
      } catch {
        // Fallback handled server-side via three-tier; silently continue
      }
    };

    // ── 5. Initialise ───────────────────────────────────────────────────────
    const init = async () => {
      await loadIcon();
      if (destroyed) return;
      addSource();
      addLayers();
      await fetchFlights();
      if (destroyed) return;
      intervalId = setInterval(fetchFlights, POLL_INTERVAL_MS);
    };

    init();

    // ── 6. Cleanup ──────────────────────────────────────────────────────────
    return () => {
      destroyed = true;
      clearInterval(intervalId);
      if (map.getLayer(LABEL_LAYER_ID)) map.removeLayer(LABEL_LAYER_ID);
      if (map.getLayer(ICON_LAYER_ID)) map.removeLayer(ICON_LAYER_ID);
      if (map.getSource(SOURCE_ID)) map.removeSource(SOURCE_ID);
    };
  }, [map, guestMode]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Visibility toggle without full re-mount ─────────────────────────────
  useEffect(() => {
    if (!map) return;
    if (map.getLayer(ICON_LAYER_ID)) {
      map.setPaintProperty(ICON_LAYER_ID, 'icon-opacity', visible ? 0.9 : 0);
    }
    if (map.getLayer(LABEL_LAYER_ID)) {
      map.setPaintProperty(LABEL_LAYER_ID, 'text-opacity', visible ? 1 : 0);
    }
  }, [visible, map]);

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div style={{ position: 'absolute', bottom: '12px', right: '60px', zIndex: 10 }}>
      {flightTier && (
        <SourceBadge
          source={flightTier.source}
          year={flightTier.year}
          tier={flightTier.tier}
          timestamp={flightTier.timestamp}
        />
      )}
    </div>
  );
};

export default FlightLayer;

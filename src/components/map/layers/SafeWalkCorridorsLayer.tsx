/**
 * POPIA ANNOTATION
 * Personal data handled: None (Walking corridors are community-reported public data)
 * Purpose: Safe walking route visualization for youth and community safety
 * Lawful basis: N/A - Not personal data
 * Retention: Indefinite (open data)
 * Subject rights: N/A
 * POPIA risk level: LOW
 * Review date: 2026-06-01
 */

/**
 * @file src/components/map/layers/SafeWalkCorridorsLayer.tsx
 * @description M19 — Safe-Walk Corridors line layer with pulsing glow styling.
 * Community-verified safe walking routes with safety rating color coding.
 * Supports offline persistence via Dexie.js IndexedDB.
 * @compliance Rule 1: SourceBadge always visible. Rule 2: Three-tier fallback via API.
 */

'use client';

import React, { useEffect, useState, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import SourceBadge from '@/components/ui/SourceBadge';
import { db } from '@/lib/db/dexie';
import type { OfflineSafeWalkCorridor } from '@/lib/db/dexie';

const SOURCE_ID = 'safe-walk-corridors-source';
const GLOW_LAYER_ID = 'safe-walk-corridors-glow';
const LINE_LAYER_ID = 'safe-walk-corridors-line';
const LABEL_LAYER_ID = 'safe-walk-corridors-labels';

interface SafeWalkCorridorsLayerProps {
  map: maplibregl.Map | null;
  visible?: boolean;
  tenantId?: string;
}

interface CorridorTier {
  source: string;
  year: number;
  tier: 'LIVE' | 'CACHED' | 'MOCK';
  data: GeoJSON.FeatureCollection;
}

const MOCK_DATA: GeoJSON.FeatureCollection = {
  type: 'FeatureCollection',
  features: [
    { type: 'Feature', properties: { name: 'Sea Point Promenade', safety_rating: 5, has_lighting: true, has_cctv: true, distance_m: 3200 }, geometry: { type: 'LineString', coordinates: [[18.3811, -33.9155], [18.3730, -33.9200], [18.3649, -33.9262]] } },
    { type: 'Feature', properties: { name: "Company's Garden Path", safety_rating: 4, has_lighting: true, has_cctv: true, distance_m: 800 }, geometry: { type: 'LineString', coordinates: [[18.4176, -33.9280], [18.4153, -33.9298], [18.4131, -33.9316]] } },
    { type: 'Feature', properties: { name: 'Green Point Urban Park', safety_rating: 4, has_lighting: true, has_cctv: false, distance_m: 1500 }, geometry: { type: 'LineString', coordinates: [[18.4080, -33.9108], [18.4030, -33.9125], [18.3980, -33.9145]] } },
  ],
};

function ratingToColor(rating: number): string {
  if (rating >= 5) return '#4caf50';
  if (rating >= 4) return '#8bc34a';
  if (rating >= 3) return '#ffeb3b';
  if (rating >= 2) return '#ff9800';
  return '#f44336';
}

async function cacheToIndexedDB(data: GeoJSON.FeatureCollection, tenantId: string) {
  const now = new Date().toISOString();
  const records: OfflineSafeWalkCorridor[] = data.features
    .filter((f) => f.geometry.type === 'LineString')
    .map((f) => ({
      id: f.properties?.id || `swc-${crypto.randomUUID()}`,
      tenant_id: tenantId,
      name: f.properties?.name || 'Unknown Corridor',
      safety_rating: f.properties?.safety_rating ?? 3,
      has_lighting: f.properties?.has_lighting ?? false,
      has_cctv: f.properties?.has_cctv ?? false,
      distance_m: f.properties?.distance_m ?? null,
      geometry_json: JSON.stringify(f.geometry),
      cached_at: now,
    }));
  await db.safeWalkCorridors.where('tenant_id').equals(tenantId).delete();
  await db.safeWalkCorridors.bulkPut(records);
}

async function loadFromIndexedDB(tenantId: string): Promise<GeoJSON.FeatureCollection | null> {
  const records = await db.safeWalkCorridors.where('tenant_id').equals(tenantId).toArray();
  if (records.length === 0) return null;
  return {
    type: 'FeatureCollection',
    features: records.map((r) => ({
      type: 'Feature' as const,
      properties: { name: r.name, safety_rating: r.safety_rating, has_lighting: r.has_lighting, has_cctv: r.has_cctv, distance_m: r.distance_m },
      geometry: JSON.parse(r.geometry_json),
    })),
  };
}

export const SafeWalkCorridorsLayer: React.FC<SafeWalkCorridorsLayerProps> = ({
  map,
  visible = false,
  tenantId = 'default',
}) => {
  const [tierInfo, setTierInfo] = useState<{ source: string; year: number; tier: 'LIVE' | 'CACHED' | 'MOCK' } | null>(null);

  const fetchData = useCallback(async (): Promise<CorridorTier> => {
    // Tier 1: LIVE — Supabase API
    try {
      const res = await fetch(`/api/community/corridors?tenant_id=${tenantId}`);
      if (res.ok) {
        const json = await res.json();
        if (json.data?.features?.length > 0) {
          await cacheToIndexedDB(json.data, tenantId);
          return { source: 'Supabase', year: 2026, tier: 'LIVE', data: json.data };
        }
      }
    } catch { /* fall through */ }

    // Tier 2: CACHED — Dexie.js IndexedDB
    const offline = await loadFromIndexedDB(tenantId);
    if (offline) return { source: 'IndexedDB (offline)', year: 2026, tier: 'CACHED', data: offline };

    // Tier 3: MOCK
    return { source: 'Mock', year: 2026, tier: 'MOCK', data: MOCK_DATA };
  }, [tenantId]);

  useEffect(() => {
    if (!map) return;
    let destroyed = false;

    const addLayers = () => {
      if (!map.getSource(SOURCE_ID)) {
        map.addSource(SOURCE_ID, {
          type: 'geojson',
          data: { type: 'FeatureCollection', features: [] },
        });
      }

      // Outer glow layer — wider, semi-transparent for pulsing effect
      if (!map.getLayer(GLOW_LAYER_ID)) {
        map.addLayer({
          id: GLOW_LAYER_ID,
          type: 'line',
          source: SOURCE_ID,
          paint: {
            'line-color': [
              'match', ['get', 'safety_rating'],
              5, ratingToColor(5),
              4, ratingToColor(4),
              3, ratingToColor(3),
              2, ratingToColor(2),
              1, ratingToColor(1),
              '#999999',
            ],
            'line-width': ['interpolate', ['linear'], ['zoom'], 10, 8, 16, 18],
            'line-opacity': visible ? 0.3 : 0,
            'line-blur': 6,
          },
        });
      }

      // Inner line layer — crisp route line
      if (!map.getLayer(LINE_LAYER_ID)) {
        map.addLayer({
          id: LINE_LAYER_ID,
          type: 'line',
          source: SOURCE_ID,
          paint: {
            'line-color': [
              'match', ['get', 'safety_rating'],
              5, ratingToColor(5),
              4, ratingToColor(4),
              3, ratingToColor(3),
              2, ratingToColor(2),
              1, ratingToColor(1),
              '#999999',
            ],
            'line-width': ['interpolate', ['linear'], ['zoom'], 10, 3, 16, 6],
            'line-opacity': visible ? 0.9 : 0,
          },
          layout: {
            'line-cap': 'round',
            'line-join': 'round',
          },
        });
      }

      // Label layer
      if (!map.getLayer(LABEL_LAYER_ID)) {
        map.addLayer({
          id: LABEL_LAYER_ID,
          type: 'symbol',
          source: SOURCE_ID,
          minzoom: 13,
          layout: {
            'symbol-placement': 'line-center',
            'text-field': ['concat', ['get', 'name'], ' (★', ['to-string', ['get', 'safety_rating']], ')'],
            'text-size': 11,
            'text-rotation-alignment': 'map',
          },
          paint: {
            'text-color': '#1a1a1a',
            'text-halo-color': '#ffffff',
            'text-halo-width': 1.5,
            'text-opacity': visible ? 1 : 0,
          },
        });
      }
    };

    const init = async () => {
      addLayers();
      const result = await fetchData();
      if (destroyed) return;
      setTierInfo({ source: result.source, year: result.year, tier: result.tier });
      const source = map.getSource(SOURCE_ID) as maplibregl.GeoJSONSource;
      if (source) source.setData(result.data);
    };

    init();

    return () => {
      destroyed = true;
      if (map.getLayer(LABEL_LAYER_ID)) map.removeLayer(LABEL_LAYER_ID);
      if (map.getLayer(LINE_LAYER_ID)) map.removeLayer(LINE_LAYER_ID);
      if (map.getLayer(GLOW_LAYER_ID)) map.removeLayer(GLOW_LAYER_ID);
      if (map.getSource(SOURCE_ID)) map.removeSource(SOURCE_ID);
    };
  }, [map, fetchData]);

  useEffect(() => {
    if (!map) return;
    if (map.getLayer(GLOW_LAYER_ID)) {
      map.setPaintProperty(GLOW_LAYER_ID, 'line-opacity', visible ? 0.3 : 0);
    }
    if (map.getLayer(LINE_LAYER_ID)) {
      map.setPaintProperty(LINE_LAYER_ID, 'line-opacity', visible ? 0.9 : 0);
    }
    if (map.getLayer(LABEL_LAYER_ID)) {
      map.setPaintProperty(LABEL_LAYER_ID, 'text-opacity', visible ? 1 : 0);
    }
  }, [visible, map]);

  return (
    <div style={{ position: 'absolute', bottom: '12px', right: '440px', zIndex: 9 }}>
      {tierInfo && visible && (
        <SourceBadge source={tierInfo.source} year={tierInfo.year} tier={tierInfo.tier} />
      )}
    </div>
  );
};

export default SafeWalkCorridorsLayer;

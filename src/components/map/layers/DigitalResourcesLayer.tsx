/**
 * POPIA ANNOTATION
 * Personal data handled: None (Community resource locations are public data)
 * Purpose: Digital resource access visualization for youth empowerment
 * Lawful basis: N/A - Not personal data
 * Retention: Indefinite (open data)
 * Subject rights: N/A
 * POPIA risk level: LOW
 * Review date: 2026-06-01
 */

/**
 * @file src/components/map/layers/DigitalResourcesLayer.tsx
 * @description M19 — Local Digital Resources vector layer.
 * WiFi hotspots, libraries, computer labs with category-based symbology.
 * Supports offline persistence via Dexie.js IndexedDB.
 * @compliance Rule 1: SourceBadge always visible. Rule 2: Three-tier fallback via API.
 */

'use client';

import React, { useEffect, useState, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import SourceBadge from '@/components/ui/SourceBadge';
import { db } from '@/lib/db/dexie';
import type { OfflineCommunityResource } from '@/lib/db/dexie';

const SOURCE_ID = 'digital-resources-source';
const LAYER_ID = 'digital-resources-points';
const LABEL_LAYER_ID = 'digital-resources-labels';

const CATEGORY_COLORS: Record<string, string> = {
  wifi: '#00bcd4',
  library: '#ff9800',
  computer_lab: '#4caf50',
  community_centre: '#9c27b0',
  coworking: '#2196f3',
};

interface DigitalResourcesLayerProps {
  map: maplibregl.Map | null;
  visible?: boolean;
  tenantId?: string;
}

interface ResourceTier {
  source: string;
  year: number;
  tier: 'LIVE' | 'CACHED' | 'MOCK';
  timestamp?: string;
  data: GeoJSON.FeatureCollection;
}

const MOCK_DATA: GeoJSON.FeatureCollection = {
  type: 'FeatureCollection',
  features: [
    { type: 'Feature', properties: { name: 'Cape Town Central Library', category: 'library', is_free: true }, geometry: { type: 'Point', coordinates: [18.4241, -33.9249] } },
    { type: 'Feature', properties: { name: 'Khayelitsha Public WiFi', category: 'wifi', is_free: true }, geometry: { type: 'Point', coordinates: [18.6744, -34.0443] } },
    { type: 'Feature', properties: { name: 'iKhaya Computer Lab', category: 'computer_lab', is_free: true }, geometry: { type: 'Point', coordinates: [18.5676, -33.9784] } },
    { type: 'Feature', properties: { name: 'Athlone Library', category: 'library', is_free: true }, geometry: { type: 'Point', coordinates: [18.5035, -33.9527] } },
    { type: 'Feature', properties: { name: 'Workshop17 Watershed', category: 'coworking', is_free: false }, geometry: { type: 'Point', coordinates: [18.4207, -33.9033] } },
  ],
};

async function cacheToIndexedDB(data: GeoJSON.FeatureCollection, tenantId: string) {
  const now = new Date().toISOString();
  const records: OfflineCommunityResource[] = data.features
    .filter((f) => f.geometry.type === 'Point')
    .map((f) => ({
      id: f.properties?.id || `cr-${Math.random().toString(36).slice(2, 8)}`,
      tenant_id: tenantId,
      name: f.properties?.name || 'Unknown',
      category: f.properties?.category || 'wifi',
      address: f.properties?.address || null,
      is_free: f.properties?.is_free ?? true,
      latitude: (f.geometry as GeoJSON.Point).coordinates[1],
      longitude: (f.geometry as GeoJSON.Point).coordinates[0],
      cached_at: now,
    }));
  await db.communityResources.where('tenant_id').equals(tenantId).delete();
  await db.communityResources.bulkPut(records);
}

async function loadFromIndexedDB(tenantId: string): Promise<GeoJSON.FeatureCollection | null> {
  const records = await db.communityResources.where('tenant_id').equals(tenantId).toArray();
  if (records.length === 0) return null;
  return {
    type: 'FeatureCollection',
    features: records.map((r) => ({
      type: 'Feature' as const,
      properties: { name: r.name, category: r.category, is_free: r.is_free, address: r.address },
      geometry: { type: 'Point' as const, coordinates: [r.longitude, r.latitude] },
    })),
  };
}

export const DigitalResourcesLayer: React.FC<DigitalResourcesLayerProps> = ({
  map,
  visible = false,
  tenantId = 'default',
}) => {
  const [tierInfo, setTierInfo] = useState<{ source: string; year: number; tier: 'LIVE' | 'CACHED' | 'MOCK' } | null>(null);

  const fetchData = useCallback(async (): Promise<ResourceTier> => {
    // Tier 1: LIVE — Supabase API
    try {
      const res = await fetch(`/api/community/resources?tenant_id=${tenantId}`);
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

      if (!map.getLayer(LAYER_ID)) {
        map.addLayer({
          id: LAYER_ID,
          type: 'circle',
          source: SOURCE_ID,
          paint: {
            'circle-radius': ['interpolate', ['linear'], ['zoom'], 10, 5, 16, 12],
            'circle-color': [
              'match', ['get', 'category'],
              'wifi', CATEGORY_COLORS.wifi,
              'library', CATEGORY_COLORS.library,
              'computer_lab', CATEGORY_COLORS.computer_lab,
              'community_centre', CATEGORY_COLORS.community_centre,
              'coworking', CATEGORY_COLORS.coworking,
              '#999999',
            ],
            'circle-stroke-color': '#ffffff',
            'circle-stroke-width': 2,
            'circle-opacity': visible ? 0.9 : 0,
            'circle-stroke-opacity': visible ? 1 : 0,
          },
        });
      }

      if (!map.getLayer(LABEL_LAYER_ID)) {
        map.addLayer({
          id: LABEL_LAYER_ID,
          type: 'symbol',
          source: SOURCE_ID,
          minzoom: 13,
          layout: {
            'text-field': ['get', 'name'],
            'text-size': 11,
            'text-offset': [0, 1.5],
            'text-anchor': 'top',
          },
          paint: {
            'text-color': '#333333',
            'text-halo-color': '#ffffff',
            'text-halo-width': 1,
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
      if (map.getLayer(LAYER_ID)) map.removeLayer(LAYER_ID);
      if (map.getSource(SOURCE_ID)) map.removeSource(SOURCE_ID);
    };
  }, [map, fetchData]);

  useEffect(() => {
    if (!map) return;
    if (map.getLayer(LAYER_ID)) {
      map.setPaintProperty(LAYER_ID, 'circle-opacity', visible ? 0.9 : 0);
      map.setPaintProperty(LAYER_ID, 'circle-stroke-opacity', visible ? 1 : 0);
    }
    if (map.getLayer(LABEL_LAYER_ID)) {
      map.setPaintProperty(LABEL_LAYER_ID, 'text-opacity', visible ? 1 : 0);
    }
  }, [visible, map]);

  return (
    <div style={{ position: 'absolute', bottom: '12px', right: '290px', zIndex: 9 }}>
      {tierInfo && visible && (
        <SourceBadge source={tierInfo.source} year={tierInfo.year} tier={tierInfo.tier} />
      )}
    </div>
  );
};

export default DigitalResourcesLayer;

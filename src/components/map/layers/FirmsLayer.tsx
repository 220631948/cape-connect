/**
 * POPIA ANNOTATION
 * Personal data handled: None (Fire hotspots are aggregate environmental datums)
 * Purpose: Open data visualization for emergency response and environmental monitoring
 * Lawful basis: N/A - Not personal data
 * Retention: Indefinite (open data)
 * Subject rights: N/A
 * POPIA risk level: LOW
 * Review date: 2026-06-01
 */

/**
 * @file src/components/map/layers/FirmsLayer.tsx
 * @description MapLibre Layer for NASA FIRMS Fire Hotspots with Three-Tier Fallback.
 * @compliance Rule 1: SourceBadge always visible. Rule 2: LIVE→CACHED→MOCK fallback via /api/firms.
 */

'use client';

import React, { useEffect, useState } from 'react';
import maplibregl from 'maplibre-gl';
import SourceBadge from '@/components/ui/SourceBadge';

const SOURCE_ID = 'firms-fires-source';
const HEATMAP_LAYER_ID = 'firms-fires-heatmap';
const POINT_LAYER_ID = 'firms-fires-point';
const POLL_INTERVAL_MS = 300_000; // 5 mins

interface FirmsLayerProps {
  map: maplibregl.Map | null;
  visible?: boolean;
}

interface FirmsTier {
  source: string;
  year: number;
  tier: 'LIVE' | 'CACHED' | 'MOCK';
  timestamp?: string;
  data: GeoJSON.FeatureCollection;
}

export const FirmsLayer: React.FC<FirmsLayerProps> = ({ map, visible = false }) => {
  const [tierInfo, setTierInfo] = useState<FirmsTier | null>(null);

  useEffect(() => {
    if (!map) return;
    let destroyed = false;
    let intervalId: ReturnType<typeof setInterval>;

    const fetchFirmsData = async () => {
      if (destroyed) return;
      try {
        const res = await fetch('/api/firms');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json: FirmsTier = await res.json();

        if (destroyed) return;

        setTierInfo(json);
        const source = map.getSource(SOURCE_ID) as maplibregl.GeoJSONSource;
        if (source) {
          source.setData(json.data);
        }
      } catch (err) {
        console.error('Failed to load FIRMS layer', err);
      }
    };

    const addLayers = () => {
      if (!map.getSource(SOURCE_ID)) {
        map.addSource(SOURCE_ID, {
          type: 'geojson',
          data: { type: 'FeatureCollection', features: [] }
        });
      }

      if (!map.getLayer(HEATMAP_LAYER_ID)) {
        map.addLayer({
          id: HEATMAP_LAYER_ID,
          type: 'heatmap',
          source: SOURCE_ID,
          maxzoom: 15,
          paint: {
            'heatmap-weight': ['interpolate', ['linear'], ['get', 'brightness'], 300, 0, 400, 1],
            'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 0, 1, 15, 3],
            'heatmap-color': [
              'interpolate', ['linear'], ['heatmap-density'],
              0, 'rgba(33,102,172,0)',
              0.2, 'rgb(103,169,207)',
              0.4, 'rgb(209,229,240)',
              0.6, 'rgb(253,219,199)',
              0.8, 'rgb(239,138,98)',
              1, 'rgb(178,24,43)'
            ],
            'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 0, 2, 15, 20],
            'heatmap-opacity': visible ? 0.8 : 0
          }
        });
      }

      if (!map.getLayer(POINT_LAYER_ID)) {
        map.addLayer({
          id: POINT_LAYER_ID,
          type: 'circle',
          source: SOURCE_ID,
          minzoom: 14,
          paint: {
            'circle-radius': ['interpolate', ['linear'], ['zoom'], 14, 4, 22, 10],
            'circle-color': '#ff4d4d',
            'circle-stroke-color': '#fff',
            'circle-stroke-width': 1,
            'circle-opacity': visible ? 1 : 0,
            'circle-stroke-opacity': visible ? 1 : 0
          }
        });
      }
    };

    const init = async () => {
      addLayers();
      await fetchFirmsData();
      if (!destroyed) {
        intervalId = setInterval(fetchFirmsData, POLL_INTERVAL_MS);
      }
    };

    init();

    return () => {
      destroyed = true;
      clearInterval(intervalId);
      if (map.getLayer(POINT_LAYER_ID)) map.removeLayer(POINT_LAYER_ID);
      if (map.getLayer(HEATMAP_LAYER_ID)) map.removeLayer(HEATMAP_LAYER_ID);
      if (map.getSource(SOURCE_ID)) map.removeSource(SOURCE_ID);
    };
  }, [map]);

  useEffect(() => {
    if (!map) return;
    if (map.getLayer(HEATMAP_LAYER_ID)) {
      map.setPaintProperty(HEATMAP_LAYER_ID, 'heatmap-opacity', visible ? 0.8 : 0);
    }
    if (map.getLayer(POINT_LAYER_ID)) {
      map.setPaintProperty(POINT_LAYER_ID, 'circle-opacity', visible ? 1 : 0);
      map.setPaintProperty(POINT_LAYER_ID, 'circle-stroke-opacity', visible ? 1 : 0);
    }
  }, [visible, map]);

  return (
    <div style={{ position: 'absolute', bottom: '12px', right: '140px', zIndex: 9 }}>
      {tierInfo && visible && (
        <SourceBadge
          source={tierInfo.source}
          year={tierInfo.year}
          tier={tierInfo.tier}
          timestamp={tierInfo.timestamp}
        />
      )}
    </div>
  );
};

export default FirmsLayer;

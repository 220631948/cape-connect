/**
 * POPIA ANNOTATION
 * Personal data handled: None (Traffic data is highly aggregated incident reporting)
 * Purpose: Open data visualization for logistics and public awareness
 * Lawful basis: N/A - Not personal data
 * Retention: Indefinite (open data)
 * Subject rights: N/A
 * POPIA risk level: LOW
 * Review date: 2026-06-01
 */

/**
 * @file src/components/map/layers/TrafficLayer.tsx
 * @description MapLibre Layer for TomTom Traffic Incidents with Three-Tier Fallback.
 * @compliance Rule 1: SourceBadge always visible. Rule 2: LIVE→CACHED→MOCK fallback via /api/traffic.
 */

'use client';

import React, { useEffect, useState } from 'react';
import maplibregl from 'maplibre-gl';
import SourceBadge from '@/components/ui/SourceBadge';

const SOURCE_ID = 'tomtom-traffic-source';
const LINE_LAYER_ID = 'tomtom-traffic-line';
const POLL_INTERVAL_MS = 60_000 * 5; // 5 mins

interface TrafficLayerProps {
  map: maplibregl.Map | null;
  visible?: boolean;
}

interface TrafficTier {
  source: string;
  year: number;
  tier: 'LIVE' | 'CACHED' | 'MOCK';
  timestamp?: string;
  data: GeoJSON.FeatureCollection;
}

export const TrafficLayer: React.FC<TrafficLayerProps> = ({ map, visible = false }) => {
  const [tierInfo, setTierInfo] = useState<TrafficTier | null>(null);

  useEffect(() => {
    if (!map) return;
    let destroyed = false;
    let intervalId: ReturnType<typeof setInterval>;

    const fetchTrafficData = async () => {
      if (destroyed) return;
      try {
        const res = await fetch('/api/traffic');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json: TrafficTier = await res.json();
        
        if (destroyed) return;

        setTierInfo(json);
        const source = map.getSource(SOURCE_ID) as maplibregl.GeoJSONSource;
        if (source) {
          source.setData(json.data);
        }
      } catch (err) {
        console.error('Failed to load Traffic layer', err);
      }
    };

    const addLayers = () => {
      if (!map.getSource(SOURCE_ID)) {
        map.addSource(SOURCE_ID, {
          type: 'geojson',
          data: { type: 'FeatureCollection', features: [] }
        });
      }

      if (!map.getLayer(LINE_LAYER_ID)) {
        map.addLayer({
          id: LINE_LAYER_ID,
          type: 'line',
          source: SOURCE_ID,
          layout: {
            'line-join': 'round',
            'line-cap': 'round'
          },
          paint: {
            'line-color': [
              'match',
              ['get', 'magnitudeOfDelay'],
              1, '#facc15', // minor = yellow
              2, '#f97316', // moderate = orange
              3, '#ef4444', // major = red
              4, '#b91c1c', // severe = dark red
              '#9ca3af' // unknown = gray
            ],
            'line-width': ['interpolate', ['linear'], ['zoom'], 10, 3, 16, 8],
            'line-opacity': visible ? 0.9 : 0
          }
        });
      }
    };

    const init = async () => {
      addLayers();
      await fetchTrafficData();
      if (!destroyed) {
        intervalId = setInterval(fetchTrafficData, POLL_INTERVAL_MS);
      }
    };

    init();

    return () => {
      destroyed = true;
      clearInterval(intervalId);
      if (map.getLayer(LINE_LAYER_ID)) map.removeLayer(LINE_LAYER_ID);
      if (map.getSource(SOURCE_ID)) map.removeSource(SOURCE_ID);
    };
  }, [map]);

  useEffect(() => {
    if (!map) return;
    if (map.getLayer(LINE_LAYER_ID)) {
      map.setPaintProperty(LINE_LAYER_ID, 'line-opacity', visible ? 0.9 : 0);
    }
  }, [visible, map]);

  return (
    <div style={{ position: 'absolute', bottom: '12px', right: '280px', zIndex: 8 }}>
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

export default TrafficLayer;

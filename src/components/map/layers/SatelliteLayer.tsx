/**
 * POPIA ANNOTATION
 * Personal data handled: None (Optical remote sensing > 10m resolution does not reveal identifiable individuals)
 * Purpose: Environmental monitoring and agricultural NDVI analysis
 * Lawful basis: N/A - Not personal data
 * Retention: Indefinite (satellite baseline archives)
 * Subject rights: N/A
 * POPIA risk level: LOW
 * Review date: 2026-06-01
 */

/**
 * @file src/components/map/layers/SatelliteLayer.tsx
 * @description MapLibre Layer for Copernicus Sentinel-2 imagery with Three-Tier Fallback.
 * @compliance Rule 1: SourceBadge always visible. Rule 2: LIVE→CACHED→MOCK fallback via /api/satellite.
 */

'use client';

import React, { useEffect, useState } from 'react';
import maplibregl from 'maplibre-gl';
import SourceBadge from '@/components/ui/SourceBadge';

// ─── Constants ───────────────────────────────────────────────────────────────

const SOURCE_ID = 'sentinel-raster-source';
const RASTER_LAYER_ID = 'sentinel-raster-layer';

// ─── Types ───────────────────────────────────────────────────────────────────

interface SatelliteLayerProps {
  map: maplibregl.Map | null;
  visible?: boolean;
}

interface SatelliteTier {
  source: string;
  year: number;
  tier: 'LIVE' | 'CACHED' | 'MOCK';
  timestamp?: string;
  data: {
    tileUrl: string;
  };
}

// ─── Component ───────────────────────────────────────────────────────────────

export const SatelliteLayer: React.FC<SatelliteLayerProps> = ({
  map,
  visible = false,
}) => {
  const [tierInfo, setTierInfo] = useState<SatelliteTier | null>(null);

  useEffect(() => {
    if (!map) return;
    let destroyed = false;

    // Fetch the tile URL from our API
    const fetchTiles = async () => {
      if (destroyed) return;
      try {
        const res = await fetch('/api/satellite');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json: SatelliteTier = await res.json();

        if (destroyed) return;

        setTierInfo(json);

        // Add source if not exists
        if (!map.getSource(SOURCE_ID)) {
          map.addSource(SOURCE_ID, {
            type: 'raster',
            tiles: [json.data.tileUrl],
            tileSize: 256,
            // To ensure it doesn't try to load too high zooms
            maxzoom: 18
          });
        } else {
          // If source exists, and we want to update tiles, in MapLibre
          // we technically have to remove and re-add or use setStyle
          // For simplicity here, we assume it's set once per session.
        }

        // Add layer if not exists
        if (!map.getLayer(RASTER_LAYER_ID)) {
          // Add it below other symbols if possible, but for satellite it acts as a base layer.
          // MapLibre doesn't have a reliable 'bottom' layer unless we find the first symbol layer.
          const layers = map.getStyle().layers;
          let firstSymbolId;
          for (let i = 0; i < layers.length; i++) {
            if (layers[i].type === 'symbol') {
              firstSymbolId = layers[i].id;
              break;
            }
          }

          map.addLayer({
            id: RASTER_LAYER_ID,
            type: 'raster',
            source: SOURCE_ID,
            minzoom: 0,
            maxzoom: 22,
            paint: {
              'raster-opacity': visible ? 1.0 : 0.0,
              'raster-fade-duration': 300
            }
          }, firstSymbolId);
        }

      } catch (err) {
        console.error('Failed to load satellite layer', err);
      }
    };

    fetchTiles();

    return () => {
      destroyed = true;
      if (map.getLayer(RASTER_LAYER_ID)) map.removeLayer(RASTER_LAYER_ID);
      if (map.getSource(SOURCE_ID)) map.removeSource(SOURCE_ID);
    };
  }, [map]); // Init only once

  // Visibility toggle
  useEffect(() => {
    if (!map) return;
    if (map.getLayer(RASTER_LAYER_ID)) {
      map.setPaintProperty(RASTER_LAYER_ID, 'raster-opacity', visible ? 1.0 : 0);
    }
  }, [visible, map]);

  // Render SourceBadge
  return (
    <div style={{ position: 'absolute', bottom: '12px', right: '280px', zIndex: 9 }}>
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

export default SatelliteLayer;

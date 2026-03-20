/**
 * @file src/components/map/layers/ZoningLayer.tsx
 * @description MapLibre Layer for IZS Zoning Polygons.
 * @compliance POPIA: Handling municipal zoning data visualization.
 */

'use client';

import React, { useEffect, useState } from 'react';
import maplibregl from 'maplibre-gl';
import SourceBadge from '@/components/ui/SourceBadge';

interface ZoningLayerProps {
  map: maplibregl.Map | null;
  visible?: boolean;
}

interface ZoningTier {
  source: string;
  year: number;
  tier: 'LIVE' | 'CACHED' | 'MOCK';
}

const ZONING_PALETTE = {
  R1: '#4CAF50',
  R2: '#66BB6A',
  GR1: '#81C784',
  GR3: '#A5D6A7',
  GB1: '#42A5F5',
  GB3: '#64B5F6',
  MU1: '#FFA726',
  MU2: '#FFB74D',
  GI1: '#BDBDBD',
  CO: '#CE93D8',
  OS1: '#80CBC4',
  AG: '#8D6E63',
  TR: '#90A4AE',
  SZ: '#FFD54F',
  default: '#757575',
};

export const ZoningLayer: React.FC<ZoningLayerProps> = ({ map, visible = true }) => {
  const [zoningTier, setZoningTier] = useState<ZoningTier | null>(null);

  useEffect(() => {
    if (!map) return;

    const sourceId = 'izs-zones';
    const layerId = 'izs-zones-fill';

    const loadData = async () => {
      try {
        const response = await fetch('/api/zoning');
        const result = await response.json();
        
        setZoningTier({
          source: result.source,
          year: result.year,
          tier: result.tier,
        });

        if (!map.getSource(sourceId)) {
          map.addSource(sourceId, {
            type: 'geojson',
            data: result.data,
          });

          map.addLayer({
            id: layerId,
            type: 'fill',
            source: sourceId,
            paint: {
              'fill-color': [
                'match',
                ['get', 'zone_code'],
                'R1', ZONING_PALETTE.R1,
                'R2', ZONING_PALETTE.R2,
                'GR1', ZONING_PALETTE.GR1,
                'GR3', ZONING_PALETTE.GR3,
                'GB1', ZONING_PALETTE.GB1,
                'GB3', ZONING_PALETTE.GB3,
                'MU1', ZONING_PALETTE.MU1,
                'MU2', ZONING_PALETTE.MU2,
                'GI1', ZONING_PALETTE.GI1,
                'CO', ZONING_PALETTE.CO,
                'OS1', ZONING_PALETTE.OS1,
                'AG', ZONING_PALETTE.AG,
                'TR', ZONING_PALETTE.TR,
                'SZ', ZONING_PALETTE.SZ,
                ZONING_PALETTE.default,
              ],
              'fill-opacity': visible ? 0.6 : 0,
              'fill-outline-color': '#ffffff',
            },
          });
        }
      } catch (error) {
        console.error('Failed to load zoning data:', error);
      }
    };

    loadData();

    // 4. Click Handler for Popups
    const onClick = (e: maplibregl.MapMouseEvent & { features?: any[] }) => {
      if (!e.features || e.features.length === 0) return;
      
      const feature = e.features[0];
      const { zone_code, zone_name, sub_zone } = feature.properties;

      new maplibregl.Popup({ className: 'neumorphic-popup' })
        .setLngLat(e.lngLat)
        .setHTML(`
          <div style="padding: 10px; font-family: sans-serif;">
            <strong style="display: block; font-size: 14px; margin-bottom: 4px;">Zone: ${zone_code}</strong>
            <span style="display: block; font-size: 12px; color: #4a5568;">${zone_name || 'IZS Zone'}</span>
            <em style="display: block; font-size: 11px; color: #718096; margin-top: 4px;">${sub_zone || ''}</em>
          </div>
        `)
        .addTo(map);
    };

    map.on('click', layerId, onClick);
    map.on('mouseenter', layerId, () => (map.getCanvas().style.cursor = 'pointer'));
    map.on('mouseleave', layerId, () => (map.getCanvas().style.cursor = ''));

    return () => {
      if (map.getLayer(layerId)) map.removeLayer(layerId);
      if (map.getSource(sourceId)) map.removeSource(sourceId);
      map.off('click', layerId, onClick);
    };
  }, [map, visible]);

  // Update visibility without re-adding layer
  useEffect(() => {
    if (!map || !map.getLayer('izs-zones-fill')) return;
    map.setPaintProperty('izs-zones-fill', 'fill-opacity', visible ? 0.6 : 0);
  }, [visible, map]);

  return (
    <div style={{ position: 'absolute', bottom: '12px', right: '12px', zIndex: 10 }}>
      {zoningTier && visible && (
        <SourceBadge
          source={zoningTier.source}
          year={zoningTier.year}
          tier={zoningTier.tier}
        />
      )}
    </div>
  );
};

export default ZoningLayer;

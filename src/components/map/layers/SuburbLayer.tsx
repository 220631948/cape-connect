/**
 * @file src/components/map/layers/SuburbLayer.tsx
 * @description MapLibre Layer for Cape Town Suburb Boundaries.
 * @compliance POPIA: Handling municipal boundary data visualization.
 */

'use client';

import React, { useEffect } from 'react';
import maplibregl from 'maplibre-gl';

interface SuburbLayerProps {
  map: maplibregl.Map | null;
  visible?: boolean;
}

export const SuburbLayer: React.FC<SuburbLayerProps> = ({ map, visible = true }) => {
  useEffect(() => {
    if (!map) return;

    const sourceId = 'suburbs';
    const layerId = 'suburbs-fill';
    const labelId = 'suburbs-label';

    const loadData = async () => {
      try {
        const response = await fetch('/api/suburbs');
        const result = await response.json();
        
        if (!map.getSource(sourceId)) {
          map.addSource(sourceId, {
            type: 'geojson',
            data: result.data,
          });

          // Fill Layer (outline built-in via fill-outline-color)
          map.addLayer({
            id: layerId,
            type: 'fill',
            source: sourceId,
            paint: {
              'fill-color': '#718096',
              'fill-opacity': visible ? 0.1 : 0,
              'fill-outline-color': '#a0aec0',
            },
          });

          // Label Layer
          map.addLayer({
            id: labelId,
            type: 'symbol',
            source: sourceId,
            layout: {
              'text-field': ['get', 'name'],
              'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
              'text-size': 12,
              'text-anchor': 'center',
              'visibility': visible ? 'visible' : 'none',
            },
            paint: {
              'text-color': '#e2e8f0',
              'text-halo-color': '#1a202c',
              'text-halo-width': 1,
            },
          });
        }
      } catch (error) {
        console.error('Failed to load suburb data:', error);
      }
    };

    loadData();

    return () => {
      if (map.getLayer(layerId)) map.removeLayer(layerId);
      if (map.getLayer(labelId)) map.removeLayer(labelId);
      if (map.getSource(sourceId)) map.removeSource(sourceId);
    };
  }, [map, visible]);

  // Update visibility without re-adding layer
  useEffect(() => {
    if (!map) return;
    if (map.getLayer('suburbs-fill')) {
      map.setPaintProperty('suburbs-fill', 'fill-opacity', visible ? 0.1 : 0);
    }
    if (map.getLayer('suburbs-label')) {
      map.setLayoutProperty('suburbs-label', 'visibility', visible ? 'visible' : 'none');
    }
  }, [visible, map]);

  return null;
};

export default SuburbLayer;

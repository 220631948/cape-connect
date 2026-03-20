/**
 * @file src/components/map/layers/BufferLayer.tsx
 * @description Renders a turf.js buffered polygon over the map.
 * @compliance POPIA: Rendering transient user-defined geometries.
 */

'use client';

import React, { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';

interface BufferLayerProps {
  map: maplibregl.Map | null;
  feature: any | null; // GeoJSON feature (Polygon/MultiPolygon)
  visible?: boolean;
}

const SOURCE_ID = 'buffer-source';
const FILL_LAYER_ID = 'buffer-fill';
const OUTLINE_LAYER_ID = 'buffer-outline';

export const BufferLayer: React.FC<BufferLayerProps> = ({ map, feature, visible = true }) => {
  const sourceAdded = useRef(false);

  useEffect(() => {
    if (!map) return;

    if (!map.getSource(SOURCE_ID)) {
      map.addSource(SOURCE_ID, {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] }
      });
      sourceAdded.current = true;
    }

    if (!map.getLayer(FILL_LAYER_ID)) {
      map.addLayer({
        id: FILL_LAYER_ID,
        type: 'fill',
        source: SOURCE_ID,
        paint: {
          'fill-color': '#fbb03b',
          'fill-opacity': 0.2,
          'fill-outline-color': '#fbb03b'
        }
      });
    }

    if (!map.getLayer(OUTLINE_LAYER_ID)) {
      map.addLayer({
        id: OUTLINE_LAYER_ID,
        type: 'line',
        source: SOURCE_ID,
        paint: {
          'line-color': '#fbb03b',
          'line-width': 2,
          'line-dasharray': [2, 2]
        }
      });
    }

    return () => {
      // Don't remove source/layers on every unmount if we plan to reuse them rapidly,
      // but typical cleanup dictates we should. Since this gets mounted/unmounted
      // based on selection, let's clean up safely.
      if (map.getStyle()) {
        if (map.getLayer(FILL_LAYER_ID)) map.removeLayer(FILL_LAYER_ID);
        if (map.getLayer(OUTLINE_LAYER_ID)) map.removeLayer(OUTLINE_LAYER_ID);
        if (map.getSource(SOURCE_ID)) map.removeSource(SOURCE_ID);
      }
      sourceAdded.current = false;
    };
  }, [map]);

  useEffect(() => {
    if (!map || !sourceAdded.current) return;
    const source = map.getSource(SOURCE_ID) as maplibregl.GeoJSONSource;
    if (source) {
      if (feature && visible) {
        source.setData(feature);
      } else {
        source.setData({ type: 'FeatureCollection', features: [] });
      }
    }
  }, [map, feature, visible]);

  return null;
};

export default BufferLayer;

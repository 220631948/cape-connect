'use client';

import React, { useEffect } from 'react';
import maplibregl from 'maplibre-gl';
import { Protocol } from 'pmtiles';

interface CogLayerProps {
  map: maplibregl.Map | null;
  visible?: boolean;
  tileUrl?: string; // Path to .pmtiles file on cloud storage
  date?: string;    // Selected date from STAC
}

const SOURCE_ID = 'cog-pmtiles-source';
const LAYER_ID = 'cog-pmtiles-layer';

export const CogLayer: React.FC<CogLayerProps> = ({
  map,
  visible = false,
  tileUrl,
  date,
}) => {
  useEffect(() => {
    if (!map || !tileUrl) return;

    // Register pmtiles protocol if not already done
    const protocol = new Protocol();
    // MapLibre addProtocol expects (request, abortController) => Promise
    maplibregl.addProtocol('pmtiles', (requestParameters, abortController) => {
      return protocol.tile(requestParameters, abortController);
    });

    const fullUrl = `pmtiles://${tileUrl}`;

    const addLayer = () => {
      // Cleanup existing source/layer if any
      if (map.getLayer(LAYER_ID)) map.removeLayer(LAYER_ID);
      if (map.getSource(SOURCE_ID)) map.removeSource(SOURCE_ID);

      map.addSource(SOURCE_ID, {
        type: 'raster',
        url: fullUrl,
        tileSize: 256,
      });

      // Find the first symbol layer to place the raster under it (like labels)
      const layers = map.getStyle().layers;
      let firstSymbolId;
      if (layers) {
        for (const layer of layers) {
          if (layer.type === 'symbol') {
            firstSymbolId = layer.id;
            break;
          }
        }
      }

      map.addLayer({
        id: LAYER_ID,
        type: 'raster',
        source: SOURCE_ID,
        paint: {
          'raster-opacity': visible ? 1.0 : 0,
          'raster-fade-duration': 300,
        },
      }, firstSymbolId);
    };

    if (map.isStyleLoaded()) {
      addLayer();
    } else {
      map.once('load', addLayer);
    }

    return () => {
      if (map.getLayer(LAYER_ID)) map.removeLayer(LAYER_ID);
      if (map.getSource(SOURCE_ID)) map.removeSource(SOURCE_ID);
    };
  }, [map, tileUrl, date]);

  useEffect(() => {
    if (!map) return;
    if (map.getLayer(LAYER_ID)) {
      map.setPaintProperty(LAYER_ID, 'raster-opacity', visible ? 1.0 : 0);
    }
  }, [visible, map]);

  return null;
};

export default CogLayer;

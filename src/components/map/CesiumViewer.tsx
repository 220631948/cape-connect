/**
 * @file src/components/map/CesiumViewer.tsx
 * @description Standard 3D Visualization using CesiumJS.
 * @compliance POPIA: Immersive spatial visualization with 3D buildings and terrain.
 */

'use client';

import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { 
  Viewer, 
  Ion, 
  createWorldTerrainAsync, 
  OpenStreetMapImageryProvider,
  Cartesian3,
  Color,
  createOsmBuildingsAsync,
  Math as CesiumMath
} from 'cesium';
import 'cesium/Build/Cesium/Widgets/widgets.css';
import SourceBadge from '../ui/SourceBadge';

// Cesium Base URL for assets
if (typeof window !== 'undefined') {
  (window as any).CESIUM_BASE_URL = '/cesium';
}

export interface CesiumRef {
  getViewer: () => Viewer | null;
}

interface CesiumViewerProps {
  className?: string;
  ionToken?: string;
  initialViewport?: {
    lng: number;
    lat: number;
    height: number;
    heading?: number;
    pitch?: number;
  };
  onReady?: (viewer: Viewer) => void;
}

const INITIAL_CENTER = Cartesian3.fromDegrees(18.4241, -33.9249, 15000);

export const CesiumViewer = forwardRef<CesiumRef, CesiumViewerProps>(({
  className,
  ionToken,
  initialViewport,
  onReady
}, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Viewer | null>(null);

  useImperativeHandle(ref, () => ({
    getViewer: () => viewerRef.current
  }));

  useEffect(() => {
    if (!containerRef.current || viewerRef.current) return;

    if (ionToken) {
      Ion.defaultAccessToken = ionToken;
    }

    const initCesium = async () => {
      const terrainProvider = await createWorldTerrainAsync();
      
      const viewer = new Viewer(containerRef.current!, {
        terrainProvider,
        baseLayer: false, // We'll add our own or use OSM
        geocoder: false,
        homeButton: false,
        sceneModePicker: false,
        navigationHelpButton: false,
        animation: false,
        timeline: false,
        fullscreenButton: false,
        infoBox: false,
        selectionIndicator: false,
      });

      // Add OSM Imagery as base
      viewer.imageryLayers.addImageryProvider(new OpenStreetMapImageryProvider({
        url: 'https://a.tile.openstreetmap.org/'
      }));

      // Add OSM Buildings
      const buildings = await createOsmBuildingsAsync();
      viewer.scene.primitives.add(buildings);

      // Set initial view
      if (initialViewport) {
        viewer.camera.setView({
          destination: Cartesian3.fromDegrees(
            initialViewport.lng, 
            initialViewport.lat, 
            initialViewport.height
          ),
          orientation: {
            heading: CesiumMath.toRadians(initialViewport.heading ?? 0.0),
            pitch: CesiumMath.toRadians(initialViewport.pitch ?? -90.0),
            roll: 0.0
          }
        });
      } else {
        viewer.camera.setView({
          destination: INITIAL_CENTER,
          orientation: {
            heading: 0.0,
            pitch: -Math.PI / 2,
            roll: 0.0
          }
        });
      }

      viewerRef.current = viewer;
      onReady?.(viewer);
    };

    initCesium();

    return () => {
      if (viewerRef.current) {
        viewerRef.current.destroy();
        viewerRef.current = null;
      }
    };
  }, [ionToken]);

  return (
    <div 
      ref={containerRef} 
      className={className} 
      style={{ width: '100%', height: '100%', position: 'relative' }} 
    >
      <div style={{ position: 'absolute', bottom: '12px', left: '12px', zIndex: 10 }}>
        <SourceBadge source="CesiumJS" year={2026} tier="LIVE" />
      </div>
    </div>
  );
});

export default CesiumViewer;

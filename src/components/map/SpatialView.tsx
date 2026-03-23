/**
 * @file src/components/map/SpatialView.tsx
 * @description Hybrid 2D/3D View Orchestrator.
 * @compliance Rule 2: Three-Tier Fallback for 3D data. Rule 4: RLS isolation.
 */

'use client';

import React, { useState, useRef, useEffect } from 'react';
import MapContainer, { MapRef } from './MapContainer';
import CesiumViewer, { CesiumRef } from './CesiumViewer';
import { syncCesiumToMapLibre, syncMapLibreToCesium, zoomToHeight } from './CameraSync';
import { Viewer } from 'cesium';
import maplibregl from 'maplibre-gl';
import CesiumFlightLayer from './layers/CesiumFlightLayer';
import { useUrlState, ViewportState } from '@/hooks/useUrlState';
import CopilotPanel from '@/components/copilot/CopilotPanel';
import TemporalScrubber from './controls/TemporalScrubber';

export type ViewMode = '2d' | '3d' | 'hybrid';

interface SpatialViewProps {
  className?: string;
  showZoning?: boolean;
  showSuburbs?: boolean;
  showDraw?: boolean;
  showFlights?: boolean;
  showSatellite?: boolean;
  showFirms?: boolean;
  showTraffic?: boolean;
  onFeatureCreate?: (feature: any) => void;
  bufferedFeature?: any | null;
}

export const SpatialView: React.FC<SpatialViewProps> = ({
  className,
  showZoning: initialShowZoning,
  showSuburbs: initialShowSuburbs,
  showDraw,
  showFlights: initialShowFlights,
  showSatellite = false,
  showFirms = false,
  showTraffic = false,
  onFeatureCreate,
  bufferedFeature,
}) => {
  const { getInitialState, updateUrl } = useUrlState();
  const urlState = getInitialState();

  const [mode, setMode] = useState<ViewMode>('2d');
  const [syncEnabled, setSyncEnabled] = useState(true);

  // Layer toggles synced with URL
  const [showZoning, setShowZoning] = useState(urlState.layers.zoning);
  const [showSuburbs, setShowSuburbs] = useState(urlState.layers.suburbs);
  const [showFlights, setShowFlights] = useState(urlState.layers.flights);

  const mapRef = useRef<MapRef>(null);
  const cesiumRef = useRef<CesiumRef>(null);

  // Cog/STAC state
  const [selectedStac, setSelectedStac] = useState<any>(null);
  const [showCogs, setShowCogs] = useState(false);
  const [showCopilot, setShowCopilot] = useState(false);
  const [mapCenter, setMapCenter] = useState<{ lng: number; lat: number }>({ lng: 18.4241, lat: -33.9249 });

  const [mapInstance, setMapInstance] = useState<maplibregl.Map | null>(null);
  const [cesiumInstance, setCesiumInstance] = useState<Viewer | null>(null);

  // Sync logic
  useEffect(() => {
    if (!syncEnabled || !mapInstance || !cesiumInstance) return;

    let isSyncing = false;

    const handleMapMove = () => {
      if (isSyncing || mode !== '2d') return;
      isSyncing = true;
      syncCesiumToMapLibre(mapInstance, cesiumInstance);
      isSyncing = false;
    };

    const handleCesiumMove = () => {
      if (isSyncing || mode === '2d') return;
      isSyncing = true;
      syncMapLibreToCesium(cesiumInstance, mapInstance);
      isSyncing = false;
    };

    mapInstance.on('move', handleMapMove);
    mapInstance.on('moveend', () => {
      const center = mapInstance.getCenter();
      const viewport: ViewportState = {
        lng: center.lng,
        lat: center.lat,
        zoom: mapInstance.getZoom(),
        pitch: mapInstance.getPitch(),
        bearing: mapInstance.getBearing()
      };
      updateUrl(viewport, { zoning: showZoning, flights: showFlights, suburbs: showSuburbs, firms: showFirms, traffic: showTraffic });
    });

    // Cesium listener management
    // We add a listener and get back the remove function
    const removeCesiumListener = cesiumInstance.camera.moveEnd.addEventListener(handleCesiumMove);

    return () => {
      mapInstance.off('move', handleMapMove);
      // Call the returned function to remove listener, safely handling Cesium's Event typings
      if (typeof removeCesiumListener === 'function') {
        removeCesiumListener();
      }
    };
  }, [mapInstance, cesiumInstance, syncEnabled, mode, showZoning, showFlights, showSuburbs, showFirms, showTraffic, updateUrl]);

  // Track map center for copilot context
  useEffect(() => {
    if (!mapInstance) return;
    const updateCenter = () => {
      const center = mapInstance.getCenter();
      setMapCenter({ lng: parseFloat(center.lng.toFixed(6)), lat: parseFloat(center.lat.toFixed(6)) });
    };
    mapInstance.on('moveend', updateCenter);
    return () => { mapInstance.off('moveend', updateCenter); };
  }, [mapInstance]);

  return (
    <div className={`relative w-full h-full ${className}`}>
      {/* Mode Toggle Overlay */}
      <div className="absolute top-4 left-4 z-20 flex gap-2">
        {(['2d', '3d', 'hybrid'] as ViewMode[]).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`px-3 py-1 text-xs font-bold rounded-full border-2 transition-all ${
              mode === m
                ? 'bg-emerald-500 border-emerald-400 text-white shadow-lg'
                : 'bg-slate-800/80 border-slate-600 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {m.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Copilot Toggle Button */}
      <button
        onClick={() => setShowCopilot(!showCopilot)}
        className={`absolute top-4 right-4 z-20 px-3 py-1 text-xs font-bold rounded-full border-2 transition-all ${
          showCopilot
            ? 'bg-blue-500 border-blue-400 text-white shadow-lg'
            : 'bg-slate-800/80 border-slate-600 text-slate-300 hover:bg-slate-700'
        }`}
        title="Toggle GIS Copilot"
      >
        🧭 Copilot
      </button>

      {/* Temporal Scrubber Control */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 w-80">
        <TemporalScrubber 
          onDateChange={setSelectedStac} 
        />
        <div className="mt-2 flex justify-center">
          <button
            onClick={() => setShowCogs(!showCogs)}
            className={`px-3 py-1 text-[10px] font-black uppercase tracking-tighter rounded border transition-all ${
              showCogs 
                ? 'bg-crayon-pink border-crayon-pink text-white shadow-[0_0_15px_rgba(255,100,200,0.5)]'
                : 'bg-slate-900 border-slate-700 text-slate-400'
            }`}
          >
            {showCogs ? '🚀 Offload ACTIVE' : '☁️ Offload Layer'}
          </button>
        </div>
      </div>

      {/* 3D Layer (Cesium) */}
      {(mode === '3d' || mode === 'hybrid') && (
        <div className="absolute inset-0 z-0">
          <CesiumViewer
            ref={cesiumRef}
            initialViewport={urlState.viewport ? {
              lng: urlState.viewport.lng,
              lat: urlState.viewport.lat,
              height: zoomToHeight(urlState.viewport.zoom),
              heading: urlState.viewport.bearing,
              pitch: urlState.viewport.pitch - 90
            } : undefined}
            onReady={setCesiumInstance}
            cogUrl={selectedStac?.assets.data.href}
            showCogs={showCogs}
          />
          <CesiumFlightLayer
            viewer={cesiumInstance}
            visible={showFlights}
          />
        </div>
      )}

      {/* 2D Layer (MapLibre) */}
      <div
        className="absolute inset-0"
        style={{
          zIndex: mode === '2d' ? 10 : (mode === 'hybrid' ? 5 : -1),
          pointerEvents: mode === '3d' ? 'none' : 'auto'
        }}
      >
        <MapContainer
          ref={mapRef}
          initialViewport={urlState.viewport || undefined}
          showZoning={showZoning}
          showSuburbs={showSuburbs}
          showDraw={showDraw}
          showFlights={showFlights}
          showSatellite={showSatellite}
          showFirms={showFirms}
          showTraffic={showTraffic}
          onFeatureCreate={onFeatureCreate}
          bufferedFeature={bufferedFeature}
          transparent={mode === 'hybrid'}
          style={{ background: mode === 'hybrid' ? 'transparent' : undefined }}
          cogUrl={selectedStac?.assets.data.href}
          showCogs={showCogs}
        />
        {/* GIS Copilot floating overlay */}
        <CopilotPanel
          isOpen={showCopilot}
          onClose={() => setShowCopilot(false)}
          mapCenter={mapCenter}
        />
      </div>
    </div>
  );
};

export default SpatialView;

/**
 * @file src/hooks/useUrlState.ts
 * @description Persists map viewport and layer state in the URL.
 * @compliance POPIA: No personal data in URL parameters.
 */

'use client';

import { useEffect, useCallback } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';

export interface ViewportState {
  lng: number;
  lat: number;
  zoom: number;
  pitch: number;
  bearing: number;
}

export interface LayerState {
  zoning: boolean;
  flights: boolean;
  suburbs: boolean;
  firms?: boolean;
  traffic?: boolean;
}

export function useUrlState() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // 1. Initial State from URL
  const getInitialState = useCallback(() => {
    const v = searchParams.get('v')?.split(',').map(Number);
    const l = searchParams.get('l')?.split(',');

    const viewport: ViewportState | null = v && v.length === 5 ? {
      lng: v[0],
      lat: v[1],
      zoom: v[2],
      pitch: v[3],
      bearing: v[4]
    } : null;

    const layerSet = l != null ? new Set(l) : undefined;
    const layers: LayerState = {
      zoning: layerSet ? layerSet.has('z') : true,
      flights: layerSet ? layerSet.has('f') : true,
      suburbs: layerSet ? layerSet.has('s') : true,
      firms: layerSet ? layerSet.has('m') : false,
      traffic: layerSet ? layerSet.has('t') : false,
    };

    return { viewport, layers };
  }, [searchParams]);

  // 2. Update URL (Debounced)
  const updateUrl = useCallback((viewport: ViewportState, layers: LayerState) => {
    const params = new URLSearchParams(searchParams.toString());

    // Viewport
    params.set('v', [
      viewport.lng.toFixed(4),
      viewport.lat.toFixed(4),
      viewport.zoom.toFixed(1),
      viewport.pitch.toFixed(0),
      viewport.bearing.toFixed(0)
    ].join(','));

    // Layers
    const activeLayers: string[] = [];
    if (layers.zoning) activeLayers.push('z');
    if (layers.flights) activeLayers.push('f');
    if (layers.suburbs) activeLayers.push('s');
    if (layers.firms) activeLayers.push('m');
    if (layers.traffic) activeLayers.push('t');
    params.set('l', activeLayers.join(','));

    // Push to history without full navigation
    window.history.replaceState(null, '', `${pathname}?${params.toString()}`);
  }, [pathname, searchParams]);

  return { getInitialState, updateUrl };
}

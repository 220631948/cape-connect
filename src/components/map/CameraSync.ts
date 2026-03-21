/**
 * @file src/components/map/CameraSync.ts
 * @description Camera synchronization utilities for CesiumJS and MapLibre.
 * @compliance POPIA: Synchronized spatial intelligence viewing.
 */

import { Cartesian3, Viewer, Math as CesiumMath } from 'cesium';
import maplibregl from 'maplibre-gl';

export interface CameraState {
  lng: number;
  lat: number;
  height: number;
  heading: number; // radians
  pitch: number;   // radians
}

/**
 * Empirical Height <-> Zoom mapping for Cape Town
 */
export const heightToZoom = (heightMeters: number): number => {
  const referenceHeight = 15000; // meters
  const referenceZoom = 11;
  return referenceZoom + Math.log2(referenceHeight / heightMeters);
};

export const zoomToHeight = (zoom: number): number => {
  const referenceHeight = 15000;
  const referenceZoom = 11;
  return referenceHeight / Math.pow(2, zoom - referenceZoom);
};

/**
 * Sync MapLibre Camera to Cesium Camera State
 */
export const syncMapLibreToCesium = (
  cesiumViewer: Viewer,
  maplibreMap: maplibregl.Map
) => {
  const camera = cesiumViewer.camera;
  const cartographic = camera.positionCartographic;

  const lng = CesiumMath.toDegrees(cartographic.longitude);
  const lat = CesiumMath.toDegrees(cartographic.latitude);
  const height = cartographic.height;
  const heading = CesiumMath.toDegrees(camera.heading);
  const pitch = CesiumMath.toDegrees(camera.pitch);

  const zoom = heightToZoom(height);

  maplibreMap.jumpTo({
    center: [lng, lat],
    zoom: zoom,
    bearing: heading,
    pitch: pitch + 90, // MapLibre pitch is relative to horizon (0-85), Cesium is relative to nadir
  });
};

/**
 * Sync Cesium Camera to MapLibre Camera State
 */
export const syncCesiumToMapLibre = (
  maplibreMap: maplibregl.Map,
  cesiumViewer: Viewer
) => {
  const center = maplibreMap.getCenter();
  const zoom = maplibreMap.getZoom();
  const heading = maplibreMap.getBearing();
  const pitch = maplibreMap.getPitch();

  const height = zoomToHeight(zoom);

  cesiumViewer.camera.setView({
    destination: Cartesian3.fromDegrees(center.lng, center.lat, height),
    orientation: {
      heading: CesiumMath.toRadians(heading),
      pitch: CesiumMath.toRadians(pitch - 90),
      roll: 0.0
    }
  });
};

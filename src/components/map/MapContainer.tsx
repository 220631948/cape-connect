/**
 * MapContainer.tsx
 * ================
 * High-performance MapLibre GL JS Container
 *
 * Features:
 * - Single-instance initialization with ref guard
 * - Lifecycle cleanup (map.remove)
 * - CartoDB Dark Matter basemap
 * - Western Cape bounding box enforcement
 * - Initial view centered on Cape Town CBD
 * - Layer injection for IZS Zoning
 *
 * @compliance POPIA: Map viewport constraints enforced to geographic remit.
 */

'use client';

import React, {forwardRef, useEffect, useImperativeHandle, useRef, useState} from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import ZoningLayer from './layers/ZoningLayer';
import FlightLayer from './layers/FlightLayer';
import SatelliteLayer from './layers/SatelliteLayer';
import FirmsLayer from './layers/FirmsLayer';
import TrafficLayer from './layers/TrafficLayer';
import SuburbLayer from './layers/SuburbLayer';
import DrawControl from './controls/DrawControl';
import GeolocationControl from './controls/GeolocationControl';
import SourceBadge from '../ui/SourceBadge';
import BufferLayer from './layers/BufferLayer';
import CogLayer from './layers/CogLayer';

export interface MapRef {
    flyTo: (center: maplibregl.LngLatLike, zoom?: number) => void;
}

interface MapContainerProps {
    className?: string;
    style?: React.CSSProperties;
    initialViewport?: {
        lng: number;
        lat: number;
        zoom: number;
        pitch?: number;
        bearing?: number;
    };
    showZoning?: boolean;
    showSuburbs?: boolean;
    showDraw?: boolean;
    showFlights?: boolean;
    showSatellite?: boolean;
    showFirms?: boolean;
    showTraffic?: boolean;
    transparent?: boolean;
    onFeatureCreate?: (feature: any) => void;
    bufferedFeature?: any | null;
    cogUrl?: string;
    showCogs?: boolean;
}

// Geographic Constraints (Western Cape BBox)
const WESTERN_CAPE_BOUNDS: maplibregl.LngLatBoundsLike = [
    [18.0, -34.5], // Southwest coordinates
    [19.5, -33.0]  // Northeast coordinates
];

const INITIAL_CENTER: maplibregl.LngLatLike = [18.4241, -33.9249];
const INITIAL_ZOOM = 11;

export const MapContainer = forwardRef<MapRef, MapContainerProps>(({
                                                                       className,
                                                                       style,
                                                                       initialViewport,
                                                                       showZoning = true,
                                                                       showSuburbs = true,
                                                                       showDraw = false,
                                                                       showFlights = false,
                                                                       showSatellite = false,
                                                                       showFirms = false,
                                                                       showTraffic = false,
                                                                       transparent = false,
                                                                       onFeatureCreate,
                                                                       bufferedFeature,
                                                                       cogUrl,
                                                                       showCogs = false,
                                                                   }, ref) => {
    const mapContainer = useRef<HTMLDivElement>(null);
    const [mapInstance, setMapInstance] = useState<maplibregl.Map | null>(null);

    useImperativeHandle(ref, () => ({
        flyTo: (center, zoom = 16) => {
            if (mapInstance) {
                mapInstance.flyTo({center, zoom, duration: 2000});
            }
        }
    }), [mapInstance]);

    useEffect(() => {
        if (!mapContainer.current || mapInstance) return;

        // Initialize MapLibre Instance
        const map = new maplibregl.Map({
            container: mapContainer.current,
            style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
            center: initialViewport ? [initialViewport.lng, initialViewport.lat] : INITIAL_CENTER,
            zoom: initialViewport ? initialViewport.zoom : INITIAL_ZOOM,
            pitch: initialViewport?.pitch ?? 0,
            bearing: initialViewport?.bearing ?? 0,
            maxBounds: WESTERN_CAPE_BOUNDS,
            maxCanvasSize: [4096, 4096]
        });

        if (transparent) {
            map.on('styledata', () => {
                map.getCanvas().style.backgroundColor = 'transparent';
                if (map.getLayer('background')) {
                    map.setPaintProperty('background', 'background-opacity', 0);
                }
            });
        }

        // Add Navigation Controls (Zoom/Rotate)
        map.addControl(
            new maplibregl.NavigationControl({showCompass: true}),
            'top-right'
        );

        map.on('load', () => {
            setMapInstance(map);
        });

        // Cleanup on Unmount
        return () => {
            if (map) {
                map.remove();
            }
        };
    }, []);

    return (
        <div
            ref={mapContainer}
            className={className}
            style={{
                width: '100%',
                height: '100%',
                borderRadius: '8px',
                overflow: 'hidden',
                ...style,
            }}
        >
            <div style={{position: 'absolute', bottom: '12px', left: '12px', zIndex: 10}}>
                <SourceBadge source="CARTO" year={2026} tier="LIVE"/>
            </div>
            <GeolocationControl mapRef={mapContainer as any}/>
            {mapInstance && (
                <SatelliteLayer map={mapInstance} visible={showSatellite}/>
            )}
            {mapInstance && (
                <SuburbLayer map={mapInstance} visible={showSuburbs}/>
            )}
            {mapInstance && (
                <TrafficLayer map={mapInstance} visible={showTraffic}/>
            )}
            {mapInstance && (
                <FirmsLayer map={mapInstance} visible={showFirms}/>
            )}
            {mapInstance && (
                <ZoningLayer map={mapInstance} visible={showZoning}/>
            )}
            {mapInstance && showFlights && (
                <FlightLayer map={mapInstance} visible={showFlights}/>
            )}
            {mapInstance && showDraw && (
                <DrawControl
                    map={mapInstance}
                    onDrawCreate={(e) => onFeatureCreate?.(e.features[0])}
                />
            )}
            {mapInstance && bufferedFeature && (
                <BufferLayer map={mapInstance} feature={bufferedFeature}/>
            )}
            {mapInstance && (
                <CogLayer 
                    map={mapInstance} 
                    visible={showCogs} 
                    tileUrl={cogUrl}
                />
            )}
        </div>
    );
});

export default MapContainer;

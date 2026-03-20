'use client';

import React, { useState } from 'react';
import { MapRef } from '../MapContainer';

interface GeolocationControlProps {
  mapRef: React.RefObject<MapRef | null>;
  theme?: 'light' | 'dark';
}

/**
 * GeolocationControl
 * 
 * "My Location" button using navigator.geolocation.getCurrentPosition()
 * Includes fallback logic to find current suburb (QW3 compliance).
 */
export const GeolocationControl: React.FC<GeolocationControlProps> = ({
  mapRef,
  theme = 'dark'
}) => {
  const [loading, setLoading] = useState(false);
  const [suburb, setSuburb] = useState<string | null>(null);

  const currentTheme = theme === 'dark' ? {
    bg: 'rgba(55, 65, 81, 0.9)',
    text: '#e2e8f0',
    shadow: 'rgba(0, 0, 0, 0.4)',
    hoverBg: 'rgba(75, 85, 100, 1)'
  } : {
    bg: 'rgba(255, 255, 255, 0.9)',
    text: '#1a202c',
    shadow: 'rgba(163, 177, 198, 0.4)',
    hoverBg: 'rgba(240, 240, 245, 1)'
  };

  const handleLocate = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    setLoading(true);
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        // Fly to location
        if (mapRef.current) {
          mapRef.current.flyTo([longitude, latitude], 15);
        }

        try {
          // Attempt reverse geocoding for suburb via API if available
          // We pass lat/lng to search to see if it responds with a suburb via ST_Contains
          const res = await fetch(`/api/search?lat=${latitude}&lng=${longitude}`);
          if (res.ok) {
            const data = await res.json();
            if (data?.suburb) {
              setSuburb(data.suburb);
            }
          }
        } catch (e) {
          console.warn('Reverse geocode failed', e);
        } finally {
          setLoading(false);
        }
      },
      (error) => {
        console.error('Error getting location', error);
        setLoading(false);
      },
      { enableHighAccuracy: true }
    );
  };

  return (
    <div className="absolute right-4 bottom-24 z-10 flex flex-col items-end gap-2">
      {suburb && (
        <div 
          className="rounded-full px-3 py-1 text-xs font-semibold backdrop-blur-md transition-all duration-300 animate-in fade-in slide-in-from-right-4"
          style={{ 
            background: currentTheme.bg,
            color: currentTheme.text,
            boxShadow: `0 4px 6px ${currentTheme.shadow}`
          }}
        >
          📍 {suburb}
        </div>
      )}
      <button
        onClick={handleLocate}
        disabled={loading}
        title="My Location"
        className="flex h-10 w-10 items-center justify-center rounded-full backdrop-blur-md transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50"
        style={{
          background: currentTheme.bg,
          color: currentTheme.text,
          boxShadow: `0 4px 6px ${currentTheme.shadow}`,
          border: '1px solid rgba(255,255,255,0.1)'
        }}
      >
        {loading ? (
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : (
          <svg 
            width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" 
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          >
            <polygon points="3 11 22 2 13 21 11 13 3 11" />
          </svg>
        )}
      </button>
    </div>
  );
};

export default GeolocationControl;

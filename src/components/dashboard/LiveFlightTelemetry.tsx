'use client';

/**
 * @file src/components/dashboard/LiveFlightTelemetry.tsx
 * @description Widget showing live flight statistics with a pink accent.
 */

import React, { useEffect, useState } from 'react';
import { Theme } from '@/assets/tokens/themes';
import { CrayonCard } from '../ui/CrayonCard';

interface LiveFlightTelemetryProps {
  colors: Theme;
  cardShadow: any;
}

interface FlightStats {
  count: number;
  avgAltitude: number;
  maxVelocity: number;
  countries: number;
}

const LiveFlightTelemetry: React.FC<LiveFlightTelemetryProps> = ({ colors, cardShadow }) => {
  const [stats, setStats] = useState<FlightStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setUpdating(true);
        setError(null);
        const response = await fetch('/api/flights');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();

        if (data && data.features) {
          const features = data.features;
          const count = features.length;

          // Filter out 0/null altitudes for average
          const altitudes = features
            .map((f: any) => f.properties.altitude)
            .filter((a: number) => a > 0);

          const velocities = features
            .map((f: any) => f.properties.velocity)
            .filter((v: number) => v > 0);

          const countries = new Set(
            features
              .map((f: any) => f.properties.origin_country)
              .filter((c: string) => c && c !== 'Unknown')
          ).size;

          setStats({
            count,
            avgAltitude: altitudes.length > 0
              ? Math.round(altitudes.reduce((a: number, b: number) => a + b, 0) / altitudes.length)
              : 0,
            maxVelocity: velocities.length > 0
              ? Math.round(Math.max(...velocities) * 3.6) // Convert m/s to km/h
              : 0,
            countries
          });
        }
      } catch (error) {
        console.error('Failed to fetch flight stats:', error);
        setError('Telemetry Link Severed');
      } finally {
        setLoading(false);
        setUpdating(false);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 30000); // 30s update cycle
    return () => clearInterval(interval);
  }, []);

  return (
    <CrayonCard
      colorVariant="pink"
      className={`transition-all duration-300 ${error ? 'border-red-500 shadow-[0_0_15px_-3px_rgba(239,68,68,0.3)]' : ''}`}
    >
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl">{error ? '⚠️' : '📡'}</span>
        <h2 className={`text-base font-bold m-0 ${error ? 'text-red-400' : 'text-white'}`}>
          {error ? 'Telemetry Error' : 'Live Airspace Telemetry'}
        </h2>
      </div>

      {(loading && !stats) ? (
        <div className="animate-crayon-pulse space-y-4">
          <div className="h-8 bg-white/5 rounded w-full"></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="h-10 bg-white/5 rounded"></div>
            <div className="h-10 bg-white/5 rounded"></div>
          </div>
        </div>
      ) : error ? (
        <div className="py-4 text-center">
          <p className="text-xs font-bold uppercase tracking-wider mb-2 text-red-400">{error}</p>
          <p className="text-[10px] text-zinc-300">Check connection to OpenSky Network</p>
        </div>
      ) : stats ? (
        <div className={`grid grid-cols-2 gap-y-4 gap-x-6 transition-opacity duration-500 ${updating ? 'animate-crayon-pulse' : ''}`}>
          <div className="flex flex-col">
            <span className="text-[9px] uppercase font-bold tracking-wider text-zinc-300">Active Craft</span>
            <span className="text-2xl font-black text-crayon-pink">{stats.count}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] uppercase font-bold tracking-wider text-zinc-300">Avg Alt (m)</span>
            <span className="text-2xl font-black text-white">{stats.avgAltitude.toLocaleString()}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] uppercase font-bold tracking-wider text-zinc-300">Max Speed</span>
            <span className="text-2xl font-black text-white">{stats.maxVelocity} <span className="text-[10px] font-normal text-zinc-300">km/h</span></span>
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] uppercase font-bold tracking-wider text-zinc-300">Nations</span>
            <span className="text-2xl font-black text-white">{stats.countries}</span>
          </div>
        </div>
      ) : (
        <div className="py-4 text-center">
          <p className="text-xs italic text-zinc-300">Awaiting Signal...</p>
        </div>
      )}
    </CrayonCard>
  );
};

export default LiveFlightTelemetry;

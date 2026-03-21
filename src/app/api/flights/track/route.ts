/**
 * @file src/app/api/flights/track/route.ts
 * @description API Route for Historical Flight Tracks with Three-Tier Fallback.
 *   Used by 4DGS replay and aircraft detail panels.
 * @compliance Rule 1: Source metadata. Rule 2: LIVE→CACHED→MOCK fallback.
 */

import { NextRequest, NextResponse } from 'next/server';
import { fetchWithFallback } from '@/lib/utils/fallback';
import { fetchHistoricalTrack } from '@/lib/opensky-api';
import { getCachedResponse, setCachedResponse } from '@/lib/supabase/cache';
import fs from 'fs/promises';
import path from 'path';
import type { FlightTemporalEntry, OpenSkyTracksResponse } from '@/types/opensky';

const SOURCE_NAME = 'OpenSky Network';
const CURRENT_YEAR = new Date().getFullYear();

/**
 * GET /api/flights/track
 *
 * Query params:
 *   - icao24: string (required). Hex address of the aircraft.
 *   - time: number (optional, default 0). Unix timestamp around which track is requested.
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const icao24 = searchParams.get('icao24');
  const timeStr = searchParams.get('time') || '0';
  const time = parseInt(timeStr, 10);

  if (!icao24) {
    return NextResponse.json({ error: 'Missing required parameter: icao24' }, { status: 400 });
  }

  const cacheKey = `track_${icao24}_${time}`;

  const result = await fetchWithFallback<FlightTemporalEntry[]>({
    source: SOURCE_NAME,
    year: CURRENT_YEAR,

    // Tier 1: LIVE (OpenSky API)
    live: async () => {
      const data = await fetchHistoricalTrack(icao24, time);

      // Update cache
      // 1-hour TTL for historical tracks as they are less volatile than real-time states
      await setCachedResponse(SOURCE_NAME, cacheKey, data, 1.0);

      return data;
    },

    // Tier 2: CACHED (Supabase api_cache)
    cached: async () => {
      return await getCachedResponse<FlightTemporalEntry[]>(SOURCE_NAME, cacheKey);
    },

    // Tier 3: MOCK (Local JSON)
    mock: async () => {
      const mockPath = path.join(process.cwd(), 'public/mock/flights-track-sample.json');
      const fileContent = await fs.readFile(mockPath, 'utf8');
      const rawMock = JSON.parse(fileContent) as OpenSkyTracksResponse;

      if (!rawMock.path) return [];

      // Transform mock using same logic as API client for consistency
      return rawMock.path.map((point) => ({
        icao24: rawMock.icao24,
        callsign: rawMock.callsign?.trim() || undefined,
        timestamp: new Date(point[0] * 1000).toISOString(),
        position: [point[2], point[1], point[3] || 0],
        heading: point[4] || 0,
        on_ground: point[5] || false,
      }));
    }
  });

  return NextResponse.json(result);
}

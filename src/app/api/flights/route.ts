/**
 * @file src/app/api/flights/route.ts
 * @description API Route for Real-time Flight Tracking with Three-Tier Fallback.
 * @compliance Rule 1: Source metadata. Rule 2: LIVE→CACHED→MOCK fallback.
 */

import { NextRequest, NextResponse } from 'next/server';
import { fetchWithFallback } from '@/lib/utils/fallback';
import { fetchFlightStates } from '@/lib/opensky-api';
import { toFlightGeoJSON } from '@/lib/flight-data-transformer';
import { getCachedResponse, setCachedResponse } from '@/lib/supabase/cache';
import fs from 'fs/promises';
import path from 'path';

const SOURCE_NAME = 'OpenSky Network';
const CURRENT_YEAR = new Date().getFullYear();

/**
 * GET /api/flights
 * 
 * Query params:
 *   - guest: boolean (optional, default false). If true, filters to airline callsigns only.
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const guestMode = searchParams.get('guest') === 'true';

  const result = await fetchWithFallback({
    source: SOURCE_NAME,
    year: CURRENT_YEAR,
    
    // Tier 1: LIVE (OpenSky API)
    live: async () => {
      const rawData = await fetchFlightStates();
      const geojson = toFlightGeoJSON(rawData.states, guestMode);
      
      // Update cache if in authenticated/tenant context
      // Note: setCachedResponse handles tenant resolution internally
      await setCachedResponse(SOURCE_NAME, 'current_flights', rawData, 0.0083); // 30s TTL (0.0083 hours)
      
      return geojson;
    },

    // Tier 2: CACHED (Supabase api_cache)
    cached: async () => {
      const rawData = await getCachedResponse<any>(SOURCE_NAME, 'current_flights');
      if (!rawData) return null;
      return toFlightGeoJSON(rawData.states, guestMode);
    },

    // Tier 3: MOCK (Local GeoJSON)
    mock: async () => {
      const mockPath = path.join(process.cwd(), 'public/mock/flights-cape-town.geojson');
      const fileContent = await fs.readFile(mockPath, 'utf8');
      const geojson = JSON.parse(fileContent);
      
      // If guest mode is on, we should filter the mock data too for consistency
      if (guestMode && geojson.features) {
        // Simple filter for mock data assuming it has callsign property
        geojson.features = geojson.features.filter((f: any) => {
          const callsign = f.properties?.callsign || '';
          // Re-use logic if possible or assume mock is already sanitised
          return callsign.length > 0; 
        });
      }
      
      return geojson;
    }
  });

  return NextResponse.json(result);
}

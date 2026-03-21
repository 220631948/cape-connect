/**
 * @file src/app/api/satellite/route.ts
 * @description API Route for serving Sentinel-2 metadata with Three-Tier Fallback.
 * @compliance Rule 1: Source metadata. Rule 2: LIVE→CACHED→MOCK fallback.
 */

import { NextResponse } from 'next/server';
import { fetchWithFallback } from '@/lib/utils/fallback';
import { fetchLatestSentinelScene } from '@/lib/sentinel-api';
import { getCachedResponse, setCachedResponse } from '@/lib/supabase/cache';

const SOURCE_NAME = 'Copernicus Sentinel-2';
const CURRENT_YEAR = new Date().getFullYear();

/**
 * GET /api/satellite
 * Returns the latest Sentinel-2 metadata (including tile URLs) for the region.
 */
export async function GET() {
  const result = await fetchWithFallback({
    source: SOURCE_NAME,
    year: CURRENT_YEAR,

    // Tier 1: LIVE (Copernicus / STAC API)
    live: async () => {
      const sceneData = await fetchLatestSentinelScene();

      // Update cache
      await setCachedResponse(SOURCE_NAME, 'latest_s2_scene', sceneData, 24); // 24h TTL

      return sceneData;
    },

    // Tier 2: CACHED (Supabase api_cache)
    cached: async () => {
      const sceneData = await getCachedResponse<any>(SOURCE_NAME, 'latest_s2_scene');
      if (!sceneData) return null;
      return sceneData;
    },

    // Tier 3: MOCK (Local fallback values)
    mock: async () => {
      return {
        id: 'MOCK_S2_SCENE',
        date: new Date().toISOString(),
        cloudCover: 0,
        // Free openstreetmap tiles acting as mock raster layer
        tileUrl: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
        ndviUrl: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
      };
    }
  });

  return NextResponse.json(result);
}

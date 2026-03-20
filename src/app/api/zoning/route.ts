/**
 * @file src/app/api/zoning/route.ts
 * @description API Route for IZS Zoning with Three-Tier Fallback.
 * @compliance POPIA: Handling municipal zoning data and query patterns.
 */

import { NextResponse } from 'next/server';
import { fetchWithFallback } from '@/lib/utils/fallback';
import { getCachedResponse, setCachedResponse } from '@/lib/supabase/cache';
import fs from 'fs/promises';
import path from 'path';

const SOURCE_NAME = 'CoCT IZS';
const SOURCE_YEAR = 2026;
const ARCGIS_ENDPOINT = 'https://odp-cctegis.opendata.arcgis.com/datasets/zoning-2025';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const bbox = searchParams.get('bbox');

  const result = await fetchWithFallback({
    source: SOURCE_NAME,
    year: SOURCE_YEAR,
    live: async () => {
      // TODO: Implement actual ArcGIS REST query when DS-005 URL is verified
      throw new Error('ArcGIS Endpoint DS-005 unverified - using fallback');
    },
    cached: async () => {
      const cacheKey = `zoning_${bbox || 'all'}`;
      return await getCachedResponse<any>(SOURCE_NAME, cacheKey);
    },
    mock: async () => {
      const mockPath = path.join(process.cwd(), 'public/mock/izs_zones.geojson');
      const data = await fs.readFile(mockPath, 'utf8');
      return JSON.parse(data);
    }
  });

  // Update cache if LIVE succeeded (simulated failure here)
  if (result.tier === 'LIVE') {
    const cacheKey = `zoning_${bbox || 'all'}`;
    await setCachedResponse(SOURCE_NAME, cacheKey, result.data, 1); // 1-hour TTL
  }

  return NextResponse.json(result);
}

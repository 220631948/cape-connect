/**
 * @file src/app/api/suburbs/route.ts
 * @description API Route for Cape Town Suburbs with Three-Tier Fallback.
 * @compliance POPIA: Handling municipal boundary data.
 */

import { NextResponse } from 'next/server';
import { fetchWithFallback } from '@/lib/utils/fallback';
import { getCachedResponse, setCachedResponse } from '@/lib/supabase/cache';
import fs from 'fs/promises';
import path from 'path';

const SOURCE_NAME = 'City of Cape Town Suburbs';
const SOURCE_YEAR = 2026;

export async function GET(request: Request) {
  const result = await fetchWithFallback({
    source: SOURCE_NAME,
    year: SOURCE_YEAR,
    live: async () => {
      // TODO: Implement actual ArcGIS REST query for suburbs
      throw new Error('ArcGIS Suburbs Endpoint unverified - using fallback');
    },
    cached: async () => {
      const cacheKey = 'suburbs_all';
      return await getCachedResponse<any>(SOURCE_NAME, cacheKey);
    },
    mock: async () => {
      const mockPath = path.join(process.cwd(), 'public/mock/suburbs.geojson');
      const data = await fs.readFile(mockPath, 'utf8');
      return JSON.parse(data);
    }
  });

  if (result.tier === 'LIVE') {
    const cacheKey = 'suburbs_all';
    await setCachedResponse(SOURCE_NAME, cacheKey, result.data, 24); // 24-hour TTL for boundaries
  }

  return NextResponse.json(result);
}

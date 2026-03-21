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
const ARCGIS_ENDPOINT = 'https://esapqa.capetown.gov.za/agsext/rest/services/Theme_Based/ODP_SPLIT_5/FeatureServer/3/query';

export async function GET(request: Request) {
  const result = await fetchWithFallback({
    source: SOURCE_NAME,
    year: SOURCE_YEAR,
    live: async () => {
      // Query ArcGIS REST endpoint for all suburbs
      const url = new URL(ARCGIS_ENDPOINT);
      url.searchParams.append('where', '1=1');
      url.searchParams.append('outFields', '*');
      url.searchParams.append('f', 'geojson');

      const response = await fetch(url.toString(), {
        // Adding a reasonable timeout and headers
        headers: {
          'Accept': 'application/geo+json, application/json',
          'User-Agent': 'CapeTown-GIS-Hub/1.0'
        },
        next: { revalidate: 86400 } // Cache at fetch level for 24 hours
      });

      if (!response.ok) {
        throw new Error(`ArcGIS Suburbs Endpoint returned status: ${response.status}`);
      }

      const data = await response.json();

      // Basic validation to ensure it's valid GeoJSON
      if (!data || data.type !== 'FeatureCollection' || !Array.isArray(data.features)) {
        throw new Error('Invalid GeoJSON response from ArcGIS endpoint');
      }

      // Map features to standardize properties if needed, or simply return the data
      // For now, returning the raw GeoJSON FeatureCollection
      return data;
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

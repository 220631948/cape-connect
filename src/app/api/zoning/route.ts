/**
 * @file src/app/api/zoning/route.ts
 * @description API Route for IZS Zoning with Three-Tier Fallback.
 * @compliance POPIA: Handling municipal zoning data and query patterns.
 */

import { NextResponse } from 'next/server';
import { fetchWithFallback } from '@/lib/utils/fallback';
import { getCachedResponse, setCachedResponse } from '@/lib/supabase/cache';
import { getArcGISToken } from '@/lib/auth/arcgis';
import fs from 'fs/promises';
import path from 'path';

const SOURCE_NAME = 'CoCT IZS';
const SOURCE_YEAR = 2026;
const ARCGIS_ENDPOINT = 'https://odp-cctegis.opendata.arcgis.com/datasets/zoning-2025';
// FeatureServer endpoint URL should be defined in .env
// e.g., ARCGIS_ZONING_FEATURE_SERVER_URL=https://services1.arcgis.com/.../FeatureServer/0/query
const FEATURE_SERVER_URL = process.env.ARCGIS_ZONING_FEATURE_SERVER_URL;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const bbox = searchParams.get('bbox');

  const result = await fetchWithFallback({
    source: SOURCE_NAME,
    year: SOURCE_YEAR,
    live: async () => {
      if (!FEATURE_SERVER_URL) {
        throw new Error('ARCGIS_ZONING_FEATURE_SERVER_URL environment variable is not set. Please set it to the actual FeatureServer/0/query endpoint URL.');
      }

      // We expect FEATURE_SERVER_URL to point to the actual layer's /query endpoint
      const url = new URL(FEATURE_SERVER_URL);

      url.searchParams.append('f', 'geojson');
      url.searchParams.append('outFields', '*');
      url.searchParams.append('where', '1=1');

      if (bbox) {
        url.searchParams.append('geometry', bbox);
        url.searchParams.append('geometryType', 'esriGeometryEnvelope');
        url.searchParams.append('inSR', '4326');
        url.searchParams.append('spatialRel', 'esriSpatialRelIntersects');
      }

      try {
        const token = await getArcGISToken();
        url.searchParams.append('token', token);
      } catch (error) {
        // Log the error but continue if token fetch fails, the API might be public
        console.warn('Could not fetch ArcGIS token, attempting query without token:', error instanceof Error ? error.message : String(error));
      }

      const response = await fetch(url.toString(), {
        // ArcGIS REST API generally supports GET, but we use POST if URL gets too long
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`ArcGIS query failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(`ArcGIS API Error: ${data.error.message || JSON.stringify(data.error)}`);
      }

      return data;
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

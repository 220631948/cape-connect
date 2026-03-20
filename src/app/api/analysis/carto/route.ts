/**
 * @file src/app/api/analysis/carto/route.ts
 * @description M18 — CARTO Geospatial Analytics API route.
 * Proxies spatial analytics queries to CARTO SQL API with three-tier fallback.
 * LIVE: CARTO API → CACHED: Supabase api_cache → MOCK: static aggregates.
 * @compliance Rule 2: Three-Tier Fallback. Rule 3: No API keys in source.
 * @compliance Rule 9: Geographic Scope — Cape Town bbox enforced.
 */

import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

// Cape Town bounding box (CLAUDE.md Rule 9)
const CT_BBOX = { west: 18.0, south: -34.5, east: 19.5, north: -33.0 };

const CARTO_API_BASE = process.env.API_BASE_URL || 'https://gcp-us-east1.api.carto.com';
const CARTO_API_KEY = process.env.CARTO_API_KEY;

// ── Supported analysis types ──────────────────────────────────────────────────
type AnalysisType = 'enrichment' | 'isoline' | 'stats';

interface CartoRequest {
  type: AnalysisType;
  geometry?: GeoJSON.Geometry;
  params?: Record<string, unknown>;
}

// ── LIVE: CARTO API ───────────────────────────────────────────────────────────
async function fetchFromCarto(body: CartoRequest): Promise<unknown | null> {
  if (!CARTO_API_KEY || CARTO_API_KEY === 'your_api_key_here') return null;

  try {
    const endpoint = `${CARTO_API_BASE}/v3/sql/carto_dw/query`;
    const query = buildCartoQuery(body);

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CARTO_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ q: query }),
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

function buildCartoQuery(body: CartoRequest): string {
  const bboxFilter = `ST_MakeEnvelope(${CT_BBOX.west}, ${CT_BBOX.south}, ${CT_BBOX.east}, ${CT_BBOX.north}, 4326)`;

  switch (body.type) {
    case 'enrichment':
      return `SELECT * FROM carto-dw.carto.geography_zaf_demographics_v1
              WHERE ST_Intersects(geom, ${bboxFilter}) LIMIT 100`;
    case 'isoline':
      return `SELECT ST_AsGeoJSON(geom) as geometry FROM carto-dw.carto.geography_zaf_boundary_v1
              WHERE ST_Intersects(geom, ${bboxFilter}) LIMIT 50`;
    case 'stats':
    default:
      return `SELECT COUNT(*) as feature_count, ST_Area(ST_Union(geom)) as total_area
              FROM carto-dw.carto.geography_zaf_boundary_v1
              WHERE ST_Intersects(geom, ${bboxFilter})`;
  }
}

// ── CACHED: Supabase api_cache ────────────────────────────────────────────────
async function fetchFromCache(cacheKey: string) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data } = await supabase
      .from('api_cache')
      .select('response_data')
      .eq('cache_key', cacheKey)
      .gt('expires_at', new Date().toISOString())
      .single();

    return data?.response_data ?? null;
  } catch {
    return null;
  }
}

// ── MOCK: Static fallback ─────────────────────────────────────────────────────
function getMockData(type: AnalysisType) {
  const mocks: Record<AnalysisType, unknown> = {
    enrichment: {
      rows: [
        { name: 'Cape Town CBD', population: 58530, area_km2: 4.2 },
        { name: 'Woodstock', population: 23400, area_km2: 2.1 },
        { name: 'Observatory', population: 11200, area_km2: 1.8 },
      ],
    },
    isoline: {
      rows: [
        { geometry: { type: 'Polygon', coordinates: [[[18.42, -33.92], [18.43, -33.92], [18.43, -33.93], [18.42, -33.93], [18.42, -33.92]]] } },
      ],
    },
    stats: {
      rows: [{ feature_count: 412, total_area: 2460.5 }],
    },
  };
  return mocks[type] || mocks.stats;
}

export async function POST(request: Request) {
  try {
    const body: CartoRequest = await request.json();
    const analysisType = body.type || 'stats';
    const cacheKey = `carto:${analysisType}:${JSON.stringify(body.params || {})}`;

    // Tier 1: LIVE — CARTO API
    const liveData = await fetchFromCarto(body);
    if (liveData) {
      return NextResponse.json({
        data: liveData,
        source: 'CARTO Analytics',
        year: 2026,
        tier: 'LIVE',
        bbox: CT_BBOX,
        timestamp: new Date().toISOString(),
      });
    }

    // Tier 2: CACHED — Supabase api_cache
    const cachedData = await fetchFromCache(cacheKey);
    if (cachedData) {
      return NextResponse.json({
        data: cachedData,
        source: 'CARTO Analytics',
        year: 2026,
        tier: 'CACHED',
        bbox: CT_BBOX,
        timestamp: new Date().toISOString(),
      });
    }

    // Tier 3: MOCK — Static aggregates
    const mockData = getMockData(analysisType);
    return NextResponse.json({
      data: mockData,
      source: 'CARTO Analytics (Mock)',
      year: 2026,
      tier: 'MOCK',
      bbox: CT_BBOX,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[CARTO API] Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

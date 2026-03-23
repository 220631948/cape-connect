/**
 * @file src/app/api/analysis/spatial-stats/route.ts
 * @description Tenant-scoped spatial statistics API with three-tier fallback: PostGIS LIVE → api_cache → MOCK.
 * Part of M17 — Advanced Geospatial Analysis (PostGIS pipeline).
 * @compliance POPIA: Tenant-scoped via RLS. Rule 2: Three-Tier Fallback. Rule 4: Tenant isolation.
 */

import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

const VALID_TABLES = ['properties', 'valuation_data', 'user_features', 'izs_zones'] as const;
const VALID_TABLES_SET = new Set<string>(VALID_TABLES);
type ValidTable = typeof VALID_TABLES[number];

// Mock spatial stats for offline fallback
const MOCK_STATS: Record<ValidTable, object> = {
  properties: {
    feature_count: 12450,
    total_area_m2: 48750000,
    centroid: { type: 'Point', coordinates: [18.4241, -33.9249] },
    bbox: { type: 'Polygon', coordinates: [[[18.35, -34.10], [18.55, -34.10], [18.55, -33.85], [18.35, -33.85], [18.35, -34.10]]] },
  },
  valuation_data: {
    feature_count: 830000,
    total_area_m2: 0,
    centroid: null,
    bbox: null,
  },
  user_features: {
    feature_count: 0,
    total_area_m2: 0,
    centroid: null,
    bbox: null,
  },
  izs_zones: {
    feature_count: 2840,
    total_area_m2: 245000000,
    centroid: { type: 'Point', coordinates: [18.46, -33.95] },
    bbox: { type: 'Polygon', coordinates: [[[18.30, -34.20], [18.70, -34.20], [18.70, -33.70], [18.30, -33.70], [18.30, -34.20]]] },
  },
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tableName = searchParams.get('table') as ValidTable | null;

  if (!tableName || !VALID_TABLES_SET.has(tableName)) {
    return NextResponse.json(
      { error: `table parameter required. Valid: ${VALID_TABLES.join(', ')}` },
      { status: 400 }
    );
  }

  // ── Tier 1: LIVE — PostGIS spatial aggregation ───────────────────────────
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.rpc('get_spatial_stats', {
      target_table: tableName,
    });

    if (!error && data) {
      // Cache the result
      try {
        await supabase.from('api_cache').upsert({
          cache_key: `spatial-stats:${tableName}`,
          data,
          expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour
        });
      } catch {
        // Cache write failure is non-fatal
      }

      return NextResponse.json({
        table: tableName,
        ...data,
        source: 'PostGIS Spatial Engine',
        year: 2026,
        tier: 'LIVE',
        timestamp: new Date().toISOString(),
      });
    }
  } catch (err) {
    console.warn('[Spatial Stats API] LIVE tier failed:', (err as Error).message);
  }

  // ── Tier 2: CACHED — api_cache table ─────────────────────────────────────
  try {
    const supabase = await createServerSupabaseClient();
    const { data: cached } = await supabase
      .from('api_cache')
      .select('data')
      .eq('cache_key', `spatial-stats:${tableName}`)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (cached?.data) {
      return NextResponse.json({
        table: tableName,
        ...cached.data,
        source: 'PostGIS Spatial Engine',
        year: 2026,
        tier: 'CACHED',
        timestamp: new Date().toISOString(),
      });
    }
  } catch {
    console.warn('[Spatial Stats API] CACHED tier failed');
  }

  // ── Tier 3: MOCK — Static fallback ───────────────────────────────────────
  return NextResponse.json({
    table: tableName,
    ...MOCK_STATS[tableName],
    source: 'PostGIS Spatial Engine',
    year: 2026,
    tier: 'MOCK',
    timestamp: new Date().toISOString(),
  });
}

/**
 * @file src/app/api/analysis/geocode/route.ts
 * @description Geocoding API with three-tier fallback: ArcGIS LIVE → api_cache → MOCK.
 * Part of M17 — Advanced Geospatial Analysis.
 * @compliance POPIA: No PII transmitted; address queries only. Rule 2: Three-Tier Fallback.
 */

import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

const ARCGIS_TOKEN = process.env.ARCGIS_TEMP_TOKEN || '';
const GEOCODE_BASE = 'https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer';
const CT_EXTENT = '18.3,-34.4,19.0,-33.7';

// Mock geocode results for Cape Town
const MOCK_RESULTS = [
  { address: '1 Adderley St, Cape Town, 8001', location: { x: 18.4241, y: -33.9249 }, score: 95 },
  { address: 'V&A Waterfront, Cape Town, 8002', location: { x: 18.4218, y: -33.9036 }, score: 90 },
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get('address');
  const maxResults = parseInt(searchParams.get('max') || '5', 10);

  if (!address) {
    return NextResponse.json({ error: 'address query parameter is required' }, { status: 400 });
  }

  // ── Tier 1: LIVE — ArcGIS Geocoding API ──────────────────────────────────
  try {
    const params = new URLSearchParams({
      singleLine: address,
      f: 'json',
      outFields: 'Addr_type,Match_addr,Score',
      maxLocations: String(maxResults),
      searchExtent: CT_EXTENT,
      ...(ARCGIS_TOKEN ? { token: ARCGIS_TOKEN } : {}),
    });

    const res = await fetch(`${GEOCODE_BASE}/findAddressCandidates?${params}`, {
      signal: AbortSignal.timeout(10000),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.candidates && data.candidates.length > 0) {
        const candidates = data.candidates.map((c: Record<string, unknown>) => ({
          address: c.address,
          location: c.location,
          score: c.score,
          type: (c.attributes as Record<string, unknown>)?.Addr_type,
        }));

        // Cache results
        try {
          const supabase = await createServerSupabaseClient();
          await supabase.from('api_cache').upsert({
            cache_key: `geocode:${address.toLowerCase().trim()}`,
            data: candidates,
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          });
        } catch {
          // Cache write failure is non-fatal
        }

        return NextResponse.json({
          candidates,
          source: 'ArcGIS Geocoder',
          year: 2026,
          tier: 'LIVE',
          timestamp: new Date().toISOString(),
        });
      }
    }
  } catch (err) {
    console.warn('[Geocode API] LIVE tier failed:', (err as Error).message);
  }

  // ── Tier 2: CACHED — api_cache table ─────────────────────────────────────
  try {
    const supabase = await createServerSupabaseClient();
    const { data: cached } = await supabase
      .from('api_cache')
      .select('data')
      .eq('cache_key', `geocode:${address.toLowerCase().trim()}`)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (cached?.data) {
      return NextResponse.json({
        candidates: cached.data,
        source: 'ArcGIS Geocoder',
        year: 2026,
        tier: 'CACHED',
        timestamp: new Date().toISOString(),
      });
    }
  } catch {
    console.warn('[Geocode API] CACHED tier failed');
  }

  // ── Tier 3: MOCK — Static fallback ───────────────────────────────────────
  const filtered = MOCK_RESULTS.filter((r) =>
    r.address.toLowerCase().includes(address.toLowerCase())
  );

  return NextResponse.json({
    candidates: filtered.length > 0 ? filtered : MOCK_RESULTS.slice(0, maxResults),
    source: 'ArcGIS Geocoder',
    year: 2026,
    tier: 'MOCK',
    timestamp: new Date().toISOString(),
  });
}

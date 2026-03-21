/**
 * @file src/app/api/search/route.ts
 * @description API Route for Global Search with Three-Tier Fallback.
 * @compliance POPIA: Handling tenant-scoped property search queries.
 */

import { NextResponse } from 'next/server';
import { fetchWithFallback } from '@/lib/utils/fallback';
import { getCachedResponse, setCachedResponse } from '@/lib/supabase/cache';
import { createServerSupabaseClient } from '@/lib/supabase/server';

const SOURCE_NAME = 'CoCT Geocoder';
const SOURCE_YEAR = 2026;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');

  if (!query || query.length < 2) {
    return NextResponse.json({ data: [], tier: 'LIVE', source: SOURCE_NAME, year: SOURCE_YEAR });
  }

  const result = await fetchWithFallback({
    source: SOURCE_NAME,
    year: SOURCE_YEAR,
    live: async () => {
      const supabase = await createServerSupabaseClient();
      const { data, error } = await supabase.rpc('search_properties', { query_text: query });

      if (error) throw error;
      return data || [];
    },
    cached: async () => {
      const cacheKey = `search_${query.toLowerCase()}`;
      return await getCachedResponse<any>(SOURCE_NAME, cacheKey);
    },
    mock: async () => {
      // Mock result for Woodstock pilot area
      if (query.toLowerCase().includes('woodstock')) {
        return [{ id: 'mock-1', address: '123 Woodstock St, Woodstock', parcel_id: 'C01600440000000100000', geometry: { type: 'Point', coordinates: [18.441, -33.931] }, rank: 1.0 }];
      }
      return [];
    }
  });

  // Update cache if LIVE succeeded
  if (result.tier === 'LIVE') {
    const cacheKey = `search_${query.toLowerCase()}`;
    await setCachedResponse(SOURCE_NAME, cacheKey, result.data, 24); // 24-hour TTL
  }

  return NextResponse.json(result);
}

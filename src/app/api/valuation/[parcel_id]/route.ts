/**
 * @file src/app/api/valuation/[parcel_id]/route.ts
 * @description API Route for Property Valuations with Three-Tier Fallback.
 * @compliance POPIA: Handling municipal valuation data and parcel IDs.
 */

import { NextResponse } from 'next/server';
import { fetchWithFallback } from '@/lib/utils/fallback';
import { getCachedResponse, setCachedResponse } from '@/lib/supabase/cache';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import fs from 'fs/promises';
import path from 'path';

const SOURCE_NAME = 'CoCT GV Roll';
const SOURCE_YEAR = 2024;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ parcel_id: string }> }
) {
  const { parcel_id: parcelId } = await params;

  const result = await fetchWithFallback({
    source: SOURCE_NAME,
    year: SOURCE_YEAR,
    live: async () => {
      const supabase = await createServerSupabaseClient();
      const { data, error } = await supabase
        .from('valuation_data')
        .select('*')
        .eq('parcel_id', parcelId)
        .single();
      
      if (error || !data) throw new Error('Valuation not found in DB');
      return data;
    },
    cached: async () => {
      const cacheKey = `valuation_${parcelId}`;
      return await getCachedResponse<any>(SOURCE_NAME, cacheKey);
    },
    mock: async () => {
      const mockPath = path.join(process.cwd(), 'public/mock/gv_roll.json');
      const data = await fs.readFile(mockPath, 'utf8');
      const mockDict = JSON.parse(data);
      return mockDict[parcelId] || { 
        parcel_id: parcelId, 
        city_valuation_zar: 0, 
        gv_year: SOURCE_YEAR, 
        suburb: 'Unknown', 
        zone_code: 'Unknown',
        is_mock: true 
      };
    }
  });

  // Update cache if LIVE succeeded
  if (result.tier === 'LIVE') {
    const cacheKey = `valuation_${parcelId}`;
    await setCachedResponse(SOURCE_NAME, cacheKey, result.data, 720); // 30-day TTL
  }

  return NextResponse.json(result);
}

/**
 * @file src/app/api/analysis/stats/route.ts
 * @description API Route for aggregate spatial statistics.
 * @compliance Rule 2: Three-Tier Fallback. Rule 4: Tenant isolation.
 */

import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.rpc('get_tenant_spatial_stats');

    if (error) {
      console.error('[Stats API] RPC Error:', error);
      // Fallback to MOCK structure if DB fails or RPC not applied
      return NextResponse.json({
        summary: { totalErfs: 0, medianValue: 0, growthRate: 'N/A' },
        valuationTrend: [],
        zoningMix: [],
        source: 'CoCT GV Roll (MOCK Fallback)',
        year: 2026,
        tier: 'MOCK'
      });
    }

    return NextResponse.json({
      ...data,
      source: 'CoCT GV Roll',
      year: 2026,
      tier: 'LIVE'
    });
  } catch (err) {
    console.error('[Stats API] Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

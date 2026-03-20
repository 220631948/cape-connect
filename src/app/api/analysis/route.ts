/**
 * @file src/app/api/analysis/route.ts
 * @description API Route for spatial analysis using analyze_area RPC.
 * @compliance POPIA: Handling user-defined geometries and municipal data aggregates.
 */

import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const { geometry } = await request.json();

    if (!geometry) {
      return NextResponse.json({ error: 'Geometry is required' }, { status: 400 });
    }

    const supabase = await createServerSupabaseClient();

    // Call PostGIS RPC for spatial analysis
    const { data, error } = await supabase.rpc('analyze_area', { 
      area_geom: geometry 
    });

    if (error) {
      console.error('[Analysis API] RPC Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      data,
      tier: 'LIVE',
      source: 'PostGIS Spatial Engine',
      timestamp: new Date().toISOString()
    });

  } catch (err) {
    console.error('[Analysis API] Internal Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

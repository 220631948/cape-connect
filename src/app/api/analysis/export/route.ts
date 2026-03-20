import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

function geojsonToCsv(features: any[]) {
  if (!features || features.length === 0) return '';
  
  // Extract keys safely
  const headers = ['id', 'erf_no', 'suburb', 'zoning', 'valuation', 'geometry'];
  
  const rows = features.map(f => {
    return headers.map(h => {
      if (h === 'geometry') {
        return `"${JSON.stringify(f.geometry).replace(/"/g, '""')}"`;
      }
      const val = f.properties?.[h];
      return val !== null && val !== undefined 
        ? `"${String(val).replace(/"/g, '""')}"` 
        : '""';
    }).join(',');
  });
  return [headers.join(','), ...rows].join('\n');
}

export async function POST(req: Request) {
  try {
    const { geometry, format } = await req.json();

    if (!geometry) {
      return NextResponse.json({ error: 'Geometry is required' }, { status: 400 });
    }
    
    // Support formats: 'geojson', 'csv'
    const exportFormat = format === 'csv' ? 'csv' : 'geojson';

    const supabase = await createServerSupabaseClient();
    
    // Call the newly created export_area RPC
    const { data: geojson, error } = await supabase.rpc('export_area', { geom_geom: geometry });

    if (error) {
      console.error('[Export API] RPC Error:', error);
      return NextResponse.json({ error: 'Failed to export data', details: error.message }, { status: 500 });
    }

    // Default empty collection just in case
    const safeGeojson = geojson || { type: 'FeatureCollection', features: [] };

    if (exportFormat === 'csv') {
      const csvStr = geojsonToCsv(safeGeojson.features || []);
      const response = new NextResponse(csvStr);
      response.headers.set('Content-Type', 'text/csv');
      response.headers.set('Content-Disposition', 'attachment; filename="spatial_export.csv"');
      return response;
    }

    // GeoJSON return
    const response = new NextResponse(JSON.stringify(safeGeojson));
    response.headers.set('Content-Type', 'application/json');
    response.headers.set('Content-Disposition', 'attachment; filename="spatial_export.geojson"');
    return response;
    
  } catch (err) {
    console.error('[Export API] Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

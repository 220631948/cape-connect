/**
 * @file src/app/api/analysis/ndvi/route.ts
 * @description NDVI/NDWI vegetation & water index API with three-tier fallback.
 * Part of M17 — Advanced Geospatial Analysis (GEE integration).
 * @compliance POPIA: No PII involved; satellite imagery indices only. Rule 2: Three-Tier Fallback.
 */

import {NextResponse} from 'next/server';
import {createServerSupabaseClient} from '@/lib/supabase/server';
import {validateBody} from '@/lib/validation';
import {ndviBboxSchema} from '@/lib/validation/schemas/analysis';

// Cape Town metro bounding box enforcement
const CT_METRO_BBOX = {west: 18.30, south: -34.40, east: 19.00, north: -33.70};

interface BBox {
    west: number;
    south: number;
    east: number;
    north: number;
}

function isWithinCapeTown(bbox: BBox): boolean {
    return (
        bbox.west >= CT_METRO_BBOX.west - 0.5 &&
        bbox.south >= CT_METRO_BBOX.south - 0.5 &&
        bbox.east <= CT_METRO_BBOX.east + 0.5 &&
        bbox.north <= CT_METRO_BBOX.north + 0.5
    );
}

function clamp(bbox: BBox): BBox {
    return {
        west: Math.max(bbox.west, CT_METRO_BBOX.west),
        south: Math.max(bbox.south, CT_METRO_BBOX.south),
        east: Math.min(bbox.east, CT_METRO_BBOX.east),
        north: Math.min(bbox.north, CT_METRO_BBOX.north),
    };
}

// Mock NDVI statistics for Cape Town
const MOCK_NDVI = {
    index: 'NDVI',
    formula: '(B8 - B4) / (B8 + B4)',
    statistics: {min: -0.12, max: 0.85, mean: 0.34, median: 0.31, std_dev: 0.18},
    classification: {
        bare_soil: {range: [-1.0, 0.1], percentage: 15.2},
        sparse_vegetation: {range: [0.1, 0.3], percentage: 28.5},
        moderate_vegetation: {range: [0.3, 0.6], percentage: 38.1},
        dense_vegetation: {range: [0.6, 1.0], percentage: 18.2},
    },
};

const MOCK_NDWI = {
    index: 'NDWI',
    formula: '(B3 - B8) / (B3 + B8)',
    statistics: {min: -0.45, max: 0.72, mean: -0.08, median: -0.12, std_dev: 0.21},
    classification: {
        no_water: {range: [-1.0, 0.0], percentage: 78.3},
        water_stress: {range: [0.0, 0.2], percentage: 12.5},
        moderate_water: {range: [0.2, 0.5], percentage: 6.8},
        open_water: {range: [0.5, 1.0], percentage: 2.4},
    },
};

export async function POST(request: Request) {
    try {
        const validation = await validateBody(request, ndviBboxSchema);
        if (!validation.success) {
            return validation.response;
        }
        const {bbox, start_date, end_date, index} = validation.data;

        if (!isWithinCapeTown(bbox)) {
            return NextResponse.json(
                {error: 'Bounding box is outside Cape Town metro area. GEE queries are restricted to CT metro.'},
                {status: 400}
            );
        }

        const clamped = clamp(bbox);
        const cacheKey = `${index.toLowerCase()}:${clamped.west},${clamped.south},${clamped.east},${clamped.north}:${start_date}:${end_date}`;

        // ── Tier 1: LIVE — Google Earth Engine API ─────────────────────────────
        // GEE requires service account credentials; placeholder for future integration
        // When GEE is configured, this block will call the Earth Engine REST API

        // ── Tier 2: CACHED — api_cache table ───────────────────────────────────
        try {
            const supabase = await createServerSupabaseClient();
            const {data: cached} = await supabase
                .from('api_cache')
                .select('data')
                .eq('cache_key', cacheKey)
                .gt('expires_at', new Date().toISOString())
                .single();

            if (cached?.data) {
                return NextResponse.json({
                    ...cached.data,
                    bbox: clamped,
                    date_range: {start: start_date, end: end_date},
                    source: 'Sentinel-2 L2A (Copernicus)',
                    year: 2026,
                    tier: 'CACHED',
                    timestamp: new Date().toISOString(),
                });
            }
        } catch {
            console.warn('[NDVI API] CACHED tier failed');
        }

        // ── Tier 3: MOCK — Static fallback ─────────────────────────────────────
        const mockData = index.toUpperCase() === 'NDWI' ? MOCK_NDWI : MOCK_NDVI;

        return NextResponse.json({
            ...mockData,
            bbox: clamped,
            date_range: {start: start_date, end: end_date},
            source: 'Sentinel-2 L2A (Copernicus)',
            year: 2026,
            tier: 'MOCK',
            timestamp: new Date().toISOString(),
        });
    } catch (err) {
        console.error('[NDVI API] Internal Error:', err);
        return NextResponse.json({error: 'Internal Server Error'}, {status: 500});
    }
}

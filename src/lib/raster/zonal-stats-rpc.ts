/**
 * @file src/lib/raster/zonal-stats-rpc.ts
 * @description Supabase RPC call to trigger BigQuery ST_REGIONSTATS() execution
 * for a user-drawn polygon over Cape Town cadastral raster layers.
 *
 * Flow: Frontend → Supabase Edge Function → BigQuery SQL → Response
 * The Edge Function proxies to BigQuery because the frontend cannot directly
 * call BigQuery (no client SDK, CORS restrictions, credential exposure risk).
 *
 * @compliance POPIA: Polygon geometry is ephemeral (not stored). Raster data
 * is non-personal satellite imagery in africa-south1.
 */
import {createClient} from '@supabase/supabase-js';
import type {GeoJSON} from 'geojson';

// ─── Types ───────────────────────────────────────────────────────────────────

/** Band statistics returned by ST_REGIONSTATS */
export interface BandStats {
    /** Band name (e.g., B4, B3, B2, NDVI) */
    band: string;
    /** Minimum pixel value in the polygon */
    min: number;
    /** Maximum pixel value in the polygon */
    max: number;
    /** Mean pixel value in the polygon */
    mean: number;
    /** Standard deviation of pixel values */
    stddev: number;
    /** Number of valid (non-NoData) pixels */
    count: number;
    /** Sum of all pixel values */
    sum: number;
}

/** Zonal statistics result for a user-drawn polygon */
export interface ZonalStatsResult {
    /** Unique request ID for tracing */
    request_id: string;
    /** Raster layer queried */
    layer: string;
    /** Area of the polygon in square metres */
    area_sqm: number;
    /** Per-band statistics */
    bands: BandStats[];
    /** ISO timestamp of the raster data */
    raster_date: string;
    /** Execution time in milliseconds */
    execution_ms: number;
}

/** Available raster layers for zonal stats */
export type RasterLayer =
    | 'sentinel2_rgb'
    | 'ndvi_composite'
    | 'land_surface_temperature'
    | 'elevation_dem';

// ─── Supabase Client ─────────────────────────────────────────────────────────

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ─── RPC Call ────────────────────────────────────────────────────────────────

/**
 * Execute zonal statistics for a user-drawn polygon over a Cape Town raster layer.
 *
 * The Supabase Edge Function `rpc_zonal_stats` proxies to BigQuery where
 * ST_REGIONSTATS() computes per-band statistics (min, max, mean, stddev, count)
 * for the intersection of the polygon and the raster.
 *
 * @param polygon - GeoJSON Polygon geometry drawn by the user on the map
 * @param layer - Raster layer to query (default: sentinel2_rgb)
 * @param date - Optional ISO date string to query a specific temporal slice
 * @returns ZonalStatsResult with per-band statistics
 *
 * @example
 * ```ts
 * const polygon = drawControl.getAll().features[0].geometry;
 * const stats = await getZonalStats(polygon, 'ndvi_composite', '2024-06');
 * console.log(stats.bands[0].mean); // Average NDVI in the polygon
 * ```
 */
export async function getZonalStats(
    polygon: GeoJSON.Polygon | GeoJSON.MultiPolygon,
    layer: RasterLayer = 'sentinel2_rgb',
    date?: string,
): Promise<ZonalStatsResult> {
    const {data, error} = await supabase.rpc('rpc_zonal_stats', {
        geojson_polygon: JSON.stringify(polygon),
        raster_layer: layer,
        target_date: date ?? null,
    });

    if (error) {
        throw new Error(`Zonal stats RPC failed: ${error.message}`);
    }

    return data as ZonalStatsResult;
}

/**
 * SQL definition for the Supabase Edge Function / PostGIS function.
 *
 * This function can be deployed as either:
 * 1. A Supabase Edge Function that proxies to BigQuery (preferred for ST_REGIONSTATS)
 * 2. A PostGIS database function using ST_SummaryStats on out-db rasters
 *
 * Option 2 (PostGIS out-db) — deploy via migration:
 *
 * ```sql
 * CREATE OR REPLACE FUNCTION public.rpc_zonal_stats(
 *   geojson_polygon TEXT,
 *   raster_layer TEXT DEFAULT 'sentinel2_rgb',
 *   target_date TEXT DEFAULT NULL
 * )
 * RETURNS JSONB
 * LANGUAGE plpgsql
 * SECURITY DEFINER
 * SET search_path = public
 * AS $$
 * DECLARE
 *   result JSONB;
 *   poly GEOMETRY;
 *   start_ts TIMESTAMPTZ := clock_timestamp();
 * BEGIN
 *   -- Parse GeoJSON polygon
 *   poly := ST_SetSRID(ST_GeomFromGeoJSON(geojson_polygon), 4326);
 *
 *   -- Validate polygon
 *   IF NOT ST_IsValid(poly) THEN
 *     RAISE EXCEPTION 'Invalid polygon geometry';
 *   END IF;
 *
 *   -- Compute zonal stats from out-db rasters
 *   SELECT jsonb_build_object(
 *     'request_id', gen_random_uuid()::text,
 *     'layer', raster_layer,
 *     'area_sqm', ST_Area(poly::geography),
 *     'raster_date', COALESCE(rc.acquired_at::text, 'unknown'),
 *     'execution_ms', EXTRACT(MILLISECOND FROM clock_timestamp() - start_ts),
 *     'bands', jsonb_agg(jsonb_build_object(
 *       'band', band_name,
 *       'min', (stats).min,
 *       'max', (stats).max,
 *       'mean', (stats).mean,
 *       'stddev', (stats).stddev,
 *       'count', (stats).count,
 *       'sum', (stats).sum
 *     ))
 *   )
 *   INTO result
 *   FROM public.raster_catalog rc,
 *        LATERAL unnest(rc.bands) AS band_name,
 *        LATERAL ST_SummaryStats(
 *          ST_Clip(rc.rast, poly),
 *          1, -- band number
 *          true -- exclude NoData
 *        ) AS stats
 *   WHERE rc.name ILIKE '%' || raster_layer || '%'
 *     AND (target_date IS NULL OR rc.acquired_at::text LIKE target_date || '%')
 *     AND ST_Intersects(rc.rast::geometry, poly);
 *
 *   RETURN COALESCE(result, '{"error": "No raster data found for this area"}'::jsonb);
 * END;
 * $$;
 *
 * -- Grant execute to authenticated users only
 * GRANT EXECUTE ON FUNCTION public.rpc_zonal_stats TO authenticated;
 * ```
 */
export const ZONAL_STATS_SQL_REFERENCE = 'See inline JSDoc above for PostGIS function definition';

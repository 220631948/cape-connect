-- ==========================================
-- 20260314000001_export_rpc.sql
-- Export RPC for spatial analysis
-- ==========================================

-- 1. export_area()
-- Extracts properties intersecting a polygon as GeoJSON
CREATE OR REPLACE FUNCTION public.export_area(geom_geom geometry)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'type', 'FeatureCollection',
        'features', COALESCE(jsonb_agg(
            jsonb_build_object(
                'type', 'Feature',
                'geometry', ST_AsGeoJSON(p.geometry)::jsonb,
                'properties', jsonb_build_object(
                    'id', p.id,
                    'erf_no', p.property_data->>'erf_no',
                    'suburb', p.property_data->>'suburb',
                    'zoning', (SELECT code FROM zones z WHERE ST_Intersects(p.geometry, z.geometry) LIMIT 1),
                    'valuation', p.valuation_data->>'city_valuation_zar'
                )
            )
        ), '[]'::jsonb)
    ) INTO result
    FROM properties p
    WHERE ST_Intersects(p.geometry, geom_geom)
    AND p.tenant_id = current_setting('app.current_tenant', TRUE)::uuid;

    RETURN result;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION public.export_area IS 'Exports properties within a geometry as a GeoJSON FeatureCollection for the current tenant.';

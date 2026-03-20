-- ==========================================
-- 20260310030000_user_features.sql
-- User Geometry Persistence & Spatial Analysis (M8)
-- Supports interactive polygon/line creation.
-- ==========================================

-- 1. Create user_features table
CREATE TABLE IF NOT EXISTS public.user_features (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    name TEXT,
    geometry GEOMETRY(Geometry, 4326) NOT NULL,
    properties JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. POPIA ANNOTATION (Rule 5)
COMMENT ON TABLE user_features IS 'PII: User-drawn geometries and notes. Strictly tenant and user isolated.';

-- 3. ENABLE RLS
ALTER TABLE user_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_features FORCE ROW LEVEL SECURITY;

-- 4. RLS POLICIES (Rule 2)
CREATE POLICY "user_features_isolation" ON user_features
  FOR ALL USING (
    tenant_id = current_setting('app.current_tenant', TRUE)::uuid
    AND (
        user_id = auth.uid() 
        OR current_setting('app.current_role', TRUE) = 'PLATFORM_ADMIN'
    )
  );

-- 5. INDEXES (Rule 4)
CREATE INDEX IF NOT EXISTS idx_user_features_tenant_user ON user_features(tenant_id, user_id);
CREATE INDEX IF NOT EXISTS idx_user_features_geometry ON user_features USING GIST(geometry);

-- 6. SPATIAL ANALYSIS RPC
-- analyze_area(geom)
-- Returns aggregate property/zoning stats for a given geometry.
CREATE OR REPLACE FUNCTION public.analyze_area(area_geom GEOMETRY)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'property_count', count(p.id),
        'total_valuation', coalesce(sum((p.valuation_data->>'city_valuation_zar')::bigint), 0),
        'zoning_breakdown', (
            SELECT jsonb_object_agg(zone_code, zone_count)
            FROM (
                SELECT z.code as zone_code, count(*) as zone_count
                FROM properties p2
                JOIN zones z ON ST_Intersects(p2.geometry, z.geometry)
                WHERE ST_Intersects(p2.geometry, area_geom)
                AND p2.tenant_id = current_setting('app.current_tenant', TRUE)::uuid
                GROUP BY z.code
            ) s
        )
    ) INTO result
    FROM properties p
    WHERE ST_Intersects(p.geometry, area_geom)
    AND p.tenant_id = current_setting('app.current_tenant', TRUE)::uuid;

    RETURN result;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION public.analyze_area IS 'Spatial analysis engine for cross-layer metrics within user-defined geometry.';

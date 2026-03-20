-- Create composite indexes for spatial tables to improve RLS performance
-- Implementation based on M1 Architect specifications

-- 1. Properties Index
-- Optimized for RLS queries filtering by geometry and tenant_id
CREATE INDEX IF NOT EXISTS idx_properties_geom_tenant 
ON public.properties USING GIST (geometry) INCLUDE (tenant_id);

-- 2. Zones Index
-- Optimized for RLS queries filtering by geometry and tenant_id
CREATE INDEX IF NOT EXISTS idx_zones_geom_tenant 
ON public.zones USING GIST (geometry) INCLUDE (tenant_id);

-- 3. Cleanup redundant single-column indexes (optional but recommended for storage)
-- DROP INDEX IF EXISTS idx_properties_geometry;
-- DROP INDEX IF EXISTS idx_zones_geometry;

COMMENT ON INDEX idx_properties_geom_tenant IS 'High-performance spatial index with RLS inclusion for property queries.';
COMMENT ON INDEX idx_zones_geom_tenant IS 'High-performance spatial index with RLS inclusion for zone queries.';

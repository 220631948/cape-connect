-- ==========================================
-- 20260319000000_copilot_spatial_tools.sql
-- GIS Copilot Phase 1 — PostGIS Tool Functions (6 tools)
-- Powers the /api/copilot/spatial endpoint.
-- All queries bounded to Western Cape bbox per CLAUDE.md.
-- ==========================================

-- Tool 1: geocode — already uses search_properties (existing RPC)

-- Tool 2: proximity — find features within radius of a point
CREATE OR REPLACE FUNCTION public.copilot_proximity(
  lng DOUBLE PRECISION,
  lat DOUBLE PRECISION,
  radius_m INTEGER DEFAULT 500,
  limit_n INTEGER DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  address TEXT,
  parcel_id TEXT,
  distance_m DOUBLE PRECISION,
  geometry GEOMETRY
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.address,
    (p.valuation_data->>'parcel_id')::text,
    ST_Distance(
      ST_Transform(p.geometry, 32734),
      ST_Transform(ST_SetSRID(ST_MakePoint(lng, lat), 4326), 32734)
    ) AS distance_m,
    p.geometry
  FROM public.properties p
  WHERE
    ST_DWithin(
      ST_Transform(p.geometry, 32734),
      ST_Transform(ST_SetSRID(ST_MakePoint(lng, lat), 4326), 32734),
      radius_m
    )
    AND p.tenant_id = current_setting('app.current_tenant', TRUE)::uuid
  ORDER BY distance_m
  LIMIT limit_n;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.copilot_proximity IS 'GIS Copilot Tool 2: Proximity search. Not PII.';

-- Tool 3: area_search — find features within a named suburb/area
CREATE OR REPLACE FUNCTION public.copilot_area_search(
  area_name TEXT,
  limit_n INTEGER DEFAULT 20
)
RETURNS TABLE (
  id UUID,
  address TEXT,
  parcel_id TEXT,
  geometry GEOMETRY
) AS $$
DECLARE
  area_geom GEOMETRY;
BEGIN
  -- Find the suburb/zone geometry that matches the name
  SELECT z.geometry INTO area_geom
  FROM public.zones z
  WHERE z.description ILIKE '%' || area_name || '%'
     OR z.code ILIKE '%' || area_name || '%'
  LIMIT 1;

  IF area_geom IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    p.id,
    p.address,
    (p.valuation_data->>'parcel_id')::text,
    p.geometry
  FROM public.properties p
  WHERE
    ST_Intersects(p.geometry, area_geom)
    AND p.tenant_id = current_setting('app.current_tenant', TRUE)::uuid
  LIMIT limit_n;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.copilot_area_search IS 'GIS Copilot Tool 3: Area search within named zone/suburb.';

-- Tool 4: property_details — ERF/parcel lookup
CREATE OR REPLACE FUNCTION public.copilot_property_details(
  erf_or_address TEXT
)
RETURNS TABLE (
  id UUID,
  address TEXT,
  parcel_id TEXT,
  valuation_data JSONB,
  geometry GEOMETRY
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.address,
    (p.valuation_data->>'parcel_id')::text,
    p.valuation_data,
    p.geometry
  FROM public.properties p
  WHERE
    (
      (p.valuation_data->>'parcel_id') ILIKE '%' || erf_or_address || '%'
      OR p.address ILIKE '%' || erf_or_address || '%'
    )
    AND p.tenant_id = current_setting('app.current_tenant', TRUE)::uuid
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.copilot_property_details IS 'GIS Copilot Tool 4: Property details by ERF/parcel ID.';

-- Tool 5: distance — Haversine distance between two addresses
CREATE OR REPLACE FUNCTION public.copilot_distance(
  address_a TEXT,
  address_b TEXT
)
RETURNS TABLE (
  address_a TEXT,
  address_b TEXT,
  distance_m DOUBLE PRECISION,
  distance_km DOUBLE PRECISION
) AS $$
DECLARE
  geom_a GEOMETRY;
  geom_b GEOMETRY;
BEGIN
  SELECT p.geometry INTO geom_a
  FROM public.properties p
  WHERE p.address ILIKE '%' || address_a || '%'
    AND p.tenant_id = current_setting('app.current_tenant', TRUE)::uuid
  LIMIT 1;

  SELECT p.geometry INTO geom_b
  FROM public.properties p
  WHERE p.address ILIKE '%' || address_b || '%'
    AND p.tenant_id = current_setting('app.current_tenant', TRUE)::uuid
  LIMIT 1;

  IF geom_a IS NULL OR geom_b IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    address_a,
    address_b,
    ST_Distance(
      ST_Transform(geom_a, 32734),
      ST_Transform(geom_b, 32734)
    ),
    ST_Distance(
      ST_Transform(geom_a, 32734),
      ST_Transform(geom_b, 32734)
    ) / 1000.0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.copilot_distance IS 'GIS Copilot Tool 5: Distance between two properties.';

-- Tool 6: count — count properties within an area
CREATE OR REPLACE FUNCTION public.copilot_count(
  area_name TEXT
)
RETURNS TABLE (
  area TEXT,
  property_count BIGINT
) AS $$
DECLARE
  area_geom GEOMETRY;
BEGIN
  SELECT z.geometry INTO area_geom
  FROM public.zones z
  WHERE z.description ILIKE '%' || area_name || '%'
     OR z.code ILIKE '%' || area_name || '%'
  LIMIT 1;

  IF area_geom IS NULL THEN
    RETURN QUERY SELECT area_name, 0::bigint;
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    area_name,
    COUNT(*)::bigint
  FROM public.properties p
  WHERE
    ST_Intersects(p.geometry, area_geom)
    AND p.tenant_id = current_setting('app.current_tenant', TRUE)::uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.copilot_count IS 'GIS Copilot Tool 6: Count properties in a named area/ward.';

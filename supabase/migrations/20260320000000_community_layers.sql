-- ==========================================
-- 20260320000000_community_layers.sql
-- M19 — Youth Digital Empowerment: Community resource & safe-walk tables.
-- Tenant-isolated with RLS. Spatial indexes on geometry columns.
-- ==========================================

-- ── Table: community_resources ──
-- WiFi hotspots, libraries, computer labs, and other digital access points.
CREATE TABLE IF NOT EXISTS public.community_resources (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES public.tenants(id),
  name        TEXT NOT NULL,
  category    TEXT NOT NULL CHECK (category IN ('wifi', 'library', 'computer_lab', 'community_centre', 'coworking')),
  address     TEXT,
  description TEXT,
  operating_hours TEXT,
  is_free     BOOLEAN DEFAULT TRUE,
  geometry    GEOMETRY(Point, 4326) NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.community_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_resources FORCE ROW LEVEL SECURITY;

CREATE POLICY community_resources_tenant_isolation ON public.community_resources
  USING (tenant_id = current_setting('app.current_tenant', TRUE)::uuid);

CREATE POLICY community_resources_insert ON public.community_resources
  FOR INSERT WITH CHECK (tenant_id = current_setting('app.current_tenant', TRUE)::uuid);

CREATE INDEX idx_community_resources_geom ON public.community_resources USING GIST (geometry);
CREATE INDEX idx_community_resources_tenant ON public.community_resources (tenant_id);
CREATE INDEX idx_community_resources_category ON public.community_resources (category);

COMMENT ON TABLE public.community_resources IS 'M19: Digital resource access points for youth empowerment. Not PII.';

-- ── Table: safe_walk_corridors ──
-- Verified safe walking routes with lighting, CCTV, and community watch coverage.
CREATE TABLE IF NOT EXISTS public.safe_walk_corridors (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES public.tenants(id),
  name          TEXT NOT NULL,
  safety_rating INTEGER NOT NULL CHECK (safety_rating BETWEEN 1 AND 5),
  has_lighting  BOOLEAN DEFAULT FALSE,
  has_cctv      BOOLEAN DEFAULT FALSE,
  has_community_watch BOOLEAN DEFAULT FALSE,
  description   TEXT,
  distance_m    DOUBLE PRECISION,
  geometry      GEOMETRY(LineString, 4326) NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.safe_walk_corridors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.safe_walk_corridors FORCE ROW LEVEL SECURITY;

CREATE POLICY safe_walk_corridors_tenant_isolation ON public.safe_walk_corridors
  USING (tenant_id = current_setting('app.current_tenant', TRUE)::uuid);

CREATE POLICY safe_walk_corridors_insert ON public.safe_walk_corridors
  FOR INSERT WITH CHECK (tenant_id = current_setting('app.current_tenant', TRUE)::uuid);

CREATE INDEX idx_safe_walk_corridors_geom ON public.safe_walk_corridors USING GIST (geometry);
CREATE INDEX idx_safe_walk_corridors_tenant ON public.safe_walk_corridors (tenant_id);

COMMENT ON TABLE public.safe_walk_corridors IS 'M19: Community-verified safe walking routes. Not PII.';

-- ── Seed data: Cape Town test tenant ──
-- Uses the test tenant from M1 seed migration.
DO $$
DECLARE
  test_tenant UUID;
BEGIN
  SELECT id INTO test_tenant FROM public.tenants LIMIT 1;
  IF test_tenant IS NULL THEN RETURN; END IF;

  -- Digital resources
  INSERT INTO public.community_resources (tenant_id, name, category, address, is_free, geometry) VALUES
    (test_tenant, 'Cape Town Central Library', 'library', '4 Darling St, Cape Town', TRUE, ST_SetSRID(ST_MakePoint(18.4241, -33.9249), 4326)),
    (test_tenant, 'Athlone Library', 'library', 'Klipfontein Rd, Athlone', TRUE, ST_SetSRID(ST_MakePoint(18.5035, -33.9527), 4326)),
    (test_tenant, 'Khayelitsha Public WiFi', 'wifi', 'Khayelitsha CBD', TRUE, ST_SetSRID(ST_MakePoint(18.6744, -34.0443), 4326)),
    (test_tenant, 'iKhaya Computer Lab', 'computer_lab', 'Gugulethu', TRUE, ST_SetSRID(ST_MakePoint(18.5676, -33.9784), 4326)),
    (test_tenant, 'Workshop17 Watershed', 'coworking', 'V&A Waterfront', FALSE, ST_SetSRID(ST_MakePoint(18.4207, -33.9033), 4326))
  ON CONFLICT DO NOTHING;

  -- Safe walk corridors
  INSERT INTO public.safe_walk_corridors (tenant_id, name, safety_rating, has_lighting, has_cctv, distance_m, geometry) VALUES
    (test_tenant, 'Sea Point Promenade', 5, TRUE, TRUE, 3200, ST_SetSRID(ST_MakeLine(ARRAY[ST_MakePoint(18.3811, -33.9155), ST_MakePoint(18.3649, -33.9262)]), 4326)),
    (test_tenant, 'Company''s Garden Path', 4, TRUE, TRUE, 800, ST_SetSRID(ST_MakeLine(ARRAY[ST_MakePoint(18.4176, -33.9280), ST_MakePoint(18.4131, -33.9316)]), 4326)),
    (test_tenant, 'Green Point Urban Park', 4, TRUE, FALSE, 1500, ST_SetSRID(ST_MakeLine(ARRAY[ST_MakePoint(18.4080, -33.9108), ST_MakePoint(18.3980, -33.9145)]), 4326))
  ON CONFLICT DO NOTHING;
END $$;

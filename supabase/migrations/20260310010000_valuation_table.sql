-- ==========================================
-- 20260310010000_valuation_table.sql
-- Dedicated Property Valuation Table (M6)
-- Supports ~830k records with spatial join.
-- ==========================================

-- 1. Create valuation_data table
CREATE TABLE IF NOT EXISTS valuation_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    parcel_id TEXT NOT NULL, -- SG-21 or ERF#
    suburb TEXT,
    zone_code TEXT,
    city_valuation_zar BIGINT,
    gv_year INTEGER DEFAULT 2022,
    coordinates GEOMETRY(Point, 4326),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. POPIA ANNOTATION (Rule 5)
COMMENT ON TABLE valuation_data IS 'PII: Property valuation data tied to parcels. Owner names MUST be stripped on import. Purpose: Property intelligence analysis.';

-- 3. ENABLE RLS
ALTER TABLE valuation_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE valuation_data FORCE ROW LEVEL SECURITY;

-- 4. RLS POLICY (Rule 2)
CREATE POLICY "valuation_data_tenant_isolation" ON valuation_data
  FOR ALL USING (
    tenant_id = current_setting('app.current_tenant', TRUE)::uuid
    OR current_setting('app.current_role', TRUE) = 'PLATFORM_ADMIN'
  );

-- 5. INDEXES (Rule 4)
CREATE INDEX IF NOT EXISTS idx_valuation_tenant_id ON valuation_data(tenant_id);
CREATE INDEX IF NOT EXISTS idx_valuation_parcel_id ON valuation_data(parcel_id);
CREATE INDEX IF NOT EXISTS idx_valuation_coordinates ON valuation_data USING GIST(coordinates);

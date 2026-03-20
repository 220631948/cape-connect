-- ==========================================
-- 20250227140000_initial_schema.sql
-- CapeTown GIS Hub — Core Schema
-- RLS pattern: current_setting('app.current_tenant')
-- ==========================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "hstore";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. CUSTOM TYPES
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM (
        'PLATFORM_ADMIN',
        'TENANT_ADMIN',
        'POWER_USER',
        'ANALYST',
        'VIEWER',
        'GUEST'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. TABLES

-- Tenants (Multi-tenancy root)
CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    config JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Profiles (User data + RBAC + Tenant linkage)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    role user_role DEFAULT 'VIEWER'::user_role,
    popia_consent BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Properties (Core GIS data)
CREATE TABLE IF NOT EXISTS properties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    address TEXT NOT NULL,
    geometry GEOMETRY(Geometry, 4326),
    valuation_data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Zones (Zoning overlays)
CREATE TABLE IF NOT EXISTS zones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    description TEXT,
    geometry GEOMETRY(MultiPolygon, 4326),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Favourites (User-specific property bookmarks)
CREATE TABLE IF NOT EXISTS favourites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, property_id)
);

-- Saved Searches
CREATE TABLE IF NOT EXISTS saved_searches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    filters JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- API Cache (Three-tier fallback cache layer)
CREATE TABLE IF NOT EXISTS api_cache (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    cache_key TEXT NOT NULL,
    data JSONB NOT NULL,
    source TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(tenant_id, cache_key)
);

-- Audit Log (POPIA compliance)
CREATE TABLE IF NOT EXISTS audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    user_id UUID REFERENCES profiles(id),
    action TEXT NOT NULL,
    table_name TEXT NOT NULL,
    record_id UUID NOT NULL,
    old_data JSONB,
    new_data JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Tenant Settings (White-label theming)
CREATE TABLE IF NOT EXISTS tenant_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL UNIQUE REFERENCES tenants(id) ON DELETE CASCADE,
    primary_color TEXT DEFAULT '#3B82F6',
    logo_url TEXT,
    font_family TEXT DEFAULT 'Inter',
    map_style_override_json JSONB,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. POPIA ANNOTATIONS (SQL Comments)
COMMENT ON TABLE profiles IS 'PII: email, full_name. POPIA compliance required.';
COMMENT ON COLUMN profiles.email IS 'PII: User email address.';
COMMENT ON COLUMN profiles.full_name IS 'PII: User full name.';
COMMENT ON TABLE favourites IS 'PII: User-property relationship.';
COMMENT ON TABLE saved_searches IS 'PII: User search patterns.';
COMMENT ON TABLE audit_log IS 'PII: User activity tracking.';

-- 5. ROW LEVEL SECURITY — ENABLE + FORCE

ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenants FORCE ROW LEVEL SECURITY;

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles FORCE ROW LEVEL SECURITY;

ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties FORCE ROW LEVEL SECURITY;

ALTER TABLE zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE zones FORCE ROW LEVEL SECURITY;

ALTER TABLE favourites ENABLE ROW LEVEL SECURITY;
ALTER TABLE favourites FORCE ROW LEVEL SECURITY;

ALTER TABLE saved_searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_searches FORCE ROW LEVEL SECURITY;

ALTER TABLE api_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_cache FORCE ROW LEVEL SECURITY;

ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log FORCE ROW LEVEL SECURITY;

ALTER TABLE tenant_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_settings FORCE ROW LEVEL SECURITY;

-- 6. RLS POLICIES — current_setting('app.current_tenant') pattern
-- Session variables set at connection time by application layer:
--   SET app.current_tenant = '<tenant_id from JWT>';
--   SET app.current_role   = '<role from JWT>';

CREATE POLICY "tenants_isolation" ON tenants
  FOR SELECT USING (
    id = current_setting('app.current_tenant', TRUE)::uuid
    OR current_setting('app.current_role', TRUE) = 'PLATFORM_ADMIN'
  );

CREATE POLICY "profiles_isolation" ON profiles
  FOR ALL USING (
    tenant_id = current_setting('app.current_tenant', TRUE)::uuid
    OR current_setting('app.current_role', TRUE) = 'PLATFORM_ADMIN'
  );

CREATE POLICY "properties_tenant_isolation" ON properties
  FOR ALL USING (
    tenant_id = current_setting('app.current_tenant', TRUE)::uuid
    OR current_setting('app.current_role', TRUE) = 'PLATFORM_ADMIN'
  );

CREATE POLICY "zones_tenant_isolation" ON zones
  FOR ALL USING (
    tenant_id = current_setting('app.current_tenant', TRUE)::uuid
    OR current_setting('app.current_role', TRUE) = 'PLATFORM_ADMIN'
  );

CREATE POLICY "favourites_tenant_isolation" ON favourites
  FOR ALL USING (
    tenant_id = current_setting('app.current_tenant', TRUE)::uuid
    OR current_setting('app.current_role', TRUE) = 'PLATFORM_ADMIN'
  );

CREATE POLICY "saved_searches_tenant_isolation" ON saved_searches
  FOR ALL USING (
    tenant_id = current_setting('app.current_tenant', TRUE)::uuid
    OR current_setting('app.current_role', TRUE) = 'PLATFORM_ADMIN'
  );

CREATE POLICY "api_cache_tenant_isolation" ON api_cache
  FOR ALL USING (
    tenant_id = current_setting('app.current_tenant', TRUE)::uuid
    OR current_setting('app.current_role', TRUE) = 'PLATFORM_ADMIN'
  );

CREATE POLICY "audit_log_tenant_isolation" ON audit_log
  FOR SELECT USING (
    tenant_id = current_setting('app.current_tenant', TRUE)::uuid
    AND current_setting('app.current_role', TRUE) IN ('TENANT_ADMIN', 'PLATFORM_ADMIN')
  );

CREATE POLICY "tenant_settings_isolation" ON tenant_settings
  FOR ALL USING (
    tenant_id = current_setting('app.current_tenant', TRUE)::uuid
    OR current_setting('app.current_role', TRUE) = 'PLATFORM_ADMIN'
  );

-- 7. INDEXES
CREATE INDEX IF NOT EXISTS idx_properties_tenant_id ON properties(tenant_id);
CREATE INDEX IF NOT EXISTS idx_properties_geometry ON properties USING GIST(geometry);
CREATE INDEX IF NOT EXISTS idx_zones_tenant_id ON zones(tenant_id);
CREATE INDEX IF NOT EXISTS idx_zones_geometry ON zones USING GIST(geometry);
CREATE INDEX IF NOT EXISTS idx_profiles_tenant_id ON profiles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_tenant_id ON audit_log(tenant_id);
CREATE INDEX IF NOT EXISTS idx_api_cache_tenant_key ON api_cache(tenant_id, cache_key);
CREATE INDEX IF NOT EXISTS idx_api_cache_expires ON api_cache(expires_at);

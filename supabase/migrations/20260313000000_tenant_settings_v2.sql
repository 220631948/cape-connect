-- Migration: tenant_settings_v2
-- Date: 2026-03-13
-- Author: fullstack-developer

-- 1. Add planned fields to tenant_settings
ALTER TABLE tenant_settings
  ADD COLUMN IF NOT EXISTS secondary_color TEXT DEFAULT '#1E40AF',
  ADD COLUMN IF NOT EXISTS brand_name      TEXT,
  ADD COLUMN IF NOT EXISTS subdomain       TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS support_email   TEXT,
  ADD COLUMN IF NOT EXISTS features        JSONB DEFAULT '{}'::jsonb;

-- 2. Backfill subdomain from tenants table if possible
UPDATE tenant_settings ts
SET subdomain = t.slug
FROM tenants t
WHERE ts.tenant_id = t.id;

-- 3. Trigger for updated_at (if not already exists from M1)
CREATE OR REPLACE FUNCTION update_tenant_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS trigger_update_tenant_settings_updated_at ON tenant_settings;
CREATE TRIGGER trigger_update_tenant_settings_updated_at
    BEFORE UPDATE ON tenant_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_tenant_settings_updated_at();

-- 4. RLS Policy (Update)
-- Ensure only TENANT_ADMIN can update their own settings
DROP POLICY IF EXISTS "tenant_settings_update" ON tenant_settings;
CREATE POLICY "tenant_settings_update" ON tenant_settings
  FOR UPDATE
  USING (
    tenant_id = current_setting('app.current_tenant', TRUE)::uuid
    AND (
      SELECT role FROM profiles WHERE id = auth.uid()
    ) IN ('TENANT_ADMIN', 'PLATFORM_ADMIN')
  );

-- 5. RLS Policy (Select)
-- Any authenticated user can read their own tenant's settings
DROP POLICY IF EXISTS "tenant_settings_read" ON tenant_settings;
CREATE POLICY "tenant_settings_read" ON tenant_settings
  FOR SELECT
  USING (
    tenant_id = current_setting('app.current_tenant', TRUE)::uuid
  );

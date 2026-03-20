-- Migration: M16 User Management & Tenant Admin
-- @compliance POPIA: User role assignments are tenant-scoped and audited.

-- 1. Add role column to profiles (if not already present)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'role'
  ) THEN
    ALTER TABLE profiles ADD COLUMN role TEXT NOT NULL DEFAULT 'viewer'
      CHECK (role IN ('viewer', 'analyst', 'power_user', 'admin'));
  END IF;
END $$;

-- 2. Audit log table for security events
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  user_id UUID,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'login', 'logout', 'role_change', 'user_invite', 'user_remove',
    'tenant_create', 'feature_create', 'feature_delete'
  )),
  details JSONB DEFAULT '{}',
  ip_address INET,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS on audit_log
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log FORCE ROW LEVEL SECURITY;

CREATE POLICY audit_log_tenant_isolation ON audit_log
  FOR ALL
  USING (tenant_id::text = current_setting('app.current_tenant', true));

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_audit_log_tenant_created 
  ON audit_log(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_event_type 
  ON audit_log(event_type);

-- 3. Tenant invitations table
CREATE TABLE IF NOT EXISTS tenant_invitations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'viewer'
    CHECK (role IN ('viewer', 'analyst', 'power_user', 'admin')),
  invited_by UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'expired', 'revoked')),
  token TEXT NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '7 days',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS on tenant_invitations
ALTER TABLE tenant_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_invitations FORCE ROW LEVEL SECURITY;

CREATE POLICY invitations_tenant_isolation ON tenant_invitations
  FOR ALL
  USING (tenant_id::text = current_setting('app.current_tenant', true));

-- Unique constraint: one pending invite per email per tenant
CREATE UNIQUE INDEX IF NOT EXISTS idx_invitations_unique_pending 
  ON tenant_invitations(tenant_id, email) 
  WHERE status = 'pending';

-- 4. Grant role change function (admin only)
CREATE OR REPLACE FUNCTION assign_user_role(
  target_user_id UUID,
  new_role TEXT
) RETURNS VOID AS $$
DECLARE
  caller_role TEXT;
  caller_tenant UUID;
BEGIN
  -- Get caller's role and tenant
  SELECT role, tenant_id INTO caller_role, caller_tenant
  FROM profiles
  WHERE id = auth.uid();

  -- Only admins can assign roles
  IF caller_role != 'admin' THEN
    RAISE EXCEPTION 'Insufficient privileges: only admins can assign roles';
  END IF;

  -- Prevent self-demotion
  IF target_user_id = auth.uid() AND new_role != 'admin' THEN
    RAISE EXCEPTION 'Cannot demote yourself';
  END IF;

  -- Update role (RLS ensures same tenant)
  UPDATE profiles 
  SET role = new_role 
  WHERE id = target_user_id 
    AND tenant_id = caller_tenant;

  -- Audit log
  INSERT INTO audit_log (tenant_id, user_id, event_type, details)
  VALUES (caller_tenant, auth.uid(), 'role_change', jsonb_build_object(
    'target_user_id', target_user_id,
    'new_role', new_role
  ));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

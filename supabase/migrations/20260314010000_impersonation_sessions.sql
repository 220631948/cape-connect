-- Migration: Secure admin impersonation sessions
-- @compliance POPIA: Administrative impersonation events are auditable and tenant-scoped.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Ensure audit_log has fields needed by existing admin routes and impersonation auditing.
ALTER TABLE audit_log
  ADD COLUMN IF NOT EXISTS event_type TEXT,
  ADD COLUMN IF NOT EXISTS details JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS ip_address INET;

-- Best-effort backfill for legacy schema variants.
UPDATE audit_log
SET event_type = COALESCE(event_type, action)
WHERE event_type IS NULL
  AND action IS NOT NULL;

-- Expand event-type policy to include impersonation lifecycle events.
DO $$
DECLARE
  check_name TEXT;
BEGIN
  SELECT c.conname
  INTO check_name
  FROM pg_constraint c
  JOIN pg_class t ON t.oid = c.conrelid
  WHERE t.relname = 'audit_log'
    AND c.contype = 'c'
    AND pg_get_constraintdef(c.oid) ILIKE '%event_type%';

  IF check_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE audit_log DROP CONSTRAINT %I', check_name);
  END IF;
END $$;

ALTER TABLE audit_log
  ADD CONSTRAINT audit_log_event_type_check
  CHECK (event_type IN (
    'login',
    'logout',
    'role_change',
    'user_invite',
    'user_remove',
    'tenant_create',
    'feature_create',
    'feature_delete',
    'impersonation_started',
    'impersonation_action',
    'impersonation_ended',
    'BREAK_GLASS_ACCESS'
  )) NOT VALID;

CREATE TABLE IF NOT EXISTS impersonation_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  impersonator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  target_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  impersonator_role TEXT NOT NULL,
  reason TEXT,
  audit_id UUID REFERENCES audit_log(id),
  token_jti TEXT NOT NULL UNIQUE,
  request_id TEXT,
  ip_address INET,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT impersonation_sessions_not_self CHECK (impersonator_id <> target_user_id),
  CONSTRAINT impersonation_sessions_expiry_after_start CHECK (expires_at > started_at),
  CONSTRAINT impersonation_sessions_end_when_inactive CHECK (
    (active = TRUE AND ended_at IS NULL) OR (active = FALSE)
  )
);

CREATE INDEX IF NOT EXISTS idx_impersonation_sessions_tenant_active
  ON impersonation_sessions(tenant_id, active, started_at DESC);

CREATE INDEX IF NOT EXISTS idx_impersonation_sessions_impersonator_active
  ON impersonation_sessions(impersonator_id, active);

CREATE INDEX IF NOT EXISTS idx_impersonation_sessions_target_active
  ON impersonation_sessions(target_user_id, active);

CREATE INDEX IF NOT EXISTS idx_impersonation_sessions_token_jti
  ON impersonation_sessions(token_jti);

ALTER TABLE impersonation_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE impersonation_sessions FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS impersonation_sessions_select ON impersonation_sessions;
CREATE POLICY impersonation_sessions_select ON impersonation_sessions
  FOR SELECT
  USING (
    auth.uid() = impersonator_id
    OR auth.uid() = target_user_id
    OR EXISTS (
      SELECT 1
      FROM profiles actor
      WHERE actor.id = auth.uid()
        AND actor.role::text IN ('PLATFORM_ADMIN', 'platform_admin')
    )
  );

DROP POLICY IF EXISTS impersonation_sessions_insert ON impersonation_sessions;
CREATE POLICY impersonation_sessions_insert ON impersonation_sessions
  FOR INSERT
  WITH CHECK (
    auth.uid() = impersonator_id
    AND EXISTS (
      SELECT 1
      FROM profiles actor
      JOIN profiles target ON target.id = target_user_id
      WHERE actor.id = auth.uid()
        AND (
          actor.role::text IN ('PLATFORM_ADMIN', 'platform_admin')
          OR (
            actor.role::text IN ('TENANT_ADMIN', 'tenant_admin', 'admin')
            AND actor.tenant_id = target.tenant_id
            AND tenant_id = target.tenant_id
          )
        )
    )
  );

DROP POLICY IF EXISTS impersonation_sessions_update ON impersonation_sessions;
CREATE POLICY impersonation_sessions_update ON impersonation_sessions
  FOR UPDATE
  USING (
    auth.uid() = impersonator_id
    OR EXISTS (
      SELECT 1
      FROM profiles actor
      WHERE actor.id = auth.uid()
        AND actor.role::text IN ('PLATFORM_ADMIN', 'platform_admin')
    )
  )
  WITH CHECK (
    active IN (TRUE, FALSE)
  );

DROP POLICY IF EXISTS impersonation_sessions_delete ON impersonation_sessions;
CREATE POLICY impersonation_sessions_delete ON impersonation_sessions
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM profiles actor
      WHERE actor.id = auth.uid()
        AND actor.role::text IN ('PLATFORM_ADMIN', 'platform_admin')
    )
  );

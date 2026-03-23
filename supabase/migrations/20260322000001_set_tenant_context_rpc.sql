-- Migration: set_tenant_context RPC
-- Bug 1.2: app.current_tenant not injected before RLS queries
-- Creates a SECURITY DEFINER function to set the PostgreSQL session variable
-- that RLS policies evaluate for tenant isolation.

CREATE OR REPLACE FUNCTION set_tenant_context(tenant_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  PERFORM set_config('app.current_tenant', tenant_id::text, true);
END;
$$;

-- Lock execute to authenticated role only
REVOKE ALL ON FUNCTION set_tenant_context(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION set_tenant_context(uuid) TO authenticated;

COMMENT ON FUNCTION set_tenant_context(uuid) IS
  'Sets app.current_tenant session variable for RLS policy evaluation. Must be called before any tenant-scoped query.';

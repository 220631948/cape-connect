-- Migration: create_tenant_atomic RPC
-- Bug 1.7: Non-atomic tenant creation leaves tenant ownerless
-- Wraps tenant + settings + admin assignment in a single implicit transaction.

CREATE OR REPLACE FUNCTION create_tenant_atomic(
  p_name        text,
  p_slug        text,
  p_admin_user_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_tenant_id uuid;
BEGIN
  -- 1. Insert tenant
  INSERT INTO tenants (name, slug)
  VALUES (p_name, p_slug)
  RETURNING id INTO v_tenant_id;

  -- 2. Insert default tenant_settings (primary_color '#00D1FF' per CLAUDE.md §3.9)
  INSERT INTO tenant_settings (tenant_id, primary_color, brand_name, features_enabled)
  VALUES (v_tenant_id, '#00D1FF', p_name, ARRAY['zoning','search','flights']);

  -- 3. Assign requesting admin as TENANT_ADMIN of new tenant
  UPDATE profiles
  SET tenant_id = v_tenant_id,
      role      = 'TENANT_ADMIN'
  WHERE id = p_admin_user_id;

  RETURN jsonb_build_object(
    'tenant_id', v_tenant_id,
    'name', p_name,
    'slug', p_slug
  );
END;
$$;

-- Lock execute to authenticated role only
REVOKE ALL ON FUNCTION create_tenant_atomic(text, text, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION create_tenant_atomic(text, text, uuid) TO authenticated;

COMMENT ON FUNCTION create_tenant_atomic(text, text, uuid) IS
  'Atomically creates a tenant, default settings, and assigns the requesting user as TENANT_ADMIN.';

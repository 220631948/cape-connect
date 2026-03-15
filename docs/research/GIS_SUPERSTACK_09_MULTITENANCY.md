# GIS_SUPERSTACK_09_MULTITENANCY

Author: Unit 09 — GIS_SUPERSTACK_09_MULTITENANCY researcher
Date: 2026-03-15
Project: CapeTown GIS Hub (capegis)

Summary
-------
This document collects recommended patterns, SQL examples, design decisions and test patterns for multi-tenancy in the CapeTown GIS Hub. It targets Postgres/PostGIS + Supabase deployments and enforces the project's non-negotiable rules (see CLAUDE.md). Focus areas:
- Row Level Security (RLS) patterns and exact policy SQL
- Tenant isolation at DB and application layer
- Role hierarchy and RBAC mapping
- JWT / session lifecycle strategies
- tenant_settings table design
- Testing and rollback patterns

Note: This doc intentionally includes the canonical RLS SQL pattern from CLAUDE.md Rule 4 and concrete examples.

### Table of contents
- ### Overview [Tool v1.0] – https://www.postgresql.org/docs/
- ### Canonical RLS pattern (exact) [Tool v1.1] – https://www.postgresql.org/docs/current/ddl-rowsecurity.html
- ### Implementation: example policies [Tool v1.2] – https://supabase.com/docs
- ### Setting app.current_tenant (connection context) [Tool v1.3] – https://www.postgresql.org/docs/current/functions-admin.html
- ### Role hierarchy and mapping to SQL roles [Tool v1.4] – https://www.postgresql.org/docs/current/user-manag.html
- ### JWT & session strategies (short- and long-lived) [Tool v1.5] – https://supabase.com/docs/guides/auth
- ### tenant_settings table design (DDL + examples) [Tool v1.6] – https://developers.google.com
- ### Testing patterns (pgTAP, integration, CI) [Tool v1.7] – https://pgtap.org
- Rollback notes appear in each section.


### Overview [Tool v1.0] – https://www.postgresql.org/docs/

Purpose
- Ensure tenant isolation in storage and at runtime.
- Provide clear, auditable policies for access to tenant-scoped tables.
- Make application code responsible for setting runtime tenant context.

Key constraints (per CLAUDE.md):
- All tenant-scoped tables must have RLS enabled and forced.
- Application must set app.current_tenant on connection scope before queries run.
- No mixing of tenant data in queries; always rely on RLS for enforcement.

Rollback: If an RLS rollout causes outages, deploy a short-term fail-open migration that disables FORCE ROW LEVEL SECURITY for affected tables, then revert once the app is patched.

Rollback CLI snippet:

psql "$DATABASE_URL" -c "ALTER TABLE profiles NO FORCE ROW LEVEL SECURITY;"


### Canonical RLS pattern (exact) [Tool v1.1] – https://www.postgresql.org/docs/current/ddl-rowsecurity.html

The following SQL is the canonical pattern mandated in CLAUDE.md Rule 4 and must appear verbatim in any guidance:

ALTER TABLE [table] ENABLE ROW LEVEL SECURITY;
ALTER TABLE [table] FORCE ROW LEVEL SECURITY;
CREATE POLICY "[table]_tenant_isolation" ON [table]
  USING (tenant_id = current_setting('app.current_tenant', TRUE)::uuid);

This pattern ensures RLS is turned on, forced for all sessions, and enforces that only rows matching the connection-local setting app.current_tenant are visible.

Rollback example: disable FORCE and remove policy (careful: removes tenant isolation):

psql "$DATABASE_URL" -c "DROP POLICY \"profiles_tenant_isolation\" ON profiles;"
psql "$DATABASE_URL" -c "ALTER TABLE profiles NO FORCE ROW LEVEL SECURITY;"


### Implementation: example policies [Tool v1.2] – https://supabase.com/docs

1) Basic read-only tenant isolation (example for `profiles` table)

-- enable + force RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles FORCE ROW LEVEL SECURITY;

-- canonical canonical tenant isolation policy (from CLAUDE.md)
CREATE POLICY "profiles_tenant_isolation" ON profiles
  USING (tenant_id = current_setting('app.current_tenant', TRUE)::uuid);

-- example: additional policy to allow tenant admins to insert and update, but only within tenant scope
CREATE POLICY "profiles_tenant_crud" ON profiles
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant', TRUE)::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant', TRUE)::uuid);

Notes:
- USING controls visibility (SELECT/UPDATE/DELETE row filter).
- WITH CHECK controls whether INSERT/UPDATE attempts pass validation.
- FOR ALL covers SELECT, INSERT, UPDATE, DELETE; you can split by FOR SELECT / FOR INSERT etc.

Rollback:
- If the new policy prevents writes from the app (bad setting name or missing set_config), revert by adding a temporary permissive policy:

psql "$DATABASE_URL" -c "CREATE POLICY \"profiles_permissive_temp\" ON profiles FOR ALL USING (true) WITH CHECK (true);"

Then fix application code and drop the permissive policy.


### Setting app.current_tenant (connection context) [Tool v1.3] – https://www.postgresql.org/docs/current/functions-admin.html

The database relies on the connection-local setting app.current_tenant. Patterns for setting this value:

- For pooled serverless drivers (e.g. PgBouncer in transaction pooling) use a short-lived SET LOCAL inside a transaction started after you acquire a dedicated session.
- For per-request connections (supabase client or server-side connection) set it after authentication and before queries.

Examples (SQL / CLI snippets):

-- In application server (Node.js) using a single connection per request
BEGIN;
SELECT set_config('app.current_tenant', '11111111-2222-3333-4444-555555555555', true);
-- run all tenant-scoped queries here
COMMIT;

-- Alternative: set for the session
SELECT set_config('app.current_tenant', '11111111-2222-3333-4444-555555555555', true);
-- this persists for the session

-- Example in psql for debugging
psql "$DATABASE_URL" -c "SELECT set_config('app.current_tenant', '11111111-2222-3333-4444-555555555555', true);"

Rollback: If a bad tenant_id is set and causes errors, reset it to an empty value or to a safe tenant admin id.

psql "$DATABASE_URL" -c "SELECT set_config('app.current_tenant', '', true);"

Caveats:
- When using pooled connection managers like PgBouncer in transaction pooling mode, SET LOCAL inside a transaction is mandatory.
- Never rely on client-provided tenant values without server-side verification.


### Role hierarchy and mapping to SQL roles [Tool v1.4] – https://www.postgresql.org/docs/current/user-manag.html

Project role hierarchy (from CLAUDE.md):
GUEST → VIEWER → ANALYST → POWER_USER → TENANT_ADMIN → PLATFORM_ADMIN

Mapping strategy:
- Application-level roles (above) are stored in JWT claims (role and tenant_id).
- Database roles (pg roles) are used for privileged operations only (e.g., migrations, platform administration) and should not be used for per-tenant enforcement.
- Keep least-privilege: application users connect with a pooled limited DB user that relies exclusively on RLS.

Example JWT claim -> app logic
- jwt.claims: { "role": "tenant_admin", "tenant_id": "..." }
- Application verifies role and then executes tenant-scoped actions. Platform admin actions run through server (service role) with SUPABASE_SERVICE_ROLE_KEY.

SQL snippets: grant example (for maintenance roles only)

-- create a maintenance role used only by CI or migrations
CREATE ROLE capegis_maintain NOINHERIT;
GRANT capegis_maintain TO deployer_user;

Rollback: Revoke and drop role if misconfigured
psql "$DATABASE_URL" -c "REVOKE capegis_maintain FROM deployer_user; DROP ROLE IF EXISTS capegis_maintain;"


### JWT & session strategies (short- and long-lived) [Tool v1.5] – https://supabase.com/docs/guides/auth

Recommended settings (align with CLAUDE.md):
- Access token lifetime: 1 hour (JWT short-lived)
- Refresh token lifetime: 7 days

Pattern:
- Use JWT with tenant_id and role claims embedded. Do not trust client-only tokens for platform-level actions; perform server-side validation for sensitive endpoints.
- On the server (Next.js API route), exchange incoming JWT for a service-layer connection and set app.current_tenant based on verified claim.

Example JWT flow (pseudo CLI):

# decode and verify JWT (example using jwt-cli)
jwt decode --secret "$JWT_SECRET" "$TOKEN" | jq .

# server sets DB context
psql "$DATABASE_URL" -c "SELECT set_config('app.current_tenant', '11111111-2222-3333-4444-555555555555', true);"

Session refresh strategy:
- Use rotating refresh tokens (store a single refresh token identifier server-side for hostility detection).
- On refresh: verify token, issue new access token (1h) and new refresh token (7d), and continue.

Rollback: To revoke tokens globally (emergency) rotate the signing key and invalidate session store. Example: publish new JWKS and mark old keys as expired.

CLI snippet (rotate keys):

# Replace signing key, then revoke old refresh tokens in DB
psql "$DATABASE_URL" -c "UPDATE tenant_settings SET jwks = '<new jwks>' WHERE tenant_id = '11111111-2222-...';"


### tenant_settings table design (DDL + examples) [Tool v1.6] – https://developers.google.com

Rationale
- Central place for per-tenant overrides (branding, allowed features, API limits, white-label tokens).
- Should not contain secrets in plaintext; reference secrets stored in a secure vault where possible.

Example DDL (Postgres + POPIA annotation if personal data present):

-- POPIA annotation (example if tenant owner info present)
/*
 * POPIA ANNOTATION
 * Personal data handled: tenant_owner_email
 * Purpose: Tenant branding and contact for billing/support
 * Lawful basis: contract
 * Retention: retained while tenant active + 2 years
 * Subject rights: access ✓ | correction ✓ | deletion ✓ | objection ✓
 */

CREATE TABLE tenant_settings (
  tenant_id uuid PRIMARY KEY,
  display_name text NOT NULL,
  branding jsonb DEFAULT '{}'::jsonb,
  features jsonb DEFAULT '{}'::jsonb,
  api_rate_limit jsonb DEFAULT '{}'::jsonb,
  jwks jsonb DEFAULT '{}'::jsonb, -- reference for token verification
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- index common queries
CREATE INDEX idx_tenant_settings_updated_at ON tenant_settings(updated_at);

Example insertion:
INSERT INTO tenant_settings (tenant_id, display_name, branding, features, api_rate_limit)
VALUES ('11111111-2222-3333-4444-555555555555', 'City of CapeTown', '{"theme": "dark"}', '{"tiles": true}', '{"rps": 10}');

Rollback: Drop or restore previous row using backup table or transaction. Example restore from backup table:

psql "$DATABASE_URL" -c "INSERT INTO tenant_settings SELECT * FROM tenant_settings_backup WHERE tenant_id = '11111111-2222-3333-4444-555555555555';"


### Testing patterns (pgTAP, integration, CI) [Tool v1.7] – https://pgtap.org

Test tiers
1) Unit SQL tests (pgTAP) — validate policy behavior in isolation.
2) Integration tests — run against a disposable Postgres instance (GitHub Actions) with the same migrations.
3) End-to-end tests — exercise Next.js API routes with a test Supabase instance.

Example pgTAP test for tenant isolation:

-- tests/rls_tests.sql
SELECT plan(3);

-- prepare test tenant and rows
INSERT INTO tenants (id, name) VALUES ('aaaaaaaa-1111-4444-8888-000000000000', 'test-tenant');
INSERT INTO profiles (id, tenant_id, name) VALUES ('p1', 'aaaaaaaa-1111-4444-8888-000000000000', 'Alice');
INSERT INTO profiles (id, tenant_id, name) VALUES ('p2', 'bbbbbbbb-2222-5555-9999-111111111111', 'Eve');

-- set current_tenant and test visibility
SELECT set_config('app.current_tenant', 'aaaaaaaa-1111-4444-8888-000000000000', true);
SELECT is( (SELECT COUNT(*) FROM profiles), 1, 'only one profile visible to tenant A');

-- reset
SELECT set_config('app.current_tenant', '', true);

SELECT finish();

CI integration
- In GitHub Actions, create a job that launches Postgres + pgTAP, run migrations, run pgTAP tests.
- Use ephemeral tenants and test fixtures; truncate tables between tests.

Rollback: If tests reveal a failing policy, revert the migration that added it or add a temporary permissive policy (as above), then open a PR fixing the logic.


### Common pitfalls and mitigations

1) Connection Pooling + SET/SET LOCAL
- Issue: PgBouncer transaction pooling will leak session settings if not using SET LOCAL inside transactions.
- Mitigation: Use session pooling only if you can guarantee SET is called per transaction. Prefer no pooling for strong RLS guarantees or use per-tenant pooled connections.

Rollback snippet (temporary disable FORCE RLS for debug):
psql "$DATABASE_URL" -c "ALTER TABLE profiles NO FORCE ROW LEVEL SECURITY;"

2) Missing tenant claim in JWT
- Issue: Application forgets to set tenant from JWT; set_config not called.
- Mitigation: Reflexive middleware in API routes that rejects requests without tenant claim and logs an audit event.

Rollback: revert middleware only if it blocks legitimate traffic; provide temporary allowlist.


### Audit & observability

- Log every set_config('app.current_tenant', ...) call with request id and user id in an audit_log table.
- Use triggers on tenant-scoped tables to emit change messages to a queue for tenancy-aware downstream systems.

Example audit trigger (simplified):

CREATE TABLE audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid,
  user_id uuid,
  action text,
  object_type text,
  object_id text,
  created_at timestamptz DEFAULT now()
);

-- application must insert audit rows when it sets tenant context or performs writes

Rollback: truncate audit_log in testing or archival rotation.

psql "$DATABASE_URL" -c "TRUNCATE audit_log;"


### Migration checklist for rolling out RLS to an existing table

1. Add tenant_id column (nullable) and backfill from current owner metadata.
2. Add NOT NULL constraint (if possible) in a separate migration to avoid long locks.
3. Add index on tenant_id.
4. ENABLE ROW LEVEL SECURITY;
5. CREATE POLICY ... USING (tenant_id = current_setting('app.current_tenant', TRUE)::uuid);
6. FORCE ROW LEVEL SECURITY;
7. Deploy application change that sets app.current_tenant and test in staging.

Rollback example: revert steps in reverse; temporarily create a permissive policy to avoid downtime.

Rollback SQL snippet to add permissive policy:
psql "$DATABASE_URL" -c "CREATE POLICY \"permissive_all\" ON profiles FOR ALL USING (true) WITH CHECK (true);"


### Security considerations & POPIA

- Any file touching personal data must include POPIA annotation (see CLAUDE.md Rule 5). This includes migration files that create columns with PII.
- Minimisation: do not store unnecessary PII in tenant_settings; store only contact metadata required for billing/support and mark as personal data.
- Strong key management for JWKS and service-role secrets.

Rollback: rotate keys if compromise suspected; invalidate refresh tokens.


### Appendix: Example end-to-end flow (Node.js/Next.js server)

// Pseudocode

1. Authenticate request -> decode JWT -> validate signature
2. Extract tenant_id and role from claims
3. Start DB transaction
4. set_config('app.current_tenant', tenant_id, true);
5. Run queries using the same connection
6. Commit transaction

CLI debug snippet:
psql "$DATABASE_URL" -c "BEGIN; SELECT set_config('app.current_tenant', '11111111-2222-3333-4444-555555555555', true); SELECT * FROM profiles; COMMIT;"

Rollback: If the app fails to set tenant, respond 500 and write a remediation ticket.


### Closing notes

- Follow CLAUDE.md Rule 4 exactly: the canonical SQL must be present in every tenancy guidance and every tenant-scoped migration.
- Document deviations in docs/PLAN_DEVIATIONS.md before changing RLS behavior.
- Ensure tests (pgTAP and integration) are part of CI before enabling FORCE ROW LEVEL SECURITY on production tables.




<!-- EOF -->

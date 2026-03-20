---
mode: 'agent'
description: 'Review a Supabase migration file for schema, RLS, spatial, and naming compliance'
---
# Migration Review

## Context
Read `CLAUDE.md` Rules 4, 7, 9 and existing migrations in `supabase/migrations/` before reviewing.

## Task
Review the migration file specified by the user. Check every item in the checklist below.

### Checklist:

**1. File Naming Convention**
- Filename must match `YYYYMMDDHHMMSS_<description>.sql`
- Description must be lowercase with underscores, ≤40 chars
- Flag: wrong timestamp format, camelCase, spaces in filename

**2. RLS — Enable & Force**
Every new table must include:
```sql
ALTER TABLE <table> ENABLE ROW LEVEL SECURITY;
ALTER TABLE <table> FORCE ROW LEVEL SECURITY;
```
Flag any table creation missing either statement.

**3. Tenant Isolation Policy**
Every tenant-scoped table must have a policy using `current_setting('app.current_tenant', TRUE)::uuid`.
Flag tables missing a tenant isolation policy.

**4. tenant_id Column**
Tenant-scoped tables must have:
```sql
tenant_id uuid NOT NULL REFERENCES tenants(id)
```
Flag missing or nullable `tenant_id`.

**5. Geometry Column — EPSG:4326**
Geometry columns must use SRID 4326:
```sql
geom geometry(Geometry, 4326)
```
Flag any geometry without SRID or with SRID ≠ 4326.

**6. GiST Index on Geometry**
Every geometry column must have a GiST index:
```sql
CREATE INDEX ON <table> USING GIST (geom);
```
Flag missing spatial index.

**7. Rollback Safety**
Check if the migration is destructive (DROP TABLE, DROP COLUMN, ALTER COLUMN TYPE).
Flag destructive changes without a rollback comment or backup strategy.

**8. Secrets**
Flag any hardcoded credentials, tokens, or API keys.

## Output Format
```
Migration Review: <filename>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✓/✗  Naming convention (YYYYMMDDHHMMSS_description.sql)
✓/✗  ENABLE ROW LEVEL SECURITY on all new tables
✓/✗  FORCE ROW LEVEL SECURITY on all new tables
✓/✗  Tenant isolation policy (current_setting)
✓/✗  tenant_id uuid NOT NULL column
✓/✗  Geometry SRID = 4326
✓/✗  GiST index on geometry column(s)
✓/✗  No destructive changes without rollback plan
✓/✗  No hardcoded secrets

Issues:
  - <issue or "None">

Required fixes:
  <SQL snippets for each issue>
```

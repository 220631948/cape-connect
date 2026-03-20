---
mode: 'agent'
description: 'Run RLS audit on a Supabase/PostGIS table and report compliance'
---
# RLS Audit

## Context
Read `CLAUDE.md` Rule 4 (RLS + Application Layer Isolation) and `supabase/migrations/` for the table definition before auditing.

## Task
Audit the table named by the user for Row-Level Security compliance. Check all of the following:

### 1. RLS Enabled & Forced
```sql
SELECT relname, relrowsecurity, relforcerowsecurity
FROM pg_class
WHERE relname = '<table>';
```
- `relrowsecurity` must be `true` (ENABLE RLS)
- `relforcerowsecurity` must be `true` (FORCE RLS)

### 2. Tenant Isolation Policy
```sql
SELECT policyname, cmd, qual
FROM pg_policies
WHERE tablename = '<table>';
```
Verify at least one policy uses `current_setting('app.current_tenant', TRUE)::uuid`.
Flag any policy that references `auth.uid()` alone without tenant scoping.

### 3. tenant_id Column
```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = '<table>' AND column_name = 'tenant_id';
```
- Must exist and be type `uuid`

### 4. Policy Coverage
Check that policies cover all relevant commands: `SELECT`, `INSERT`, `UPDATE`, `DELETE`.
Flag missing command coverage.

### 5. Application Layer
Confirm the corresponding TypeScript file passes `tenant_id` from the session context (not hardcoded).

## Output Format
```
RLS Audit: <table>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✓/✗  ENABLE ROW LEVEL SECURITY
✓/✗  FORCE ROW LEVEL SECURITY
✓/✗  tenant_id column (uuid)
✓/✗  current_setting('app.current_tenant') policy present
✓/✗  Policy covers: SELECT INSERT UPDATE DELETE

Policies found:
  - <policy name> (<cmd>): <qual snippet>

Issues:
  - <issue description or "None">

Recommended fix (if issues):
  <SQL snippet>
```

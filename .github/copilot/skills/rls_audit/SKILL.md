---
name: rls-audit
description: Row-Level Security audit workflow for verifying tenant isolation on all PostGIS tables. Required for M1 and M4d.
---

# RLS Audit Skill

## Purpose
Systematically verify that Row-Level Security policies enforce correct tenant isolation across all tables. This skill supports Milestones M1 (schema) and M4d (RLS test harness).

## Trigger Condition
Invoke when:
- Creating or modifying any Supabase migration file
- Adding a new table to the schema
- Reviewing RLS policies before milestone sign-off
- Running the M4d RLS test harness

## Procedure

### Step 1 — Enumerate Tables
List all tables from CLAUDE.md §4:
`profiles`, `saved_searches`, `favourites`, `valuation_data`, `api_cache`, `audit_log`, `tenant_settings`, `layer_permissions`

For each table, verify:

### Step 2 — Check RLS Enabled
```sql
-- Must return TRUE for both
SELECT relrowsecurity, relforcerowsecurity
FROM pg_class WHERE relname = '[table_name]';
```

### Step 3 — Check Policy Exists
```sql
-- Must return at least one policy using current_setting
SELECT polname, polqual
FROM pg_policy
WHERE polrelid = '[table_name]'::regclass;
```

### Step 4 — Verify Policy Pattern
Every policy must use the canonical pattern from CLAUDE.md §4:
```sql
CREATE POLICY "[table]_tenant_isolation" ON [table]
  USING (tenant_id = current_setting('app.current_tenant', TRUE)::uuid);
```

Flag deviations:
- Missing `TRUE` parameter (will throw errors instead of returning NULL)
- Using `auth.uid()` alone without `tenant_id` cross-check
- Missing `WITH CHECK` clause for INSERT/UPDATE policies

### Step 5 — Cross-Tenant Isolation Test
For each table, verify:
1. Set `app.current_tenant` to Tenant A → query returns only Tenant A rows
2. Set `app.current_tenant` to Tenant B → query returns only Tenant B rows
3. Clear `app.current_tenant` → query returns zero rows (fail-closed)
4. Attempt INSERT with wrong `tenant_id` → rejected

### Step 6 — Role-Based Access Matrix
Verify each RBAC role against the table:
| Role | SELECT | INSERT | UPDATE | DELETE |
|------|--------|--------|--------|--------|
| GUEST | Limited | ✗ | ✗ | ✗ |
| VIEWER | ✓ | ✗ | ✗ | ✗ |
| ANALYST | ✓ | ✗ | ✗ | ✗ |
| POWER_USER | ✓ | ✓ | Own | Own |
| TENANT_ADMIN | ✓ | ✓ | ✓ | ✓ |
| PLATFORM_ADMIN | ✓ | ✓ | ✓ | ✓ |

### Step 7 — Log Results
Write audit results to `docs/RLS_AUDIT_LOG.md`:
```
## Audit: [date]
- Tables checked: [count]
- Policies verified: [count]
- Issues found: [count]
- Cross-tenant test: PASS/FAIL
```

## When NOT to Use This Skill
- Tables without `tenant_id` (none should exist in production, but might in migrations)
- Lookup tables that are tenant-independent (e.g. `zone_codes`)

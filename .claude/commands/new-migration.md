# /new-migration — Supabase Migration Scaffolding

## Trigger
`/new-migration [description]` or "create a new database migration"

## What It Does
Creates a new Supabase migration file following the project's conventions for RLS, tenant isolation, and POPIA compliance.

## Procedure
1. Ask for (if not provided): migration purpose, tables affected
2. Generate a timestamped filename: `supabase/migrations/[YYYYMMDDHHMMSS]_[description].sql`
3. Include the required patterns:
```sql
-- Migration: [description]
-- Milestone: M[N]
-- Agent: DB-AGENT
-- Date: [YYYY-MM-DD]

-- Enable RLS on new tables
ALTER TABLE [table] ENABLE ROW LEVEL SECURITY;
ALTER TABLE [table] FORCE ROW LEVEL SECURITY;

-- Tenant isolation policy (CLAUDE.md §4 canonical pattern)
CREATE POLICY "[table]_tenant_isolation" ON [table]
  USING (tenant_id = current_setting('app.current_tenant', TRUE)::uuid);
```
4. If the table stores personal data → add POPIA comment header
5. Include rollback instructions as SQL comments

## Expected Output
A new `.sql` migration file with RLS policies, POPIA annotations (if applicable), and rollback comments.

## Skill Invoked
- `rls-audit` — verify the new policy follows the canonical pattern
- `popia-compliance` — if migration touches personal data tables

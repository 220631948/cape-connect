---
name: code_summarize
description: >
  Read a file or directory and produce a plain-English summary of its purpose,
  exports, dependencies, and CLAUDE.md rule implications. Used by REPO-ARCHITECT
  and WORKFLOW-AUTOMATOR for documentation updates and PR descriptions.
__generated_by: aris-unit-7
__timestamp: "2026-03-14T00:00:00Z"
---

## Purpose

Reads a target file or directory and produces a concise plain-English summary
suitable for ARCHITECTURE.md updates, PR descriptions, onboarding guides, and
automated documentation. Identifies: module purpose, exports, dependencies,
data flows, and any CLAUDE.md rule implications (badges, fallbacks, RLS, POPIA,
file size). Used by REPO-ARCHITECT when updating ARCHITECTURE.md and by
WORKFLOW-AUTOMATOR when generating `/update-docs` output.

## Trigger Conditions

- REPO-ARCHITECT updating `.claude/ARCHITECTURE.md`
- WORKFLOW-AUTOMATOR generating a PR description or changelog entry
- `/update-docs` command invocation
- `/explain-architecture` command invocation
- Before FEATURE-BUILDER scaffolds a new module (understand existing context)
- When a developer asks "what does this file/directory do?"

## Procedure

1. **Determine target scope:**
   - If file: read the single file directly
   - If directory: list all `.ts`/`.tsx` files; read up to 10; for directories
     with > 10 files, process by subdirectory

2. **Read each file** using the Read tool (first 100 lines for files > 200 lines;
   note if truncated).

3. **Extract module metadata:**
   - Purpose: from JSDoc block comment, component name, or first export name
   - All named exports (components, hooks, utilities, types)
   - All import dependencies (classify: internal / external / aliased)

4. **Check CLAUDE.md rule markers:**
   - Rule 1: `[SOURCE·YEAR·STATUS]` badge present in JSX? → `BADGE: ✅/❌`
   - Rule 2: `LIVE→CACHED→MOCK` fallback pattern present? → `FALLBACK: ✅/❌/N/A`
   - Rule 5: POPIA annotation block present? → `POPIA: ✅/❌/N/A`
   - Rule 7: Line count vs 300-line limit → `LINES: N/300`

5. **Identify data flows:**
   - Does the file fetch data from an API? (Supabase, Martin, external)
   - Does it render a MapLibre layer?
   - Does it handle authentication or session state?
   - Does it process personal data (names, addresses, valuations)?

6. **Compose plain-English summary:** 2–4 sentences describing the module's role
   in the CapeTown GIS Hub, what it renders/computes/fetches.

7. **Output structured summary** with compliance status badge row.

## Output Format

```
## app/src/components/AnalyticsDashboard.tsx
**Summary:** Renders the tenant-scoped analytics dashboard using Recharts. Fetches
aggregate property statistics from PostGIS via /api/analytics with three-tier
fallback (LIVE → api_cache → public/mock/analytics.geojson). Displays suburb-level
choropleth and bar charts. Guest users see aggregate stats only (CLAUDE.md §6).

**Exports:** AnalyticsDashboard (default), AnalyticsCard
**Dependencies (internal):** useAnalyticsData, MapChoropleth, DataBadge
**Dependencies (external):** recharts, @supabase/supabase-js

BADGE: ✅ | FALLBACK: ✅ | POPIA: N/A | LINES: 247/300
```

## When NOT to Use

- For binary files (images, PDFs, compiled bundles, lock files)
- For very large directories (> 50 files) — summarise by subdirectory instead
- When you need the full code for editing (use the Read tool directly)
- For SQL migrations (use `schema_smells` skill for migration analysis)

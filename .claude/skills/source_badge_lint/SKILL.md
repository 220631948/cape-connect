---
name: source_badge_lint
description: >
  Scan all data-fetching components in src/ for the mandatory
  [SOURCE · YEAR · STATUS] badge required by CLAUDE.md Rule 1.
  Outputs violations with file:line references. Exits non-zero in CI mode.
__generated_by: self-evolve-pass-2026-03-14
__timestamp: "2026-03-14T00:00:00Z"
---

## Purpose

Enforce CLAUDE.md Rule 1: every data display must show `[SOURCE_NAME · YEAR · [LIVE|CACHED|MOCK]]`
badge visible without hovering. This skill statically analyses TypeScript/TSX files to detect
data-fetch patterns and verify corresponding SourceBadge presence.

## Trigger Conditions

- `/badge-audit` command invocation
- Pre-merge CI check on any PR touching `src/components/` or `src/app/`
- `badge-lint-prewrite.js` hook fires a warning
- COMPLIANCE-AGENT Rule 1 check
- `/milestone-audit` compliance gate

## Procedure

1. **Glob target files:**
   - `src/components/**/*.tsx`
   - `src/app/**/*.tsx` and `src/app/**/*.ts`

2. **For each file — detect data-fetch patterns:**
   - `fetch(` — native fetch API
   - `supabase.` — Supabase client calls
   - `useLiveData` — project hook
   - `useQuery` / `useSWR` — data fetching hooks
   - `getServerSideProps` — SSR data fetch
   Skip files with no data-fetch pattern — mark as N/A.

3. **Check for SourceBadge or inline badge:**
   - Import: `import.*SourceBadge` or `import.*source_badge`
   - JSX usage: `<SourceBadge` in the file
   - Inline pattern: `[SOURCE` + `YEAR` + `LIVE|CACHED|MOCK` string within JSX
   - Do NOT accept badge inside `title` or `tooltip` only — must be unconditional

4. **Classify each file:**
   - `PASS` — data-fetch + badge present and unconditional
   - `FAIL` — data-fetch present, badge absent
   - `WARN` — badge present but only inside hover/tooltip element
   - `N/A` — no data-fetch pattern detected

5. **Output violation table:**
   ```
   COMPONENT | STATUS | FILE:LINE | DATA PATTERN
   ```
   Include every FAIL and WARN with the line number of the data-fetch pattern.

6. **Append summary to `docs/COMPLIANCE_LOG.md`** (create if absent):
   ```
   ## Badge Audit — YYYY-MM-DD
   Scanned: N files | Pass: K | Fail: M | Warn: W
   [Violation table]
   ```

7. **CI mode (`--ci` flag):** Exit non-zero if any FAIL found.
   WARN does not fail CI but is logged for human review.

## Output Format

```
=== SOURCE BADGE LINT REPORT ===
Date: 2026-03-14 | Files scanned: 23 | Pass: 19 | Fail: 3 | Warn: 1

COMPONENT              STATUS  FILE:LINE                                   DATA PATTERN
AnalyticsDashboard     ❌ FAIL src/components/analysis/AnalyticsDash:42   supabase.from()
ExportPanel            ✅ PASS src/components/analysis/ExportPanel.tsx     —
PropertyCard           ⚠️ WARN src/components/details/PropertyCard:88     badge in tooltip only
FlightLayer            ❌ FAIL src/components/map/FlightLayer.tsx:15      fetch(
SuburbLayer            ✅ PASS src/components/map/SuburbLayer.tsx          —

SUMMARY: 3 FAIL — merge blocked (CI mode). Remediation: add <SourceBadge> to failing components.
```

## When NOT to Use

- On non-TypeScript files (Python scripts, SQL migrations)
- Inside `src/__tests__/` or `src/test/` directories (test files exempt)
- On UI-only components with no data fetching (pure presentational)
- As an auto-fixer — this skill is read-only; use `/badge-audit --fix` for remediation

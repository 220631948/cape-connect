---
name: fallback_verify
description: >
  Verify the LIVE → CACHED → MOCK three-tier fallback chain in every API route
  and data-fetching component. Required by CLAUDE.md Rule 2. Exits non-zero
  in CI mode on any FAIL (2+ tiers missing).
__generated_by: self-evolve-pass-2026-03-14
__timestamp: "2026-03-14T00:00:00Z"
---

## Purpose

Enforce CLAUDE.md Rule 2: every external data component must implement LIVE → CACHED → MOCK
fallback. Never show blank map or error instead of MOCK. This skill verifies the fallback chain
exists in each API route and that mock files physically exist in `public/mock/`.

## Trigger Conditions

- `/fallback-check` command invocation
- Pre-merge CI check on any PR touching `src/app/api/`
- `fallback-verify-postwrite.js` hook fires a PARTIAL/FAIL warning
- COMPLIANCE-AGENT Rule 2 check
- `/milestone-audit` compliance gate

## Procedure

1. **Glob API route files:**
   `src/app/api/**/*.ts` — find all Next.js App Router route handlers.

2. **For each route — verify LIVE tier:**
   - Look for: `fetch(`, `supabase.from()`, `supabase.rpc()`, `axios.`, `got(`
   - External HTTP call or direct Supabase/PostGIS query counts as LIVE.
   - Mark ✅ LIVE or ❌ MISSING.

3. **Verify CACHED tier:**
   - Look for: `api_cache` table reference (select/insert), `getCached`, `readCache`
   - The cached tier reads from the `api_cache` Supabase table on LIVE failure.
   - Check for `try/catch` or `if (!liveData)` guard before cache read.
   - Mark ✅ CACHED or ❌ MISSING.

4. **Verify MOCK tier:**
   - Look for: `public/mock/`, `readMockFile`, reference to a `.geojson` filename.
   - Resolve the referenced file path and verify it **physically exists** on disk.
   - Mark ✅ MOCK (file exists), ⚠️ MOCK (referenced but missing), or ❌ MISSING.

5. **For client components:** verify `src/lib/utils/fallback.ts` is imported where
   data fetching occurs (cross-reference the import graph).

6. **Classify each route:**
   - `PASS` — all 3 tiers present and mock file exists
   - `PARTIAL` — exactly 1 tier missing (log which)
   - `FAIL` — 2 or more tiers missing

7. **Output route table:**
   ```
   ROUTE | LIVE | CACHED | MOCK | MOCK_FILE_EXISTS | STATUS
   ```

8. **FAIL exits non-zero in CI** (`--ci` flag). PARTIAL is logged but does not fail CI.

## Output Format

```
=== FALLBACK VERIFY REPORT ===
Date: 2026-03-14 | Routes scanned: 6

ROUTE                LIVE  CACHED  MOCK              FILE_EXISTS  STATUS
/api/zoning          ✅    ✅      zoning.geojson     ✅           PASS
/api/valuation/[id]  ✅    ❌      valuation.geojson  ✅           PARTIAL (missing CACHED)
/api/search          ✅    ✅      search.geojson     ✅           PASS
/api/analysis        ✅    ❌      analysis.geojson   ❌           FAIL
/api/flights         ✅    ✅      flights.geojson    ✅           PASS
/api/suburbs         ✅    ✅      suburbs.geojson    ✅           PASS

SUMMARY: 1 FAIL, 1 PARTIAL, 4 PASS.
FAIL routes block merge. Run /fallback-check --create-mocks to scaffold missing mock files.
```

## When NOT to Use

- On non-API route files (UI components, utility libraries)
- Inside `src/__tests__/` directories
- On server actions (`'use server'` files) that don't serve data externally
- As an auto-fixer — read-only; use `/fallback-check --create-mocks` for stub creation

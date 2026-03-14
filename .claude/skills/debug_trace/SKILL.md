---
name: debug_trace
description: >
  Resolve file:line references from error stack traces, read surrounding source code
  context (±20 lines), trace the call chain, and output a structured root-cause
  hypothesis with evidence snippets and a fix recommendation.
__generated_by: aris-unit-4
__timestamp: "2026-03-14T00:00:00Z"
---

## Purpose

Takes an error message and optional stack trace as input. Resolves each file:line
reference in project files (skipping node_modules), reads ±20 lines of surrounding
context, traces the call chain upward, and produces a structured hypothesis identifying
the probable root cause with code evidence. Specifically checks for the four most
common failure modes in the CapeTown GIS Hub codebase.

## Trigger Conditions

- BUG-INVESTIGATOR session start with an error message
- `/debug-issue` command invocation
- CI failure with TypeScript or runtime stack trace
- Sentry alert forwarded to agent session
- MapLibre GL JS render error (layer source invalid, CRS mismatch)
- Supabase RLS policy violation error

## Procedure

1. **Parse input:** extract error message, error type (TypeError, RLSViolation,
   MapError, etc.), and all `at <fn> (file:line:col)` stack frames.

2. **Filter project frames:** for each frame, resolve to absolute path.
   Skip frames from `node_modules/`, `.next/build/`, or bundler internals.

3. **Read context windows:** for each project frame, read ±20 lines around the
   error line using the Read tool with `offset` and `limit` parameters.

4. **Identify primary suspect:** the innermost project frame (first non-library frame)
   is the primary suspect. Note: may not be the actual root cause — trace upward.

5. **Check failure pattern A — Three-tier fallback (Rule 2):**
   Is the error `undefined` or `null` from an API response? Check if the fetcher
   has proper fallback to `api_cache` then `public/mock/`. If LIVE data returned
   unexpected shape → MOCK not served → undefined propagated.

6. **Check failure pattern B — MapLibre render error:**
   Is this a layer source error? Check: invalid GeoJSON shape, missing `type` field,
   CRS not EPSG:4326, feature count > 10,000 (should use Martin MVT).

7. **Check failure pattern C — RLS/Supabase error:**
   Is the error a Supabase "new row violates RLS policy" or "permission denied"?
   Check: is `app.current_tenant` set in the session context? Is `tenant_id` present?

8. **Check failure pattern D — CRS mismatch:**
   Is this a geometry/coordinate error? Verify: storage uses EPSG:4326, rendering
   uses EPSG:3857, no raw WKT passed to MapLibre without reprojection.

9. **Output structured hypothesis** with PRIMARY_CAUSE, EVIDENCE, CONFIDENCE,
   FIX_RECOMMENDATION, and REGRESSION_TEST_HINT.

## Output Format

```
=== DEBUG TRACE REPORT ===
Error: Cannot read properties of undefined (reading 'map')
File: app/src/components/AnalyticsDashboard.tsx:47

FRAMES ANALYSED: 3 project frames, 5 library frames skipped

PRIMARY CAUSE (CONFIDENCE: HIGH):
  fetchAnalyticsData() returns undefined when LIVE API is unreachable.
  Three-tier fallback missing: no api_cache check, no MOCK fallback.
  CLAUDE.md Rule 2 violation — never show undefined instead of MOCK.

EVIDENCE:
  Line 45: const data = await fetchAnalyticsData()  // no fallback
  Line 47: return data.features.map(...)             // crashes if undefined

FIX RECOMMENDATION:
  Implement three-tier fallback in fetchAnalyticsData():
  1. Try LIVE API
  2. On failure: query api_cache WHERE type='analytics' ORDER BY created_at DESC LIMIT 1
  3. On cache miss: return import('/mock/analytics.geojson')

REGRESSION TEST HINT:
  Mock fetchAnalyticsData to return undefined; assert component renders MOCK badge.
```

## When NOT to Use

- For intentional errors/assertions in unit tests (not production bugs)
- When error is from an unapproved third-party library (log deviation instead)
- For production database queries that touch real PII (read-only tool only)
- When stack trace has no project frames (entirely library error — escalate to human)

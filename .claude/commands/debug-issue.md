<!--
trigger: /debug-issue "<error message>" [--file <path>] [--trace <stack>]
primary_agent: BUG-INVESTIGATOR
-->

## Trigger
`/debug-issue "<error message>" [--file <path>] [--trace <stack>]`

## Purpose
Investigate a bug or error report — trace stack frames through source files,
identify the root cause using pattern matching against common CapeTown GIS Hub
failure modes, produce a structured fix recommendation, and generate a regression
test hint. Read-only investigation; fix execution by the appropriate milestone agent.

## Primary Agent
**BUG-INVESTIGATOR 🔍** — invokes `debug_trace` and `repo_graph` skills.

## Steps

1. **Parse error input:**
   - Extract error message and error type (TypeError, RLSViolation, MapError, etc.)
   - If `--trace` provided: parse all `at <fn> (file:line:col)` stack frames
   - If `--file` provided: focus analysis on that specific file

2. **Trace stack frames** — invoke `debug_trace` skill:
   - Resolve file:line refs from project frames (skip node_modules)
   - Read ±20 lines around each error location
   - Check failure patterns:
     - **Rule 2 violation:** LIVE API returned unexpected shape → undefined propagated
       because CACHED/MOCK fallback was missing
     - **MapLibre render error:** invalid GeoJSON, missing `type`, CRS not EPSG:4326,
       or feature count > 10,000 (should use Martin MVT)
     - **RLS/Supabase error:** `app.current_tenant` not set, `tenant_id` missing
     - **CRS mismatch:** EPSG:4326 storage vs EPSG:3857 rendering confusion

3. **Module context** — invoke `repo_graph` to understand upstream callers
   of the affected module and identify other consumers that may be affected.

4. **If `--file` is provided:** focus `debug_trace` on that file first before
   expanding to the call chain.

5. **Produce structured report:**
   - `PRIMARY_CAUSE` with file:line evidence
   - `CONFIDENCE` (HIGH / MEDIUM / LOW)
   - `FIX_RECOMMENDATION` with code snippet
   - `REGRESSION_TEST_HINT` for TEST-COVERAGE-AGENT

6. **Write bug report** to `docs/bugs/BUG-NNN.md` (auto-increment NNN).

7. **Security check:** if error pattern suggests RLS bypass, PII leak, or injection
   → invoke `security_review` skill and issue ESCALATE signal.

## MCP Servers Used
- `filesystem` — read source files, write bug report
- `doc-state` — write lock for bug report (if available)

## Success Criteria
- Root cause identified with file:line evidence
- Fix recommendation with code snippet produced
- CONFIDENCE level stated (HIGH/MEDIUM/LOW)
- Bug report written to `docs/bugs/BUG-NNN.md`
- Regression test hint provided for TEST-COVERAGE-AGENT
- ESCALATE issued if security issue found

## Usage Example
```bash
# Basic error investigation
/debug-issue "Cannot read properties of undefined (reading 'map')"

# With stack trace
/debug-issue "RLS policy violation" --trace "at fetchData (api/route.ts:23:5)"

# Focus on specific file
/debug-issue "MapLibre source error" --file app/src/components/MapView.tsx

# Full investigation
/debug-issue "TypeError: data is undefined" \
  --file app/src/components/AnalyticsDashboard.tsx \
  --trace "at AnalyticsDashboard (AnalyticsDashboard.tsx:47:18)"
```

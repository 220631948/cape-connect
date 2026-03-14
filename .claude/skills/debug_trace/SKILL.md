---
name: debug_trace
description: >
  Resolves file:line references from error messages or stack traces, reads
  surrounding code, and outputs a root-cause hypothesis with supporting evidence.
__generated_by: aris-bug-investigator-pass-2026-03-14
__timestamp: "2026-03-14T00:00:00Z"
---

## Purpose

Transform a raw error message or symptom into a structured investigation result:
exact file + line, code context, likely cause, and fix direction. Used exclusively
by BUG-INVESTIGATOR (read-only; never writes source files).

## Trigger Conditions

- Any error message containing a file:line reference
- CI failure log with a stack trace
- "This component crashes" or "unexpected API response"
- Regression reported after a recent commit or PR merge

## Procedure

### Step 1 — Parse the error message
Extract from the raw input:
- Error type (TypeError, ReferenceError, PostgresError, AuthError, etc.)
- Message text (the human-readable description)
- File:line references (e.g. `AnalyticsDashboard.tsx:47`)
- HTTP status code (if API error — 400, 401, 403, 500, etc.)

### Step 2 — Read code context around each file:line
For each file:line reference extracted in Step 1:
- Read ±20 lines of context around the error location
- Note: variable names, function signatures, imports, null-checks

### Step 3 — Identify the direct cause
Look for the most common root causes:
- Null / undefined property access (optional chaining missing)
- Missing or incorrect import
- Type mismatch between expected and actual shape
- RLS policy rejection (Supabase `42501` error code)
- Missing environment variable (undefined env var used as URL/key)

### Step 4 — Trace one level up (caller analysis)
Read the file that calls the failing function or component:
- What arguments are passed?
- Is the data fetched before render? Could it be undefined on first render?
- Is an async operation awaited correctly?

### Step 5 — Match against known patterns
Check if the error matches a known CapeTown GIS Hub pattern:
- Three-tier fallback failure: `LIVE` returned null, `CACHED` not tried
- Missing `SourceBadge`: component renders data without badge (Rule 1 violation)
- MapLibre `map.loaded()` race: handler attached before map is initialised
- Supabase auth session expiry: `401` on a request that was previously `200`
- RLS isolation failure: query returns empty set for wrong tenant

### Step 6 — Check recent git history
Run: `git log --oneline -20 -- <file>`
- Did a recent commit touch this file?
- Does the commit message hint at a related change?
- Cross-reference with any open PR or branch that modified this path

### Step 7 — Formulate hypothesis
Write a single hypothesis statement:
> "The error is caused by [X] at [file:line] because [evidence]. Fix: [action]."

Be specific — name the variable, function, or config key involved.

### Step 8 — Output structured report
Produce the report in the format below. Quote actual code lines as evidence.

## Output Format

```
=== DEBUG TRACE REPORT ===
Date: <ISO date> | Investigator: BUG-INVESTIGATOR

ERROR TYPE    : <TypeError | PostgresError | AuthError | etc.>
LOCATION      : <src/components/analysis/AnalyticsDashboard.tsx:47>
EVIDENCE      :
  > 45: const features = data.featureCollection.features;
  > 46: // data can be null on first render — no null guard
  > 47: return features.map(f => <FeatureCard key={f.id} feature={f} />);
HYPOTHESIS    : data.featureCollection is undefined before the async fetch
               resolves, causing a TypeError on line 47.
RECOMMENDED FIX: Add null guard — `data?.featureCollection?.features ?? []`
                 or defer render until data is loaded.
REGRESSION TEST: Vitest — render <AnalyticsDashboard /> with null data prop;
                 assert no crash and renders empty state.
HAND OFF TO   : DASHBOARD-AGENT (implementation) + TEST-COVERAGE-AGENT (test)
```

## When NOT to Use

- For linting or formatting errors — use ESLint / Prettier directly
- For dependency install failures — invoke DEPENDENCY-AUDITOR instead
- For CI infrastructure failures (Docker, GitHub Actions runner) — human escalation

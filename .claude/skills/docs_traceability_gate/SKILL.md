---
name: docs-traceability-gate
description: Validate GIS documentation quality gates, evidence tags, and cross-file consistency before fleet or build work. Use this skill whenever users ask for docs QA, readiness gates, claim verification, or hallucination-resistant research synthesis.
---

# Docs Traceability Gate

## Purpose
Run a structured quality gate across documentation so decisions are based on traceable, internally consistent evidence.

## Input Scope
- target docs selected by task (default: changed files under `docs/`)
- governance references: `CLAUDE.md`, `docs/context/GIS_MASTER_CONTEXT.md`, `docs/infra/skills-catalog.md`

## Validation Procedure

### Step 1 — Build the Verification Set
- collect all target documents and direct dependencies
- include referenced docs for cross-checking key claims

### Step 2 — Evidence Label Checks
- verify material claims have `[VERIFIED]` or `[ASSUMPTION — UNVERIFIED]`
- ensure assumptions are actionable (next verification step present)

### Step 3 — Citation and Link Integrity
- check inline citations point to real files/sections
- check internal markdown links resolve
- flag stale paths and inconsistent filenames

### Step 4 — Governance Constraint Checks
For relevant docs, confirm coverage of:
- Cape Town/WC geographic scope
- fallback contract (`LIVE → CACHED → MOCK`)
- source badge requirements
- tenant isolation / RBAC / POPIA expectations where applicable

### Step 5 — Consistency Checks
- detect conflicting statements across architecture/spec/research docs
- normalize terminology and canonical path references

### Step 6 — Publish Gate Result
Return:
- PASS/FAIL per check
- blocking issues (must fix)
- non-blocking recommendations
- ready-to-apply diff suggestions where practical

## Output Format
1. Executive gate summary
2. Check matrix (pass/fail + evidence)
3. Blocking issues
4. Patch-ready recommendations


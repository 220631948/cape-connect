---
name: documentation-first-design
description: Documentation-first delivery workflow for this GIS repo. Use this skill whenever work involves new features, architecture changes, implementation plans, or docs-only cycles so design quality gates are enforced before coding.
---

# Documentation-First Feature Design

## Purpose
Prevent architecture drift by requiring evidence-backed documentation and explicit constraints before implementation.

## Workflow

### Step 0 — Detect Mode (Docs-Only vs Code)
- If user specifies docs-only, limit edits to `docs/` and planning artifacts only.
- If code is allowed, continue with full design-to-implementation flow.

### Step 1 — Load Governing Context
Read:
- `PLAN.md`
- `docs/context/GIS_MASTER_CONTEXT.md`
- relevant spec/integration docs under `docs/`

Summarize:
- feature/problem statement
- affected user roles and tenants
- acceptance criteria

### Step 2 — Verify Design Coverage
Ensure a design artifact exists and includes:
- inputs/outputs
- data sources and fallback behavior (LIVE → CACHED → MOCK)
- error and empty states
- RBAC and tenant boundaries
- POPIA implications if personal data is involved

If missing, create/update the design doc first.

### Step 3 — Verify Data Readiness
Use `docs/API_STATUS.md` and `docs/research/README.md`:
- CONFIRMED: proceed
- LIKELY/UNCERTAIN: keep `[ASSUMPTION — UNVERIFIED]` markers and define fallback
- UNAVAILABLE: add to `docs/OPEN_QUESTIONS.md` and keep MOCK path active

### Step 4 — Safety and Governance Gate
- Confirm `docs/RBAC_MATRIX.md` permissions are respected
- Confirm tenant isolation assumptions are explicit
- Confirm required source badge + attribution + CRS constraints are represented in docs

### Step 5 — Plan the Work
Write a concise implementation/doc plan with:
- files to edit
- dependency order
- validation checks
- explicit assumptions

### Step 6 — Execute in Approved Mode
- Docs-only mode: update docs and stop before code changes.
- Code mode: implement according to plan; if behavior diverges from docs, log to `docs/PLAN_DEVIATIONS.md`.

---
name: documentation-first
description: Documentation-first delivery workflow. Use this skill whenever work touches new features, architecture updates, implementation planning, or docs-only cycles so design quality gates are completed before coding.
---

# Documentation-First Feature Design

## Purpose
Ensure documentation and governance constraints are explicit before implementation to prevent drift and hidden assumptions.

## Trigger Condition
Invoke before any feature-level implementation and for docs-only planning/research cycles.

## Procedure

### Step 0 — Detect Work Mode
- If user requests docs-only, restrict changes to `docs/` and planning artifacts.
- If code changes are allowed, continue through full design gate before implementation.

### Step 1 — Read Governing Context
Read:
- `PLAN.md`
- `docs/context/GIS_MASTER_CONTEXT.md`
- relevant docs under `docs/specs/`, `docs/architecture/`, and `docs/integrations/`

State clearly:
- what is being changed
- who it serves (RBAC roles and tenant scope)
- acceptance criteria

If unclear, add targeted open questions to `docs/OPEN_QUESTIONS.md` and pause implementation.

### Step 2 — Check Design Documentation
Ensure the design document describes:
- inputs/outputs
- data sources and evidence status from `docs/API_STATUS.md`
- fallback behavior (LIVE → CACHED → MOCK)
- error and empty states
- RBAC + tenant isolation boundaries
- POPIA implications (invoke `popia-compliance` when personal data is involved)

If missing, write/update the doc first.

### Step 3 — Verify Data Availability
For each source:
- CONFIRMED: proceed
- LIKELY/UNCERTAIN: keep `[ASSUMPTION — UNVERIFIED]` markers and fallback path
- UNAVAILABLE: log to `docs/OPEN_QUESTIONS.md` and maintain MOCK tier behavior

### Step 4 — Governance Gate
- Validate against `docs/RBAC_MATRIX.md`
- Confirm CRS and geographic scope constraints are represented
- Confirm source-badge and attribution requirements are not omitted in user-facing flows

### Step 5 — Build a Small Plan
Produce a concise action plan:
- files to edit and order
- dependency chain
- validation checks
- assumptions requiring follow-up

### Step 6 — Execute
- Docs-only mode: complete documentation updates and stop.
- Code mode: implement per plan; if behavior diverges from documentation, log deviation in `docs/PLAN_DEVIATIONS.md`.

## When NOT to Use This Skill
- tiny isolated typo fixes with no behavioral impact
- emergency hotfixes where retro documentation is tracked immediately afterward

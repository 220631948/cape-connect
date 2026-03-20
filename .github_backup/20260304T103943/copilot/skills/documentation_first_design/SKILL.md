---
name: documentation-first-design
description: Documentation-first development workflow. Invoke before writing any feature code.
---

# Documentation-First Feature Design

Every subagent must invoke this skill before writing any application code.

## Workflow

### Step 1 — Read the Plan
Read the relevant milestone in `PLAN.md` and the design doc in `docs/`. State what the feature does, who it serves, and the acceptance criteria. If unclear, flag in `docs/OPEN_QUESTIONS.md`.

### Step 2 — Check the Design Document
Does a design doc exist in `docs/`? If not, produce it first. It must describe: inputs, outputs, data sources, error states, empty states, user-facing messages, role-based access, and POPIA implications.

### Step 3 — Verify Data Availability
Check `docs/DATA_CATALOG.md` for each data source. If status is UNCERTAIN, confirm a fallback mock exists.

### Step 4 — Check the RBAC Boundary
Check `docs/RBAC_MATRIX.md` for which roles can access each element. For GUEST-visible elements, confirm no personal data exposed without POPIA disclosure.

### Step 5 — Write the Implementation Plan
5–10 bullet plan listing files to create/edit and order. Flag unverified assumptions with `[ASSUMPTION — UNVERIFIED]`.

### Step 6 — Implement
Write code following the plan. If results contradict the design doc, stop and log to `docs/PLAN_DEVIATIONS.md`.

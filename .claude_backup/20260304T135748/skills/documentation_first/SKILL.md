---
name: documentation-first
description: Documentation-first development workflow. Every agent must invoke this skill before writing any feature code.
---

# Documentation-First Feature Design

## Purpose
Ensure that design documentation exists and is accurate BEFORE any code is written. Prevents architectural drift and undocumented assumptions.

## Trigger Condition
Invoke before writing implementation code for any feature in any milestone.

## Procedure

### Step 1 — Read the Plan
Read the relevant milestone in `PLAN.md` and the corresponding spec in `docs/specs/`.
State clearly:
- What the feature does
- Who it serves (which RBAC roles)
- The acceptance criteria
- If unclear, flag in `docs/OPEN_QUESTIONS.md` and STOP

### Step 2 — Check Design Documentation
Does a design document exist in `docs/` for this feature? If not, produce it first.
The document must describe:
- Inputs and outputs
- Data sources (with status from `docs/API_STATUS.md`)
- Error states and empty states
- User-facing messages
- Role-based access (which roles can see/use this)
- POPIA implications (invoke `popia-compliance` skill if personal data involved)

### Step 3 — Verify Data Availability
Check `docs/API_STATUS.md` for each data source needed:
- CONFIRMED → proceed
- LIKELY → add `[ASSUMPTION — UNVERIFIED]` marker
- UNCERTAIN → confirm a mock fallback exists in `public/mock/`
- UNAVAILABLE → flag in `docs/OPEN_QUESTIONS.md`, switch to MOCK tier

### Step 4 — Check RBAC Boundary
Check `docs/RBAC_MATRIX.md` for which roles can access each element:
- GUEST-visible elements must not expose personal data without POPIA disclosure
- Features behind ANALYST+ must verify role in middleware/component guard

### Step 5 — Write Implementation Plan
Produce a 5–10 bullet plan listing:
- Files to create/edit and their order
- Dependencies between files
- Which skill to invoke for specialised tasks
- Unverified assumptions flagged with `[ASSUMPTION — UNVERIFIED]`

### Step 6 — Implement
Write code following the plan.
- If results contradict the design doc → STOP, log to `docs/PLAN_DEVIATIONS.md`
- If a new assumption surfaces → invoke `assumption-verification` skill

## When NOT to Use This Skill
- Bug fixes in existing code (use standard debugging workflow)
- Documentation-only changes (no code being written)
- Emergency hotfixes (document retroactively)

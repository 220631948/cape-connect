# /milestone-status — Milestone Progress Report

## Trigger
`/milestone-status` or "what's the current milestone status?"

## What It Does
Reads `CLAUDE.md` CURRENT_PHASE, `PLAN.md`, and `docs/OPEN_QUESTIONS.md` to produce a concise status report.

## Procedure
1. Read `CLAUDE.md` line 18 → extract CURRENT_PHASE
2. Read `PLAN.md` → find the active milestone and its DoD checklist
3. Count completed vs incomplete DoD items
4. Read `docs/OPEN_QUESTIONS.md` → count unresolved questions
5. Read `docs/PLAN_DEVIATIONS.md` → count unresolved deviations
6. Produce a status report

## Expected Output
```
Milestone Status Report — [date]
=====================================
CURRENT_PHASE: [phase] | Milestone: [MN]
Agent: [current agent per AGENTS.md]

Progress: [X]/[Y] DoD items complete
  ✅ [completed items]
  ⬜ [incomplete items]

Open Questions: [N] unresolved
  - [question summary]

Plan Deviations: [N]
  - [deviation summary]

Blockers:
  - [blocker description] (from OPEN_QUESTIONS)

Next Agent: [name per handoff sequence]
```

## Skill Invoked
None (reads project state files directly)

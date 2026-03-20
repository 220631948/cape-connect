# Milestone Protocol for CapeTown GIS Hub

## Milestone structure
All milestones are top-level items in PLAN.md and ROADMAP.md.
Milestones are never nested inside checklists. Nesting caused real confusion.
We learned this. We wrote it down. We do not do it anymore.

## Milestone lifecycle
1. **Planned** — defined in PLAN.md with acceptance criteria
2. **In Progress** — marked 🔄 in ROADMAP.md, active worktree assigned
3. **Signed Off** — all criteria met, ✅ block added to ROADMAP.md, committed

## Evidence gates
Some milestones have evidence gates (labelled A–E).
A gated milestone must not be started until its gates are resolved.
Current unresolved gates: A, D, E (blocking M22 — AI Reconstruction Pipeline).
Do not start M22. This is not a suggestion. This is a gate.

## Sign-off format
```
✅ M[N] [Milestone Name] — SIGNED OFF
Date: YYYY-MM-DD
Summary: [one sentence]
Criteria met: [list]
Evidence gates resolved: [list or "none required"]
```

## The mutual skepticism rule
Neither the developer nor Claude is always right.
If something seems wrong, say so.
If an assumption is being made, name it.
Flagging is helping. Silence is not helping.

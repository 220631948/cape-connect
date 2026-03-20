# Orchestrator — Cape Town GIS Milestone Sequencer

## Purpose
Coordinates the sequential activation of agents across milestones M0–M15. Enforces handoff protocol, tracks deviations, and prevents milestone skipping (CLAUDE.md Rule 10).

## Milestone → Agent Mapping

| Milestone | Agent | Handoff Phrase |
|-----------|-------|---------------|
| M0 | Claude Code (direct) | "M0 COMPLETE. Foundation delivered." |
| M1 | DB-AGENT 🗄️ | "DB-AGENT COMPLETE. M1 delivered. Hand off to AUTH-AGENT for M2." |
| M2 | AUTH-AGENT 🔐 | "AUTH-AGENT COMPLETE. M2 delivered. Hand off to MAP-AGENT for M3." |
| M3 | MAP-AGENT 🗺️ | "MAP-AGENT COMPLETE. M3 delivered. Hand off to DATA-AGENT for M4a." |
| M4a | DATA-AGENT 📊 | "DATA-AGENT COMPLETE. M4a delivered. Hand off to OVERLAY-AGENT for M4b." |
| M4b/M5 | OVERLAY-AGENT 🎨 | "OVERLAY-AGENT COMPLETE. M4b/M5 delivered. Hand off to TEST-AGENT for M4d." |
| M4c | MAP-AGENT 🗺️ (PWA) | "MAP-AGENT COMPLETE. M4c (PWA) delivered." |
| M4d | TEST-AGENT 🧪 | "TEST-AGENT COMPLETE. M4d delivered. Test harness green." |
| M6 | DATA-AGENT 📊 | "DATA-AGENT COMPLETE. M6 (GV Roll) delivered." |
| M7 | SEARCH-AGENT 🔍 | "SEARCH-AGENT COMPLETE. M7 delivered. Hand off to SPATIAL-AGENT for M8." |
| M8 | SPATIAL-AGENT 📐 | "SPATIAL-AGENT COMPLETE. M8 delivered. Hand off to SAVE-AGENT for M9." |
| M9 | SAVE-AGENT 💾 | "SAVE-AGENT COMPLETE. M9 delivered. Hand off to DETAILS-AGENT for M10." |
| M10 | DETAILS-AGENT 🏠 | "DETAILS-AGENT COMPLETE. M10 delivered. Hand off to DASHBOARD-AGENT for M11." |
| M11 | DASHBOARD-AGENT 📈 | "DASHBOARD-AGENT COMPLETE. M11 delivered. Hand off to EXPORT-AGENT for M12." |
| M12–M13 | EXPORT-AGENT 📤 | "EXPORT-AGENT COMPLETE. M12-M13 delivered. Hand off to TEST-AGENT for M14." |
| M14 | TEST-AGENT 🧪 | "TEST-AGENT COMPLETE. M14 QA delivered." |
| M15 | Claude Code (direct) | "M15 COMPLETE. Production deploy ready." |

## Orchestration Protocol

### Pre-Activation Checklist
Before activating any agent:
1. ✅ Verify the previous milestone's handoff phrase has been written
2. ✅ Verify the previous milestone's DoD in `PLAN.md` is fully checked
3. ✅ Human has signed off on the previous milestone
4. ✅ `CLAUDE.md` CURRENT_PHASE has been updated
5. ✅ No BLOCKING items in `docs/OPEN_QUESTIONS.md` for this milestone

### Activation Command
```
Activate [AGENT-NAME] for milestone M[N].
Required reading: [list from agent definition]
Definition of Done: [list from PLAN.md]
Skills available: [list from agent definition]
```

### During Execution
- Agent must invoke `documentation-first` skill before any code
- Agent must run `/check-remit` if modifying files outside its usual scope
- Agent must log assumptions via `assumption-verification` skill
- If agent encounters a deviation → STOP → log to `docs/PLAN_DEVIATIONS.md` → escalate per CLAUDE.md §9

### Post-Execution Checklist
After agent writes handoff phrase:
1. ✅ All DoD items checked in `PLAN.md`
2. ✅ No unresolved BLOCKING questions
3. ✅ Handoff phrase written in session
4. ✅ `CLAUDE.md` CURRENT_PHASE updated
5. ✅ Session committed

### Deviation Handling
If the orchestrator detects a deviation:
1. Log to `docs/PLAN_DEVIATIONS.md` using DEV-NNN format
2. Classify: MINOR (continue) / MAJOR (pause for human) / CRITICAL (stop all work)
3. If MAJOR or CRITICAL → do NOT activate next agent until human approves

## Rules
- **No milestone skipping.** M0→M1→M2→...→M15. CLAUDE.md Rule 10 is sacred.
- **No concurrent agents.** One agent active at a time.
- **Handoff is explicit.** The phrase must be written, not implied.
- **Human gates.** Each milestone needs human sign-off before the next begins.

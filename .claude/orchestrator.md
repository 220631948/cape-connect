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

## Agent Handoff Rules — TILE-AGENT

TILE-AGENT 🗃️ is a supporting agent (not milestone-primary) invoked on-demand by MAP-AGENT or SPATIAL-AGENT whenever tile generation, PMTiles packaging, or Martin configuration is required.

### TILE-AGENT Activation Conditions
- MAP-AGENT requires MVT tile source beyond GeoJSON threshold (>10 000 features)
- SPATIAL-AGENT produces a processed dataset that needs to be published as vector tiles
- Any agent encounters a Martin config change or PMTiles re-pack requirement

### SPATIAL-AGENT → TILE-AGENT Handoff
When SPATIAL-AGENT completes a spatial processing task that outputs a dataset destined for tile serving:
1. SPATIAL-AGENT writes: `"SPATIAL-AGENT: tile generation required for [dataset]. Hand off to TILE-AGENT."`
2. Orchestrator activates TILE-AGENT with: dataset path, target zoom range, output destination (local PMTiles path or Martin source name)
3. TILE-AGENT completes and writes: `"TILE-AGENT COMPLETE. [dataset] tiles ready at [path/source]. Return to [requesting-agent]."`
4. Orchestrator returns control to the requesting agent (MAP-AGENT or SPATIAL-AGENT)

### TILE-AGENT Required Reading
- `.claude/guides/pmtiles_martin_guide.md`
- `docker-compose.yml` (Martin service config)
- `CLAUDE.md §5` (Map Rules — 10 000 feature threshold)

### TILE-AGENT Scope Constraints
- May write: `public/tiles/`, `martin/`, `docker-compose.yml` (Martin section only)
- Must NOT modify: app source files, migrations, auth, or any non-tile infrastructure
- Must invoke `/check-remit` before touching any file outside the tile scope

## Conflict Resolution Rules

### Agent Scope Conflicts
When two agents claim ownership of the same file or concern:
1. The **milestone-primary agent** takes precedence over a supporting agent
2. If both are milestone-primary (e.g., MAP-AGENT and OVERLAY-AGENT touching the same component), the **lower milestone number** agent owns the file until its milestone is complete
3. Disputes → log to `docs/PLAN_DEVIATIONS.md` → escalate to human before proceeding

### Rule Conflicts (CLAUDE.md vs Agent Definition)
- CLAUDE.md always wins. No exceptions.
- Agent definitions may be more specific but never contradict CLAUDE.md.
- If a contradiction is found: STOP → log to `docs/PLAN_DEVIATIONS.md` as DEV-NNN → escalate.

### Deviation Classification
| Severity | Examples | Action |
|----------|---------|--------|
| MINOR | Style/naming choice, non-breaking addition | Log, continue |
| MAJOR | Scope boundary crossed, rule bent | Log, pause, await human approval |
| CRITICAL | POPIA breach, API key exposed, geographic scope exceeded | STOP all work immediately |

## Rules
- **No milestone skipping.** M0→M1→M2→...→M15. CLAUDE.md Rule 10 is sacred.
- **No concurrent agents.** One agent active at a time (TILE-AGENT may run as a sub-task within a milestone, not concurrently with another primary agent).
- **Handoff is explicit.** The phrase must be written, not implied.
- **Human gates.** Each milestone needs human sign-off before the next begins.

<!-- nonce:11 -->

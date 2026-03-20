# AI Prompt Workflows — CapeTown GIS Hub

> **TL;DR:** Three AI agents (Claude Code, GitHub Copilot, Gemini CLI) operate with a three-file context pattern: `CLAUDE.md` (rules) + `PLAN.md` (current work) + relevant spec. All sessions follow read-rules → check-plan → implement → commit. Deviations go to `docs/PLAN_DEVIATIONS.md`. See `AGENTS.md` for the 10-agent fleet.

## Agent Hierarchy

| Agent | Tool | Role | Model |
|---|---|---|---|
| Claude Code | CLI / IDE | Primary orchestrator — code, files, tests | claude-opus-4-6 / claude-sonnet-4-6 |
| GitHub Copilot | VS Code / CLI | IDE agent mode, inline completions, sub-agent tasks | configurable |
| Gemini CLI | Terminal | Optional research sub-agent — web search, deep research | gemini-2.0-flash |

## Current Workflow (M0+ Phase)

### Three-File Context Pattern
Every agent session loads:
1. `CLAUDE.md` — non-negotiable rules
2. `PLAN.md` — current milestone and DoD checklist
3. Relevant spec file (e.g., `docs/architecture/SYSTEM_DESIGN.md`)

### Build Cycle
```
Read CLAUDE.md → Check PLAN.md → Implement next item → Run quality gates → Commit
```

### Quality Gates (per commit)
```bash
npm run lint        # ESLint
npm run typecheck   # TypeScript
npm test            # Vitest
npm run build       # Next.js build
```

### Escalation Protocol
Agent discovers it cannot follow the plan → **STOP** → document in `docs/PLAN_DEVIATIONS.md` → wait for human.

### Session Close Checklist
- [ ] Update CURRENT_PHASE in CLAUDE.md §1
- [ ] Commit with descriptive message
- [ ] Record open questions in `docs/OPEN_QUESTIONS.md`
- [ ] Record deviations in `docs/PLAN_DEVIATIONS.md`

## Copilot Agent Fleet (10 agents)
See `AGENTS.md` and `docs/planning/agent-definitions-v2.md` for the canonical fleet.

## Copilot Skills (12 active)
See `docs/infra/skills-catalog.md` for the full inventory in `.github/copilot/skills/`.

## Retired Tooling
- `loop.sh` — unguarded autonomous loop (removed M0)
- `.swarm/` — multi-agent mailbox system (removed M0)
- `ralph.yml` — auto-push GitHub Actions workflow (removed M0)
- `PROMPT_*.md` files — superseded by `CLAUDE.md` + `PLAN.md` pattern

## References
- `CLAUDE.md` (authoritative project rules)
- `PLAN.md` (milestone plan)
- `AGENTS.md` (agent fleet)
- `docs/infra/skills-catalog.md` (skill inventory)

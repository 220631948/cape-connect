# Swarm Agent Ecosystem Audit — Cycle 1

Date: 2026-03-05  
Todo: `swarm-agent-auditor-pass`

## Current state snapshot

- `.github/agents`: **10** definitions
- `.github/copilot/agents`: **8** definitions
- `.claude/agents`: **0** definitions
- `.gemini/agents`: **1** definitions

## Cleanup actions (performed or recommended)

### Performed in this cycle
- Re-audited the active ecosystem after prior pruning pass.
- Confirmed control-plane/documentation roles are still present and routable.
- Revalidated that `.claude/agents` remains empty and `.gemini/agents` is minimal.

### Recommended next cleanup actions
1. **Canonical-path enforcement**: enforce one canonical source for duplicated roles across `.github/agents` vs `.github/copilot/agents`.
2. **Parity gate**: add a CI check that fails when same-named agents diverge materially across directories.
3. **Bootstrap hold closure**: resolve whether `.gemini/agents/bootstrap-agent.md` is retained or retired, and record final decision in `docs/agents/agent-audit.md`.
4. **Governance log**: define append-only audit fields for routing/tool decisions.

## Overlap / conflict findings

- Duplicate specialist roles across `.github/agents` and `.github/copilot/agents` can create route drift.
- Control-plane intent is clear in docs but not enforced by a machine-readable policy file.
- Tool/skill constraints are expressed per-file and can diverge over time.

## Strongest routing map (requested swarm roles)

| Requested role | Strongest available mapping | Rationale |
|---|---|---|
| `research-agent` | `awesome-copilot/gem-researcher` | Best fit for evidence-tagged research synthesis in docs-only cycles. |
| `documentation-agent` | `awesome-copilot/gem-documentation-writer` | High-throughput docs generation/refinement with structure constraints. |
| `agent-auditor` | `.github/agents/orchestrator.agent.md` + `.github/agents/infra-agent.agent.md` + governance review pass | Strongest governance + consistency lens. |
| `architecture-analyst` | `awesome-copilot/se-system-architecture-reviewer` | Focused architecture tradeoff and dependency analysis. |

## Minimal remediation plan

1. Add proposed new file `docs/agents/governance-policy.md` with canonical agent path rules and fail-closed behavior.
2. Add parity-check script/CI rule for duplicated agent filenames.
3. Add route-decision logging spec (requested role, selected agent, policy version, allowed tools, outcome).
4. Re-run inventory audit each cycle and append deltas to `docs/agents/agent-audit.md`.

## References

- `AGENTS.md`
- `docs/agents/agent-audit.md`
- `.github/agents/orchestrator.agent.md`
- `.github/agents/infra-agent.agent.md`
- `.github/copilot/agents/`
- `.gemini/agents/bootstrap-agent.md`

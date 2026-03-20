# ESCALATION PROTOCOL
## Cross-Agent Dependency Resolution

This document defines how agents coordinate when an unexpected dependency is discovered mid-milestone.

### TRIGGER CONDITIONS
Escalation is required when an agent needs something from a previous agent that is missing or incomplete:
- Discovering a design decision that was not documented.
- Finding that a data source previously assumed available is unreachable.
- Needing an artefact a previous agent was supposed to produce but did not.
- Discovering a `PLAN.md` inconsistency mid-implementation.

### ESCALATION FORMAT
An agent must write a structured escalation message:
- **Escalating Agent:** [Current Agent Name]
- **Receiving Agent:** [Responsible Agent Name]
- **Issue:** [The specific gap or question]
- **Paused Milestone:** [The milestone number currently blocked]
- **Required Resolution:** [The specific file, mock data, or decision needed]

### RESPONSE PROTOCOL
The receiving agent produces **only** the specific missing artefact, not a re-run of the entire milestone. It delivers the artefact directly to the paused agent with a handoff message resolving the escalation.

### HUMAN ESCALATION
Agents escalate to the human rather than another agent for:
- Any `PLAN.md` deviation.
- Any POPIA compliance or regulatory uncertainty.
- Any disagreement between two agents about a core design decision.

### BLOCKING VS. NON-BLOCKING ESCALATIONS
- **Blocking:** Pauses the current milestone entirely. Must be resolved to proceed.
- **Non-blocking:** Documents the gap, continues with a `[PLACEHOLDER]`, to be resolved before the milestone's Definition of Done (DoD) is completed.

### ESCALATION LOG
Maintain an escalation tracking section in `docs/OPEN_QUESTIONS.md`. Every escalation is recorded with status (OPEN / RESOLVED) and resolution details.

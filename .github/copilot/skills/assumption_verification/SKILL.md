---
name: assumption-verification
description: Verify unconfirmed claims, dependencies, or data sources before proceeding. Prevents milestone-blocking surprises.
---

# Assumption Verification Workflow

## Purpose
Catch unverified assumptions before they become bugs or blockers. Every claim about data availability, API behaviour, or external dependency must be verified.

## Trigger Condition
Invoke when encountering any claim, dependency, or data source that cannot be immediately confirmed from project documentation.

## Procedure

### Step 1 — Classify
Write the assumption as a falsifiable statement. Classify it:

| Classification | Definition | Action |
|---------------|------------|--------|
| **VERIFIABLE NOW** | Can be checked against docs or live APIs | Verify immediately |
| **VERIFIABLE WITH HUMAN** | Needs credentials, access, or domain knowledge | Flag in `docs/OPEN_QUESTIONS.md` |
| **STRUCTURAL** | Architectural assumption baked into the design | Log deviation, escalate |

### Step 2 — Attempt Verification
Check these sources in order:
1. `docs/API_STATUS.md` — API endpoint status
2. `PLAN.md` — milestone requirements
3. `docs/specs/` — feature specifications
4. `CLAUDE.md` — project rules
5. Live API probe (if endpoint is known and safe to call)
6. `docs/research/` — previous research findings

State the result clearly.

### Step 3 — Log Result
Add to `docs/OPEN_QUESTIONS.md` if unresolved, or record verification inline:

```markdown
## Assumption: [falsifiable statement]
- **Classification:** VERIFIABLE NOW | VERIFIABLE WITH HUMAN | STRUCTURAL
- **Result:** VERIFIED | UNVERIFIED | INVALIDATED
- **Source:** [what confirmed or denied it]
- **Resolution:** [action taken or required]
- **Date:** [YYYY-MM-DD]
```

### Step 4 — Handle Unverified
- **(A) Non-blocking:** Continue with `[ASSUMPTION — UNVERIFIED]` marker in code comments. Add to `docs/OPEN_QUESTIONS.md`.
- **(B) Milestone-blocking:** STOP work. Flag in `docs/OPEN_QUESTIONS.md` with `BLOCKING` label. Escalate per CLAUDE.md §9.
- **(C) Structural:** Log deviation in `docs/PLAN_DEVIATIONS.md`. Escalate to human. Do not proceed.

### Step 5 — Track to Resolution
Every unverified assumption must be resolved before its milestone's sign-off. Cross-reference `docs/OPEN_QUESTIONS.md` during `/milestone-status`.

## When NOT to Use This Skill
- Facts directly stated in CLAUDE.md or PLAN.md (these are authoritative)
- Standard library behaviour documented in official docs
- Internal implementation details you can verify by reading the code

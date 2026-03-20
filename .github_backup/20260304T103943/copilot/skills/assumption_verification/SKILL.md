---
name: assumption-verification
description: Verify unconfirmed claims, dependencies, or data sources before proceeding.
---

# Assumption Verification Workflow

Invoke when encountering any claim, dependency, or data source that cannot be immediately confirmed.

## Steps

1. **Classify:** Write assumption as a falsifiable statement. Classify as VERIFIABLE NOW / VERIFIABLE WITH HUMAN INPUT / STRUCTURAL.
2. **Attempt Verification:** Check `DATA_CATALOG.md`, `PLAN.md`, or regulatory checklists. State result.
3. **Log Result:** Add to `docs/ASSUMPTIONS_LOG.md` with: text, classification, result (VERIFIED / UNVERIFIED / INVALIDATED), source, and resolution action.
4. **Handle Unverified:** (A) Non-blocking: continue with `[ASSUMPTION — UNVERIFIED]` marker. (B) Milestone-blocking: pause and flag in `OPEN_QUESTIONS.md`. (C) Structural: log deviation, escalate to human.
5. **Track to Resolution:** Every unverified assumption must be resolved before milestone sign-off.

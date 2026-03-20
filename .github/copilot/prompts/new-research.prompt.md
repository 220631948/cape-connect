---
mode: 'agent'
description: 'Create a new research document with verification stance markers'
---
# New Research Document Generator

## Context
Read `CLAUDE.md` Section 9 (escalation protocol) and any related existing research in `docs/research/` before generating.

## Task
Generate a research document at `docs/research/<topic>.research.md` on the topic provided by the user.

Rules:
- Every factual claim must be tagged `[VERIFIED]` or `[ASSUMPTION—UNVERIFIED]`
- `[VERIFIED]` = confirmed from official docs, source code, or reproducible test
- `[ASSUMPTION—UNVERIFIED]` = plausible but not confirmed; must be verified before shipping
- File must be ≤300 lines
- TL;DR is the first section, ≤5 sentences
- Cape Town / Western Cape scope lock applies; flag out-of-scope findings

Sections required:

1. **TL;DR** — key finding in ≤5 sentences
2. **Verification Stance** — overall confidence level (HIGH/MEDIUM/LOW) and rationale
3. **Roadmap Relevance** — which milestone(s) this unblocks or informs
4. **Findings** — numbered findings, each prefixed `[VERIFIED]` or `[ASSUMPTION—UNVERIFIED]`
5. **Data Sources** — list of URLs, docs versions, or test runs used
6. **Risks & Unknowns** — what still needs confirmation before implementation
7. **Recommended Next Steps** — concrete actions with suggested agent assignment

## Output Format
```markdown
# Research: <Topic>
> TL;DR: ...

**Confidence:** HIGH | MEDIUM | LOW
**Milestone relevance:** M<N>

## Verification Stance
## Findings
1. [VERIFIED] ...
2. [ASSUMPTION—UNVERIFIED] ...
## Data Sources
## Risks & Unknowns
## Recommended Next Steps
```

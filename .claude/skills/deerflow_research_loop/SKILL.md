---
name: deerflow-research-loop
description: Multi-agent research loop adapted from DeerFlow-2.0 pattern. Decompose a research question into parallel tracks, synthesize evidence-typed findings, and publish one traceable report. Use for complex domain questions requiring multi-source validation.
---

# DeerFlow Research Loop

## Purpose
Coordinate deep research across multiple sources using a plan-execute-reflect cycle,
producing a single validated report with citations. All claims are typed as
`[VERIFIED]` or `[ASSUMPTION — UNVERIFIED]`.

## Fallback Note
DeerFlow/DeerFlow-2.0 was not publicly accessible at plan time (2026-03-11).
This skill implements the DeerFlow conceptual pattern (hierarchical agent decomposition
with reflection) based on published descriptions and the existing `gis_research_swarm`
skill in this repo, which already implements a similar loop for GIS domain questions.

## When to Use
- Complex research questions spanning multiple data sources
- Prior-art investigation before implementing a new feature
- Synthesis of community pattern repos (e.g., external skill integration)
- Validation of assumptions that would block a milestone gate

## Workflow

### Step 1 — Decompose Question
Break the research question into 3–5 independent sub-questions (tracks).
Each track must be answerable independently with its own source set.

Example decomposition for "Is MyCiTi GTFS data suitable for M12?":
- Track A: License and terms of use
- Track B: Data freshness and update frequency
- Track C: Format compatibility with `gtfs2geojson` toolchain
- Track D: Coverage within Cape Town bbox (Rule 9)

### Step 2 — Assign Track Agents
Each track uses a separate Claude Code sub-agent (via `Agent` tool) with:
- Specific search scope (URLs, file paths, or domains)
- Source constraints (Cape Town scope, approved sources only)
- Evidence typing requirement: all claims must be tagged

Evidence tags:
- `[VERIFIED — source: <URL/file>]`
- `[ASSUMPTION — UNVERIFIED]`
- `[CONTRADICTION — conflicts with <source>]`

### Step 3 — Execute Tracks in Parallel
Invoke all track agents concurrently. Each returns:
- Key findings with source citations
- Open questions
- Confidence level: `HIGH` / `MEDIUM` / `LOW`

### Step 4 — Reflect & Cross-Validate
- Identify contradictions between track outputs
- Resolve by weight of evidence or mark `UNRESOLVED`
- Identify shared conclusions to amplify in synthesis

### Step 5 — Synthesize Report
Produce one markdown report with the following structure:

```markdown
# Research Report: <topic>
Date: YYYY-MM-DD | Agent: <agent_id>

## Executive Summary
- <3–5 bullet points, each citing at least one source>

## Findings by Track
### Track A: <name>
<findings with inline [VERIFIED] / [ASSUMPTION] tags>

### Track B: ...

## Contradictions & Resolutions
| Contradiction | Source A | Source B | Resolution |
|---------------|----------|----------|------------|

## Open Questions
- [ ] <question requiring follow-up>

## Recommended Next Actions
1. <action tied to specific milestone or task>
```

### Step 6 — Publish
- Save to `docs/research/<topic>-deerflow-<YYYY-MM-DD>.md`
- Update `docs/research/README.md` index with new report entry

## Quality Gate
Before publishing, verify:
- [ ] No uncited factual claims (every assertion has a `[VERIFIED — source: ...]` tag or is labeled `[ASSUMPTION]`)
- [ ] All contradictions resolved or explicitly flagged as `UNRESOLVED`
- [ ] At least one recommended next action per open question
- [ ] Report is ≤ 300 lines (split into multi-file series if longer)

## Output
```
DeerFlow Research Loop — <topic>
  Tracks executed: A, B, C, D (parallel)
  Verified claims: 12
  Assumptions flagged: 3
  Contradictions: 1 (resolved)
  Open questions: 2
  Report: docs/research/<topic>-deerflow-2026-03-11.md
  README index: ✓ updated

RESULT: PASS — report ready for milestone gate review
```

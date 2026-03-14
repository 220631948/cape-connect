---
name: gis-research-swarm
description: Run a docs-first GIS research swarm cycle and synthesize one validated report with citations. Use this skill whenever users ask for swarm/autopilot research, priority-domain updates, continuous GIS knowledge-base improvement, or agent-ecosystem research cleanup.
---

# GIS Research Swarm

## Purpose
Coordinate a repeatable research cycle across GIS priorities, cross-validate claims, and publish one traceable synthesis report.

## Priority Domains
- GIS pipelines
- Spatial AI / reconstruction
- Python geospatial tooling
- React geospatial visualization
- Frappe ERP spatial integration

## Required Context
- `docs/context/GIS_MASTER_CONTEXT.md`
- `docs/research/README.md`
- `docs/agents/agent-audit.md`
- `docs/research/swarm-cross-validation-cycle1.md`
- latest cycle report under `docs/agents/`

## Workflow

### Step 1 — Lock Scope and Constraints
- Keep Cape Town + Western Cape scope.
- Enforce `LIVE → CACHED → MOCK` and source-badge expectations in recommendations.
- Respect docs-only constraints when active.

### Step 2 — Decompose Into Independent Tracks
Run one track per priority domain, plus:
- architecture insights track
- agent ecosystem cleanup track

### Step 3 — Produce Evidence-Typed Findings
For every track:
- classify each claim as `[VERIFIED]` or `[ASSUMPTION — UNVERIFIED]`
- include inline citations to source files/sections
- separate facts from recommendations

### Step 4 — Cross-Validate Before Synthesis
- identify contradictions across tracks
- resolve by evidence or mark unresolved
- record unresolved blockers explicitly

### Step 5 — Publish Unified Report
Generate one markdown report with this structure:
1. Table of Contents
2. Executive Summary
3. Validated Findings by Priority Domain
4. Agent Ecosystem Cleanup (performed/recommended)
5. Architecture Insights and Recommendations
6. Documentation Updates (ready-to-apply diffs where relevant)
7. Measurable Impact
8. Next-Cycle Priorities

### Step 6 — Sync Knowledge Base
- update `docs/research/README.md` when new docs are added
- keep references traceable and current

## Output Quality Gate
- no uncited factual claims
- unresolved assumptions are explicit
- recommendations include concrete next verification actions


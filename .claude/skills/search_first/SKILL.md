---
name: search-first
description: Research-before-coding workflow. Mandates that RESEARCHER agent verifies open data sources and spatial analysis approaches before any implementation begins.
---

<!--
origin: affaan-m/everything-claude-code/skills/search-first/
adaptation-summary: Scoped to Cape Town GIS data sources, POPIA research mandates, and
  the existing RESEARCHER agent workflow. Added open-data validation gate.
-->

# Search-First Skill — Research Before You Code

## When to Apply

- Before implementing any new data layer
- Before choosing a spatial analysis approach
- Before integrating a new external API
- Before adding any dataset that may contain personal data

## Workflow

### Phase 1: Source Verification

Invoke `RESEARCHER` agent with target:

```
RESEARCHER: verify open data availability for [dataset_name]
Sources: City of Cape Town ODP, Western Cape data portal, Stats SA
Check: license, vintage, format, POPIA classification
```

Never use a dataset that hasn't been verified through this step.

### Phase 2: Approach Validation

Before writing any spatial query or analysis:

```
RESEARCHER: research approaches for [spatial_problem]
Check: PostGIS capabilities, Turf.js client-side limits, Martin MVT threshold
Produce: docs/research/[topic]-research.md with evidence tags
```

### Phase 3: Implementation Gate

Only proceed to implementation after:

- [ ] Data source confirmed in `docs/research/open-datasets.md` approved list
- [ ] No Lightstone data (CLAUDE.md Rule 8)
- [ ] POPIA classification confirmed
- [ ] Approach documented in `docs/specs/`

## Anti-Patterns (Never Do These)

- ❌ Fetch a dataset URL without checking ODP license
- ❌ Implement a PostGIS query pattern without checking existing guides
- ❌ Integrate a new vendor API without RESEARCHER verification

## MCP Servers

- `gemini-deep-research`, `exa`, `context7` (for RESEARCHER)
- `gis-mcp` (for spatial approach verification)

## Output

- `docs/research/<topic>-research.md` — evidence-tagged research report
- Approval recorded in `docs/specs/` before implementation

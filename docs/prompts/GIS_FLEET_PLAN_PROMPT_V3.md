# GIS Fleet Plan Prompt v3

> **TL;DR:** This prompt orchestrates a multi-agent documentation sprint for the CapeTown GIS Hub. It deploys 10 agents (see `AGENTS.md`) across six architectural pillars to produce structured, cross-referenced documentation. Research queries run first, then agents execute in parallel. See `CLAUDE.md` for rules and `PLAN.md` for milestones.

## Prerequisites

1. Read `CLAUDE.md` (non-negotiable rules)
2. Read `PLAN.md` (milestone M0-M15 sequence)
3. Read `AGENTS.md` (canonical 10-agent fleet)
4. Complete research queries before fleet sprint (see below)

## Usage Sequence

```bash
# Step 1 — Research (do not skip)
# Run research queries and save to docs/research/
copilot --model claude-opus-4-6

# Step 2 — Load context
# Reference: CLAUDE.md + PLAN.md + AGENTS.md + docs/research/

# Step 3 — Deploy fleet agents per pillar assignment below
```

## Six-Pillar Architecture

| Pillar | Focus | Primary Agents | Key Outputs |
|---|---|---|---|
| 1. Tiles | Google/Cesium basemap + rendering | map-agent, cesium-agent | Tile architecture, layer stack docs |
| 2. OSINT | OpenSky ingestion + entity fusion | flight-tracking-agent | Intelligence layer, data fusion docs |
| 3. AI Reconstruction | NeRF/3DGS/4DGS workflows | immersive-reconstruction-agent | Pipeline design, AI labeling policy |
| 4. Domain Extensions | User-domain workflows | data-agent, spatial-agent | Domain guides, extension specs |
| 5. Infra & Steering | Docker, MCP, skills, backlog/risk | infra-agent, orchestrator | Env config, backlog, risk matrix |
| 6. File Formats | ArcGIS/QGIS/CRS handling | data-agent | Import pipeline, CRS detection docs |

## Research Queries (Run Before Sprint)

1. spatialintelligence.ai WorldView patterns and GIS feature concepts
2. Google Maps Tile API + Photorealistic 3D Tiles — Cape Town coverage
3. CesiumJS scene composition — 8-layer temporal 3D architecture
4. OpenSky Network API — real-time ADS-B integration patterns
5. NeRF/3DGS/4DGS — Nerfstudio + COLMAP pipeline for urban scenes
6. ArcGIS/QGIS format handling — .shp/.gdb/.qgz import + CRS detection
7. Multi-tenant SaaS — PostGIS RLS + Supabase tenant isolation
8. PWA offline — Serwist + Dexie + PMTiles for field workers

## Agent Execution Rules

- Each agent reads `CLAUDE.md` FIRST, before any task prompt
- Each agent writes ONLY to its permitted file scope
- Output must include `[VERIFIED]` or `[ASSUMPTION — UNVERIFIED]` markers
- Data displays must show source badge: `[SOURCE · YEAR · LIVE|CACHED|MOCK]` (Rule 1)
- External data must follow LIVE → CACHED → MOCK fallback (Rule 2)
- Geographic scope: Cape Town + Western Cape only (Rule 9)
- File size limit: ≤ 300 lines per source file (Rule 7)

## Orchestrator Merge Pass

After all agents complete:
1. Cross-reference all outputs for consistency
2. Update `ROADMAP.md` with delivery state changes
3. Verify internal links between documents
4. Flag unresolved assumptions in `docs/OPEN_QUESTIONS.md`

## Milestone Alignment

| Phase | Milestones | Sprint Focus |
|---|---|---|
| Now | M0 (in progress) | Foundation, governance, local dev |
| Next | M1-M4 | Schema, auth, basemap, fallback, tiles, PWA |
| Later | M5-M15 | Features, analysis, QA, production |

## Non-Negotiable Constraints (from CLAUDE.md)
- MapLibre GL JS only — NOT Leaflet, NOT Mapbox GL JS
- EPSG:4326 storage, EPSG:3857 rendering
- RLS + app-layer tenant isolation on every table
- POPIA annotations on files handling personal data
- No Lightstone data — GV Roll 2022 is approved source
- Attribution: `© CARTO | © OpenStreetMap contributors`

## Assumptions
- **[VERIFIED]** 10-agent fleet matches `AGENTS.md` (2026-03-05)
- **[VERIFIED]** 12 skills exist in `.github/copilot/skills/`
- **[ASSUMPTION — UNVERIFIED]** All research query topics have sufficient public documentation

## References
- `CLAUDE.md` (authoritative rules)
- `PLAN.md` (milestone plan M0-M15)
- `AGENTS.md` (canonical 10-agent fleet)
- `ROADMAP.md` (six-pillar delivery track)
- `docs/planning/agent-definitions-v2.md` (agent details)
- `docs/infra/skills-catalog.md` (12 active skills)

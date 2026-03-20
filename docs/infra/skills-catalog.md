# Skills Catalog

> **TL;DR:** 19 project-specific skills live in `.github/copilot/skills/`. They auto-activate by keyword match and teach agents domain-specific workflows. See `CLAUDE.md` for project rules and `AGENTS.md` for agent-skill mapping.

## Active Skills (`.github/copilot/skills/`)

| Skill Directory | Trigger Keywords | Purpose | Primary Agent |
|---|---|---|---|
| `4dgs_event_replay` | 4dgs, event replay, temporal | 4D Gaussian Splatting temporal reconstruction | immersive-reconstruction-agent |
| `arcgis_qgis_uploader` | shapefile, gpkg, qgz, upload | ArcGIS/QGIS file validation, reprojection | data-agent |
| `assumption_verification` | assumption, unverified, verify | Verify claims before proceeding | orchestrator |
| `cape_town_gis_research` | cape town, research, gis | Cape Town GIS domain knowledge | All agents |
| `cesium_3d_tiles` | cesium, 3d tiles, ion | CesiumJS + Google 3D Tiles integration | cesium-agent |
| `data_source_badge` | badge, source, live, cached, mock | Data source badge for every data display component | All agents |
| `docs_traceability_gate` | docs qa, traceability, citation, readiness gate, cross validation | Documentation quality gate with evidence/citation consistency checks | orchestrator |
| `documentation_first_design` | docs, documentation, spec | Documentation-first development workflow | All agents |
| `gis_research_swarm` | swarm, autopilot, research cycle, priority domains | Multi-domain GIS research swarm orchestration and synthesis | orchestrator |
| `mock_to_live_validation` | mock, live, validation, fallback | MOCK → LIVE transition validation | data-agent |
| `nerf_3dgs_pipeline` | nerf, 3dgs, splatfacto, colmap | NeRF/3DGS reconstruction pipeline | immersive-reconstruction-agent |
| `opensky_flight_tracking` | opensky, adsb, flight, airspace | OpenSky Network flight data integration | flight-tracking-agent |
| `popia_compliance` | popia, personal data, consent | POPIA compliance checklist | All agents |
| `popia_spatial_audit` | popia, spatial, location, tracking | Spatial data PII audit | spatial-agent, db-agent |
| `rls_audit` | rls, row level security, tenant isolation, policy | RLS policy audit for all PostGIS tables | db-agent |
| `spatial_validation` | bbox, crs, geojson, wkt, epsg, bounding box | Validate geometries within Cape Town bbox and CRS | spatial-agent |
| `spatialintelligence_inspiration` | worldview, immersive, dashboard | spatialintelligence.ai WorldView patterns | cesium-agent |
| `three_tier_fallback` | fallback, live cached mock, api cache, offline | LIVE→CACHED→MOCK three-tier fallback implementation | data-agent |
| `tile_optimization` | pmtiles, mvt, tippecanoe, zoom, tile cache | PMTiles/MVT tile optimization for mobile PWA | map-agent |

## Skill File Convention

- **Path:** `.github/copilot/skills/{skill_name}/`
- **Activation:** Keyword-based; Copilot matches skill descriptions to user queries
- **Scope:** Each skill teaches one bounded domain workflow

## Governance
- Skills reference MCP tools indirectly — no embedded credentials
- Hooks enforce safety invariants when skills trigger sensitive actions (see `hooks-reference.md`)
- Every high-impact skill states failure criteria and escalation path

## Verification Checklist
- [ ] Trigger keywords are specific enough to avoid accidental activation
- [ ] Generated artifacts are validated against `CLAUDE.md` rules, not skill prose alone
- [ ] No skill step bypasses secret scanning or tenant isolation checks

## Assumptions
- **[VERIFIED]** All 19 skills exist in `.github/copilot/skills/`
- **[ASSUMPTION — UNVERIFIED]** Runtime deterministic ordering when multiple skills match

## References
- `CLAUDE.md` §3 (credential rules), §4 (RLS/tenant isolation)
- `docs/infra/hooks-reference.md` (enforcement hooks)
- `docs/infra/mcp-servers.md` (MCP tool access)

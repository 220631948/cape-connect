# Swarm Architecture Insights — Cycle 1

Date: 2026-03-05  
Todo: `swarm-architecture-analyst-pass`

## Executive insight

The repository has strong docs-first GIS architecture hygiene (fallbacks, RLS/tenant isolation, compliance framing), but the largest risk is **integration governance drift** across provider policy, AI evidence boundaries, and duplicated agent definitions.

## Validated insights by priority domain

### 1) GIS pipelines
- Three-tier fallback (`LIVE -> CACHED -> MOCK`) is repeatedly enforced in architecture/integration docs.
- Import pipeline docs now define staged validation with CRS handling and failure modes.
- Remaining gap: convert documented thresholds into measurable acceptance gates for runtime.

### 2) Spatial AI
- 3DGS/NeRF guidance is present with human-review and labeling constraints.
- Evidence boundary language exists but needs continuous parity checks across all integration docs.
- Remaining gap: benchmark-backed device/runtime thresholds before build phase unblocking.

### 3) Python geospatial tooling
- Research identifies Python sidecar value for heavy geoprocessing and ETL augmentation.
- Remaining gap: explicit boundary between DB-native SQL/PostGIS operations and Python sidecar responsibilities.

### 4) React / geospatial visualization
- MapLibre + Cesium split is coherent for 2D/3D responsibilities.
- Remaining gap: harmonized performance budget and fallback behavior matrix across mobile/desktop targets.

### 5) Frappe ERP spatial integrations
- Potential integration path identified via API/event boundaries.
- Largest uncertainty remains production-grade mapping of tenancy, spatial objects, and compliance obligations.

## Assumptions (explicit)

- [Assumption] Frappe spatial integration will remain API/event-driven rather than deep in-process coupling.
- [Assumption] Current docs capture enough policy constraints to start controlled prototype planning.
- [Unverified] Provider-specific commercial/licensing edge cases for all deployment modes.

## Prioritized recommendations (impact/effort/dependency)

| Recommendation | Impact | Effort | Depends on |
|---|---|---:|---|
| Create canonical agent-policy doc + parity gate | High | Medium | Agent audit follow-up |
| Publish runtime compatibility SLO matrix for 3DGS/Cesium | High | Medium | `docs/research/cycle1-3dgs-runtime-compatibility-matrix.md` |
| Define Python sidecar boundary ADR | Medium-High | Medium | Python tooling research deltas |
| Define Frappe integration boundary brief | Medium-High | Medium | Frappe integration research + policy review |
| Add docs QA automation for section integrity/citation checks | Medium | Low-Med | Existing docs QA scripts/process |

## Architecture risks to escalate

1. Commercial/licensing interpretation risk across OpenSky + map/tiles providers.
2. Drift risk between docs and eventual implementation if build phase starts without strict gate checks.
3. Multi-tenant data boundary risk in cross-system ERP integrations.

## References

- `docs/context/GIS_MASTER_CONTEXT.md`
- `docs/architecture/SYSTEM_DESIGN.md`
- `docs/architecture/TECH_STACK.md`
- `docs/research/cycle1-research-synthesis.md`
- `docs/research/swarm-python-geospatial-tooling.md`
- `docs/research/swarm-react-geospatial-visualization.md`
- `docs/research/swarm-frappe-spatial-integrations.md`
- `docs/research/cycle1-opensky-commercialization-constraints.md`
- `docs/research/cycle1-3dgs-runtime-compatibility-matrix.md`

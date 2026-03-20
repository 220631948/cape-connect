# Documentation Audit & Gap Analysis

**Date:** 2026-03-06
**Auditor:** Copilot CLI (automated)
**Scope:** 125 markdown files across 16 subdirectories in `docs/`
**Authoritative sources:** `PLAN.md`, `ROADMAP.md`, `CLAUDE.md`, `docs/backlog/feature-backlog.md`

---

## TL;DR

- **125 docs exist** across architecture, specs, research, features, integrations, infra, UX, user-guides, backlog, planning, and context.
- **Milestones M0–M4 are well-documented** with specs, ADRs, and architecture docs covering base map, auth, RLS, tiles, PWA, and fallback.
- **Milestones M5–M15 have critical documentation gaps** — 8 of 11 future milestones have zero dedicated spec or architecture doc.
- **10 broken cross-references** found — files deleted during repo cleanup are still referenced by active docs.
- **5 referenced files do not exist:** `TECHNICAL_ARCHITECTURE_SPEC.md`, `GEOGRAPHIC_CONSTRAINTS.md`, `RESEARCH_ANSWERS.md`, `AUTH_DESIGN.md`, `DPIA.md`.
- **Key missing docs:** no Guest Mode spec, no Search & Filters spec, no Property Detail Panel spec, no Analytics Dashboard spec, no Share URLs spec, no QA plan, no DPIA template.
- **Backlog items are well-structured** but 13 of 20 RICE items lack corresponding implementation specs.

---

## 1. Milestone → Documentation Coverage Matrix

### M0 — Foundation & Governance ✅ WELL COVERED

| DoD Item | Existing Doc(s) | Gap Status |
|---|---|---|
| `.gitignore` / dangerous tooling removed | `docs/architecture/root-cleanup-audit.md`, `docs/REMOVED_ARTIFACTS_*.md` | ✅ Covered |
| Root .md consolidated | `docs/REBOOTSTRAP_SUMMARY_*.md` | ✅ Covered |
| `CLAUDE.md` rewritten | `CLAUDE.md` (root) | ✅ Covered |
| `AGENTS.md` rewritten | `AGENTS.md` (root) | ✅ Covered |
| `PLAN.md` created | `PLAN.md` (root) | ✅ Covered |
| `package.json` created | `package.json` (root) | ✅ Covered |
| `docker-compose.yml` | `docs/docker/DOCKER_README.md`, `docs/docker/environment-config.md` | ✅ Covered |
| RLS migration fixed | `supabase/migrations/20250227140000_initial_schema.sql` | ✅ Covered |
| CI pipeline | `.github/workflows/ci.yml` | ✅ Covered |

### M1 — Database Schema, RLS, PostGIS ⚠️ PARTIALLY COVERED

| DoD Item | Existing Doc(s) | Gap Status |
|---|---|---|
| Table creation (CLAUDE.md §4) | `docs/specs/04-spatial-data-architecture.md`, `docs/specs/11-multitenant-architecture.md` | ✅ Covered |
| RLS policies | `docs/specs/05-rls-testing.md`, `docs/RBAC_MATRIX.md` | ✅ Covered |
| Spatial indexes (GIST) | `supabase/migrations/20260301000000_composite_spatial_indexes.sql` | ✅ Covered |
| `api_cache` table | `docs/specs/13-arcgis-fallback.md` | ✅ Covered |
| Seed migration (test tenant + roles) | — | 🔴 **GAP** — No seed data spec or script documented |
| RLS test harness | `docs/specs/05-rls-testing.md` | ✅ Covered |

### M2 — Auth, RBAC, POPIA Consent ✅ WELL COVERED

| DoD Item | Existing Doc(s) | Gap Status |
|---|---|---|
| Supabase Auth config | `docs/specs/02-authentication-rbac.md` | ✅ Covered |
| JWT tenant_id + role claims | `docs/specs/02-authentication-rbac.md` | ✅ Covered |
| POPIA consent banner | `docs/specs/10-popia-compliance.md` | ✅ Covered |
| Profiles table trigger | `docs/specs/02-authentication-rbac.md` | ✅ Covered |
| Role-based middleware | `docs/RBAC_MATRIX.md`, `docs/specs/02-authentication-rbac.md` | ✅ Covered |

### M3 — MapLibre Base Map ✅ WELL COVERED

| DoD Item | Existing Doc(s) | Gap Status |
|---|---|---|
| MapLibre GL JS init | `docs/specs/01-base-map.md` | ✅ Covered |
| CartoDB Dark Matter basemap | `docs/specs/01-base-map.md` | ✅ Covered |
| Cape Town centre, zoom 11 | `docs/specs/01-base-map.md`, `CLAUDE.md` §9 | ✅ Covered |
| Bounding box enforcement | `docs/specs/01-base-map.md` | ✅ Covered |
| Responsive layout | `docs/specs/01-base-map.md` | ✅ Covered |
| Dark theme | `docs/specs/01-base-map.md` | ✅ Covered |

### M4 — Architecture Layer ✅ WELL COVERED

| DoD Item | Existing Doc(s) | Gap Status |
|---|---|---|
| M4a: Three-tier fallback | `docs/specs/13-arcgis-fallback.md`, `docs/DATA_LIFECYCLE.md` | ✅ Covered |
| M4a: Source badge component | `docs/architecture/ai-content-labeling.md` | ✅ Covered |
| M4b: Martin MVT | `docs/specs/07-martin-tile-server.md`, `docs/architecture/tile-layer-architecture.md` | ✅ Covered |
| M4b: Cadastral at zoom ≥ 14 | `docs/specs/07-martin-tile-server.md` | ✅ Covered |
| M4c: Serwist PWA | `docs/specs/06-mobile-offline-architecture.md`, `docs/specs/14-background-sync.md` | ✅ Covered |
| M4c: Dexie.js offline | `docs/specs/06-mobile-offline-architecture.md` | ✅ Covered |
| M4c: Background Sync | `docs/specs/09-offline-sync-queue.md`, `docs/specs/14-background-sync.md` | ✅ Covered |
| M4d: RLS test harness | `docs/specs/05-rls-testing.md` | ✅ Covered |

### M5 — Zoning Overlay (IZS) ⚠️ PARTIALLY COVERED

| DoD Item | Existing Doc(s) | Gap Status |
|---|---|---|
| IZS zoning codes rendering | `docs/specs/03-zoning-overlays.md` | ✅ Covered |
| Hybrid 2D/3D view (CesiumJS) | `docs/architecture/tasks/task-M5-hybrid-view.md`, `docs/PLAN_DEVIATIONS.md` (DEV-002) | ✅ Covered |
| Sensor fusion architecture | `docs/architecture/tasks/task-M5-M7-sensor-fusion.md` | ✅ Covered |
| Google 3D Tiles integration | `docs/integrations/google-maps-tile-api.md`, `docs/integrations/cesium-platform.md` | ⚠️ Research exists, no implementation spec |

### M6 — GV Roll 2022 Import ✅ COVERED

| DoD Item | Existing Doc(s) | Gap Status |
|---|---|---|
| GV Roll ETL pipeline | `docs/specs/12-gv-roll-ingestion.md`, `docs/ETL_PIPELINE.md` | ✅ Covered |

### M7 — Search + Filters 🔴 MAJOR GAP

| DoD Item | Existing Doc(s) | Gap Status |
|---|---|---|
| Property search UI | — | 🔴 **GAP** — No spec exists |
| Filter panel (price, zoning, suburb) | — | 🔴 **GAP** — No spec exists |
| Full-text search (PostGIS/tsvector) | — | 🔴 **GAP** — No spec exists |
| OpenSky flight layer | `docs/architecture/tasks/task-M7-opensky-flight-layer.md` | ✅ Task doc exists |

### M8 — Draw Polygon + Spatial Analysis 🔴 MAJOR GAP

| DoD Item | Existing Doc(s) | Gap Status |
|---|---|---|
| Polygon draw tool | — | 🔴 **GAP** — No spec exists |
| Turf.js spatial analysis | `docs/specs/04-spatial-data-architecture.md` (mentions Turf.js) | ⚠️ Mentioned, not specified |
| Area/intersection calculations | — | 🔴 **GAP** — No spec exists |
| 4DGS temporal scrubbing | `docs/architecture/tasks/task-M8-4DGS-temporal-scrubbing.md` | ✅ Task doc exists |

### M9 — Favourites + Saved Searches 🔴 MAJOR GAP

| DoD Item | Existing Doc(s) | Gap Status |
|---|---|---|
| Favourites CRUD | — | 🔴 **GAP** — No spec exists |
| Saved search persistence | — | 🔴 **GAP** — No spec exists |
| RLS on favourites/saved_searches | `CLAUDE.md` §4 (tables listed), `docs/specs/05-rls-testing.md` | ⚠️ Tables referenced, no feature spec |

### M10 — Property Detail Panel 🔴 MAJOR GAP

| DoD Item | Existing Doc(s) | Gap Status |
|---|---|---|
| Property detail slide-out panel | — | 🔴 **GAP** — No spec exists |
| GV Roll + cadastral data display | `docs/specs/12-gv-roll-ingestion.md` (data side only) | ⚠️ Data ingestion covered, UI not specified |
| Street View integration | — | 🔴 **GAP** — No spec exists |
| POPIA field masking for guests | `CLAUDE.md` §6 (guest mode rules) | ⚠️ Rules stated, no spec |

### M11 — Analytics Dashboard 🔴 MAJOR GAP

| DoD Item | Existing Doc(s) | Gap Status |
|---|---|---|
| Recharts dashboard widgets | — | 🔴 **GAP** — No spec exists |
| Aggregate stats (median price, zoning distribution) | — | 🔴 **GAP** — No spec exists |
| Guest vs. authenticated views | `CLAUDE.md` §6 (guest rules only) | ⚠️ Rules stated, no spec |

### M12 — Multi-Tenant White-Labeling ⚠️ PARTIALLY COVERED

| DoD Item | Existing Doc(s) | Gap Status |
|---|---|---|
| Subdomain-based routing | `docs/architecture/ADR-005-tenant-subdomains.md` | ✅ ADR exists |
| Tenant branding (colors, logos) | `docs/specs/11-multitenant-architecture.md` | ⚠️ Architecture covered, no branding spec |
| `tenant_settings` config | `CLAUDE.md` §4 (table listed) | ⚠️ Table referenced, no spec |

### M13 — Share URLs 🔴 MAJOR GAP

| DoD Item | Existing Doc(s) | Gap Status |
|---|---|---|
| Shareable map state URLs | — | 🔴 **GAP** — No spec exists |
| Deep-link to viewport + layers | — | 🔴 **GAP** — No spec exists |

### M14 — QA (all acceptance criteria) 🔴 MAJOR GAP

| DoD Item | Existing Doc(s) | Gap Status |
|---|---|---|
| QA test plan | — | 🔴 **GAP** — No QA plan exists |
| E2E test suite (Playwright) | — | 🔴 **GAP** — No E2E spec exists |
| Performance budget validation | `docs/PERFORMANCE_BUDGET.md` | ✅ Budget exists |
| Accessibility audit | `docs/ux/accessibility-guidelines.md` | ✅ Guidelines exist |

### M15 — DPIA + Production Deploy 🔴 MAJOR GAP

| DoD Item | Existing Doc(s) | Gap Status |
|---|---|---|
| DPIA document | — | 🔴 **GAP** — No DPIA template or document exists |
| Production deployment runbook | — | 🔴 **GAP** — No runbook exists |
| Vercel production config | — | 🔴 **GAP** — No deployment spec exists |
| DNS / subdomain setup | `docs/architecture/ADR-005-tenant-subdomains.md` | ⚠️ ADR exists, no ops runbook |

---

## 2. Backlog Item → Documentation Coverage

| Backlog Item | RICE | Phase | Existing Doc | Gap Status |
|---|---|---|---|---|
| AI content labeling spec | 500 | P1 | `docs/architecture/ai-content-labeling.md` | ✅ Covered |
| Job-specific default views | 400 | P1 | `docs/user-guides/*.md` (11 guides) | ⚠️ User guides exist but no technical spec for view configuration |
| OSINT public mashups | 315 | P1 | `docs/architecture/osint-intelligence-layer.md`, `docs/architecture/data-fusion-ontology.md` | ⚠️ Architecture exists, no implementation spec |
| GeoFile batch analysis | 280 | P1 | `docs/architecture/file-import-pipeline.md`, `docs/research/gis-file-formats-research.md` | ⚠️ Pipeline documented, no batch analysis spec |
| Multi-source OSINT fusion | 216 | P1 | `docs/architecture/data-fusion-ontology.md` | ⚠️ Ontology exists, no implementation spec |
| MCP server config docs | 192 | P1 | `docs/infra/mcp-servers.md` | ✅ Done |
| Skills catalog docs | 192 | P1 | `docs/infra/skills-catalog.md` | ✅ Done |
| Docker environment docs | 180 | P1 | `docs/docker/DOCKER_README.md`, `docs/docker/environment-config.md` | ✅ Done |
| Hooks reference docs | 168 | P1 | `docs/infra/hooks-reference.md` | ✅ Done |
| OpenSky live layer | 168 | P1 | `docs/integrations/opensky-network.md`, `docs/architecture/tasks/task-M7-opensky-flight-layer.md` | ⚠️ Research + task doc, no spec |
| QGIS format support | 168 | P1 | `docs/integrations/qgis-formats.md`, `docs/research/arcgis-qgis-formats-research.md` | ⚠️ Research exists, no implementation spec |
| Google 3D Tiles docs | 180 | P1 | `docs/integrations/google-maps-tile-api.md`, `docs/integrations/cesium-platform.md` | ⚠️ Integration docs exist, no implementation spec |
| ArcGIS format support | 144 | P1 | `docs/integrations/arcgis-formats.md`, `docs/research/arcgis-qgis-formats-research.md` | ⚠️ Research exists, no implementation spec |
| Mobile field collection | 126 | P2 | `docs/specs/06-mobile-offline-architecture.md` | ⚠️ Offline arch covered, no field collection spec |
| Docker NeRF training docs | 120 | P2 | `docs/integrations/nerf-3dgs-integration.md` | ⚠️ Integration doc exists, no Docker training spec |
| NeRF/3DGS integration | 93 | P2 | `docs/integrations/nerf-3dgs-integration.md`, `docs/research/3dgs-nerf-*.md` | ✅ Well-researched |
| ControlNet 8-step pipeline | 86 | P2 | `docs/architecture/controlnet-workflow.md`, `docs/integrations/controlnet-cesium-export.md` | ✅ Covered |
| 4D WorldView dashboard | 60 | P2 | `docs/features/immersive-4d-reconstruction.md`, `docs/research/spatial-intelligence/worldview-patterns.md` | ⚠️ Research exists, no spec |
| GIS Copilot agent design | 54 | P3 | `docs/architecture/gis-copilot-agent-design.md` | ✅ Covered |
| Predictive hazard forecast | 34 | P3 | — | 🔴 **GAP** — No documentation exists |

---

## 3. Broken Cross-References

| Referenced File (MISSING) | Referenced By | Impact |
|---|---|---|
| `docs/TECHNICAL_ARCHITECTURE_SPEC.md` | `docs/OPEN_QUESTIONS.md`, `docs/PLAN_DEVIATIONS.md`, `docs/RESEARCH_BRIEF.md` | 🔴 High — 3 active docs reference a deleted file |
| `docs/GEOGRAPHIC_CONSTRAINTS.md` | `docs/OPEN_QUESTIONS.md`, `docs/specs/08-pmtiles-pipeline.md`, `docs/RESEARCH_BRIEF.md` | 🔴 High — 3 active docs reference a deleted file |
| `docs/RESEARCH_ANSWERS.md` | `docs/OPEN_QUESTIONS.md`, `docs/RESEARCH_BRIEF.md` | 🟡 Medium — answers file never created |
| `docs/AUTH_DESIGN.md` | `docs/agents/agent-audit.md` | 🟡 Medium — 1 doc references deleted file |
| `docs/QA_REPORT.md` | `docs/agents/agent-audit.md` | 🟡 Medium — 1 doc references missing file |
| `docs/DPIA.md` | `docs/RESEARCH_BRIEF.md` | 🔴 High — DPIA is an M15 deliverable, ref exists but file doesn't |
| `docs/INDEX.md` | `docs/planning/agent-definitions-v2.md`, `docs/context/GIS_MASTER_CONTEXT.md` | 🟡 Medium — doc index never created |
| `docs/research/spatialintelligence-ai-research.md` | (internal research refs) | 🟢 Low — likely renamed to `spatialintelligence-research.md` |
| `docs/swarm-memory.md` | (legacy refs) | 🟢 Low — removed during cleanup |
| `09_RESEARCH_AND_AUDIT_REPORT.md` | `docs/OPEN_QUESTIONS.md` | 🟡 Medium — old research report removed |
| `DATA_CATALOG.md` | `docs/OPEN_QUESTIONS.md` | 🟡 Medium — data catalog never created |

---

## 4. Gap Summary by Priority

### 🔴 Critical Gaps (blocks milestone execution)

| # | Gap | Milestone | Acceptance Criteria for Closing |
|---|---|---|---|
| G-01 | No Search & Filters spec | M7 | Create `docs/specs/15-search-filters.md` with: search UI wireframe, PostGIS full-text search design, filter panel fields, API endpoints, guest vs. auth behavior. ≥5 acceptance criteria. |
| G-02 | No Draw Polygon / Spatial Analysis spec | M8 | Create `docs/specs/16-draw-polygon-analysis.md` with: Turf.js operations, draw tool UX, result display, max polygon complexity, API contract. ≥5 acceptance criteria. |
| G-03 | No Favourites / Saved Searches spec | M9 | Create `docs/specs/17-favourites-saved-searches.md` with: CRUD operations, RLS policy, data model, sync behavior, UI components. ≥4 acceptance criteria. |
| G-04 | No Property Detail Panel spec | M10 | Create `docs/specs/18-property-detail-panel.md` with: panel layout, data fields, GV Roll linkage, Street View embed, POPIA masking for guests. ≥5 acceptance criteria. |
| G-05 | No Analytics Dashboard spec | M11 | Create `docs/specs/19-analytics-dashboard.md` with: Recharts widget list, data aggregation queries, guest vs. auth views, performance targets. ≥4 acceptance criteria. |
| G-06 | No Share URLs spec | M13 | Create `docs/specs/20-share-urls.md` with: URL schema, viewport+layer encoding, deep-link parsing, OG meta tags, guest access. ≥3 acceptance criteria. |
| G-07 | No QA Test Plan | M14 | Create `docs/specs/21-qa-test-plan.md` with: E2E test matrix (Playwright), unit test coverage targets, accessibility audit checklist, performance budget validation steps. ≥6 acceptance criteria. |
| G-08 | No DPIA document | M15 | Create `docs/DPIA.md` with: data inventory, risk assessment, POPIA Article 36 alignment, cross-border transfer assessment, DPO sign-off section. ≥4 acceptance criteria. |
| G-09 | No Production Deployment Runbook | M15 | Create `docs/specs/22-production-deployment.md` with: Vercel config, DNS setup, Martin droplet provisioning, secret rotation, monitoring, rollback procedure. ≥5 acceptance criteria. |
| G-10 | Broken cross-references (10 dead links) | M0 | Fix or remove all 10 broken `docs/` references listed in Section 3. Measurable: `grep -roh` scan returns 0 broken references. |

### 🟡 Important Gaps (should close before milestone)

| # | Gap | Milestone | Acceptance Criteria for Closing |
|---|---|---|---|
| G-11 | No seed data documentation | M1 | Document test tenant + role seed data in a migration spec or `docs/specs/` file. Measurable: seed migration file exists and is referenced from M1 DoD. |
| G-12 | No Guest Mode spec | M3/M10 | Create `docs/specs/23-guest-mode.md` formalizing CLAUDE.md §6 rules into a testable spec with acceptance criteria. |
| G-13 | No White-Label branding spec | M12 | Create `docs/specs/24-white-label-branding.md` with: `tenant_settings` schema, CSS variable injection, logo placement, theme preview. ≥3 acceptance criteria. |
| G-14 | `docs/RESEARCH_ANSWERS.md` never created | — | Create file or update `docs/OPEN_QUESTIONS.md` to remove reference. |
| G-15 | `docs/INDEX.md` never created | — | Create a docs index or remove references from `GIS_MASTER_CONTEXT.md` and `agent-definitions-v2.md`. |
| G-16 | No `DATA_CATALOG.md` | — | Create data catalog listing all external data sources (CoCT ArcGIS, GV Roll, OpenSky, CartoDB) with endpoints, auth requirements, refresh frequency. |

### 🟢 Low Priority (polish / future)

| # | Gap | Acceptance Criteria for Closing |
|---|---|---|
| G-17 | Predictive hazard forecast has no documentation at all | Create `docs/research/predictive-hazard-forecast.md` before P3 planning begins. |
| G-18 | Job-specific default views have user guides but no technical config spec | Create implementation spec mapping user roles to default layer/view configurations. |
| G-19 | `docs/research/spatialintelligence-ai-research.md` broken ref | Verify rename to `spatialintelligence-research.md` and fix reference. |
| G-20 | `docs/swarm-memory.md` lingering ref | Remove any remaining references to deleted swarm artifacts. |

---

## 5. Cross-Reference Validity Summary

| Check | Result |
|---|---|
| `PLAN.md` ↔ `ROADMAP.md` alignment | ✅ Consistent — both show M0–M4 detailed, M5–M15 summary |
| `PLAN.md` ↔ `CLAUDE.md` §4 table list | ✅ Consistent — tenant-scoped tables match |
| `ROADMAP.md` six-pillar ↔ `docs/` coverage | ✅ All 6 pillars have at least architecture + research docs |
| `feature-backlog.md` ↔ actual docs | ⚠️ 13 of 20 items lack implementation specs (have research/arch only) |
| `risk-complexity-matrix.md` ↔ mitigation docs | ⚠️ Mitigations described but not all have runbook/procedure docs |
| `docs/specs/README.md` spec list ↔ actual files | ✅ All 14 listed specs exist as files |
| ADRs ↔ implementation | ✅ ADR-001 through ADR-008 exist (ADR-007 skipped — intentional?) |
| Broken internal links | 🔴 10 dead references found (see Section 3) |
| `OPEN_QUESTIONS.md` ↔ resolution status | ⚠️ OQ-007 marked resolved; OQ-003/OQ-018 are duplicates |

---

## 6. Assumptions (Explicit)

- **[ASSUMPTION]** Milestones M5–M15 summaries in `PLAN.md` represent the canonical scope; detailed DoD items are inferred from milestone names + `CLAUDE.md` rules.
- **[ASSUMPTION]** Files in `docs/architecture/tasks/` (task-M5, task-M7, task-M8) are preliminary task briefs, not full implementation specs.
- **[ASSUMPTION]** The ADR-007 gap (ADR-006 → ADR-008 skip) is intentional and not a missing document.
- **[ASSUMPTION]** Research docs (`docs/research/`) are considered "background evidence" and do not substitute for implementation specs (`docs/specs/`).
- **[ASSUMPTION]** `docs/user-guides/*.md` (11 persona guides) are domain-level docs and do not replace technical feature specs.
- **[ASSUMPTION]** Duplicate open questions OQ-003 and OQ-018 should be consolidated.

---

## 7. Recommendations (Priority Order)

1. **Fix broken cross-references now (M0 blocker)** — 10 dead links erode trust in documentation. Estimated effort: 1 hour.
2. **Create M7–M11 specs before M5 begins** — These are the core user-facing features. Without specs, implementation will drift. Estimated effort: 3–5 hours per spec.
3. **Create DPIA template early** — OQ-008 and OQ-009 flag this as a legal blocker. Don't wait for M15. Estimated effort: 2 hours for template.
4. **Create QA test plan during M4** — Testing strategy should exist before features pile up. Estimated effort: 2 hours.
5. **Create `docs/INDEX.md`** — Two docs reference it. A simple table-of-contents will improve navigability. Estimated effort: 30 minutes.
6. **Consolidate duplicate open questions** — OQ-003 and OQ-018 ask the same thing. Estimated effort: 10 minutes.
7. **Create Production Deployment Runbook** — Even a skeleton runbook during M4 reduces M15 risk. Estimated effort: 1 hour.

---

*Generated by documentation audit pipeline. Review and validate with human stakeholders before acting on gap closures.*

# Swarm Research: Frappe Spatial Integrations (Repo-Scoped)

## Scope
Assess Frappe/ERPNext integration options for this GIS repository, with focus on GIS pipelines, map-driven workflows, and tenant/isolation constraints.

## Repository-Verified Baseline (Current State)

1. The current platform stack is Next.js + MapLibre + Supabase/PostGIS + Martin + PMTiles, not a Frappe stack (`README.md:7-11`, `docs/architecture/SYSTEM_DESIGN.md:3`, `CLAUDE.md:29-43`).
2. Tenant isolation is a hard requirement enforced by both RLS and app-layer controls (`CLAUDE.md:71-78`, `docs/specs/11-multitenant-architecture.md:13-15`, `supabase/migrations/20250227140000_initial_schema.sql:136-223`).
3. Spatial pipeline expectations include EPSG:4326 storage, EPSG:3857 rendering, three-tier fallback (LIVE→CACHED→MOCK), and viewport/tile patterns (`CLAUDE.md:53-56`, `CLAUDE.md:65-67`, `docs/specs/04-spatial-data-architecture.md:39-43`, `docs/specs/04-spatial-data-architecture.md:56-64`).
4. Existing ingestion docs center on ArcGIS/QGIS/file-import and Python ETL patterns, with strict tenant scoping and security checks (`docs/integrations/arcgis-formats.md:31-39`, `docs/architecture/file-import-pipeline.md:4`, `docs/architecture/file-import-pipeline.md:120-130`, `docs/ETL_PIPELINE.md:16-19`).
5. No repository documentation or dependency evidence currently indicates Frappe/ERPNext is installed or integrated (`package.json:16-40`, `README.md:5-12`, `docs/architecture/TECH_STACK.md:1-48`).

## Integration Options for Frappe (Applicability to This Repo)

### Option A — Metadata/Workflow System of Record (Decoupled)
**Description:** Use Frappe for non-rendering workflows (tickets, approvals, asset metadata, operational forms), while map rendering and spatial compute stay in the existing Next.js + Supabase/PostGIS + Martin path.

**Applicability:** High relative fit to current architecture because it minimizes disruption to established geospatial runtime (`docs/architecture/SYSTEM_DESIGN.md:42-69`, `docker-compose.yml:24-35`).

**Key constraints:**
- Must preserve current GIS runtime and rules (no breaking Rule 1/2/4) (`CLAUDE.md:61-67`, `CLAUDE.md:71-78`).
- Cross-system data handoff must remain tenant-scoped.

### Option B — Sidecar Admin Console for GIS Operations
**Description:** Add Frappe as an admin sidecar for import job management, review queues, and operator tooling; core APIs/data stay in Supabase/PostGIS.

**Applicability:** Medium-high; aligns with existing documented pipeline checkpoints and audit requirements (`docs/architecture/file-import-pipeline.md:38-50`, `docs/architecture/file-import-pipeline.md:132-139`, `supabase/migrations/20250227140000_initial_schema.sql:103-114`).

**Key constraints:**
- Tenant context must map exactly to existing `tenant_id` enforcement model.
- Any mirrored audit records must not bypass existing RLS boundaries.

### Option C — Frappe as Primary Backend for Spatial Runtime
**Description:** Replace major portions of Supabase/PostGIS access and service layer with Frappe-first APIs.

**Applicability:** Low for this repo baseline due to strong existing architectural commitments and non-negotiable stack constraints (`CLAUDE.md:26-43`, `README.md:7-11`, `docs/specs/04-spatial-data-architecture.md:56-64`).

**Key constraints:**
- Would require re-validating RLS-equivalent guarantees, tile-serving path, and fallback logic.
- High migration risk against documented milestones and current schema design (`docs/architecture/SYSTEM_DESIGN.md:177-199`, `supabase/migrations/20250227140000_initial_schema.sql:91-101`).

## GIS Pipeline and Map-Driven Workflow Implications

### Pipeline Compatibility (Verified against repo docs)
- Existing pipelines are designed around PostGIS tables, Martin vector tiles, and `api_cache` fallback semantics (`docs/specs/04-spatial-data-architecture.md:40-43`, `docs/specs/04-spatial-data-architecture.md:75-97`, `docs/architecture/SYSTEM_DESIGN.md:73-100`).
- Import flow is deterministic and gate-based (detect→validate→CRS→reproject→render), with tenant/security checks at each stage (`docs/architecture/file-import-pipeline.md:4`, `docs/architecture/file-import-pipeline.md:28-37`, `docs/architecture/file-import-pipeline.md:132-139`).

### Map Workflow Constraints
- Client rendering model assumes MapLibre (and optionally Cesium for related tracks), not ERP UI primitives (`docs/architecture/SYSTEM_DESIGN.md:25-38`, `README.md:7-10`).
- Data presentation requires source badges and hard fallback behavior for external layers (`CLAUDE.md:61-67`).

## Tenant/Isolation Concerns for Any Frappe Bridge

1. **Dual-layer isolation is mandatory**: DB-level and app-layer tenant checks are both required (`CLAUDE.md:71-78`).
2. **Current schema is explicitly tenant-keyed** across operational tables (`supabase/migrations/20250227140000_initial_schema.sql:41`, `supabase/migrations/20250227140000_initial_schema.sql:53`, `supabase/migrations/20250227140000_initial_schema.sql:64`, `supabase/migrations/20250227140000_initial_schema.sql:94`).
3. **RLS policy pattern is explicit and pervasive**, including cache and settings tables (`supabase/migrations/20250227140000_initial_schema.sql:206-222`).
4. **Subdomain-to-tenant routing is part of the trust model** (`docs/specs/11-multitenant-architecture.md:20-25`, `docs/specs/02-authentication-rbac.md:137-143`).

## Verified vs Unverified

| Item | Status | Evidence | Validation Step |
|---|---|---|---|
| Repo currently uses Next.js + Supabase/PostGIS + MapLibre + Martin | **Verified** | `README.md:7-11`, `docs/architecture/SYSTEM_DESIGN.md:3`, `package.json:16-28` | N/A |
| Tenant isolation depends on RLS + app-layer checks | **Verified** | `CLAUDE.md:71-78`, `supabase/migrations/20250227140000_initial_schema.sql:165-223` | N/A |
| Spatial pipeline requires LIVE→CACHED→MOCK behavior | **Verified** | `CLAUDE.md:65-67`, `docs/specs/04-spatial-data-architecture.md:39-43` | N/A |
| Frappe/ERPNext is already integrated in this repo | **Unverified / likely absent** | No explicit stack/dependency references in `README.md:5-12`, `package.json:16-40`, `docs/architecture/SYSTEM_DESIGN.md:1-69` | Run implementation-level check for running services, env vars, and integration adapters; add evidence doc if found |
| Frappe can natively satisfy current RLS model without custom bridge logic | **Unverified** | No repo design artifact defines this mapping | Draft and test a tenant-claim mapping design against `current_setting('app.current_tenant')` policy model |
| Frappe can support this repo’s map fallback/badge contracts as-is | **Unverified** | Contracts are documented for existing service layer only (`CLAUDE.md:61-67`) | Build proof-of-concept endpoint and verify badge + fallback contract tests |

## Validation Plan for Unverified Areas

1. **Integration Surface Audit**
   - Search for Frappe adapters, connectors, env vars, and service clients.
   - Record findings in `docs/research/swarm-frappe-spatial-integrations.md` appendices with exact file evidence.

2. **Tenant Boundary Proof Test**
   - Create a small bridge prototype that writes/reads tenant-scoped records through existing Supabase schema.
   - Verify cross-tenant denial with policy-aligned tests using current RLS model (`supabase/migrations/20250227140000_initial_schema.sql:176-222`).

3. **Map Contract Compatibility Test**
   - Validate that any Frappe-fed layer still emits required source badge and follows LIVE→CACHED→MOCK behavior (`CLAUDE.md:61-67`).

4. **Pipeline Fit Test**
   - Validate whether Frappe-managed metadata can drive existing import gates without bypassing validation/security stages (`docs/architecture/file-import-pipeline.md:28-50`, `docs/architecture/file-import-pipeline.md:132-139`).

## Architecture/Documentation Update Recommendations (by path)

1. **`docs/architecture/SYSTEM_DESIGN.md`**
   - Add a bounded “ERP/Workflow Integration” box in the architecture diagram clarifying sidecar vs core-runtime roles.

2. **`docs/specs/11-multitenant-architecture.md`**
   - Add a subsection for external system tenant-claim mapping requirements to prevent cross-tenant drift.

3. **`docs/specs/04-spatial-data-architecture.md`**
   - Add a note on how external workflow systems may enqueue import jobs without changing map-serving contracts.

4. **`docs/architecture/file-import-pipeline.md`**
   - Add explicit interface point for “external job orchestrator” and document tenant/security invariants for that handoff.

5. **`docs/research/README.md`**
   - Add index entry for this Frappe integration research note and verification status.

## Practical Limits of This Assessment

- This assessment is repo-evidence-first and cannot confirm real Frappe deployment state outside this repository.
- Frappe capability claims are intentionally constrained unless directly demonstrated by repo artifacts.
- Any architectural adoption decision remains contingent on validation steps above.

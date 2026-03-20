# Issues Creation Checklist — M1 Database Layer

> **Epic**: M1 — Database Schema, RLS & PostGIS Foundation
> **Feature**: Core Schema, RLS & Spatial Infrastructure
> **Project plan**: [`project-plan.md`](./project-plan.md)
> **Governed by**: `CLAUDE.md` Rules 1–10

Work through this checklist top-to-bottom. Each section must be complete before the next GitHub milestone is set.

---

## Phase 0 — Pre-Creation Preparation

- [ ] **M0 sign-off received** — Human has confirmed M0 DoD is complete
- [ ] **Feature artifacts reviewed** — `project-plan.md`, `specs/05-rls-testing.md`, `specs/11-multitenant-architecture.md` read
- [ ] **GitHub Project board created** — "CapeTown GIS Hub" project with columns: Backlog · Sprint Ready · In Progress · In Review · Testing · Done
- [ ] **Custom fields configured** on project board: Priority (P0–P3), Milestone (M0–M15), Component, Estimate, Sprint
- [ ] **Labels created** in repository:
  - [ ] `epic` `feature` `user-story` `enabler` `test-issue`
  - [ ] `priority-critical` `priority-high` `priority-medium` `priority-low`
  - [ ] `value-high` `value-medium` `value-low`
  - [ ] `database` `rls` `postgis` `spatial` `testing` `infrastructure`
- [ ] **GitHub Milestone created**: `M1 — Database Schema, RLS & PostGIS`
- [ ] **Team capacity assessed** for Sprint 1 (target ≈ 11 pts)

---

## Phase 1 — Epic Issue

- [ ] **Create Epic issue**:
  - Title: `Epic: M1 — Database Schema, RLS & PostGIS Foundation`
  - Body: Use Epic template from `project-plan.md` §3
  - Labels: `epic`, `priority-critical`, `value-high`, `database`, `rls`, `postgis`
  - Milestone: `M1 — Database Schema, RLS & PostGIS`
  - Estimate: XL (~47 pts)
  - Add to Project Board → Backlog column
  - **Record issue number**: `#____` ← fill in after creation

---

## Phase 2 — Feature Issues (create all 3, then link to Epic)

- [ ] **Create Feature 1 issue**:
  - Title: `Feature: Core Schema & Multi-Tenant RLS`
  - Labels: `feature`, `priority-critical`, `value-high`, `database`, `rls`
  - Milestone: `M1`
  - Add Epic reference: `Epic: #____`
  - Estimate: L (12 pts)
  - **Record issue number**: `#____`

- [ ] **Create Feature 2 issue**:
  - Title: `Feature: Spatial Infrastructure`
  - Labels: `feature`, `priority-high`, `value-high`, `database`, `postgis`, `spatial`
  - Milestone: `M1`
  - Add Epic reference + blocks/blocked-by relationships
  - Estimate: S (8 pts)
  - **Record issue number**: `#____`

- [ ] **Create Feature 3 issue**:
  - Title: `Feature: Seed Data & RLS Test Harness`
  - Labels: `feature`, `priority-critical`, `value-high`, `database`, `testing`, `rls`
  - Milestone: `M1`
  - Add Epic reference
  - Estimate: M (15 pts)
  - **Record issue number**: `#____`

- [ ] **Update Epic issue** body to reference Feature issue numbers

---

## Phase 3 — Technical Enabler Issues (P0 first)

### P0 Enablers (Sprint 1)

- [ ] **E1 — Migration Framework Setup**
  - Title: `Enabler: Migration Framework Setup (M1)`
  - Body:
    ```
    ## Technical Requirements
    - [ ] Convention: YYYYMMDDHHMMSS_description.sql in supabase/migrations/
    - [ ] README section: "Database: running migrations locally"
    - [ ] `supabase db reset` documented and tested
    - [ ] `.gitignore` excludes `.supabase/` local state

    ## Acceptance Criteria
    - [ ] `supabase db reset` runs without error on a clean local Docker
    - [ ] Migration naming convention documented in AGENTS.md or CLAUDE.md
    ```
  - Labels: `enabler`, `priority-critical`, `value-high`, `database`, `infrastructure`
  - Feature: `#F1`
  - Estimate: 2 pts · Sprint: 1
  - **Record issue number**: `#____`

- [ ] **E2 — RLS Policy Template & Helpers**
  - Title: `Enabler: RLS Policy Template & Helper Functions (M1)`
  - Body:
    ```
    ## Technical Requirements
    - [ ] SQL helper: fn_apply_tenant_rls(table_name text) applies ENABLE + FORCE + canonical policy
    - [ ] Canonical policy: USING (tenant_id = current_setting('app.current_tenant', TRUE)::uuid)
    - [ ] PLATFORM_ADMIN bypass policy for all tables
    - [ ] Helper tested via pgTAP

    ## Acceptance Criteria
    - [ ] fn_apply_tenant_rls() works on any tenant-scoped table
    - [ ] PLATFORM_ADMIN can read across tenants; all others cannot
    - [ ] Two-arg current_setting() prevents NULL-error on transactions without claim set
    ```
  - Labels: `enabler`, `priority-critical`, `value-high`, `database`, `rls`
  - Feature: `#F1`
  - Estimate: 3 pts · Sprint: 1
  - **Record issue number**: `#____`

- [ ] **E3 — api_cache Table**
  - Title: `Enabler: api_cache Table for Three-Tier Fallback (M1)`
  - Body:
    ```
    ## Technical Requirements
    - [ ] Columns: id UUID PK, tenant_id UUID FK, key TEXT NOT NULL, value JSONB, expires_at TIMESTAMPTZ, created_at TIMESTAMPTZ
    - [ ] RLS: tenant-isolated via fn_apply_tenant_rls()
    - [ ] Index on (tenant_id, key) for fast cache lookups
    - [ ] Index on expires_at for TTL cleanup queries

    ## Acceptance Criteria
    - [ ] LIVE → CACHED → MOCK pattern can INSERT + SELECT from api_cache (Rule 2)
    - [ ] Expired rows queryable: WHERE expires_at < NOW()
    - [ ] Tenant A cannot read Tenant B's cache entries
    ```
  - Labels: `enabler`, `priority-critical`, `value-high`, `database`, `infrastructure`
  - Feature: `#F1`
  - Blocks: M4a three-tier fallback implementation
  - Estimate: 2 pts · Sprint: 1
  - **Record issue number**: `#____`

- [ ] **E4 — PostGIS Extension Verification**
  - Title: `Enabler: PostGIS Extension Verification Migration (M1)`
  - Body:
    ```
    ## Technical Requirements
    - [ ] First migration asserts CREATE EXTENSION IF NOT EXISTS postgis
    - [ ] SELECT PostGIS_Version() must return >= '3.0'
    - [ ] Migration fails fast with meaningful error if PostGIS < 3.0

    ## Acceptance Criteria
    - [ ] `supabase db reset` outputs PostGIS version in migration log
    - [ ] No subsequent migration runs if PostGIS not available
    ```
  - Labels: `enabler`, `priority-critical`, `value-high`, `database`, `postgis`
  - Feature: `#F2`
  - Estimate: 1 pt · Sprint: 1
  - **Record issue number**: `#____`

### P1 Enablers (Sprint 2–3)

- [ ] **E5 — GiST Index Migration Pattern**
  - Title: `Enabler: GiST Spatial Index Migration Pattern (M1)`
  - Labels: `enabler`, `priority-high`, `value-medium`, `database`, `postgis`, `spatial`
  - Feature: `#F2` · Estimate: 2 pts · Sprint: 2

- [ ] **E6 — Vitest + pgTAP Test Harness**
  - Title: `Enabler: Vitest + pgTAP RLS Test Harness (M1)`
  - Labels: `enabler`, `priority-critical`, `value-high`, `database`, `testing`, `rls`
  - Feature: `#F3` · Estimate: 5 pts · Sprint: 3
  - Note: Refer to `specs/05-rls-testing.md` for pgTAP patterns

- [ ] **E7 — CI Migration Gate**
  - Title: `Enabler: CI Migration Gate in GitHub Actions (M1)`
  - Labels: `enabler`, `priority-high`, `value-high`, `infrastructure`, `testing`
  - Feature: `#F3` · Estimate: 3 pts · Sprint: 3

- [ ] **Update Feature issues** to reference Enabler issue numbers

---

## Phase 4 — User Story Issues

- [ ] **S1 — Tenant-Scoped Core Tables**
  - Title: `Story: Tenant-Scoped Core Tables (profiles, valuation_data, tenant_settings, layer_permissions, properties)`
  - Body:
    ```
    ## Story
    As a TENANT_ADMIN, I want the five core entity tables with RLS so that all platform
    data is isolated per tenant and POPIA-compliant.

    ## Acceptance Criteria
    - [ ] profiles: id, tenant_id, user_id FK (auth.users), role, display_name, email, created_at
    - [ ] valuation_data: id, tenant_id, parcel_id, roll_year, value_amount, source
    - [ ] tenant_settings: id, tenant_id, key TEXT, value JSONB (white-label config)
    - [ ] layer_permissions: id, tenant_id, layer_name, min_role
    - [ ] properties: id, tenant_id, parcel_id, address, geom geometry(Point,4326)
    - [ ] All tables: ENABLE + FORCE RLS; canonical policy applied
    - [ ] POPIA annotation in migration file (profiles + valuation_data touch PII)

    ## POPIA ANNOTATION REQUIRED on migration file
    Personal data: email, display_name (profiles); value_amount (valuation_data)
    Lawful basis: Contract / Legitimate interests
    ```
  - Labels: `user-story`, `priority-critical`, `value-high`, `database`, `rls`
  - Feature: `#F1` · Blocked by: `#E1`, `#E2` · Estimate: 3 pts · Sprint: 1

- [ ] **S2 — Saved Searches & Favourites Tables**
  - Title: `Story: Saved Searches & Favourites Tables with RLS (M1)`
  - Labels: `user-story`, `priority-high`, `value-medium`, `database`, `rls`
  - Feature: `#F1` · Estimate: 2 pts · Sprint: 2
  - Note: Requires POPIA annotation (search terms = potential PII per spec 10)

- [ ] **S3 — Audit Log Table**
  - Title: `Story: Immutable Audit Log Table for POPIA Traceability (M1)`
  - Labels: `user-story`, `priority-high`, `value-medium`, `database`, `rls`
  - Feature: `#F1` · Estimate: 2 pts · Sprint: 2

- [ ] **S4 — Geometry Columns & Spatial Indexes**
  - Title: `Story: PostGIS Geometry Columns & GiST Indexes on properties Table (M1)`
  - Body:
    ```
    ## Story
    As a spatial analyst, I want the properties table to have a PostGIS geometry column
    with a GiST index so that ST_Within and ST_DWithin queries return in < 200 ms.

    ## Acceptance Criteria
    - [ ] properties.geom: geometry(Point,4326) — SRID 4326 enforced
    - [ ] CREATE INDEX properties_geom_idx USING GIST (geom)
    - [ ] Cape Town bbox: ST_Within(geom, ST_MakeEnvelope(18.0,-34.5,19.5,-33.0,4326))
    - [ ] \d properties shows index in use on EXPLAIN ANALYZE query
    ```
  - Labels: `user-story`, `priority-critical`, `value-high`, `database`, `postgis`, `spatial`
  - Feature: `#F2` · Blocked by: `#S1`, `#E4`, `#E5` · Estimate: 3 pts · Sprint: 2

- [ ] **S5 — Cape Town BBox Constraint Functions**
  - Title: `Story: Cape Town Bounding Box Validation Function (M1)`
  - Labels: `user-story`, `priority-high`, `value-medium`, `database`, `postgis`, `spatial`
  - Feature: `#F2` · Estimate: 2 pts · Sprint: 2

- [ ] **S6 — Seed Migration: 1 Tenant + 6 Test Users**
  - Title: `Story: Seed Migration — capegis-test Tenant + GUEST→PLATFORM_ADMIN Users (M1)`
  - Body:
    ```
    ## Story
    As a developer, I want reproducible seed data so that I can test locally
    without manual setup and CI can validate RLS isolation.

    ## Acceptance Criteria
    - [ ] Tenant: capegis-test (slug: capegis-test, id: fixed UUID for repeatability)
    - [ ] 6 users created: guest@test.com, viewer@test.com, analyst@test.com,
            power@test.com, admin@test.com, platform@test.com
    - [ ] Each user has correct role in profiles table
    - [ ] supabase db reset is idempotent (can run multiple times)
    - [ ] Passwords stored via Supabase Auth (not plaintext in migrations)
    ```
  - Labels: `user-story`, `priority-critical`, `value-high`, `database`, `testing`
  - Feature: `#F3` · Blocked by: `#S1`, `#S4` · Estimate: 3 pts · Sprint: 2

- [ ] **Update Feature issues** to reference all Story issue numbers

---

## Phase 5 — Test Issues

- [ ] **T1 — Cross-Tenant RLS Isolation Tests**
  - Title: `Test: Cross-Tenant RLS Isolation — Tenant A reads 0 rows from Tenant B (M1)`
  - Body:
    ```
    ## Test Scope
    For each of the 9 tenant-scoped tables, verify that a user authenticated as
    Tenant A receives 0 rows when querying Tenant B's data.

    ## Test Cases
    - [ ] pgTAP: SET LOCAL app.current_tenant = 'tenant-a-uuid'; SELECT count(*) FROM profiles WHERE tenant_id = 'tenant-b-uuid' → 0
    - [ ] pgTAP: Same test for all 9 tables
    - [ ] pgTAP: Privilege escalation — VIEWER cannot INSERT with tenant_id = 'tenant-b-uuid'
    - [ ] Vitest: Auth as viewer@test.com → supabase.from('properties').select() returns only tenant A rows
    - [ ] Vitest: Unauthenticated request returns 0 rows (not 401) — silent failure pattern
    ```
  - Labels: `test-issue`, `priority-critical`, `value-high`, `rls`, `testing`
  - Feature: `#F3` · Blocked by: `#E6`, `#S6` · Estimate: 3 pts · Sprint: 3

- [ ] **T2 — RBAC Role Access Matrix Tests**
  - Title: `Test: RBAC Role Access Matrix — All 6 Roles Validated (M1)`
  - Body:
    ```
    ## Test Matrix (rows = roles, cols = operations)

    | Role | SELECT own tenant | INSERT | UPDATE | DELETE | Cross-tenant SELECT |
    |------|-------------------|--------|--------|--------|---------------------|
    | GUEST | ✅ | ❌ | ❌ | ❌ | ❌ |
    | VIEWER | ✅ | ❌ | ❌ | ❌ | ❌ |
    | ANALYST | ✅ | ✅ | ✅ | ❌ | ❌ |
    | POWER_USER | ✅ | ✅ | ✅ | ✅ | ❌ |
    | TENANT_ADMIN | ✅ | ✅ | ✅ | ✅ | ❌ |
    | PLATFORM_ADMIN | ✅ | ✅ | ✅ | ✅ | ✅ |

    ## Acceptance Criteria
    - [ ] Each cell in the matrix has a corresponding pgTAP test
    - [ ] All tests pass on `supabase db reset` + `npm test`
    ```
  - Labels: `test-issue`, `priority-high`, `value-high`, `rls`, `testing`
  - Feature: `#F3` · Blocked by: `#E6`, `#S6` · Estimate: 3 pts · Sprint: 3

- [ ] **T3 — Migration Smoke Test**
  - Title: `Test: Migration Smoke Test — supabase db reset clean run (M1)`
  - Body:
    ```
    ## Acceptance Criteria
    - [ ] supabase db reset completes in < 60 s on local Docker
    - [ ] No SQL errors in migration output
    - [ ] All 9 tables present in public schema after reset
    - [ ] PostGIS version logged
    - [ ] Seed data present: capegis-test tenant + 6 users
    ```
  - Labels: `test-issue`, `priority-medium`, `value-medium`, `database`, `testing`
  - Feature: `#F3` · Estimate: 1 pt · Sprint: 3

- [ ] **Update Feature 3 issue** to reference all Test issue numbers

---

## Phase 6 — Project Board Population

- [ ] **Add all Epic/Feature issues** to Project Board → Backlog column
- [ ] **Move Sprint 1 issues** to Sprint Ready: `#E1`, `#E2`, `#E3`, `#E4`, `#S1`
- [ ] **Set Priority field** on all issues (P0 / P1)
- [ ] **Set Milestone field** on all issues (`M1`)
- [ ] **Set Sprint field**: Sprint 1 = Foundation, Sprint 2 = Spatial + Seed, Sprint 3 = Testing + CI
- [ ] **Set Component field**: Database for E1–E5 + S1–S6; Testing for E6, E7, T1–T3

---

## Phase 7 — Dependency Linking

- [ ] **E1 → S1** (S1 blocked by E1) — link in GitHub Issues
- [ ] **E2 → S1, S2, S3** — link in GitHub Issues
- [ ] **E4 → S4** — link in GitHub Issues
- [ ] **S1 → S4, S6** — link in GitHub Issues
- [ ] **E6 → T1, T2** — link in GitHub Issues
- [ ] **S6 → T1, T2** — link in GitHub Issues
- [ ] **T1, T2, T3 → E7** — link in GitHub Issues

---

## Phase 8 — CI/CD Integration

- [ ] **Add `db-test` job** to `.github/workflows/ci.yml` (see `project-plan.md` §9)
- [ ] **Set branch protection rule**: require `db-test` to pass before merge to `main`
- [ ] **Test automation**: verify first CI run succeeds on a clean branch

---

## Phase 9 — M1 Sign-off Gate

- [ ] All 16 issues created and linked
- [ ] Sprint 3 (Testing + CI) complete
- [ ] `supabase db reset` clean run on developer machine (not just CI)
- [ ] RLS isolation confirmed manually via `psql` cross-tenant query
- [ ] POPIA annotations present on all migrations touching personal data
- [ ] Human reviewer sign-off: **Name**: _____________  **Date**: _____________
- [ ] `PLAN.md` M1 DoD checkboxes all ticked
- [ ] Branch merged to `main`

---

## Issue Number Tracking

| ID | Title | Issue # |
|----|-------|---------|
| Epic | M1 Database Layer | # |
| F1 | Core Schema & Multi-Tenant RLS | # |
| F2 | Spatial Infrastructure | # |
| F3 | Seed Data & RLS Test Harness | # |
| E1 | Migration Framework Setup | # |
| E2 | RLS Policy Template & Helpers | # |
| E3 | api_cache Table | # |
| E4 | PostGIS Extension Verification | # |
| E5 | GiST Index Migration Pattern | # |
| E6 | Vitest + pgTAP Test Harness | # |
| E7 | CI Migration Gate | # |
| S1 | Tenant-Scoped Core Tables | # |
| S2 | Saved Searches & Favourites | # |
| S3 | Audit Log Table | # |
| S4 | Geometry Columns & Spatial Indexes | # |
| S5 | Cape Town BBox Constraint Functions | # |
| S6 | Seed Migration — 1 Tenant + 6 Users | # |
| T1 | Cross-Tenant RLS Isolation Tests | # |
| T2 | RBAC Role Access Matrix Tests | # |
| T3 | Migration Smoke Test | # |

---

*Issues checklist generated: 2026-03-05 · Epic: M1 Database Layer · 20 total issues*

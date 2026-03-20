---
name: milestone-gate
description: Definition of Done (DoD) verification checklist and sequencing rules for CapeTown GIS Hub milestones M0–M15. Ensures no milestone is skipped, DoD criteria are verified before proceeding, and human sign-off is obtained at each phase boundary. Use this skill whenever the user asks about milestone completion, DoD verification, what's required before moving to the next milestone, phase transitions, milestone sequencing, current milestone status, whether M-something is done, or readiness for the next phase. Also invoke when any task might skip a milestone or violate sequential ordering.
---

# Milestone Gate — DoD Verification

## Purpose

CapeTown GIS Hub follows a strict sequential milestone plan (CLAUDE.md Rule 10): **M0 → M1 → M2 → ... → M15**. No milestone may be skipped. Human sign-off is required before proceeding to the next milestone.

**Source of truth:** `PLAN.md` (check it first for current status)  
**Escalation:** Deviations go in `docs/PLAN_DEVIATIONS.md` (DEV-NNN format)

---

## Milestone Overview

| Milestone | Goal | Depends on | Status |
|-----------|------|------------|--------|
| **M0** | Foundation & Governance | — | In Progress |
| **M1** | Database Schema + RLS | M0 | Not Started |
| **M2** | Auth + RBAC + POPIA Consent | M1 | Not Started |
| **M3** | MapLibre Base Map | M2 | Not Started |
| **M4a** | Three-Tier Fallback | M3 | Not Started |
| **M4b** | Martin MVT Integration | M1 | Not Started |
| **M4c** | Serwist PWA / Offline | M4a | Not Started |
| **M4d** | RLS Test Harness | M1 | Not Started |
| **M5** | Zoning Overlay | M4a, M4b | Not Started |
| **M6** | GV Roll 2022 Import | M1, M4b | Not Started |
| **M7** | Search + Filters | M5, M6 | Not Started |
| **M8** | Draw Polygon + Analysis | M7 | Not Started |
| **M9** | Favourites + Saved Searches | M2, M7 | Not Started |
| **M10** | Property Detail Panel | M6, M9 | Not Started |
| **M11** | Analytics Dashboard | M10 | Not Started |
| **M12** | Multi-Tenant White-Label | M11 | Not Started |
| **M13** | Share URLs | M12 | Not Started |
| **M14** | QA | M13 | Not Started |
| **M15** | DPIA + Production Deploy | M14 | Not Started |

> Always check `PLAN.md` for the authoritative current status — this table may be out of date.

---

## How to Verify a Milestone is Complete

### Step 1 — Check PLAN.md

```bash
# Read the current milestone status
cat PLAN.md | grep -A 20 "## M[0-9]"
```

All DoD checkboxes in `PLAN.md` must be `[x]` (checked). A single unchecked item means the milestone is NOT complete.

### Step 2 — Run Validation Commands

```bash
npm run lint        # Zero linting errors
npm run typecheck   # Zero TypeScript errors
npm test            # All tests pass (especially RLS isolation tests)
npm run build       # Build succeeds
```

For milestones with specific tests:
```bash
# M1/M4d — RLS isolation tests
npx vitest run path/to/rls.test.ts

# M3 — Map rendering
npx playwright test map.spec.ts

# M14 — Full E2E
npm run test:e2e
```

### Step 3 — Verify Rule Compliance

Before any milestone sign-off, confirm all CLAUDE.md non-negotiable rules:

| Rule | Check |
|------|-------|
| Rule 1 — Data badge | Every data display shows `[SOURCE · YEAR · TIER]` |
| Rule 2 — Three-tier fallback | `fetchWithFallback()` used for all external data |
| Rule 3 — No API keys in source | `grep -r "sk_\|api_key\|password" src/` returns nothing |
| Rule 4 — RLS dual layer | Both RLS policy AND app-layer `tenant_id` check present |
| Rule 5 — POPIA annotation | All PII-handling files have POPIA comment block |
| Rule 6 — Attribution | Map shows `© CARTO \| © OpenStreetMap contributors` |
| Rule 7 — File size ≤ 300 lines | `wc -l src/**/*.ts \| sort -n \| tail` |
| Rule 8 — No Lightstone | `grep -r "lightstone\|Lightstone" src/` returns nothing |
| Rule 9 — Geographic scope | All coordinates within `{ west: 18.0, south: -34.5, east: 19.5, north: -33.0 }` |

### Step 4 — Human Sign-Off

Confirm the following before proceeding:

- [ ] Human has reviewed and approved the milestone deliverables
- [ ] All DoD checkboxes in `PLAN.md` are checked `[x]`
- [ ] CI pipeline is green
- [ ] Any deviations from `CLAUDE.md` are documented in `docs/PLAN_DEVIATIONS.md`
- [ ] `CLAUDE.md` CURRENT_PHASE line is updated

---

## Milestone-Specific DoD Checklist

### M0 — Foundation & Governance
- [ ] `docker compose up -d` starts PostGIS + Martin successfully
- [ ] `npm install` completes without errors
- [ ] `CLAUDE.md`, `AGENTS.md`, `PLAN.md` finalized
- [ ] `.github/workflows/ci.yml` runs green
- [ ] Human sign-off

### M1 — Database Schema + RLS
- [ ] All tables from CLAUDE.md §4 created with `tenant_id`
- [ ] `ENABLE ROW LEVEL SECURITY` + `FORCE ROW LEVEL SECURITY` on all tables
- [ ] RLS policies use `current_setting('app.current_tenant', TRUE)::uuid` pattern
- [ ] GiST spatial indexes on all geometry columns
- [ ] `api_cache` table with `expires_at` column + RLS
- [ ] Seed migration: one test tenant + test users per role
- [ ] `supabase db reset` runs cleanly

### M2 — Auth + RBAC + POPIA
- [ ] Supabase Auth: email/password + Google OAuth
- [ ] JWT in `httpOnly` cookie via `@supabase/ssr` (never `localStorage`)
- [ ] Six RBAC roles resolve permissions correctly
- [ ] POPIA consent checkbox on registration (NOT pre-checked)
- [ ] Protected routes redirect unauthenticated users
- [ ] `audit_log` entries written for login/logout/role change

### M3 — MapLibre Base Map
- [ ] MapLibre initialised once per page (ref guard)
- [ ] `map.remove()` called in cleanup
- [ ] CartoDB Dark Matter basemap with attribution
- [ ] Centred on Cape Town CBD (`lng: 18.4241, lat: -33.9249`), zoom 11
- [ ] Bounding box enforced (Western Cape only)

### M4a — Three-Tier Fallback
- [ ] `fetchWithFallback<T>()` utility implemented
- [ ] `api_cache` table used for tier 2
- [ ] Mock GeoJSON files in `public/mock/` for all external sources
- [ ] Source badge component renders on all data displays
- [ ] No component shows blank map or error-only on API failure

### M4b — Martin MVT Integration
- [ ] Martin auto-discovers PostGIS tables
- [ ] MVT endpoints responding < 50ms (indexed tables)
- [ ] Cadastral layer only visible at zoom ≥ 14
- [ ] Sanitised views exclude PII columns
- [ ] Three-tier: Martin MVT → PMTiles → static GeoJSON

### M4c — Serwist PWA / Offline
- [ ] Service worker registered
- [ ] PMTiles cached in IndexedDB via Dexie
- [ ] Background sync queue for offline actions
- [ ] App renders usable map when fully offline

### M4d — RLS Test Harness
- [ ] Vitest tests verify isolation between tenants (0 cross-tenant rows)
- [ ] Tests run in CI
- [ ] All six RBAC roles tested for correct permissions

### M6 — GV Roll 2022 Import
- [ ] PII columns stripped (owner names never reach DB)
- [ ] ERF join success > 95%
- [ ] Attribution string on all valuation displays
- [ ] Materialised views refreshed
- [ ] Data source badge: `[CoCT GV Roll · 2022 · LIVE]`
- [ ] No Lightstone data (Rule 8)

### M15 — DPIA + Production Deploy
- [ ] Formal DPIA executed (OQ-009)
- [ ] Supabase DPA signed (OQ-008)
- [ ] Compromised API keys rotated + purged from git history (OQ-014)
- [ ] All OPEN_QUESTIONS.md critical items resolved
- [ ] Sentry error tracking live
- [ ] Production environment variables set

---

## Escalation Protocol

If a change conflicts with sequential milestone ordering or CLAUDE.md rules:

1. **STOP** — do not proceed
2. Document in `docs/PLAN_DEVIATIONS.md` using DEV-NNN format
3. Escalate to human if the deviation affects: geographic scope, POPIA, tech stack, RBAC, or deployment
4. Resume only after human approval

```markdown
<!-- docs/PLAN_DEVIATIONS.md format -->
## DEV-NNN — [Short description]
**Date:** YYYY-MM-DD
**Milestone:** MX
**Rule violated:** CLAUDE.md Rule Y / sequential ordering
**Reason:** [Why the deviation occurred]
**Impact:** [What was affected]
**Approval:** [Human name, date]
**Resolution:** [How resolved]
```

---

## Session Close Checklist (CLAUDE.md §10)

At the end of every coding session:

- [ ] Update `CURRENT_PHASE` line in `CLAUDE.md` §1
- [ ] Commit with descriptive message + co-author trailer
- [ ] Record open questions in `docs/OPEN_QUESTIONS.md`
- [ ] Record deviations in `docs/PLAN_DEVIATIONS.md`

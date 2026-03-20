# CLAUDE.md — CapeTown GIS Hub

## Read this file before touching any file in this project.

### Applies to: Claude Code · Gemini CLI · GitHub Copilot · Any AI agent.

> Conflicts with this file → STOP → document in `docs/PLAN_DEVIATIONS.md` → escalate to human.

---

## 1. PROJECT IDENTITY

| Field       | Value                                                  |
| ----------- | ------------------------------------------------------ |
| **Project** | CapeTown GIS Hub (`capegis`)                           |
| **Type**    | PWA — Multi-Tenant, White-Label                        |
| **Scope**   | City of Cape Town + Western Cape Province ONLY         |
| **Visual**  | Dark dashboard, near-black backgrounds, crayon accents |

> **CURRENT_PHASE:** M17_PREP | Last milestone: M16 (Tenant Admin) complete ✅ | Updated: 2026-03-17 | Agent: Junie
>
> _M17 (Advanced Geospatial Analysis) in progress. Core MCP server specifications and GIS skills defined. Critical blocker WU-1 (source consolidation) identified and planned._

---

## 2. TECHNOLOGY STACK

Do not introduce unlisted libraries without human approval. Document additions in `docs/PLAN_DEVIATIONS.md`.

### Frontend

- **Framework:** Next.js 15 (App Router), React Server Components
- **Mapping:** MapLibre GL JS — NOT Leaflet, NOT Mapbox GL JS
- **State:** Zustand
- **Styling:** Tailwind CSS (dark mode default)
- **Charts:** Recharts
- **PWA:** Serwist
- **Offline storage:** Dexie.js (IndexedDB)
- **Offline tiles:** PMTiles (vector tiles from object storage)
- **Spatial:** Turf.js (client-side)

### Backend & Data

- **Database:** Supabase (PostgreSQL 15 + PostGIS 3.x)
- **Analytics:** DuckDB-Spatial v1.5.0 (GeoParquet / FlatGeobuf)
- **Auth:** Supabase Auth (GoTrue) — email/password + Google OAuth
- **Tile server:** Martin (Rust MVT, Docker on DigitalOcean Droplet)
- **Object storage:** Supabase Storage

### Infrastructure

- **Hosting:** Vercel (frontend + API routes)
- **Tile server:** DigitalOcean Droplet (Martin in Docker)
- **Local dev:** Docker Compose (PostGIS + Martin)
- **CI/CD:** GitHub Actions
- **Errors:** Sentry (optional, gracefully absent)

### Spatial Reference System

- Storage: **EPSG:4326** (WGS 84)
- Rendering: **EPSG:3857** (Web Mercator) via MapLibre
- Never mix CRS without explicit reprojection

---

## 3. NON-NEGOTIABLE RULES

### Rule 1 — Data Source Badge

Every data display must show: `[SOURCE_NAME · YEAR · [LIVE|CACHED|MOCK]]`
Badge must be visible without hovering.

### Rule 2 — Three-Tier Fallback

Every external data component: **LIVE** → **CACHED** (Supabase `api_cache`) → **MOCK** (`public/mock/*.geojson`). Never show blank map or error instead of MOCK.

### Rule 3 — No API Keys in Source Code

Credentials in `.env` only. Never hardcode, log, or expose unless `NEXT_PUBLIC_` prefixed and safe.

### Rule 4 — RLS + Application Layer Isolation

RLS on every table + application layer verifies `tenant_id` from session. Both are required.

```sql
ALTER TABLE [table] ENABLE ROW LEVEL SECURITY;
ALTER TABLE [table] FORCE ROW LEVEL SECURITY;
CREATE POLICY "[table]_tenant_isolation" ON [table]
  USING (tenant_id = current_setting('app.current_tenant', TRUE)::uuid);
```

### Rule 5 — POPIA Annotation

Files touching personal data must include:

```typescript
/**
 * POPIA ANNOTATION
 * Personal data handled: [list]
 * Purpose: [specific purpose]
 * Lawful basis: [consent | contract | legal obligation | legitimate interests]
 * Retention: [period]
 * Subject rights: [access ✓ | correction ✓ | deletion ✓ | objection ✓]
 */
```

### Rule 6 — CartoDB Attribution

Map must display: `© CARTO | © OpenStreetMap contributors`

### Rule 7 — File Size Limit

Source files ≤ 300 lines. Planning docs and migrations exempt.

### Rule 8 — No Lightstone Data

GV Roll 2022 is the approved valuation source. No Lightstone.

### Rule 9 — Geographic Scope

Bounding box: `{ west: 18.0, south: -34.5, east: 19.5, north: -33.0 }`
Initial centre: `{ lng: 18.4241, lat: -33.9249 }` | Zoom: 11

### Rule 10 — Milestone Sequencing

Sequential M0–M15. No skipping. Human confirms each DoD before proceeding.

---

## 4. MULTI-TENANCY & RBAC

Tenant-scoped tables: `profiles` · `saved_searches` · `favourites` · `valuation_data` · `api_cache` · `audit_log` · `tenant_settings` · `layer_permissions`

Canonical RLS pattern:

```sql
CREATE POLICY "[table]_tenant_isolation" ON [table]
  USING (tenant_id = current_setting('app.current_tenant', TRUE)::uuid);
```

Role hierarchy: `GUEST → VIEWER → ANALYST → POWER_USER → TENANT_ADMIN → PLATFORM_ADMIN`

JWT lifetime: 1h. Refresh: 7d. White-label tokens in `tenant_settings`.

---

## 5. MAP RULES

- Initialise MapLibre once per page (ref guard). Import CSS in `app/layout.tsx`. Call `map.remove()` in cleanup.
- Max 10,000 GeoJSON features per client layer → switch to Martin MVT above.
- Cadastral parcels: zoom ≥ 14 only. Viewport buffer: 20%.
- Layer Z-Order: User draw (top) → Risk overlays → Zoning → Cadastral → Suburbs → Basemap (bottom).
- `minzoom`/`maxzoom` on every layer. `?optimize=true` on source URLs.

---

## 6. GIS INTEGRATION CONTRACTS

<!-- updated: March 2026 — Phase 4 Documentation Updates -->

- **CRS at rest:** EPSG:4326 (WGS 84) always.
- **CRS for rendering:** EPSG:3857 (Web Mercator) managed by MapLibre GL JS.
- **API responses:** Standard GeoJSON in EPSG:4326.
- **Zoom minimums:**
  - Cadastral parcels: z14+
  - Suburb boundaries: z10+
  - Risk overlays: z12+
  - Points of Interest (POI): All zooms.
- **PMTiles offline strategy:** z10–16 archives stored in Supabase Storage, accessed via CDN URL, and registered in Serwist cache manifest.
- **Martin degradation:** Martin UNREACHABLE → switch to PMTiles from Supabase Storage → switch to static Mock GeoJSON.

---

## 7. GUEST MODE

Guests see: basemap, suburb boundaries, zoning overlay, aggregate stats, parcel outlines (zoom ≥ 14, no PII).
Guests cannot: view property details, save searches, run analysis, export, see risk layers.
Max 3 sign-up prompts per session. No PII collection for guests (POPIA).

---

## 7. ENVIRONMENT VARIABLES

| Variable                             | Required     | Absent behaviour             |
| ------------------------------------ | ------------ | ---------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`           | YES          | App fails to start           |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`      | YES          | App fails to start           |
| `SUPABASE_SERVICE_ROLE_KEY`          | YES (server) | Server actions fail          |
| `NEXT_PUBLIC_GOOGLE_STREET_VIEW_KEY` | No           | Street View hidden           |
| `MAPBOX_TOKEN`                       | No           | Satellite toggle hidden      |
| `NEXT_PUBLIC_SENTRY_DSN`             | No           | Error tracking disabled      |
| `MARTIN_URL`                         | No           | Tiles from Supabase fallback |

---

## 8. FILE STRUCTURE

```
capegis/
├── CLAUDE.md              ← This file
├── AGENTS.md              ← Agent roles and build commands
├── PLAN.md                ← Authoritative milestone plan
├── README.md              ← Project overview
├── .env.example           ← Placeholder env vars (committed)
├── package.json           ← Dependencies and scripts
├── docker-compose.yml     ← PostGIS + Martin for local dev
├── app/                   ← Next.js 15 App Router (future)
│   ├── src/components/
│   ├── src/lib/
│   ├── src/hooks/
│   ├── src/types/
│   └── public/mock/       ← Fallback GeoJSON files
├── docs/                  ← Specifications and logs
│   ├── architecture/      ← ADRs, SYSTEM_DESIGN.md, TECH_STACK.md
│   ├── planning/          ← AI workflow docs
│   ├── research/          ← Research findings
│   ├── specs/             ← Feature specifications
│   └── assets/            ← Images, PDFs
├── supabase/
│   └── migrations/        ← SQL migration files
└── .github/
    ├── workflows/ci.yml
    └── copilot/           ← Copilot agents, instructions, prompts
```

---

## 9. ESCALATION PROTOCOL

Deviation discovered → STOP → document in `docs/PLAN_DEVIATIONS.md` (DEV-NNN format) → escalate if it affects: geographic scope, POPIA, tech stack, RBAC, or deployment → resume only after human approval.

---

## 10. SESSION CLOSE

- [ ] Update CURRENT_PHASE line (Section 1)
- [ ] Commit with descriptive message
- [ ] Record open questions in `docs/OPEN_QUESTIONS.md`
- [ ] Record deviations in `docs/PLAN_DEVIATIONS.md`

---

## Plan Mode Protocol
Before beginning any implementation task, enter Plan Mode (Shift+Tab × 2). Iterate on the plan until it matches the acceptance criteria in PLAN.md for the active milestone. Only then switch to auto-accept. For tasks larger than a single file change, open a second Claude session in `worktrees/wt-analysis` — a read-only review worktree — and ask it to critique the plan as a staff engineer before execution begins.

## Session Boot Checklist
Before starting any task, Claude must verify:
- [ ] Read ROADMAP.md and identify the active milestone number
- [ ] Check for unresolved evidence gates in PLAN.md
- [ ] Confirm which PostGIS migrations are pending (`ls supabase/migrations/*.sql | tail -5`)
- [ ] Note any POPIA-scoped data changes in scope for this session
- [ ] Confirm RLS is active on any table being touched this session

## Accumulated Corrections (append-only)
<!-- Format: [YYYY-MM-DD] What went wrong → What to do instead -->
<!-- Example: [2026-03-18] Claude modified PostGIS schema directly → always use migration files -->

## Evidence Gate Policy
Milestones with unresolved evidence gates (A, D, E for M22) must not be started.
If asked to begin a gated milestone, state the gate status explicitly and stop.
Do not silently defer. Do not guess. Flagging is helping.

---

_v2.0 · 2026-03-03 · Rewritten during repo cleanup (Phase 5.1)_

<!-- rebootstrap 2026-03-04T10:39:43Z: cleanup-20260304T103943 — removed 1 community artifact (.claude/### 🔌 Plugins); added tile-agent.md, 3 skills, 3 commands, 2 guides, spatial-validation.yml workflow; all existing project tooling verified and retained. -->

<!-- BEGIN AUTO: Documentation Maintenance Rules | fleet v3 -->

## Automatic Documentation Maintenance Rules

Trigger: Any file create, edit, rename, or delete in: docs/ .claude/ .gemini/ .github/ (all subdirectories)
Required Actions:

1. Regenerate docs/INDEX.md (auto-section only, within AUTO markers)
2. Update local INDEX.md of affected directory
3. Append entry to docs/CHANGELOG_AUTO.md
4. If MCP doc-state server available: Acquire write lock → check hash → skip if current → write → release → notify
   MoE Routing:

- Fast tier: index regeneration, changelog append
- High-reasoning tier: conflict resolution, structural decisions only
  Write Rules: Surgical replace within AUTO markers only. Read before write. Diff before commit.
  Commit: docs(auto): {action} in {dir} [{agent_id}]
  Agent-Specific Invocation:
- Invoke: Write tool + TodoWrite for multi-file sessions
- Hooks: .claude/settings.json → PostToolUse → Write|Edit|MultiEdit
- Shell: scripts/sync-index.sh (if present)
- MCP: doc-state in Claude MCP config
<!-- END AUTO: Documentation Maintenance Rules -->

# Project Structure

## Root Layout

```
capegis/
├── src/                  # Next.js App Router (frontend)
├── backend/              # Python FastAPI (hexagonal architecture)
├── supabase/migrations/  # SQL migrations (RLS, schema)
├── public/mock/          # Fallback GeoJSON — NEVER delete
├── docs/                 # Specs, ADRs, research, changelogs
├── .claude/              # AI agent config (agents, skills, commands, guides)
├── .gemini/              # Gemini AI extension
├── .github/              # GitHub Actions workflows + Copilot config
├── infra/                # Deployment & infrastructure docs
├── CLAUDE.md             # 10 non-negotiable rules — read before any file operation
├── AGENTS.md             # Agent registry entry point
└── PLAN.md               # Authoritative milestone definitions
```

## Frontend (`src/`)

```
src/
├── app/                  # Next.js App Router
│   ├── api/              # Server-side API routes (tile proxy, analysis, export)
│   ├── analysis/         # Analysis page
│   ├── dashboard/        # Dashboard page
│   ├── login/            # Auth page
│   ├── layout.tsx        # Root layout with TenantProvider
│   ├── page.tsx          # Home page
│   └── sw.ts             # Serwist service worker
├── components/
│   ├── map/              # MapLibre canvas, layer controls, CesiumJS viewer
│   ├── analysis/         # AnalyticsDashboard, AnalysisResultPanel, ExportPanel
│   ├── search/           # Property search, autocomplete
│   ├── dashboard/        # Recharts widgets
│   ├── auth/             # LoginForm, auth UI
│   ├── admin/            # User management, impersonation
│   ├── ui/               # Shared UI (SourceBadge, CrayonCard, etc.)
│   └── property/         # Property detail panel
├── hooks/                # Custom React hooks (application logic)
│   ├── useDomainState.ts
│   ├── useLiveData.ts    # Three-tier fallback data fetching
│   ├── useRolePresets.ts
│   └── useUrlState.ts    # URL-based viewport/layer state
├── lib/
│   ├── supabase/         # Supabase client (browser + server instances)
│   ├── auth/             # Session, tenant context, role checks
│   ├── tenant/           # TenantContext, tenant config
│   ├── db/               # Dexie.js offline storage
│   ├── validation/       # Zod schemas for API input validation
│   ├── utils/            # Fallback helpers, bbox utilities
│   └── raster/           # Raster processing (zonal stats, NDVI)
├── types/                # Shared TypeScript interfaces & enums
└── __tests__/            # Test files
```

## Backend (`backend/`)

Hexagonal architecture — domain logic has zero framework imports.

```
backend/app/
├── domain/               # Pure business logic (NO framework imports)
│   ├── entities/         # AnalysisJob, GISLayer, TenantContext
│   ├── value_objects/    # BoundingBox, SuitabilityScore, GeoJSONGeometry
│   ├── services/         # Domain services
│   └── exceptions/       # Business rule violations
├── ports/                # Abstract interfaces (ABC)
│   ├── inbound/          # Use case boundaries
│   └── outbound/         # Repository, Storage, ArcGIS, FileProcessor
├── adapters/             # Concrete implementations
├── core/                 # Config, auth (JWKS), database engine
├── services/             # Application services
├── api/routes/           # FastAPI route handlers
└── tasks/                # Celery async tasks
```

## Naming Conventions

| Type | Convention | Example |
|------|-----------|---------|
| Components | PascalCase | `MapContainer.tsx` |
| Hooks | camelCase + `use` prefix | `useLiveData.ts` |
| Utilities | camelCase | `fallback.ts` |
| Types/Interfaces | PascalCase | `interface DomainState` |
| Constants | UPPER_SNAKE_CASE | `CAPE_TOWN_BBOX` |
| API routes | kebab-case dirs | `app/api/tile-proxy/route.ts` |

## Key Patterns

**Components are presentation-only.** Data fetching lives in hooks, not components.

**Hooks own application logic.** `useLiveData` implements the three-tier fallback. `useUrlState` syncs viewport to URL params.

**`lib/` is for utilities and clients.** Supabase instances, Zod schemas, Dexie config, spatial helpers.

**All mutation API routes validate with Zod.** Invalid payloads → 400. No exceptions.

**MapLibre initialised once per page** with a ref guard. Never re-initialise on re-render.

**Spatial CRS:** Store in EPSG:4326, render in EPSG:3857 (MapLibre handles projection).

## File Size Limit

**≤ 300 lines per source file.** Split into smaller modules if approaching the limit.

## Imports Order

1. React / Next.js
2. Third-party libraries
3. Local (`@/components`, `@/lib`, `@/hooks`, `@/types`)

## Documentation Files to Know

| File | Purpose |
|------|---------|
| `CLAUDE.md` | 10 non-negotiable rules — always read first |
| `docs/INDEX.md` | Central documentation hub (auto-maintained) |
| `docs/CHANGELOG_AUTO.md` | Auto-maintained changelog |
| `docs/PLAN_DEVIATIONS.md` | Log deviations here (DEV-NNN format) |
| `.claude/ARCHITECTURE.md` | Full system design & agent map |
| `.claude/guides/` | Domain guides (MapLibre, PMTiles, POPIA, etc.) |

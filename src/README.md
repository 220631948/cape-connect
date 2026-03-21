# Frontend — CapeTown GIS Hub

> Next.js 16 progressive web application with interactive 2D/3D mapping, offline-first architecture, and multi-tenant
> role-based UI.

For project overview, architecture diagram, and backend docs see the [root README](../README.md).

---

## Directory Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── page.tsx            # Landing / home
│   ├── layout.tsx          # Root layout (providers, global CSS)
│   ├── dashboard/          # Main dashboard (map + sidebar)
│   ├── analysis/           # Spatial analysis workspace
│   ├── login/              # Authentication page
│   ├── invite/             # Tenant invitation flow
│   ├── global-error.tsx    # Sentry global error boundary
│   └── sw.ts               # Service worker (Serwist PWA)
├── components/
│   ├── map/                # MapLibre GL, CesiumJS, Martin source, camera sync
│   ├── dashboard/          # Sidebar, header, metrics, domain selector, live telemetry
│   ├── analysis/           # Analysis results, analytics dashboard, export panel
│   ├── admin/              # User management, impersonation, audit, invites
│   ├── auth/               # Login form
│   ├── home/               # Landing page: hero, feature grid, live ticker
│   ├── search/             # Search overlay
│   ├── property/           # Valuation badge
│   ├── copilot/            # AI copilot panel
│   └── ui/                 # Shared UI primitives (CrayonCard, GlowingButton, etc.)
├── hooks/                  # Custom React hooks
│   ├── useDomainState.ts   # Domain/tenant switching state
│   ├── useLiveData.ts      # Real-time data subscriptions
│   ├── useRolePresets.ts   # Role-based UI presets
│   └── useUrlState.ts      # URL-driven state sync
├── lib/
│   ├── supabase/           # Supabase client (browser + server) + cache layer
│   ├── auth/               # Admin session, impersonation tokens, role definitions
│   ├── tenant/             # Multi-tenant context + server-side tenant resolution
│   ├── db/                 # Dexie (IndexedDB) + offline search
│   ├── duckdb/             # DuckDB-WASM client for in-browser analytics
│   ├── validation/         # Input validation utilities
│   ├── utils/              # Fallback helpers
│   ├── monitoring.ts       # Sentry + observability setup
│   ├── opensky-api.ts      # OpenSky Network flight data client
│   ├── opensky-rate-limit.ts
│   ├── sentinel-api.ts     # Sentinel satellite imagery client
│   ├── ndvi-engine.ts      # NDVI vegetation index calculator
│   └── flight-data-transformer.ts
├── assets/
│   ├── icons/              # SVG icon set (domain icons, mascot variants)
│   └── tokens/             # Design tokens (JSON + themes)
├── types/                  # TypeScript type definitions
│   ├── supabase.ts         # Generated Supabase schema types
│   └── opensky.ts          # OpenSky API response types
├── test/
│   └── setup.ts            # Vitest test setup (Testing Library, jsdom)
├── __tests__/
│   └── e2e/                # Playwright end-to-end specs
├── instrumentation.ts      # Sentry server-side instrumentation
├── instrumentation-client.ts  # Sentry client-side instrumentation
└── proxy.ts                # Dev proxy configuration
```

---

## Key Concepts

### Mapping Stack

The app renders geospatial data through two synchronized viewers:

| Viewer          | Library       | Purpose                                             |
|-----------------|---------------|-----------------------------------------------------|
| **2D Map**      | MapLibre GL 4 | Primary map — vector tiles, overlays, drawing tools |
| **3D Globe**    | CesiumJS      | 3D terrain visualization, synchronized camera       |
| **Tile Server** | Martin        | Serves PostGIS layers as Mapbox Vector Tiles (MVT)  |

Camera positions are kept in sync via `CameraSync.ts`. Vector tile layers from Martin are connected through
`MartinSource.tsx`.

### Offline-First Architecture

| Technology            | Role                                                          |
|-----------------------|---------------------------------------------------------------|
| **Serwist**           | Service worker for PWA asset caching and offline shell        |
| **Dexie** (IndexedDB) | Persistent client-side storage + offline full-text search     |
| **DuckDB-WASM**       | In-browser analytical queries over cached geospatial datasets |

### State Management

- **Zustand 5** — Global application state (lightweight, no boilerplate)
- **URL State** (`useUrlState`) — Map position, active layers, and filters encoded in the URL for shareability
- **Domain State** (`useDomainState`) — Active tenant/domain switching

### Multi-Tenant Auth

Authentication flows through **Supabase Auth** with helpers in `lib/supabase/` and `lib/auth/`:

- Server-side session via `lib/supabase/server.ts`
- Browser client via `lib/supabase/client.ts`
- Role-based presets (`useRolePresets`) control which UI panels and features are visible
- Admin impersonation with rate limiting and audit trail (`components/admin/`)

---

## Development

### Prerequisites

- **Node.js** ≥ 20
- Running infrastructure (see [root README — Quick Start](../README.md#quick-start))

### Dev Server

```bash
npm run dev          # http://localhost:3000
```

### Available Scripts

| Command             | Description                                             |
|---------------------|---------------------------------------------------------|
| `npm run dev`       | Start Next.js development server with hot reload        |
| `npm run build`     | Create optimized production build                       |
| `npm run start`     | Serve production build locally                          |
| `npm run lint`      | Run ESLint (Next.js config)                             |
| `npm run typecheck` | TypeScript type-check without emitting (`tsc --noEmit`) |

---

## Testing

### Unit & Component Tests (Vitest)

```bash
npm run test           # Single run
npm run test:watch     # Watch mode
```

Tests use **Vitest** + **Testing Library** + **jsdom**. Test setup is in `src/test/setup.ts`. Component tests live
alongside their components (e.g., `FeatureGrid.test.tsx`, `CrayonCard.test.tsx`).

### End-to-End Tests (Playwright)

```bash
npm run test:e2e       # Run all E2E specs
```

E2E specs are in `src/__tests__/e2e/`. Configuration: [`playwright.config.ts`](../playwright.config.ts).

---

## Build & Deployment

### Production Build

```bash
npm run build
```

The build outputs to `.next/` and is optimized for the **Vercel Edge** platform (region: `cpt1` — Cape Town).

### Vercel Configuration

Deployment is configured in [`vercel.json`](../vercel.json):

- **Region**: `cpt1` (Cape Town edge)
- **API function timeout**: 30 seconds for `src/app/api/**/*.ts` routes
- **Cache headers**: `no-store` on `/api/*` responses

### Sentry Integration

Error tracking is configured via:

- `sentry.server.config.ts` — Server-side (SSR) monitoring
- `sentry.edge.config.ts` — Edge runtime monitoring
- `src/instrumentation.ts` / `src/instrumentation-client.ts` — Auto-instrumentation
- Tree-shaking of debug logging is enabled in `next.config.ts`

---

## Design System

The UI uses a custom **"Crayon"** design language with:

- **Tailwind CSS 4** for utility-first styling
- **Design tokens** defined in `src/assets/tokens/` (JSON + TypeScript themes)
- **Custom components**: `CrayonCard`, `CrayonButton`, `GlowingButton`, `ScribbleIcon`, `WaxTrailCursor`
- **SVG icon set** in `src/assets/icons/` with light/dark/outline variants per domain
- **Turtle mascot** with state-based variants (default, thinking, celebrating)

---

## Environment Variables

Only `NEXT_PUBLIC_*` variables are exposed to the browser. All others are server-side only.

See the [root README — Environment Configuration](../README.md#environment-configuration) for the full variable
reference.

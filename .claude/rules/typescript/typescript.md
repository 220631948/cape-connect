# TypeScript / Next.js Rules — CapeTown GIS Hub

<!--
origin: affaan-m/everything-claude-code/rules/typescript/
adaptation-summary: Adapted for Next.js 15 App Router, Zustand, MapLibre GL JS, and PostGIS stack.
  Removed Prisma/Drizzle references (project uses Supabase JS client).
-->

## Strict TypeScript

- Always use `strict: true` in `tsconfig.json`
- No `any` — use `unknown` + type guards or explicit types
- No non-null assertions (`!`) — handle undefined explicitly

## Next.js 15 App Router Conventions

```typescript
// Server Components — default; use for data fetching
// Client Components — 'use client' at top; use for interactivity/maps
// API Routes — in src/app/api/<route>/route.ts
// Never import server-only code in client components
```

## Async / Promise Patterns

```typescript
// CORRECT — parallel fetching
const [suburbs, zoning] = await Promise.all([fetchSuburbs(), fetchZoning()]);

// AVOID — sequential when parallel is possible
const suburbs = await fetchSuburbs(); // waits unnecessarily
const zoning = await fetchZoning();
```

## Zustand State

- Each layer/feature gets its own focused slice
- Never mutate state directly — always return new object
- Persist offline data only via Dexie.js, not Zustand persist

## Type Definitions

- GeoJSON types from `geojson` package — never re-declare
- Spatial types: `import type { Feature, Geometry, FeatureCollection } from 'geojson'`
- Tenant-scoped responses always include `tenant_id: string`

## Map-Specific Patterns

```typescript
// Always guard MapLibre init with ref
const mapRef = useRef<maplibregl.Map | null>(null);
useEffect(() => {
  if (mapRef.current) return; // guard
  mapRef.current = new maplibregl.Map({ ... });
  return () => { mapRef.current?.remove(); mapRef.current = null; };
}, []);
```

## Import Organization

1. React / Next.js
2. Third-party (maplibre, turf, zustand, supabase)
3. Local types / interfaces
4. Local components / utilities

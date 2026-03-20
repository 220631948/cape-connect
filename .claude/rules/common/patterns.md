# Design Patterns — CapeTown GIS Hub

<!--
origin: affaan-m/everything-claude-code/rules/common/patterns.md (enhanced)
adaptation-summary: Merged ECC design patterns with existing GIS Hub rules.
  Added three-tier fallback, source badge, and spatial patterns.
-->

## Universal Principles

- **DRY** — Don't repeat yourself; shared logic in `src/lib/`
- **SOLID** — Single responsibility, interfaces, dependency injection
- **Immutability** — No in-place mutation of state or GeoJSON objects

## GIS Hub Mandatory Patterns

### Three-Tier Fallback (Rule 2)

Every external data component must implement:

```
LIVE (PostGIS/API) → CACHED (Supabase api_cache) → MOCK (public/mock/*.geojson)
```

Never show blank map or error instead of MOCK.

### Source Badge (Rule 1)

Every data display must render: `[SOURCE_NAME · YEAR · [LIVE|CACHED|MOCK]]`

### Multi-Tenant Isolation (Rule 4)

Any data query must scope to `current_setting('app.current_tenant', TRUE)::uuid`

## Skeleton Patterns

### API Route (Next.js App Router)

```typescript
// src/app/api/<feature>/route.ts
import { verifyTenant } from "@/lib/auth";
export async function GET(request: Request) {
  const tenant = await verifyTenant(request); // throws if unauthorized
  // → query PostGIS with tenant scope
  // → return with source badge metadata
}
```

### Zustand Slice

```typescript
// Always return new objects — never mutate state
set((state) => ({ layers: { ...state.layers, [id]: newLayer } }));
```

## File Size Enforcement

- Source files ≤ 300 lines (Rule 7)
- If approaching limit → extract a focused helper module

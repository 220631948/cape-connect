# Coding Style Rules — CapeTown GIS Hub

<!--
origin: affaan-m/everything-claude-code/rules/common/coding-style.md
adaptation-summary: File size cap changed from 800→300 lines (CLAUDE.md Rule 7).
  GIS-specific immutability pattern added for GeoJSON/geometry objects.
-->

## File Size Limit (NON-NEGOTIABLE)

- Source files **≤ 300 lines** (CLAUDE.md Rule 7). Planning docs and migrations exempt.
- Extract utilities from large modules. Organize by feature/domain, not by type.
- High cohesion, low coupling — many small focused files > few large files.

## Immutability (CRITICAL)

ALWAYS create new objects, NEVER mutate existing ones:

```typescript
// WRONG — mutates geometry in-place
feature.geometry.coordinates[0] = newLng;

// CORRECT — returns new copy
const updatedFeature = {
  ...feature,
  geometry: {
    ...feature.geometry,
    coordinates: [newLng, feature.geometry.coordinates[1]],
  },
};
```

This applies to: GeoJSON features, Zustand state slices, API response objects.

## Error Handling

- Handle errors explicitly at every level — never silently swallow errors
- User-friendly messages in UI-facing code; detailed context server-side
- Spatial errors must include coordinates and CRS in the log context

## Input Validation

- Validate all inputs at system boundaries (API routes, RPC calls)
- Validate geometry against Cape Town bbox (Rule 9) before any PostGIS operation
- Fail fast with clear messages; never trust external GeoJSON without validation

## Code Quality Checklist

Before marking work complete:

- [ ] Functions < 50 lines; files ≤ 300 lines (Rule 7)
- [ ] No deep nesting (> 4 levels)
- [ ] Proper error handling — no silent catches
- [ ] No hardcoded values (use constants or `.env`)
- [ ] No mutation — immutable patterns throughout
- [ ] Readable, well-named identifiers

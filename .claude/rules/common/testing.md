# Testing Rules — CapeTown GIS Hub

<!--
origin: affaan-m/everything-claude-code/rules/common/testing.md (enhanced)
adaptation-summary: Added formal TDD loop, spatial testing patterns, POPIA/RLS test requirements.
-->

## TDD Methodology: RED → GREEN → REFACTOR

1. **RED** — Write a failing test that defines the desired behaviour
2. **GREEN** — Implement the minimum code needed to pass the test
3. **REFACTOR** — Clean up while keeping tests green
4. Repeat. Never write implementation before the failing test.

## Coverage Requirements

- **80% minimum** required for all new source files
- 100% coverage required for: RLS policies, POPIA handlers, three-tier fallback paths
- Zero-coverage components block milestone DoD

## Spatial Testing Patterns

```typescript
// Always test bbox constraint
expect(isWithinCapeTownBbox(result.geometry)).toBe(true);

// Always test CRS
expect(result.properties.crs).toBe("EPSG:4326");

// Always test data badge
expect(screen.getByTestId("source-badge")).toBeVisible();
```

## Required Test Scenarios (per feature)

- [ ] Happy path — authenticated user, live data
- [ ] Fallback path — cached data when API unavailable
- [ ] Mock path — mock GeoJSON when cache empty
- [ ] Guest mode — correct layer visibility restrictions
- [ ] POPIA — no PII in response for unauthorized role
- [ ] RLS — cross-tenant data isolation

## Test File Organization

- Unit tests: co-located `*.test.ts` next to source file
- E2E tests: `playwright/` directory, Page Object Model pattern
- Spatial fixtures: `public/mock/*.geojson` (validated with `ST_IsValid`)
- Skill smoke tests: `.claude/skills/<skill>/smoke.test.ts`

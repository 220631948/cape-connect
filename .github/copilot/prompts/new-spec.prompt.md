---
mode: 'agent'
description: 'Generate a new feature spec file following the 14-spec standard'
---
# New Spec Generator

## Context
Read `CLAUDE.md` (Rules 1–10), `docs/architecture/SYSTEM_DESIGN.md`, and any existing spec in `docs/specs/` before generating.

## Task
Generate a complete spec file at `docs/specs/<feature-name>.spec.md` for the feature described by the user.

Include all 14 sections in order:

1. **TL;DR** — one paragraph, plain English, what this feature does and why
2. **Milestone Mapping** — which M0–M15 milestone this belongs to and its DoD requirement
3. **Component Hierarchy** — tree of React components, server vs client boundary marked
4. **Data Flow** — sequence: user action → API → Supabase → response → render
5. **Acceptance Criteria** — numbered, testable, unambiguous statements
6. **Failure Modes** — what breaks and the graceful degradation path (LIVE→CACHED→MOCK)
7. **Edge Cases** — boundary conditions, empty states, offline, oversized payloads
8. **POPIA Annotation** — full block if personal data is handled; "No personal data" if not
9. **Data Source Badge** — badge format `[SOURCE · YEAR · LIVE|CACHED|MOCK]` for each data layer
10. **Three-Tier Fallback** — explicit LIVE endpoint, CACHED table/key, MOCK file path
11. **RBAC Matrix** — table: role vs action (✓/✗) for GUEST→PLATFORM_ADMIN
12. **Performance Budget** — LCP ≤2.5s, tile load ≤1s, GeoJSON cap (≤10k features)
13. **Map Rules** — zoom gates, layer Z-order, bbox enforcement if map is involved
14. **Open Questions** — unresolved decisions needing human confirmation

Enforce:
- File ≤300 lines (planning docs are exempt but aim for conciseness)
- Cape Town bbox: `west:18.0, south:-34.5, east:19.5, north:-33.0`
- EPSG:4326 storage, EPSG:3857 rendering
- No Lightstone data references

## Output Format
```markdown
# Spec: <Feature Name>
> TL;DR: ...

## 1. Milestone Mapping
## 2. Component Hierarchy
## 3. Data Flow
## 4. Acceptance Criteria
## 5. Failure Modes
## 6. Edge Cases
## 7. POPIA Annotation
## 8. Data Source Badge
## 9. Three-Tier Fallback
## 10. RBAC Matrix
## 11. Performance Budget
## 12. Map Rules
## 13. Open Questions
```

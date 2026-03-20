# 21 — QA Test Plan

> **TL;DR:** Comprehensive testing strategy for the CapeTown GIS platform. Combines Vitest unit tests, Playwright E2E tests, and manual acceptance checklists. Covers performance budgets, accessibility audit (WCAG 2.1), and RLS isolation security scans.

| Field | Value |
|-------|-------|
| **Milestone** | M14 — QA (Acceptance Criteria Verification) |
| **Status** | Implemented (Infrastructure & Core Journeys) |
| **Depends on** | M1–M13 complete |
| **Architecture refs** | [SYSTEM_DESIGN](../architecture/SYSTEM_DESIGN.md), [PERFORMANCE_BUDGET.md](../PERFORMANCE_BUDGET.md) |

## Testing Strategy

### 1. Unit Testing (Vitest)
- **Scope:** Pure functions, state management (Zustand), API data transformers.
- **Coverage Target:** 80% line coverage for `src/lib` and `src/hooks`.
- **Implemented Tests:**
    - `CameraSync.test.ts`: Verified bidirectional zoom/height math.
    - `flight-data-transformer.test.ts`: Verified bbox filtering and POPIA redaction.

### 2. End-to-End Testing (Playwright)
- **Scope:** Critical user journeys, cross-browser compatibility (Chromium).
- **CI Integration:** Runs on every PR to `master`.
- **Implemented Journeys (`src/__tests__/e2e/basic-journeys.spec.ts`):**
    - **Successful Login:** Redirects to dashboard after authentication.
    - **Property Search:** Autocomplete triggers and map auto-zooms on selection.
    - **Analysis Workflow:** Drawing a polygon triggers the spatial analysis panel.

### 3. Security Audits
- **RLS Verification:** Automated check via `scripts/check-rls.sh` ensuring all new tables have tenant isolation.
- **Secret Scanning:** Pre-commit hook to prevent credential leakage.

## Performance Budget Validation

| Metric | Target | Current State |
|--------|--------|---------------|
| Vector Layers | ≤ 5 | 7 (Audit required) |
| Initial Payload | < 2MB | Verified |
| TTI (Fast 3G) | < 5s | Pending E2E benchmark |

## Acceptance Criteria
- ✅ Unit tests pass for core geospatial logic.
- ✅ RLS isolation verified for all project schemas.
- ✅ E2E infrastructure configured with core journeys.
- [ ] 100% of M1–M13 specs pass manual verification.
- [ ] Accessibility score ≥ 90 via Lighthouse.
- [ ] Layer count optimized to ≤ 5 concurrent vector layers.

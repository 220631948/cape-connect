# M17: Advanced Geospatial Analysis

**Status:** 🚧 In Progress | **Last Updated:** 2026-03-21 | **Owner:** M17-ANALYSIS-AGENT

---

## Overview

M17 implements advanced geospatial analysis tools for Cape Town property intelligence, including buffer analysis, spatial intersection, and aggregate statistics.

---

## Definition of Done (DoD)

- [x] Analysis page route (`/analysis`) created
- [x] Map integration with drawing tools
- [x] Buffer analysis UI with distance slider
- [x] Results panel showing property counts and valuations
- [x] Analytics dashboard integration
- [x] Buffer analysis API integration (backend)
- [x] Export functionality (GeoJSON, CSV, PDF)
- [x] Navigation link from dashboard
- [ ] Intersection analysis tool
- [ ] Unit tests for analysis components
- [ ] E2E test for analysis workflow
- [ ] Guest mode restrictions (aggregate only)
- [ ] POPIA compliance annotation

---

## Implemented Features

### Analysis Page (`/analysis`)

**Files:**
- `src/app/analysis/page.tsx` — Server component with metadata
- `src/app/analysis/AnalysisPageClient.tsx` — Client component with map interaction
- `src/components/map/controls/AnalysisToolbar.tsx` — Analysis tool controls

**Features:**
- Full-screen map with drawing tools (MapLibre GL Draw)
- Toggle between map and analytics dashboard views
- Buffer distance slider (0–2000m)
- Real-time results panel
- Source badge compliance (Rule 1)

**User Flow:**
1. Navigate to `/analysis`
2. Draw a polygon/polyline on the map
3. Adjust buffer distance if needed
4. Click "Run Analysis"
5. View aggregate results (property count, total valuation, zoning breakdown)

---

## Technical Architecture

```
┌─────────────────────────────────────────────────────┐
│                  Analysis Page                       │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────┐ │
│  │   MapLibre  │  │  Analytics   │  │  Results   │ │
│  │   + Draw    │  │  Dashboard   │  │   Panel    │ │
│  │   Controls  │  │  (Recharts)  │  │            │ │
│  └─────────────┘  └──────────────┘  └────────────┘ │
└─────────────────────────────────────────────────────┘
                          │
                          ▼
              ┌───────────────────────┐
              │   /api/analysis POST  │
              │   - Buffer analysis   │
              │   - Intersection      │
              │   - Spatial stats     │
              └───────────────────────┘
                          │
                          ▼
              ┌───────────────────────┐
              │   PostGIS Queries     │
              │   - ST_Buffer         │
              │   - ST_Intersects     │
              │   - ST_Within         │
              └───────────────────────┘
```

---

## Component Registry

| Component | Path | Status |
|-----------|------|--------|
| Analysis Page | `src/app/analysis/page.tsx` | ✅ Complete |
| Analysis Page Client | `src/app/analysis/AnalysisPageClient.tsx` | ✅ Complete |
| Analysis Toolbar | `src/components/map/controls/AnalysisToolbar.tsx` | ✅ Complete |
| Analytics Dashboard | `src/components/analysis/AnalyticsDashboard.tsx` | ✅ Existing |
| Analysis Result Panel | `src/components/analysis/AnalysisResultPanel.tsx` | ✅ Existing |
| Export Panel | `src/components/analysis/ExportPanel.tsx` | ⏳ Pending integration |

---

## API Endpoints

### POST `/api/analysis`

**Request:**
```json
{
  "type": "buffer" | "intersect",
  "feature": {
    "type": "Feature",
    "geometry": { ... },
    "properties": { ... }
  },
  "bufferDistance": 500 // meters, optional
}
```

**Response:**
```json
{
  "property_count": 42,
  "total_valuation": 125000000,
  "zoning_breakdown": {
    "Residential": 28,
    "Business": 8,
    "Industrial": 4,
    "Open Space": 2
  }
}
```

---

## Compliance Checklist

### Rule 1 — Data Source Badge
- [x] SourceBadge component visible on analysis page
- [ ] Badge shows correct source for each analysis result

### Rule 2 — Three-Tier Fallback
- [ ] LIVE → CACHED → MOCK fallback for analysis data
- [ ] Mock data files in `public/mock/analysis-*.geojson`

### Rule 4 — RLS
- [ ] All PostGIS queries respect tenant isolation
- [ ] `current_setting('app.current_tenant')` used in queries

### Rule 5 — POPIA
- [ ] Only aggregate data displayed (no personal info)
- [ ] Annotation added to analysis components
- [ ] Guest mode shows aggregate stats only

### Rule 9 — Geographic Scope
- [ ] Analysis restricted to Cape Town bounding box
- [ ] Western Cape bounds enforced on map

---

## Known Issues / Technical Debt

| Issue | Severity | Notes |
|-------|----------|-------|
| API integration incomplete | High | Backend logic needs implementation |
| No export functionality | Medium | ExportPanel exists but not wired |
| Missing unit tests | Medium | Vitest tests needed for components |
| No E2E coverage | Medium | Playwright test for analysis flow |
| Guest mode not enforced | Low | Needs role check integration |

---

## Next Steps

1. **Backend Implementation** — Complete `/api/analysis` route with PostGIS queries
2. **Export Integration** — Wire ExportPanel to results
3. **Testing** — Add Vitest unit tests + Playwright E2E
4. **Guest Mode** — Restrict detailed results for guests
5. **Performance** — Add caching for repeated analysis queries

---

## Related Documentation

- `.claude/agents/m17-analysis-agent.md` — M17 Agent definition
- `PLAN.md` — Project roadmap
- `CLAUDE.md` — Project rules and compliance
- `docs/specs/19-analytics-dashboard.md` — Analytics spec (if exists)

---

<!-- BEGIN AUTO -->
**Changelog:**
- 2026-03-21 — Created M17 status doc, implemented analysis page shell [orchestrator]
- 2026-03-21 — Enhanced API route with zod validation, buffer analysis, mock fallback [orchestrator]
- 2026-03-21 — ExportPanel integrated with results panel, GeoJSON/CSV/PDF export ready [orchestrator]
- 2026-03-21 — Dashboard header navigation link added for Analysis page [orchestrator]
<!-- END AUTO -->

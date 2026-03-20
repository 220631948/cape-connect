# Task M8: 4DGS Temporal Scrubbing — Load-Shedding Layer

> **TL;DR:** Build a temporal navigation UI (timeline scrubber with play/pause, speed control, keyframe markers) for scrubbing through Cape Town load-shedding events visualized via 4D Gaussian Splatting. Syncs with CesiumJS clock for immersive time-series replay. Falls back to MapLibre 2D on mobile.

**Priority:** M8 (Phase 2)
**Status:** SCAFFOLDED — Ready for Implementation
**Created:** 2026-03-05
**Updated:** 2026-03-05 (TL;DR, measurable criteria, edge cases added)
**Dependencies:** M5 (CesiumJS hybrid view), M4a (three-tier fallback), M4c (Serwist PWA)
**Blocking:** KHR_gaussian_splatting ratification expected Q2 2026 [ASSUMPTION — UNVERIFIED]

---

## 1. Objective

Build a temporal navigation UI component that allows users to scrub through time-series data, specifically for visualizing Cape Town load-shedding events using 4D Gaussian Splatting reconstruction.

---

## 2. Cape Town Domain Context

### Load-Shedding as a Spatial-Temporal Phenomenon

Load-shedding in Cape Town is not uniform — it varies by:
- **Stage** (1–8, indicating severity)
- **Area/Suburb** (different schedules per feeder)
- **Time block** (typically 2–4 hour windows)
- **Date** (schedules change seasonally)

**Data sources:**
- City of Cape Town Open Data Portal (load-shedding schedules)
- EskomSePush API (real-time stage announcements)
- Historical schedule archives (2022–present)

**Why 4DGS?**
Traditional 2D maps show *where* load-shedding occurs. 4DGS temporal replay shows *how* darkness propagates across the city over time — creating an immersive understanding of the spatial-temporal pattern.

---

## 3. UI/UX Specification

### 3.1 Timeline Scrubber Component

```
┌─────────────────────────────────────────────────────────────────┐
│  ◄◄  │  ▶/❚❚  │  0.5x  1x  2x  5x  │  18 Mar 2026  │  14:32  │
├─────────────────────────────────────────────────────────────────┤
│  [====●════════════════════════════════════════════════────]   │
│   Jan '25                                    Mar '26           │
│        ↑ Keyframe: Stage 6 begins (15 Jan 2025, 17:00)         │
└─────────────────────────────────────────────────────────────────┘
```

**Features:**
- **Play/Pause toggle**: Starts/stops temporal replay
- **Speed selector**: 0.5x, 1x, 2x, 5x, 10x playback speeds
- **Current timestamp display**: ISO 8601 formatted, SAST timezone (UTC+2)
- **Progress bar**: Draggable scrubber with keyframe markers
- **Keyframe markers**: Visual indicators for significant events:
  - Stage changes (colored by severity)
  - Schedule boundary crossings
  - User-placed bookmarks

### 3.2 Date/Time Jump Controls

```typescript
interface TemporalJumpOptions {
  type: 'stage_change' | 'schedule_block' | 'custom';
  timestamp: string;  // ISO 8601
  label: string;      // e.g., "Stage 4 begins — Northern Suburbs"
  severity?: 'low' | 'medium' | 'high' | 'critical';
}

// Preset quick-jump buttons
const QUICK_JUMPS = [
  { label: 'Today', value: 'now' },
  { label: 'Peak Evening', value: '18:00' },
  { label: 'Next Stage Change', value: 'next_stage' },
  { label: 'Worst Day (2025)', value: '2025-03-12' },
];
```

### 3.3 Temporal Range Selector

For analysis mode, allow users to define a time window:

```typescript
interface TemporalRange {
  start: string;  // ISO 8601
  end: string;    // ISO 8601
  repeat?: 'daily' | 'weekly' | 'monthly';  // For pattern analysis
}
```

**Use case:** "Show me load-shedding patterns for Rondebosch every weekday between 17:00–20:00 for the last month."

### 3.4 Dark Theme Integration

Following `spatialintelligence_inspiration` design tokens:

```css
.temporal-scrubber {
  background: #12121a;
  border-top: 1px solid #1e1e2e;
  color: #e2e8f0;
}

.scrubber-track {
  background: #0a0a0f;
}

.scrubber-thumb {
  background: #00d4ff;  /* Cyan accent */
  box-shadow: 0 0 12px rgba(0, 212, 255, 0.4);
}

.keyframe-marker.stage-change {
  background: #ff6b35;  /* Orange alert */
}

.keyframe-marker.user-bookmark {
  background: #a855f7;  /* Purple */
}
```

---

## 4. Data Pipeline Architecture

### 4.1 Load-Shedding Event Schema

```typescript
interface LoadSheddingEvent {
  id: string;
  area_id: string;           // Links to suburb boundary
  stage: number;             // 1–8
  start_time: string;        // ISO 8601, SAST
  end_time: string;          // ISO 8601, SAST
  schedule_source: 'escom' | 'coc' | 'manual';
  affected_features: number; // Count of parcels/suburbs
}
```

### 4.2 4DGS Point Cloud Temporal Index

```typescript
interface PointCloudFrame {
  frame_id: string;
  timestamp: string;         // ISO 8601
  ply_path: string;          // Supabase Storage path
  center_lng: number;
  center_lat: number;
  height_m: number;
  point_count: number;
  bounding_box: {
    west: number; south: number; east: number; north: number;
  };
}
```

### 4.3 Three-Tier Fallback

| Tier | Source | TTL | Trigger |
|------|--------|-----|---------|
| **LIVE** | EskomSePush API / CoCT API | 60s | Real-time stage changes |
| **CACHED** | `api_cache` table | 1 hour | Scheduled fetches |
| **MOCK** | `public/mock/load-shedding-2025.geojson` | — | API unavailable |

---

## 5. CesiumJS Integration

### 5.1 Clock Configuration

```typescript
import { Viewer, Clock, ClockRange } from 'cesium';

const clock = new Clock({
  startTime: new JulianDate.fromIso8601('2025-01-01T00:00:00+02:00'),
  stopTime: new JulianDate.fromIso8601('2026-12-31T23:59:59+02:00'),
  currentTime: new JulianDate.fromIso8601(new Date().toISOString()),
  clockRange: ClockRange.CLAMPED,
  multiplier: 60,  // 1 second = 60 seconds of simulation
});

viewer.clock = clock;
viewer.timeline = new Timeline();  // Optional built-in widget
```

### 5.2 Entity Temporal Filtering

```typescript
// Each 4DGS frame is a time-dynamic entity
viewer.entities.add({
  position: Cartesian3.fromDegrees(18.4241, -33.9249),
  pointCloud: {
    uri: '/tiles/load-shedding/frame-{frameId}.ply',
    show: new CallbackProperty(() => {
      return clock.currentTime >= entityStartTime &&
             clock.currentTime <= entityEndTime;
    }, false),
  },
  availability: new TimeIntervalCollection([
    new TimeInterval({ start: entityStartTime, stop: entityEndTime })
  ]),
});
```

---

## 6. Data Source Badge

Every temporal view must display:

```
[Load-Shedding Data · 2026 · LIVE]
```

Badge visibility: Always visible in bottom-right corner of map viewport (not hidden behind zoom controls).

---

## 7. Skeptical Expert Notes

### What Could Go Wrong

| Risk | Severity | Mitigation |
|------|----------|------------|
| **4DGS reconstruction is computationally expensive** — Cannot generate frames on-the-fly for arbitrary timestamps | HIGH | Pre-compute frames at 1-minute intervals; interpolate between frames for scrubbing |
| **CesiumJS bundle size (~30–50 MB)** — Too heavy for mobile PWA users on SA networks (5 Mbps average) | HIGH | Code-split CesiumJS as lazy-loaded module; MapLibre-only fallback for mobile |
| **EskomSePush API rate limits** — Free tier: 100 requests/day; authenticated: 4000/day | MEDIUM | Cache aggressively in `api_cache`; implement exponential backoff on 429 |
| **Temporal aliasing** — Load-shedding events are discrete (2–4 hour blocks), but 4DGS frames may be at different temporal resolution | MEDIUM | Align 4DGS frame timestamps to schedule boundaries; document interpolation method |
| **POPIA concerns** — If 4DGS captures residential lighting patterns, this could reveal occupancy data | MEDIUM | Aggregate to suburb-level; no individual parcel visibility in guest mode |

### Required Skill Dependencies

Before implementing this task, the developer MUST read:

1. **`.claude/skills/4dgs_event_replay/SKILL.md`** — 4DGS pipeline validation, point cloud formats, CesiumJS temporal integration
2. **`.claude/skills/spatialintelligence_inspiration/SKILL.md`** — Temporal navigation controls, dark theme design tokens
3. **`.claude/skills/cesium_3d_tiles/SKILL.md`** — CesiumJS viewer configuration, 3D Tiles loading
4. **`.claude/skills/three_tier_fallback/SKILL.md`** — LIVE→CACHED→MOCK pattern implementation

### Technical Unknowns

- **Google 3D Tiles Cape Town coverage** — Verify street-level photorealistic tiles exist for Cape Town before Phase 2
- **KHR_gaussian_splatting ratification** — Khronos extension is RC (Feb 2026); full ratification expected Q2 2026. Implement PLY fallback.
- **EskomSePush commercial licensing** — Confirm SaaS usage rights before multi-tenant deployment

---

## 8. Acceptance Criteria

- [ ] Timeline scrubber component renders with play/pause, speed controls (0.5x, 1x, 2x, 5x, 10x), and ISO 8601 timestamp (SAST)
- [ ] Scrubber displays keyframe markers colored by severity: stage changes (orange #ff6b35), user bookmarks (purple #a855f7)
- [ ] Date/time picker jumps to specific timestamps with <100ms UI response
- [ ] Range selector supports custom temporal windows with optional `daily|weekly|monthly` repeat
- [ ] CesiumJS clock syncs with scrubber position (±1 frame accuracy)
- [ ] 4DGS point cloud frames load within 2s and display per temporal availability
- [ ] Pre-computed frames at 1-minute intervals; interpolation for intermediate scrub positions
- [ ] Data source badge: `[Load-Shedding Data · 2026 · LIVE|CACHED|MOCK]` visible bottom-right
- [ ] Three-tier fallback: EskomSePush API (60s TTL) → `api_cache` (1h) → `public/mock/load-shedding-2025.geojson`
- [ ] Mobile fallback: MapLibre-only mode with 2D choropleth when CesiumJS unavailable
- [ ] Dark theme: scrubber bg #12121a, thumb #00d4ff with glow, track #0a0a0f
- [ ] POPIA annotation present if residential lighting patterns are visible at parcel level

### Edge Cases & Failure Modes

| Scenario | Expected Behaviour |
|----------|-------------------|
| 4DGS frame missing for timestamp | Interpolate between adjacent frames, display "interpolated" indicator |
| EskomSePush API rate limited | Serve cached schedule, badge shows `CACHED` |
| Scrubber dragged faster than frames load | Show loading spinner on viewport, continue loading in background |
| No load-shedding data for selected date | Display "No events for this period" message, keep terrain visible |
| CesiumJS memory >2GB | Force LOD cascade: 3DGS → point cloud → 3D tiles mesh → 2D fallback |
| User plays at 10x speed for extended period | Cap entity count, reduce frame quality after 60s |
| PLY file corrupt or inaccessible | Skip frame, log error, advance to next available frame |

---

## 9. Files to Create/Modify

```
app/src/components/temporal/
├── TimelineScrubber.tsx          # Main scrubber component
├── TemporalControls.tsx          # Play/pause, speed, jump controls
├── TemporalRangeSelector.tsx     # Date/time range picker
├── KeyframeMarker.tsx            # Individual keyframe indicator
└── useTemporalPlayback.ts        # Hook for playback state management

app/src/lib/
├── load-shedding-api.ts          # EskomSePush/CoCT API client
└── temporal-index.ts             # Maps timestamps to 4DGS frame IDs

app/src/hooks/
└── useLiveData.ts                # Three-tier fallback hook
```

---

## 10. Estimated Complexity

- **Timeline UI component:** 2–3 days
- **CesiumJS temporal integration:** 3–4 days
- **Load-shedding API integration:** 1–2 days
- **4DGS frame pipeline:** 4–5 days (depends on reconstruction pipeline maturity)
- **Testing & fallback validation:** 2 days

**Total:** ~12–16 days (Phase 2 sprint)

---

*Generated by Antigravity Agent — Ralph Wiggum voice: "The shiny time-wheel goes round and round!"*

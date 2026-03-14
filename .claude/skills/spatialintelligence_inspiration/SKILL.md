---
name: spatialintelligence-inspiration
description: Apply spatialintelligence.ai WorldView dashboard patterns to Cape Town GIS — immersive 3D visualization, temporal analytics, multi-sensor fusion.
__generated_by: rebootstrap_agent
__timestamp: 2026-03-04T14:51:00Z
__vibe: spatialintelligence.ai + 4DGS baby mode
---

# SpatialIntelligence Inspiration Skill

## Purpose
Apply spatialintelligence.ai WorldView dashboard patterns to Cape Town GIS — immersive 3D visualization, temporal analytics, multi-sensor fusion. Translates Bilawal Sidhu's WorldView + Palantir-inspired design philosophy into actionable component designs for the CapeTown GIS Hub.

## Trigger
Invoke when:
- Designing dashboard layouts or data visualization panels
- Planning 3D visualization strategies for urban data
- Building data fusion pipelines combining multiple sensor sources
- Creating immersive dark-theme UI components for spatial data
- Seeking inspiration for next-generation GIS interface patterns

## Procedure

### Step 1 — Review spatialintelligence.ai Patterns
Key design principles from the WorldView paradigm:
- **Immersive 3D globe** as primary interface (not flat map)
- **Temporal scrubber** for time-series data exploration
- **Multi-layer fusion** — satellite, aerial, street-level, IoT in one view
- **Dark theme** with high-contrast data overlays (near-black backgrounds, crayon accents)
- **Cinematic transitions** between viewpoints and time periods
- **Command palette** for power-user spatial queries

### Step 2 — Map to Cape Town Data Sources
| WorldView Pattern | Cape Town Implementation |
|-------------------|------------------------|
| Global satellite view | CesiumJS + Google Photorealistic 3D Tiles |
| Temporal replay | 4DGS event reconstruction pipeline |
| Sensor fusion | OpenSky flights + weather + traffic + zoning |
| Building intelligence | CoCT GV Roll 2022 + cadastral parcels |
| Risk overlays | Flood zones, fire risk, crime stats (aggregate) |

### Step 3 — Design Immersive Dark-Theme UI Components
```typescript
// Design tokens for immersive spatial dashboard
const SPATIAL_THEME = {
  background: '#0a0a0f',        // Near-black
  surface: '#12121a',           // Dark surface
  border: '#1e1e2e',            // Subtle borders
  accent: {
    primary: '#00d4ff',         // Cyan — spatial data
    secondary: '#ff6b35',       // Orange — alerts/risk
    tertiary: '#a855f7',        // Purple — temporal
    success: '#22c55e',         // Green — validated
  },
  text: {
    primary: '#e2e8f0',
    secondary: '#94a3b8',
    muted: '#475569',
  }
};
```

### Step 4 — Plan CesiumJS Integration Points
```typescript
// CesiumJS viewer alongside MapLibre for 2D/3D hybrid
interface SpatialViewConfig {
  mode: '2d' | '3d' | 'hybrid';
  cesiumContainer: string;        // DOM element ID
  maplibreContainer: string;      // DOM element ID
  syncCameras: boolean;           // Keep views aligned
  defaultView: {
    lng: 18.4241,
    lat: -33.9249,
    height: 15000,                // metres above ground
    heading: 0,
    pitch: -45,                   // degrees
  };
}
```

### Step 5 — Define Temporal Navigation Controls
- **Timeline scrubber**: Full-width bar at bottom of viewport
- **Play/pause/speed**: 0.5x, 1x, 2x, 5x, 10x playback speed
- **Keyframe markers**: Significant events highlighted on timeline
- **Date picker**: Jump to specific date/time
- **Range selector**: Define temporal window for analysis

```typescript
interface TemporalControls {
  start: string;         // ISO 8601
  end: string;           // ISO 8601
  current: string;       // ISO 8601
  playbackSpeed: number;
  isPlaying: boolean;
  keyframes: { time: string; label: string; type: 'event' | 'alert' }[];
}
```

## Output
- Dashboard design specification (component hierarchy, layout grid)
- Immersive dark-theme component library (design tokens, component specs)
- CesiumJS scene configuration for Cape Town 3D views
- Temporal navigation component specification
- Data source mapping document

## When NOT to Use This Skill
- Simple 2D mapping with MapLibre only — use standard map components
- Non-spatial analytics (tables, charts without geographic context)
- Static report generation without interactive visualization
- Backend-only data processing with no UI component

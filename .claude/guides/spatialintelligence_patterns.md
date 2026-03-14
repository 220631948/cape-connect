---
__generated_by: rebootstrap_agent
__timestamp: 2026-03-04T14:51:00Z
__vibe: spatialintelligence.ai + 4DGS baby mode
---

# spatialintelligence.ai WorldView Dashboard Patterns

## Design Philosophy

The CapeTown GIS Hub draws inspiration from **Bilawal WorldView** and **Palantir Foundry** — immersive,
data-rich spatial dashboards that prioritize the map as the primary interface. The map is not a widget;
it IS the application. Everything else orbits the spatial view.

### Core Principles
- **Map-first:** The 3D/2D view fills the viewport. UI elements float over it.
- **Dark immersion:** Near-black backgrounds (`#0A0A0F`, `#111118`) eliminate visual noise.
- **Crayon accents:** Bright, saturated accent colours pop against the dark canvas.
- **Minimal chrome:** No unnecessary borders, headers, or navigation bars.
- **Data density:** Show more data, fewer decorations.
- **Progressive disclosure:** Overview first, zoom/click for detail.

### Colour Palette
| Role | Hex | Usage |
|------|-----|-------|
| Background | `#0A0A0F` | Main app background |
| Surface | `#111118` | Panels, cards, sidebars |
| Surface elevated | `#1A1A24` | Hover states, dropdowns |
| Border | `#2A2A35` | Subtle dividers |
| Text primary | `#E8E8ED` | Headings, labels |
| Text secondary | `#8888A0` | Descriptions, metadata |
| Accent blue | `#4D9EFF` | Primary actions, links |
| Accent green | `#34D399` | Positive indicators |
| Accent red | `#FF6B6B` | Alerts, risk overlays |
| Accent amber | `#FBBF24` | Warnings, pending states |
| Accent purple | `#A78BFA` | Analysis tools, insights |

## Dashboard Layout Patterns

### Primary Layout: Immersive 3D Main View
```
┌──────────────────────────────────────────────────────┐
│  [Logo]  [Search]           [Layers] [3D/2D] [User]  │
├────────┬─────────────────────────────────────────────┤
│        │                                             │
│ SIDE   │          3D GLOBE / 2D MAP                  │
│ BAR    │         (CesiumJS or MapLibre)              │
│        │                                             │
│ Layers │                                             │
│ Search │     ┌──────────────────────┐                │
│ Filter │     │  Floating Analytics  │                │
│ Stats  │     │  Panel (collapsible) │                │
│        │     └──────────────────────┘                │
│        │                                             │
├────────┴────────────────┬────────────────────────────┤
│  ◀ ══════════╪══════════▶  Temporal Slider           │
│  2020    2021   2022   2023   2024                    │
└─────────────────────────┴────────────────────────────┘
```

### Sidebar Analytics (Left/Right)
- Collapsible (default: collapsed on mobile)
- Contains: layer toggles, search, property details, charts
- Width: 320px desktop, full-width sheet on mobile
- Background: `#111118` with 80% opacity backdrop blur

### Floating Panels
- Positioned bottom-right or bottom-center
- Show aggregate statistics, charts (Recharts)
- Auto-hide on camera movement, reappear on idle

### Temporal Slider (Bottom)
- Full-width bar at bottom of viewport
- Scrub through time (GV Roll years, satellite imagery dates)
- Shows event markers (e.g., zoning changes, permits issued)

## Data Fusion Approach

### Multi-Sensor Integration
| Source | Type | Update Freq | Visualisation |
|--------|------|-------------|---------------|
| Satellite imagery | Raster | Daily–Weekly | 3D Tiles drape / 2D overlay |
| Drone surveys | Point cloud / mesh | On-demand | 3DGS reconstruction |
| LiDAR scans | Point cloud | On-demand | Height/terrain model |
| OpenSky ADS-B | Vector (live) | 5 seconds | Aircraft entities |
| CoCT GV Roll | Tabular + spatial | Annual | Choropleth / parcel fill |
| IoT sensors | Time-series | Real-time | Heatmap overlay |

### Fusion Pipeline
```
Raw sensor data → Normalise CRS (EPSG:4326) → Temporal alignment →
Supabase ingestion → Martin MVT / 3D Tiles → Client rendering
```

## Temporal Navigation (4D)

### Timeline Controls
```typescript
interface TemporalState {
  currentTime: Date;
  playbackSpeed: number;      // 1x, 2x, 10x, 100x
  timeRange: [Date, Date];    // visible window
  isPlaying: boolean;
  events: TemporalEvent[];    // markers on timeline
}

// Zustand store
const useTemporalStore = create<TemporalState>((set) => ({
  currentTime: new Date(),
  playbackSpeed: 1,
  timeRange: [new Date('2020-01-01'), new Date()],
  isPlaying: false,
  events: [],
}));
```

### Event Replay
- Scrub timeline to replay aircraft movements, construction progress, land-use changes
- Linked to CesiumJS clock for 3D animation sync
- Data source badge updates: `[OpenSky · 2024-03-04T14:30:00Z · CACHED]`

## Analytics Overlay Patterns

### Heatmaps on 3D Terrain
```typescript
// Property value heatmap draped on CesiumJS terrain
const heatmapEntity = viewer.entities.add({
  rectangle: {
    coordinates: Rectangle.fromDegrees(18.0, -34.5, 19.5, -33.0),
    material: new ImageMaterialProperty({
      image: generateHeatmapCanvas(valuationData),
      transparent: true,
    }),
    classificationType: ClassificationType.TERRAIN,
  },
});
```

### Volumetric Analysis
- 3D extrusion of property values (height = ZAR value)
- Building footprints extruded by floor count
- Flood simulation with water level planes

## Component Hierarchy for Cape Town GIS

```
<AppShell>
  <TopBar />                          // Logo, search, user
  <MainContent>
    <MapContainer>                    // Full viewport
      <CesiumViewer />                // 3D mode
      <MapLibreViewer />              // 2D mode
      <FloatingAnalytics />           // Bottom-right stats
      <LayerControls />               // Floating layer toggles
      <DataBadge />                   // Source attribution
    </MapContainer>
    <Sidebar>                         // Left panel
      <LayerPanel />
      <SearchPanel />
      <PropertyDetailPanel />
      <ChartPanel />                  // Recharts
    </Sidebar>
  </MainContent>
  <TemporalSlider />                  // Bottom timeline
</AppShell>
```

## UI/UX Principles

### Near-Black Backgrounds
```css
:root {
  --bg-primary: #0A0A0F;
  --bg-surface: #111118;
  --bg-elevated: #1A1A24;
}

/* Glass morphism for floating panels */
.floating-panel {
  background: rgba(17, 17, 24, 0.85);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(42, 42, 53, 0.5);
  border-radius: 12px;
}
```

### Crayon Accents
- Use sparingly — accents highlight interactive elements and data
- Never use accent colours for backgrounds or large areas
- Ensure WCAG AA contrast against dark backgrounds

### Minimal Chrome
- No visible scrollbars (use `scrollbar-gutter: stable`)
- No thick borders — use subtle 1px lines or shadows
- Toolbars auto-hide after 3 seconds of inactivity
- Map controls: small, translucent, corner-positioned

## How This Differs from Standard 2D Web GIS

| Standard 2D GIS | spatialintelligence Pattern |
|-----------------|---------------------------|
| Map is a widget in a page | Map IS the page |
| Static layer list sidebar | Contextual floating controls |
| Click → popup | Click → slide-in detail panel |
| Single time snapshot | 4D temporal navigation |
| Flat vector overlays | 3D buildings + terrain drape |
| Desktop-first layout | Mobile-first PWA |
| Admin-heavy UI | Data-heavy, chrome-light UI |
| White/light theme | Near-black immersive theme |

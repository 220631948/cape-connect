# Environmental Scientists Guide — GIS Spatial Intelligence Platform

> **TL;DR:** Track environmental change over time with explicit confidence and seasonality checks. Compare multiple dates before concluding that a change is damage, not normal cycle behavior.

## What This Platform Does For You
- Connects satellite indicators, terrain context, and your own field polygons into one comparative workspace.

## Your First 5 Minutes
1. Select study area and baseline period.
2. Load vegetation/water/hazard layers for at least two dates.
3. Import local sampling boundaries if available.
4. Run temporal comparison view and inspect confidence notes.
5. Export findings with assumptions documented.

## Your Key Features
- Multi-date change detection views.
- Seasonal baseline comparison overlays.
- 4D replay for flood/fire/land-cover evolution.
- Provenance-aware export for reports and publications.

## Data Sources You'll Use (domain language, not technical terms)
- Sentinel-style optical indicators and NDVI-type products (**[ASSUMPTION — UNVERIFIED] specific feed contracts/endpoints not fully listed in `docs/API_STATUS.md`**).
- Hazard and biodiversity public layers (**some confirmed in `docs/API_STATUS.md` for regional datasets**).
- Weather context overlays (**[ASSUMPTION — UNVERIFIED] provider and cadence vary by deployment**).
- Uploaded field plots and sampling boundaries from research teams (**tenant-provided**).

## Core Workflows (3–5 domain-specific procedures)
1. **Seasonality-aware vegetation check:** compare same season across years before labeling decline.
2. **Flood evolution study:** load 24/48/72-hour extents → evaluate spread pattern confidence.
3. **Fire impact follow-up:** pre-event vs post-event indicators → classify likely severity bands.
4. **Peer-review export:** include source lineage + transformation history + uncertainty flags.

## Your 4D Reconstruction Scenarios (2–3 concrete examples: input → output → domain use)
- **Input:** monthly NDVI-like imagery + rainfall context. **Output:** temporal health trend. **Use:** separate drought signal from harvest cycle.
- **Input:** flood rasters over three days. **Output:** inundation progression replay. **Use:** ecosystem impact assessment.
- **Input:** burn scar indicators + biodiversity layers. **Output:** habitat risk timeline. **Use:** restoration prioritization.

## Your GeoFile Upload Workflows (what files they upload → what they see → what they do)
- Upload study boundaries and transects as `.gpkg`/`.geojson`/Shapefile bundles.
- You receive CRS normalization details and geometry validation warnings.
- Then overlay your boundaries with temporal products for repeatable analysis.
- Export includes provenance and explicit uncertainty statements for scientific transparency.

## ⚠️ Things To Know (Ralph Question answered + edge cases)
- **Ralph question:** *What if the brown satellite is just harvest season?*
  **Answer:** Require seasonal baseline comparison and multi-date confirmation before classifying ecological harm.
- Edge case: cloud contamination can mimic change; check quality masks and date coverage.
- Edge case: coarse-resolution pixels can overgeneralize small sites; disclose spatial limits.

## ⚖️ Compliance & Attribution
- This guide is for **decision support**, not legal/operational certainty. Treat live feeds as potentially delayed or incomplete.
- AI-generated views must remain visibly labeled and should not be represented as direct camera truth unless separately validated.
- Cross-tenant data access is prohibited by default; sharing must be explicit and auditable.
- Attribution is required for third-party sources (for example OpenSky, Google Maps Platform, ArcGIS Open Data, Sentinel/NOAA/USGS datasets where used).

## 📶 Offline Mode
- Study area boundaries and last-fetched indicator layers are cached via Dexie.js.
- PMTiles basemap tiles remain available for spatial reference when offline.
- Temporal comparison views work with cached data; badges show `[CACHED]` with retrieval timestamp.
- Upload and annotation tools work offline — data syncs when connectivity resumes.
- `[MOCK]` fallback provides sample indicator layers to maintain workflow continuity.

## 🔒 Guest vs Authenticated Access
| Feature | Guest | Authenticated (VIEWER+) |
|---------|-------|------------------------|
| Basemap + suburb boundaries | ✅ | ✅ |
| Public environmental overlays | ✅ (aggregate stats) | ✅ (detailed layers) |
| Multi-date change detection | ❌ | ✅ |
| Upload study boundaries | ❌ | ✅ |
| Export with provenance | ❌ | ✅ (ANALYST+) |
| 4D replay and analysis | ❌ | ✅ (POWER_USER+) |
- Guests see max 3 sign-up prompts per session. No PII collected for guests (POPIA).

## ✅ Acceptance Criteria
- [ ] Seasonality-aware comparison loads two date layers and renders diff view in ≤ 6 seconds.
- [ ] Flood evolution study supports ≥ 3 timestep overlays with individual confidence indicators.
- [ ] Fire impact classification produces severity bands with documented uncertainty margins.
- [ ] Peer-review export includes complete source lineage, CRS info, and transformation history.
- [ ] Offline cached layers display retrieval timestamp accurate to ± 1 minute.
- [ ] GeoFile upload normalizes CRS to EPSG:4326 and reports original CRS in metadata panel.

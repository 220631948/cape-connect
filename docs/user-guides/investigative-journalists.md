# Investigative Journalists Guide — GIS Spatial Intelligence Platform

> **TL;DR:** Build evidence-aware geographic stories with visible provenance and uncertainty. Replay events in 4D while clearly separating verified facts from inferred reconstruction.

## What This Platform Does For You
- Turns scattered public geospatial traces into a structured story that can be reviewed, challenged, and cited.

## Your First 5 Minutes
1. Start a case workspace and define your time window.
2. Add flight/route/context layers and inspect source provenance cards.
3. Import your own geofiles (incident perimeter, witness locations, camera points).
4. Create a timeline replay and annotate what is confirmed vs inferred.
5. Export a citation-ready package for editorial review.

## Your Key Features
- Provenance panel for each visible layer.
- 4D replay with confidence and uncertainty overlays.
- Citation/export helpers for publication workflows.
- AI-generated content labeling gates for editorial safety.

## Data Sources You'll Use (domain language, not technical terms)
- OpenSky flight telemetry (**confirmed integration doc exists; observational, latency-prone**).
- Public map/imagery layers for context (**coverage and recency vary by location**).
- Public records or open-data shapefiles/GeoPackages supplied by newsroom teams (**quality depends on source institution**).
- Third-party video/camera metadata fusion (**[ASSUMPTION — UNVERIFIED] legal and technical availability varies case by case**).

## Core Workflows (3–5 domain-specific procedures)
1. **Incident reconstruction:** select event window → combine trajectory + map evidence → produce replay narrative.
2. **Editorial fact separation:** tag each claim as confirmed/inferred/unknown → generate transparent notes.
3. **Source challenge workflow:** duplicate scene with alternative assumptions → compare outcomes.
4. **Publication prep:** export visuals + citation bundle + AI-labeling statements.

## Your 4D Reconstruction Scenarios (2–3 concrete examples: input → output → domain use)
- **Input:** ADS-B tracks + geolocated videos. **Output:** synchronized incident timeline. **Use:** support investigative narrative with transparent caveats.
- **Input:** official statement timeline + observed movement data. **Output:** discrepancy heatmap over time. **Use:** identify follow-up questions.
- **Input:** newsroom-collected scene polygons + witness timestamps. **Output:** interactive replay package. **Use:** editorial/legal review.

## Your GeoFile Upload Workflows (what files they upload → what they see → what they do)
- Upload `.geojson`, `.gpkg`, or complete Shapefile bundles for event boundaries and observation points.
- The platform displays source metadata, CRS transformations, and upload provenance.
- You can then attach citations to each layer and lock editorial notes before export.
- If files are incomplete or CRS is ambiguous, upload is paused with corrective guidance.

## ⚠️ Things To Know (Ralph Question answered + edge cases)
- **Ralph question:** *What if my editor publishes the AI image without the watermark?*
  **Answer:** Editorial workflow should enforce non-removable AI labels and human-review gates for publication assets.
- Edge case: trajectory gaps can look like deliberate concealment; report them as coverage limitations unless corroborated.
- Edge case: reconstructed geometry is interpretive; never frame as direct photographic evidence.

## ⚖️ Compliance & Attribution
- This guide is for **decision support**, not legal/operational certainty. Treat live feeds as potentially delayed or incomplete.
- AI-generated views must remain visibly labeled and should not be represented as direct camera truth unless separately validated.
- Cross-tenant data access is prohibited by default; sharing must be explicit and auditable.
- Attribution is required for third-party sources (for example OpenSky, Google Maps Platform, ArcGIS Open Data, Sentinel/NOAA/USGS datasets where used).

## 📶 Offline Mode
- Case workspace layers and timeline data are cached via Dexie.js for field investigation use.
- PMTiles basemap tiles remain available offline for location context.
- Annotations, editorial tags, and citation notes save locally and sync when online.
- Badges switch to `[CACHED]` with clear data age — never present stale evidence as current.
- `[MOCK]` fallback allows workflow rehearsal without live data access.

## 🔒 Guest vs Authenticated Access
| Feature | Guest | Authenticated (VIEWER+) |
|---------|-------|------------------------|
| Basemap + suburb boundaries | ✅ | ✅ |
| Public context layers | ✅ | ✅ |
| Flight track replay | ❌ | ✅ |
| Upload case geofiles | ❌ | ✅ |
| Citation/export packages | ❌ | ✅ (ANALYST+) |
| 4D reconstruction replay | ❌ | ✅ (POWER_USER+) |
- Guests see max 3 sign-up prompts per session. No PII collected for guests (POPIA).

## ✅ Acceptance Criteria
- [ ] Incident reconstruction renders synchronized trajectory + map replay within 8 seconds.
- [ ] Editorial fact separation tags every claim as confirmed/inferred/unknown with no untagged items.
- [ ] Source challenge workflow generates ≥ 2 alternate-assumption scenarios for comparison.
- [ ] Publication export includes AI-labeling statements, source citations, and non-removable watermarks.
- [ ] Offline annotations persist across sessions and sync within 30 seconds of reconnection.
- [ ] GeoFile upload pauses on ambiguous CRS with corrective guidance before any rendering.

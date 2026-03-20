# Aviation Professionals Guide — GIS Spatial Intelligence Platform

> **TL;DR:** Use map + trajectory intelligence to review airspace events with clear limits on certainty. Support safety analysis while acknowledging that public telemetry is observational, not regulatory truth.

## What This Platform Does For You
- Provides a spatial replay layer for operational awareness and retrospective safety review.

## Your First 5 Minutes
1. Open airspace view and set your FIR/area boundary.
2. Load flight tracks and altitude/heading context.
3. Tag the event window for replay.
4. Compare tracks against restricted zones and operational notes.
5. Export a briefing with latency and confidence caveats.

## Your Key Features
- Time-synchronized trajectory playback.
- Airspace boundary overlays and event markers.
- Confidence and data-gap labeling.
- Multi-source context comparison for anomaly review.

## Data Sources You'll Use (domain language, not technical terms)
- OpenSky ADS-B telemetry (**documented integration; useful but non-authoritative**).
- Public airspace and airport geometry references (**[ASSUMPTION — UNVERIFIED] authoritative completeness varies by jurisdiction**).
- Basemap/terrain context for approach and route visualization (**coverage-dependent**).
- Operator-uploaded routes, sectors, and event polygons (**tenant-provided**).

## Core Workflows (3–5 domain-specific procedures)
1. **Near-miss replay:** select two aircraft tracks → time-align → inspect separation trend.
2. **Airspace breach screening:** overlay restricted volumes → detect candidate intrusions for further verification.
3. **Ops debrief:** combine timeline + annotations → publish internal safety narrative.
4. **Cross-source check:** compare public telemetry with official operation logs before formal conclusions.

## Your 4D Reconstruction Scenarios (2–3 concrete examples: input → output → domain use)
- **Input:** dual track telemetry + altitude trend. **Output:** proximity replay sequence. **Use:** initial safety assessment.
- **Input:** suspect intrusion path + airspace polygon. **Output:** breach candidate timeline. **Use:** triage for official follow-up.
- **Input:** airport movement window + route notes. **Output:** ground-to-air context replay. **Use:** training and procedural review.

## Your GeoFile Upload Workflows (what files they upload → what they see → what they do)
- Upload route corridors, sector polygons, or incident points in `.gpkg`/`.geojson`/Shapefile format.
- File validator confirms structure and CRS before rendering.
- You see overlays aligned to track replay with provenance cards.
- Then annotate anomalies and export internal debrief artifacts with caveats.

## ⚠️ Things To Know (Ralph Question answered + edge cases)
- **Ralph question:** *What if OpenSky shows an illegal airspace intrusion?*
  **Answer:** Treat as observational signal requiring authoritative confirmation; do not present as legal enforcement proof.
- Edge case: signal latency can shift perceived event order; include timing uncertainty in reports.
- Edge case: missing transponder data may hide aircraft segments; mark as coverage gap, not absence.

## ⚖️ Compliance & Attribution
- This guide is for **decision support**, not legal/operational certainty. Treat live feeds as potentially delayed or incomplete.
- AI-generated views must remain visibly labeled and should not be represented as direct camera truth unless separately validated.
- Cross-tenant data access is prohibited by default; sharing must be explicit and auditable.
- Attribution is required for third-party sources (for example OpenSky, Google Maps Platform, ArcGIS Open Data, Sentinel/NOAA/USGS datasets where used).

## 📶 Offline Mode
- Last-known flight tracks and airspace polygons are cached locally via Dexie.js (IndexedDB).
- Basemap tiles served from PMTiles remain available when connectivity drops.
- Data source badges switch to `[CACHED]` or `[MOCK]` automatically — never show stale data as live.
- Timeline replay works offline using cached track segments; gaps are marked visually.
- Sync resumes automatically when connectivity returns; conflicts are flagged for review.

## 🔒 Guest vs Authenticated Access
| Feature | Guest | Authenticated (VIEWER+) |
|---------|-------|------------------------|
| Basemap + suburb boundaries | ✅ | ✅ |
| Airspace zone overlays | ✅ (public zones only) | ✅ (full tenant zones) |
| Flight track replay | ❌ | ✅ |
| Upload corridor/sector files | ❌ | ✅ |
| Export briefing packages | ❌ | ✅ (ANALYST+) |
| Risk overlay layers | ❌ | ✅ (POWER_USER+) |
- Guests see max 3 sign-up prompts per session. No personal data collected for guests (POPIA).

## ✅ Acceptance Criteria
- [ ] Near-miss replay loads two tracks and renders separation trend within 5 seconds.
- [ ] Airspace breach screening highlights candidate intrusions with ≥ 90% spatial accuracy against known volumes.
- [ ] Ops debrief export includes all annotations, source badges, and latency caveats in a single PDF/package.
- [ ] Cross-source check displays side-by-side comparison with timestamp alignment ≤ 1 second drift.
- [ ] Offline mode displays cached tracks with visible `[CACHED]` badge within 2 seconds of connectivity loss.
- [ ] GeoFile upload validates CRS and structure in < 3 seconds and rejects malformed files with actionable error messages.

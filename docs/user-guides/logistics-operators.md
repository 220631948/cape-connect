# Logistics Operators Guide — GIS Spatial Intelligence Platform

> **TL;DR:** See movement risk across routes and hubs with timeline context. Plan contingencies faster by visualizing interruptions, delays, and data coverage gaps in one view.

## What This Platform Does For You
- Converts fragmented transport visibility into an operations-friendly spatial timeline for dispatch and recovery decisions.

## Your First 5 Minutes
1. Load your corridor or hub geometry.
2. Enable movement layers (air/sea/ground as available in your tenant setup).
3. Check status badges and freshness indicators.
4. Run route risk replay for your time window.
5. Save a contingency plan with assumptions logged.

## Your Key Features
- Corridor-level disruption monitoring.
- Time-aware movement replay for delay diagnosis.
- Coverage-gap visualization and interpolation flags.
- Uploadable depot/route geofiles for tenant-specific operations.

## Data Sources You'll Use (domain language, not technical terms)
- OpenSky for aircraft-linked logistics context (**documented; observational caveats apply**).
- AIS and route network references for marine/ground context (**[ASSUMPTION — UNVERIFIED] exact provider stack not fully confirmed in `docs/API_STATUS.md`**).
- Basemap and terrain context layers (**coverage varies**).
- Tenant-uploaded routes, depots, and service zones (**quality managed by operator**).

## Core Workflows (3–5 domain-specific procedures)
1. **Delay diagnosis:** route + movement feed → identify where timeline diverged from plan.
2. **Gap-aware monitoring:** detect feed outage vs true stop by comparing peer movement and last-contact age.
3. **Incident routing:** overlay disruptions + alternate corridors → produce revised dispatch suggestion.
4. **Post-mortem:** replay full chain with annotated assumptions and confidence dips.

## Your 4D Reconstruction Scenarios (2–3 concrete examples: input → output → domain use)
- **Input:** vessel/air movement traces + route plan. **Output:** interruption timeline map. **Use:** identify bottleneck stage.
- **Input:** hub congestion markers over 12 hours. **Output:** 4D queue evolution. **Use:** retime dispatch waves.
- **Input:** weather overlays + corridor geometry. **Output:** risk-evolution playback. **Use:** pre-position assets.

## Your GeoFile Upload Workflows (what files they upload → what they see → what they do)
- Upload `.gpkg`/`.geojson`/Shapefile bundles for routes, depots, and service polygons.
- Platform validates bundle completeness and flags CRS issues early.
- After render, compare planned vs observed movement with gap indicators.
- Export operator brief with confidence and coverage limitations clearly stated.

## ⚠️ Things To Know (Ralph Question answered + edge cases)
- **Ralph question:** *What if the ship disappears into an AIS coverage gap?*
  **Answer:** Mark as coverage gap with interpolation flag; do not label disappearance as confirmed stop/incident without corroboration.
- Edge case: mixed feeds can disagree on timestamps; align clocks before SLA attribution.
- Edge case: route simplification can hide micro-detours; inspect raw geometry when disputes arise.

## ⚖️ Compliance & Attribution
- This guide is for **decision support**, not legal/operational certainty. Treat live feeds as potentially delayed or incomplete.
- AI-generated views must remain visibly labeled and should not be represented as direct camera truth unless separately validated.
- Cross-tenant data access is prohibited by default; sharing must be explicit and auditable.
- Attribution is required for third-party sources (for example OpenSky, Google Maps Platform, ArcGIS Open Data, Sentinel/NOAA/USGS datasets where used).

## 📶 Offline Mode
- Route corridors, depot locations, and last-known movement traces are cached via Dexie.js.
- PMTiles basemap tiles remain available for routing context when offline.
- Badges switch to `[CACHED]` with data age — dispatchers see exactly how old each feed is.
- Contingency plan annotations save locally and sync on reconnection.
- `[MOCK]` fallback shows sample corridor data to maintain operational workflow.

## 🔒 Guest vs Authenticated Access
| Feature | Guest | Authenticated (VIEWER+) |
|---------|-------|------------------------|
| Basemap + suburb boundaries | ✅ | ✅ |
| Public route context | ✅ | ✅ |
| Movement replay | ❌ | ✅ |
| Upload route/depot files | ❌ | ✅ |
| Dispatch brief export | ❌ | ✅ (ANALYST+) |
| Disruption monitoring | ❌ | ✅ (POWER_USER+) |
- Guests see max 3 sign-up prompts per session. No PII collected for guests (POPIA).

## ✅ Acceptance Criteria
- [ ] Delay diagnosis identifies divergence point between plan and actual within 6 seconds.
- [ ] Gap-aware monitoring distinguishes feed outage from true stop with visible confidence indicator.
- [ ] Incident routing overlays disruption + ≥ 2 alternate corridors within 8 seconds.
- [ ] Post-mortem replay covers full chain with annotated assumption markers at each confidence dip.
- [ ] Offline cached routes display data age badge accurate to ± 1 minute.
- [ ] GeoFile upload validates route geometry and flags topology errors (disconnected segments) before rendering.

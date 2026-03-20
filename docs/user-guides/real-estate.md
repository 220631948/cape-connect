# Real Estate Developers Guide — GIS Spatial Intelligence Platform

> **TL;DR:** Evaluate sites with clearer historical context and visible data recency. Reduce costly assumptions by comparing timeline evidence before acquisition or design commitments.

## What This Platform Does For You
- Brings parcel context, regulation overlays, and time-based visual evidence into one due-diligence view.

## Your First 5 Minutes
1. Search site and inspect parcel + surrounding context.
2. Check imagery capture date and confidence marker.
3. Upload your concept boundary and zoning constraints.
4. Run timeline comparison (older vs newer context).
5. Export due-diligence notes with uncertainty labels.

## Your Key Features
- Site timeline comparison.
- Zoning/constraint overlay checks.
- Simple 4D storyboards for stakeholder communication.
- Upload and compare concept plans against existing conditions.

## Data Sources You'll Use (domain language, not technical terms)
- City zoning and parcel data (**confirmed where available in `docs/API_STATUS.md`**).
- Building footprints and development-edge context (**confirmed for listed regional sources**).
- Street imagery archives and historical visual references (**[ASSUMPTION — UNVERIFIED] completeness varies by address**).
- Developer-uploaded site plans and parcel adjustments (**tenant-provided**).

## Core Workflows (3–5 domain-specific procedures)
1. **Acquisition screening:** parcel + constraints + recency check → risk note before offer.
2. **Design fit check:** upload concept envelope → compare with surrounding built form.
3. **Stakeholder narrative:** generate timeline visuals showing site evolution and assumptions.
4. **Pre-application prep:** export map package with provenance and caveats.

## Your 4D Reconstruction Scenarios (2–3 concrete examples: input → output → domain use)
- **Input:** site boundary + historical imagery checkpoints. **Output:** condition timeline. **Use:** identify outdated assumptions in valuation.
- **Input:** concept massing + current footprint context. **Output:** visual fit replay. **Use:** early design review.
- **Input:** zoning updates over time. **Output:** regulatory context timeline. **Use:** planning strategy briefing.

## Your GeoFile Upload Workflows (what files they upload → what they see → what they do)
- Upload site boundaries and concept layers in `.gpkg`/`.geojson`/Shapefile.
- The app validates files, reprojects if needed, and shows data lineage.
- You then compare uploaded concepts with current/historical context.
- Export includes assumptions around recency and coverage so non-specialists can interpret correctly.

## ⚠️ Things To Know (Ralph Question answered + edge cases)
- **Ralph question:** *What if the tile shows the site 3 years pre-purchase?*
  **Answer:** Use capture-date and secondary date checks before financial or legal claims.
- Edge case: imagery can be newer in adjacent blocks than target parcel; check site-specific metadata.
- Edge case: partial layer updates may mix vintages in one map view.

## ⚖️ Compliance & Attribution
- This guide is for **decision support**, not legal/operational certainty. Treat live feeds as potentially delayed or incomplete.
- AI-generated views must remain visibly labeled and should not be represented as direct camera truth unless separately validated.
- Cross-tenant data access is prohibited by default; sharing must be explicit and auditable.
- Attribution is required for third-party sources (for example OpenSky, Google Maps Platform, ArcGIS Open Data, Sentinel/NOAA/USGS datasets where used).
- Valuation data sourced from CoCT GV Roll 2022 only. Lightstone data is not used. [VERIFIED]

## 📶 Offline Mode
- Site boundaries, parcel data, and last-fetched context layers are cached via Dexie.js.
- PMTiles basemap tiles remain available for site navigation when offline.
- Badges show `[CACHED]` with capture date — never present old imagery as current conditions.
- Due-diligence annotations save locally and sync when connectivity resumes.
- `[MOCK]` fallback provides sample parcel data to maintain workflow continuity.

## 🔒 Guest vs Authenticated Access
| Feature | Guest | Authenticated (VIEWER+) |
|---------|-------|------------------------|
| Basemap + suburb boundaries | ✅ | ✅ |
| Parcel outlines (zoom ≥ 14) | ✅ (no PII) | ✅ (with details) |
| Zoning overlay | ✅ | ✅ |
| Upload site plans | ❌ | ✅ |
| Timeline comparison | ❌ | ✅ |
| Due-diligence export | ❌ | ✅ (ANALYST+) |
- Guests see max 3 sign-up prompts per session. No PII collected for guests (POPIA).

## ✅ Acceptance Criteria
- [ ] Acquisition screening loads parcel + constraints + recency check within 5 seconds.
- [ ] Design fit check overlays concept envelope on surrounding context with ≤ 1m positional accuracy.
- [ ] Stakeholder narrative generates timeline visuals covering ≥ 3 capture dates.
- [ ] Pre-application export includes provenance, capture dates, and uncertainty caveats in a single package.
- [ ] Offline annotations persist across app restarts and sync within 30 seconds of reconnection.
- [ ] GeoFile upload reprojects to EPSG:4326 and shows original CRS in data lineage panel.

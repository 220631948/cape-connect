# Urban Planners Guide — GIS Spatial Intelligence Platform

> **TL;DR:** Review planning decisions in a visual timeline instead of static map layers. Compare what the city looked like at different capture dates before approving or rejecting a proposal.

## What This Platform Does For You
- Turns policy maps, existing structures, and proposed footprints into one planning workspace with timeline context.

## Your First 5 Minutes
1. Open your municipal area and switch on zoning + building context layers.
2. Check the capture-date panel before trusting 3D appearance.
3. Drop a candidate development boundary (GeoJSON/GPKG/Shapefile).
4. Run the before/after timeline view and export a planning brief screenshot.
5. Flag uncertainty markers before sharing to decision committees.

## Your Key Features
- Capture-date visibility panel for current base imagery.
- Layered zoning and heritage checks for quick feasibility review.
- Scenario playback for redevelopment options.
- Exportable review notes with uncertainty tags.

## Data Sources You'll Use (domain language, not technical terms)
- City open-data planning and zoning layers (**evidence status: confirmed in `docs/API_STATUS.md` where listed**).
- Building footprint and development-edge layers (**confirmed in `docs/API_STATUS.md`**).
- Street-level archive references for recency checks (**[ASSUMPTION — UNVERIFIED] availability varies by location/date**).
- Project-uploaded parcel and concept geometry (**tenant-provided, quality depends on uploader QA**).

## Core Workflows (3–5 domain-specific procedures)
1. **Site feasibility pre-check:** parcel boundary → zoning/heritage overlays → shortlist viable options.
2. **Recency validation:** proposed site → capture-date + street-view date cross-check → confidence note.
3. **Committee briefing prep:** scenario layers → annotated snapshots → publish with caveats.
4. **Policy conflict scan:** candidate geometry → rule overlays → conflicts list for planners/legal review.

## Your 4D Reconstruction Scenarios (2–3 concrete examples: input → output → domain use)
- **Input:** Proposed block rezoning polygon + current footprints. **Output:** time-layered context view. **Use:** identify outdated assumptions in planning memo.
- **Input:** Monthly site photos + mapped footprint changes. **Output:** construction progress replay. **Use:** verify permit compliance windows.
- **Input:** Transit corridor proposal + historical land-use constraints. **Output:** staged urban form timeline. **Use:** communicate trade-offs to non-specialists.

## Your GeoFile Upload Workflows (what files they upload → what they see → what they do)
- Upload `.gpkg` / complete Shapefile bundle / `.geojson` of parcels or concept massing.
- Platform validates file completeness and CRS; if CRS unclear, it warns before plotting.
- You see geometry on the globe plus a file-info card (source CRS, normalized CRS, upload time).
- You then measure impacts, annotate assumptions, and export an evidence-aware planning summary.

## ⚠️ Things To Know (Ralph Question answered + edge cases)
- **Ralph question:** *What if the 3D tile shows a demolished building?*
  **Answer:** Always check capture-date metadata and cross-reference a secondary recent source before approval decisions.
- Edge case: small parcel boundaries can shift visually after reprojection; treat boundary precision warnings seriously.
- Edge case: imagery recency differs by neighborhood; avoid citywide conclusions from one tile age.

## ⚖️ Compliance & Attribution
- This guide is for **decision support**, not legal/operational certainty. Treat live feeds as potentially delayed or incomplete.
- AI-generated views must remain visibly labeled and should not be represented as direct camera truth unless separately validated.
- Cross-tenant data access is prohibited by default; sharing must be explicit and auditable.
- Attribution is required for third-party sources (for example OpenSky, Google Maps Platform, ArcGIS Open Data, Sentinel/NOAA/USGS datasets where used).

## 📶 Offline Mode
- Zoning layers, building footprints, and parcel data are cached locally via Dexie.js.
- PMTiles basemap tiles remain available for planning context when offline.
- Badges show `[CACHED]` with capture date — never present outdated zoning as current policy.
- Planning annotations and feasibility notes save locally and sync on reconnection.
- `[MOCK]` fallback provides sample planning data so workflows remain functional.

## 🔒 Guest vs Authenticated Access
| Feature | Guest | Authenticated (VIEWER+) |
|---------|-------|------------------------|
| Basemap + suburb boundaries | ✅ | ✅ |
| Zoning overlay | ✅ | ✅ |
| Parcel outlines (zoom ≥ 14) | ✅ (no PII) | ✅ (with attributes) |
| Upload development boundaries | ❌ | ✅ |
| Timeline before/after view | ❌ | ✅ |
| Committee briefing export | ❌ | ✅ (ANALYST+) |
- Guests see max 3 sign-up prompts per session. No PII collected for guests (POPIA).

## ✅ Acceptance Criteria
- [ ] Site feasibility pre-check loads parcel + zoning + heritage overlays within 5 seconds.
- [ ] Recency validation cross-checks capture-date from ≥ 2 sources before confidence assessment.
- [ ] Committee briefing export produces annotated snapshots with visible caveat labels.
- [ ] Policy conflict scan identifies zoning/heritage conflicts and lists them with rule references.
- [ ] Offline planning annotations persist across app restarts and sync within 30 seconds of reconnection.
- [ ] GeoFile upload warns on ambiguous CRS before plotting and shows reprojection details.

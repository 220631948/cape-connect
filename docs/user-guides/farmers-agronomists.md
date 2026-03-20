# Farmers & Agronomists Guide — GIS Spatial Intelligence Platform

> **TL;DR:** Monitor field health over time with practical, evidence-aware map views. Compare seasonal baselines so normal harvest patterns are not mistaken for crop stress.

## What This Platform Does For You
- Links field boundaries, vegetation trends, and weather context into one operational decision view for crop management.

## Your First 5 Minutes
1. Open farm workspace and load field boundaries.
2. Add vegetation/time layers for current and baseline dates.
3. Overlay weather context and irrigation features if available.
4. Review timeline for sections showing unusual change.
5. Export field action notes with confidence tags.

## Your Key Features
- Parcel-level health timeline overlays.
- Seasonal baseline comparison to reduce false alarms.
- Upload-ready field boundary and scouting layers.
- Simple 4D replay for advisory discussions.

## Data Sources You'll Use (domain language, not technical terms)
- Satellite vegetation indicators (NDVI-style) (**[ASSUMPTION — UNVERIFIED] exact provider/refresh cadence depends on deployment**).
- Weather overlays (rainfall/temperature proxies) (**[ASSUMPTION — UNVERIFIED] provider integration not fully enumerated in `docs/API_STATUS.md`**).
- User-uploaded field boundaries and scout observations (**tenant-provided**).
- Public base imagery/terrain for context (**coverage and date freshness vary**).

## Core Workflows (3–5 domain-specific procedures)
1. **Field stress screening:** compare current indicator to seasonal baseline for each field block.
2. **Irrigation impact check:** overlay weather and irrigation zones to test likely cause.
3. **Scouting prioritization:** mark high-uncertainty/high-change polygons for ground inspection.
4. **Advisory report prep:** export map notes with explicit confidence and assumptions.

## Your 4D Reconstruction Scenarios (2–3 concrete examples: input → output → domain use)
- **Input:** current vegetation map + same-period prior-year data. **Output:** anomaly timeline per field. **Use:** focus scouting visits.
- **Input:** rainfall + temperature overlays + parcel map. **Output:** stress-cause context replay. **Use:** irrigation and treatment planning.
- **Input:** drone observation points + satellite trend. **Output:** multi-source field narrative. **Use:** agronomy advisory meeting.

## Your GeoFile Upload Workflows (what files they upload → what they see → what they do)
- Upload field boundaries and management zones in `.gpkg`/`.geojson`/Shapefile format.
- Validator confirms geometry, CRS, and file completeness before rendering.
- You then compare temporal indicators by uploaded parcel segments.
- Export supports grower/advisor communication with caveats visible to non-specialists.

## ⚠️ Things To Know (Ralph Question answered + edge cases)
- **Ralph question:** *What if the satellite shows brown fields but it's just harvest?*
  **Answer:** Use multi-temporal baseline and weather context before classifying as drought/damage.
- Edge case: cloud/shadow contamination can create false stress signals; verify quality masks.
- Edge case: smallholder parcels may be below effective sensor resolution in some products; disclose scale limitations.

## ⚖️ Compliance & Attribution
- This guide is for **decision support**, not legal/operational certainty. Treat live feeds as potentially delayed or incomplete.
- AI-generated views must remain visibly labeled and should not be represented as direct camera truth unless separately validated.
- Cross-tenant data access is prohibited by default; sharing must be explicit and auditable.
- Attribution is required for third-party sources (for example OpenSky, Google Maps Platform, ArcGIS Open Data, Sentinel/NOAA/USGS datasets where used).

## 📶 Offline Mode
- Field boundaries and last-fetched vegetation indicators are cached locally via Dexie.js.
- PMTiles basemap tiles work offline for field navigation and orientation.
- Badges show `[CACHED]` with data age so you never mistake old readings for current conditions.
- Scouting notes and field annotations save locally and sync when you're back online.
- `[MOCK]` fallback provides sample field data to practice workflows before real data is available.

## 🔒 Guest vs Authenticated Access
| Feature | Guest | Authenticated (VIEWER+) |
|---------|-------|------------------------|
| Basemap + suburb boundaries | ✅ | ✅ |
| Public vegetation overlays | ✅ (regional aggregate) | ✅ (parcel-level detail) |
| Field boundary upload | ❌ | ✅ |
| Seasonal baseline comparison | ❌ | ✅ |
| Advisory report export | ❌ | ✅ (ANALYST+) |
| 4D replay and irrigation analysis | ❌ | ✅ (POWER_USER+) |
- Guests see max 3 sign-up prompts per session. No PII collected for guests (POPIA).

## ✅ Acceptance Criteria
- [ ] Field stress screening compares current vs baseline indicator per block in ≤ 5 seconds.
- [ ] Irrigation impact check overlays ≥ 2 context layers (weather + irrigation zones) simultaneously.
- [ ] Scouting prioritization highlights top 5 highest-change polygons ranked by anomaly score.
- [ ] Advisory report export includes confidence tags and plain-language assumption summaries.
- [ ] Offline field annotations persist across app restarts and sync within 30 seconds of reconnection.
- [ ] GeoFile upload validates field boundary geometry and warns on self-intersecting polygons.

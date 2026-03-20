# Defense Analysts (Public OSINT Scope) Guide — GIS Spatial Intelligence Platform

> **TL;DR:** Fuse public geospatial signals for situational understanding while keeping strict ethical boundaries. Produce analysis products that are explicit about uncertainty and legal constraints.

## What This Platform Does For You
- Supports public-data pattern analysis without crossing into covert or private surveillance behaviors.

## Your First 5 Minutes
1. Start with OSINT-only workspace and verify access tier.
2. Select area/time window and relevant public feeds.
3. Overlay movement + contextual geographies.
4. Build timeline with confidence scoring visible.
5. Export analyst brief with bright-line compliance notes.

## Your Key Features
- Multi-source public-feed correlation.
- Pattern-of-life style timeline exploration (public data only).
- Confidence conflict surfacing (no silent resolution).
- Controlled export with compliance disclosure.

## Data Sources You'll Use (domain language, not technical terms)
- OpenSky aircraft telemetry (**documented; observational limitations apply**).
- Public maritime/route/contextual geographies (**[ASSUMPTION — UNVERIFIED] feed availability and legal use differ by region**).
- Public map baselayers and uploaded mission AOIs (**tenant-managed inputs**).
- Optional public incident/open-source reports (**quality and bias vary by source reliability**).

## Core Workflows (3–5 domain-specific procedures)
1. **Initial pattern scan:** aggregate public traces in AOI and time window.
2. **Anomaly triage:** compare baseline movement against event window anomalies.
3. **Confidence conflict review:** inspect where sources diverge and preserve disagreement in output.
4. **Ethics gate:** verify product remains public-data-only and avoids individual targeting.

## Your 4D Reconstruction Scenarios (2–3 concrete examples: input → output → domain use)
- **Input:** multi-day flight/maritime traces. **Output:** pattern timeline scene. **Use:** strategic context review.
- **Input:** event-time anomalies + baseline corridor behavior. **Output:** deviation replay. **Use:** structured intelligence brief.
- **Input:** uploaded AOI + open incident reports. **Output:** annotated situational map. **Use:** briefing support with caveats.

## Your GeoFile Upload Workflows (what files they upload → what they see → what they do)
- Upload AOI polygons, corridor files, and event markers via `.gpkg`/`.geojson`/Shapefile.
- The platform validates CRS and enforces tenant isolation before display.
- You then correlate public feeds and annotate confidence conflicts.
- Export includes explicit statement that outputs are public-data analytical interpretations.

## ⚠️ Things To Know (Ralph Question answered + edge cases)
- **Ralph question:** *Is analysing public ADS-B the same as surveillance?*
  **Answer:** No, but ethical/legal risk remains; maintain public-data scope, avoid personal targeting, and disclose limits.
- Edge case: repeated identifiers can still imply sensitive movement patterns; enforce minimization policies.
- Edge case: confidence inflation across corroborating-but-weak sources can mislead; keep confidence conservative.

## ⚖️ Compliance & Attribution
- This guide is for **decision support**, not legal/operational certainty. Treat live feeds as potentially delayed or incomplete.
- AI-generated views must remain visibly labeled and should not be represented as direct camera truth unless separately validated.
- Cross-tenant data access is prohibited by default; sharing must be explicit and auditable.
- Attribution is required for third-party sources (for example OpenSky, Google Maps Platform, ArcGIS Open Data, Sentinel/NOAA/USGS datasets where used).

## 📶 Offline Mode
- AOI polygons and last-retrieved public feed snapshots are cached via Dexie.js.
- Basemap tiles from PMTiles remain available offline for spatial context.
- Badges auto-switch to `[CACHED]` or `[MOCK]` — analysis products show data age prominently.
- Pattern timeline replay works offline using cached traces; missing segments are gap-marked.
- Re-sync on reconnect with conflict detection for overlapping edits.

## 🔒 Guest vs Authenticated Access
| Feature | Guest | Authenticated (VIEWER+) |
|---------|-------|------------------------|
| Basemap + suburb boundaries | ✅ | ✅ |
| Public zone overlays | ✅ | ✅ |
| Multi-source feed correlation | ❌ | ✅ |
| Upload AOI/corridor files | ❌ | ✅ |
| Export analyst briefs | ❌ | ✅ (ANALYST+) |
| Pattern-of-life timeline | ❌ | ✅ (POWER_USER+) |
- Guests see max 3 sign-up prompts per session. No personal data collected (POPIA).

## ✅ Acceptance Criteria
- [ ] Pattern scan aggregates public traces in AOI within 8 seconds for a 24-hour window.
- [ ] Anomaly triage visually highlights deviations with confidence score ≥ threshold set by analyst.
- [ ] Confidence conflict review preserves all source disagreements — no silent resolution in output.
- [ ] Ethics gate blocks export if product references non-public or individually-identifiable data.
- [ ] Offline cached analysis displays data age badge accurate to ± 1 minute.
- [ ] GeoFile upload validates CRS and rejects files with actionable diagnostics in < 3 seconds.

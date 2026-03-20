# Emergency Responders Guide — GIS Spatial Intelligence Platform

> **TL;DR:** Get an operational map fast, even when conditions are chaotic. Track incident evolution with fallback modes so the screen stays useful during degraded connectivity.

## What This Platform Does For You
- Combines live movement, hazard, and terrain context into one rapidly readable incident board.

## Your First 5 Minutes
1. Open incident map and activate emergency preset.
2. Confirm data health badges (LIVE/CACHED/MOCK) before acting.
3. Draw incident perimeter and save an operational zone.
4. Start timeline scrubber for incident progression.
5. Share role-limited field view to responders.

## Your Key Features
- Offline-tolerant map behavior with cache-first fallback.
- Time-scrubber replay for incident progression.
- Route and perimeter overlays for coordination.
- Confidence badges to avoid over-trust in stale feeds.

## Data Sources You'll Use (domain language, not technical terms)
- Public hazard and remote-sensing feeds (**some region-specific endpoints are confirmed; global incident feeds beyond listed datasets are [ASSUMPTION — UNVERIFIED]**).
- OpenSky aircraft telemetry for aerial operations context (**operationally useful, non-authoritative**).
- Basemap and terrain context layers (**availability depends on provider coverage and network**).
- Uploaded field boundaries and evacuation zones from incident teams (**tenant-provided**).

## Core Workflows (3–5 domain-specific procedures)
1. **Rapid situational setup:** incident point → pull latest hazard + movement layers → establish command view.
2. **Connectivity degradation handling:** LIVE feed loss → CACHED mode with age indicator → escalate comms fallback.
3. **Aerial support coordination:** flight traces + perimeter + no-fly notes → deconfliction view.
4. **After-action replay:** timeline playback → identify response timing bottlenecks.

## Your 4D Reconstruction Scenarios (2–3 concrete examples: input → output → domain use)
- **Input:** fire perimeter snapshots over 6 hours. **Output:** spread replay with confidence aging. **Use:** allocate crews to highest-growth edges.
- **Input:** incident dispatch timeline + air support tracks. **Output:** synchronized 4D playback. **Use:** post-incident operational review.
- **Input:** flood extent layers across time. **Output:** neighborhood impact sequence. **Use:** prioritize evacuation messaging.

## Your GeoFile Upload Workflows (what files they upload → what they see → what they do)
- Upload response zones as `.gpkg` or complete Shapefile bundle.
- Platform checks missing files/CRS and reports issues immediately.
- You see zone overlays in incident mode with timestamped provenance.
- You then assign teams, export map packs, and keep caveat labels visible for command logs.

## ⚠️ Things To Know (Ralph Question answered + edge cases)
- **Ralph question:** *What if the network goes down mid-wildfire?*
  **Answer:** The app should fail over to cached tiles/data with visible staleness labels; never pretend stale data is live.
- Edge case: mixed timestamps across feeds can create false sequence narratives; verify clock alignment before briefing.
- Edge case: mock fallback can preserve workflow continuity but must be clearly marked non-operational.

## ⚖️ Compliance & Attribution
- This guide is for **decision support**, not legal/operational certainty. Treat live feeds as potentially delayed or incomplete.
- AI-generated views must remain visibly labeled and should not be represented as direct camera truth unless separately validated.
- Cross-tenant data access is prohibited by default; sharing must be explicit and auditable.
- Attribution is required for third-party sources (for example OpenSky, Google Maps Platform, ArcGIS Open Data, Sentinel/NOAA/USGS datasets where used).

## 📶 Offline Mode
- Critical: offline resilience is the top priority for emergency use. Cached basemap tiles (PMTiles) and last-known hazard overlays persist locally via Dexie.js.
- When connectivity drops, the app switches to `[CACHED]` data with staleness timers visible on every layer.
- If no cache exists, `[MOCK]` fallback shows placeholder incident zones so the map never goes blank.
- Drawing tools and incident perimeters work fully offline — sync when connection resumes.
- Battery-optimized rendering reduces tile refresh frequency in low-power mode.

## 🔒 Guest vs Authenticated Access
| Feature | Guest | Authenticated (VIEWER+) |
|---------|-------|------------------------|
| Basemap + suburb boundaries | ✅ | ✅ |
| Public hazard overlays | ✅ (aggregate only) | ✅ (detailed) |
| Incident perimeter drawing | ❌ | ✅ |
| Timeline scrubber replay | ❌ | ✅ |
| Field view sharing | ❌ | ✅ (ANALYST+) |
| Risk overlay layers | ❌ | ✅ (POWER_USER+) |
- Guests see max 3 sign-up prompts per session. No PII collected for guests (POPIA).

## ✅ Acceptance Criteria
- [ ] Rapid situational setup renders incident view with hazard layers in ≤ 4 seconds.
- [ ] Connectivity degradation triggers `[CACHED]` badge within 2 seconds; staleness timer starts immediately.
- [ ] Aerial support deconfliction view loads flight traces + perimeter overlay within 6 seconds.
- [ ] After-action replay supports ≥ 24 hours of incident timeline at configurable playback speed.
- [ ] Offline drawing tools save perimeters locally and sync within 30 seconds of reconnection.
- [ ] GeoFile upload validates Shapefile bundle completeness (`.shp`, `.shx`, `.dbf`, `.prj`) before rendering.

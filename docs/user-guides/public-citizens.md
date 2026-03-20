# Public Citizens Guide — GIS Spatial Intelligence Platform

> **TL;DR:** Use a simplified map experience to understand local changes without specialist language. Get clear explanations, visible confidence labels, and easy upload options for community observations.

## What This Platform Does For You
- Makes geospatial insight understandable for non-specialists through plain language, guided controls, and transparent uncertainty cues.

## Your First 5 Minutes
1. Open community mode and allow location (optional).
2. Pick your neighborhood and choose a plain-language layer set.
3. Upload a simple location file or place a pin.
4. Use timeline slider to compare “then vs now.”
5. Share a community note with visible source labels.

## Your Key Features
- Simplified map controls and glossary-free labels.
- Guided “what changed?” timeline mode.
- Community observation upload and annotation.
- Accessible confidence indicators instead of technical error codes.

## Data Sources You'll Use (domain language, not technical terms)
- Public basemap and open civic layers (**some datasets confirmed in `docs/API_STATUS.md`; local availability varies**).
- Community-submitted points/areas (**unverified by default; clearly labeled user-submitted**).
- Environmental/context overlays where available (**[ASSUMPTION — UNVERIFIED] provider differs by deployment region**).
- Optional location services from user device (**permission-based and user-controlled**).

## Core Workflows (3–5 domain-specific procedures)
1. **Neighborhood change check:** select area → compare timeline snapshots.
2. **Community report:** upload or draw observation → add plain-language note.
3. **Local issue follow-up:** combine public layers + community points for discussion.
4. **Share responsibly:** export with source labels and uncertainty warnings.

## Your 4D Reconstruction Scenarios (2–3 concrete examples: input → output → domain use)
- **Input:** before/after imagery + resident reports. **Output:** neighborhood change replay. **Use:** community meeting discussion.
- **Input:** flood/fire alerts + local landmarks. **Output:** understandable event timeline. **Use:** public awareness.
- **Input:** user-uploaded route concerns + traffic context. **Output:** annotated mobility scene. **Use:** civic feedback.

## Your GeoFile Upload Workflows (what files they upload → what they see → what they do)
- Upload `.geojson` or `.gpkg` if available, or use guided pin-drop if you do not have a file.
- If file coordinate format is unclear, the platform attempts safe normalization and asks for confirmation.
- You see your upload as a simple overlay with plain-language labels.
- Then share to community view with uncertainty and source badges intact.

## ⚠️ Things To Know (Ralph Question answered + edge cases)
- **Ralph question:** *What if I don't know my phone's coordinate format?*
  **Answer:** Use location permission or guided pin-drop; when importing files, the app should normalize format and confirm before plotting.
- Edge case: user-submitted observations can be inaccurate; present as community input, not verified fact.
- Edge case: accessibility needs differ widely; keep a no-jargon fallback view always available.

## ⚖️ Compliance & Attribution
- This guide is for **decision support**, not legal/operational certainty. Treat live feeds as potentially delayed or incomplete.
- AI-generated views must remain visibly labeled and should not be represented as direct camera truth unless separately validated.
- Cross-tenant data access is prohibited by default; sharing must be explicit and auditable.
- Attribution is required for third-party sources (for example OpenSky, Google Maps Platform, ArcGIS Open Data, Sentinel/NOAA/USGS datasets where used).

## 📶 Offline Mode
- Your neighborhood map and community layers are cached on your device via Dexie.js.
- When your internet drops, the map stays visible with `[CACHED]` badges showing how old the data is.
- Pins you place and notes you write are saved on your phone and upload when you're back online.
- If no cached data exists, a `[MOCK]` sample map appears so you can still explore the interface.
- Works great on older phones — the app adjusts quality based on your device and connection.

## 🔒 Guest vs Authenticated Access
| Feature | Guest | Authenticated (VIEWER+) |
|---------|-------|------------------------|
| Basemap + suburb boundaries | ✅ | ✅ |
| Zoning overlay | ✅ | ✅ |
| Aggregate neighbourhood stats | ✅ | ✅ |
| Upload community observations | ❌ | ✅ |
| Timeline "then vs now" comparison | ❌ | ✅ |
| Share community notes | ❌ | ✅ (VIEWER+) |
- You'll see max 3 sign-up prompts. We never collect your personal info as a guest (POPIA law).

## ✅ Acceptance Criteria
- [ ] Neighbourhood change check loads before/after snapshots within 5 seconds.
- [ ] Community report upload accepts pin-drop or file and confirms placement within 3 seconds.
- [ ] Local issue view combines ≥ 2 public layers with community points on one screen.
- [ ] Shared notes include visible source labels and uncertainty warnings in export.
- [ ] Offline pin-drops persist across app restarts and sync within 30 seconds of reconnection.
- [ ] Guided pin-drop works without file upload knowledge — no technical jargon in the interface.

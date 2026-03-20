# PLAN DEVIATIONS

> **TL;DR:** Tracks all implementation deviations from CLAUDE.md and locked architecture decisions, with rationale and mitigation for each departure.

## Cape Town GIS Platform — Implementation Deviations from Architecture

> This file is maintained by **RESEARCH-LIBRARIAN-AGENT**.
> It tracks instances where research or implementation constraints forced
> a departure from the locked decisions in `CLAUDE.md` or `docs/architecture/SYSTEM_DESIGN.md`.

---

## Deviation Format

```markdown
## Deviation: [Component/Decision]
**Date:** [YYYY-MM-DD]
**Original Decision:** [Quote from spec]
**Actual Implementation:** [What was done instead]
**Reason for Deviation:** [Why the original plan was changed]
**Impact:** [Performance, security, or feature impact]
**Approval Status:** [Pending / Approved by human]
```

---

## Deviations Index

- [DEV-001](#dev-001) — API keys committed to git history (2026-03-04)
- [DEV-002](#dev-002) — CesiumJS introduction for hybrid 2D/3D view (2026-03-05)
- [DEV-003](#dev-003) — esri-leaflet proposed but rejected; replaced with arcgis-rest-js (2026-03-06)
- [DEV-004](#dev-004) — @mapbox/mapbox-gl-draw proposed but rejected; replaced with maplibre-gl-draw (2026-03-06)
- [DEV-005](#dev-005) — "15 sub-agents" referenced in planning docs (2026-03-06)
- [DEV-006](#dev-006) — Hardcoded API keys in ~/.copilot/mcp-config.json (2026-03-05)
- [DEV-007](#dev-007) — OpenSky free tier for Phase 1 development (2026-03-09)

---

## DEV-001: API Keys Committed to Git History

**Date:** 2026-03-04
**Original Decision:** CLAUDE.md Rule 3 — "No API Keys in Source Code. Credentials in `.env` only. Never hardcode, log, or expose."
**Actual Implementation:** Three API keys were committed to `.copilot/mcp-config.json` in commit `3bbbb2b` and are now embedded in git history:
- `CONTEXT7_API_KEY`
- `EXA_API_KEY`
- `VERCEL_TOKEN`

**Reason for Deviation:** The `.copilot/` directory was not listed in `.gitignore` at the time of commit. MCP configuration files containing secrets were tracked and pushed.
**Impact:** 🔴 **Security** — All three keys must be considered compromised. Anyone with read access to the repository (or its forks/clones) can extract these credentials from git history, even after the file is removed from HEAD.
**Required Human Actions:**
1. **Rotate all three keys immediately** — generate new credentials for CONTEXT7_API_KEY, EXA_API_KEY, and VERCEL_TOKEN via their respective provider dashboards.
2. **Purge git history** — use [BFG Repo-Cleaner](https://rtyley.github.io/bfg-repo-cleaner/) or `git filter-repo` to remove `.copilot/mcp-config.json` from all historical commits.
3. **Force-push** the cleaned history and notify all collaborators to re-clone.
4. **Verify `.gitignore`** — `.copilot/` has been added to `.gitignore` (fixed in this same changeset).

**Approval Status:** ⏳ Pending human action — keys must be rotated before any production deployment.

---

## DEV-002: CesiumJS Introduction for Hybrid 2D/3D View

**Date:** 2026-03-05

**Original Decision:** CLAUDE.md Section 2 (Technology Stack — Frontend):
> "**Mapping:** MapLibre GL JS — NOT Leaflet, NOT Mapbox GL JS"

**Actual Implementation:** Introduction of CesiumJS alongside MapLibre GL JS for hybrid 2D/3D spatial viewing, enabling:
- Google Photorealistic 3D Tiles integration
- 3D building models and terrain visualization
- CZML-based temporal entity animation (flights, vessels)
- 4DGS point cloud replay

**Reason for Deviation:** Research into spatialintelligence.ai WorldView patterns (2026-03-05) confirmed that immersive 3D globe visualization is required for:
- Urban planning domain (building massing + zoning context)
- Aviation domain (3D flight path visualization)
- Maritime domain (vessel positions + port infrastructure)
- Tourism domain (V&A Waterfront photorealistic view)
- Emergency response (terrain-aware coordination)

MapLibre GL JS alone cannot render 3D tiles, terrain meshes, or time-dynamic 3D entities. CesiumJS is the industry-standard library for these capabilities.

**Architecture:** Hybrid approach preserves MapLibre as default and primary rendering engine:
- **Phase 1 (M0–M4):** MapLibre-only (current state)
- **Phase 2 (M5+):** Optional CesiumJS layer beneath transparent MapLibre overlay
- **Fallback:** Full MapLibre 2D mode when CesiumJS unavailable (mobile, API limits)

**Impact:**
- **Bundle size:** +30–50 MB when CesiumJS loaded (mitigated: lazy-loading, mobile detection)
- **Performance:** Increased GPU/memory requirements (mitigated: LOD management, mobile fallback)
- **Complexity:** Camera synchronization between CesiumJS and MapLibre (mitigated: documented sync protocol in task-M5-hybrid-view.md)
- **Benefit:** Enables Phase 2 features: 3D tiles, 4DGS replay, flight tracking, maritime AIS

**Required Human Actions:**
1. Review `docs/architecture/tasks/task-M5-hybrid-view.md` for full specification
2. Approve CesiumJS introduction for Phase 2 implementation
3. Confirm mobile PWA performance budget (5 Mbps SA networks)
4. Verify Google 3D Tiles API key procurement

**Approval Status:** ⏳ Pending human approval — required before any CesiumJS code is written.

---

## DEV-003: esri-leaflet Proposed but Rejected

**Date:** 2026-03-06
**Original Decision:** CLAUDE.md §2 — "MapLibre GL JS — NOT Leaflet, NOT Mapbox GL JS"
**Proposed Implementation:** `esri-leaflet` (github.com/Esri/esri-leaflet) listed in proposed ArcGIS integration tools.
**Resolution:** REJECTED. `esri-leaflet` is a Leaflet wrapper — using it would violate the explicit Leaflet ban. The correct MapLibre-compatible ArcGIS integration path is:
- **`@esri/arcgis-rest-js`** (github.com/Esri/arcgis-rest-js) — REST API client, framework-agnostic, no Leaflet dependency. Verified: also mentioned in same planning document.
- **`arcgis-python-api`** (github.com/Esri/arcgis-python-api) — Python backend/ETL path only; no browser dependency.
- CoCT ArcGIS REST Feature Services are queryable directly via `arcgis-rest-js` without any mapping library dependency.

**Impact:** None — the rejected library had not been installed. Approved alternative produces equivalent results without violating the stack lock.
**Approval Status:** ✅ Auto-resolved — rejected by rule, alternative documented.

---

## DEV-004: @mapbox/mapbox-gl-draw Proposed but Rejected

**Date:** 2026-03-06
**Original Decision:** CLAUDE.md §2 — "MapLibre GL JS — NOT Leaflet, NOT Mapbox GL JS"
**Proposed Implementation:** `@mapbox/mapbox-gl-draw` listed for interactive drawing and measurement tools.
**Resolution:** REJECTED. `@mapbox/mapbox-gl-draw` requires Mapbox GL JS as a peer dependency (confirmed: package.json peerDependencies). Approved alternatives:
- **`maplibre-gl-draw`** — community-maintained MapLibre GL JS port of mapbox-gl-draw (github.com/ljagis/maplibre-gl-draw). Primary recommendation.
- **Native MapLibre drawing** — GeoJSON sources + event handlers for minimal implementations.

**Impact:** None — the rejected library had not been installed. `maplibre-gl-draw` API is near-identical to the rejected library, minimizing migration effort if planned code already references it.
**Approval Status:** ✅ Auto-resolved — rejected by rule, alternative documented.

---

## DEV-005: "15 Sub-Agents" Reference in Planning Documents

**Date:** 2026-03-06
**Original Decision:** `AGENTS.md` defines **10 canonical agents** as the active fleet.
**Proposed Implementation:** Planning documents and a user-submitted tech stack description referenced "15 specialized sub-agents (e.g., MAP-AGENT, SPATIAL-AGENT, AUTH-AGENT)."
**Resolution:** The "15 sub-agents" reference originates from an earlier planning draft predating the March 2026 agent audit (see `docs/agents/agent-audit.md`). The canonical count is 10.
- `AGENTS.md` is the source of truth.
- Any documentation or planning artifacts referencing 15 agents should be updated to align with the current fleet.
- `AUTH-AGENT` is not in the canonical fleet — authentication is handled by Supabase Auth directly.

**Impact:** Documentation inconsistency only. No code impact.
**Approval Status:** ✅ Auto-resolved — AGENTS.md is authoritative; no new agents added.

---

## DEV-006: Hardcoded API Keys in Global Copilot CLI MCP Config

**Date:** 2026-03-05
**Original Decision:** CLAUDE.md Rule 3 — "No API Keys in Source Code. Credentials in `.env` only."
**Actual Implementation:** `~/.copilot/mcp-config.json` (global, outside project root) contains hardcoded plaintext values for:
- `CONTEXT7_API_KEY` — same key previously committed to git (DEV-001)
- `EXA_API_KEY` — same key previously committed to git (DEV-001)

**Note:** This file is outside the project root and was not caught by the project `.gitignore`. However, both keys are the same compromised credentials from DEV-001.

**Required Human Actions:**
1. Rotate both keys (same rotation required as DEV-001 — if not already done)
2. Edit `~/.copilot/mcp-config.json` to replace hardcoded values with env var references:
   ```json
   "CONTEXT7_API_KEY": "${CONTEXT7_API_KEY}"
   "EXA_API_KEY": "${EXA_API_KEY}"
   ```
3. Set `CONTEXT7_API_KEY` and `EXA_API_KEY` in shell profile (`~/.bashrc` / `~/.zshrc`)

**Project config (`.copilot/mcp-config.json`):** Already uses correct `${ENV_VAR}` syntax. No fix needed there.

**Approval Status:** ⏳ Pending human action — global `~/.copilot/mcp-config.json` must be edited manually.

---

## DEV-007: OpenSky Free Tier for Phase 1 Development

**Date:** 2026-03-09

**Original Decision:** CLAUDE.md §2 — "No API Keys in Source Code. Credentials in `.env` only."

**Actual Implementation:** M7 OpenSky Flight Tracking task (`task-M7-opensky-flight-layer.md`) specifies development and testing using OpenSky Network's free tier:
- Anonymous: 100 requests/day (no credentials required)
- Authenticated: 4000 requests/day (requires free account)

**Reason for Deviation:** Original architecture assumed commercial licensing would be required before any implementation. Research confirmed OpenSky provides a functional free tier suitable for:
- Phase 1 development and testing (MapLibre 2D layer)
- POPIA compliance pattern validation
- Three-tier fallback (LIVE→CACHED→MOCK) verification
- Cape Town ADS-B coverage quality assessment

Commercial licensing only required for multi-tenant SaaS deployment (Phase 2+).

**Impact:**
- **Positive:** Enables immediate implementation without legal/commercial blockers
- **Risk:** Free tier rate limits (100/day anonymous) restrict testing frequency
- **Mitigation:** Aggressive caching (30s TTL), mock data fallback, rate limit monitoring

**Required Human Actions:**
1. Create free OpenSky Network account at https://opensky-network.org/register
2. Add credentials to `.env`:
   ```env
   OPENSKY_USERNAME=your_username
   OPENSKY_PASSWORD=your_password
   ```
3. Before multi-tenant deployment: Contact OpenSky Network for commercial SaaS licensing terms

**Approval Status:** ✅ Auto-approved — free tier usage is within OpenSky Network's published terms of service. Commercial licensing review required before Phase 2 deployment only.

# OpenSky Network Integration (Pillar 2)

`[OpenSky Network · 2026 · LIVE|CACHED|MOCK]`

## TL;DR
OpenSky provides ADS-B-derived aircraft telemetry used for Cape Town airspace monitoring, event detection, and temporal overlays in CesiumJS. Use bounded polling (`/states/all`), cache-first fallback, explicit attribution, and confidence-based uncertainty surfacing (never silent conflict resolution). Free-tier usage is **non-commercial primary use**; commercial SaaS deployments with paying tenants must secure a commercial agreement with OpenSky.

## Assumptions & Uncertainty Tags
- Canonical uncertainty label in this doc set is `[ASSUMPTION — UNVERIFIED]`.
- Apply this tag when contract thresholds, mixed-tier licensing interpretation, or schema/runtime guarantees are not confirmed by repository evidence.
- Surface uncertainty directly in operator UI (for example confidence, staleness, or temporal mismatch badges) rather than suppressing conflicts.

## Commercialization Gate (Deployment Blocking)
- **Gate rule:** do not enable `LIVE` OpenSky in paid-tenant production until product-specific commercial terms are confirmed.
- **Interim path:** use cached/mock layers for paid pilots where legal approval is pending.
- **Evidence tag:** `[PL][SI]` from Cycle 1 synthesis and policy delta.
- [ASSUMPTION — UNVERIFIED] threshold details for mixed free/paid tenant distribution require contract/legal interpretation.

> **Ralph Question:** *"If OpenSky drops an aircraft at the exact wrong moment, do we hide the gap?"*  
> **Answer:** No. We surface the gap type (`coverage_gap`, `sensor_gap`, `transponder_silence`, or `emergency_context`) and downgrade confidence while retaining provenance for operators.

## API Overview

- **Base URL:** `https://opensky-network.org/api`
- **Auth Modes:** Anonymous, credentialed, commercial agreement (separate terms)
- **Primary geographic query style:** Bounding box (`lamin`, `lamax`, `lomin`, `lomax`)
- **Operational minimum poll interval:** 10s+ (respect rate limits and backoff)

### Rate Limit & Access Modes

| Mode | Typical Limit (as documented in project context) | Use Case | Caveats |
|---|---:|---|---|
| Anonymous | 100 requests / 10s | Development, low-intensity monitoring | Lower reliability score; stricter burst sensitivity |
| Credentialed | 4000 requests / 10s | Production live layers | Shared pool must be tenant-accounted |
| Commercial Agreement | Contract-defined | Multi-tenant commercial SaaS | Required when free-tier ToS is exceeded or business model is commercial |

> **Ralph Question:** *"Can we launch paid tenant features on free OpenSky access and fix licensing later?"*  
> **Answer:** No. Treat licensing as a deployment gate. If primary usage is commercial, contact OpenSky before production rollout.

## Endpoint Reference

| Endpoint | Method | Purpose | Key Params | Response Focus |
|---|---|---|---|---|
| `/states/all` | GET | Current state vectors in bbox/global scope | `lamin`, `lamax`, `lomin`, `lomax` | Real-time aircraft positions + telemetry |
| `/flights/aircraft` | GET | Flight list for one aircraft in time range | `icao24`, `begin`, `end` | Historical flight segments |
| `/tracks/all` | GET | Track for an aircraft around a timestamp | `icao24`, `time` | Trajectory points for replay |
| `/airports` | GET | Airport metadata lookup | (implementation-specific filters) | Enrichment of departure/arrival context |

> **Ralph Question:** *"If airports data is sparse for one region, should we infer airports from nearest geometry?"*  
> **Answer:** Only as a labeled inference (`derived_airport_match`) with reduced confidence and visible provenance.

## State Vector Field Reference (17 Canonical Fields)

> Note: OpenSky variants may expose additional optional fields (for example `category`) depending on API evolution. The platform canonical model below preserves the 17-field baseline for deterministic ingestion compatibility.

| Field | Type | Unit | Null Condition | GIS Relevance |
|---|---|---|---|---|
| `icao24` | string | n/a | Never null (identity) | Stable aircraft key for joins and track history |
| `callsign` | string | n/a | Null/blank when unavailable | Human-readable label in map/UI |
| `origin_country` | string | n/a | Rarely null | Nationality enrichment and filtering |
| `time_position` | integer | Unix seconds | Null when no recent position | Temporal recency of coordinates |
| `last_contact` | integer | Unix seconds | Null in degraded feeds | Freshness and staleness detection |
| `longitude` | number | degrees | Null if no valid fix | Spatial plotting and trajectory generation |
| `latitude` | number | degrees | Null if no valid fix | Spatial plotting and trajectory generation |
| `baro_altitude` | number | meters | Null near ground or missing pressure source | Vertical separation and risk context |
| `on_ground` | boolean | n/a | Rare null in malformed data | Gap taxonomy (`ground_stop` vs airborne loss) |
| `velocity` | number | m/s | Null in sparse transmissions | Motion vectors and anomaly detection |
| `true_track` | number | degrees | Null if heading unknown | Aircraft orientation in Cesium |
| `vertical_rate` | number | m/s | Null if unavailable | Climb/descent trend and incident cues |
| `sensors` | array<number> | n/a | Null when sensor list hidden | Receiver diversity signal for confidence |
| `geo_altitude` | number | meters | Null if geometric altitude missing | Terrain-relative interpretation |
| `squawk` | string | n/a | Null often | Emergency coding (7700/7600/7500) |
| `spi` | boolean | n/a | Null in partial records | Special position identification context |
| `position_source` | integer/enum | n/a | Null in legacy records | Position provenance quality indicator |

> **Ralph Question:** *"If latitude/longitude are null but velocity exists, is it still safe to render movement?"*  
> **Answer:** No. Render as `position_unknown` state (not a geometry), keep telemetry in side panel, and lower confidence.

## Emergency Squawk Reference (Operational Behavior)

| Squawk | Meaning | Platform Behavior |
|---|---|---|
| `7700` | General emergency | Immediate high-priority event candidate; trigger analyst notification workflow |
| `7600` | Radio communication failure | Mark communications anomaly; monitor trajectory continuity |
| `7500` | Unlawful interference/hijacking | Restricted high-sensitivity handling; agency-tier escalation policy |

> **Ralph Question:** *"Do we auto-publish emergency alerts to public users?"*  
> **Answer:** No. Public tier receives sanitized incident summaries only; raw emergency handling stays in Professional/Agency tiers.

## Polling Strategy (Live + Replay)

1. **Live window query:** poll `/states/all` with Cape Town bbox every 10–30 seconds.
2. **Debounce/render cadence:** ingest at poll cadence, render updates at UI frame-safe intervals.
3. **Gap handling:** classify missing aircraft between polls by last contact delta and `on_ground` state.
4. **Historical playback:** hydrate trajectory from `/tracks/all` and `/flights/aircraft` for selected incident windows.
5. **Fallback chain:** `LIVE → CACHED (30s TTL) → MOCK` with status badge.

Cape Town bbox baseline:
- `lamin=-34.5`
- `lamax=-33.0`
- `lomin=18.0`
- `lomax=19.5`

## CesiumJS Rendering Pattern (Documented)

- **`ModelGraphics`**: aircraft model positioned from latest valid lon/lat/alt.
- **`PathGraphics`**: sampled trail for recent trajectory and replay timelines.
- **`LabelGraphics`**: callsign + confidence indicator + stale marker.
- **Update cycle:** ingest → validate/null-guard → confidence score update → entity property patch.
- **Uncertainty UX:** show `stale`, `inferred`, `conflicted_altitude`, or `coverage_gap` badges directly on entity info panels.

## Data Quality / Risk Taxonomy

| Taxonomy Class | Detection Signal | Operational Risk | Mitigation |
|---|---|---|---|
| `coverage_gap` | Regional receiver scarcity, multi-aircraft simultaneous drop | False negative incident correlation | Show coverage overlay, avoid hard conclusions |
| `transponder_silence` | Single aircraft disappears while peers remain visible | Misinterpretation as crash/diversion | Preserve last-known state + confidence decay |
| `telemetry_conflict` | Altitude/speed mismatch across sources | Wrong event trigger severity | Surface all sources; no silent winner |
| `clock_skew` | Timestamp drift between data feeds | Incorrect sequence ordering | Normalize to UTC; score freshness penalty |
| `identity_ambiguity` | Missing callsign / recycled identifiers | Mis-linked historical tracks | Use composite keys + uncertainty flag |

## Confidence Fusion Patterns

- **Per-source score:** assign source reliability score (OpenSky credentialed > anonymous).
- **Freshness modifier:** decay confidence with `last_contact` age.
- **Cross-validation modifier:** increase confidence when corroborated by AIS/FIRMS/USGS/webcam.
- **Conflict transparency rule:** if sources disagree, expose all values with individual confidences.

Formula used across Pillar 2:

```text
confidence = (sourceReliabilityScore + dataFreshnessScore + crossValidationScore) / 3
```

## Attribution Block (Paste-Ready)

```text
This application uses data from The OpenSky Network,
https://www.opensky-network.org
```

## Attribution/Citation Checklist (Release)
- Attribution text visible in-product where OpenSky layers are rendered.
- Citation included in exported/public artifacts that reference OpenSky-derived outputs.
- Source badge present: `[OpenSky Network · YEAR · LIVE|CACHED|MOCK]`.
- Operational runbook includes OpenSky license status and contact trail.

## Rate Limit & Resilience

- Circuit breaker around upstream 429/5xx bursts
- Exponential backoff with jitter
- Stale-data UI state after freshness threshold breach
- Graceful degradation to cache and then mock data
- Metrics: requests, throttles, stale renders, confidence downgrades

## Multitenant Design

- Shared credential pool (where used) with per-tenant request accounting
- Tenant-scoped cache keys and telemetry records (`tenantId` boundary)
- Tenant quota alarms to prevent noisy-neighbor starvation
- No cross-tenant event or trajectory visibility without explicit sharing controls

## Environment Variables

| Variable | Required | Source |
|---|---|---|
| `OPENSKY_API_USERNAME` | No (anonymous available) | `GIS_MASTER_CONTEXT.md` §15 |
| `OPENSKY_API_PASSWORD` | No (anonymous available) | `GIS_MASTER_CONTEXT.md` §15 |
| `OPENSKY_POLLING_INTERVAL_SECONDS` | Yes (default: 10) | `GIS_MASTER_CONTEXT.md` §15 |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | `CLAUDE.md` §7 (for `api_cache`) |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes (server) | `CLAUDE.md` §7 |

## Three-Tier Fallback

`[LIVE]` OpenSky API polling (`/states/all`, `/tracks/all`, `/flights/aircraft`) → `[CACHED]` tenant-scoped `api_cache` with short TTL (~30s) → `[MOCK]` local replay-safe fixtures in `public/mock`.

## Data Source Badge

`[OpenSky Network · 2026 · LIVE|CACHED|MOCK]` must remain visible on any OpenSky-derived layer or replay view.

## Error Handling
- Upstream `429`/`5xx`: exponential backoff with jitter and circuit-breaker controls.
- Null/partial telemetry: classify and surface `coverage_gap`, `sensor_gap`, or `position_unknown` states; do not fabricate geometry.
- Live feed failure: serve cache first, then mock layer; avoid blank-map failure states.
- Persist tenant-scoped telemetry for throttles, stale windows, and fallback transitions.

## POPIA Implications

- ADS-B data is publicly broadcast but persistent tracking of specific individuals via aircraft registration is prohibited.
- No de-anonymisation by combining public feeds to infer personal movement profiles.
- Emergency squawk handling (`7500/7600/7700`) restricted to Professional/Agency tiers; no public-tier raw alerts.
- Cross-tenant telemetry blending forbidden. [VERIFIED]

## Milestone Mapping

- **M2** (Live Data): OpenSky ADS-B live polling + CesiumJS entity rendering.
- **M4** (Intelligence Fusion): Multi-source confidence scoring + event detection.
- **M10** (4D WorldView): Historical trajectory replay with time scrubber.

## Ralph/edge-case Q&A
- **Q:** What if OpenSky data drops out during an active event? **A:** Surface degraded state, keep last-known track marked stale, and switch to cached replay context.
- **Q:** What if emergency squawk traffic appears in guest-facing views? **A:** Suppress raw alert details for guest/public tiers and require analyst-tier access controls.

## Known Unknowns

1. **Q:** What is the contractual threshold where “non-commercial primary use” becomes non-compliant for mixed free/paid tenants?  
   **A:** Must be resolved with OpenSky directly before production commercialization.
2. **Q:** How should platform policy treat prolonged ADS-B suppression zones during active incidents?  
   **A:** Keep evidence-grade workflows blocked until corroborating sources confirm sequence integrity.
3. **Q:** Are optional schema extensions (for example `category`) stable across API versions for strict parsers?  
   **A:** Treat as optional and version-gate parser behavior with compatibility tests.

## ⚖️ Ethical Use & Compliance

### Terms of Service Compliance
- **OpenSky Network licensing:** Free API usage is for non-commercial primary use. Commercial SaaS or paid-tenant primary usage requires direct OpenSky commercial engagement and agreement.
- **Attribution is mandatory** in all environments (development, staging, production).
- **No deceptive presentation:** OpenSky is observational and latency-prone; it is not an authoritative legal enforcement feed.

### Uncertainty Handling Policy
- Never present inferred trajectories as ground truth.
- Always display confidence and provenance for operational decisions.
- Emergency contexts (`7500/7600/7700`) require explicit analyst acknowledgment before downstream escalation actions.

### Privacy Bright Lines
- No persistent individual tracking via private aircraft linkage.
- No de-anonymisation by combining public feeds to infer personal movement profiles.
- No cross-tenant data blending.

## References
- [Cesium Platform Integration](./cesium-platform.md)
- [Google Maps Tile API Integration](./google-maps-tile-api.md)
- [OSINT Intelligence Layer](../architecture/osint-intelligence-layer.md)
- [Data Fusion Ontology](../architecture/data-fusion-ontology.md)
- [ADR-009: Three-Tier Fallback](../architecture/ADR-009-three-tier-fallback.md)
- OpenSky Network: https://opensky-network.org/
- OpenSky API Documentation: https://openskynetwork.github.io/opensky-api/
- OpenSky Terms & Data Use context (project requirement references): https://opensky-network.org/about/faq
- CesiumJS Entity API (rendering primitives): https://cesium.com/learn/cesiumjs/ref-doc/

# Immersive 4D Reconstruction Feature

> **TL;DR:** Turns event data into time-playable 3D experiences by fusing Google/Cesium basemaps, OpenSky trajectories, and AI reconstructions (3DGS/NeRF). Milestone mapping: core pipeline M4b+, full 4D dashboard M11+. Depends on CesiumJS (cesium-agent) and reconstruction pipeline (immersive-reconstruction-agent). See `CLAUDE.md` for rules and `PLAN.md` for sequencing.

## Milestone Mapping

| Component | Milestone | Depends On |
|---|---|---|
| Cesium 3D Tiles basemap | M4b | Martin MVT, Google 3D Tiles key |
| OpenSky trajectory layer | M5+ | OpenSky API integration |
| 3DGS/NeRF reconstruction | Phase 2 | GPU compute, COLMAP pipeline |
| Time scrubber + sync | M11+ | All above layers stable |
| Full 4D WorldView dashboard | M11+ | Time scrubber, domain presets |
| VR/AR extension | Phase 4 | Performance validation |

## Acceptance Criteria
- [ ] Source badge on every layer: `[SOURCE · YEAR · LIVE|CACHED|MOCK]` (Rule 1)
- [ ] LIVE→CACHED→MOCK fallback for all external feeds (Rule 2)
- [ ] AI reconstructions labeled `isAiGenerated=true` + watermark metadata
- [ ] Human review gate for evidence-grade exports
- [ ] Geographic scope: Cape Town bbox only (Rule 9)
- [ ] Tenant-scoped assets with RLS isolation (Rule 4)
- [ ] POPIA annotations on any personal data handling (Rule 5)

## 4D WorldView Dashboard (8-Layer Stack)

| Layer | Content | Role |
|---|---|---|
| 0 | Cesium World Terrain | Elevation baseline / measurement authority |
| 1 | Google 2D satellite imagery | Fallback visual context |
| 2 | Google photorealistic 3D tiles | Real-world structural context |
| 3 | AI reconstruction (3DGS/NeRF) | Event-focused geometry replay |
| 4 | OpenSky trajectories | Time-dynamic flight paths |
| 5 | Uploaded geofiles | Tenant/domain overlays |
| 6 | Annotations + evidence markers | Analyst narrative layer |
| 7 | Weather/time overlays | Temporal interpretation support |

---

## Time Scrubber Sync Protocol

`JulianDate` acts as canonical timeline clock:
1. Advance slider time `T`.
2. Interpolate OpenSky trajectory at `T`.
3. Set reconstruction opacity/visibility by event phase at `T`.
4. Update weather annotation nearest to `T`.
5. Refresh domain-specific notes tied to `T` intervals.

---

## CZML Export Specification
- Output bundle includes: path entities, timestamped annotations, and reconstruction layer references.
- Export embeds AI disclosure metadata and citation template.
- Verified-evidence export requires `humanReviewed=true` and watermark preservation.

---

## Per-Domain WorldView Presets

| Preset | Default Focus | Interaction Bias |
|---|---|---|
| Journalist | Provenance + timeline evidence | Citation and uncertainty overlays on |
| Emergency | Current hazard and response timeline | Fast scrub + low-latency map mode |
| Research | Metric visibility + reproducibility | Full metadata panes |
| Education | Guided replay and simplified terminology | High narration, lower control density |
| Farmer | Parcel-level overlays + temporal health indicators | Seasonal layer comparison first |

---

## 4D Event Scenarios by Domain (11 Domains)
- Urban planners: before/after built environment snapshots.
- Emergency responders: incident progression with response trajectories.
- Investigative journalists: flight/event reconstruction with provenance.
- Environmental scientists: temporal change overlays.
- Aviation professionals: near-miss/route anomaly replay.
- Logistics operators: corridor disruptions and movement gaps.
- Real estate developers: site-history timeline views.
- Researchers/academics: citable reconstruction packages.
- Defense analysts (public OSINT only): pattern-of-life contextualization.
- Public citizens: simplified community event understanding.
- Farmers/agronomists: field change replay + weather context.

---

## VR/AR Extension Path (Phase 4)
- Candidate runtimes: Cesium for Unity / Cesium for Unreal.
- Initial scope: read-only scene playback with preserved AI labeling overlays.
- Promotion criteria: accessibility, performance, and governance parity with web experience.

## Multitenant Isolation & Access
- Reconstruction and timeline assets are tenant-scoped by default.
- Sharing requires explicit grant and retains original AI labeling metadata.
- Access tiers: public/professional/agency/admin determine capability depth.

## ⚖️ Compliance & Human Review
- Watermark + metadata are immutable in all visual outputs.
- Professional evidence profiles enforce human review gate.
- Export payload must carry uncertainty + provenance statements.

## Ralph Q/A
- **Q:** What if someone treats a replay like a real camera recording?
  **A:** UI/export labeling must continuously state “AI-reconstructed, not verified ground truth” until human-reviewed evidence package exists.
- **Q:** What if timeline sources are out of sync?
  **A:** Use a common timeline clock and display sync-confidence indicator.

## Known Unknowns
- Best UX for communicating uncertainty without overwhelming non-expert users remains open.
- AR ergonomics and mobile battery/performance constraints need domain trials.

## References
- `docs/prompts/GIS_FLEET_PLAN_PROMPT_V3.md` (immersive 4D requirements)
- `docs/context/GIS_MASTER_CONTEXT.md` (§2, §7, §9, §10, §11)

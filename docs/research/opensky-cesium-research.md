# OpenSky + Cesium Research (Normalized)

> **TL;DR:** OpenSky ADS-B + CesiumJS rendering is a viable architecture, but production commitments are gated on: (1) current licensing/quota validation, (2) city-scale rendering performance benchmarks, and (3) POPIA-compliant tenant isolation controls. Backend aggregation/caching is mandatory for multi-client fanout.
>
> **Roadmap Relevance:** M7 (Phase 2) — flight tracking layer. Requires OpenSky license + CesiumJS gate.

## Scope
Synthesis of repository research on combining OpenSky ADS-B flight data with Cesium-based geospatial visualization.

## Findings (evidence-tagged)
- **[Verified-Repo]** OpenSky state-vector ingestion and Cesium time-dynamic rendering are core documented patterns (`opensky-cesium-osint.md`, `GIS_MASTER_CONTEXT.md`).
- **[Verified-Repo]** Backend aggregation/caching is repeatedly recommended to manage polling and multi-client fanout (`opensky-cesium-osint.md`, `spatialintelligence-deep-dive-2026-03-05.md`).
- **[Verified-Repo]** Repo governance flags licensing/attribution requirements for OpenSky in commercial contexts (`GIS_MASTER_CONTEXT.md` lines on non-commercial tier and attribution).
- **[Verified-Repo]** Tenant isolation and POPIA-aware exposure controls are part of the documented architecture context (`spatialintelligence-deep-dive-2026-03-05.md`, `CLAUDE.md`).

## Skeptical Notes
- **[Unverified]** Exact current OpenSky quota behavior and auth policy details may have changed since referenced notes.
  - **Verification needed:** live API docs + authenticated test runs.
- **[Unverified]** Real-world city-scale client performance with full aircraft density is not benchmarked in this repo.
  - **Verification needed:** synthetic load replay and rendering telemetry.

## Practical Implication for This Repo
Proceed with OpenSky+Cesium as viable architecture, but gate production commitments on current licensing, quota validation, and performance testing.

## References
- `docs/research/opensky-cesium-osint.md`
- `docs/context/GIS_MASTER_CONTEXT.md`
- `docs/research/spatialintelligence-deep-dive-2026-03-05.md`
- `CLAUDE.md`

# Researchers & Academics Guide — GIS Spatial Intelligence Platform

> **TL;DR:** Create reproducible, citable spatial analyses with transparent provenance and uncertainty. Move from screenshots to evidence trails that peers can inspect and challenge.

## What This Platform Does For You
- Supports reproducible geospatial workflows by preserving source lineage, transformations, and uncertainty metadata.

## Your First 5 Minutes
1. Define research question and temporal/spatial bounds.
2. Select layers and inspect provenance metadata.
3. Import study area and sampling geometry.
4. Build a 4D replay for methodological transparency.
5. Export citation package with assumptions explicitly tagged.

## Your Key Features
- Provenance-first layer management.
- Reproducible timeline replays.
- Citation-ready export templates.
- Explicit assumption and uncertainty tagging for publications.

## Data Sources You'll Use (domain language, not technical terms)
- Public spatial datasets from documented integrations (**status mixed: some confirmed, some domain-dependent assumptions**).
- OpenSky trajectories for mobility studies (**observational; should be triangulated**).
- Tenant-uploaded field data and boundaries (**research team responsibility for quality**).
- Citation templates and DOI-compatible references (**[ASSUMPTION — UNVERIFIED] exact DOI automation path may vary by deployment**).

## Core Workflows (3–5 domain-specific procedures)
1. **Hypothesis assembly:** choose layers + define confidence thresholds before analysis.
2. **Reproducibility pass:** log transformations, CRS handling, and source timestamps.
3. **Sensitivity check:** rerun with alternate assumptions and compare output differences.
4. **Publication package:** export figures + provenance + caveat language.

## Your 4D Reconstruction Scenarios (2–3 concrete examples: input → output → domain use)
- **Input:** trajectory dataset + event boundaries. **Output:** method-transparent replay. **Use:** reproducible mobility analysis.
- **Input:** environmental layers across dates + study polygon. **Output:** temporal trend scene. **Use:** support or falsify hypothesis.
- **Input:** reconstructed event geometry + confidence labels. **Output:** annotated 4D figure set. **Use:** supplementary material.

## Your GeoFile Upload Workflows (what files they upload → what they see → what they do)
- Upload study geographies as `.gpkg`, `.geojson`, or Shapefile bundle.
- File-info panel records CRS/source metadata for methods sections.
- You can bind citations to layers and include uncertainty statements in export.
- Failed validation halts ingestion with actionable diagnostics to preserve reproducibility.

## ⚠️ Things To Know (Ralph Question answered + edge cases)
- **Ralph question:** *How do I cite a map layer in a paper?*
  **Answer:** Export the provenance chain (source, access date, transform notes, license) and include dataset identifiers/DOIs where available.
- Edge case: if a provider lacks stable versioning, record retrieval timestamp and snapshot hash.
- Edge case: derived layers require both source and method citation to avoid reproducibility gaps.

## ⚖️ Compliance & Attribution
- This guide is for **decision support**, not legal/operational certainty. Treat live feeds as potentially delayed or incomplete.
- AI-generated views must remain visibly labeled and should not be represented as direct camera truth unless separately validated.
- Cross-tenant data access is prohibited by default; sharing must be explicit and auditable.
- Attribution is required for third-party sources (for example OpenSky, Google Maps Platform, ArcGIS Open Data, Sentinel/NOAA/USGS datasets where used).

## 📶 Offline Mode
- Study area geometries, layer snapshots, and provenance metadata are cached via Dexie.js.
- PMTiles basemap tiles remain available for spatial reference when offline.
- Badges show `[CACHED]` with retrieval timestamp — critical for reproducibility records.
- Annotations, citations, and uncertainty tags save locally and sync on reconnection.
- `[MOCK]` fallback provides sample datasets for methodology development and testing.

## 🔒 Guest vs Authenticated Access
| Feature | Guest | Authenticated (VIEWER+) |
|---------|-------|------------------------|
| Basemap + suburb boundaries | ✅ | ✅ |
| Public dataset browsing | ✅ (aggregate views) | ✅ (full detail) |
| Upload study geometries | ❌ | ✅ |
| Provenance-aware export | ❌ | ✅ (ANALYST+) |
| 4D replay and sensitivity checks | ❌ | ✅ (POWER_USER+) |
| Citation package generation | ❌ | ✅ (ANALYST+) |
- Guests see max 3 sign-up prompts per session. No PII collected for guests (POPIA).

## ✅ Acceptance Criteria
- [ ] Hypothesis assembly loads selected layers with confidence thresholds within 6 seconds.
- [ ] Reproducibility pass logs all transformations, CRS handling, and source timestamps automatically.
- [ ] Sensitivity check reruns with alternate assumptions and produces comparable output within 10 seconds.
- [ ] Publication package export includes figures, provenance chain, caveat language, and DOI-ready metadata.
- [ ] Offline cached layers include retrieval timestamps for methods section accuracy.
- [ ] GeoFile upload records CRS, source metadata, and upload provenance for citation compliance.

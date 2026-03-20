# Phase A — Literature Synthesis & Experiment Proposals
## CapeTown GIS Autonomous Research Lab

> Synthesised from `docs/research/` (51 documents indexed in `literature-registry.json`).
> Geographic scope enforced: `{ west: 18.0, south: -34.5, east: 19.5, north: -33.0 }`.
> Last updated: 2026-03-09

---

## 1. State-of-the-Art Survey

### 1.1 Geospatial ML — Segmentation & Object Detection

**Key findings from docs/research/:**

| Domain | SOTA Approach | Relevant to CapeTown GIS |
|--------|--------------|--------------------------|
| Building footprint extraction | Mask R-CNN + SpaceNet 8 training data | EXP-001 (suburb boundary QA) |
| Land-use classification | Sentinel-2 + U-Net / ConvMixer | EXP-002 (land-use change detection) |
| Change detection | Siamese networks + bi-temporal imagery | EXP-002 |
| Flood risk mapping | DEM + NDVI proxy + logistic regression baseline | EXP-003 |
| Property valuation anomaly | Spatial autocorrelation (Moran's I) + regression trees | EXP-004 |
| 3D scene reconstruction | 3D Gaussian Splatting (3DGS) + NeRF for urban scenes | Future phase |

**Sources:** `3dgs-nerf-gis-research.md`, `06_GeoAI_RealTime_Integration.md`, `controlnet-gis-reconstruction.md`

---

### 1.2 Vector Tile Generation & Indexing Best Practices

- **Martin (Rust)** is the production tile server — see `martin-mvt-optimization.md`
- Tippecanoe + PMTiles for offline packaging; zoom-level strategies validated in `tile-optimization.md`
- Sanitised PostGIS views (no PII columns exposed) are the approved pattern for dynamic tile serving
- Cluster index on geometry + `WHERE ST_Intersects(geom, ST_MakeEnvelope($bbox, 4326))` is the performant tile query pattern

**Recommendation:** EXP-001 outputs should be validated as MVT tiles served from Martin before merging into production.

---

### 1.3 Offline-First Geospatial Synchronisation

- Dexie.js + IndexedDB for tile + feature caching (validated in `swarm-react-geospatial-visualization.md`)
- PMTiles object-storage-based offline bundles — no tile server needed offline
- Sync strategy: `last-write-wins` for feature edits; `server-authoritative` for valuations
- Service worker (Serwist) intercepts tile requests; falls through LIVE → CACHED → MOCK

---

### 1.4 Map Generalisation for Mobile PWAs

- Simplify geometry at zoom < 12 using `ST_Simplify(geom, 0.0001)` (tolerance ~10 m at equator)
- Cluster points above zoom 10 with `ST_ClusterDBSCAN`
- Layer Z-order: User draw → Risk overlays → Zoning → Cadastral → Suburbs → Basemap
- `minzoom`/`maxzoom` enforced per layer (cadastral: zoom ≥ 14 only)

---

### 1.5 Geospatial Model Evaluation Metrics

| Task | Primary Metric | Secondary Metrics |
|------|---------------|-------------------|
| Boundary QA (EXP-001) | Hausdorff distance (m) | IoU, mean boundary error |
| Land-use classification (EXP-002) | F1-macro | Per-class F1, spatial confusion matrix |
| Flood risk (EXP-003) | AUC-ROC | Precision@K suburbs, calibration plot |
| Valuation anomaly (EXP-004) | Moran's I statistic | Recall of known anomalies, FPR |

**Spatial cross-validation:** Block CV with 5 km × 5 km folds to prevent spatial leakage. Folds never cross the Cape Town bounding box.

---

## 2. Experiment Proposals (EXP-001 through EXP-004)

### EXP-001 — Suburb Boundary Baseline (Priority: HIGH)
**Hypothesis:** OSM suburb polygons match CoCT official boundaries within 50 m Hausdorff tolerance.

| Field | Value |
|-------|-------|
| Datasets | ds-003 (Cadastral), ds-004 (OSM) |
| Model | Geometric comparison — no ML training required |
| Compute | CPU-only, < 1h |
| POPIA sensitivity | Low |
| Required before | EXP-002 (establishes spatial reference baseline) |

**Why first:** Zero ML training cost; validates spatial reference integrity before more complex experiments.

---

### EXP-002 — Land-Use Change Detection (Priority: HIGH)
**Hypothesis:** Sentinel-2 time-series (2020–2024) can classify 6 CoCT IZS land-use categories at ≥ 85% F1-macro.

| Field | Value |
|-------|-------|
| Datasets | Sentinel-2 L2A (external), ds-002 (IZS zoning as labels) |
| Model | U-Net with ResNet-34 encoder (transfer from ImageNet) |
| Compute | GPU preferred (NVIDIA RTX or T4), ~4h |
| POPIA sensitivity | None (satellite imagery + zoning codes) |
| Baseline | Random forest on spectral bands only |

**Decision gate:** If F1-macro < 75% at epoch 20, switch to ConvMixer or XGBoost on hand-crafted features.

---

### EXP-003 — Flood-Risk Proxy Model (Priority: MEDIUM)
**Hypothesis:** DEM + impervious surface features predict NDVI-inferred flood extent at suburb level with AUC-ROC ≥ 0.80.

| Field | Value |
|-------|-------|
| Datasets | CoCT DEM 2020, SANBI VEGMAP, SAWS rainfall (external) |
| Model | Logistic regression baseline → gradient boosting (XGBoost) |
| Compute | CPU-only, ~2h |
| POPIA sensitivity | None |
| Validation | 5-fold block spatial CV |

---

### EXP-004 — GV Roll Valuation Anomaly Detection (Priority: MEDIUM)
**Hypothesis:** Spatial autocorrelation (Moran's I) flags under/over-valued parcels in GV Roll 2022.

| Field | Value |
|-------|-------|
| Datasets | ds-001 (GV Roll 2022, PII-stripped) |
| Model | Spatial lag model + Local Moran's I (PySAL/esda) |
| Compute | CPU-only, ~1h |
| POPIA sensitivity | HIGH — GV Roll PII must be stripped (Full_Names) before ingestion |
| Blocker | OQ-003/OQ-018: Confirm GV Roll column headers before running |

---

## 3. Recommended Execution Order

```
EXP-001 (baseline, CPU) → EXP-002 (GPU, 4h) → EXP-003 (CPU, 2h) → EXP-004 (CPU, POPIA cleared)
```

EXP-002 and EXP-003 can run in parallel if GPU and CPU are both available.

---

## 4. Open Research Questions

| ID | Question | Blocking |
|----|----------|---------|
| OQ-003/018 | Does GV Roll 2022 contain `Full_Names`? Must confirm before EXP-004 | EXP-004 |
| OQ-016 | OpenSky commercial licensing — limits EXP-005 (future flight tracking experiment) | Future |
| OQ-Sentinel | Copernicus Sentinel-2 data access: confirm API key or direct S3 access | EXP-002 |

# Experiment Registry

**Lab:** CapeTown GIS Autonomous Research Lab
**Maintained by:** Research orchestration agent + human review
**Source of truth:** `registry.json` (machine-readable) — this file is the human-readable view.

> Keep rows sorted by EXP-ID ascending. Update `registry.json` in the same commit.

---

## Status Legend

| Status | Meaning |
|--------|---------|
| `PROPOSED` | Experiment defined but not yet started |
| `RUNNING` | Actively executing (CI job or manual run in progress) |
| `COMPLETED` | Finished; artefacts available in `artifacts/EXP-NNN/` |
| `ARCHIVED` | Completed and frozen; no further changes expected |

---

## Experiment Index

| EXP-ID | Name | Status | Phase | Hypothesis (short) | Datasets | Metrics | Created |
|--------|------|--------|-------|--------------------|----------|---------|---------|
| EXP-001 | Suburb Boundary Baseline | `PROPOSED` | C | OSM suburb polygons match CoCT official boundaries within 50 m tolerance | CoCT Official Boundaries 2023, OSM Western Cape | Hausdorff distance, IoU | 2026-03-09 |
| EXP-002 | Land-Use Change Detection | `PROPOSED` | E | Sentinel-2 time-series can classify 6 CoCT land-use categories at ≥ 85 % F1 | Sentinel-2 L2A 2020–2024, CoCT Zoning 2022 | F1 (macro), spatial confusion matrix | 2026-03-09 |
| EXP-003 | Flood-Risk Proxy Model | `PROPOSED` | E | DEM + impervious-surface features predict NDVI-inferred flood extent at suburb level | CoCT DEM 2020, SANBI VEGMAP, SAWS rainfall | AUC-ROC, precision@k suburbs | 2026-03-09 |
| EXP-004 | GV Roll Valuation Anomaly | `PROPOSED` | F | Spatial autocorrelation (Moran's I) can flag under/over-valued parcels in GV Roll 2022 | CoCT GV Roll 2022, Cadastral parcels | Moran's I, recall of known anomalies | 2026-03-09 |

---

## Adding a New Experiment

1. Copy the template row below into the table (sorted by EXP-ID).
2. Add the corresponding entry to `registry.json`.
3. Create `experiments/EXP-NNN/manifest.yaml`.
4. Create `compliance/EXP-NNN-pia.md` from the POPIA template.

```markdown
| EXP-NNN | Short Name | `PROPOSED` | [A-K] | One-sentence hypothesis | Dataset list | Metric list | YYYY-MM-DD |
```

---

*Last updated: 2026-03-09*

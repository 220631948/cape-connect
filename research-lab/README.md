# Autonomous GIS Research Lab

**Project:** CapeTown GIS Hub (`capegis`)
**Scope:** City of Cape Town + Western Cape Province — `{ west: 18.0, south: -34.5, east: 19.5, north: -33.0 }`
**Compliance:** POPIA-aligned · FAIR data principles · Reproducible-by-default

> Parallel research track for the CapeTown GIS Hub.
> Does **not** replace the M0–M15 milestone plan.

---

## Purpose

This lab provides a structured, reproducible environment for geospatial machine-learning experiments that feed directly into the CapeTown GIS Hub platform. Every experiment:

- operates exclusively within the Cape Town / Western Cape bounding box,
- treats personal and location data as protected under POPIA,
- is traceable from raw dataset ingestion through model artefact to production deployment, and
- produces outputs that can be audited, reproduced, or archived without re-running the full pipeline.

---

## Lab Phases (A–K)

| Phase | Name | One-liner |
|-------|------|-----------|
| **A** | Foundation | Bootstrap lab scaffolding, tooling, and CI gates |
| **B** | Data Ingestion | Ingest and validate Cape Town open datasets (CoCT, SANBI, OSM) |
| **C** | Spatial Baseline | Establish baseline geospatial metrics and coverage maps |
| **D** | Feature Engineering | Derive ML-ready features from PostGIS + raster sources |
| **E** | Model Training | Train and track geospatial models (land-use, risk, valuation) |
| **F** | Evaluation | Benchmark models against held-out spatial partitions |
| **G** | Compliance Audit | POPIA PIA, anonymisation checks, data-minimisation review |
| **H** | Explainability | SHAP / LIME attribution maps for spatial predictions |
| **I** | Integration | Publish model endpoints and tile artefacts to capegis platform |
| **J** | Monitoring | Drift detection, retraining triggers, SLA tracking |
| **K** | Archival | Long-term storage, FAIR metadata, DOI minting |

---

## Directory Structure

```
research-lab/
├── README.md               ← This file
├── REGISTRY.md             ← Human-readable experiment index
├── registry.json           ← Machine-readable experiment registry (schema-validated)
├── docs/                   ← Architecture docs, runbooks, ADRs
├── experiments/            ← One sub-directory per EXP-NNN (manifest + outputs)
├── datasets/               ← Versioned raw and processed dataset descriptors
├── containers/             ← Dockerfiles and compose files for reproducible envs
├── artifacts/              ← Trained models, evaluation reports, exported tiles
├── notebooks/              ← Jupyter / Marimo notebooks (exploratory, read-only in CI)
├── compliance/             ← POPIA PIAs, anonymisation scripts, audit logs
├── evaluation/             ← Shared evaluation harnesses and metric definitions
└── provenance/             ← Lineage records linking inputs → experiments → outputs
```

---

## Running an Experiment

1. **Propose** — Add a row to `REGISTRY.md` and `registry.json` with status `PROPOSED`.
2. **Define** — Create `experiments/EXP-NNN/manifest.yaml` (datasets, hyperparams, metrics, POPIA classification).
3. **Validate** — Run `scripts/validate_manifest.py experiments/EXP-NNN/manifest.yaml`.
4. **Execute** — Launch via `docker compose -f containers/EXP-NNN.yml up` or the CI workflow `.github/workflows/lab-run.yml`.
5. **Evaluate** — Results land in `artifacts/EXP-NNN/`; metrics are written to `evaluation/results/EXP-NNN.json`.
6. **Audit** — Compliance agent checks `compliance/EXP-NNN-pia.md` before promotion.
7. **Archive** — Update registry status to `COMPLETED` or `ARCHIVED`; freeze provenance record.

---

## Key Files

| File | Purpose |
|------|---------|
| `REGISTRY.md` | Human-readable index of all experiments |
| `registry.json` | Machine-readable registry consumed by CI and dashboard |
| `docs/LAB_ARCHITECTURE.md` | Agent collaboration model and system design |
| `compliance/popia-template.md` | PIA template for new experiments |
| `evaluation/metrics.py` | Shared spatial metric definitions |

---

## FAIR Data Principles

| Principle | Implementation |
|-----------|---------------|
| **Findable** | Every dataset and artefact has a unique identifier in `registry.json` |
| **Accessible** | Datasets reference open CoCT / SANBI URLs or Supabase Storage paths |
| **Interoperable** | Outputs use GeoJSON (EPSG:4326) or PMTiles; metadata in JSON-LD |
| **Reusable** | Experiment manifests pin exact versions; containers are pinned and archived |

---

## Core Research Mandates

1. **Reproducibility** — every experiment reproducible from manifests + environment descriptors
2. **Traceability** — provenance metadata for datasets, code, models, environments
3. **FAIR data** — datasets follow FAIR principles with license validation
4. **Privacy** — POPIA compliance enforced for all sensitive geospatial data
5. **Scientific rigor** — proper baselines, statistical testing, holdout evaluation

## Integration with capegis

Research outputs feed into the PWA product pipeline:
- Vector tiles → M3 (MapLibre Base Map), M4 (Layer Management)
- Offline sync → M6 (PWA + Offline)
- ML models → M10+ (Advanced Features)
- Compliance artifacts → M2 (Auth/RBAC/POPIA)

---

## POPIA / Compliance Note

> **This lab operates under the Protection of Personal Information Act (POPIA), South Africa.**

- No personal identifiers (names, ID numbers, contact details) may enter a dataset without explicit purpose limitation documented in the PIA (`compliance/EXP-NNN-pia.md`).
- Location data that can identify an individual's home or routine movements is classified as **sensitive** and requires data-minimisation review before use.
- Aggregated or anonymised spatial outputs (e.g., suburb-level statistics) are preferred over individual-level records.
- Data subjects' rights (access, correction, deletion, objection) must be honoured; see `compliance/data-subject-rights.md`.

All experiments inherit the POPIA annotation requirement from `CLAUDE.md` Rule 5.

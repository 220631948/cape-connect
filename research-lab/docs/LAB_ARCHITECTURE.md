# Lab Architecture

**Lab:** CapeTown GIS Autonomous Research Lab
**Version:** 1.0.0 · 2026-03-09

---

## Overview

The lab is governed by a multi-agent architecture where specialised agents collaborate through a shared **experiment manifest** contract. No agent operates directly on raw data or production systems without passing through the manifest validation gate and (where required) the compliance gate.

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Research Orchestrator                        │
│  (reads REGISTRY.md + registry.json, assigns tasks, tracks state)  │
└────────────┬──────────┬──────────┬──────────┬──────────────────────┘
             │          │          │          │
     ┌───────▼──┐  ┌────▼───┐  ┌──▼─────┐  ┌▼──────────┐
     │ Planning │  │  Data  │  │ Model  │  │    Ops     │
     │  Agent   │  │ Agent  │  │ Agent  │  │   Agent    │
     └───────┬──┘  └────┬───┘  └──┬─────┘  └┬──────────┘
             │          │          │          │
             └──────────┴──────────┴──────────┘
                                │
                    ┌───────────▼──────────┐
                    │  Compliance Agent    │
                    │  (POPIA gate + PIA)  │
                    └──────────────────────┘
```

---

## Agents

### 1. Research Orchestrator

**Role:** Central coordinator. Reads `registry.json` to discover experiments in `PROPOSED` state, assigns them to the appropriate agent pipeline, and updates status on completion or failure.

**Inputs:** `registry.json`, `REGISTRY.md`, CI trigger events
**Outputs:** Agent task assignments, status updates to registry
**File:** `.github/copilot/agents/orchestrator.agent.md`

---

### 2. Planning Agent

**Role:** Translates a scientific hypothesis into a concrete, executable experiment manifest (`experiments/EXP-NNN/manifest.yaml`). It selects datasets, defines train/val/test spatial splits, specifies hyperparameter search spaces, and identifies POPIA risk level.

**Inputs:** Hypothesis text, available dataset catalogue (`datasets/`), phase constraints
**Outputs:** `experiments/EXP-NNN/manifest.yaml`, `compliance/EXP-NNN-pia.md` (draft)
**Key decisions:**
- Spatial cross-validation strategy (suburb-level hold-out to prevent spatial leakage)
- Dataset version pinning
- POPIA sensitivity classification

---

### 3. Data Agent

**Role:** Ingests, validates, and version-stamps datasets referenced in the manifest. Enforces the three-tier fallback (`LIVE → CACHED → MOCK`) and applies anonymisation transforms required by the compliance agent.

**Inputs:** `experiments/EXP-NNN/manifest.yaml` (dataset section)
**Outputs:** Versioned dataset descriptors in `datasets/`, provenance records in `provenance/`
**Constraints:**
- All spatial data stored as EPSG:4326 GeoJSON or PostGIS geometry
- Max 10,000 features per client-side layer; larger datasets go to Martin MVT
- No Lightstone data (CLAUDE.md Rule 8); valuation source is CoCT GV Roll 2022 only

---

### 4. Model Agent

**Role:** Executes model training and evaluation as specified in the manifest. Runs inside a pinned Docker container (`containers/EXP-NNN.yml`) for full reproducibility. Writes metrics to `evaluation/results/EXP-NNN.json` and model weights to `artifacts/EXP-NNN/`.

**Inputs:** Versioned datasets (from Data Agent), manifest hyperparameters
**Outputs:** Trained model artefact, evaluation metrics, spatial prediction GeoJSON / PMTiles
**Framework support:** scikit-learn, PyTorch, LightGBM, Rasterio / GDAL pipelines

---

### 5. Ops Agent

**Role:** Handles environment provisioning (Docker image builds, CI orchestration) and promotes validated artefacts to the capegis platform (Supabase Storage, Martin tile server, Vercel edge cache).

**Inputs:** Compliance-approved artefacts from `artifacts/EXP-NNN/`
**Outputs:** Deployed tile layers, API endpoints, updated `registry.json` status
**Gate:** Will not promote until Compliance Agent has signed off the PIA

---

### 6. Compliance Agent

**Role:** POPIA privacy-impact assessment reviewer and gate. Checks every experiment for data-minimisation compliance, anonymisation adequacy, and correct POPIA annotation before any personal or location data enters the pipeline or any output is published.

**Inputs:** `compliance/EXP-NNN-pia.md`, dataset descriptors, model outputs
**Outputs:** Signed-off PIA or rejection with remediation notes
**Checks performed:**
- Personal identifiers removed or pseudonymised
- Location data aggregated to ≥ suburb level before publication
- Lawful basis documented
- Data subject rights mechanism in place
- Retention period set and enforced

---

## Experiment Manifest Contract

All agents communicate through `experiments/EXP-NNN/manifest.yaml`. The manifest is the single source of truth for an experiment run.

```yaml
# experiments/EXP-NNN/manifest.yaml (schema outline)
id: EXP-NNN
name: "Human-readable name"
phase: C                      # A–K
hypothesis: "..."
popia_sensitive: false        # true triggers mandatory PIA gate

datasets:
  - id: "dataset-slug"
    version: "2023-01"
    source: "https://..."     # or supabase://bucket/path

spatial_split:
  strategy: suburb_holdout
  test_suburbs: ["Cape Town CBD", "Mitchells Plain"]

model:
  framework: lightgbm
  hyperparameters:
    n_estimators: [100, 500]
    max_depth: [4, 6, 8]

metrics:
  - f1_macro
  - auc_roc

container: containers/EXP-NNN.yml
artifacts_dir: artifacts/EXP-NNN/
pia: compliance/EXP-NNN-pia.md
```

---

## Collaboration Flow

```
Planning Agent
  └─ writes manifest.yaml + draft PIA
        │
        ▼
Compliance Agent
  └─ reviews PIA; approves or rejects
        │ (approved)
        ▼
Data Agent
  └─ ingests + validates datasets; writes provenance
        │
        ▼
Model Agent
  └─ trains + evaluates; writes artefacts + metrics
        │
        ▼
Compliance Agent
  └─ reviews outputs for PII leakage
        │ (approved)
        ▼
Ops Agent
  └─ promotes to production; updates registry status → COMPLETED
```

---

## Reproducibility Guarantees

1. **Container pinning:** every experiment container image is built from a content-addressed Dockerfile in `containers/`.
2. **Dataset versioning:** dataset descriptors in `datasets/` include content hash and retrieval timestamp.
3. **Seed locking:** all random seeds are set via manifest and logged to `provenance/`.
4. **Metric determinism:** evaluation harnesses in `evaluation/` are version-controlled and shared across experiments.

---

*Architecture v1.0.0 · 2026-03-09 · CapeTown GIS Hub research-lab*

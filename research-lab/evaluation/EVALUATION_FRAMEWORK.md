# Phase F — Evaluation Framework Specification
## CapeTown GIS Research Lab

> **Status:** COMPLETE  
> **Applies to:** EXP-001 through EXP-004 and all future experiments  
> Last updated: 2026-03-09

---

## 1. Spatial Cross-Validation Strategy

All experiments use **block spatial cross-validation** to prevent spatial leakage.

```
┌──────────────────────────────────┐
│  Cape Town bounding box          │
│  west:18.0  east:19.5            │
│  south:-34.5  north:-33.0        │
│                                  │
│  ┌─────┬─────┬─────┬─────┐      │
│  │  F1 │  F2 │  F3 │  F4 │      │
│  ├─────┼─────┼─────┼─────┤      │
│  │  F5 │  F6 │  F7 │  F8 │      │
│  └─────┴─────┴─────┴─────┘      │
│  Block size: 5 km × 5 km        │
│  n_folds: 5 (stratified by class)│
└──────────────────────────────────┘
```

### Fold Construction Rules
- Spatial blocks are `5 km × 5 km` in EPSG:3857 (projected for distance accuracy)
- Blocks are assigned to folds using stratified sampling (class balance preserved)
- Test fold never overlaps train fold geographically
- Buffer zone: `0 km` (conservative; test parcels are spatially isolated by fold boundary)
- Seed: `42` for all fold assignments

---

## 2. Metrics Reference Table

| Experiment | Task | Primary Metric | Secondary Metrics | Baseline |
|------------|------|---------------|-------------------|---------|
| EXP-001 | Geometric comparison | Hausdorff distance (m) | IoU, % within 50 m | N/A |
| EXP-002 | Semantic segmentation | F1-macro | Per-class F1, IoU-macro | Random Forest |
| EXP-003 | Binary classification | AUC-ROC | Precision@K=10, Brier score | Logistic Regression |
| EXP-004 | Spatial autocorrelation | Global Moran's I | LISA % flagged, FDR-corrected p | None (first-run) |

### Metric Definitions

```python
# EXP-001
hausdorff_distance_median_m: median(hausdorff(geom_osm, geom_coct)) in metres
iou: intersection_area / union_area  # per polygon pair

# EXP-002
f1_macro: mean(f1_per_class)  # unweighted mean across 6 classes
iou_macro: mean(iou_per_class)

# EXP-003
auc_roc: area_under_roc_curve(y_true, y_score)
precision_at_k: precision(top_k_ranked_suburbs)

# EXP-004
morans_i: (n / S0) * (z' W z) / (z' z)
  where S0 = sum of spatial weights, z = demeaned log(Market_Val)
```

---

## 3. Statistical Testing Protocol

### 3.1 Test Selection Matrix

| Comparison | Test | Assumptions |
|------------|------|------------|
| U-Net vs RF baseline (EXP-002) | McNemar test | Paired, binary outcomes per sample |
| Pre/post model (EXP-003) | Wilcoxon signed-rank | Non-parametric, paired |
| Distance distribution (EXP-001) | Shapiro-Wilk → t-test or Mann-Whitney | Normality check first |
| Spatial randomness (EXP-004) | Permutation test (n=999) | No distribution assumption |

### 3.2 Multiple Testing Correction

When reporting LISA statistics (EXP-004), apply **Benjamini-Hochberg FDR correction** at q=0.05.

```python
from statsmodels.stats.multitest import multipletests
reject, p_corrected, _, _ = multipletests(p_values, alpha=0.05, method='fdr_bh')
```

### 3.3 Confidence Intervals

Bootstrap CI (n=1,000, seed=42) for all primary metrics:

```python
from sklearn.utils import resample
import numpy as np

def bootstrap_ci(metric_fn, y_true, y_pred, n=1000, alpha=0.05, seed=42):
    rng = np.random.default_rng(seed)
    scores = []
    for _ in range(n):
        idx = rng.integers(0, len(y_true), len(y_true))
        scores.append(metric_fn(y_true[idx], y_pred[idx]))
    lo, hi = np.quantile(scores, [alpha/2, 1 - alpha/2])
    return float(np.mean(scores)), float(lo), float(hi)
```

---

## 4. Leaderboard Format

All experiment results are written to `research-lab/evaluation/leaderboard.json`:

```json
{
  "generated_at": "2026-03-09T00:00:00Z",
  "entries": [
    {
      "exp_id": "EXP-002",
      "model": "UNet-ResNet34",
      "primary_metric": "f1_macro",
      "value": 0.0,
      "ci_lower": 0.0,
      "ci_upper": 0.0,
      "baseline_value": 0.0,
      "delta_vs_baseline": 0.0,
      "status": "PROPOSED",
      "run_date": null
    }
  ]
}
```

---

## 5. Evaluation Harness

Evaluation results for each experiment are saved to `experiments/EXP-NNN/results/metrics_summary.json`:

```json
{
  "exp_id": "EXP-NNN",
  "run_id": "run-YYYY-MM-DD-HH",
  "model": "model_name",
  "metrics": {
    "primary_metric_name": {"value": 0.0, "ci_lower": 0.0, "ci_upper": 0.0},
    "secondary_metric_name": {"value": 0.0}
  },
  "baseline_metrics": {},
  "statistical_tests": {},
  "n_samples": 0,
  "cv_folds": 5,
  "seed": 42
}
```

---

## 6. Spatial Residual Diagnostics

After each model prediction, run residual spatial autocorrelation to detect unmodelled structure:

```python
import esda, libpysal

w = libpysal.weights.Queen.from_dataframe(gdf)
w.transform = 'r'
mi = esda.Moran(residuals, w)
print(f"Moran's I on residuals: {mi.I:.3f} (p={mi.p_sim:.3f})")
# If p < 0.05: spatial structure remains; consider spatial lag model
```

---

## 7. Reporting Template

Each experiment produces a `notebooks/EXP-NNN-analysis.ipynb` with sections:

1. **Setup** — load manifest, set seeds, load data
2. **Data validation** — geometry checks, class distribution, CRS verification
3. **Model training** (if applicable)
4. **Evaluation** — metrics, CI, statistical tests
5. **Spatial diagnostics** — Moran's I on residuals
6. **Leaderboard entry** — write `metrics_summary.json`
7. **POPIA check** — assert no PII in outputs (automated assertion)

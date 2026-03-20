# Phase K — Continuous Research Operations (R-Ops) Plan
## CapeTown GIS Research Lab

> **Status:** SPECIFICATION  
> **Applies to:** Production model monitoring, data health, periodic retraining  
> Last updated: 2026-03-09

---

## 1. R-Ops Schedule

| Task | Frequency | Trigger | Owner Agent |
|------|-----------|---------|-------------|
| Data freshness check | Daily | Cron `0 6 * * *` | data-agent |
| OSM boundary drift check (EXP-001 re-run) | Weekly | Cron `0 4 * * 1` | spatial-agent |
| Land-use model shadow inference (EXP-002) | Monthly | Cron `0 2 1 * *` | immersive-reconstruction-agent |
| Flood risk model re-score | Quarterly | Manual + cron `0 3 1 */3 *` | spatial-agent |
| GV Roll anomaly refresh (EXP-004) | Per GV Roll release (~4-yearly) | Manual trigger | db-agent |
| License compliance re-audit | Quarterly | Cron `0 5 1 */3 *` | Compliance agent |

---

## 2. Model Drift Detection

### 2.1 Shadow Inference Protocol (EXP-002)

Run new Sentinel-2 scene through current land-use model monthly; compare output distribution to training-time distribution using Jensen-Shannon divergence:

```python
# research-lab/rops/drift_detect.py
import numpy as np
from scipy.spatial.distance import jensenshannon

def detect_class_distribution_drift(
    reference_dist: np.ndarray,  # Training set class distribution
    current_dist: np.ndarray,    # Latest inference class distribution
    threshold: float = 0.1       # JS divergence threshold
) -> dict:
    jsd = jensenshannon(reference_dist, current_dist)
    return {
        'jsd': float(jsd),
        'drift_detected': jsd > threshold,
        'action': 'RETRAIN' if jsd > threshold else 'OK'
    }
```

### 2.2 Performance Regression Check

After any model update, run evaluation harness on held-out spatial test fold. If primary metric drops > 2 percentage points vs baseline: **automatic rollback** (revert to previous PMTiles artifact in Supabase Storage).

```bash
# Rollback procedure
supabase storage cp \
  research-tiles/EXP-002/previous/predictions.pmtiles \
  research-tiles/EXP-002/predictions.pmtiles
```

---

## 3. Data Health Checks

```yaml
# research-lab/rops/health-checks.yaml
checks:
  - name: osm_amenities_freshness
    dataset: ds-004
    max_age_days: 7
    query: "SELECT MAX(updated_at) FROM osm_cache WHERE dataset = 'amenities'"
    alert_if: age_days > max_age_days

  - name: gv_roll_row_count
    dataset: ds-001
    expected_min_rows: 800000
    query: "SELECT COUNT(*) FROM valuation_data"
    alert_if: count < expected_min_rows

  - name: cadastral_geometry_validity
    dataset: ds-003
    query: "SELECT COUNT(*) FROM cadastral_parcels WHERE NOT ST_IsValid(geom)"
    alert_if: count > 0
    action: "ST_MakeValid(geom) repair run"

  - name: pii_leak_scan
    datasets: [ds-001]
    query: >
      SELECT COUNT(*) FROM valuation_data
      WHERE owner_name IS NOT NULL
      OR full_names IS NOT NULL
    alert_if: count > 0
    severity: CRITICAL
    action: IMMEDIATE_ESCALATION
```

---

## 4. GitHub Actions Workflow — R-Ops Scheduler

```yaml
# .github/workflows/rops-scheduler.yml
name: R-Ops Scheduled Tasks

on:
  schedule:
    - cron: '0 6 * * *'    # Daily data freshness
    - cron: '0 4 * * 1'    # Weekly OSM drift
    - cron: '0 2 1 * *'    # Monthly shadow inference
    - cron: '0 5 1 */3 *'  # Quarterly compliance re-audit
  workflow_dispatch:
    inputs:
      task:
        type: choice
        options: [data-health, osm-drift, shadow-inference, compliance-audit]

jobs:
  rops-task:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run R-Ops task
        run: |
          docker run --rm \
            -v $(pwd)/research-lab:/workspace \
            capegis-research:latest \
            research-lab/rops/run_task.py \
            --task ${{ github.event.inputs.task || 'data-health' }}
      - name: Post results to registry
        run: |
          python research-lab/rops/post_results.py \
            --registry research-lab/registry.json
      - name: Alert on drift/regression
        if: failure()
        uses: actions/github-script@v7
        with:
          script: |
            github.rest.issues.create({
              owner: context.repo.owner,
              repo: context.repo.repo,
              title: 'R-Ops Alert: Model drift or data health failure',
              body: 'Automated R-Ops check failed. Review research-lab/rops/logs/.',
              labels: ['rops', 'automated']
            })
```

---

## 5. Rollback & Lifecycle Policy

| Artifact Type | Retention | Rollback Trigger |
|---------------|-----------|-----------------|
| PMTiles (production) | Current + 2 previous versions | Primary metric regression > 2 pp |
| Model checkpoints | Best + last 5 | Any eval failure on holdout |
| Provenance logs | Indefinite | N/A (audit trail) |
| Raw experiment results | 90 days | N/A |
| Compliance audit logs | 5 years (POPIA) | N/A |

---

## 6. Experiment Lifecycle States

```
PROPOSED → RUNNING → COMPLETED → INTEGRATED → DEPRECATED
                ↓
            FAILED → RETRYING → COMPLETED / ABANDONED
```

Transitions are recorded in `research-lab/registry.json` with timestamps and agent responsible.

---

## 7. Open R-Ops Actions

| Priority | Action | Blocking |
|----------|--------|---------|
| HIGH | Implement PII leak scan as pre-commit hook | OQ-014 (keys) |
| HIGH | Wire GitHub Actions rops-scheduler.yml once M1 is merged | M1 milestone |
| MEDIUM | Configure Sentry alerts for R-Ops failures | Optional |
| LOW | Integrate MLflow experiment tracking with registry | Phase 2 |

# Phase K — Continuous Research Operations (R-Ops)

> **Status:** Stubbed

## Purpose

Schedule recurring experiments for drift detection, model retraining, and data health monitoring.

## R-Ops Components

1. **Data health checks** — schema validation, freshness monitoring, quality metrics
2. **Model monitoring** — prediction drift detection, performance regression alerts
3. **Automated retraining** — triggered by drift thresholds or data updates
4. **Experiment lifecycle** — archive completed experiments, clean up resources

## Monitoring Signals

| Signal | Source | Threshold | Action |
|--------|--------|-----------|--------|
| Data freshness | Dataset manifest `last_fetched` | > 30 days | Alert + re-fetch |
| Schema drift | Dataset validation | Any schema change | Alert + review |
| Model accuracy drift | Shadow evaluation | > 5% degradation | Retrain |
| Resource usage | Container metrics | > budget | Alert + optimize |

## Future Work

- [ ] Data health check script (reads manifests, validates schemas)
- [ ] Model monitoring harness
- [ ] Automated retraining pipeline
- [ ] Experiment archival and cleanup automation
- [ ] Cost tracking and budget alerts

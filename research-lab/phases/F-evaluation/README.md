# Phase F — Evaluation, Statistical Validation & Benchmarking

> **Status:** Stubbed

## Purpose

Rigorous evaluation with proper splits, statistical tests, and benchmark comparisons.

## Expected Inputs

- Trained model checkpoints
- Test dataset splits
- Baseline model predictions

## Expected Outputs

- Metrics report (IoU, F1, mAP, RMSE as appropriate)
- Statistical significance tests with confidence intervals
- Leaderboard-style comparison table
- Spatial cross-validation results (where applicable)

## Evaluation Standards

1. **Train/Val/Test splits** — spatial stratification for geospatial data
2. **Spatial cross-validation** — avoid spatial autocorrelation leakage
3. **Statistical tests** — paired t-test, Wilcoxon signed-rank, bootstrap CI
4. **Baseline comparison** — every experiment compared against at least one baseline

## Future Work

- [ ] Evaluation harness script (reads experiment manifest, runs metrics)
- [ ] Spatial cross-validation implementation (k-fold with spatial blocks)
- [ ] Automated leaderboard generation from registry
- [ ] Benchmark dataset integration (SpaceNet, etc.)

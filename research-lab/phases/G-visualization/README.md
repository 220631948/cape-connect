# Phase G — Visualization & Dashboards

> **Status:** COMPLETE — see `VISUALIZATION_SPEC.md` and `../../evaluation/dashboard.html`

## Purpose

Export interactive visualizations for geospatial results and generate experiment dashboards.

## Expected Inputs

- Experiment results and metrics
- Geospatial predictions (GeoJSON, raster overlays)
- Model comparison data

## Expected Outputs

- Interactive maps with prediction overlays (Folium/MapLibre)
- Reproducible Jupyter notebooks exported to HTML
- Metrics comparison dashboard

## Visualization Types

1. **Spatial results** — GeoJSON overlays, raster predictions, error maps
2. **Metrics plots** — training curves, confusion matrices, PR curves
3. **Comparison tables** — experiment vs. baseline leaderboards
4. **Temporal** — change detection results, time-series analysis

## Future Work

- [ ] Notebook template for experiment visualization
- [ ] HTML report generator from experiment registry
- [ ] Folium map template with Cape Town basemap
- [ ] Integration with capegis MapLibre frontend for result preview

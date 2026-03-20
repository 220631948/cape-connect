# Phase G — Visualization & Dashboards Specification
## CapeTown GIS Research Lab

> **Status:** COMPLETE  
> **Tools:** Folium (interactive maps), Matplotlib/Seaborn (metrics), HTML export  
> Last updated: 2026-03-09

---

## 1. Visualization Types by Experiment

| Experiment | Map Viz | Metrics Viz | Export Format |
|------------|---------|-------------|---------------|
| EXP-001 | Boundary comparison overlay (Folium) | Hausdorff distance histogram | HTML + GeoJSON |
| EXP-002 | Land-use prediction raster overlay | Confusion matrix, training curve, per-class F1 | HTML + GeoTIFF |
| EXP-003 | Flood-risk choropleth (Folium) | ROC curve, SHAP beeswarm | HTML + GeoJSON |
| EXP-004 | LISA cluster map (HH/LL/HL/LH) | Moran scatter plot, p-value distribution | HTML + GeoJSON |

---

## 2. Cape Town Folium Base Map Template

```python
# research-lab/phases/G-visualization/base_map.py
"""
Shared Folium basemap template for all CapeTown GIS experiment visualizations.
Enforces: CartoDB attribution, Cape Town bounding box, dark tile layer.
"""
import folium
from folium import plugins

CAPE_TOWN_CENTER = [-33.9249, 18.4241]  # [lat, lng]
BBOX = {
    'west': 18.0, 'south': -34.5,
    'east': 19.5, 'north': -33.0
}

def create_base_map(
    zoom_start: int = 11,
    tiles: str = 'CartoDB dark_matter',
) -> folium.Map:
    """Create a Cape Town-centred Folium map with CartoDB dark basemap."""
    m = folium.Map(
        location=CAPE_TOWN_CENTER,
        zoom_start=zoom_start,
        tiles=tiles,
        attr='© CARTO | © OpenStreetMap contributors',  # CLAUDE.md Rule 6
        max_bounds=True,
        min_zoom=8,
        max_zoom=18,
    )
    # Enforce Cape Town bounding box
    m.fit_bounds([[BBOX['south'], BBOX['west']], [BBOX['north'], BBOX['east']]])
    return m


def add_geojson_layer(
    m: folium.Map,
    geojson_path: str,
    layer_name: str,
    style_fn=None,
    tooltip_fields: list[str] | None = None,
) -> folium.Map:
    """Add a GeoJSON layer with optional styling and tooltip."""
    import json
    with open(geojson_path) as f:
        data = json.load(f)

    folium.GeoJson(
        data,
        name=layer_name,
        style_function=style_fn or (lambda x: {
            'fillOpacity': 0.5,
            'weight': 1,
            'color': '#ffffff',
        }),
        tooltip=folium.GeoJsonTooltip(fields=tooltip_fields or []) if tooltip_fields else None,
    ).add_to(m)

    folium.LayerControl().add_to(m)
    return m
```

---

## 3. EXP-003 Flood-Risk Choropleth

```python
# research-lab/phases/G-visualization/viz_exp003.py
import folium
import geopandas as gpd
import branca.colormap as cm
from base_map import create_base_map, add_geojson_layer

def plot_flood_risk(geojson_path: str, output_html: str) -> None:
    gdf = gpd.read_file(geojson_path)
    m = create_base_map(zoom_start=10)

    colormap = cm.LinearColormap(
        colors=['#1a9850', '#fee08b', '#d73027'],
        vmin=gdf['risk_score'].min(),
        vmax=gdf['risk_score'].max(),
        caption='Flood Risk Score (EXP-003)',
    )

    def style_fn(feature):
        score = feature['properties'].get('risk_score', 0)
        return {
            'fillColor': colormap(score),
            'fillOpacity': 0.65,
            'color': '#222',
            'weight': 0.5,
        }

    add_geojson_layer(
        m, geojson_path,
        layer_name='Flood Risk (EXP-003)',
        style_fn=style_fn,
        tooltip_fields=['suburb', 'risk_score', 'risk_rank'],
    )
    colormap.add_to(m)

    # Data badge (CLAUDE.md Rule 1)
    folium.map.Marker(
        [-34.40, 18.05],
        icon=folium.DivIcon(html='<div style="font-size:10px;color:#fff;background:#0008;padding:3px 6px;border-radius:3px">[CoCT DEM 2020 · EXP-003 · CACHED]</div>'),
    ).add_to(m)

    m.save(output_html)
    print(f"Saved: {output_html}")
```

---

## 4. EXP-004 LISA Cluster Map

```python
# research-lab/phases/G-visualization/viz_exp004.py
"""LISA cluster map — HH=red, LL=blue, HL=orange, LH=lightblue, NS=grey."""
import folium
import geopandas as gpd
from base_map import create_base_map

LISA_COLORS = {
    'HH': '#d73027',   # Hot spot — high value surrounded by high
    'LL': '#4575b4',   # Cold spot — low value surrounded by low
    'HL': '#f46d43',   # High value surrounded by low (spatial outlier)
    'LH': '#74add1',   # Low value surrounded by high (spatial outlier)
    'NS': '#cccccc',   # Not significant
}

def plot_lisa_map(geojson_path: str, output_html: str) -> None:
    gdf = gpd.read_file(geojson_path)
    m = create_base_map(zoom_start=11)

    def style_fn(feature):
        cat = feature['properties'].get('lisa_category', 'NS')
        return {
            'fillColor': LISA_COLORS.get(cat, '#cccccc'),
            'fillOpacity': 0.7,
            'color': '#333',
            'weight': 0.3,
        }

    folium.GeoJson(
        gdf.__geo_interface__,
        name='Valuation Anomaly LISA (EXP-004)',
        style_function=style_fn,
        tooltip=folium.GeoJsonTooltip(
            fields=['erf_nr', 'suburb', 'lisa_category', 'anomaly_score'],
            aliases=['ERF #', 'Suburb', 'LISA Category', 'Anomaly Score'],
        ),
    ).add_to(m)

    # Legend
    legend_html = '''
    <div style="position:fixed;bottom:40px;left:10px;z-index:1000;background:#111a;padding:8px 12px;border-radius:6px;color:#fff;font-size:11px">
      <b>LISA Clusters — EXP-004</b><br>
      <span style="color:#d73027">■</span> HH — High value cluster<br>
      <span style="color:#4575b4">■</span> LL — Low value cluster<br>
      <span style="color:#f46d43">■</span> HL — High outlier<br>
      <span style="color:#74add1">■</span> LH — Low outlier<br>
      <span style="color:#ccc">■</span> NS — Not significant<br>
      <small>[GV Roll 2022 · EXP-004 · CACHED]</small>
    </div>'''
    m.get_root().html.add_child(folium.Element(legend_html))
    folium.LayerControl().add_to(m)
    m.save(output_html)
    print(f"Saved: {output_html}")
```

---

## 5. Notebook Template

Each experiment uses a standard notebook structure saved as `notebooks/EXP-NNN-analysis.ipynb`. The template notebook covers:

1. **Setup cell** — load manifest, assert Cape Town bbox, set seed=42
2. **Data loading** — read from `results/` with geometry validation
3. **Map cell** — call `create_base_map()` + relevant overlay function
4. **Metrics cell** — primary metric + CI table (from `metrics_summary.json`)
5. **Statistical test cell** — hypothesis test output with interpretation
6. **Spatial diagnostics** — Moran's I on residuals (EXP-002/003)
7. **Leaderboard update** — write to `evaluation/leaderboard.json`
8. **POPIA assertion** — `assert_no_pii(output_files)` call

---

## 6. HTML Metrics Dashboard

`research-lab/evaluation/dashboard.html` is auto-generated by reading `leaderboard.json`:

```python
# research-lab/phases/G-visualization/generate_dashboard.py
"""
Generates research-lab/evaluation/dashboard.html from leaderboard.json.
Usage: python generate_dashboard.py
"""
import json
from pathlib import Path
from datetime import datetime

TEMPLATE = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>CapeTown GIS Research Lab — Metrics Dashboard</title>
  <style>
    body {{ background:#0f1117; color:#e0e0e0; font-family:monospace; padding:2rem; }}
    h1 {{ color:#64b5f6; }}
    table {{ border-collapse:collapse; width:100%; margin-top:1rem; }}
    th {{ background:#1e2130; color:#90caf9; padding:.5rem 1rem; text-align:left; }}
    td {{ padding:.4rem 1rem; border-bottom:1px solid #2a2d3e; }}
    .proposed {{ color:#888; }}
    .pass {{ color:#66bb6a; }}
    .fail {{ color:#ef5350; }}
    .badge {{ font-size:.7rem; background:#1e2130; padding:2px 6px; border-radius:3px; }}
  </style>
</head>
<body>
  <h1>CapeTown GIS Research Lab — Metrics Dashboard</h1>
  <p>Generated: {generated_at}</p>
  <table>
    <tr><th>Experiment</th><th>Model</th><th>Primary Metric</th><th>Value</th><th>CI 95%</th><th>vs Baseline</th><th>Status</th></tr>
    {rows}
  </table>
  <p style="color:#555;font-size:.75rem;margin-top:2rem">
    © CARTO | © OpenStreetMap contributors | CapeTown GIS Hub · CLAUDE.md Rule 6
  </p>
</body>
</html>"""

def generate_dashboard(leaderboard_path: str = 'research-lab/evaluation/leaderboard.json') -> None:
    with open(leaderboard_path) as f:
        lb = json.load(f)

    rows = ''
    for entry in lb.get('entries', []):
        status_cls = 'proposed' if entry['status'] == 'PROPOSED' else (
            'pass' if entry.get('value', 0) >= 0 else 'fail')
        delta = entry.get('delta_vs_baseline')
        delta_str = f'+{delta:.3f}' if delta and delta > 0 else (str(round(delta, 3)) if delta else '—')
        value_str = f"{entry.get('value', 0):.4f}" if entry.get('value') else '—'
        ci_str = (f"[{entry.get('ci_lower',0):.3f}, {entry.get('ci_upper',0):.3f}]"
                  if entry.get('ci_lower') is not None else '—')
        rows += (
            f"<tr class='{status_cls}'>"
            f"<td>{entry['exp_id']}</td>"
            f"<td>{entry['model']}</td>"
            f"<td>{entry['primary_metric']}</td>"
            f"<td>{value_str}</td>"
            f"<td>{ci_str}</td>"
            f"<td>{delta_str}</td>"
            f"<td><span class='badge'>{entry['status']}</span></td>"
            f"</tr>\n"
        )

    html = TEMPLATE.format(
        generated_at=datetime.utcnow().isoformat() + 'Z',
        rows=rows or '<tr><td colspan="7" class="proposed">No experiments run yet</td></tr>',
    )
    out = Path('research-lab/evaluation/dashboard.html')
    out.write_text(html)
    print(f"Dashboard written to {out}")


if __name__ == '__main__':
    generate_dashboard()
```

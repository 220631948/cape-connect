<!--
__generated_by: rebootstrap_agent
__timestamp: 2026-03-04T10:39:43Z
-->

# /optimize-tiles — Tile Optimisation

## Trigger
`/optimize-tiles` or "generate tile optimisation command" or "create Tippecanoe command"

## What It Does
Runs the `tile_optimization` skill: inspects a GeoJSON source file (or PostGIS table name), determines appropriate zoom range and simplification settings for the Cape Town GIS Hub, and outputs a ready-to-run Tippecanoe command plus a Martin config snippet.

## Invokes Skill
`map-agent` tile optimisation logic (`.github/copilot/agents/map-agent.agent.md`)

## Procedure
1. Accept input: GeoJSON file path **or** PostGIS table name
2. Determine data type from schema / feature count:
   - Cadastral parcels → zoom 14–18, high detail
   - Suburb boundaries → zoom 8–14, medium simplification
   - Zoning overlay → zoom 10–16, preserve attribute columns
   - Risk overlays → zoom 9–15, medium simplification
3. Calculate optimal `-z` (max zoom) and `-Z` (min zoom) flags
4. Choose simplification strategy (`--simplification`, `--drop-densest-as-needed`)
5. Set Cape Town bbox clip: `--clip-bounding-box=18.0,-34.5,19.5,-33.0`
6. Output Tippecanoe CLI command
7. Output corresponding Martin `config.yml` source block
8. Estimate output PMTiles file size (rough heuristic)

## Expected Output
```
Tile Optimisation — [data source] — [date]
=====================================
Source: [file.geojson | table: cadastral_parcels]
Features: [N]
Recommended zoom range: [Zmin]–[Zmax]

Tippecanoe command:
  tippecanoe \
    --output=public/mock/[layer].pmtiles \
    --minimum-zoom=[Z] \
    --maximum-zoom=[Z] \
    --clip-bounding-box=18.0,-34.5,19.5,-33.0 \
    --simplification=4 \
    --drop-densest-as-needed \
    --attribute-type=[prop]:string \
    --layer=[layer_name] \
    [input.geojson]

Martin config snippet (martin/config.yml):
  [layer_name]:
    schema: public
    table: [table]
    srid: 4326
    geometry_column: geom
    minzoom: [Z]
    maxzoom: [Z]
    properties:
      - [prop1]
      - [prop2]

Estimated PMTiles size: ~[N] MB
Upload to: Supabase Storage → tiles/[layer].pmtiles
```

## When NOT to Use
- On raster data (use GDAL `gdal2tiles` instead)
- When the feature count is < 500 — serve as plain GeoJSON from `public/mock/` instead
- When the layer already has a validated Tippecanoe config in `scripts/generate-tiles.sh` (avoid duplicate configs)

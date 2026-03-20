# Open Public Datasets — CapeTown GIS Hub

> **Scope:** Cape Town + Western Cape ONLY (CLAUDE.md Rule 9: bbox 18.0/-34.5/19.5/-33.0)
> **Rule 8:** No Lightstone data. All sources listed here are open/public.
> **Last updated:** 2026-03-11 | Agent: Claude Sonnet 4.6

---

## Dataset Catalog

| # | Dataset | URL | License | Format | CRS | Target Table | Mock Path | Status |
|---|---------|-----|---------|--------|-----|-------------|-----------|--------|
| 1 | OSM South Africa extract | https://download.geofabrik.de/africa/south-africa.html | ODbL | .osm.pbf | WGS84 | `osm_features` | `public/mock/osm-sample.geojson` | PLANNED |
| 2 | StatsSA Census 2022 boundaries | https://www.statssa.gov.za/?page_id=1854 | CC-BY | Shapefile | Various (reproject) | `census_boundaries` | `public/mock/census-suburb.geojson` | PLANNED |
| 3 | OpenAerialMap Cape Town | https://openaerialmap.org | CC-BY | TMS tiles | Web Mercator | N/A (tile source) | N/A | PLANNED |
| 4 | Natural Earth Admin Boundaries | https://www.naturalearthdata.com/downloads/10m-cultural-vectors/ | Public Domain | GeoJSON | EPSG:4326 | `ne_admin_boundaries` | `public/mock/ne-za-boundary.geojson` | PLANNED |
| 5 | MyCiTi GTFS (data.gov.za) | https://data.gov.za/dataset/mytransport | CC-BY | GTFS zip | N/A (convert) | `transit_stops` | `public/mock/transit-stops.geojson` | PLANNED |

---

## Dataset Details

### 1. OSM South Africa Extract
**Provider:** Geofabrik GmbH (mirrors OpenStreetMap data)
**License:** Open Database License (ODbL) — free to use, share-alike required
**Coverage:** All of South Africa; clip to Cape Town bbox before ingest
**Update frequency:** Daily (Geofabrik mirrors OSM daily)
**Ingest milestone:** M3 (basemap enrichment — streets, POIs, buildings)
**Ingest tool:** `osm2pgsql` or `ogr2ogr` with `.osm.pbf` driver
**Notes:**
- File is large (~500 MB uncompressed for South Africa)
- Do NOT commit raw `.pbf` to git (see `.gitignore`: `*.pbf`)
- Attribution required: `© OpenStreetMap contributors (ODbL)`

### 2. StatsSA Census 2022 Boundaries
**Provider:** Statistics South Africa (official government data)
**License:** CC-BY — free to use with attribution; commercial use requires written request
**Coverage:** All of South Africa; filter to Western Cape province
**Update frequency:** Decennial (next: 2031)
**Ingest milestone:** M11 (socioeconomic dashboard overlay)
**Ingest tool:** `shp2pgsql` (shapefile) — reproject from local CRS to EPSG:4326
**Notes:**
- CRS varies by release — always verify with `ogrinfo`
- LICENSE CAUTION: commercial SaaS use may require written consent from StatsSA
- Attribution required: `© Statistics South Africa 2022`

### 3. OpenAerialMap Cape Town
**Provider:** OpenAerialMap (Humanitarian OpenStreetMap Team)
**License:** CC-BY — imagery contributors retain rights, license varies per image
**Coverage:** Sporadic coverage; Cape Town area has partial imagery
**Update frequency:** Community-contributed (irregular)
**Ingest milestone:** Optional enhancement for aerial basemap
**Ingest tool:** TMS tile URL — no PostGIS table needed; configure as MapLibre source
**Notes:**
- No API key required
- Attribution must include individual imagery contributor (visible in OAM API response)
- Must add to CartoDB attribution string per CLAUDE.md Rule 6
- Verify coverage before referencing in code

### 4. Natural Earth Admin Boundaries (1:10m)
**Provider:** Natural Earth (public domain; maintained by Nathaniel Kelso et al.)
**License:** Public Domain — no restrictions
**Coverage:** Global; filter to South Africa / Western Cape
**Update frequency:** Version releases (current: 5.1.2)
**Ingest milestone:** M1 (scope enforcement / provincial boundary context)
**Ingest tool:** `ogr2ogr` (GeoJSON or Shapefile)
**Notes:**
- Already EPSG:4326 — no reprojection needed
- Suitable for zoom ≤ 10 context; switch to StatsSA for higher zoom
- Attribution: `© Natural Earth` (minimal; public domain)

### 5. MyCiTi GTFS (data.gov.za)
**Provider:** City of Cape Town via data.gov.za
**License:** CC-BY 4.0 South Africa
**Coverage:** Cape Town Metropolitan area — MyCiTi BRT network
**Update frequency:** Ad hoc (check dataset page for version date)
**Ingest milestone:** M12 (transport routing overlay)
**Ingest tool:** `gtfs2geojson` or manual parse → PostGIS `transit_stops`, `transit_routes`
**Notes:**
- GTFS is not a spatial format — convert stops/shapes to GeoJSON first
- Attribution required: `© City of Cape Town (CC-BY 4.0)`
- Required for M7 SEARCH-AGENT route planning dependency

---

## Ingest Instructions

Use the `dataset-ingest` skill for each entry:
```
# In Claude Code:
# "Run dataset-ingest skill for Natural Earth Admin Boundaries"
```

Do not ingest before the relevant milestone gate:
- OSM SA extract → M3 supplement
- Natural Earth → M1
- StatsSA Census → M11
- OpenAerialMap → Optional (no milestone gate)
- MyCiTi GTFS → M12

---

## Verification Commands

```bash
# Verify a download URL is reachable (HTTP 200):
curl -sI https://download.geofabrik.de/africa/south-africa.html | head -1
# Expected: HTTP/2 200

# Count dataset rows in this catalog:
grep -cE "^\| [0-9]" docs/research/open-datasets.md
# Expected: 5

# Sample 5 rows from mock GeoJSON after ingest:
python3 -c "
import json
with open('public/mock/osm-sample.geojson') as f:
    data = json.load(f)
print(json.dumps(data['features'][:5], indent=2)[:400])
"
```

---

## License Summary

| Dataset | Commercial use | Attribution required | Share-alike |
|---------|---------------|---------------------|-------------|
| OSM SA | Yes (ODbL) | Yes | Yes (derivative DB) |
| StatsSA Census | Written consent needed | Yes | No |
| OpenAerialMap | Varies per image | Yes (per image) | No |
| Natural Earth | Yes (Public Domain) | No (but good practice) | No |
| MyCiTi GTFS | Yes (CC-BY 4.0) | Yes | No |

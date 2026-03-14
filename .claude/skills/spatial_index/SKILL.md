---
name: spatial_index
description: >
  Recommend and generate optimal spatial index strategies for PostGIS tables based on
  geometry type, feature count, and query patterns (bbox, point-in-polygon, nearest neighbour).
  Strategies: GiST (default), BRIN (time-series), SP-GiST (sparse points), Clustered GiST.
__generated_by: self-evolve-pass-2026-03-14
__timestamp: "2026-03-14T00:00:00Z"
---

## Purpose

Optimize spatial query performance on PostGIS tables by recommending the right index
strategy for each layer type. Uniform GiST indexing is sufficient for most layers, but
different access patterns (cadastral parcels vs flight tracks vs suburb polygons) benefit
from different strategies. This skill prevents over/under-indexing.

## Trigger Conditions

- "spatial index", "optimize postgis index", "add spatial index", "brin index"
- DB-AGENT after creating a new migration with geometry columns
- `/m17-kickoff` baseline performance check
- PERFORMANCE-AGENT when query times are slow

## Procedure

1. **Accept target:** table name, geometry type, approximate feature count, and query patterns.

2. **Analyse query patterns:**
   - Bbox filter queries (most common, e.g., suburb boundary intersection)
   - Point-in-polygon (e.g., "which suburb is this parcel in?")
   - Nearest neighbour (e.g., "find properties within 500m")
   - Append-only time series (e.g., flight track history)
   - Sparse point data (e.g., weather station locations)

3. **Apply index strategy decision matrix:**

   | Pattern | Feature Count | Recommended Index |
   |---------|--------------|-------------------|
   | Bbox / polygon queries | Any | GiST (default) |
   | Large cadastral polygons, frequent reads | > 100k | Clustered GiST |
   | Append-only time series (flight tracks) | > 1M | BRIN |
   | Sparse point distribution | < 50k | SP-GiST |
   | Mixed queries (default fallback) | Any | GiST |

4. **Generate index SQL:**

   **Standard GiST:**
   ```sql
   CREATE INDEX CONCURRENTLY idx_<table>_geom ON <table> USING GIST (geom);
   ```

   **Clustered GiST (cadastral):**
   ```sql
   CREATE INDEX CONCURRENTLY idx_<table>_geom ON <table> USING GIST (geom);
   CLUSTER <table> USING idx_<table>_geom;
   ANALYZE <table>;
   ```

   **BRIN (flight tracks):**
   ```sql
   CREATE INDEX CONCURRENTLY idx_<table>_geom ON <table> USING BRIN (geom)
     WITH (pages_per_range = 128);
   ```

   **SP-GiST (sparse points):**
   ```sql
   CREATE INDEX CONCURRENTLY idx_<table>_geom ON <table> USING SPGIST (geom);
   ```

5. **Check for existing indexes** before generating — avoid duplicates.

6. **Output:** Recommended index type + generated SQL + rationale.

## Output Format

```
=== SPATIAL INDEX ADVISOR ===
Table: flight_tracks | Geometry: POINT | Features: 2.3M | Pattern: append-only

RECOMMENDATION: BRIN index
Rationale: Append-only data with high feature count — BRIN has lower overhead than GiST.

SQL:
CREATE INDEX CONCURRENTLY idx_flight_tracks_geom ON flight_tracks USING BRIN (geom)
  WITH (pages_per_range = 128);

Post-index: ANALYZE flight_tracks;
```

## When NOT to Use

- On non-spatial columns (use standard B-tree for text/integer queries)
- On views (index the underlying table)
- If the table has < 1,000 features (sequential scan is faster than index)
- Without CONCURRENTLY keyword in production (blocks writes otherwise)

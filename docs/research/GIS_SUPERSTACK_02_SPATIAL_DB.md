# GIS_SUPERSTACK_02 — SPATIAL_DB

Purpose: research and compare candidate spatial database technologies for the CapeTown GIS Hub (capegis). This document surveys spatial databases, outlines core trade-offs, provides CLI / SQL snippets for evaluation, and records rollback/fallback notes. It also contains explicit guidance for PostGIS (Supabase) configuration to meet the project's multi-tenancy and RLS requirements described in CLAUDE.md Rule 4.

Scope: architectural research only. Any introduction of new production services or libraries requires a documented deviation in docs/PLAN_DEVIATIONS.md.

--------------------------------------------------------------------------------

### PostGIS (Supabase Postgres + PostGIS)
[PostGIS v3.3] – https://postgis.net

Rationale
- Canonical spatial database for transactional GIS workloads.
- Mature geometry/topology functions, wide tooling (GDAL/OGR, QGIS, ogr2ogr), indexing (GiST, SP-GiST), and strong Postgres ecosystem.
- Matches CLAUDE.md approved backend (Supabase Postgres + PostGIS).

Example SQL / setup snippet
```sql
-- Enable PostGIS and typical extensions
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;
CREATE EXTENSION IF NOT EXISTS postgis_raster;

-- Tenant-aware table with RLS per CLAUDE.md Rule 4
CREATE TABLE public.valuation_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  geom geometry(Polygon, 4326) NOT NULL,
  value numeric,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.valuation_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.valuation_data FORCE ROW LEVEL SECURITY;

CREATE POLICY valuation_data_tenant_isolation ON public.valuation_data
  USING (tenant_id = current_setting('app.current_tenant', TRUE)::uuid);

-- Example index
CREATE INDEX ON public.valuation_data USING GIST (geom);
```

Rollback / fallback note
- Rollback: drop newly created tables or revoke access; restore from recent DB snapshot.
- Fallback: Supabase already provides Postgres snapshots and Supabase Storage; if PostGIS is unavailable, fall back to cached GeoJSON in public/mock/*.geojson per Rule 2 (LIVE → CACHED → MOCK).

Deviations / Compliance
- This option is the approved stack. The RLS pattern above follows CLAUDE.md Rule 4 exactly (current_setting('app.current_tenant', TRUE)::uuid). No deviation required.

--------------------------------------------------------------------------------

### SpatiaLite (SQLite + Spatial)
[SpatiaLite v5.0] – https://www.gaia-gis.it/fossil/libspatialite/index

Rationale
- Lightweight, file-based spatial DB. Great for offline exports, edge devices, and quick local analysis.
- Perfect for creating portable sample datasets (MBTiles or .sqlite) and for client-side import into QGIS or local tooling.

Example CLI / SQL snippet
```bash
# Create a SpatiaLite DB and import a GeoJSON
spatialite /tmp/capegis_sample.sqlite "SELECT InitSpatialMetaData();"
spatialite_tool -i -shp suburbs.shp -d /tmp/capegis_sample.sqlite -t suburbs
# OR using ogr2ogr
ogr2ogr -f SQLite -dsco SPATIALITE=YES /tmp/capegis_sample.sqlite suburbs.geojson
```

Rollback / fallback note
- Rollback: delete the file and re-generate from source exports (ogr2ogr from canonical PostGIS dump).
- Fallback: use GeoJSON exports stored in public/mock/*.geojson or rehydrate from Supabase object storage.

> ⚠️ PLAN_DEVIATION required
- SpatiaLite is not in the approved runtime stack. Introducing it as a first-class server-side backend requires approval and documentation in docs/PLAN_DEVIATIONS.md.

--------------------------------------------------------------------------------

### GeoMesa (Big Data Spatial on Cassandra/HBase/Accumulo)
[GeoMesa v3.6] – https://geomesa.org

Rationale
- Designed for large-scale spatio-temporal datasets (telemetry, sensor feeds). Integrates with distributed stores (Cassandra, HBase) and analytics engines (Spark, Kafka).
- Good for vector tile precomputation at scale, or historical trajectory analytics.

Example CLI / setup snippet
```bash
# GeoMesa quickstart (simplified example for Cassandra-backed datastore)
geomesa ingest -s cass-standalone -u user -p pass /path/to/points.avro
# Spark SQL example to read GeoMesa DataFrame
spark-shell --jars geomesa-spark-jars.jar
val df = spark.read.format("geomesa")
  .option("geomesa.feature", "points")
  .option("geomesa.ds.params", "cassandra.keyspace=geomesa;cassandra.contact.point=127.0.0.1")
  .load()
```

Rollback / fallback note
- Rollback: stop ingestion, drop tables/feature stores from datastore, restore backups of Cassandra/HBase.
- Fallback: for the capegis scope (city-level) start with PostGIS; if big-data telemetry grows, GeoMesa can be evaluated in a separate infra tranche.

> ⚠️ PLAN_DEVIATION required
- GeoMesa introduces distributed storage and new operational complexity (Cassandra/HBase). This is outside the approved Supabase/PostGIS + Martin architecture—document in docs/PLAN_DEVIATIONS.md before adoption.

--------------------------------------------------------------------------------

### CockroachDB (with geospatial types / crdb_postgis)
[CockroachDB v23.2] – https://www.cockroachlabs.com

Rationale
- Distributed SQL with PostgreSQL-compatible wire protocol. CockroachDB has an experimental geospatial type surface and some PostGIS compatibility layers (crdb_postgis) but is not a drop-in PostGIS replacement for all functions.
- Attractive for strongly consistent distributed setups, multi-region deployments.

Example SQL / setup snippet
```sql
-- Example: create a table with geometry-like type using Cockroach's geography
CREATE TABLE public.parcels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  geom GEOMETRY,
  created_at TIMESTAMPTZ DEFAULT now()
);
-- Note: CockroachDB geospatial SQL dialect differs; use crdb_postgis shim where available.
```

Rollback / fallback note
- Rollback: drop the table and restore from a known PostGIS export.
- Fallback: If Cockroach's geo features are insufficient, replicate data to PostGIS for complex spatial queries; use Cockroach for transactional metadata only.

> ⚠️ PLAN_DEVIATION required
- CockroachDB is not in the approved stack. Any adoption for spatial workloads requires careful validation (RLS pattern must be re-implemented) and a documented deviation.

--------------------------------------------------------------------------------

### Google BigQuery GIS
[BigQuery GIS v1.0] – https://cloud.google.com/bigquery/docs/gis-introduction

Rationale
- Managed, massively parallel analytics with GIS functions (ST_GEOGFROMTEXT, ST_INTERSECTS, etc.). Good for large analytical/aggregate queries and city-scale cross-join analytics.
- Integrates with BigQuery ML and GeoViz tools.

Example SQL / usage
```sql
-- BigQuery GIS sample: intersect suburbs and incidents
SELECT s.suburb, COUNT(i.*) AS incidents
FROM `project.dataset.suburbs` AS s
JOIN `project.dataset.incidents` AS i
ON ST_INTERSECTS(s.geom, i.geom)
GROUP BY s.suburb;
```

Rollback / fallback note
- Rollback: remove dataset/tables or revoke access; restore from export snapshots.
- Fallback: use PostGIS for operational queries; BigQuery for ad-hoc analytics and heavy aggregation pipelines.

> ⚠️ PLAN_DEVIATION required
- BigQuery is not in the approved hosting stack (Vercel + Supabase). Using BigQuery requires a documented deviation and infra cost approval.

--------------------------------------------------------------------------------

### Tile38 (Realtime geofence + geospatial index server)
[Tile38 v1.31] – https://tile38.com

Rationale
- In-memory geospatial index with real-time geofencing, pub/sub and proximity queries. Great for live vehicle tracking and geofence alerts.
- Supports GeoJSON, geohashes, and WebSocket/event integrations.

Example CLI / usage
```bash
# Start Tile38 and set an object
tile38-server &
# Using CLI
SET fleet truck1 POINT -33.9 18.42
NEARBY fleet 10 POINT -33.92 18.42
```

Rollback / fallback note
- Rollback: flush the DB (FLUSH) and restore from persistence files; stop services gracefully.
- Fallback: If Tile38 is unavailable, fall back to Supabase (PostGIS) proximity queries though latency will be higher and geofence pub/sub features absent. For live telemetry, consider a queued ingest to PostGIS plus Martin tile generation.

> ⚠️ PLAN_DEVIATION required
- Tile38 is not part of the approved stack. Introduce only after human approval and plan deviation documentation in docs/PLAN_DEVIATIONS.md.

--------------------------------------------------------------------------------

### MongoDB Geo (2dsphere indexes)
[MongoDB v6.0] – https://www.mongodb.com

Rationale
- Document DB with native GeoJSON support and 2dsphere indexes. Good for schema-flexible feature stores or metadata-rich documents with location fields.

Example CLI / query snippet
```js
// Create 2dsphere index
db.properties.createIndex({ location: "2dsphere" });

// Find nearby features
db.properties.find({
  location: {
    $near: { $geometry: { type: "Point", coordinates: [ 18.4241, -33.9249 ] }, $maxDistance: 1000 }
  }
});
```

Rollback / fallback note
- Rollback: drop index or collection; restore from oplog or backups.
- Fallback: When complex geometry ops are needed (ST_Buffer, ST_Intersection), replicate to PostGIS for heavy spatial processing.

> ⚠️ PLAN_DEVIATION required
- MongoDB is not the approved primary spatial store. If chosen for a metadata or caching role, document in docs/PLAN_DEVIATIONS.md.

--------------------------------------------------------------------------------

### Elasticsearch (geo_point / geo_shape)
[Elasticsearch v8.10] – https://www.elastic.co/

Rationale
- Full-text search plus geospatial queries. Useful for location-based search, proximity ranking, and geohash aggregations.

Example CLI / query snippet
```json
# Index mapping with geo_point
PUT /properties
{
  "mappings": {
    "properties": {
      "location": { "type": "geo_point" }
    }
  }
}

# Geo-distance query
GET /properties/_search
{
  "query": {
    "bool": {
      "filter": {
        "geo_distance": { "distance": "5km", "location": { "lat": -33.9249, "lon": 18.4241 } }
      }
    }
  }
}
```

Rollback / fallback note
- Rollback: remove index and rebuild from canonical Postgres export.
- Fallback: maintain canonical spatial data in PostGIS; use ES for search and fast proximity ranking only.

> ⚠️ PLAN_DEVIATION required
- ElasticSearch is not listed in CLAUDE.md primary stack. Adding it for search or analytics must be recorded as a plan deviation.

--------------------------------------------------------------------------------

### Microsoft SQL Server (Spatial)
[MSSQL Spatial v15] – https://learn.microsoft.com/sql/relational-databases/spatial/

Rationale
- Mature spatial features (geometry/geography) inside a relational engine. Enterprise features and tooling for MS-centric organisations.

Example SQL snippet
```sql
CREATE TABLE dbo.parcels (
  id uniqueidentifier primary key default NEWID(),
  tenant_id uniqueidentifier NOT NULL,
  geom geography,
  value decimal(12,2)
);

-- Spatial index
CREATE SPATIAL INDEX SI_parcels_geom ON dbo.parcels(geom);
```

Rollback / fallback note
- Rollback: drop table, restore from backup.
- Fallback: convert exports to PostGIS using ogr2ogr and keep PostGIS as canonical store.

> ⚠️ PLAN_DEVIATION required
- MSSQL is not part of the approved stack and introduces licensing and operational differences. Document deviation if adopted.

--------------------------------------------------------------------------------

### Oracle Spatial and Graph
[Oracle Spatial v21c] – https://www.oracle.com/database/technologies/spatialandgraph.html

Rationale
- Enterprise-grade spatial features, highly performant for complex spatial workloads, strong support for advanced topologies and enterprise GIS integrations.

Example SQL snippet
```sql
CREATE TABLE parcels (
  id RAW(16) DEFAULT SYS_GUID(),
  tenant_id RAW(16),
  geom SDO_GEOMETRY,
  value NUMBER
);

INSERT INTO parcels (id, tenant_id, geom, value) VALUES (
  SYS_GUID(), SYS_GUID(), SDO_GEOMETRY(2003, 4326, NULL, SDO_ELEM_INFO_ARRAY(1,1003,1), SDO_ORDINATE_ARRAY(18.4, -33.9, 18.5, -33.9, 18.5, -34.0)), 100000
);
```

Rollback / fallback note
- Rollback: restore from RMAN or data pump exports.
- Fallback: export via GDAL/OGR to PostGIS if complex spatial operations are required in the capegis pipeline.

> ⚠️ PLAN_DEVIATION required
- Oracle Spatial is outside the approved open-source stack and brings licensing and operational overhead—document as plan deviation if considered.

--------------------------------------------------------------------------------

### Snowflake GIS (ST_GEOMETRY)
[Snowflake GIS v2025.10] – https://docs.snowflake.com/en/sql-reference/functions-geospatial

Rationale
- Cloud analytical warehouse with geospatial extensions. Useful for large-scale analytics and integration with BI tools.

Example SQL snippet
```sql
SELECT suburb, COUNT(*) as cnt
FROM capegis_public.incidents
WHERE ST_INTERSECTS(suburb_geom, incident_geom)
GROUP BY suburb;
```

Rollback / fallback note
- Rollback: drop/restore datasets; revoke access.
- Fallback: centralise heavy analytics into BigQuery or PostGIS + analytical exports.

> ⚠️ PLAN_DEVIATION required
- Snowflake is not in the approved stack. Using it requires approval and cost review.

--------------------------------------------------------------------------------

## Cross-cutting guidance and recommendations

- Canonical store: PostGIS (Supabase-managed Postgres) remains the recommended canonical store for capegis because it matches the approved stack in CLAUDE.md (backend & data section). It supports transactional consistency, RLS, and full GIS function coverage.

- Operational pattern: Keep PostGIS as the system of record and replicate (ETL/CDC) to specialised systems where low-latency or scale characteristics are needed (e.g., Tile38 for real-time geofencing, BigQuery/Snowflake for analytical workloads, Elasticsearch for search). Any replication must preserve tenant_id and respect RLS and POPIA constraints.

- Spatial reference: store geometries in EPSG:4326 (WGS84) as mandated by CLAUDE.md. Reproject to EPSG:3857 only for rendering tile pipelines (Martin / MapLibre). Never mix CRS without explicit reprojection steps in pipelines.

- RLS & multi-tenancy (MANDATORY): Every tenant-scoped table must enable and force RLS and create the policy using the app.current_tenant pattern. Example canonical snippet (repeat of Rule 4):
```sql
ALTER TABLE [table] ENABLE ROW LEVEL SECURITY;
ALTER TABLE [table] FORCE ROW LEVEL SECURITY;
CREATE POLICY "[table]_tenant_isolation" ON [table]
  USING (tenant_id = current_setting('app.current_tenant', TRUE)::uuid);
```
This is required for profiles, saved_searches, favourites, valuation_data, api_cache, audit_log, tenant_settings, layer_permissions.

- POPIA: Any table or export touching personal data must include the POPIA annotation header in code files that manipulate or export PII. See CLAUDE.md Rule 5.

- Three-tier fallback (MANDATORY): Live → Cached (Supabase.api_cache) → Mock (public/mock/*.geojson). All candidate architectures must support this pattern for resilience and UX consistency.

- Plan deviations: Any technology not explicitly listed in CLAUDE.md "TECHNOLOGY STACK" should be marked with a plan deviation. This document flags each non-approved item with "> ⚠️ PLAN_DEVIATION required".

--------------------------------------------------------------------------------

## Recommendation summary

1. Short-term / default: PostGIS (Supabase) as canonical store. Use Martin for MVT tile serving and Supabase Storage for object storage.
2. Edge/offline: SpatiaLite for desktop/offline exports and sample datasets.
3. Real-time telemetry: Consider Tile38 for high-frequency geofence/nearby operations; require deviation approval and integration plan. If approved, ensure replication pattern to PostGIS for persistence and auditing.
4. Analytics: Use BigQuery/Snowflake for heavy analytics if cost and infra approval are granted — otherwise run analytical workloads from PostGIS exports.
5. Search: Use Elasticsearch only as an indexing and text+geo search tier; keep PostGIS canonical.
6. Distributed big-data: GeoMesa is appropriate if telemetry scale demands distributed systems—introduce only after capacity planning.

--------------------------------------------------------------------------------

## Next steps

- Review this doc with the platform architects and product owners.
- If any technology in this doc should be trialled, open a DEV-NNN entry in docs/PLAN_DEVIATIONS.md describing purpose, scope, infra cost, and rollback plan.
- If PostGIS configuration needs changes, prepare a migration SQL in supabase/migrations and ensure pre-production tests for RLS and tenant isolation.

--------------------------------------------------------------------------------

Generated: 2026-03-15
Author: Unit 02 — GIS_SUPERSTACK_02_SPATIAL_DB (research)

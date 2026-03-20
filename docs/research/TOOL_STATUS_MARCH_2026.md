# TOOL_STATUS_MARCH_2026.md — CapeTown GIS Hub

| Tool                | Verified Version        | Free Tier                   | Critical Deadline           | Compatibility             |
| ------------------- | ----------------------- | --------------------------- | --------------------------- | ------------------------- |
| Martin Tile Server  | v1.0.4                  | Open Source (Self-hosted)   | N/A                         | PostGIS 17, PMTiles v3    |
| MapLibre GL JS      | v5.1.0                  | Open Source                 | N/A                         | Martin, MLT, PMTiles      |
| CARTO               | Cloud-Native (2026)     | GitHub Student Pack / Grant | N/A                         | MapLibre, PostGIS         |
| Google Earth Engine | Community / Contributor | 150 - 1000 EECU-hours       | April 27, 2026 (Quota Tier) | COG, Supabase Storage     |
| ArcGIS Maps SDK     | v4.34 (v5.0 target)     | API Key (Limited)           | July 21, 2026 (Pro Expiry)  | MapLibre (via GeoJSON)    |
| QGIS Server         | v3.40 "Białowieża"      | Open Source                 | N/A                         | OGC WMS/WFS, Docker       |
| Appwrite            | v1.6+                   | Free Cloud / Self-host      | N/A                         | NoSQL Metadata only       |
| PMTiles             | v3.0.0                  | Open Source                 | N/A                         | MapLibre, Serwist         |
| Cesium ion          | 2026 Standard           | 5GB Storage / 50GB Stream   | N/A                         | 3D Tiles, Gaussian Splats |

---

### Verified Tool Status Reports — March 2026

**Martin Tile Server**
Current stable version is v1.0.4 (released Dec 2025). Major v1.0 release stabilized the internal MVT encoding and added support for PMTiles as a source. The correct pattern to register a PostGIS table as a dynamic source without server restart is using the `/catalog` admin endpoint or by leveraging the auto-discovery feature (enabled by default) which scans for new tables in configured schemas. Martin now supports "Composite Sources" which allow multiple tables to be served from a single TileJSON endpoint.
[Source: https://maplibre.org/martin/news/2025-12-02-maplibre-newsletter-november-2025/]

**MapLibre GL JS**
Current stable version is v5.1.0 (March 2026). The `source-layer` property remains a strict requirement for MVT sources to distinguish between multiple layers within a single vector tile. The correct pattern to add a Martin TileJSON endpoint is using `type: 'vector'` and pointing the `url` to Martin's `{host}/{source_id}` endpoint. MapLibre recently announced **MapLibre Tile (MLT)**, a successor to MVT designed for high-volume data, currently in early adoption.
[Source: https://maplibre.org/news/2026-03-03-maplibre-newsletter-february-2026/]

**CARTO**
A genuine free tier exists primarily through the **GitHub Student Developer Pack**, providing upgraded storage and full platform access. For non-students, a **Geospatial Grant Programme** exists for non-profits and academic research. Application timelines typically range from 2–4 weeks. Marketing focuses on "Cloud Native" integration with Snowflake, BigQuery, and Redshift, but standard API access for PostGIS remain available.
[Source: https://carto.com/blog/carto-is-part-of-the-github-student-pack]

**Google Earth Engine** ⚠️ DEADLINE CRITICAL
All noncommercial projects MUST select a quota tier by **April 27, 2026**. If no selection is made, projects default to the **Community Tier** (150 EECU-hours/month). The **Contributor Tier** grants 1,000 EECU-hours/month but requires an active Google Cloud billing account (no charges for GEE usage). Google AI Pro subscriptions do not currently grant preferential GEE quotas, as GEE uses its own EECU (Earth Engine Compute Unit) resource model.
[Source: https://developers.google.com/earth-engine/guides/noncommercial_tiers]

**ArcGIS Maps SDK for JavaScript v5.0** ⚠️ DEADLINE: July 2026 Pro expiry
Version 4.34 is the current stable release (Feb 2026), with v5.0 anticipated as the next major architectural shift toward full Web Component parity. Most widgets are being replaced by `@arcgis/map-components` (e.g., `arcgis-sketch`). After the **July 21, 2026** ArcGIS Pro license expiry, geocoding and routing services will require an API key and may incur costs if they exceed free tier monthly credits. South African cadastral datasets (e.g., SG parcels) are available on Living Atlas but often require a Pro license for full feature access; public view-only layers exist but are inconsistent.
[Source: https://developers.arcgis.com/javascript/latest/release-notes/]

**QGIS Server**
Current stable version is v3.40. It supports OGC WMS 1.3.0, WFS 1.1.0, and WCS 1.0.0. A well-maintained Docker image (`kartoza/qgis-server`) is suitable for deployment on containerized platforms like Heroku or Azure Container Apps. Performance tuning for high-concurrency environments requires careful configuration of the `QGIS_SERVER_PARALLEL_SCANNING` and `MAX_THREADS` variables.
[Source: https://qgis.org/en/site/getinvolved/development/roadmap.html]

**Appwrite**
Appwrite v1.6+ introduced a "Tables and Rows" interface for MariaDB, but it **cannot** replace Supabase as a spatial database because it lacks a native equivalent to PostGIS. It can store GeoJSON as strings or JSON objects but cannot perform server-side spatial indexing or GIS operations (ST_Intersects, ST_Buffer, etc.). It is best used alongside Supabase for non-spatial metadata or user-generated content that does not require geographic logic.
[Source: https://writerdock.in/blog/supabase-vs-appwrite-which-backend-is-better]

**PMTiles v3**
The current spec version is v3.0.0. The `pmtiles` JS library provides a stable `addProtocol` API for MapLibre, enabling direct reading of `.pmtiles` archives from object storage. Integration with **Serwist** requires registering the `.pmtiles` URL in the `precache` manifest or using a custom `RuntimeCaching` strategy to ensure tiles are available offline. This is the primary strategy for the `capegis` offline mode.
[Source: https://github.com/protomaps/PMTiles]

**Cesium ion**
The 2026 free tier includes 5GB of storage and 50GB of streaming per month. GPU hosting is **not** required for the conversion process (which happens on Cesium's cloud workers) or for streaming, but it is highly recommended for the end-user's browser to render high-density 3D Tiles or Gaussian Splats at acceptable frame rates.
[Source: https://cesium.com/pricing/]

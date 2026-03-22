# Managed Enterprise Geospatial Stack Pivot

## 1. Executive Summary
The CapeTown GIS Hub is pivoting from a custom serverless GCP architecture (Cloud Run proxies, custom STAC API) to a managed enterprise stack leveraging **Cesium ion** and **CARTO**. This shift reduces custom code maintenance, improves scalability, and ensures meeting the April 27, 2026, Google Earth Engine (GEE) quota deadline.

## 2. Integrated Data Pipeline
The chosen integration path for high-resolution Sentinel-2 median composites is:
**GEE → GCS Staging (Transient) → Cesium ion (Managed Tiling) → CesiumJS (Frontend).**

### 2.1 Role of Cesium ion (The Immersive Engine)
- **Automated Ingestion**: Use the ion REST API to convert GEE exports into Imagery Assets.
- **Tiling & Performance**: Cesium ion handles the creation of optimized tile pyramids and global CDN delivery natively.
- **Frontend Integration**: Assets are consumed directly via Asset IDs in the existing CesiumJS viewer, eliminating the need for signed URL proxies.

### 2.2 Role of CARTO (The Analytics Engine)
- **Vector Data Warehouse**: All cadastral, zoning, and administrative boundaries reside in CARTO's BigQuery Data Warehouse.
- **Governance**: Unified authentication and access control for enterprise datasets.
- **Analytics**: SQL-driven spatial analysis using the CARTO Analytics Toolbox.

### 2.3 Role of ArcGIS (The Desktop Prep Tool)
- **Usage**: Tactical data preparation, QC, and analysis via ArcGIS Pro Plus.
- **Constraint**: Not intended for primary production serving due to the July 2026 license expiry.

## 3. Deadline Mitigation (GEE April 27, 2026)
By leveraging Cesium ion's native ingestion, we eliminate the 2-week development cycle required for a custom STAC/Cloud Run backend. Engineering efforts are now strictly focused on GEE export optimization.

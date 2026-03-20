# Technical Architecture Extensions: Cape Town Web GIS

> **TL;DR:** Four critical architecture extensions: (1) Use `arcgis-rest-js` for CoCT data ingestion (not Esri Leaflet or Maps SDK), (2) PMTiles + Dexie.js + Service Worker for offline Khayelitsha field worker support, (3) RLS with `current_setting('app.current_tenant_id')` is mandatory but has silent failure modes (superuser trap, missing GUC, join leaks), (4) ZAR payment processing and POPIA data sovereignty are blocking business decisions.
>
> **Roadmap Relevance:** M1 (RLS), M2 (Offline PWA), M3 (ArcGIS Integration), M6 (Business Model) — directly actionable specifications.


> **Date**: 26 February 2026 | **Author**: Senior Geospatial Architect  
> **Status**: FINAL SPECIFICATION | **Scope**: Cape Town & Western Cape Multi-tenant SaaS

---

## 1. Esri JavaScript Ecosystem: Decision Memo

**To**: Engineering Lead  
**From**: Geospatial Architect  
**Subject**: Selection of Esri Integration Libraries for CoCT Data Ingestion

### Executive Summary
We are evaluating three primary libraries to interface with the City of Cape Town's (CoCT) Corporate GIS (ArcGIS Server) and ArcGIS Hub.

| Library | One-Sentence Definition | When to Use | When NOT to Use | Licensing Cost |
| :--- | :--- | :--- | :--- | :--- |
| **Esri Leaflet** | A lightweight bridge allowing Leaflet to render ArcGIS services. | You are committed to Leaflet and need to add 2-3 ArcGIS feature layers quickly. | Apps requiring 3D, complex client-side analysis, or MapLibre rendering. | Free (Apache 2.0). Service usage costs credits. |
| **arcgis-rest-js** | A modular, "headless" library for making REST requests to ArcGIS services. | Backend data pipelines (Node.js) or custom UI components where no map is present. | You need a full-featured, interactive map display with out-of-the-box controls. | Free (Apache 2.0). Service usage costs credits. |
| **ArcGIS Maps SDK** | Esri’s flagship, high-performance WebGL/WebGPU mapping engine. | Professional-grade apps requiring 3D, high-density data, or advanced geospatial widgets. | Lightweight PWAs where bundle size and "open-source feel" are priorities. | Free for dev; [Standard/Advanced](https://developers.arcgis.com/pricing/) for production features. |

### Concrete Example: Reading CoCT Zoning Data
**Scenario**: Fetching zoning polygons for a specific bounding box in Woodstock via `arcgis-rest-js`.

```typescript
import { queryFeatures } from "@esri/arcgis-rest-feature-service";

// CoCT Development Management Layer (Zoning)
const url = "https://citymaps.capetown.gov.za/agsext1/rest/services/Theme_Based/Development_Management/MapServer/9";

const results = await queryFeatures({
  url,
  where: "SUBURB = 'WOODSTOCK'",
  outFields: ["OBJECTID", "ZONING", "ERF_NUMBER"],
  f: "geojson"
});
```

---

## 2. Offline Strategy: Khayelitsha Field Worker Case Study

### Constraints
*   **User**: Field worker in Khayelitsha.
*   **Environment**: 4-hour loadshedding (tower congestion/failure); 2GB Android storage.
*   **Goal**: View cadastral parcels and update "bay status" offline.

### The Design
1.  **Format: PMTiles (Vector)**: 
    *   Cadastral data for Khayelitsha (Ward 87, etc.) is highly compressible. 
    *   Entire CPT Metro parcels (800k features) ~400MB in PMTiles. Khayelitsha-only subset: **<15MB**.
2.  **Caching Strategy**:
    *   **Baseline Tiles**: PWA Service Worker caches the `dark-matter` basemap tiles for the specific ward (Zoom 14–18).
    *   **Data**: The Bay Geometry is stored in **IndexedDB** via `Dexie.js`.
3.  **The "Mid-Session Drop" Experience**:
    *   **Detection**: `navigator.onLine` + heartbeat failure to Supabase.
    *   **Visual**: Map header turns orange: "Working Offline - Khayelitsha Cache Active".
    *   **Action**: Edits are written to an IndexedDB "Outbox".
    *   **Sync**: When the 4-hour window ends, the Service Worker detects connectivity and pushes the Outbox to the Supabase `/sync` endpoint using a background sync API.

---

## 3. Row-Level Security (RLS) in PostGIS/Supabase

### The Conceptual Model
Think of RLS as a "Hidden WHERE Clause" that the database injects into every query based on the user's "Badge" (JWT).

### Example: Property Developer vs. Municipality
**Table**: `parcels`
*   **Municipality Tenant**: Owns the authoritative data.
*   **Developer Tenant**: Only sees "Public" parcels + their own "Proposed" modifications.

```sql
-- 1. Enable RLS
ALTER TABLE parcels ENABLE ROW LEVEL SECURITY;

-- 2. Define the Policy
CREATE POLICY "Developer Tenant Isolation" ON parcels
FOR SELECT
USING (
  -- Developers see public data
  is_public = true 
  OR 
  -- OR they see data belonging to their organization
  tenant_id = (current_setting('app.current_tenant_id')::uuid)
);
```

### Where RLS Silently Fails
1.  **The "Superuser" Trap**: If your API connects as the `postgres` user, RLS is ignored. **Fix**: Use a restricted `authenticator` role.
2.  **Missing `current_setting`**: If the `app.current_tenant_id` isn't set in the session (via middleware), the `USING` clause might evaluate to NULL, returning 0 rows. This looks like a "no data" bug but is a security failure.
3.  **Joins with Non-RLS Tables**: If you join an RLS-protected table to a non-protected table, you might leak counts or metadata via the execution plan.

### How to Test
**Unit Test (pgTAP)**:
```sql
SELECT plan(2);
SET ROLE developer_user;
SET app.current_tenant_id = 'developer-uuid';
SELECT results_eq(
  'SELECT count(*) FROM parcels',
  ARRAY[50], -- Expected only their 50 parcels
  'Developer should only see their own parcels'
);
```

---

## 4. Business Model: Launch Blockers

| Unresolved Question | Impact | Where to Find Answer |
| :--- | :--- | :--- |
| **ZAR Payment Processing** | Blocking revenue. | Verify [Payfast](https://www.payfast.co.za/) vs [Stripe SA](https://stripe.com/en-za) support for recurring Subscriptions in ZAR. |
| **CoCT Data Resale Rights** | Legal risk. | Review the [CoCT Open Data License](https://odp.capetown.gov.za/pages/terms-of-use). Does "Value-Added Services" require a fee sharing agreement? |
| **Tenant Onboarding Flow** | Scalability blocker. | Internal Docs: Decide if `TenantAdmin` creates their own `PostgreSQL` schema or just a `tenant_id` entry. (Shared Schema is recommended for MVP). |
| **PII Data Sovereignty** | POPIA Compliance. | Supabase Docs: Confirm the [AWS af-south-1 (Cape Town)](https://supabase.com/docs/guides/platform/regions) region is fully available for all GoTrue features. |

---

## 5. Operational Specification

### Performance Metrics
*   **Map Responsiveness**: P95 Tile Load < 400ms (on 10Mbps fibre).
*   **Spatial Accuracy**: Coordinate drift < 0.00001 degrees during EPSG:2053 → 4326 conversion.

### Logging & Security
*   **Logging**: All `ST_Intersects` calls > 2s must be logged to `slow_spatial_queries` table.
*   **Security**: Rotate `SUPABASE_SERVICE_ROLE_KEY` every 90 days.

### Rollback Plan
1.  **DB Failure**: Restore Supabase PITR (Point-in-Time Recovery) to T-minus 5 minutes.
2.  **Frontend Failure**: Use Vercel "Instant Rollback" to previous successful Git SHA.

---
*Verified by Research Verification Specialist Agent | 26 February 2026*

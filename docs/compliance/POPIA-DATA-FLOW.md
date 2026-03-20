# POPIA Data Flow Diagram
## CapeConnect GIS Hub

> Visual representation of all data flows for DPIA compliance review.

```mermaid
flowchart TB
    subgraph Browser["Browser (Client)"]
        ML["MapLibre GL JS"]
        CS["CesiumJS Viewer"]
        UI["Dashboard UI"]
        SW["Service Worker (Serwist)"]
        DX["Dexie.js (IndexedDB)"]
    end

    subgraph Edge["Vercel Edge"]
        MW["middleware.ts\n(Tenant Resolution + RBAC)"]
    end

    subgraph API["Next.js API Routes"]
        AF["api/flights\n(OpenSky 3-tier)"]
        AS["api/search\n(Geocoder 3-tier)"]
        AZ["api/zoning\n(IZS 3-tier)"]
        AV["api/valuation\n(GV Roll 3-tier)"]
        AA["api/analysis\n(PostGIS RPC)"]
        AST["api/analysis/stats\n(Analytics 3-tier)"]
    end

    subgraph DB["Supabase (PostGIS)"]
        PR["profiles\n(RLS + tenant_id)"]
        PP["properties\n(RLS + GIST)"]
        VD["valuation_data\n(PII-stripped)"]
        UF["user_features\n(RLS + GIST)"]
        AC["api_cache\n(24h TTL)"]
        TS["tenant_settings\n(white-label)"]
    end

    subgraph External["External Services"]
        OS["OpenSky Network\n(ADS-B API)"]
        CI["Cesium Ion\n(3D Tiles)"]
        CT["CARTO CDN\n(Dark Matter basemap)"]
        SA["Supabase Auth\n(JWT + Claims)"]
    end

    %% Browser → Edge → API
    UI -->|"HTTPS"| MW
    MW -->|"x-tenant-id header"| AF
    MW -->|"x-tenant-id header"| AS
    MW -->|"x-tenant-id header"| AZ
    MW -->|"x-tenant-id header"| AV
    MW -->|"x-tenant-id header"| AA

    %% API → DB
    AF -->|"SQL (tenant-scoped)"| AC
    AS -->|"Full-text search"| PP
    AZ -->|"Spatial query"| PP
    AV -->|"JOIN via ERF key"| VD
    AA -->|"analyze_area() RPC"| UF
    AST -->|"Aggregate stats"| VD

    %% API → External
    AF -->|"Rate-limited GET"| OS
    UI -->|"Auth flow"| SA

    %% Browser → External (direct)
    ML -->|"Tile requests (no PII)"| CT
    CS -->|"3D Tile requests (no PII)"| CI

    %% Offline path
    SW -->|"Cache responses"| DX
    UI -->|"Offline fallback"| DX

    %% Data tier annotations
    classDef pii fill:#ff6b6b,stroke:#c92a2a,color:white
    classDef safe fill:#51cf66,stroke:#2b8a3e,color:white
    classDef cache fill:#339af0,stroke:#1864ab,color:white

    class PR,SA pii
    class VD,PP,UF safe
    class AC,DX cache
```

## Data Classification Legend

| Color | Classification | Description |
|---|---|---|
| 🔴 Red | **PII Present** | Contains personal information (email, name). Protected by RLS + Auth. |
| 🟢 Green | **PII-Stripped** | Originally contained PII, now safe after ETL processing. |
| 🔵 Blue | **Cache/Temporary** | Auto-expiring data with TTL. No PII. |

## Key Data Flows

### 1. User Authentication
```
Browser → Supabase Auth → JWT (tenant_id + role claims) → middleware.ts → API routes
```
**PII:** Email, password hash (managed by Supabase). Never exposed to application code.

### 2. Property Search
```
Browser → api/search → PostGIS full-text → properties table (RLS-filtered) → Browser
```
**PII:** None. Search queries are anonymized and tenant-scoped.

### 3. GV Roll Valuation
```
CoCT CSV → import-gv-roll.py (Full_Names STRIPPED) → valuation_data → api/valuation → Browser
```
**PII:** Explicitly removed during ETL. Only property values and ERF numbers retained.

### 4. Flight Tracking
```
api/flights → OpenSky API (rate-limited) → GeoJSON transform (guest filter) → FlightLayer
```
**PII:** None. ADS-B data is publicly broadcast. Guest users see filtered subset.

### 5. User-Drawn Features
```
DrawControl → api/features → user_features (tenant_id + user_id RLS) → AnalysisResultPanel
```
**PII:** Indirect (location context). Strictly private to user via RLS policy.

---

> **Cross-reference:** Full DPIA details in [`DPIA.md`](./DPIA.md)

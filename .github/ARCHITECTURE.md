# ARCHITECTURE.md — AI Brain Map

**Name**: .github/ARCHITECTURE.md  
**Purpose**: Translates the CapeTown GIS Hub structural blueprint to GitHub Copilot and Actions. Details the technology stack, dependency web, data flows, and active Rule implementations. Optimized for `@workspace` context retrieval.  
**When to invoke**: Prior to feature architecture or structural refactoring via Chat.  
**Example invocation**: `@workspace explain this architecture`  
**Related agents/skills**: `@workspace`  
**Configuration snippet**: N/A (Documentation map)

---

## 🧱 1. Technology Stack Execution

### Framework & UI Runtime

**Name**: Next.js 15 (App Router) + React 19  
**Purpose**: Vercel-hosted orchestration rendering Server + Client spatial components using SSR.  
**When to invoke**: N/A  
**Example invocation**: N/A  
**Related agents/skills**: `FRONTEND-MODES`  
**Configuration snippet**: None

### Spatial Engineering

**Name**: MapLibre GL JS + Turf.js + Martin MVT  
**Purpose**: Client-side mapping relying exclusively on MapLibre (NOT Leaflet) and Martin MVT optimized PMTiles. In-browser calculations (<10k bounds) handle Turf polygons.  
**When to invoke**: N/A  
**Example invocation**: N/A  
**Related agents/skills**: `MAP-MODE`  
**Configuration snippet**: None

### Backend Topology

**Name**: Supabase PostgreSQL 15 + PostGIS + RLS  
**Purpose**: Storage enforces EPSG:4326 schema via authenticated GoTrue sessions parsing `tenant_id` scopes per query.  
**When to invoke**: N/A  
**Example invocation**: N/A  
**Related agents/skills**: `DB-MODE`  
**Configuration snippet**: None

---

## 🔄 2. Data Pipelines

### Client → PostGIS → Next.js

**Name**: Three-Tier Fallback (Rule 2)  
**Purpose**: Fallback cascade ensuring mapping elements load in the exact order: External API → CACHED (`api_cache`) → MOCK (`public/mock/*.geojson`).  
**When to invoke**: Scaffold data flows  
**Example invocation**: `@workspace validate this API fallback`  
**Related agents/skills**: `@workspace`  
**Configuration snippet**: None

### Geospatial Rule Bounds

**Name**: Bounding Box Enforcement (Rule 9)  
**Purpose**: Data inputs strictly constrain to `{ west: 18.0, south: -34.5, east: 19.5, north: -33.0 }`.  
**When to invoke**: Building tiles  
**Example invocation**: N/A  
**Related agents/skills**: `spatial_validation_action`  
**Configuration snippet**: None

---

## 🤖 3. Agent Ecosystem Topology

### System Sequence

**Name**: Milestone Orchestration  
**Purpose**: Staggered enablement of feature development phases enforced by GitHub Actions branch protections. Copilot operates within the bounds of the current branch ticket.  
**When to invoke**: Validating milestone readiness  
**Example invocation**: N/A  
**Related agents/skills**: `COPILOT-PR-AGENT`  
**Configuration snippet**: None

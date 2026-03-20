# ARCHITECTURE.md — AI Brain Map

**Name**: .gemini/ARCHITECTURE.md  
**Purpose**: Translates the CapeTown GIS Hub structural blueprint to AI Agents. Details the technology stack, dependency web, data flows, and active Rule implementations (e.g., File Size constraints, Three-Tier Fallback pipelines). Optimized for passing as a massive context block to Gemini.  
**When to invoke**: Prior to feature architecture or structural refactoring.  
**Example invocation**: `@GEMINI explain this architecture`  
**Related agents/skills**: `ANTIGRAVITY-AGENT`  
**Configuration snippet**: N/A (Documentation map)

---

## 🧱 1. Technology Stack Execution

### Framework & UI Runtime

**Name**: Next.js 15 (App Router) + React 19  
**Purpose**: Vercel-hosted orchestration rendering Server + Client spatial components using SSR.  
**When to invoke**: N/A  
**Example invocation**: N/A  
**Related agents/skills**: `FRONTEND-AGENTS`  
**Configuration snippet**: None

### Spatial Engineering

**Name**: MapLibre GL JS + Turf.js + Martin MVT  
**Purpose**: Client-side mapping relying exclusively on MapLibre (NOT Leaflet) and Martin MVT optimized PMTiles. In-browser calculations (<10k bounds) handle Turf polygons.  
**When to invoke**: N/A  
**Example invocation**: N/A  
**Related agents/skills**: `MAP-AGENT`, `SPATIAL-AGENT`, `TILE-AGENT`  
**Configuration snippet**: None

### Backend Topology

**Name**: Supabase PostgreSQL 15 + PostGIS + RLS  
**Purpose**: Storage enforces EPSG:4326 schema via authenticated GoTrue sessions parsing `tenant_id` scopes per query.  
**When to invoke**: N/A  
**Example invocation**: N/A  
**Related agents/skills**: `DB-AGENT`, `AUTH-AGENT`  
**Configuration snippet**: None

---

## 🔄 2. Data Pipelines

### Client → PostGIS → Next.js

**Name**: Three-Tier Fallback (Rule 2)  
**Purpose**: Fallback cascade ensuring mapping elements load in the exact order: External API → CACHED (`api_cache`) → MOCK (`public/mock/*.geojson`). Blank renders are denied by design.  
**When to invoke**: Scaffold data flows  
**Example invocation**: Validating an API  
**Related agents/skills**: `fallback_verify`  
**Configuration snippet**: None

### Geospatial Rule Bounds

**Name**: Bounding Box Enforcement (Rule 9)  
**Purpose**: Data inputs strictly constrain to `{ west: 18.0, south: -34.5, east: 19.5, north: -33.0 }`. Tippecanoe generation drops any out-of-bounds geometries.  
**When to invoke**: Building tiles  
**Example invocation**: `tippecanoe --clip...`  
**Related agents/skills**: `spatial_validation`  
**Configuration snippet**: None

---

## 🤖 3. Agent Ecosystem Topology

### System Sequence

**Name**: Milestone Orchestration  
**Purpose**: Staggered enablement of specialized agents, passing off explicit phases (e.g. `DB-AGENT (M1) → AUTH-AGENT (M2) → MAP-AGENT (M3)`). Cross-functional ARIS entities (like REPO-ARCHITECT) manage the integrity layer using Gemini's continuous context caching.  
**When to invoke**: Validating milestone readiness  
**Example invocation**: `/milestone-status`  
**Related agents/skills**: `GEMINI-ORCHESTRATOR`  
**Configuration snippet**: None

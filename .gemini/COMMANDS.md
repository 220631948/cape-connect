# COMMANDS.md — Prompt Playbooks

**Name**: .gemini/COMMANDS.md  
**Purpose**: Central registry for predefined Gemini prompting macros or slash-style command equivalents mapping to complex workflow orchestrations. Specifically designed to initialize Gemini Context Windows with the exact files required for spatial ETL or POPIA jobs.  
**When to invoke**: When needing to trigger specific workflows, testing suites, or scaffolding tasks via a consistent text interface in Gemini / AI Studio.  
**Example invocation**: Reading `.gemini/COMMANDS.md` or executing `@GEMINI /milestone-audit`  
**Related agents/skills**: `GEMINI-ORCHESTRATOR`, `ALL_AGENTS`  
**Configuration snippet**: N/A (Playbook Index)

---

## 🚦 Core Auditing

### 1. `/badge-check`

**Name**: /badge-check  
**Purpose**: Enforces CLAUDE.md/GEMINI.md Rule 1. Prompts the agent to scan all React components in the context window for visible `[SOURCE · YEAR · LIVE|CACHED|MOCK]` badges on data-displaying components.  
**When to invoke**: Before PR reviews or testing new feature data renders.  
**Example invocation**: `/badge-check on src/components/map/`  
**Related agents/skills**: `BADGE-AUDIT-AGENT`  
**Configuration snippet**: None

### 2. `/audit-popia`

**Name**: /audit-popia  
**Purpose**: Directs Gemini to scan the codebase for POPIA compliance annotations in files carrying PII payload logic, generating a compliance report.  
**When to invoke**: Before finalizing a backend data route or property panel.  
**Example invocation**: `/audit-popia on the users API route`  
**Related agents/skills**: `GEMINI-COMPLIANCE-AGENT`  
**Configuration snippet**: None

### 3. `/milestone-audit`

**Name**: /milestone-audit  
**Purpose**: Orchestrates an 8-area project audit defining readiness for Definition of Done (DoD). Focuses Gemini on checking RLs, badges, and POPIA tags.  
**When to invoke**: Before declaring a milestone fully complete.  
**Example invocation**: `/milestone-audit M5`  
**Related agents/skills**: `PROJECT-AUDIT-AGENT`, `GEMINI-ORCHESTRATOR`  
**Configuration snippet**: None

---

## ⚙️ Spatial Integration

### 4. `/validate-spatial`

**Name**: /validate-spatial  
**Purpose**: Checks GeoJSON inputs via Gemini's Python notebook capabilities to ensure geometries fall within Cape Town bounding boxes and meet EPSG:4326 schema bounds.  
**When to invoke**: Upon receiving new GIS file drops.  
**Example invocation**: `/validate-spatial public/mock/suburbs.geojson`  
**Related agents/skills**: `DATA-AGENT`  
**Configuration snippet**: None

### 5. `/arcgis-import` and `/qgis-import`

**Name**: /arcgis-import and /qgis-import  
**Purpose**: Triggers the `arcpy-*` skill chains to build integration scripts for proprietary mapping datasets.  
**When to invoke**: Ingesting legacy or proprietary mapping datasets.  
**Example invocation**: `/arcgis-import data/planning_data.shp`  
**Related agents/skills**: `DATA-AGENT`, `arcpy-plan`, `arcpy-script`  
**Configuration snippet**: None

### 6. `/optimize-tiles`

**Name**: /optimize-tiles  
**Purpose**: Automatically synthesizes the optimal `tippecanoe` bash flags and Martin MVT server definitions.  
**When to invoke**: Deploying vector layers exceeding the 10,000 Turf.js feature threshold limit.  
**Example invocation**: `/optimize-tiles public/mock/suburbs.geojson`  
**Related agents/skills**: `TILE-AGENT`, `MAP-AGENT`  
**Configuration snippet**: None

---

## 📦 Developer Scaffolding

### 7. `/new-component`

**Name**: /new-component  
**Purpose**: Generates a React component stub loaded with POPIA blocks, three-tier fallback guards, and UI Rule compliance comments.  
**When to invoke**: Building new features or dashboard windows.  
**Example invocation**: `/new-component SuburbBoundaryLayer`  
**Related agents/skills**: `FEATURE-BUILDER`  
**Configuration snippet**: None

### 8. `/new-migration`

**Name**: /new-migration  
**Purpose**: Creates a Supabase PostgreSQL migration file preloaded with tenant ID definitions, RLS enforcement, spatial indexing, and POPIA tags.  
**When to invoke**: Altering or introducing mapping data tables.  
**Example invocation**: `/new-migration risk_zones`  
**Related agents/skills**: `DB-AGENT`, `spatial-index`  
**Configuration snippet**: None

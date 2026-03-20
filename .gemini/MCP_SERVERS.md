# MCP_SERVERS.md — MCP Fleet Reference

**Name**: .gemini/MCP_SERVERS.md  
**Purpose**: Documents active Model Context Protocol (MCP) servers providing external operational tools to Gemini Agents (geospatial algorithms, database access, web search, container APIs).  
**When to invoke**: When configuring new tools, inspecting available environment limits, or responding to P0 `UNREACHABLE` server halts.  
**Example invocation**: `/mcp-status` or checking `.gemini/MCP_SERVERS.md`  
**Related agents/skills**: `mcp-health-check`  
**Configuration snippet**:

```yaml
mcp_servers:
  gmp-code-assist:
    command: npx
    args: [@google/mcp-gmp-code-assist]
```

---

## 🚦 P0 Core Execution

These must be **HEALTHY**. Halt operations if **UNREACHABLE**.

### 1. `doc-state`

**Name**: doc-state  
**Purpose**: Distributed document locking. Prevents concurrent context-clobbering on large shared artifacts like `INDEX.md`.  
**When to invoke**: Writing `INDEX.md`, `CHANGELOG_AUTO.md`  
**Example invocation**: `mcp__doc-state__acquire_lock(path="docs/INDEX.md")`  
**Related agents/skills**: `GEMINI-ORCHESTRATOR`  
**Configuration snippet**:

```json
"command": "node",
"args": ["mcp/doc-state/server.js"]
```

### 2. `filesystem`

**Name**: filesystem  
**Purpose**: Constrained read/write sandbox bounded safely to the active GIS repository.  
**When to invoke**: Reading logic or generating components.  
**Example invocation**: `mcp__filesystem__read_file(".gemini/AGENTS.md")`  
**Related agents/skills**: Supported across all Agents  
**Configuration snippet**:

```json
"command": "npx",
"args": ["-y", "@modelcontextprotocol/server-filesystem", "/home/mr/Desktop/Geographical Informations Systems (GIS)"]
```

### 3. `postgres`

**Name**: postgres  
**Purpose**: PostGIS/PostgreSQL execution gateway. Powers SQL scheme verifications, test geometries, and tenant simulation scripts.  
**When to invoke**: DB-AGENT operations, test setups, or fallback-verification querying.  
**Example invocation**: `mcp__postgres__query("SELECT tablename... FROM pg_tables")`  
**Related agents/skills**: `DB-AGENT`, `TEST-AGENT`  
**Configuration snippet**:

```json
"command": "npx",
"args": ["@modelcontextprotocol/server-postgres", "postgresql://...]"]
```

---

## 🌎 P1 Geospatial Data

### 4. `gmp-code-assist`

**Name**: gmp-code-assist  
**Purpose**: Integrated Google Maps Platform assistance via MCP. Retrieve docs, code samples, and architecture centers.  
**When to invoke**: Google Maps Platform integrations  
**Example invocation**: `Call retrieve-instructions then retrieve-google-maps-platform-docs`  
**Related agents/skills**: `MAP-AGENT`, `ANTIGRAVITY-AGENT`  
**Configuration snippet**:

```json
"command": "npx",
"args": ["-y", "@google/mcp-gmp-code-assist"]
```

### 5. `gis-mcp`

**Name**: gis-mcp  
**Purpose**: Calculates spatial algorithms unmanageable by Turf.js, enforces CapeTown bbox strict checking, and validates external spatial formats.  
**When to invoke**: Analyzing incoming Open Data drops.  
**Example invocation**: `mcp__gis-mcp__validate_geometry(geojson_path="...")`  
**Related agents/skills**: `DATA-AGENT`, `SPATIAL-AGENT`  
**Configuration snippet**:

```json
"command": "uvx",
"args": ["gis-mcp"]
```

### 6. `formats`

**Name**: formats  
**Purpose**: Extrapolates attributes from Shapefiles, determines projection strings (`.prj`), and traverses GeoPackage internal properties.  
**When to invoke**: Determining proprietary GIS structures before ETL imports.  
**Example invocation**: `mcp__formats__validate_shapefile(path="data/cadastral.shp")`  
**Related agents/skills**: `DATA-AGENT`  
**Configuration snippet**:

```json
"command": "node",
"args": ["mcp/formats/server.js"]
```

---

## 🏗️ P2 Operational Sandbox

### 7. `playwright`

**Name**: playwright  
**Purpose**: Automation engine for E2E integration, screenshot capturing, and asserting DOM configurations.  
**When to invoke**: Resolving QA or verifying Core Web Vital budgets.  
**Example invocation**: `mcp__playwright__screenshot(...)`  
**Related agents/skills**: `TEST-AGENT`, `PERFORMANCE-AGENT`  
**Configuration snippet**:

```json
"command": "npx",
"args": ["playwright-mcp-server"]
```

### 8. `docker`

**Name**: docker  
**Purpose**: Orchestrates and inspects GIS stack containers like Martin servers or local Postgres setups.  
**When to invoke**: Reloading container environments or checking logs for tile-fetching errors.  
**Example invocation**: `mcp__docker__container_logs("martin", tail=50)`  
**Related agents/skills**: `TILE-AGENT`, `TEST-AGENT`  
**Configuration snippet**:

```json
"command": "npx",
"args": ["docker-mcp"]
```

# MCP_SERVERS.md — MCP Fleet Reference

**Name**: .github/MCP_SERVERS.md  
**Purpose**: Documents active Model Context Protocol (MCP) servers providing external operational tools to the Copilot IDE environment (where supported by extensions like VS Code).  
**When to invoke**: When configuring new tools or verifying IDE integrations.  
**Example invocation**: Reading `.github/MCP_SERVERS.md`  
**Related agents/skills**: `@workspace`  
**Configuration snippet**:

```json
"github.copilot.mcpServers": {
  "filesystem": {
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-filesystem", "..."]
  }
}
```

---

## 🚦 P0 Core Execution

These must be **HEALTHY**. Halt operations if **UNREACHABLE**.

### 1. `doc-state`

**Name**: doc-state  
**Purpose**: Distributed document locking. Prevents concurrent context-clobbering on large shared artifacts like `INDEX.md`.  
**When to invoke**: Writing `INDEX.md`, `CHANGELOG_AUTO.md`  
**Example invocation**: `mcp__doc-state__acquire_lock(path="docs/INDEX.md")`  
**Related agents/skills**: `@workspace`  
**Configuration snippet**:

```json
"command": "node",
"args": ["mcp/doc-state/server.js"]
```

### 2. `filesystem`

**Name**: filesystem  
**Purpose**: Constrained read/write sandbox bounded safely to the active GIS repository.  
**When to invoke**: Reading logic or generating components.  
**Example invocation**: `mcp__filesystem__read_file(".github/AGENTS.md")`  
**Related agents/skills**: Supported across all Agents  
**Configuration snippet**:

```json
"command": "npx",
"args": ["-y", "@modelcontextprotocol/server-filesystem", "/home/mr/Desktop/Geographical Informations Systems (GIS)"]
```

### 3. `postgres`

**Name**: postgres  
**Purpose**: PostGIS/PostgreSQL execution gateway. Powers SQL scheme verifications, test geometries, and tenant simulation scripts.  
**When to invoke**: DB-MODE operations, test setups.  
**Example invocation**: `mcp__postgres__query("SELECT tablename... FROM pg_tables")`  
**Related agents/skills**: `DB-MODE`  
**Configuration snippet**:

```json
"command": "npx",
"args": ["@modelcontextprotocol/server-postgres", "postgresql://...]"]
```

---

## 🌎 P1 Geospatial Data

### 4. `gis-mcp`

**Name**: gis-mcp  
**Purpose**: Calculates spatial algorithms unmanageable by Turf.js, enforces CapeTown bbox strict checking, and validates external spatial formats.  
**When to invoke**: Analyzing incoming Open Data drops.  
**Example invocation**: `mcp__gis-mcp__validate_geometry(geojson_path="...")`  
**Related agents/skills**: `DATA-MODE`  
**Configuration snippet**:

```json
"command": "uvx",
"args": ["gis-mcp"]
```

### 5. `formats`

**Name**: formats  
**Purpose**: Extrapolates attributes from Shapefiles, determines projection strings (`.prj`), and traverses GeoPackage internal properties.  
**When to invoke**: Determining proprietary GIS structures before ETL imports.  
**Example invocation**: `mcp__formats__validate_shapefile(path="data/cadastral.shp")`  
**Related agents/skills**: `DATA-MODE`  
**Configuration snippet**:

```json
"command": "node",
"args": ["mcp/formats/server.js"]
```

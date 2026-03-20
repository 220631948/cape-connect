# IMPLEMENTATION_PLAN.md — CapeTown GIS Hub
<!-- This file tracks the current active implementation step for the autonomous loop. -->

## Current Priority Task
**Implement `postgis-pipeline` MCP Server (from M17 Advanced Geospatial Analysis)**

## Context
The `postgis-pipeline` MCP server provides spatial analysis tools (like `analyze_area`, `get_tenant_spatial_stats`, `ST_IsValid`, `CRS_Collision_Detection`) against the PostGIS database. It must enforce RLS using the tenant_id, use three-tier fallback, and integrate into `mcp.config.json`.

## Proposed Changes
### 1. Create `mcp/postgis-pipeline/server.js`
- Initialize MCP SDK (`@modelcontextprotocol/sdk`) with `stdio` transport.
- Define `analyze_area` tool using a PostGIS query for advanced density/zoning checks.
- Define `get_tenant_spatial_stats` querying `valuation_data` via `pg` (Postgres client) with RLS set.
- Define `ST_IsValid` querying `SELECT ST_IsValid(ST_GeomFromText($1))`.
- Define `CRS_Collision_Detection` tool.
- Connect to database using `DATABASE_URL`.

### 2. Update `mcp.config.json`
- Add `"postgis-pipeline"` entry pointing to `node mcp/postgis-pipeline/server.js`.

### 3. Add necessary dependencies
- `pg`

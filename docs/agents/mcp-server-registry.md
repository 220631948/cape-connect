# MCP Server Registry

This document catalogs the unified Model Context Protocol (MCP) servers deployed across the workspace agents (Gemini, Claude, Copilot). All agents share this unified configuration.

## 1. Computer Use (`computerUse`)
* **Type:** stdio
* **Command:** `node mcp/computerUse/server.js`
* **Description:** Provides simulated browser interaction and workstation automation.

## 2. Chrome DevTools (`chrome-devtools`)
* **Type:** stdio
* **Command:** `npx -y chrome-devtools-mcp`
* **Description:** Browser inspection, screenshot capture, and network debugging.

## 3. Stitch (`stitch`)
* **Type:** stdio
* **Command:** `node mcp/stitch/server.js`
* **Description:** Workflow execution and GCP capabilities.

## 4. OpenAware (`openaware`)
* **Type:** stdio
* **Command:** `node mcp/openaware/server.js`
* **Description:** Open-source code intelligence and contextual retrieval.

## 5. Vercel (`vercel`)
* **Type:** stdio
* **Command:** `npx -y vercel-mcp`
* **Description:** Deployment fetching, log reading, and project metadata.
* **Env:** `VERCEL_TOKEN`

## 6. Cesium (`cesium`)
* **Type:** stdio
* **Command:** `node mcp/cesium/server.js`
* **Description:** Cesium architectural integration and APIs.

## 7. Formats (`formats`)
* **Type:** stdio
* **Command:** `node mcp/formats/server.js`
* **Description:** Formatting rules parsing and operations.

## 8. Filesystem (`filesystem`)
* **Type:** stdio
* **Command:** `npx -y @modelcontextprotocol/server-filesystem /home/mr/Desktop/Geographical Informations Systems (GIS)`
* **Description:** File system access to the project root.

## 9. Postgres (`postgres`)
* **Type:** stdio
* **Command:** `npx -y @modelcontextprotocol/server-postgres postgresql://postgres:postgres@localhost:5432/capegis`
* **Description:** Postgres database schema and read access for agents.

## 10. Gemini Deep Research (`gemini-deep-research`)
* **Type:** stdio
* **Command:** `node .gemini/extensions/gemini-deep-research/scripts/start.cjs`
* **Description:** Gemini deep research automated workflows.
* **Env:** `GEMINI_DEEP_RESEARCH_API_KEY`

## 11. Context7 (`context7`)
* **Type:** stdio
* **Command:** `npx -y @upstash/context7-mcp`
* **Description:** Up-to-date library docs (MapLibre, Supabase, Next.js, PostGIS).
* **Env:** `CONTEXT7_API_KEY`

## 12. Exa (`exa`)
* **Type:** stdio
* **Command:** `npx -y exa-mcp-server`
* **Description:** Web search for current GIS research and best practices.

## 13. Playwright (`playwright`)
* **Type:** stdio
* **Command:** `npx -y playwright-mcp-server`
* **Description:** Browser automation for E2E testing and UI validation.

## 14. Docker (`docker`)
* **Type:** stdio
* **Command:** `npx -y docker-mcp`
* **Description:** Docker container and image management for local dev.

## 15. LocalStack (`localstack`)
* **Type:** stdio
* **Command:** `npx -y @localstack/localstack-mcp-server`
* **Description:** Local AWS stack for S3, Lambda, and infrastructure emulation.

## 16. Sequential Thinking (`sequentialthinking`)
* **Type:** stdio
* **Command:** `docker run -i --rm mcp/sequentialthinking`
* **Description:** Chain-of-thought sequential reasoning for complex spatial queries.

## 17. GIS MCP (`gis-mcp`)
* **Type:** stdio
* **Command:** `uvx gis-mcp`
* **Description:** Geospatial data querying and GIS operations.

## 18. Doc State (`doc-state`)
* **Type:** stdio
* **Command:** `node mcp/doc-state/server.js`
* **Description:** Distributed state/lock management for documentation indexes.

## 19. Cesium Ion (`cesium-ion`)
* **Type:** sse
* **URL:** `https://mcp.cesium.com/sse`
* **Description:** Cesium ion 3D asset and tileset management.

## 20. OpenSky (`opensky`)
* **Type:** stdio
* **Command:** `node scripts/opensky-mcp-wrapper.js`
* **Description:** OpenSky Network ADS-B flight queries over Cape Town airspace.

## 21. Nerfstudio (`nerfstudio`)
* **Type:** stdio
* **Command:** `python -m nerfstudio.mcp_server`
* **Description:** Nerfstudio NeRF/3DGS training and scene reconstruction.

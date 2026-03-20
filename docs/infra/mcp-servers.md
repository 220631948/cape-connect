# MCP Servers Reference

> **TL;DR:** The platform operates a unified Model Context Protocol (MCP) fleet via a **zero-dependency Gateway** (`mcp-gateway.js`) on port 3001. All agents interact with 21 servers over SSE. Standardized credentials are loaded from `.env`.

## 🏗️ Unified MCP Gateway

The Gateway exposes stdio-based MCP servers over HTTP/SSE, enabling cross-agent tool usage and remote access.

- **Status:** ✅ RUNNING
- **Port:** `3001`
- **Endpoint:** `http://localhost:3001/sse?serverId={name}`
- **Health:** `http://localhost:3001/health`

## 🚀 Active MCP Fleet (21 Servers)

| Server ID | Type | Role | Status |
|---|---|---|---|
| `chrome-devtools` | stdio | Browser inspection and network debugging | ✅ RUNNING |
| `stitch` | stdio | Google Stitch workflow orchestration | ✅ RUNNING |
| `computerUse` | stdio | UI automation and OS simulation | ✅ RUNNING |
| `openaware` | stdio | Qodo open-source code intelligence | ✅ RUNNING |
| `cesium` | stdio | Local 3D asset management APIs | ✅ RUNNING |
| `formats` | stdio | GIS format validation and OGR2OGR | ✅ RUNNING |
| `filesystem` | stdio | Local workspace file access | ✅ RUNNING |
| `postgres` | stdio | PostGIS schema and data querying | ✅ RUNNING |
| `vercel` | stdio | Deployment fetching and log reading | ✅ RUNNING |
| `gemini-deep-research` | stdio | Automated deep research workflows | ✅ RUNNING |
| `context7` | stdio | Up-to-date library documentation | ✅ RUNNING |
| `exa` | stdio | Semantic web search for GIS research | ✅ RUNNING |
| `playwright` | stdio | Headless browser testing and E2E | ✅ RUNNING |
| `doc-state` | stdio | Document index sync and locking | ✅ RUNNING |
| `cesium-ion` | sse | Remote 3D asset and tileset hosting | ✅ RUNNING |
| `opensky` | stdio | Live ADS-B flight tracking (Cape Town) | ✅ RUNNING |
| `nerfstudio` | stdio | NeRF/3DGS training orchestration | ✅ RUNNING |
| `gis-mcp` | stdio | Geospatial data querying and GIS ops | ✅ RUNNING |
| `docker` | stdio | Container and image management | ⚠️ BLOCKED [1] |
| `localstack` | stdio | Local AWS infrastructure emulation | ⚠️ BLOCKED [1] |
| `sequentialthinking` | stdio | Chain-of-thought spatial reasoning | ⚠️ BLOCKED [1] |

[1] *Requires local docker.sock (currently unavailable in host environment).*

## 🔐 Security & Environment

- **Credential Rule:** All keys (e.g., `VERCEL_TOKEN`, `EXA_API_KEY`) are stored in `.env` and loaded by the Gateway at startup.
- **Isolation:** Each MCP session is isolated via a unique `sessionId` mapped to a child process.
- **Sanitization:** Input arguments and environment variables are sanitized before process spawning.

## 🛠️ Usage for Agents

To connect to a server via the Gateway:
```bash
# Example for a client using SSE
GET http://localhost:3001/sse?serverId=filesystem
```

## References
- `mcp.config.json` (Fleet Source of Truth)
- `mcp-gateway.js` (Infrastructure)
- `CLAUDE.md` (Security Rules)

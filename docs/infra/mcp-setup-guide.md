# MCP Setup Guide — CapeTown GIS Hub

> **TL;DR:** Set `COPILOT_MCP_<SERVER>_<KEY>` env vars in GitHub repo secrets → Copilot coding agent picks them up automatically. Only Exa needs a credential today. Test locally with `npx @modelcontextprotocol/inspector`. Planned servers (Cesium, OpenSky, Nerfstudio) are documented in `.github/copilot/mcp-planned.json`.

---

## Contents

1. [Active Servers Overview](#1-active-servers-overview)
2. [Setting COPILOT_MCP_ Env Vars](#2-setting-copilot_mcp_-env-vars)
3. [GitHub Repository Secrets (CI)](#3-github-repository-secrets-ci)
4. [Testing MCP Connections Locally](#4-testing-mcp-connections-locally)
5. [Per-Server Credential Guide](#5-per-server-credential-guide)
6. [Troubleshooting](#6-troubleshooting)
7. [Security Checklist](#7-security-checklist)
8. [Planned Servers](#8-planned-servers)

---

## 1. Active Servers Overview

| Server | Transport | Credential Required | Used By |
|---|---|---|---|
| **context7** | HTTP (no auth) | None | All agents |
| **exa** | HTTP + API key | `COPILOT_MCP_EXA_API_KEY` | data-agent, spatial-agent |
| **playwright** | stdio (npx) | None | test-agent, map-agent |

Config file: `.github/copilot/mcp.json`

---

## 2. Setting COPILOT_MCP_ Env Vars

GitHub Copilot coding agent **only** exposes environment variables prefixed `COPILOT_MCP_` to MCP server configs. Use this exact prefix — other env var names are not forwarded.

### In the Copilot coding agent environment (repo settings)

1. Go to **GitHub.com → Your Repo → Settings → Copilot → Coding agent**.
2. Under **"Environment secrets"**, add each variable:
   - Name: `COPILOT_MCP_EXA_API_KEY`
   - Value: your Exa API key
3. Save. The variable is now available to MCP configs as `${COPILOT_MCP_EXA_API_KEY}`.

### In local development (.env.local)

```bash
# .env.local  — never commit this file
COPILOT_MCP_EXA_API_KEY=your_exa_key_here
```

Export before running the Copilot CLI locally:

```bash
export $(grep -v '^#' .env.local | xargs)
```

---

## 3. GitHub Repository Secrets (CI)

For GitHub Actions workflows that invoke MCP-aware steps:

1. **Settings → Secrets and variables → Actions → New repository secret**
2. Add secrets matching the env var names:

```
COPILOT_MCP_EXA_API_KEY        → Exa Search API key
COPILOT_MCP_CESIUM_ION_TOKEN   → (future, M4b)
COPILOT_MCP_OPENSKY_USERNAME   → (future, M5+)
COPILOT_MCP_OPENSKY_PASSWORD   → (future, M5+)
COPILOT_MCP_NERFSTUDIO_HOST    → (future, Phase 2)
COPILOT_MCP_NERFSTUDIO_API_KEY → (future, Phase 2)
```

Reference in workflow YAML:

```yaml
env:
  COPILOT_MCP_EXA_API_KEY: ${{ secrets.COPILOT_MCP_EXA_API_KEY }}
```

---

## 4. Testing MCP Connections Locally

### Using MCP Inspector (recommended)

```bash
# Install once
npm install -g @modelcontextprotocol/inspector

# Test context7 (no auth)
npx @modelcontextprotocol/inspector http https://mcp.context7.com/mcp

# Test Exa (needs API key in env)
COPILOT_MCP_EXA_API_KEY=your_key \
  npx @modelcontextprotocol/inspector http https://mcp.exa.ai/mcp \
  --header "x-api-key: your_key"

# Test Playwright (stdio)
npx @modelcontextprotocol/inspector npx @playwright/mcp@latest
```

The inspector opens a browser UI at `http://localhost:5173` — use it to list tools, call them manually, and verify responses.

### Quick health check (curl)

```bash
# context7 — should return 200 + JSON schema
curl -s https://mcp.context7.com/mcp -X POST \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | jq .

# Exa
curl -s https://mcp.exa.ai/mcp -X POST \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${COPILOT_MCP_EXA_API_KEY}" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | jq .
```

---

## 5. Per-Server Credential Guide

### context7

- **What it does:** Returns current, version-aware docs for MapLibre GL JS, Supabase, Next.js, PostGIS, and 300+ other libraries. Prevents agents from using stale API patterns.
- **Credentials:** None required.
- **Agents:** All agents — especially map-agent and data-agent.
- **Get access:** Public HTTP endpoint, no signup needed.

---

### exa

- **What it does:** Semantic web search scoped to GIS research, urban data, PostGIS patterns, and Cape Town planning resources.
- **Credentials:** `COPILOT_MCP_EXA_API_KEY`
- **How to get key:**
  1. Sign up at [https://exa.ai](https://exa.ai)
  2. Dashboard → API Keys → Create key
  3. Label it `capegis-copilot`
  4. Add to GitHub repo secrets (see §3)
- **Agents:** data-agent, spatial-agent, infra-agent.
- **Without key:** Exa MCP server returns 401; agents fall back to context7 + built-in knowledge.

---

### playwright

- **What it does:** Headless browser automation for E2E testing, screenshot capture, and UI validation of the CapeTown GIS Hub PWA.
- **Credentials:** None required (`npx` downloads the package automatically).
- **Prerequisite:** Node.js ≥ 18 and `npx` available on PATH. Install browsers once:

  ```bash
  npx playwright install chromium
  ```

- **Agents:** test-agent, map-agent (UI validation).
- **Note:** The `@playwright/mcp@latest` package is fetched on each invocation. Pin to a specific version in `mcp.json` for reproducibility if needed.

---

## 6. Troubleshooting

| Symptom | Likely Cause | Fix |
|---|---|---|
| `401 Unauthorized` from Exa | Missing/wrong API key | Verify `COPILOT_MCP_EXA_API_KEY` is set in repo secrets |
| `tool not found` errors | Server not reachable or wrong URL | Run MCP Inspector health check (§4) |
| Playwright `ENOENT npx` | npx not on PATH in agent env | Ensure Node.js is installed in the runner |
| context7 timeout | Transient network issue | Retry; endpoint is stateless |
| Env var `${COPILOT_MCP_...}` not substituted | Wrong prefix or typo | Prefix must be exactly `COPILOT_MCP_` |
| OAuth MCP server refused | Remote OAuth not supported | Only API key / Bearer auth is supported |

**Debug tip:** In GitHub Copilot coding agent sessions, ask the agent to run `tools/list` against the MCP server to confirm it is connected and enumerate available tools.

---

## 7. Security Checklist

- [ ] **Never commit API keys** — `.env.local` is in `.gitignore`; verify with `git status`
- [ ] **Use env vars exclusively** — no hardcoded credentials in `mcp.json` (CLAUDE.md Rule 3)
- [ ] **Rotate keys regularly** — set a calendar reminder every 90 days
- [ ] **Minimum scope** — create Exa API keys scoped to search only; avoid admin keys
- [ ] **Secret scanning enabled** — confirm GitHub secret scanning is active in repo Security settings
- [ ] **Audit log** — review Copilot coding agent session logs for unexpected MCP tool calls
- [ ] **Planned server creds** — add Cesium/OpenSky/Nerfstudio secrets only when their milestone is reached

---

## 8. Planned Servers

Full specs in `.github/copilot/mcp-planned.json`. Summary:

| Server | Milestone | Env Vars Needed | Status |
|---|---|---|---|
| **cesium-ion** | M4b | `COPILOT_MCP_CESIUM_ION_TOKEN` | Not active |
| **opensky** | M5+ | `COPILOT_MCP_OPENSKY_USERNAME`, `COPILOT_MCP_OPENSKY_PASSWORD` | Not active |
| **nerfstudio** | Phase 2 | `COPILOT_MCP_NERFSTUDIO_HOST`, `COPILOT_MCP_NERFSTUDIO_API_KEY` | Not active |

To activate a planned server:
1. Confirm the milestone DoD with a human reviewer.
2. Add its secrets to GitHub repo settings.
3. Uncomment its block in `.github/copilot/mcp.json`.
4. Test with MCP Inspector (§4).

---

*Last updated: 2026-03 · See `docs/infra/mcp-servers.md` for architecture overview · CLAUDE.md Rule 3 governs all credential handling*

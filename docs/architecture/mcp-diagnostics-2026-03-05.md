# MCP Diagnostics Report — CapeTown GIS Hub

**Date:** 2026-03-05  
**Scope:** Claude Code + GitHub Copilot CLI  
**Method:** `mcp:diagnose --targets="claude-code,copilot-cli" --check="servers,tools,config,status"`  
**Status:** ⚠️ ISSUES FOUND — see fixes applied below

---

## Executive Summary

| Target | Servers found | Working | Broken | Stubs (no tools) | Security |
|---|---|---|---|---|---|
| Claude Code (global) | 4 | 2 | 0 | 0 | ⚠️ `STITCH_API_KEY` unset |
| Claude Code (project) | 5 | 1 | 1 | 3 | — |
| Copilot CLI (global) | 4 | 4 | 0 | 0 | 🚨 2 hardcoded API keys |
| Copilot CLI (project) | 7 | 2 | 5 | 0 | — |

**Critical fixes applied:** `vercel` broken package removed; 4 non-existent packages removed from project MCP config; stub servers that shadow real implementations removed from `./claude.json`.

---

## 1. Claude Code MCP — Full Inventory

Claude Code loads MCP servers from two layers (project-level overrides global for same server name):

### Layer A — Global project scope (`~/.claude.json` → project entry)

| Server | Command | Script exists? | Status | Issue |
|---|---|---|---|---|
| `stitch` | `npx @modelcontextprotocol/cli sse https://stitch.googleapis.com/mcp` | N/A (cloud) | ⚠️ BROKEN | `STITCH_API_KEY` env var not set — will fail at auth |
| `open-aware` | `npx @modelcontextprotocol/cli sse https://open-aware.qodo.ai/mcp` | N/A (cloud) | ✅ LIKELY OK | No API key needed; unique name (not shadowed) |
| `gemini-deep-research` | `node .gemini/extensions/gemini-deep-research/scripts/start.cjs` | ✅ | ⚠️ UNVERIFIED | Real implementation; Gemini API key requirement unknown |
| `computerUse` | `bash .gemini/extensions/computer-use/servers/run.sh` | ✅ | ⚠️ NEEDS PYTHON 3.10+ | Real implementation; Python venv setup needed |

### Layer B — Project root (`./claude.json`) — takes precedence over Layer A for same names

| Server | Command | Status | Issue |
|---|---|---|---|
| `chrome-devtools` | `npx -y chrome-devtools-mcp` | ✅ WORKS | None; requires running Chrome instance for full use |
| `stitch` | `node ./mcp/stitch/server.js` | 🚫 STUB — 0 tools | **Shadows Layer A `stitch` with empty stub!** — FIXED (removed) |
| `computerUse` | `node ./mcp/computerUse/server.js` | 🚫 STUB — 0 tools | **Shadows Layer A `computerUse` with empty stub!** — FIXED (removed) |
| `openaware` | `node ./mcp/openaware/server.js` | 🚫 STUB — 0 tools | Distinct name from `open-aware`; stub only — FIXED (removed) |
| `vercel` | `npx -y @modelcontextprotocol/server-vercel` | ❌ BROKEN | **Package does not exist on npm (HTTP 404)** — FIXED (removed) |

**Shadowing conflict:** `stitch` and `computerUse` were defined in both layers. Project-level Layer B took precedence, replacing real implementations with empty stubs. No tools were exposed to Claude Code for these servers.

### Effective tool exposure (Claude Code, after fixes)

| Server | Tools exposed |
|---|---|
| `chrome-devtools` | Browser DevTools debugging tools (Chrome connection required) |
| `open-aware` | Qodo cross-repo intelligence tools (cloud SSE) |
| `stitch` | Google Stitch UI tools (cloud SSE — **requires `STITCH_API_KEY`**) |
| `gemini-deep-research` | Deep research tools (unverified — Gemini key needed) |
| `computerUse` | Computer use / screenshot tools (requires Python 3.10+ venv) |

---

## 2. Copilot CLI MCP — Full Inventory

### Layer A — Global (`~/.copilot/mcp-config.json`)

| Server | Command | Package/module exists? | Status | Issue |
|---|---|---|---|---|
| `context7` | `node ~/.local/lib/node_modules/@upstash/context7-mcp/dist/index.js` | ✅ installed | ⚠️ SECURITY | `CONTEXT7_API_KEY` hardcoded in plain JSON — see DEV-001 / DEV-006 |
| `exa` | `npx -y exa-mcp-server` | ✅ (npx) | ⚠️ SECURITY | `EXA_API_KEY` hardcoded in plain JSON — see DEV-001 / DEV-006 |
| `supabase` | HTTP `https://mcp.supabase.com/mcp` | N/A (HTTP) | ✅ WORKS | OAuth token cached in `~/.copilot/mcp-oauth-config/` |
| `playwright` | `npx -y @playwright/mcp@latest` | ✅ v0.0.68 | ✅ WORKS | None |

### Layer B — Project (`./copilot/mcp-config.json`) — before fixes

| Server | Package | npm exists? | Status |
|---|---|---|---|
| `context7` | `@modelcontextprotocol/server-context7` | ❌ NOT FOUND | Broken — also redundant (global handles it) |
| `exa` | `@modelcontextprotocol/server-exa` | ❌ NOT FOUND | Broken — fixed to `exa-mcp-server` |
| `vercel` | `@modelcontextprotocol/server-vercel` | ❌ NOT FOUND | Broken — removed |
| `docker` | `@modelcontextprotocol/server-docker` | ❌ NOT FOUND | Broken — removed |
| `localstack` | `@localstack/mcp-server` | ❌ NOT FOUND | Broken + not in approved tech stack — removed |
| `sequentialthinking` | Docker image `danielapatin/sequentialthinking:latest` | Docker ✅ | ⚠️ Image not verified; Docker available |
| `gis-mcp` | `uvx gis-mcp` | uvx ✅ installed | ⚠️ Package availability unverified (slow pull) |

**5 of 7 project-level servers were completely broken** (packages non-existent on npm).

### Effective tool exposure (Copilot CLI, after fixes)

| Server | Tools exposed |
|---|---|
| `context7` (global) | Up-to-date library documentation, code examples |
| `exa` (global) | Semantic web search |
| `supabase` (global) | Supabase project management, DB ops |
| `playwright` (global) | Browser automation, screenshot, DOM interaction |
| `exa` (project) | Now fixed to correct package; env-var key reference |
| `sequentialthinking` (project) | Sequential thought chain tools (Docker pull needed) |
| `gis-mcp` (project) | GIS/geospatial tools via uvx (pull on first use) |

---

## 3. Security Issues

### 🚨 DEV-006: Hardcoded API keys in `~/.copilot/mcp-config.json`

The global Copilot CLI MCP config contains API keys in plaintext:

```json
"CONTEXT7_API_KEY": "ctx7sk-845d7617-bec2-4013-a930-1369661c9c30"
"EXA_API_KEY": "b9ad4b15-1cc9-42bd-9a9b-55cec7a86edc"
```

**This is the same key pair committed to git in DEV-001.** Both must be treated as compromised.

**Required action:**
1. Rotate both keys at their provider dashboards
2. Edit `~/.copilot/mcp-config.json` to use env var references:
   ```json
   "CONTEXT7_API_KEY": "${CONTEXT7_API_KEY}"
   "EXA_API_KEY": "${EXA_API_KEY}"
   ```
3. Set env vars in shell profile (`~/.bashrc` or `~/.zshrc`) — **not in any committed file**
4. Note: `CONTEXT7_API_KEY`, `EXA_API_KEY` and `VERCEL_TOKEN` are in `.env` but `.env` is gitignored ✅

> The `~/.copilot/mcp-config.json` file is outside the project root and is **not editable by this agent** without explicit human action. Steps above are manual.

---

## 4. Configuration File Map

```
Claude Code
├── ~/.claude.json                          ← global settings + project-scope MCP servers
│   └── projects["/home/mr/Desktop/..."].mcpServers
│       ├── stitch        (cloud SSE — STITCH_API_KEY needed)
│       ├── open-aware    (cloud SSE — no key needed)
│       ├── gemini-deep-research  (.gemini extension script)
│       └── computerUse   (.gemini extension script)
└── ./claude.json                           ← project-level MCP (FIXED)
    └── mcpServers
        └── chrome-devtools  (npx — WORKS ✅)

Copilot CLI
├── ~/.copilot/mcp-config.json              ← global MCP (NEEDS KEY ROTATION)
│   ├── context7    (module installed, key hardcoded 🚨)
│   ├── exa         (npx, key hardcoded 🚨)
│   ├── supabase    (HTTP OAuth — WORKS ✅)
│   └── playwright  (npx — WORKS ✅)
└── .copilot/mcp-config.json               ← project MCP (FIXED)
    ├── exa             (fixed: exa-mcp-server)
    ├── sequentialthinking  (Docker — unverified)
    └── gis-mcp         (uvx — unverified)
```

---

## 5. Fixes Applied (this session)

| # | File | Fix | Severity |
|---|---|---|---|
| F-01 | `./claude.json` | Removed `vercel` (package `@modelcontextprotocol/server-vercel` does not exist on npm) | ❌ → ✅ |
| F-02 | `./claude.json` | Removed `stitch` stub (was shadowing real cloud SSE server with 0-tool stub) | 🚫 → ✅ |
| F-03 | `./claude.json` | Removed `computerUse` stub (was shadowing real `.gemini` extension with 0-tool stub) | 🚫 → ✅ |
| F-04 | `./claude.json` | Removed `openaware` stub (0-tool stub, no value) | 🚫 → ✅ |
| F-05 | `.copilot/mcp-config.json` | Removed `context7` (package `@modelcontextprotocol/server-context7` does not exist; global handles it correctly) | ❌ → ✅ |
| F-06 | `.copilot/mcp-config.json` | Fixed `exa`: replaced `@modelcontextprotocol/server-exa` with `exa-mcp-server` (correct package); switched to env var key ref | ❌ → ✅ |
| F-07 | `.copilot/mcp-config.json` | Removed `vercel` (package does not exist on npm) | ❌ → ✅ |
| F-08 | `.copilot/mcp-config.json` | Removed `docker` (package `@modelcontextprotocol/server-docker` does not exist) | ❌ → ✅ |
| F-09 | `.copilot/mcp-config.json` | Removed `localstack` (package does not exist + LocalStack not in approved tech stack per TECH_STACK.md §6) | ❌ → ✅ |

## 6. Manual Actions Required (cannot be automated)

| Priority | Action |
|---|---|
| 🚨 CRITICAL | Rotate `CONTEXT7_API_KEY` (compromised — hardcoded in `~/.copilot/mcp-config.json` and previously in git) |
| 🚨 CRITICAL | Rotate `EXA_API_KEY` (same issue) |
| 🚨 CRITICAL | Edit `~/.copilot/mcp-config.json` to use `${CONTEXT7_API_KEY}` and `${EXA_API_KEY}` env var references |
| ⚠️ HIGH | Set `STITCH_API_KEY` in environment (shell profile) — required for `stitch` cloud SSE server |
| ⚠️ HIGH | Verify `gemini-deep-research` — confirm Gemini API key and test startup |
| ⚠️ HIGH | Verify `computerUse` — run `.gemini/extensions/computer-use/servers/run.sh` manually, confirm Python 3.10+ venv builds |
| ℹ️ LOW | Pull and test `sequentialthinking` Docker image: `docker pull danielapatin/sequentialthinking:latest` |
| ℹ️ LOW | Test `gis-mcp` via uvx: `uvx gis-mcp --help` |

---

*Generated by mcp:diagnose audit · 2026-03-05 · All fixes committed in same changeset*

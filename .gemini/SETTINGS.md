# SETTINGS.md — Settings Reference

**Name**: .gemini/SETTINGS.md  
**Purpose**: Documents the Gemini configuration boundaries encoded in `~/.config/gemini/settings.json`. Defines execution permissions, token limits, and MCP connections for the AI Studio / IDE environment.  
**When to invoke**: When diagnosing Sandbox blocks, verifying domain-fetch constraints, or orchestrating new hook definitions locally.  
**Example invocation**: Read `.gemini/SETTINGS.md`  
**Related agents/skills**: `GEMINI-COMPLIANCE-AGENT`  
**Configuration snippet**: N/A (Registry definition)

---

## 🛠️ Workspaces Configurations

### 1. `settings.json`

**Name**: settings.json (Shared Workspace Settings)  
**Purpose**: Tracks the fleet of all active `mcpServers` and API keys for the Gemini agent workspace.  
**When to invoke**: Adding a new global MCP execution path (e.g. `doc-state`).  
**Example invocation**: N/A  
**Related agents/skills**: N/A  
**Configuration snippet**:

```json
{
  "mcpServers": {
    "gmp-code-assist": true,
    "sequential-thinking": true
  },
  "contextWindow": "2097152"
}
```

### 2. Sandbox Configurations

**Name**: Local Overrides  
**Purpose**: Overrides operational sandbox defaults: enables Git operations without warnings, allows domain fetches exclusively to approved sources, and powers the local `hooks` dictionary execution. Assumed per-developer defaults.  
**When to invoke**: Debugging Bash block errors or building a `.gemini/hooks/` execution flow.  
**Example invocation**: N/A  
**Related agents/skills**: N/A  
**Configuration snippet**:

```json
{
  "permissions": { "allow": [...] },
  "sandbox": { "enabled": true, "autoAllowBashIfSandboxed": true }
}
```

---

## 🔒 Permission Grants

### 3. Bash Permissions Allowed

**Name**: sandbox.permissions.Bash  
**Purpose**: White-lists read-only and version-control capabilities without repetitive human permission constraints (`ls`, `cat`, `curl`).  
**When to invoke**: Required passively for agent inspection operations.  
**Example invocation**: `ls -lah`  
**Related agents/skills**: N/A  
**Configuration snippet**:

```json
"Bash(ls:*)",
"Bash(cat:*)",
"Bash(curl:*)"
```

### 4. WebFetch Authorized Domains

**Name**: sandbox.permissions.WebFetch  
**Purpose**: Restricts the `WebFetch` tool to a hard-coded set of verified Open Data and Infrastructure portals, protecting the ecosystem from SSRF attacks and arbitrary crawling loops.  
**When to invoke**: Scraping docs or retrieving `.json` catalogs.  
**Example invocation**: Fetching metadata from `odp.capetown.gov.za`  
**Related agents/skills**: `RESEARCHER`, `DATA-AGENT`  
**Configuration snippet**:

```json
"WebFetch(odp.capetown.gov.za)",
"WebFetch(github.com)"
```

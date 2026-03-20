# SETTINGS.md — CapeTown GIS Hub Claude Code Settings Reference

> Documents the configuration in `.claude/settings.json` (shared workspace) and `.claude/settings.local.json` (local overrides). Cross-reference: `.claude/HOOKS.md` for hook details, `.claude/MCP_SERVERS.md` for MCP server details.

**Last updated:** 2026-03-14

---

## File Overview

| File | Purpose | Committed? |
|------|---------|-----------|
| `settings.json` | Shared workspace settings — MCP servers, enabled plugins | ✅ Yes (in git) |
| `settings.local.json` | Local-only overrides — hooks, sandbox, permissions | ✅ Yes (in git, but local-intent) |

> **Note on settings.local.json:** Despite the `.local` suffix suggesting it should be gitignored, this file is committed to the repository because it contains shared hook configurations that all collaborators should use. Truly personal/machine-specific settings should be placed in `~/.claude/settings.json` (the global user settings file).

---

## settings.json — Shared Workspace Settings

### Structure
```json
{
  "mcpServers": { ... },   // 21 MCP server definitions
  "enabledPlugins": { ... } // Claude Code plugin activations
}
```

### `mcpServers` — MCP Fleet Configuration

The workspace configures 21 MCP servers. See `MCP_SERVERS.md` for full documentation of each server's purpose, agent usage, and example tool calls.

**Server configuration patterns:**

#### Pattern 1 — Local Node.js server
```json
"doc-state": {
  "command": "node",
  "args": ["mcp/doc-state/server.js"]
}
```
Used by: `doc-state`, `cesium`, `formats`, `openaware`, `stitch`, `computerUse`

**Rationale:** Local servers provide maximum control, no external dependencies, and work offline. Required for project-specific MCP servers.

#### Pattern 2 — npx package
```json
"filesystem": {
  "command": "npx",
  "args": ["-y", "@modelcontextprotocol/server-filesystem", "/home/mr/Desktop/Geographical Informations Systems (GIS)"]
}
```
Used by: `filesystem`, `postgres`, `exa`, `playwright`, `docker`, `localstack`, `chrome-devtools`

**Rationale:** Official MCP servers from the Model Context Protocol registry. The `-y` flag auto-confirms npx install. The scoped path in `filesystem` enforces the project root boundary.

**Security note:** The path argument `"/home/mr/Desktop/Geographical Informations Systems (GIS)"` scopes filesystem access to this project only. Never change this to `/` or `~`.

#### Pattern 3 — npm package with environment variable auth
```json
"vercel": {
  "command": "npx",
  "args": ["-y", "--package", "@vercel/sdk", "--", "mcp", "start"],
  "env": {
    "VERCEL_TOKEN": "${VERCEL_TOKEN}"
  }
}
```
Used by: `vercel`, `stitch` (NERFSTUDIO_PATH), `gemini-deep-research` (GEMINI_API_KEY), `context7` (CONTEXT7_API_KEY)

**Rationale:** The `env` block injects specific environment variables from the shell into the MCP server process. The `${VAR_NAME}` syntax reads from the parent environment — never hardcodes values (CLAUDE.md Rule 3).

#### Pattern 4 — Docker container
```json
"sequentialthinking": {
  "command": "docker",
  "args": ["run", "-i", "--rm", "danielapatin/sequentialthinking:latest", "-transport", "stdio"]
}
```
Used by: `sequentialthinking`

**Rationale:** Some MCP servers are distributed as Docker images. The `--rm` flag ensures the container is removed after use (no orphaned containers). `-i` enables interactive stdin/stdout.

#### Pattern 5 — HTTP/SSE remote server
```json
"cesium-ion": {
  "type": "sse",
  "url": "https://mcp.cesium.com/sse",
  "headers": {
    "Authorization": "Bearer ${COPILOT_MCP_CESIUM_ION_TOKEN}"
  }
}
```
Used by: `cesium-ion`, `nano-banana`

**Rationale:** Cloud-hosted MCP servers (Cesium Ion, Google Gemini) use SSE or HTTP transport. The `headers` block injects auth. The `${VAR}` syntax reads from environment — never hardcode tokens.

**Security implications:** Remote SSE connections are persistent — ensure the remote server is trusted before adding new SSE-type servers.

#### Pattern 6 — uvx (Python package runner)
```json
"gis-mcp": {
  "command": "uvx",
  "args": ["gis-mcp"]
}
```
Used by: `gis-mcp`

**Rationale:** `uvx` is the uv Python package runner (like `npx` for Python). Runs the `gis-mcp` PyPI package in an isolated venv. Requires `uv` to be installed (`pip install uv` or `brew install uv`).

---

### `enabledPlugins` — Claude Code Plugins

```json
"enabledPlugins": {
  "notebooklm-connector@claude-code-zero": true
}
```

**notebooklm-connector@claude-code-zero:** Enables the NotebookLM connector plugin, which allows Claude to query Google NotebookLM notebooks via the `notebooklm-manager` skill. Used by RESEARCHER for querying domain knowledge notebooks.

**Adding a new plugin:**
```json
"enabledPlugins": {
  "notebooklm-connector@claude-code-zero": true,
  "new-plugin@version": true
}
```
Only add plugins from trusted sources. Document additions in `docs/PLAN_DEVIATIONS.md` as a tech stack change (requires human approval per CLAUDE.md §2).

---

## settings.local.json — Local Override Settings

### Structure
```json
{
  "permissions": { "allow": [...] },
  "hooks": {
    "PostToolUse": [...],
    "PreToolUse": [...]
  },
  "sandbox": { ... }
}
```

---

### `permissions.allow` — Explicit Permission Grants

The allow list grants Claude specific Bash commands and WebFetch domains without requiring user confirmation.

#### Bash permissions
```json
"Bash(ls:*)",
"Bash(cat:*)",
"Bash(curl:*)"
```
These allow `ls`, `cat`, and `curl` with any arguments — used frequently by agents for file inspection and API health checks.

**Extension pattern:** To allow a new command:
```json
"Bash(git:*)"        // Allow all git commands
"Bash(npm:run *)"    // Allow npm run scripts only
"Bash(docker:ps)"    // Allow specific docker subcommand only
```

#### WebFetch domain allowlist
Only these domains are allowed for `WebFetch` calls without user confirmation:

| Domain | Purpose |
|--------|---------|
| `odp.capetown.gov.za` | City of Cape Town Open Data Portal |
| `odp-cctegis.opendata.arcgis.com` | Cape Town ArcGIS Online |
| `www.capetown.gov.za` | City of Cape Town main site |
| `data.gov.za` | South Africa national open data |
| `developers.google.com` | Google APIs documentation |
| `cesium.com` | Cesium documentation and Ion |
| `www.flightradar24.com` | Flight radar reference |
| `www.adsbexchange.com` | ADS-B flight data |
| `aviationstack.com` | Aviation API documentation |
| `flightaware.com` | FlightAware API documentation |
| `maplibre.org` | MapLibre GL JS documentation |
| `github.com` | GitHub repositories and raw content |
| `stackoverflow.com` | Technical Q&A |
| `docs.mapbox.com` | Mapbox documentation (style reference) |
| `openskynetwork.github.io` | OpenSky Network API docs |
| `www.here.com` | HERE Maps documentation |
| `www.flightaware.com` | FlightAware data reference |
| `raw.githubusercontent.com` | GitHub raw file access |
| `api.github.com` | GitHub REST API |
| `anthropic.com`, `www.anthropic.com` | Anthropic documentation |

**To add a new domain:**
```json
"WebFetch(domain:new-domain.com)"
```
Add to the `allow` array. Document in `docs/PLAN_DEVIATIONS.md` if the domain is outside the Cape Town / Western Cape scope.

**Security note:** Never add domains that could expose Claude to SSRF attacks or untrusted content. The allowlist protects against agents fetching arbitrary external URLs.

#### MCP tool permissions
```json
"mcp__notebooklm__setup_auth",
"mcp__notebooklm__get_health",
"mcp__notebooklm__cleanup_data",
"mcp__notebooklm__re_auth",
"Skill(notebooklm-connector:notebooklm-manager)"
```
These grant specific NotebookLM MCP tools and the skill invocation without requiring user confirmation. Required for the RESEARCHER agent to query domain knowledge notebooks.

---

### `hooks` — Automated Hooks

See `HOOKS.md` for full documentation of each hook. Summary:

| Hook | Type | Trigger | Action |
|------|------|---------|--------|
| Auto-linter | `PostToolUse` | `Edit\|MultiEdit` on `.js/.ts/.jsx/.tsx/.py/.rb` | Run ESLint/pylint/rubocop |
| Activity logger | `PreToolUse` | `*` (all tools) | Append to `~/.claude/command-log.txt` |

---

### `sandbox` — Sandbox Configuration

```json
"sandbox": {
  "enabled": true,
  "autoAllowBashIfSandboxed": true
}
```

**`enabled: true`** — The sandbox is active. Claude cannot write to paths outside the defined allowed list.

**`autoAllowBashIfSandboxed: true`** — Automatically permits Bash commands when the sandbox is already active, without requiring additional confirmation for each command.

**Sandbox allowed write paths (from system configuration):**
- `/tmp/claude-1000/` — temporary files
- Project directory (`.`) — all project files
- `~/.npm/_logs/` — npm log files
- `~/.claude/debug/` — Claude debug logs

**When sandbox causes failures:**
If a command fails with "Operation not permitted", the sandbox may be blocking access to a required path. Options:
1. Add the path to the sandbox allowlist (edit via `/sandbox` command)
2. Use `dangerouslyDisableSandbox: true` in Bash tool calls (requires user approval)
3. Restructure the operation to write within allowed paths

---

## How to Extend Settings

### Adding a new MCP server
1. Add entry to `settings.json` under `mcpServers`
2. Document in `MCP_SERVERS.md` with purpose, agents, and example tool calls
3. Add the server to relevant agents' MCP Servers list in `AGENTS.md`
4. Update `INDEX.md` if a new guide file is created
5. Commit: `config(mcp): add [server-name] MCP server`

### Adding a new WebFetch domain
1. Add `"WebFetch(domain:example.com)"` to `settings.local.json` permissions allow list
2. Document the domain purpose in this `SETTINGS.md` permissions table
3. If domain is outside Cape Town scope, log in `docs/PLAN_DEVIATIONS.md`

### Adding a new hook
1. Edit `settings.local.json` hooks section
2. Document in `HOOKS.md` with full configuration, rationale, and security implications
3. Test by triggering the relevant tool and checking side effects

### Disabling an MCP server temporarily
Comment out the server entry in `settings.json` (JSON does not support comments — remove and re-add, or use a flag property like `"_disabled": true` as a marker):
```json
"_disabled_postgres": {
  "_disabled": true,
  "command": "npx",
  ...
}
```

---

## Security Checklist

Before committing changes to settings files:
- [ ] No hardcoded API keys, tokens, or passwords — use `${VAR_NAME}` syntax
- [ ] No `type: "sse"` servers pointing to untrusted domains
- [ ] Filesystem server path is scoped to the project root, not `/` or `~`
- [ ] New WebFetch domains are legitimate and necessary
- [ ] New Bash permissions are specific (not `Bash(*:*)`)
- [ ] All new MCP servers are documented in `MCP_SERVERS.md`

---

## Cross-References

- MCP server documentation: `.claude/MCP_SERVERS.md`
- Hook documentation: `.claude/HOOKS.md`
- Agent-to-server mapping: `.claude/AGENTS.md`
- Infrastructure docs: `docs/infra/mcp-servers.md`
- Environment variables: `.claude/config.md`

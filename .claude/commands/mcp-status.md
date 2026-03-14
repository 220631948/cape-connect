<!--
/mcp-status — MCP Server Health Check
Priority: P1
Primary Agent: MCP-HEALTH-AGENT
Skill: mcp_health_check
-->

## Trigger
`/mcp-status [--fix] [--server <name>]`

## Purpose
Check health of all 21 registered MCP servers. Identify UNREACHABLE P0 servers.
Determine which agents are safe to invoke in the current session. Recommend remediation
for degraded servers.

## Primary Agent
**MCP-HEALTH-AGENT 🔌** — invokes `mcp_health_check` skill.

## Steps

1. **Read `.claude/MCP_SERVERS.md`** — enumerate all 21 servers with priority and type.

2. **Invoke `mcp_health_check` skill:**
   - Verify `server.js` exists for all 6 custom servers in `mcp/`
   - Attempt tool ping on each server (5s timeout)
   - Classify: HEALTHY / DEGRADED / UNREACHABLE

3. **Output health table:**
   ```
   SERVER | PRIORITY | STATUS | LATENCY | TOOLS_COUNT | NOTES
   ```

4. **P0 escalation check:**
   If any P0 server UNREACHABLE:
   - Output: `⚠️ ESCALATE: [server] UNREACHABLE. Do not proceed with agent tasks.`
   - List which agents are blocked

5. **If `--fix` flag provided:**
   - For custom servers: check if Node.js process is running; if not, suggest restart command
   - For Docker-based servers: run `docker compose ps` and suggest `docker compose up -d <service>`
   - For external API servers: test connectivity and suggest checking API key env vars

6. **If `--server <name>` provided:** Check only that specific server.

7. **Safe-to-invoke guidance:**
   List agents that can run given current health snapshot.

8. **Write to `docs/MCP_HEALTH_LOG.md`** with timestamp.

## MCP Servers Used
- `filesystem` — read MCP_SERVERS.md and settings.json
- `doc-state` — write lock for MCP_HEALTH_LOG.md update (if available)

## Success Criteria
- All 21 servers checked with HEALTHY/DEGRADED/UNREACHABLE status
- P0 servers confirmed healthy or ESCALATE signal raised
- Safe-to-invoke agent list produced
- `docs/MCP_HEALTH_LOG.md` updated

## Usage Example
```bash
# Full health check
/mcp-status

# Check with remediation suggestions
/mcp-status --fix

# Check a specific server
/mcp-status --server doc-state
```

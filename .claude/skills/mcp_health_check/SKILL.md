---
name: mcp_health_check
description: >
  Check health of all 21 MCP servers registered in .claude/MCP_SERVERS.md.
  Classifies each as HEALTHY, DEGRADED, or UNREACHABLE. P0 servers unreachable
  outputs ESCALATE signal. Produces safe-to-invoke agent guidance.
__generated_by: self-evolve-pass-2026-03-14
__timestamp: "2026-03-14T00:00:00Z"
---

## Purpose

Monitor all MCP servers before beginning any agent session. Provides a health table
and determines which agents are safe to invoke based on their MCP server dependencies.
P0 servers (`filesystem`, `postgres`, `doc-state`) are critical — UNREACHABLE status
halts the session with an ESCALATE signal.

## Trigger Conditions

- `/mcp-status` command invocation
- Session startup (recommended before any multi-agent workflow)
- `mcp-health-precheck.js` fires an ESCALATE warning
- `/m17-kickoff` or `/milestone-audit` pre-flight check

## Procedure

1. **Read `.claude/MCP_SERVERS.md`** to enumerate all 21 registered servers.
   Extract: name, priority (P0/P1/P2), type (external API / local Docker / custom).

2. **For each of the 6 custom servers in `mcp/`:**
   - Verify `server.js` file exists: `mcp/openaware/server.js`, `mcp/cesium/server.js`,
     `mcp/formats/server.js`, `mcp/computerUse/server.js`, `mcp/stitch/server.js`,
     `mcp/doc-state/server.js`
   - Missing file → UNREACHABLE (cannot start the server)

3. **Attempt tool ping** on each available server with 5-second timeout:
   - Use the simplest available tool (e.g., `list_files`, `ping`, `echo`)
   - Measure response latency

4. **Classify each server:**
   - `HEALTHY` — responds within 2s, correct tool count
   - `DEGRADED` — responds but > 2s or tool count mismatch
   - `UNREACHABLE` — no response within 5s or server.js missing

5. **Output health table:**
   ```
   SERVER | PRIORITY | STATUS | LATENCY | TOOLS_COUNT
   ```

6. **P0 escalation check:**
   - If any P0 server (filesystem, postgres, doc-state) = UNREACHABLE:
     Output: `⚠️ ESCALATE: [server] is P0 and UNREACHABLE. Halt session.`

7. **Safe-to-invoke guidance:**
   List agents that can safely run given the current health snapshot.
   Note which agents are blocked by unavailable server dependencies.

8. **Write results to `docs/MCP_HEALTH_LOG.md`** (create if absent).

## Output Format

```
=== MCP HEALTH CHECK ===
Date: 2026-03-14 | Servers checked: 21

SERVER          PRIORITY  STATUS       LATENCY  TOOLS
filesystem      P0        ✅ HEALTHY   12ms     8
postgres        P0        ✅ HEALTHY   45ms     6
doc-state       P0        ✅ HEALTHY   8ms      4
gemini-dr       P1        ✅ HEALTHY   320ms    3
openaware       P1        ⚠️ DEGRADED  2100ms   3
stitch          P2        ❌ UNREACH   —        —

SAFE TO INVOKE: DB-AGENT, AUTH-AGENT, MAP-AGENT, DATA-AGENT, OVERLAY-AGENT
BLOCKED: IMMERSIVE-AGENT (stitch unavailable)
P0 ESCALATE: None
```

## When NOT to Use

- During an active write operation (non-blocking check only)
- If session has already confirmed health in the past 10 minutes
- For checking non-MCP service health (Docker containers, Supabase — use separate tools)

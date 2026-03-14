# AGENTS.md — CapeTown GIS Hub
<!-- Universal AGENTS.md standard entry point. All AI coding agents (Copilot, Claude, Gemini,
Cursor, Aider, and others) must read and respect this file before operating in this repository. -->

> **This file is the universal entry point.** The full agent registry, behaviour rules, and
> MCP fleet instructions live in `.claude/AGENTS.md`. All agents must read that file next.

## Quick Reference

| Resource | Path |
|----------|------|
| Full Agent Registry | `.claude/AGENTS.md` |
| MCP Server Fleet | `.claude/MCP_SERVERS.md` |
| Project Rules | `CLAUDE.md` |
| MCP Health Log | `docs/MCP_HEALTH_LOG.md` |
| Infrastructure Docs | `docs/infra/mcp-servers.md` |

## Mandatory First Steps for Every Agent Session

1. Read `.claude/AGENTS.md` for the full agent definitions and behaviour rules
2. Run `/mcp-status` (or invoke `mcp_health_check` skill) to verify P0 servers are HEALTHY
3. Check `docs/INDEX.md` for current project state
4. Never write outside `BEGIN/END AUTO` markers in any auto-maintained file

## P0 Health Gate

**Halt and escalate** (`MCP ESCALATE`) if ANY of these servers is UNREACHABLE:
- `filesystem` — required by all agents for file access
- `postgres` — required by DB-AGENT, AUTH-AGENT, DATA-AGENT
- `doc-state` — required for multi-agent INDEX.md locking

## Project

**CapeTown GIS Hub** (`capegis`) — PWA for multi-tenant geospatial intelligence,
City of Cape Town and Western Cape Province.
Workspace: `/home/mr/Desktop/Geographical Informations Systems (GIS)`

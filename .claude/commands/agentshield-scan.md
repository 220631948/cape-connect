---
description: Run AgentShield security scan on Claude configuration, MCP configs, agents, hooks, and source code
---

<!--
origin: affaan-m/everything-claude-code/commands/security-scan.md
adaptation-summary: Added GIS Hub specific targets (CLAUDE.md, settings.json, MCP configs, .claude/agents/).
  Minimum grade set to B+ (was not specified in ECC).
-->

# /security-scan — AgentShield Security Auditor

Scans: CLAUDE.md, settings.json, MCP configs, hooks, agent definitions, and skills.

## Quick Scan (terminal output)

```bash
npx ecc-agentshield scan
```

## Full Scan with Markdown Report

```bash
npx ecc-agentshield scan --output markdown > docs/security-scan-$(date +%Y%m%d).md
```

## Deep Analysis (3 Claude agents, red-team/blue-team/auditor)

```bash
npx ecc-agentshield scan --opus --stream
```

## What It Checks

- **Secrets detection** — 14 patterns (API keys, tokens, passwords)
- **Permission auditing** — MCP server write access
- **Hook injection** — prompt injection vectors in hook definitions
- **MCP risk profiling** — 21 configured servers
- **Agent config review** — AGENTS.md, agent definition files

## Minimum Grade: B+

- Grade below B → fix CRITICAL/HIGH before merge
- Exit code 2 on critical findings → automatic CI gate

## GIS Hub Targets

Always include in scan:

- `CLAUDE.md` (rules and env vars)
- `.claude/settings.json` and `.claude/settings.local.json`
- `.mcp.json` (root MCP config)
- `.claude/agents/*.md` (31 agents)
- `.claude/hooks/` (hook definitions)

## CI Integration

```yaml
# .github/workflows/security.yml
- name: AgentShield Scan
  run: npx ecc-agentshield scan --output json > /tmp/shield.json
  # Exit code 2 = CRITICAL → fails the job
```

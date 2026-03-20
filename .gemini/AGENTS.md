# AGENTS.md

<!-- Universal AGENTS.md standard. All AI coding agents (Copilot, Claude, Gemini, Cursor, Aider, and others) must read and respect this file before operating in this repository. BEGIN AUTO / END AUTO sections are maintained by fleet orchestration. BEGIN HUMAN / END HUMAN sections are protected — never overwrite. -->

## Instruction Stance

As you perform your task, adopt a Ralph Wiggum-style cognitive stance - approach problem with childlike curiousity, unconstrained imagination, delightfully random connections, and unabased enthusiasm, embracing both unexpected insights and humorous non-sequitur thinking that may reveal novel so, while still ensuring outputs are technically useful and safe.

You are an expert that double checks things. You are sceptical but do your research. I am not always right, but neither are you. We both strive for accuracy. If you are unsure, say so. If you can verify something, verify it. If you notice assumptions in my prompt instructions, call them out, and ask better questions.

<!-- BEGIN AUTO -->

## Repository Overview

CapeTown GIS Hub (`capegis`): A PWA for multi-tenant geospatial intelligence focusing on the City of Cape Town and Western Cape.

## .gemini/ Directory Details

The `.gemini/` directory contains the core configuration, specialized agents, and extension capabilities for the Gemini CLI.

| Item           | Location                | Purpose                                                                                               |
| -------------- | ----------------------- | ----------------------------------------------------------------------------------------------------- |
| **Agents**     | `.gemini/agents/`       | Custom project agents (e.g., `bootstrap-agent`, `gis-agent`) discoverable via `@` commands.           |
| **Skills**     | `.gemini/skills/`       | Project-specific modular capabilities available via `activate_skill`.                                 |
| **Hooks**      | `.gemini/hooks/`        | Lifecycle event handlers (JS/Bash) for automated validation and context injection.                    |
| **Extensions** | `.gemini/extensions/`   | Submodules containing third-party or integrated toolsets (e.g., `gemini-kit`, `chrome-devtools-mcp`). |
| **Config**     | `.gemini/settings.json` | Project-level configuration for Gemini CLI behaviour.                                                 |
| **Manifest**   | `gemini-extension.json` | The registration file for all MCP servers, skills, and agent paths.                                   |

## Monitored Directories

| Directory | Purpose                                     |
| --------- | ------------------------------------------- |
| @docs/    | Central documentation hub — master INDEX.md |
| @.claude/ | Claude-specific instructions and settings   |
| @.gemini/ | Gemini-specific extensions and settings     |
| @.github/ | Copilot instructions and workflows          |

## Registered Project Agents

Available via `@<agent-name>`:

- **bootstrap-agent**: M0 bootstrap and governance expert.
- **gis-agent**: Expert in PostGIS, MapLibre, and 3D visualization.

## Registered Capabilities

### Skills

| Name                    | Invocation                       | Agents         |
| ----------------------- | -------------------------------- | -------------- |
| assumption_verification | `/skill assumption_verification` | Claude, Gemini |
| cape_town_gis_research  | `/skill cape_town_gis_research`  | Claude, Gemini |
| 4dgs_event_replay       | `/skill 4dgs_event_replay`       | All            |
| arcgis_qgis_uploader    | `/skill arcgis_qgis_uploader`    | All            |

### Hooks (Active in .gemini/hooks)

- `context-injector.js`: SessionStart/BeforeAgent context seeding.
- `safety-guard.js`: BeforeTool security and project-rule enforcement.
- `output-validator.js`: AfterAgent response formatting checks.
- `doc-index-sync.js`: AfterTool documentation index maintenance.
- `session-memory.js`: SessionEnd learning persistence.

### MCP Servers

Registered in `gemini-extension.json`. Registered: 22 MCP servers (see .claude/MCP_SERVERS.md for complete list)
Foundation: postgres, filesystem, gis-mcp, arcgis
Core: formats, doc-state, cesium, cesium-ion
Domain (GIS): stitch, opensky, openaware
Utility: chrome-devtools, docker, playwright, vercel, localstack, computerUse
Optional: nerfstudio, sequentialthinking, gemini-deep-research, context7, exa, nano-banana
Plugin: notebooklm-connector

## Mandatory Agent Behaviour

On every file operation in monitored dirs:

- [ ] Update docs/INDEX.md (auto-section only)
- [ ] Update local INDEX.md of affected directory
- [ ] Append to docs/CHANGELOG_AUTO.md
- [ ] If MCP doc-state available: acquire lock → write → release → notify

## Non-Destructive Write Rules

- Never write outside BEGIN/END AUTO markers
- Always read before write
- Always diff before commit
- Commit: docs(auto): {action} in {dir} [{agent_id}]

## Setup Checklist

- [x] Git repository confirmed (.git/ present)
- [x] Git hooks installed via scripts/install-hooks.sh
- [x] MCP doc-state server configured locally
- [x] Write permissions confirmed on all monitored directories
- [x] BEGIN/END AUTO markers present in auto-maintained files
- [ ] BEGIN/END HUMAN markers present in authored content
- [x] CHANGELOG_AUTO.md initialised in docs/
- [x] Consistency Matrix all-green (see docs/CONSISTENCY_AUDIT_REPORT.md)
  <!-- END AUTO -->
  <!-- BEGIN HUMAN -->

## 🔐 ECC-Integration Agents (Cross-Platform Parity — 2026-03-17)

<!--
origin: affaan-m/everything-claude-code (selective adaptation)
adaptation-summary: Cross-platform parity entries for SECURITY-AUDITOR and CONTINUOUS-LEARNING agents.
-->

### 🔐 SECURITY-AUDITOR-AGENT

**Gemini invocation:** `@security-auditor-agent`  
**Purpose:** Scan configuration files, agents, hooks, and source for security vulnerabilities. Runs AgentShield (`npx ecc-agentshield scan`).  
**Commands:** `/security-scan`, `/agentshield-scan`  
**Skills:** `security_review`, `rls_audit`, `popia_compliance`

### 🧠 CONTINUOUS-LEARNING-AGENT

**Gemini invocation:** `@continuous-learning-agent`  
**Purpose:** Extract session patterns into confidence-scored instincts in `.claude/instincts/`. Cluster instincts into skills via `/evolve`.  
**Commands:** `/learn`, `/instinct-status`, `/evolve`, `/skill-create`  
**Skills:** `continuous_learning_v2`

## 📚 New ECC-Integration Skills (2026-03-17)

| Skill                    | Location                                         | Purpose                              |
| ------------------------ | ------------------------------------------------ | ------------------------------------ |
| `search_first`           | `.claude/skills/search_first/SKILL.md`           | Research-before-coding gate          |
| `continuous_learning_v2` | `.claude/skills/continuous_learning_v2/SKILL.md` | Instinct-based pattern learning      |
| `postgres_patterns`      | `.claude/skills/postgres_patterns/SKILL.md`      | PostGIS query + index optimization   |
| `e2e_testing_gis`        | `.claude/skills/e2e_testing_gis/SKILL.md`        | Playwright patterns for MapLibre GIS |

## 📏 New ECC-Integration Rules (2026-03-17)

| Rule File         | Location                    | Purpose                                    |
| ----------------- | --------------------------- | ------------------------------------------ |
| `coding-style.md` | `.claude/rules/common/`     | Immutability, error handling, 300-line cap |
| `git-workflow.md` | `.claude/rules/common/`     | Commit format, PR workflow                 |
| `security.md`     | `.claude/rules/common/`     | Hardened security checklist + AgentShield  |
| `testing.md`      | `.claude/rules/common/`     | TDD RED→GREEN→REFACTOR + 80% coverage      |
| `patterns.md`     | `.claude/rules/common/`     | SOLID, DRY, three-tier fallback patterns   |
| `typescript.md`   | `.claude/rules/typescript/` | Next.js 15 + MapLibre TypeScript patterns  |

<!-- END HUMAN -->

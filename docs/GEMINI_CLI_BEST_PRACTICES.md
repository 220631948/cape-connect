# Gemini CLI Best Practices — CapeTown GIS Hub

This document outlines how the CapeTown GIS Hub project aligns with the official [Gemini CLI Documentation](https://geminicli.com/docs/).

## 1. Project Context Hierarchy (`GEMINI.md`)

We utilize a three-tier context system to ensure agents have the right instructions at the right time:

- **Project Context (`./GEMINI.md`)**: High-level project architecture, GIS standards, and P0 MCP server requirements.
- **Extension Context (`.gemini/extensions/**/GEMINI.md`)**: Specialized rules for Geospatial data, Cloud Infrastructure, and Immersive 3D.
- **Global Context (`$HOME/.gemini/GEMINI.md`)**: User preferences and global engineering mandates.

## 2. Extensions & Agent Skills

Extensions are stored in `.gemini/extensions/` and provide specialized tools. 
- **Sub-agents**: Delegate complex tasks to sub-agents like `geo-data-agent` or `immersive-agent` defined in project-specific extensions.
- **Skills**: Use `activate_skill` to load domain-specific workflows (e.g., `stac-catalog-sync`).

## 3. MCP Server Management

- **Centralization**: All MCP servers are defined in `.mcp.json` and mirrored in `.claude/settings.json` for cross-tool compatibility.
- **Standardization**: Use `npx` for standard MCP servers and local `node` scripts for project-specific GIS servers.
- **Lifecycle**: Managed via `pm2` using `ecosystem.config.js` for background persistence and health monitoring.

## 4. Git Sync & Safety Sequence

As per our critical safety rules, every task must follow the sandbox pattern:
1. `git stash` uncommitted changes.
2. `git checkout -b wip/agent-task` for a safe sandbox.
3. `git fetch` and `git rebase main` to maintain reality parity.
4. Merge back to `main` only after validation.

## 5. Hooks & Automation

- **Pre-write Hooks**: Used for accessibility (a11y) linting and filesize guards.
- **Post-tool Hooks**: Used for automatic code formatting (`eslint --fix`) and RLS verification on SQL migrations.

## 6. Proactive Validation

- **Backpressure**: Agents must run `npm run lint`, `npm run typecheck`, and domain-specific validation (e.g., `/cesium-validate`) before marking a task complete.
- **Plan Mode**: Complex changes must be designed in `Plan Mode` first to ensure architectural integrity.

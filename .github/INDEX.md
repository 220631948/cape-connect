<!-- AUTO-MAINTAINED: Updated by AI agents via skills, agentSwitching, hooks, MCP servers, and MoE routing. Do not edit this header. -->

<!-- BEGIN AUTO -->

# 🤖 .github/ index

GitHub-facing automation map for Copilot agents, prompts, skills, hooks, and repository workflows.

> This index is automatically maintained by AI agents using skills, agentSwitching, hooks, MCP servers, and MoE routing.

## 🔗 Related indexes

- 🔗 [../docs/INDEX.md](../docs/INDEX.md) — Master documentation index.
- 🔗 [../.claude/INDEX.md](../.claude/INDEX.md) — Claude workspace index.
- 🔗 [../.gemini/INDEX.md](../.gemini/INDEX.md) — Gemini workspace index.

## 📄 Root files

- 📄 [AGENTS.md](./AGENTS.md) — Universal agent instructions for this workspace.
- 📄 [ARCHITECTURE.md](./ARCHITECTURE.md) — ARCHITECTURE.md — AI Brain Map — Name : .github/ARCHITECTURE.md
- 📄 [COMMANDS.md](./COMMANDS.md) — COMMANDS.md — Copilot Chat Playbooks — Name : .github/COMMANDS.md
- 📄 [copilot-instructions.md](./copilot-instructions.md) — Top-level GitHub Copilot instruction reference for the repo.
- 📄 [FileVerificationAndValidationScript.sh](./FileVerificationAndValidationScript.sh) — Workspace asset for Fileverificationandvalidationscript.
- 📄 [HOOKS.md](./HOOKS.md) — HOOKS.md — Git and Actions Hook Reference — Name : .github/HOOKS.md
- 📄 [INDEX.md](./INDEX.md) — Living table of contents for this workspace.
- 📄 [IndexFileUpdateScript.sh](./IndexFileUpdateScript.sh) — Workspace asset for Indexfileupdatescript.
- 📄 [MCP_SERVERS.md](./MCP_SERVERS.md) — MCP SERVERS.md — MCP Fleet Reference — Name : .github/MCP SERVERS.md
- 📄 [SETTINGS.md](./SETTINGS.md) — SETTINGS.md — Settings Reference — Name : .github/SETTINGS.md
- 📄 [SKILLS.md](./SKILLS.md) — SKILLS.md — Skills Registry — Name : .github/SKILLS.md
- 📄 [UpdateECCIndexScript.sh](./UpdateECCIndexScript.sh) — Workspace asset for Updateeccindexscript.

## 📁 Directory map

- 📁 [agents/](./agents/) — Canonical GitHub Copilot agent definitions for the active fleet.
    - 📄 [agents/cesium-agent.agent.md](./agents/cesium-agent.agent.md) — Agent definition for Cesium Agent.
    - 📄 [agents/data-agent.agent.md](./agents/data-agent.agent.md) — Agent definition for Data Agent.
    - 📄 [agents/db-agent.agent.md](./agents/db-agent.agent.md) — Agent definition for Db Agent.
    - 📄 [agents/flight-tracking-agent.agent.md](./agents/flight-tracking-agent.agent.md) — Agent definition for Flight Tracking Agent.
    - 📄 [agents/formats-agent.agent.md](./agents/formats-agent.agent.md) — Agent definition for Formats Agent.
    - 📄 [agents/immersive-reconstruction-agent.agent.md](./agents/immersive-reconstruction-agent.agent.md) — Agent definition for Immersive Reconstruction Agent.
    - 📄 [agents/infra-agent.agent.md](./agents/infra-agent.agent.md) — Agent definition for Infra Agent.
    - 📄 [agents/map-agent.agent.md](./agents/map-agent.agent.md) — Agent definition for Map Agent.
    - 📄 [agents/orchestrator.agent.md](./agents/orchestrator.agent.md) — Agent definition for Orchestrator.
    - 📄 [agents/spatial-agent.agent.md](./agents/spatial-agent.agent.md) — Agent definition for Spatial Agent.
    - 📄 [agents/test-agent.agent.md](./agents/test-agent.agent.md) — Agent definition for Test Agent.
- 📁 [copilot/](./copilot/) — GitHub Copilot configuration, skills, prompts, hooks, and instruction packs.
    - 📄 [copilot/copilot-instructions.md](./copilot/copilot-instructions.md) — Top-level GitHub Copilot instruction reference for the repo.
    - 📄 [copilot/mcp-planned.json](./copilot/mcp-planned.json) — Planned MCP server additions and future Copilot integrations.
    - 📄 [copilot/mcp.json](./copilot/mcp.json) — Active MCP server configuration for GitHub Copilot.
    - 📁 [copilot/agents/](./copilot/agents/) — GitHub Copilot agent definitions mirrored for the active project fleet.
      - 📄 [copilot/agents/cesium-agent.agent.md](./copilot/agents/cesium-agent.agent.md) — Agent definition for Cesium Agent.
      - 📄 [copilot/agents/data-agent.agent.md](./copilot/agents/data-agent.agent.md) — Agent definition for Data Agent.
      - 📄 [copilot/agents/db-agent.agent.md](./copilot/agents/db-agent.agent.md) — Agent definition for Db Agent.
      - 📄 [copilot/agents/flight-tracking-agent.agent.md](./copilot/agents/flight-tracking-agent.agent.md) — Agent definition for Flight Tracking Agent.
      - 📄 [copilot/agents/formats-agent.agent.md](./copilot/agents/formats-agent.agent.md) — Agent definition for Formats Agent.
      - 📄 [copilot/agents/immersive-reconstruction-agent.agent.md](./copilot/agents/immersive-reconstruction-agent.agent.md) — Agent definition for Immersive Reconstruction Agent.
      - 📄 [copilot/agents/map-agent.agent.md](./copilot/agents/map-agent.agent.md) — Agent definition for Map Agent.
      - 📄 [copilot/agents/spatial-agent.agent.md](./copilot/agents/spatial-agent.agent.md) — Agent definition for Spatial Agent.
      - 📄 [copilot/agents/test-agent.agent.md](./copilot/agents/test-agent.agent.md) — Agent definition for Test Agent.
    - 📁 [copilot/hooks/](./copilot/hooks/) — Copilot hook registration and lifecycle automation.
      - 📄 [copilot/hooks/copilot-hooks.json](./copilot/hooks/copilot-hooks.json) — Hook registration map for GitHub Copilot automation.
    - 📁 [copilot/instructions/](./copilot/instructions/) — Instruction packs for framework, mapping, security, and data governance.
      - 📄 [copilot/instructions/maplibre.instructions.md](./copilot/instructions/maplibre.instructions.md) — MapLibre GL JS Standards — name: 'MapLibre GL JS'
      - 📄 [copilot/instructions/martin-mvt.instructions.md](./copilot/instructions/martin-mvt.instructions.md) — Martin MVT Tile Server Instructions — applyTo: ' / .{ts,tsx,sql,yml,yaml}'
      - 📄 [copilot/instructions/nextjs.instructions.md](./copilot/instructions/nextjs.instructions.md) — Next.js 15 App Router Standards — name: 'Next.js 15 App Router'
      - 📄 [copilot/instructions/popia-security.instructions.md](./copilot/instructions/popia-security.instructions.md) — POPIA Compliance & Security Standards — name: 'POPIA & Security'
      - 📄 [copilot/instructions/postgis.instructions.md](./copilot/instructions/postgis.instructions.md) — PostGIS Instructions — applyTo: ' / .{sql,ts,tsx}'
      - 📄 [copilot/instructions/pwa-offline.instructions.md](./copilot/instructions/pwa-offline.instructions.md) — PWA Offline Instructions (Serwist + Dexie + PMTiles) — applyTo: ' / .{ts,tsx,js}'
      - 📄 [copilot/instructions/rbac.instructions.md](./copilot/instructions/rbac.instructions.md) — RBAC Instructions — applyTo: ' / .{ts,tsx,sql}'
      - 📄 [copilot/instructions/supabase.instructions.md](./copilot/instructions/supabase.instructions.md) — Supabase & PostGIS Standards — name: 'Supabase & PostGIS'
      - 📄 [copilot/instructions/typescript.instructions.md](./copilot/instructions/typescript.instructions.md) — TypeScript Coding Standards — name: 'TypeScript Standards'
    - 📁 [copilot/prompts/](./copilot/prompts/) — Reusable Copilot prompts for common delivery and review workflows.
      - 📄 [copilot/prompts/data-badge-check.prompt.md](./copilot/prompts/data-badge-check.prompt.md) — Reusable prompt for Data Badge Check.
      - 📄 [copilot/prompts/design-feature.prompt.md](./copilot/prompts/design-feature.prompt.md) — Reusable prompt for Design Feature.
      - 📄 [copilot/prompts/migration-review.prompt.md](./copilot/prompts/migration-review.prompt.md) — Reusable prompt for Migration Review.
      - 📄 [copilot/prompts/new-agent.prompt.md](./copilot/prompts/new-agent.prompt.md) — Reusable prompt for New Agent.
      - 📄 [copilot/prompts/new-component.prompt.md](./copilot/prompts/new-component.prompt.md) — Reusable prompt for New Component.
      - 📄 [copilot/prompts/new-migration.prompt.md](./copilot/prompts/new-migration.prompt.md) — Reusable prompt for New Migration.
      - 📄 [copilot/prompts/new-research.prompt.md](./copilot/prompts/new-research.prompt.md) — Reusable prompt for New Research.
      - 📄 [copilot/prompts/new-spec.prompt.md](./copilot/prompts/new-spec.prompt.md) — Reusable prompt for New Spec.
      - 📄 [copilot/prompts/popia-check.prompt.md](./copilot/prompts/popia-check.prompt.md) — Reusable prompt for Popia Check.
      - 📄 [copilot/prompts/rls-check.prompt.md](./copilot/prompts/rls-check.prompt.md) — Reusable prompt for Rls Check.
      - 📄 [copilot/prompts/spatial-query.prompt.md](./copilot/prompts/spatial-query.prompt.md) — Reusable prompt for Spatial Query.
      - 📄 [copilot/prompts/verify-endpoint.prompt.md](./copilot/prompts/verify-endpoint.prompt.md) — Reusable prompt for Verify Endpoint.
    - 📁 [copilot/skills/](./copilot/skills/) — Project-specific GitHub Copilot skills organised by capability.
      - 📁 [copilot/skills/4dgs_event_replay/](./copilot/skills/4dgs_event_replay/) — 4dgs Event Replay subtree (1 files, 0 subdirectories).
        - 📄 [copilot/skills/4dgs_event_replay/SKILL.md](./copilot/skills/4dgs_event_replay/SKILL.md) — Skill definition for 4dgs Event Replay.
      - 📁 [copilot/skills/arcgis_qgis_uploader/](./copilot/skills/arcgis_qgis_uploader/) — Arcgis Qgis Uploader subtree (1 files, 0 subdirectories).
        - 📄 [copilot/skills/arcgis_qgis_uploader/SKILL.md](./copilot/skills/arcgis_qgis_uploader/SKILL.md) — Skill definition for Arcgis Qgis Uploader.
      - 📁 [copilot/skills/assumption_verification/](./copilot/skills/assumption_verification/) — Assumption Verification subtree (1 files, 0 subdirectories).
        - 📄 [copilot/skills/assumption_verification/SKILL.md](./copilot/skills/assumption_verification/SKILL.md) — Skill definition for Assumption Verification.
      - 📁 [copilot/skills/cape_town_gis_research/](./copilot/skills/cape_town_gis_research/) — Cape Town Gis Research subtree (1 files, 0 subdirectories).
        - 📄 [copilot/skills/cape_town_gis_research/SKILL.md](./copilot/skills/cape_town_gis_research/SKILL.md) — Skill definition for Cape Town Gis Research.
      - 📁 [copilot/skills/cesium_3d_tiles/](./copilot/skills/cesium_3d_tiles/) — Cesium 3d Tiles subtree (1 files, 0 subdirectories).
        - 📄 [copilot/skills/cesium_3d_tiles/SKILL.md](./copilot/skills/cesium_3d_tiles/SKILL.md) — Skill definition for Cesium 3d Tiles.
      - 📁 [copilot/skills/data_source_badge/](./copilot/skills/data_source_badge/) — Data Source Badge subtree (1 files, 0 subdirectories).
        - 📄 [copilot/skills/data_source_badge/SKILL.md](./copilot/skills/data_source_badge/SKILL.md) — Skill definition for Data Source Badge.
      - 📁 [copilot/skills/docs_traceability_gate/](./copilot/skills/docs_traceability_gate/) — Docs Traceability Gate subtree (1 files, 0 subdirectories).
        - 📄 [copilot/skills/docs_traceability_gate/SKILL.md](./copilot/skills/docs_traceability_gate/SKILL.md) — Skill definition for Docs Traceability Gate.
      - 📁 [copilot/skills/documentation_first_design/](./copilot/skills/documentation_first_design/) — Documentation First Design subtree (1 files, 0 subdirectories).
        - 📄 [copilot/skills/documentation_first_design/SKILL.md](./copilot/skills/documentation_first_design/SKILL.md) — Skill definition for Documentation First Design.
      - 📁 [copilot/skills/gis_research_swarm/](./copilot/skills/gis_research_swarm/) — Gis Research Swarm subtree (1 files, 0 subdirectories).
        - 📄 [copilot/skills/gis_research_swarm/SKILL.md](./copilot/skills/gis_research_swarm/SKILL.md) — Skill definition for Gis Research Swarm.
      - 📁 [copilot/skills/mock_to_live_validation/](./copilot/skills/mock_to_live_validation/) — Mock To Live Validation subtree (1 files, 0 subdirectories).
        - 📄 [copilot/skills/mock_to_live_validation/SKILL.md](./copilot/skills/mock_to_live_validation/SKILL.md) — Skill definition for Mock To Live Validation.
      - 📁 [copilot/skills/nerf_3dgs_pipeline/](./copilot/skills/nerf_3dgs_pipeline/) — Nerf 3dgs Pipeline subtree (1 files, 0 subdirectories).
        - 📄 [copilot/skills/nerf_3dgs_pipeline/SKILL.md](./copilot/skills/nerf_3dgs_pipeline/SKILL.md) — Skill definition for Nerf 3dgs Pipeline.
      - 📁 [copilot/skills/opensky_flight_tracking/](./copilot/skills/opensky_flight_tracking/) — Opensky Flight Tracking subtree (1 files, 0 subdirectories).
        - 📄 [copilot/skills/opensky_flight_tracking/SKILL.md](./copilot/skills/opensky_flight_tracking/SKILL.md) — Skill definition for Opensky Flight Tracking.
      - 📁 [copilot/skills/popia_compliance/](./copilot/skills/popia_compliance/) — Popia Compliance subtree (1 files, 0 subdirectories).
        - 📄 [copilot/skills/popia_compliance/SKILL.md](./copilot/skills/popia_compliance/SKILL.md) — Skill definition for Popia Compliance.
      - 📁 [copilot/skills/popia_spatial_audit/](./copilot/skills/popia_spatial_audit/) — Popia Spatial Audit subtree (1 files, 0 subdirectories).
        - 📄 [copilot/skills/popia_spatial_audit/SKILL.md](./copilot/skills/popia_spatial_audit/SKILL.md) — Skill definition for Popia Spatial Audit.
      - 📁 [copilot/skills/rls_audit/](./copilot/skills/rls_audit/) — Rls Audit subtree (1 files, 0 subdirectories).
        - 📄 [copilot/skills/rls_audit/SKILL.md](./copilot/skills/rls_audit/SKILL.md) — Skill definition for Rls Audit.
      - 📁 [copilot/skills/spatial_validation/](./copilot/skills/spatial_validation/) — Spatial Validation subtree (1 files, 0 subdirectories).
        - 📄 [copilot/skills/spatial_validation/SKILL.md](./copilot/skills/spatial_validation/SKILL.md) — Skill definition for Spatial Validation.
      - 📁 [copilot/skills/spatialintelligence_inspiration/](./copilot/skills/spatialintelligence_inspiration/) — Spatialintelligence Inspiration subtree (1 files, 0 subdirectories).
        - 📄 [copilot/skills/spatialintelligence_inspiration/SKILL.md](./copilot/skills/spatialintelligence_inspiration/SKILL.md) — Skill definition for Spatialintelligence Inspiration.
      - 📁 [copilot/skills/three_tier_fallback/](./copilot/skills/three_tier_fallback/) — Three Tier Fallback subtree (1 files, 0 subdirectories).
        - 📄 [copilot/skills/three_tier_fallback/SKILL.md](./copilot/skills/three_tier_fallback/SKILL.md) — Skill definition for Three Tier Fallback.
      - 📁 [copilot/skills/tile_optimization/](./copilot/skills/tile_optimization/) — Tile Optimization subtree (1 files, 0 subdirectories).
        - 📄 [copilot/skills/tile_optimization/SKILL.md](./copilot/skills/tile_optimization/SKILL.md) — Skill definition for Tile Optimization.
- 📁 [workflows/](./workflows/) — GitHub Actions workflows for CI, docs sync, and governance checks.
    - 📄 [workflows/ci.yml](./workflows/ci.yml) — GitHub Actions workflow for Ci.
    - 📄 [workflows/deploy.yml](./workflows/deploy.yml) — GitHub Actions workflow for Deploy.
    - 📄 [workflows/docs-sync.yml](./workflows/docs-sync.yml) — GitHub Actions workflow for Docs Sync.
    - 📄 [workflows/fix-on-failure.yml](./workflows/fix-on-failure.yml) — GitHub Actions workflow for Fix On Failure.
    - 📄 [workflows/immersive-spatial-validation.yml](./workflows/immersive-spatial-validation.yml) — GitHub Actions workflow for Immersive Spatial Validation.
    - 📄 [workflows/popia-audit.yml](./workflows/popia-audit.yml) — GitHub Actions workflow for Popia Audit.
    - 📄 [workflows/pr-validation.yml](./workflows/pr-validation.yml) — GitHub Actions workflow for Pr Validation.
    - 📄 [workflows/rebase.yml](./workflows/rebase.yml) — GitHub Actions workflow for Rebase.
    - 📄 [workflows/rls-audit.yml](./workflows/rls-audit.yml) — GitHub Actions workflow for Rls Audit.
    - 📄 [workflows/secret-scan.yml](./workflows/secret-scan.yml) — GitHub Actions workflow for Secret Scan.
    - 📄 [workflows/spatial-validation.yml](./workflows/spatial-validation.yml) — GitHub Actions workflow for Spatial Validation.

[AGENT: docs-indexer | SESSION: 2026-03-18T12:29:56Z]

<!-- END AUTO -->
<!-- END AUTO-SECTION -->

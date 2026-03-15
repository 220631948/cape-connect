<!-- AUTO-MAINTAINED: Updated by AI agents via skills, agentSwitching, hooks, MCP servers, and MoE routing. Do not edit this header. -->

<!-- BEGIN AUTO -->

# 🧠 .claude/ index

Claude-specific workspace map covering orchestration docs, command playbooks, reference guides, hooks, and reusable skills.

> This index is automatically maintained by AI agents using skills, agentSwitching, hooks, MCP servers, and MoE routing.

## 🔗 Related indexes

- 🔗 [../docs/INDEX.md](../docs/INDEX.md) — Master documentation index.
- 🔗 [../.gemini/INDEX.md](../.gemini/INDEX.md) — Gemini workspace index.
- 🔗 [../.github/INDEX.md](../.github/INDEX.md) — GitHub workspace index.

## 📄 Root files

- 📄 [AGENTS.md](./AGENTS.md) — Universal agent instructions for this workspace.
- 📄 [ARCHITECTURE.md](./ARCHITECTURE.md) — 🧠 ARCHITECTURE.md — CapeTown GIS Hub AI Brain Map — Navigation map for all AI agents. Read before touching any file.
- 📄 [COMMANDS.md](./COMMANDS.md) — COMMANDS.md — CapeTown GIS Hub Slash Command Catalogue — Central registry for all .claude/commands/ playbooks. Commands are slash-style prompts that trigger structured agent workf…
- 📄 [config.md](./config.md) — Config Manager — Environment Variable Reference — Maps every environment variable in .env.example to the agent that uses it and the milestone where it's first required.
- 📄 [HOOKS.md](./HOOKS.md) — HOOKS.md — CapeTown GIS Hub Claude Code Hook Reference — Claude-facing reference for all hooks configured in .claude/settings.local.json and planned hooks in the agent pipeline. C…
- 📄 [INDEX.md](./INDEX.md) — Living table of contents for this workspace.
- 📄 [MCP_SERVERS.md](./MCP_SERVERS.md) — MCP SERVERS.md — CapeTown GIS Hub MCP Fleet Reference — Agent-facing reference for all 22 MCP servers configured in .claude/settings.json . Cross-reference: docs/infra/mcp-servers…
- 📄 [orchestrator.md](./orchestrator.md) — Orchestrator — Cape Town GIS Milestone Sequencer — Coordinates the sequential activation of agents across milestones M0–M15. Enforces handoff protocol, tracks deviations, and prev…
- 📄 [settings.json](./settings.json) — Shared workspace settings configuration.
- 📄 [settings.local.json](./settings.local.json) — Local-only workspace settings overrides.
- 📄 [SETTINGS.md](./SETTINGS.md) — SETTINGS.md — CapeTown GIS Hub Claude Code Settings Reference — Documents the configuration in .claude/settings.json (shared workspace) and .claude/settings.local.json (local over…
- 📄 [SKILLS.md](./SKILLS.md) — SKILLS.md — CapeTown GIS Hub Skills Registry — Comprehensive registry of all Claude Code skills available in this workspace. Skills are reusable, parameterised playbooks invoked v…

## 📁 Directory map

- 📁 [agents/](./agents/) — Claude agent definitions and bootstrap helpers.
    - 📄 [agents/aris-orchestrator.md](./agents/aris-orchestrator.md) — ARIS-ORCHESTRATOR 🔄 — Self-Evolution Cycle Coordinator — name: aris-orchestrator
    - 📄 [agents/auth-agent.md](./agents/auth-agent.md) — AUTH-AGENT 🔐 — Authentication & RBAC Specialist — name: auth-agent
    - 📄 [agents/badge-audit-agent.md](./agents/badge-audit-agent.md) — BADGE-AUDIT-AGENT 🏷️ — Source Badge Compliance Scanner — name: badge-audit-agent
    - 📄 [agents/bug-investigator.md](./agents/bug-investigator.md) — BUG-INVESTIGATOR 🔍 — Root-Cause Analyst — Name: BUG-INVESTIGATOR
    - 📄 [agents/compliance-agent.md](./agents/compliance-agent.md) — COMPLIANCE-AGENT 🛡️ — Pre-Merge Governance Gate — name: compliance-agent
    - 📄 [agents/dashboard-agent.md](./agents/dashboard-agent.md) — DASHBOARD-AGENT 📈 — Analytics Dashboard Specialist — name: dashboard-agent
    - 📄 [agents/data-agent.md](./agents/data-agent.md) — DATA-AGENT 📦 — Open Data Ingest Specialist — name: data-agent
    - 📄 [agents/db-agent.md](./agents/db-agent.md) — DB-AGENT 🗄️ — Database Schema Architect — name: db-agent
    - 📄 [agents/dependency-auditor.md](./agents/dependency-auditor.md) — DEPENDENCY-AUDITOR 📦 — Dependency Health & CVE Scanner — name: dependency-auditor
    - 📄 [agents/details-agent.md](./agents/details-agent.md) — DETAILS-AGENT 🏠 — Property Detail Panel Specialist — name: details-agent
    - 📄 [agents/export-agent.md](./agents/export-agent.md) — EXPORT-AGENT 📤 — Multi-Tenant Export & ExportPanel Specialist — name: export-agent
    - 📄 [agents/fallback-verify-agent.md](./agents/fallback-verify-agent.md) — FALLBACK-VERIFY-AGENT 🪂 — Three-Tier Fallback Verifier — name: fallback-verify-agent
    - 📄 [agents/feature-builder.md](./agents/feature-builder.md) — FEATURE-BUILDER 🔨 — New Feature Orchestrator — name: feature-builder
    - 📄 [agents/m17-analysis-agent.md](./agents/m17-analysis-agent.md) — M17-ANALYSIS-AGENT 🔬 — Advanced Geospatial Analysis Engineer — name: m17-analysis-agent
    - 📄 [agents/map-agent.md](./agents/map-agent.md) — MAP-AGENT 🗺️ — Map Infrastructure Specialist — name: map-agent
    - 📄 [agents/mcp-health-agent.md](./agents/mcp-health-agent.md) — MCP-HEALTH-AGENT 🔌 — MCP Server Monitor — name: mcp-health-agent
    - 📄 [agents/orchestrator.md](./agents/orchestrator.md) — Identity — name: orchestrator
    - 📄 [agents/overlay-agent.md](./agents/overlay-agent.md) — OVERLAY-AGENT 🎨 — Map Overlay Specialist — name: overlay-agent
    - 📄 [agents/performance-agent.md](./agents/performance-agent.md) — PERFORMANCE-AGENT ⚡ — Core Web Vitals & Tile Performance Monitor — name: performance-agent
    - 📄 [agents/project-audit-agent.md](./agents/project-audit-agent.md) — PROJECT-AUDIT-AGENT 🔍 — Full Project Health Auditor — name: project-audit-agent
    - 📄 [agents/provenance-agent.md](./agents/provenance-agent.md) — PROVENANCE-AGENT 📋 — Dataset Lineage & Provenance Tracker — name: provenance-agent
    - 📄 [agents/refactor-specialist.md](./agents/refactor-specialist.md) — REFACTOR-SPECIALIST 🔧 — Code Quality & Rule 7 Enforcer — name: refactor-specialist
    - 📄 [agents/repo-architect.md](./agents/repo-architect.md) — REPO-ARCHITECT 🏗️ — Repository Structure Analyst — Name: REPO-ARCHITECT
    - 📄 [agents/save-agent.md](./agents/save-agent.md) — SAVE-AGENT 💾 — Favourites & Saved Searches Specialist — name: save-agent
    - 📄 [agents/search-agent.md](./agents/search-agent.md) — SEARCH-AGENT 🔍 — Search & Filter Specialist — name: search-agent
    - 📄 [agents/spatial-agent.md](./agents/spatial-agent.md) — SPATIAL-AGENT 📐 — Spatial Analysis Specialist — name: spatial-agent
    - 📄 [agents/test-agent.md](./agents/test-agent.md) — TEST-AGENT 🧪 — Test Harness Specialist — name: test-agent
    - 📄 [agents/test-coverage-agent.md](./agents/test-coverage-agent.md) — TEST-COVERAGE-AGENT 📊 — Test Coverage & Stub Generator — name: test-coverage-agent
    - 📄 [agents/tile-agent.md](./agents/tile-agent.md) — TILE-AGENT 🧩 — Tile Pipeline Specialist — name: tile-agent
    - 📄 [agents/typescript-pro.md](./agents/typescript-pro.md) — Communication Protocol — name: typescript-pro
    - 📄 [agents/ui-ux-designer.md](./agents/ui-ux-designer.md) — Your Core Philosophy — name: ui-ux-designer
    - 📄 [agents/workflow-automator.md](./agents/workflow-automator.md) — WORKFLOW-AUTOMATOR ⚙️ — Developer Workflow Optimizer — name: workflow-automator
- 📁 [commands/](./commands/) — Slash-style command playbooks for common GIS tasks.
    - 📄 [commands/4dgs-status.md](./commands/4dgs-status.md) — Command playbook for 4dgs Status.
    - 📄 [commands/analyze-repo.md](./commands/analyze-repo.md) — Command playbook for Analyze Repo.
    - 📄 [commands/arcgis-import.md](./commands/arcgis-import.md) — Command playbook for Arcgis Import.
    - 📄 [commands/audit-popia.md](./commands/audit-popia.md) — Command playbook for Audit Popia.
    - 📄 [commands/badge-audit.md](./commands/badge-audit.md) — Command playbook for Badge Audit.
    - 📄 [commands/badge-check.md](./commands/badge-check.md) — Command playbook for Badge Check.
    - 📄 [commands/cesium-validate.md](./commands/cesium-validate.md) — Command playbook for Cesium Validate.
    - 📄 [commands/check-remit.md](./commands/check-remit.md) — Command playbook for Check Remit.
    - 📄 [commands/coverage-report.md](./commands/coverage-report.md) — Command playbook for Coverage Report.
    - 📄 [commands/debug-issue.md](./commands/debug-issue.md) — Command playbook for Debug Issue.
    - 📄 [commands/explain-architecture.md](./commands/explain-architecture.md) — Command playbook for Explain Architecture.
    - 📄 [commands/fallback-check.md](./commands/fallback-check.md) — Command playbook for Fallback Check.
    - 📄 [commands/generate-tests.md](./commands/generate-tests.md) — Command playbook for Generate Tests.
    - 📄 [commands/immersive-check.md](./commands/immersive-check.md) — Command playbook for Immersive Check.
    - 📄 [commands/m17-kickoff.md](./commands/m17-kickoff.md) — Command playbook for M17 Kickoff.
    - 📄 [commands/mcp-status.md](./commands/mcp-status.md) — Command playbook for Mcp Status.
    - 📄 [commands/milestone-audit.md](./commands/milestone-audit.md) — Command playbook for Milestone Audit.
    - 📄 [commands/milestone-status.md](./commands/milestone-status.md) — Command playbook for Milestone Status.
    - 📄 [commands/new-component.md](./commands/new-component.md) — Command playbook for New Component.
    - 📄 [commands/new-migration.md](./commands/new-migration.md) — Command playbook for New Migration.
    - 📄 [commands/opensky-check.md](./commands/opensky-check.md) — Command playbook for Opensky Check.
    - 📄 [commands/optimize-tiles.md](./commands/optimize-tiles.md) — Command playbook for Optimize Tiles.
    - 📄 [commands/perf-audit.md](./commands/perf-audit.md) — Command playbook for Perf Audit.
    - 📄 [commands/provenance-record.md](./commands/provenance-record.md) — Command playbook for Provenance Record.
    - 📄 [commands/qgis-import.md](./commands/qgis-import.md) — Command playbook for Qgis Import.
    - 📄 [commands/refactor-module.md](./commands/refactor-module.md) — Command playbook for Refactor Module.
    - 📄 [commands/update-docs.md](./commands/update-docs.md) — Command playbook for Update Docs.
    - 📄 [commands/validate-spatial.md](./commands/validate-spatial.md) — Command playbook for Validate Spatial.
    - 📄 [commands/verify-sources.md](./commands/verify-sources.md) — Command playbook for Verify Sources.
- 📁 [config/](./config/) — Config subtree (2 files, 0 subdirectories).
    - 📄 [config/combined-destructive-regex.txt](./config/combined-destructive-regex.txt) — Workspace asset for Combined Destructive Regex.
    - 📄 [config/destructive-regex.txt](./config/destructive-regex.txt) — Workspace asset for Destructive Regex.
- 📁 [guides/](./guides/) — Claude-facing implementation and domain reference guides.
    - 📄 [guides/arcgis_qgis_guide.md](./guides/arcgis_qgis_guide.md) — Reference guide for Arcgis Qgis Guide.
    - 📄 [guides/cape_town_data_sources.md](./guides/cape_town_data_sources.md) — Reference guide for Cape Town Data Sources.
    - 📄 [guides/cesium_tiles_guide.md](./guides/cesium_tiles_guide.md) — Reference guide for Cesium Tiles Guide.
    - 📄 [guides/maplibre_patterns.md](./guides/maplibre_patterns.md) — Reference guide for Maplibre Patterns.
    - 📄 [guides/nerf_3dgs_pipeline_guide.md](./guides/nerf_3dgs_pipeline_guide.md) — Reference guide for Nerf 3dgs Pipeline Guide.
    - 📄 [guides/opensky_integration_guide.md](./guides/opensky_integration_guide.md) — Reference guide for Opensky Integration Guide.
    - 📄 [guides/pmtiles_martin_guide.md](./guides/pmtiles_martin_guide.md) — Reference guide for Pmtiles Martin Guide.
    - 📄 [guides/popia_quick_reference.md](./guides/popia_quick_reference.md) — Reference guide for Popia Quick Reference.
    - 📄 [guides/spatial_constraints.md](./guides/spatial_constraints.md) — Reference guide for Spatial Constraints.
    - 📄 [guides/spatialintelligence_patterns.md](./guides/spatialintelligence_patterns.md) — Reference guide for Spatialintelligence Patterns.
- 📁 [hooks/](./hooks/) — Hooks subtree (5 files, 0 subdirectories).
    - 📄 [hooks/badge-lint-prewrite.js](./hooks/badge-lint-prewrite.js) — Configuration or implementation asset for Badge Lint Prewrite.
    - 📄 [hooks/block-dangerous-commands.sh](./hooks/block-dangerous-commands.sh) — Workspace asset for Block Dangerous Commands.
    - 📄 [hooks/fallback-verify-postwrite.js](./hooks/fallback-verify-postwrite.js) — Configuration or implementation asset for Fallback Verify Postwrite.
    - 📄 [hooks/filesize-guard.js](./hooks/filesize-guard.js) — Configuration or implementation asset for Filesize Guard.
    - 📄 [hooks/mcp-health-precheck.js](./hooks/mcp-health-precheck.js) — Configuration or implementation asset for Mcp Health Precheck.
- 📁 [skills/](./skills/) — Reusable Claude skill packs grouped by GIS capability.
    - 📁 [skills/4dgs_event_replay/](./skills/4dgs_event_replay/) — 4dgs Event Replay subtree (1 files, 0 subdirectories).
      - 📄 [skills/4dgs_event_replay/SKILL.md](./skills/4dgs_event_replay/SKILL.md) — Skill definition for 4dgs Event Replay.
    - 📁 [skills/a11y_check/](./skills/a11y_check/) — A11y Check subtree (1 files, 0 subdirectories).
      - 📄 [skills/a11y_check/SKILL.md](./skills/a11y_check/SKILL.md) — Skill definition for A11y Check.
    - 📁 [skills/agol_search/](./skills/agol_search/) — Agol Search subtree (1 files, 0 subdirectories).
      - 📄 [skills/agol_search/SKILL.md](./skills/agol_search/SKILL.md) — Skill definition for Agol Search.
    - 📁 [skills/arcgis_qgis_uploader/](./skills/arcgis_qgis_uploader/) — Arcgis Qgis Uploader subtree (1 files, 0 subdirectories).
      - 📄 [skills/arcgis_qgis_uploader/SKILL.md](./skills/arcgis_qgis_uploader/SKILL.md) — Skill definition for Arcgis Qgis Uploader.
    - 📁 [skills/assumption_verification/](./skills/assumption_verification/) — Assumption Verification subtree (1 files, 0 subdirectories).
      - 📄 [skills/assumption_verification/SKILL.md](./skills/assumption_verification/SKILL.md) — Skill definition for Assumption Verification.
    - 📁 [skills/cape_town_gis_research/](./skills/cape_town_gis_research/) — Cape Town Gis Research subtree (1 files, 0 subdirectories).
      - 📄 [skills/cape_town_gis_research/SKILL.md](./skills/cape_town_gis_research/SKILL.md) — Skill definition for Cape Town Gis Research.
    - 📁 [skills/cesium_3d_tiles/](./skills/cesium_3d_tiles/) — Cesium 3d Tiles subtree (1 files, 0 subdirectories).
      - 📄 [skills/cesium_3d_tiles/SKILL.md](./skills/cesium_3d_tiles/SKILL.md) — Skill definition for Cesium 3d Tiles.
    - 📁 [skills/ci_smoke_test/](./skills/ci_smoke_test/) — Ci Smoke Test subtree (1 files, 0 subdirectories).
      - 📄 [skills/ci_smoke_test/SKILL.md](./skills/ci_smoke_test/SKILL.md) — Skill definition for Ci Smoke Test.
    - 📁 [skills/code_summarize/](./skills/code_summarize/) — Code Summarize subtree (1 files, 0 subdirectories).
      - 📄 [skills/code_summarize/SKILL.md](./skills/code_summarize/SKILL.md) — Skill definition for Code Summarize.
    - 📁 [skills/cwv_monitor/](./skills/cwv_monitor/) — Cwv Monitor subtree (1 files, 0 subdirectories).
      - 📄 [skills/cwv_monitor/SKILL.md](./skills/cwv_monitor/SKILL.md) — Skill definition for Cwv Monitor.
    - 📁 [skills/data_source_badge/](./skills/data_source_badge/) — Data Source Badge subtree (1 files, 0 subdirectories).
      - 📄 [skills/data_source_badge/SKILL.md](./skills/data_source_badge/SKILL.md) — Skill definition for Data Source Badge.
    - 📁 [skills/dataset_ingest/](./skills/dataset_ingest/) — Dataset Ingest subtree (1 files, 0 subdirectories).
      - 📄 [skills/dataset_ingest/SKILL.md](./skills/dataset_ingest/SKILL.md) — Skill definition for Dataset Ingest.
    - 📁 [skills/debug_trace/](./skills/debug_trace/) — Debug Trace subtree (1 files, 0 subdirectories).
      - 📄 [skills/debug_trace/SKILL.md](./skills/debug_trace/SKILL.md) — Skill definition for Debug Trace.
    - 📁 [skills/deerflow_research_loop/](./skills/deerflow_research_loop/) — Deerflow Research Loop subtree (1 files, 0 subdirectories).
      - 📄 [skills/deerflow_research_loop/SKILL.md](./skills/deerflow_research_loop/SKILL.md) — Skill definition for Deerflow Research Loop.
    - 📁 [skills/dependency_analysis/](./skills/dependency_analysis/) — Dependency Analysis subtree (1 files, 0 subdirectories).
      - 📄 [skills/dependency_analysis/SKILL.md](./skills/dependency_analysis/SKILL.md) — Skill definition for Dependency Analysis.
    - 📁 [skills/docs_traceability_gate/](./skills/docs_traceability_gate/) — Docs Traceability Gate subtree (1 files, 0 subdirectories).
      - 📄 [skills/docs_traceability_gate/SKILL.md](./skills/docs_traceability_gate/SKILL.md) — Skill definition for Docs Traceability Gate.
    - 📁 [skills/documentation_first/](./skills/documentation_first/) — Documentation First subtree (1 files, 0 subdirectories).
      - 📄 [skills/documentation_first/SKILL.md](./skills/documentation_first/SKILL.md) — Skill definition for Documentation First.
    - 📁 [skills/fallback_verify/](./skills/fallback_verify/) — Fallback Verify subtree (1 files, 0 subdirectories).
      - 📄 [skills/fallback_verify/SKILL.md](./skills/fallback_verify/SKILL.md) — Skill definition for Fallback Verify.
    - 📁 [skills/geoparquet_pack/](./skills/geoparquet_pack/) — Geoparquet Pack subtree (1 files, 0 subdirectories).
      - 📄 [skills/geoparquet_pack/SKILL.md](./skills/geoparquet_pack/SKILL.md) — Skill definition for Geoparquet Pack.
    - 📁 [skills/gis_research_swarm/](./skills/gis_research_swarm/) — Gis Research Swarm subtree (1 files, 0 subdirectories).
      - 📄 [skills/gis_research_swarm/SKILL.md](./skills/gis_research_swarm/SKILL.md) — Skill definition for Gis Research Swarm.
    - 📁 [skills/git_workflow/](./skills/git_workflow/) — Git Workflow subtree (1 files, 0 subdirectories).
      - 📄 [skills/git_workflow/SKILL.md](./skills/git_workflow/SKILL.md) — Skill definition for Git Workflow.
    - 📁 [skills/instinct_guard/](./skills/instinct_guard/) — Instinct Guard subtree (1 files, 0 subdirectories).
      - 📄 [skills/instinct_guard/SKILL.md](./skills/instinct_guard/SKILL.md) — Skill definition for Instinct Guard.
    - 📁 [skills/mcp_health_check/](./skills/mcp_health_check/) — Mcp Health Check subtree (1 files, 0 subdirectories).
      - 📄 [skills/mcp_health_check/SKILL.md](./skills/mcp_health_check/SKILL.md) — Skill definition for Mcp Health Check.
    - 📁 [skills/mock_to_live_validation/](./skills/mock_to_live_validation/) — Mock To Live Validation subtree (1 files, 0 subdirectories).
      - 📄 [skills/mock_to_live_validation/SKILL.md](./skills/mock_to_live_validation/SKILL.md) — Skill definition for Mock To Live Validation.
    - 📁 [skills/nerf_3dgs_pipeline/](./skills/nerf_3dgs_pipeline/) — Nerf 3dgs Pipeline subtree (1 files, 0 subdirectories).
      - 📄 [skills/nerf_3dgs_pipeline/SKILL.md](./skills/nerf_3dgs_pipeline/SKILL.md) — Skill definition for Nerf 3dgs Pipeline.
    - 📁 [skills/opensky_flight_tracking/](./skills/opensky_flight_tracking/) — Opensky Flight Tracking subtree (1 files, 0 subdirectories).
      - 📄 [skills/opensky_flight_tracking/SKILL.md](./skills/opensky_flight_tracking/SKILL.md) — Skill definition for Opensky Flight Tracking.
    - 📁 [skills/popia_compliance/](./skills/popia_compliance/) — Popia Compliance subtree (1 files, 0 subdirectories).
      - 📄 [skills/popia_compliance/SKILL.md](./skills/popia_compliance/SKILL.md) — Skill definition for Popia Compliance.
    - 📁 [skills/popia_spatial_audit/](./skills/popia_spatial_audit/) — Popia Spatial Audit subtree (1 files, 0 subdirectories).
      - 📄 [skills/popia_spatial_audit/SKILL.md](./skills/popia_spatial_audit/SKILL.md) — Skill definition for Popia Spatial Audit.
    - 📁 [skills/project_audit/](./skills/project_audit/) — Project Audit subtree (1 files, 0 subdirectories).
      - 📄 [skills/project_audit/SKILL.md](./skills/project_audit/SKILL.md) — Skill definition for Project Audit.
    - 📁 [skills/provenance_tag/](./skills/provenance_tag/) — Provenance Tag subtree (1 files, 0 subdirectories).
      - 📄 [skills/provenance_tag/SKILL.md](./skills/provenance_tag/SKILL.md) — Skill definition for Provenance Tag.
    - 📁 [skills/refactor_plan/](./skills/refactor_plan/) — Refactor Plan subtree (1 files, 0 subdirectories).
      - 📄 [skills/refactor_plan/SKILL.md](./skills/refactor_plan/SKILL.md) — Skill definition for Refactor Plan.
    - 📁 [skills/repo_graph/](./skills/repo_graph/) — Repo Graph subtree (1 files, 0 subdirectories).
      - 📄 [skills/repo_graph/SKILL.md](./skills/repo_graph/SKILL.md) — Skill definition for Repo Graph.
    - 📁 [skills/rls_audit/](./skills/rls_audit/) — Rls Audit subtree (1 files, 0 subdirectories).
      - 📄 [skills/rls_audit/SKILL.md](./skills/rls_audit/SKILL.md) — Skill definition for Rls Audit.
    - 📁 [skills/schema_smells/](./skills/schema_smells/) — Schema Smells subtree (1 files, 0 subdirectories).
      - 📄 [skills/schema_smells/SKILL.md](./skills/schema_smells/SKILL.md) — Skill definition for Schema Smells.
    - 📁 [skills/security_review/](./skills/security_review/) — Security Review subtree (1 files, 0 subdirectories).
      - 📄 [skills/security_review/SKILL.md](./skills/security_review/SKILL.md) — Skill definition for Security Review.
    - 📁 [skills/source_badge_lint/](./skills/source_badge_lint/) — Source Badge Lint subtree (1 files, 0 subdirectories).
      - 📄 [skills/source_badge_lint/SKILL.md](./skills/source_badge_lint/SKILL.md) — Skill definition for Source Badge Lint.
    - 📁 [skills/spatial_index/](./skills/spatial_index/) — Spatial Index subtree (1 files, 0 subdirectories).
      - 📄 [skills/spatial_index/SKILL.md](./skills/spatial_index/SKILL.md) — Skill definition for Spatial Index.
    - 📁 [skills/spatial_validation/](./skills/spatial_validation/) — Spatial Validation subtree (1 files, 0 subdirectories).
      - 📄 [skills/spatial_validation/SKILL.md](./skills/spatial_validation/SKILL.md) — Skill definition for Spatial Validation.
    - 📁 [skills/spatialintelligence_inspiration/](./skills/spatialintelligence_inspiration/) — Spatialintelligence Inspiration subtree (1 files, 0 subdirectories).
      - 📄 [skills/spatialintelligence_inspiration/SKILL.md](./skills/spatialintelligence_inspiration/SKILL.md) — Skill definition for Spatialintelligence Inspiration.
    - 📁 [skills/stack_detect/](./skills/stack_detect/) — Stack Detect subtree (1 files, 0 subdirectories).
      - 📄 [skills/stack_detect/SKILL.md](./skills/stack_detect/SKILL.md) — Skill definition for Stack Detect.
    - 📁 [skills/test_stub_gen/](./skills/test_stub_gen/) — Test Stub Gen subtree (1 files, 0 subdirectories).
      - 📄 [skills/test_stub_gen/SKILL.md](./skills/test_stub_gen/SKILL.md) — Skill definition for Test Stub Gen.
    - 📁 [skills/three_tier_fallback/](./skills/three_tier_fallback/) — Three Tier Fallback subtree (1 files, 0 subdirectories).
      - 📄 [skills/three_tier_fallback/SKILL.md](./skills/three_tier_fallback/SKILL.md) — Skill definition for Three Tier Fallback.
    - 📁 [skills/tile_optimization/](./skills/tile_optimization/) — Tile Optimization subtree (1 files, 0 subdirectories).
      - 📄 [skills/tile_optimization/SKILL.md](./skills/tile_optimization/SKILL.md) — Skill definition for Tile Optimization.

[AGENT: docs-indexer | SESSION: 2026-03-14T16:57:22Z]

<!-- END AUTO -->
<!-- END AUTO-SECTION -->

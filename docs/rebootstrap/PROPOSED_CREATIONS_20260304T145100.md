---
__generated_by: rebootstrap_agent
__timestamp: 2026-03-04T14:51:00Z
__vibe: spatialintelligence.ai + 4DGS baby mode
---

> **TL;DR:** Lists proposed file creations from the 2026-03-04 rebootstrap pass, including new spatial layers (CesiumJS, 4DGS, ArcGIS/QGIS, OpenSky).

# Proposed Creations — Rebootstrap 2026-03-04

## Summary

| Category | New Files | Enhanced | Total |
|----------|-----------|----------|-------|
| Settings/Hooks | 1 new + 1 modified | 0 | 2 |
| Skills | 14 (7 × 2 locations) | 0 | 14 |
| Agents | 10 (5 × 2 locations) | 0 | 10 |
| Commands | 6 | 0 | 6 |
| Guides | 5 | 0 | 5 |
| Workflows | 1 | 0 | 1 |
| Copilot Instructions | 0 | 1 enhanced | 1 |
| Documentation | 2 | 0 | 2 |
| **TOTAL** | **39 new** | **2 enhanced** | **41** |

## New Skills (7 × 2 = 14 files)

| Skill | Claude Path | Copilot Path |
|-------|------------|--------------|
| 4DGS Event Replay | `.claude/skills/4dgs_event_replay/` | `.github/copilot/skills/4dgs_event_replay/` |
| ArcGIS/QGIS Uploader | `.claude/skills/arcgis_qgis_uploader/` | `.github/copilot/skills/arcgis_qgis_uploader/` |
| SpatialIntelligence Inspiration | `.claude/skills/spatialintelligence_inspiration/` | `.github/copilot/skills/spatialintelligence_inspiration/` |
| CesiumJS 3D Tiles | `.claude/skills/cesium_3d_tiles/` | `.github/copilot/skills/cesium_3d_tiles/` |
| OpenSky Flight Tracking | `.claude/skills/opensky_flight_tracking/` | `.github/copilot/skills/opensky_flight_tracking/` |
| NeRF/3DGS Pipeline | `.claude/skills/nerf_3dgs_pipeline/` | `.github/copilot/skills/nerf_3dgs_pipeline/` |
| POPIA Spatial Audit | `.claude/skills/popia_spatial_audit/` | `.github/copilot/skills/popia_spatial_audit/` |

## New Agents (5 × 2 = 10 files)

| Agent | Claude Path | Copilot Path |
|-------|------------|--------------|
| Immersive Reconstruction | `.claude/agents/immersive-reconstruction-agent.md` | `.github/copilot/agents/immersive-reconstruction-agent.agent.md` |
| CesiumJS | `.claude/agents/cesium-agent.md` | `.github/copilot/agents/cesium-agent.agent.md` |
| Flight Tracking | `.claude/agents/flight-tracking-agent.md` | `.github/copilot/agents/flight-tracking-agent.agent.md` |
| Vibecoding Steering | `.claude/agents/vibecoding-steering-agent.md` | `.github/copilot/agents/vibecoding-steering-agent.agent.md` |
| Spatial Upload | `.claude/agents/spatial-upload-agent.md` | `.github/copilot/agents/spatial-upload-agent.agent.md` |

## New Commands (6 files)

| Command | Path |
|---------|------|
| Cesium Validate | `.claude/commands/cesium-validate.md` |
| OpenSky Check | `.claude/commands/opensky-check.md` |
| 4DGS Status | `.claude/commands/4dgs-status.md` |
| ArcGIS Import | `.claude/commands/arcgis-import.md` |
| QGIS Import | `.claude/commands/qgis-import.md` |
| Immersive Check | `.claude/commands/immersive-check.md` |

## New Guides (5 files)

| Guide | Path | Lines |
|-------|------|-------|
| ArcGIS & QGIS Integration | `.claude/guides/arcgis_qgis_guide.md` | 172 |
| CesiumJS & 3D Tiles | `.claude/guides/cesium_tiles_guide.md` | 240 |
| SpatialIntelligence Patterns | `.claude/guides/spatialintelligence_patterns.md` | 209 |
| OpenSky Integration | `.claude/guides/opensky_integration_guide.md` | 291 |
| NeRF/3DGS Pipeline | `.claude/guides/nerf_3dgs_pipeline_guide.md` | 243 |

## New Workflow (1 file)

| Workflow | Path |
|----------|------|
| Immersive Spatial Validation | `.github/workflows/immersive-spatial-validation.yml` |

## Enhanced Files (2)

| File | Changes |
|------|---------|
| `.claude/settings.json` | +5 new hooks, +5 permissions, +3 metadata fields |
| `.github/copilot/copilot-instructions.md` | Ralph branding removed, PostgreSQL 15, immersive spatial sections added |

## New Hooks Added to settings.json

| Hook | Matcher | Type |
|------|---------|------|
| H-4dgs-check | PreToolUse (Write) | 4DGS pipeline safety |
| H-cesium-guard | PreToolUse (Write) | CesiumJS API key protection |
| H-arcgis-qgis | PreToolUse (Write) | Upload CRS validation |
| H-vibecoding-safety | PostToolUse (Write) | Phase gating + MCP safety |
| H-opensky-check | PostToolUse (Write) | Flight data privacy |

## Removed Files (1)

| File | Destination | Reason |
|------|-------------|--------|
| `.github/copilot/hooks/copilot-hooks.json` | `.github_removed/20260304T145100/` | [RALPH] branding, non-functional guards |

## All files include
- `__generated_by: rebootstrap_agent` header
- `__timestamp: 2026-03-04T14:51:00Z`
- `__vibe: spatialintelligence.ai + 4DGS baby mode`

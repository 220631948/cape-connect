<!--
/m17-kickoff — M17 Advanced Geospatial Analysis Kickoff
Priority: P1
Primary Agent: M17-ANALYSIS-AGENT
-->

## Trigger
`/m17-kickoff`

## Purpose
Official kickoff for M17 (Advanced Geospatial Analysis). Confirms M16 DoD is clean,
checks infrastructure health, creates the feature branch, generates test stubs for
analysis components, and checks baseline query performance. Sets up M17-ANALYSIS-AGENT
for productive first session.

## Primary Agent
**M17-ANALYSIS-AGENT 🔬** — coordinates with PROJECT-AUDIT-AGENT, MCP-HEALTH-AGENT.

## Steps

1. **Confirm M16 DoD:**
   Invoke `project_audit` — verify M16 (User Management) is fully complete.
   Check: all M16 components exist, tests pass, no open PLAN_DEVIATIONS.
   If M16 incomplete → STOP + escalate to human.

2. **Infrastructure health check:**
   Invoke `mcp_health_check` — verify P0 servers healthy.
   If any P0 UNREACHABLE → STOP + run `/mcp-status --fix`.

3. **Read M17 specification:**
   Read `PLAN.md` M17 section. Extract DoD requirements.
   Check for existing `docs/specs/` files for M17.

4. **Create feature branch:**
   ```bash
   git checkout -b feat/m17-analysis
   ```
   Confirm branch created successfully.

5. **Generate test stubs:**
   Invoke `test_stub_gen` for:
   - `src/components/analysis/AnalyticsDashboard.tsx`
   - `src/components/analysis/AnalysisResultPanel.tsx`
   Write stubs to `src/__tests__/` with `// STUB: implement assertions before merge` marker.

6. **Baseline spatial index check:**
   Invoke `spatial_index` — check query performance on analysis-related PostGIS tables.
   Flag any tables missing spatial indexes that will be used in M17 queries.

7. **Output M17 session brief:**
   - M16 DoD: ✅ / ❌
   - MCP health: OK / ESCALATE
   - Branch: feat/m17-analysis created
   - Test stubs: generated for N components
   - Index recommendations: [list]
   - First task: [extracted from PLAN.md M17 first DoD item]

## MCP Servers Used
- `filesystem` — read PLAN.md, create branch scaffolding
- `postgres` — spatial index check on analysis tables
- `doc-state` — session lock during kickoff

## Success Criteria
- M16 DoD confirmed by `project_audit`
- P0 MCP servers healthy
- `feat/m17-analysis` branch exists
- Test stubs created for AnalyticsDashboard + AnalysisResultPanel
- Spatial index baseline documented
- M17-ANALYSIS-AGENT ready for first implementation task

## Usage Example
```bash
/m17-kickoff
```

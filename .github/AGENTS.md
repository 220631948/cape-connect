# AGENTS.md — Agent Registry

**Name**: .github/AGENTS.md  
**Purpose**: Defines the fleet of GitHub Copilot AI coding interfaces, their responsibilities, boundaries, and contextual limits within the IDE and GitHub Actions ecosystem.  
**When to invoke**: When requesting complex architectural edits or refactoring via Copilot Chat.  
**Example invocation**: `@workspace plan the database schema`  
**Related agents/skills**: `@workspace`, `@terminal`  
**Configuration snippet**:

```json
{
  "github.copilot.advanced": {
    "list": {
      "AGENTS.md": true
    }
  }
}
```

---

## 🛡️ Compliance & Governance Agents

### 1. COPILOT-COMPLIANCE-AGENT

**Name**: COPILOT-COMPLIANCE-AGENT  
**Purpose**: Verifies all 10 CLAUDE.md project rules acting as Custom Instructions for `@workspace`. Ensures PR completion criteria are met before staging files.  
**When to invoke**: Pre-commit via Copilot Chat.  
**Example invocation**: `@workspace check compliance against CLAUDE.md`  
**Related agents/skills**: `compliance_audit`, `popia_compliance`  
**Configuration snippet**:

```json
"github.copilot.chat.customInstructions": [
  { "file": ".github/AGENTS.md" }
]
```

### 2. COPILOT-PR-AGENT

**Name**: COPILOT-PR-AGENT  
**Purpose**: GitHub Actions workflow orchestrator. Automatically reviews, lints, and structures Pull Request descriptions according to the workspace milestones.  
**When to invoke**: Automated on PR creation (`pull_request` event).  
**Example invocation**: N/A (Automated Actions)  
**Related agents/skills**: `pr_reviewer`  
**Configuration snippet**:

```yaml
uses: actions/github-script@v6
```

---

## 🏗️ Core Engineering Modes

### 3. DB-MODE

**Name**: DB-MODE  
**Purpose**: Database architect responsible for PostgreSQL 15, PostGIS schema design, row-level security (RLS), and writing Supabase migrations via inline Copilot.  
**When to invoke**: When creating new tables, altering column types, adding spatial indices, or writing RLS policies.  
**Example invocation**: `#file:supabase/migrations/ DB-MODE: scaffold the risk_zones table.`  
**Related agents/skills**: `AUTH-MODE`, `spatial_index`, `schema_smells`  
**Configuration snippet**: None

### 4. DATA-MODE

**Name**: DATA-MODE  
**Purpose**: GIS Data Integrator handling Python/TypeScript ingestion, reprojection to EPSG:4326, spatial validation, and MOCK/LIVE tier transitions.  
**When to invoke**: Generating ingestion pipelines.  
**Example invocation**: `@workspace build the python ingestion script for shapefiles`  
**Related agents/skills**: `dataset_ingest`, `arcgis_qgis_uploader`  
**Configuration snippet**: None

### 5. MAP-MODE

**Name**: MAP-MODE  
**Purpose**: MapLibre GL JS Cartographer managing basemaps, z-ordering, map rendering lifecycle, and PWA tile offline caching. Integrates strongly with inline ghost text suggestions.  
**When to invoke**: Implementing the map canvas or configuring MapLibre data sources.  
**Example invocation**: `// MAP-MODE: add the new vector tile layer for the suburb boundaries.`  
**Related agents/skills**: `OVERLAY-MODE`, `tile_optimization`  
**Configuration snippet**: None

---

## 🔐 ECC-Integration Agents (Added 2026-03-17)

<!--
origin: affaan-m/everything-claude-code (selective adaptation)
adaptation-summary: Copilot-compatible summaries for SECURITY-AUDITOR and CONTINUOUS-LEARNING agents.
-->

### 6. SECURITY-AUDITOR-AGENT

**Name**: SECURITY-AUDITOR-AGENT  
**Purpose**: Scans CLAUDE.md, settings.json, MCP configs, hooks, agent definitions for security vulnerabilities. Runs `npx ecc-agentshield scan`. Enforces Rules 3, 4, 5.  
**When to invoke**: After adding new MCP server, new agent definition, or before production milestone. Periodic security sweep.  
**Example invocation**: `@workspace /security-scan — run AgentShield on all configuration files`  
**Related agents/skills**: `security_review`, `rls_audit`, `popia_compliance`  
**Configuration snippet**:

```yaml
# .github/workflows/security.yml
- name: AgentShield Scan
  run: npx ecc-agentshield scan --output json > /tmp/shield.json
```

### 7. CONTINUOUS-LEARNING-AGENT

**Name**: CONTINUOUS-LEARNING-AGENT  
**Purpose**: Extracts session patterns into confidence-scored GIS instinct files. Clusters instincts into new SKILL.md files via `/evolve`. Improves agent behaviour over time.  
**When to invoke**: After milestone DoD sign-off. Run `/learn` at end of significant sessions.  
**Example invocation**: `@workspace /instinct-status — show all learned GIS instincts`  
**Related agents/skills**: `continuous_learning_v2`, `search_first`  
**Configuration snippet**: None — instincts stored in `.claude/instincts/*.json`

---

## New ECC-Integration Commands (2026-03-17)

| Command            | File                                   | Purpose                               |
| ------------------ | -------------------------------------- | ------------------------------------- |
| `/skill-create`    | `.claude/commands/skill-create.md`     | Generate skills from git history      |
| `/instinct-status` | `.claude/commands/instinct-status.md`  | View instincts with confidence scores |
| `/security-scan`   | `.claude/commands/agentshield-scan.md` | Run AgentShield security scan         |
| `/evolve`          | `.claude/commands/evolve.md`           | Cluster instincts into a SKILL.md     |

# COMMANDS.md — Copilot Chat Playbooks

**Name**: .github/COMMANDS.md  
**Purpose**: Central registry for predefined Copilot Chat slash-commands mapping to complex workflow orchestrations. Translates Claude CLI workflows into VS Code / Copilot equivalents.  
**When to invoke**: When requesting specific workflows, testing suites, or scaffolding tasks via Copilot Chat.  
**Example invocation**: Reading `.github/COMMANDS.md` or executing `@workspace /milestone-audit`  
**Related agents/skills**: `@workspace`, `@terminal`  
**Configuration snippet**: N/A (Playbook Index)

---

## 🚦 Core Auditing

### 1. `/badge-check`

**Name**: /badge-check  
**Purpose**: Enforces CLAUDE.md/GEMINI.md Rule 1. Prompts the agent via `@workspace` to scan all React components for visible `[SOURCE · YEAR · LIVE|CACHED|MOCK]` badges on data-displaying components.  
**When to invoke**: Before staging files.  
**Example invocation**: `@workspace /badge-check`  
**Related agents/skills**: `COPILOT-COMPLIANCE-AGENT`  
**Configuration snippet**: None

### 2. `/audit-popia`

**Name**: /audit-popia  
**Purpose**: Directs Copilot to scan the open tabs or workspace for POPIA compliance annotations in files carrying PII payload logic.  
**When to invoke**: Before finalizing a backend data route.  
**Example invocation**: `@workspace /audit-popia`  
**Related agents/skills**: `COPILOT-COMPLIANCE-AGENT`  
**Configuration snippet**: None

### 3. `/milestone-audit`

**Name**: /milestone-audit  
**Purpose**: Orchestrates an 8-area project audit defining readiness for Definition of Done (DoD). Focuses Copilot on checking RLs, badges, and POPIA tags.  
**When to invoke**: Before declaring a milestone fully complete.  
**Example invocation**: `@workspace /milestone-audit M5`  
**Related agents/skills**: `COPILOT-PR-AGENT`  
**Configuration snippet**: None

---

## ⚙️ Spatial Integration

### 4. `/validate-spatial`

**Name**: /validate-spatial  
**Purpose**: Instructs Copilot to write node scripts that check GeoJSON inputs ensure geometries fall within Cape Town bounding boxes and meet EPSG:4326 bounds.  
**When to invoke**: Upon receiving new GIS file drops.  
**Example invocation**: `@workspace /validate-spatial on public/mock/`  
**Related agents/skills**: `@terminal`  
**Configuration snippet**: None

### 5. `/optimize-tiles`

**Name**: /optimize-tiles  
**Purpose**: Automatically synthesizes the optimal `tippecanoe` bash flags and Martin MVT server definitions.  
**When to invoke**: Deploying vector layers.  
**Example invocation**: `@workspace /optimize-tiles`  
**Related agents/skills**: `@terminal`  
**Configuration snippet**: None

---

## 📦 Developer Scaffolding

### 6. `/new-component`

**Name**: /new-component  
**Purpose**: Generates a React component stub loaded with POPIA blocks, three-tier fallback guards, and UI Rule compliance comments via Inline Chat.  
**When to invoke**: Building new features or dashboard windows.  
**Example invocation**: `(Cmd+I) /new-component SuburbBoundaryLayer`  
**Related agents/skills**: `FEATURE-BUILDER`  
**Configuration snippet**: None

### 7. `/new-migration`

**Name**: /new-migration  
**Purpose**: Creates a Supabase PostgreSQL migration file preloaded with tenant ID definitions, RLS enforcement, spatial indexing, and POPIA tags.  
**When to invoke**: Altering or introducing mapping data tables.  
**Example invocation**: `@workspace /new-migration risk_zones`  
**Related agents/skills**: `DB-MODE`  
**Configuration snippet**: None

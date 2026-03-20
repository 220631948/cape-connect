# SKILLS.md — Skills Registry

**Name**: .github/SKILLS.md  
**Purpose**: Central registry of all GitHub Actions workflows and Copilot reusable prompts. Skills act as deterministic playbooks.  
**When to invoke**: When needing to trigger specific CI workflows, testing suites, or scaffolding tasks via Actions or Chat prompts.  
**Example invocation**: `@workspace perform the spatial_validation skill on public/mock/`  
**Related agents/skills**: `ALL_AGENTS`  
**Configuration snippet**: N/A

---

## 🌎 Spatial & Map Operations

### 1. spatial_validation_action

**Name**: spatial_validation_action  
**Purpose**: CI/CD GitHub Action that validates merged GeoJSON/WKT inputs against the Cape Town bounding box. Fails PR if EPSG:4326 bounds are violated.  
**When to invoke**: On PR to `main`.  
**Example invocation**: N/A (Automated)  
**Related agents/skills**: `DATA-MODE`  
**Configuration snippet**:

```yaml
- name: Validate Geometries
  run: npx gis-mcp --validate src/data/
```

### 2. tile_optimization_action

**Name**: tile_optimization  
**Purpose**: Generates PMTiles optimization settings, Martin server configuration blocks, and Tippecanoe bash commands upon tagged releases.  
**When to invoke**: On Release tag creation.  
**Example invocation**: N/A (Automated)  
**Related agents/skills**: `TILE-MODE`  
**Configuration snippet**:

```yaml
- run: tippecanoe -zg -o out.pmtiles --clip...
```

---

## 🔐 Compliance & Data Quality

### 3. source_badge_lint

**Name**: source_badge_lint  
**Purpose**: GitHub Action that scans all data-fetching components for the mandatory Rule 1 badge and blocks merges otherwise.  
**When to invoke**: PR checks.  
**Example invocation**: N/A (Automated)  
**Related agents/skills**: `COPILOT-COMPLIANCE-AGENT`  
**Configuration snippet**:

```yaml
- name: Check Source Badges
  run: grep -rnw 'src/components/' -e '\\[SOURCE'
```

### 4. popia_compliance_check

**Name**: popia_compliance_check  
**Purpose**: Validates POPIA (Protection of Personal Information Act) annotation snippets present in PR diffs.  
**When to invoke**: PR checks.  
**Example invocation**: N/A (Automated)  
**Related agents/skills**: `COPILOT-COMPLIANCE-AGENT`  
**Configuration snippet**: None

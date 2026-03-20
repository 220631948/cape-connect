# SKILLS.md — Skills Registry

**Name**: .gemini/SKILLS.md  
**Purpose**: Central registry of all Gemini skills available in this workspace. Skills are reusable, parameterized playbooks that enable complex, multi-step capabilities (e.g., data ingestion, Google Maps API querying).  
**When to invoke**: When extending agent behavior or verifying if a workflow has an existing automated capability instead of rewriting logic from scratch.  
**Example invocation**: `Use the spatial_validation skill to check public/mock/suburbs.geojson` or reading `.gemini/SKILLS.md` context.  
**Related agents/skills**: `ALL_AGENTS`  
**Configuration snippet**:

```yaml
skills_directory: ~/.gemini/antigravity/skills/
```

---

## 🌎 Spatial & Map Operations

### 1. arcpy-plan

**Name**: arcpy-plan  
**Purpose**: Plan ArcPy workflows for ArcGIS Pro tasks with real project context and safe sequencing.  
**When to invoke**: Before generating ArcGIS-specific Python logic.  
**Example invocation**: `Plan the ArcPy extraction workflow using the arcpy-plan skill`  
**Related agents/skills**: `DATA-AGENT`, `arcpy-script`  
**Configuration snippet**:

```yaml
path: ~/.gemini/antigravity/skills/arcpy-plan/SKILL.md
```

### 2. arcpy-script

**Name**: arcpy-script  
**Purpose**: Generate ArcPy scripts for ArcGIS Pro using live map context, layer sampling, and ArcGIS-aware prompt rules.  
**When to invoke**: When executing the planned ArcGIS ETL workflows.  
**Example invocation**: `Write the ArcPy script for the planned layer clipping via arcpy-script`  
**Related agents/skills**: `DATA-AGENT`, `arcpy-plan`  
**Configuration snippet**:

```yaml
path: ~/.gemini/antigravity/skills/arcpy-script/SKILL.md
```

### 3. spatial-index

**Name**: spatial-index  
**Purpose**: Recommend and apply spatial index strategies for GIS datasets (PostGIS/GeoParquet).  
**When to invoke**: Creating new spatial tables or debugging slow query geometries.  
**Example invocation**: `Run the spatial-index skill on the new parcels table`  
**Related agents/skills**: `DB-AGENT`, `DATA-AGENT`  
**Configuration snippet**:

```yaml
path: ~/.gemini/antigravity/skills/spatial-index/SKILL.md
```

### 4. geoparquet-pack

**Name**: geoparquet-pack  
**Purpose**: Package GIS layers into GeoParquet with metadata and validation.  
**When to invoke**: Exporting large vector datasets to cloud-native formats.  
**Example invocation**: `Package the contour layer using geoparquet-pack`  
**Related agents/skills**: `DATA-AGENT`  
**Configuration snippet**:

```yaml
path: ~/.gemini/antigravity/skills/geoparquet-pack/SKILL.md
```

---

## 🔐 Compliance & Data Quality

### 5. schema-smells

**Name**: schema-smells  
**Purpose**: Detect common schema and data quality smells in GIS layers before they are ingested into the database.  
**When to invoke**: Before `arcgis-import` or when migrating legacy shapefiles.  
**Example invocation**: `Check the planning geometry for schema smells`  
**Related agents/skills**: `DB-AGENT`, `PROJECT-AUDIT-AGENT`  
**Configuration snippet**:

```yaml
path: ~/.gemini/antigravity/skills/schema-smells/SKILL.md
```

### 6. project-audit

**Name**: project-audit  
**Purpose**: Audit ArcGIS Pro projects for broken layers, schema issues, and performance risks.  
**When to invoke**: Troubleshooting slow ArcGIS maps or verifying a `.aprx` delivery.  
**Example invocation**: `Run project-audit on delivery.aprx`  
**Related agents/skills**: `PROJECT-AUDIT-AGENT`  
**Configuration snippet**:

```yaml
path: ~/.gemini/antigravity/skills/project-audit/SKILL.md
```

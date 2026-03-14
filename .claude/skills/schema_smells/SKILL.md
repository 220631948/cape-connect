---
name: schema_smells
description: >
  Detect common schema and data quality issues in PostGIS tables: missing spatial indexes,
  SRID mismatches, null geometry counts, oversized geometry columns, missing tenant_id.
  Primary agents: DB-AGENT, DATA-AGENT. MCP: postgres, gis-mcp.
__generated_by: self-evolve-pass-2026-03-14
__timestamp: "2026-03-14T00:00:00Z"
---

## Purpose

Standardize pre-import and post-migration quality checks on PostGIS tables.
Catches common schema issues that cause silent data errors or performance problems:
missing GiST indexes, invalid geometries, SRID mismatches, and missing tenant isolation.

## Trigger Conditions

- "schema smells", "check table quality", "detect schema issues", "postgis table audit"
- DB-AGENT after writing a migration
- DATA-AGENT before or after dataset import
- `/milestone-audit` via PROJECT-AUDIT-AGENT

## Procedure

1. **Accept target:** table name or `all` to check all PostGIS tables.

2. **For each table — run smell checks:**

   **Smell 1 — Missing GiST spatial index:**
   ```sql
   SELECT tablename, attname
   FROM pg_indexes JOIN pg_attribute ...
   WHERE NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexdef LIKE '%gist%' AND tablename = t.name);
   ```
   Expected: every geometry column has a GiST index. Flag missing ones.

   **Smell 2 — SRID mismatch:**
   ```sql
   SELECT DISTINCT ST_SRID(geom) FROM <table> WHERE geom IS NOT NULL;
   ```
   Expected: SRID = 4326. Flag rows with any other SRID.

   **Smell 3 — Invalid geometry count:**
   ```sql
   SELECT COUNT(*) FROM <table> WHERE NOT ST_IsValid(geom);
   ```
   Expected: 0. Flag any invalid geometries.

   **Smell 4 — Missing tenant_id column:**
   ```sql
   SELECT column_name FROM information_schema.columns
   WHERE table_name = '<table>' AND column_name = 'tenant_id';
   ```
   Expected: present and NOT NULL. Flag absence.

   **Smell 5 — Geometry column too broad:**
   ```sql
   SELECT type FROM geometry_columns WHERE f_table_name = '<table>';
   ```
   Expected: specific type (MULTIPOLYGON, POINT, etc.) not generic GEOMETRY.

   **Smell 6 — Null geometry count:**
   ```sql
   SELECT COUNT(*) FROM <table> WHERE geom IS NULL;
   ```
   Expected: 0 for spatial tables. Flag high null counts.

3. **Classify each smell:**
   - CRITICAL: missing tenant_id, invalid geometries
   - WARNING: missing GiST index, SRID mismatch, broad geometry type
   - INFO: null geometry count (acceptable for non-spatial tables)

4. **Output smell report per table.**

## Output Format

```
=== SCHEMA SMELLS — suburbs ===

SMELL                 SEVERITY  FINDING
GiST Index            ✅ OK     gist_suburbs_geom present
SRID                  ✅ OK     all rows SRID=4326
Invalid Geometries    ✅ OK     0 invalid rows
Tenant ID             ✅ OK     tenant_id NOT NULL present
Geometry Type         ⚠️ WARN   type=GEOMETRY (expected MULTIPOLYGON)
Null Geometry         ✅ OK     0 null rows

SUMMARY: 1 WARNING. Run ST_SetSRID and update geometry column type.
```

## When NOT to Use

- On non-spatial tables (use standard schema review instead)
- On views or materialized views (check underlying tables)
- As a substitute for full RLS audit (use `rls_audit` for RLS checks)

---
name: tenant-layer-audit
description: Audits tenant isolation and POPIA compliance for all geospatial layers.
---

# Tenant Layer Audit Skill

## Purpose

Ensure that multi-tenant data isolation and South African POPIA (Protection of Personal Information Act) compliance are rigorously enforced across all spatial layers.

## Inputs

- **Tenant ID:** UUID of the tenant to be audited.
- **Environment:** `dev`, `staging`, or `production`.

## Procedure

### 1. Layer Access Discovery

- List all layers that are supposedly accessible to the tenant.
- Verify that this list matches the `layer_permissions` table.

### 2. RLS Integrity Check

- Attempt to query each layer anonymously (without a session).
- **Verification:** Confirm that the query fails or returns zero results.
- **P0 Error:** Data is returned for a tenant-scoped layer without a valid `tenant_id`.

### 3. POPIA PII Check

- Scan the attributes of each layer for potential personally identifiable information (PII) such as owner names, ID numbers, or exact addresses in owner-attribute layers.
- **Verification:** Ensure that these fields are either stripped, masked, or have the mandatory POPIA annotation block.

### 4. Analysis Scoping

- Call `postgis-pipeline` tools `analyze_area` and `get_tenant_spatial_stats` for a non-existent tenant.
- **Verification:** Confirm that these return empty/zero results (not error).

## Outputs

- **Audit Report:** `docs/compliance/POPIA_AUDIT_{tenant_id}_{date}.md`.
- **Findings:** Categorized by risk level (P0, Warning, Info).

## Registration

- Mandatory part of the release cycle for all new spatial features.
- CI post-deployment task for periodic security sweeps.

## Read-only Audit Mode

- **Flag:** `--audit`
- Reports findings without updating any permissions or metadata.

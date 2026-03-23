# CapeGIS AI Extension

This extension provides specialized AI agents, skills, and hooks for the CapeTown GIS Hub project.

## Sub-Agents

### Geospatial Data Agent (`geo-data-agent`)
Automates ingestion and validation of spatial data.
- **Triggers:** Spatial data ingestion, STAC cataloging, geometry validation.
- **Tools:** `gis-mcp`, `formats`, `generate_stac_catalog.py`.

### Cloud Infrastructure Agent (`cloud-ops-agent`)
Manages GCP Terraform and GCS FinOps.
- **Triggers:** Terraform changes, GCS cost analysis, infra provisioning.
- **Tools:** `estimate_gcs_cost.sh`, `terraform`.

### Immersive Agent (`immersive-agent`)
Orchestrates NeRF/3DGS and Cesium integrations.
- **Triggers:** 3D model training, 3D Tiles validation, camera bounds setup.
- **Tools:** `cesium`, `stitch`, `nerfstudio`.

## Skills

- `stac-catalog-sync`: Sync and validate STAC metadata.
- `gcs-cost-audit`: Estimate and optimize GCS storage costs.
- `db-raster-wire-check`: Verify PostGIS out-db raster references.
- `check-popia-compliance`: Audit for POPIA privacy violations in spatial data.

## Hooks

- `terraform-security-guardian`: Prevents hardcoded GCP keys and enforces WIF.
- `out-db-raster-enforcer`: Validates out-db raster syntax in scripts.
- `rls-multi-tenant-verifier`: Ensures RLS on spatial tables in migrations.

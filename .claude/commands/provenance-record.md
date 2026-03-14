<!--
/provenance-record — Dataset Provenance Recording
Priority: P1
Primary Agent: PROVENANCE-AGENT
Skill: provenance_tag
-->

## Trigger
`/provenance-record <dataset-slug> [--source <url>] [--license <id>] [--date <YYYY-MM>]`

## Purpose
Record traceable provenance metadata for a dataset. Runs license check, generates provenance
JSON, verifies CRS, updates DATA_REGISTRY.md. Returns provenance ID for SourceBadge use.

## Primary Agent
**PROVENANCE-AGENT 📋** — invokes `provenance_tag` skill.

## Steps

1. **Collect dataset metadata** (from args or interactive prompt):
   - Dataset name/slug
   - Source URL
   - License identifier (e.g., CC-BY-4.0)
   - Collection date (YYYY-MM)
   - CRS (verify EPSG:4326)
   - Feature count (approximate)

2. **Invoke `provenance_tag` skill:**
   a. Run `scripts/pipeline/license_checker.py` — STOP if PROPRIETARY
   b. Run `scripts/pipeline/provenance.py` — generate provenance record
   c. Verify CRS = EPSG:4326
   d. Write `supabase/seeds/provenance/<slug>.json`
   e. Update `docs/DATA_REGISTRY.md`

3. **Output provenance ID** — for use in SourceBadge YEAR field.

4. **Invoke `spatial_validation`** — verify dataset bbox within Cape Town bounds (Rule 9).

5. **If dataset contains personal data:**
   Invoke `popia_compliance` — add POPIA annotation to provenance record.

## MCP Servers Used
- `filesystem` — read/write provenance JSON and DATA_REGISTRY.md
- `postgres` — if dataset is already in PostGIS (verify schema alignment)
- `doc-state` — write lock for DATA_REGISTRY.md update

## Success Criteria
- License verified as open (non-proprietary)
- Provenance JSON written to `supabase/seeds/provenance/<slug>.json`
- `docs/DATA_REGISTRY.md` updated with new entry
- Provenance ID returned
- CRS confirmed as EPSG:4326
- Bbox within Cape Town bounds confirmed

## Usage Example
```bash
# Record provenance interactively
/provenance-record cape-town-suburbs

# With args (skip interactive prompt)
/provenance-record gv-roll-2022 --source https://odp.capetown.gov.za/gvr --license OGL --date 2022-03
```

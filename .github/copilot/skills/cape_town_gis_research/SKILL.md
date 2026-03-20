---
name: cape-town-gis-research
description: Research and validate Cape Town and Western Cape GIS sources with evidence tags and traceable citations. Use this skill whenever users ask for GIS data discovery, source validation, research updates under docs/research, or Cape Town domain checks.
---

# Cape Town GIS Data Research Protocol

## Purpose
Standardize how GIS research is collected, verified, and documented for Cape Town + Western Cape scope.

## Required Inputs
- `docs/context/GIS_MASTER_CONTEXT.md`
- `docs/research/README.md`
- `docs/API_STATUS.md`
- `docs/OPEN_QUESTIONS.md`

## Workflow

### Step 1 — Lock Scope First
- Enforce geographic scope: Cape Town + Western Cape only.
- Reject or flag out-of-scope sources immediately.

### Step 2 — Gather Candidate Sources
Prioritize authoritative sources:
1. City of Cape Town Open Data + ArcGIS REST directories
2. Western Cape Government spatial repositories
3. SANBI BGIS and other national/public datasets relevant to the Cape Town AOI

### Step 3 — Verify Every Source
For each source, record:
- access/auth status (public, key required, blocked)
- license/commercial constraints
- format and CRS compatibility (GeoJSON/ArcGIS REST preferred; CRS explicit)
- update recency and completeness
- Cape Town/WC coverage fitness

### Step 4 — Produce Evidence-Typed Findings
- Mark each claim as `[VERIFIED]` or `[ASSUMPTION — UNVERIFIED]`.
- Add inline source citations with file paths for every non-trivial claim.
- If evidence is missing, add a targeted follow-up question in `docs/OPEN_QUESTIONS.md`.

### Step 5 — Write Outputs in Canonical Locations
- Add or update findings in `docs/research/`.
- Update `docs/research/README.md` index when creating new research files.
- Update `docs/API_STATUS.md` when source availability meaningfully changes.

### Step 6 — Record Gaps Explicitly
If a source fails validation or cannot be accessed, log it as a clear data gap with reason and recommended fallback path.

## Output Requirements
- concise summary of validated sources
- unresolved gaps list with next verification actions
- explicit policy risks (licensing/commercial/POPIA where applicable)

## When NOT to Use
- implementing code changes
- runtime debugging unrelated to data-source research

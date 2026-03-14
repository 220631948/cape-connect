---
name: provenance_tag
description: >
  Record provenance metadata for a dataset: source URL, license, collection date,
  CRS, and feature count. Invokes license_checker.py and provenance.py.
  Writes record to supabase/seeds/provenance/ and updates docs/DATA_REGISTRY.md.
__generated_by: self-evolve-pass-2026-03-14
__timestamp: "2026-03-14T00:00:00Z"
---

## Purpose

Ensure every dataset ingested into the CapeTown GIS Hub has a traceable provenance record.
Required inputs: dataset name, source URL, license, collection date, CRS, feature count.
Prevents proprietary-licensed data from entering the pipeline via `license_checker.py`.
Outputs a provenance ID for use in SourceBadge YEAR field.

## Trigger Conditions

- `/provenance-record <dataset>` command invocation
- DATA-AGENT ingests a new dataset
- Pre-M17 dataset audit
- PROVENANCE-AGENT activation

## Procedure

1. **Accept inputs:**
   - Dataset name (slug: lowercase, hyphens)
   - Source URL (must be from approved domains)
   - License (e.g., CC-BY-4.0, OGL, ODbL)
   - Collection date (ISO 8601: YYYY-MM)
   - CRS (expected: EPSG:4326 for storage)
   - Feature count (approximate)

2. **Invoke `scripts/pipeline/license_checker.py`:**
   ```bash
   python3 scripts/pipeline/license_checker.py --license "<license>"
   ```
   - If result = PROPRIETARY → **STOP immediately** — do not proceed.
   - Log to `docs/PLAN_DEVIATIONS.md` and escalate to human.
   - Acceptable licenses: CC-BY*, OGL, ODbL, PDDL, CC0, MIT (for code).

3. **Invoke `scripts/pipeline/provenance.py`:**
   ```bash
   python3 scripts/pipeline/provenance.py \
     --name "<slug>" \
     --source "<url>" \
     --license "<license>" \
     --date "<YYYY-MM>" \
     --crs "EPSG:4326" \
     --features <count>
   ```
   Generates provenance JSON with a unique provenance ID.

4. **Verify CRS is EPSG:4326** (CLAUDE.md Rule 9 storage requirement):
   - If CRS is not EPSG:4326 → halt, request reprojection from DATA-AGENT.
   - Log the required reprojection action.

5. **Write provenance record:**
   Save generated JSON to: `supabase/seeds/provenance/<slug>.json`

6. **Update `docs/DATA_REGISTRY.md`** (create if absent):
   Append entry:
   ```markdown
   | <slug> | <source_url> | <license> | <date> | EPSG:4326 | <feature_count> | <provenance_id> |
   ```

7. **Return provenance ID** for use in SourceBadge YEAR field.

## Output Format

```
=== PROVENANCE RECORD ===
Slug: cape-town-suburbs
Provenance ID: prov-20230601-suburbs-ct
License: CC-BY-4.0 ✅ (open)
CRS: EPSG:4326 ✅
Features: 115
Record: supabase/seeds/provenance/cape-town-suburbs.json
Registry: docs/DATA_REGISTRY.md updated
SourceBadge year: 2023
```

## When NOT to Use

- For datasets already in `docs/DATA_REGISTRY.md` with valid provenance IDs
- For mock/stub GeoJSON files in `public/mock/` (these are synthetic — no provenance needed)
- For proprietary data — reject immediately without recording
- For datasets outside Cape Town bbox (Rule 9) — reject before recording

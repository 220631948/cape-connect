---
mode: 'agent'
description: 'Audit a component for data source badge compliance (Rule 1)'
---
# Data Source Badge Compliance Audit

## Context
Read `CLAUDE.md` Rule 1 (Data Source Badge) and Rule 2 (Three-Tier Fallback). Locate the component file specified by the user.

## Task
Audit the specified component for data source badge compliance.

### Checks to perform:

**1. Badge Presence**
Confirm a badge element renders `[SOURCE_NAME · YEAR · LIVE|CACHED|MOCK]`.
- Badge must be visible in the DOM without any hover/focus interaction
- Acceptable: inline text, a `<DataBadge>` component, or a `<span>` with badge class
- Not acceptable: tooltip-only, hidden behind `opacity-0`, or `sr-only`

**2. Badge Wired to Fallback State**
Confirm the badge status (`LIVE`/`CACHED`/`MOCK`) reflects the actual data tier in use:
- `LIVE` when fresh API data is returned
- `CACHED` when reading from Supabase `api_cache` table
- `MOCK` when reading from `public/mock/*.geojson`

**3. Source Name from Approved List**
Verify the source name matches an approved source. Flag any use of "Lightstone".
Approved sources include: `CoCT GV Roll 2022`, `OpenSky Network`, `StatsSA`, `CoCT Open Data Portal`, `OSM`, `CARTO`, `Martin MVT`, `Supabase`.

**4. Year Field**
Confirm the year is present and plausible (not hardcoded to a year >5 years ago without comment).

**5. Export / Print**
Confirm badge is included in any data export or printed view if applicable.

## Output Format
```
Data Badge Audit: <ComponentName>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✓/✗  Badge present and visible without hover
✓/✗  Badge wired to LIVE/CACHED/MOCK state
✓/✗  Source name from approved list
✓/✗  Year field present
✓/✗  Included in export/print (if applicable)

Badge found: [<SOURCE> · <YEAR> · <STATUS>]

Issues:
  - <issue or "None">

Recommended fix (if issues):
  <code snippet>
```

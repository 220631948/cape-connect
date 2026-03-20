<!--
__generated_by: rebootstrap_agent
__timestamp: 2026-03-04T10:39:43Z
-->

# /badge-check — Data Source Badge Audit

## Trigger
`/badge-check` or "check data source badges" or "find components missing badges"

## What It Does
Scans all React components in `app/src/` for compliance with CLAUDE.md Rule 1: every data display must show a visible `[SOURCE_NAME · YEAR · [LIVE|CACHED|MOCK]]` badge. Reports missing, malformed, and compliant badges.

## Invokes Skill
`mock-to-live-validation` (`.claude/skills/mock_to_live_validation/SKILL.md`) — to verify badge status matches actual data tier in use

## Procedure
1. Find all `.tsx` files in `app/src/components/` and `app/src/app/`
2. For each file, detect data-display indicators:
   - Fetches from Supabase, Martin, or PostGIS
   - GeoJSON renders (`addLayer`, `addSource`, `FeatureCollection`)
   - Table or chart components showing data rows
   - Map overlays and popups
3. For each data-displaying file, search for badge pattern:
   - Regex: `/\[[\w\s]+·\s*\d{4}\s*·\s*(LIVE|CACHED|MOCK)\]/`
   - Accept: inline string, JSX element, or CSS class `data-badge`
4. Check badge visibility: must not be inside a `title`, `aria-label`, or hover-only `tooltip` — must be always-visible DOM node
5. Verify badge status matches reality:
   - Component uses `fetch()` / Supabase client → expects `LIVE` or `CACHED`
   - Component uses `public/mock/` path → expects `MOCK`
6. Produce report

## Expected Output
```
Data Source Badge Audit — [date]
=====================================
Files scanned: [N]
Data-displaying components: [N]

✅ COMPLIANT:
  - MapLayer.tsx: [Martin MVT · 2024 · LIVE] — visible, correct tier
  - SuburbsOverlay.tsx: [City of Cape Town · 2023 · CACHED] — visible, correct tier

⚠️ BADGE HIDDEN (hover-only or aria-label only):
  - PropertyPopup.tsx: badge exists but inside tooltip only
    → Move badge to always-visible DOM element

🚨 MISSING BADGE:
  - CadastralPanel.tsx: fetches from supabase — no badge found
    → Add: <span className="data-badge">[GV Roll · 2022 · LIVE]</span>

🚨 MISMATCHED STATUS:
  - ZoningLayer.tsx: badge says LIVE but uses public/mock/zoning.geojson
    → Change badge to MOCK or wire live source

Summary: [N] compliant · [N] warnings · [N] errors
Action: Fix all 🚨 errors before M milestone sign-off
```

## When NOT to Use
- On server-only API route files (`app/api/`) — badges are for client-visible UI only
- On non-data utility components (`Button`, `Modal`, `Spinner`)
- As a substitute for E2E visual testing — run `npm run test:e2e` for visual badge verification

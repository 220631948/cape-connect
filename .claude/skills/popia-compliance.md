# POPIA Compliance Reference

POPIA (Protection of Personal Information Act) is South African data protection law.
It applies to all personal information processed by CapeTown GIS Hub.

## What counts as personal information in this project
- User email, name, and authentication identity (Supabase Auth)
- Precise geolocation data linked to an identifiable person
- Any combination of fields that could identify a natural person

## Required controls
- **RLS isolation**: Every table containing PII must have Row Level Security enabled
  and policies that scope access to the authenticated user's own records only
- **Source attribution**: All data displays must show a source attribution badge
  indicating data origin and collection date
- **Consent boundary**: Do not collect or retain PII beyond what is necessary
  for the stated feature function
- **Data minimisation**: Store the minimum fields needed. Do not add "might be useful" columns.

## What to do when uncertain
Flag it. Do not silently resolve POPIA uncertainty.
Write a comment in the code: `// POPIA REVIEW NEEDED: [reason]`
Add it to the CLAUDE.md Accumulated Corrections log.
Ask before proceeding.

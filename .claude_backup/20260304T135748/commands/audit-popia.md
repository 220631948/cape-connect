# /audit-popia — POPIA Compliance Scan

## Trigger
`/audit-popia` or "run a POPIA compliance audit"

## What It Does
Scans all source files in `app/src/` for personal data handling and verifies POPIA compliance using the `popia-compliance` skill.

## Procedure
1. Find all `.ts` and `.tsx` files in `app/src/`
2. For each file, check for personal data indicators:
   - Imports from auth, profile, or user modules
   - References to `profiles`, `favourites`, `saved_searches`, `audit_log` tables
   - Variables named `email`, `name`, `userId`, `tenant_id`, `password`
3. For files with personal data, invoke the `popia-compliance` skill
4. Produce a summary report:

## Expected Output
```
POPIA Audit Report — [date]
=====================================
Files scanned: [N]
Files with personal data: [N]

✅ COMPLIANT:
  - [file]: [reason]

⚠️ REQUIRES ATTENTION:
  - [file]: [issue]

🚨 MISSING POPIA HEADER:
  - [file]: needs POPIA annotation

Action items: [list]
```

## Skill Invoked
`popia-compliance` (`.claude/skills/popia_compliance/SKILL.md`)

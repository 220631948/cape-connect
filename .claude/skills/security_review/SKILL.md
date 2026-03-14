---
name: security-review
description: Security review checklist for any new API route, MCP server, or data pipeline. Adapted from affaan-m/everything-claude-code security/ pattern. Run before merging any new server-side code.
---

# Security Review

## Purpose
Catch OWASP Top-10 and Cape Town GIS-specific security issues before code reaches main.

## Checklist

### Secrets & Keys
- [ ] No hardcoded credentials — env var only (CLAUDE.md Rule 3)
- [ ] `NEXT_PUBLIC_` prefix only for genuinely public values (safe to expose client-side)
- [ ] `.env` is in `.gitignore` (verify with `git check-ignore -v .env`)

### Input Validation
- [ ] All user inputs validated at system boundary (API routes, MCP tool args)
- [ ] Bounding box coordinates clamped to Rule 9 limits before passing to DB
  - west: 18.0, south: -34.5, east: 19.5, north: -33.0
- [ ] SQL uses parameterized queries / Supabase RLS — no string concatenation
- [ ] GeoJSON inputs validated for geometry type and coordinate range

### Auth & RLS
- [ ] Every Supabase table has RLS enabled + forced (Rule 4)
- [ ] `tenant_id` verified in application layer (not just RLS)
- [ ] JWT lifetime respected (1h access, 7d refresh)
- [ ] Guest mode routes return no PII (CLAUDE.md §6)

### Data Exposure
- [ ] Guest mode shows no PII (CLAUDE.md §6 — parcel outlines only, no property details)
- [ ] API responses stripped of internal fields before serialization
- [ ] POPIA annotation present on any file exposing personal data (Rule 5)
- [ ] External API responses not forwarded verbatim — sanitize before caching

### OWASP Top-10 Quick Scan
- [ ] A01 Broken Access Control — RLS + tenant_id double-check
- [ ] A02 Cryptographic Failures — no plaintext secrets in logs or responses
- [ ] A03 Injection — parameterized queries; no `eval()` or `new Function()`
- [ ] A07 Auth Failures — JWT verified server-side on every protected route
- [ ] A09 Security Logging — no PII in console.log / Sentry breadcrumbs

## Usage
```bash
# Run against a specific file
# Ask Claude Code: "Run security-review skill against src/app/api/zoning/route.ts"
```

## Output
List each section with ✓ (pass) / ✗ FAIL and a one-line remediation note for any failure.

```
Security Review — src/app/api/zoning/route.ts
Secrets & Keys:       ✓ ✓ ✓
Input Validation:     ✓ ✓ ✓ ✓
Auth & RLS:           ✓ ✓ ✓ ✓
Data Exposure:        ✓ ✓ ✓ ✓
OWASP Top-10:         ✓ ✓ ✓ ✓ ✓

RESULT: PASS — ready to merge
```

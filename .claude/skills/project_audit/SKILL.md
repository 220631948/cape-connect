---
name: project_audit
description: >
  Comprehensive project health audit — checks mock GeoJSON validity, badge coverage (Rule 1),
  RLS coverage (Rule 4), POPIA annotations (Rule 5), no hardcoded secrets (Rule 3), file sizes
  (Rule 7), dependencies, and Docker container health. Used before each milestone DoD.
__generated_by: self-evolve-pass-2026-03-14
__timestamp: "2026-03-14T00:00:00Z"
---

## Purpose

Prevent technical debt accumulation and catch governance violations before milestone sign-off.
As the project grows through M17 and beyond, periodic holistic audits are essential.
This skill runs 8 distinct checks and scores a RULES_PASS% for the DoD gate.

## Trigger Conditions

- "project audit", "health check", "codebase audit", "pre-milestone audit"
- `/milestone-audit [M<n>]` command invocation
- PROJECT-AUDIT-AGENT activation
- Before any milestone DoD sign-off

## Procedure

1. **Audit Area 1 — Mock GeoJSON Validity:**
   For each file in `public/mock/*.geojson`:
   - Parse JSON (detect syntax errors)
   - Verify `type: "FeatureCollection"`
   - Check all features within Cape Town bbox: `{ west: 18.0, south: -34.5, east: 19.5, north: -33.0 }`
   - Report: VALID / INVALID (parse error) / OUT_OF_BBOX

2. **Audit Area 2 — Badge Coverage (Rule 1):**
   Invoke `source_badge_lint` skill. Summarize PASS/FAIL/WARN counts.

3. **Audit Area 3 — RLS Coverage (Rule 4):**
   For each tenant-scoped table (`profiles`, `saved_searches`, `favourites`, `valuation_data`,
   `api_cache`, `audit_log`, `tenant_settings`, `layer_permissions`):
   ```sql
   SELECT tablename, rowsecurity FROM pg_tables
   WHERE tablename IN (...) AND schemaname = 'public';
   ```
   Expected: `rowsecurity = true`. Flag any false.

4. **Audit Area 4 — POPIA Annotation (Rule 5):**
   For each file containing personal data patterns (`email`, `name`, `address`, `id_number`,
   `property_owner`, `valuation`):
   Check for `POPIA ANNOTATION` block comment. Flag missing annotations.

5. **Audit Area 5 — No Hardcoded Secrets (Rule 3):**
   Grep `src/` and `supabase/` for patterns:
   ```
   (api_key|apikey|secret|password|token)\s*=\s*["'][^"']+["']
   ```
   Exclude: `.env.example`, `*.test.ts`, `*.spec.ts`, comments.
   Any match → CRITICAL FAIL.

6. **Audit Area 6 — File Size (Rule 7):**
   Count lines in all `src/**/*.{ts,tsx,js,jsx,py}` files.
   Skip: `migrations/`, `__tests__/`, `*.test.*`, `*.spec.*`, `*.md`.
   Flag any file > 300 lines.

7. **Audit Area 7 — Dependency Health:**
   ```bash
   npm audit --audit-level=high 2>&1 | tail -5
   pip check 2>&1 | tail -5
   ```
   Report HIGH/CRITICAL vulnerabilities.

8. **Audit Area 8 — Docker Container Health:**
   ```bash
   docker compose ps --format json 2>/dev/null
   ```
   Check: all required services (PostGIS, Martin) are `running`.

9. **Calculate RULES_PASS%:**
   ```
   total_checks = sum of individual check counts across all 8 areas
   passed_checks = checks with PASS result
   RULES_PASS% = (passed_checks / total_checks) * 100
   ```

10. **Output verdict:**
    - ≥ 90% → `✅ READY FOR DOD`
    - < 90% → `❌ BLOCKERS FOUND` with enumerated blockers

11. **Write to `docs/AUDIT_LOG.md`.**

## Output Format

```
=== PROJECT AUDIT REPORT ===
Date: 2026-03-14 | Target: M17 DoD

AREA                    CHECKS  PASS  FAIL  SCORE
Mock GeoJSON Validity   6       6     0     100%
Badge Coverage (R1)     23      20    3     87%
RLS Coverage (R4)       8       8     0     100%
POPIA Annotation (R5)   12      11    1     92%
No Hardcoded Secrets    1       1     0     100%
File Size (R7)          45      43    2     96%
Dependency Health       2       2     0     100%
Docker Health           2       2     0     100%

TOTAL: 99/99 checks | RULES_PASS%: 93%

✅ READY FOR DOD — M17 audit passed (93%). Human may sign off.
NOTES: 3 badge violations (see source_badge_lint report). 1 POPIA file missing annotation.
```

## When NOT to Use

- For real-time monitoring (use dedicated monitoring tools)
- As a substitute for Vitest/Playwright tests (this is a static audit)
- In the middle of an active development session (run at milestone gates)

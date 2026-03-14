<!--
/milestone-audit — Pre-DoD Milestone Health Audit
Priority: P3
Primary Agent: PROJECT-AUDIT-AGENT
Skills: project_audit, source_badge_lint, fallback_verify, schema_smells, a11y_check
-->

## Trigger
`/milestone-audit [M<n>]`
Examples: `/milestone-audit`, `/milestone-audit M17`

## Purpose
Comprehensive pre-DoD audit for a specific milestone (or current milestone if not specified).
Runs all compliance checks, scores RULES_PASS%, writes `docs/AUDIT_LOG.md`.
Outputs clear READY FOR DOD or BLOCKERS FOUND verdict.

## Primary Agent
**PROJECT-AUDIT-AGENT 🔍** — invokes multiple compliance skills.

## Steps

1. **Identify target milestone:**
   - If `M<n>` provided: audit against that milestone's DoD requirements
   - If omitted: read `CLAUDE.md` CURRENT_PHASE to determine active milestone

2. **Invoke `project_audit` skill** — all 8 audit areas:
   - Mock GeoJSON validity (bbox within Cape Town)
   - Badge coverage (Rule 1 — all data components)
   - RLS coverage (Rule 4 — all tenant tables)
   - POPIA annotation coverage (Rule 5 — all PII files)
   - No hardcoded secrets (Rule 3 — grep for api_key, token, password patterns)
   - File size check (Rule 7 — no source file > 300 lines)
   - Dependency health (`npm audit`, `pip check`)
   - Docker container status (`docker compose ps`)

3. **Invoke `source_badge_lint`** — detailed badge scan with file:line violations.

4. **Invoke `fallback_verify`** — three-tier fallback status per API route.

5. **Invoke `schema_smells`** — PostGIS table quality check.

6. **Invoke `a11y_check`** — WCAG 2.1 AA quick scan.

7. **Score audit:**
   ```
   RULES_PASS% = (checks_passed / total_checks) * 100
   ```
   - ≥ 90% → READY FOR DOD
   - < 90% → BLOCKERS FOUND

8. **Write to `docs/AUDIT_LOG.md`:**
   ```
   ## Milestone M<n> Audit — YYYY-MM-DD
   RULES_PASS%: N%
   [Full results table]
   [Blocker list with remediation]
   ```

9. **Output final verdict:**
   ```
   ✅ READY FOR DOD — M<n> audit passed (N%). Human may sign off.
   OR
   ❌ BLOCKERS FOUND — M<n> audit failed. Fix before DoD:
     1. [Blocker description + file:line]
     2. ...
   ```

## MCP Servers Used
- `filesystem` — read all source files, write audit log
- `postgres` — check RLS and schema quality
- `doc-state` — write lock for AUDIT_LOG.md update

## Success Criteria
- All 8 audit areas checked
- RULES_PASS% calculated
- `docs/AUDIT_LOG.md` updated
- Clear READY FOR DOD or BLOCKERS FOUND verdict

## Usage Example
```bash
# Audit current milestone
/milestone-audit

# Audit specific milestone
/milestone-audit M17
```

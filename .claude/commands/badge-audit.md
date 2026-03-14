<!--
/badge-audit — Source Badge Compliance Audit
Priority: P0
Primary Agent: BADGE-AUDIT-AGENT
Skill: source_badge_lint
-->

## Trigger
`/badge-audit [--fix] [--ci] [--path <dir>]`

## Purpose
Scan all data-fetching components for the mandatory `[SOURCE · YEAR · STATUS]` badge required by
CLAUDE.md Rule 1. Produces a COMPONENT|STATUS|FILE:LINE violation table. Non-zero exit in CI mode.

## Primary Agent
**BADGE-AUDIT-AGENT 🏷️** — invokes `source_badge_lint` skill.

## Steps

1. **Invoke `source_badge_lint` skill** against:
   - `src/components/**/*.tsx` (default)
   - `src/app/**/*.tsx` and `src/app/**/*.ts`
   - If `--path <dir>` provided: limit scan to that directory

2. **Detect data-fetch patterns** per file:
   - `fetch(`, `supabase.`, `useLiveData`, `useQuery`, `useSWR`, `getServerSideProps`

3. **Check for SourceBadge** (unconditional render, not hover-only):
   - `import.*SourceBadge` + `<SourceBadge` JSX usage
   - Inline badge: `[SOURCE` + `YEAR` pattern in JSX

4. **Output violation table:**
   ```
   COMPONENT | STATUS | FILE:LINE | DATA PATTERN
   ```

5. **If `--fix` flag provided:**
   - For each FAIL component, insert `<SourceBadge source="TODO" year={0} status="MOCK" />`
   - as a placeholder near the data-fetch call (developer must fill in actual values)
   - Prefix inserted placeholder with `// BADGE-TODO: update source, year, and status`

6. **Append to `docs/COMPLIANCE_LOG.md`:**
   ```
   ## Badge Audit — YYYY-MM-DD HH:MM
   Scanned: N files | Pass: K | Fail: M | Warn: W
   [violation table]
   ```

7. **If `--ci` flag:** Exit non-zero on any FAIL.

## MCP Servers Used
- `filesystem` — read source files, write COMPLIANCE_LOG.md
- `doc-state` — acquire write lock before COMPLIANCE_LOG.md update

## Success Criteria
- All components with data-fetch patterns have unconditional SourceBadge
- `docs/COMPLIANCE_LOG.md` updated with timestamped results
- Zero FAIL in `--ci` mode (non-zero exit otherwise)
- WARN cases documented for human review

## Usage Example
```bash
# Full scan with report
/badge-audit

# Fix mode — inserts placeholder badges
/badge-audit --fix

# CI mode — non-zero exit on violations
/badge-audit --ci

# Scan only analysis components
/badge-audit --path src/components/analysis
```

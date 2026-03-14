<!--
/perf-audit — Core Web Vitals & Performance Audit
Priority: P2
Primary Agent: PERFORMANCE-AGENT
Skills: cwv_monitor, a11y_check
-->

## Trigger
`/perf-audit [--url <url>] [--skip-a11y] [--update-baseline]`

## Purpose
Run Lighthouse CWV measurement + axe-core accessibility check against the app.
Compare against `docs/performance/cwv-baseline.md`. Flag regressions > 20%.
Combined performance + accessibility audit in a single command.

## Primary Agent
**PERFORMANCE-AGENT ⚡** — invokes `cwv_monitor` and `a11y_check` skills.

## Steps

1. **Determine target URL:**
   - If `--url <url>` provided: use that
   - Default: `http://localhost:3000`

2. **Invoke `cwv_monitor` skill:**
   - Fast 3G throttling
   - Measure LCP, INP, CLS, tile render time
   - Compare against baseline
   - Budgets: LCP ≤ 2.5s, INP ≤ 200ms, CLS ≤ 0.1, tile ≤ 1.5s

3. **Invoke `a11y_check` skill** (unless `--skip-a11y`):
   - Dark-mode contrast check (4.5:1 normal, 3:1 large text)
   - MapLibre canvas aria-label verification
   - WCAG 2.1 AA ruleset via axe-core

4. **Combine results into unified report:**
   - CWV metrics table
   - A11y violations table (if not skipped)
   - Overall: PASS / PARTIAL / FAIL

5. **If `--update-baseline`:**
   If all CWV budgets met: overwrite `docs/performance/cwv-baseline.md` with current values.

6. **Write to `docs/performance/perf-audit-<date>.md`.**

7. **Exit status:**
   - Non-zero if any budget exceeded OR any CRITICAL/SERIOUS a11y violation

## MCP Servers Used
- `playwright` — Lighthouse + axe-core browser automation
- `filesystem` — read/write performance docs
- `chrome-devtools` — alternative CWV measurement

## Success Criteria
- LCP ≤ 2.5s, INP ≤ 200ms, CLS ≤ 0.1 (Fast 3G)
- Tile render ≤ 1.5s
- Zero CRITICAL or SERIOUS a11y violations
- No regression > 20% vs baseline
- Report written to `docs/performance/`

## Usage Example
```bash
/perf-audit
/perf-audit --url https://staging.capegis.io
/perf-audit --skip-a11y
/perf-audit --update-baseline
```

---
name: cwv_monitor
description: >
  Run Playwright Lighthouse against a target URL and measure Core Web Vitals.
  Budgets: LCP ≤ 2.5s, INP ≤ 200ms, CLS ≤ 0.1, tile render ≤ 1.5s (Fast 3G).
  Compares against docs/performance/cwv-baseline.md and flags regressions > 20%.
__generated_by: self-evolve-pass-2026-03-14
__timestamp: "2026-03-14T00:00:00Z"
---

## Purpose

Monitor Core Web Vitals and map performance to catch regressions before production.
The Cape Town GIS Hub serves both desktop and mobile users on potentially slow connections.
Fast 3G simulation is the reference condition. Tile render budget is critical for map UX.

## Trigger Conditions

- `/perf-audit [--url <url>]` command invocation
- Post-merge of any map layer or data component change
- Pre-milestone DoD check (M15 production hardening)
- PERFORMANCE-AGENT activation

## Procedure

1. **Launch Playwright browser** with Fast 3G network throttling.
   Target URL: `$NEXT_PUBLIC_URL` or `http://localhost:3000` (default).

2. **Run Lighthouse programmatically** via Playwright:
   ```javascript
   const result = await lighthouse(url, { onlyCategories: ['performance'] });
   ```
   Extract: LCP, INP (or TBT as proxy), CLS, FCP, TTFB.

3. **Measure tile render time:**
   - Navigate to map view at zoom 11 (Cape Town centre)
   - Listen for `map.on('idle')` event
   - Time from navigation start to `idle` = tile render budget
   - Target: ≤ 1.5s (Fast 3G)

4. **Check dark-mode contrast** (combined with a11y_check):
   - Background: #0f1117 (near-black)
   - Text: #f1f5f9 (near-white) — ratio ≥ 4.5:1 required (WCAG AA)

5. **Read baseline from `docs/performance/cwv-baseline.md`:**
   - If baseline exists: compare each metric
   - Flag any regression > 20% (e.g., LCP was 1.8s, now > 2.16s = regression)
   - If no baseline: treat current run as baseline

6. **Budgets (absolute):**
   - LCP ≤ 2.5s
   - INP ≤ 200ms (use TBT ≤ 300ms if INP unavailable)
   - CLS ≤ 0.1
   - Tile render ≤ 1.5s (Fast 3G, zoom 11)

7. **Write report** to `docs/performance/cwv-<YYYY-MM-DD>.md`.
   Update `docs/performance/cwv-baseline.md` if this run passes all budgets.

8. **Flag regressions:**
   For each metric > budget OR > 20% regression vs baseline:
   Output: `⚠️ REGRESSION: LCP 3.1s (budget 2.5s, +24% vs baseline)`

## Output Format

```
=== CWV MONITOR REPORT ===
Date: 2026-03-14 | URL: http://localhost:3000 | Throttle: Fast 3G

METRIC        VALUE    BUDGET   BASELINE   DELTA    STATUS
LCP           2.1s     ≤2.5s    1.9s       +10.5%   ✅ PASS
INP           145ms    ≤200ms   130ms      +11.5%   ✅ PASS
CLS           0.05     ≤0.1     0.04       +25%     ⚠️ WATCH (>20% but under budget)
Tile Render   1.3s     ≤1.5s    1.1s       +18.2%   ✅ PASS

SUMMARY: All budgets met. CLS watch (regression > 20% — under budget).
Report: docs/performance/cwv-2026-03-14.md
```

## When NOT to Use

- Against production URL during peak hours (use staging/localhost)
- In CI on every commit (expensive) — use on PR merge or nightly
- When network connectivity is unreliable (results will be inconsistent)
- For accessibility-only checks — use `a11y_check` skill instead

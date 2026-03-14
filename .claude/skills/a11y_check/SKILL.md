---
name: a11y_check
description: >
  Run axe-core via Playwright against the app to verify WCAG 2.1 AA compliance.
  Checks dark-mode contrast ratios, MapLibre aria-label, interactive element focus.
  Writes violations to docs/accessibility/. CI fails on CRITICAL or SERIOUS violation.
__generated_by: self-evolve-pass-2026-03-14
__timestamp: "2026-03-14T00:00:00Z"
---

## Purpose

Ensure the CapeTown GIS Hub meets WCAG 2.1 AA accessibility standards, especially in
dark-mode where contrast issues are common. MapLibre canvas elements need explicit
aria-label attributes. Test both authenticated and guest user views.

## Trigger Conditions

- `/perf-audit` command (combined run with cwv_monitor)
- `/milestone-audit` compliance check
- After any UI component changes (components owned by UI-UX-DESIGNER)
- PERFORMANCE-AGENT or COMPLIANCE-AGENT activation

## Procedure

1. **Launch Playwright browser** in dark mode (prefers-color-scheme: dark).
   Navigate to app URL (localhost:3000 or staging).

2. **Inject axe-core** into the page:
   ```javascript
   await page.addScriptTag({ url: 'https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.x/axe.min.js' });
   const results = await page.evaluate(() => axe.run({ runOnly: ['wcag2a', 'wcag2aa'] }));
   ```

3. **Run WCAG 2.1 AA ruleset** — key rules:
   - `color-contrast` — minimum 4.5:1 for normal text, 3:1 for large text
   - `label` — all form inputs have labels
   - `button-name` — buttons have accessible names
   - `image-alt` — images have alt text
   - `focus-order-semantics` — logical tab order
   - `aria-required-attr` — ARIA attributes complete

4. **Check dark-mode contrast specifically:**
   - Background: `#0f1117` (near-black from Tailwind config)
   - Primary text: must achieve ≥ 4.5:1 ratio
   - Secondary text / labels: must achieve ≥ 3:1
   - Report any contrast failure with exact ratio

5. **Verify MapLibre canvas element:**
   - `document.querySelector('canvas')` must have `aria-label` attribute
   - Value should describe the map content: e.g., "Cape Town GIS map"
   - Keyboard navigation alternative for map interactions

6. **Test both views:**
   - Guest view (no auth) — map + suburb overlays only
   - Authenticated view — full dashboard

7. **Classify violations:**
   - `CRITICAL` — prevents access (e.g., no keyboard nav, missing form labels)
   - `SERIOUS` — significant barrier (e.g., low contrast, missing ARIA)
   - `MODERATE` — minor barrier (e.g., heading order)
   - `MINOR` — best practice (e.g., landmark regions)

8. **Write report** to `docs/accessibility/a11y-<YYYY-MM-DD>.md`.

9. **CI mode:** Exit non-zero on any CRITICAL or SERIOUS violation.

## Output Format

```
=== A11Y CHECK REPORT ===
Date: 2026-03-14 | URL: http://localhost:3000 | Mode: dark

RULE                  IMPACT    COUNT  ELEMENT
color-contrast        SERIOUS   2      .text-gray-400 (ratio: 2.8:1 vs 4.5:1 required)
button-name           CRITICAL  1      <button class="layer-toggle">
canvas aria-label     SERIOUS   0      ✅ present: "Cape Town GIS map"
label (forms)         PASS      —      ✅

SUMMARY: 1 CRITICAL, 2 SERIOUS — CI FAIL.
Fix critical button-name before merge. Update gray-400 text colours for contrast.
Report: docs/accessibility/a11y-2026-03-14.md
```

## When NOT to Use

- For purely data-layer logic (no UI components)
- On server-only API routes (no DOM to scan)
- As a substitute for manual screen reader testing (always do both)

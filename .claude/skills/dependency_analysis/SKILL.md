---
name: dependency_analysis
description: >
  Run npm outdated and npm audit --json to produce a CRITICAL/HIGH/MEDIUM/LOW
  risk table. Cross-reference all packages against CLAUDE.md §2 approved stack.
  Flag unapproved libraries and write report to docs/architecture/DEPENDENCY_REPORT.md.
__generated_by: aris-unit-6
__timestamp: "2026-03-14T00:00:00Z"
---

## Purpose

Executes `npm audit` and `npm outdated` to gather dependency health data.
Cross-references all direct dependencies against the CLAUDE.md §2 approved
technology stack. Produces a structured risk table and list of unapproved
packages for human review before any upgrade or addition is approved.

## Trigger Conditions

- `/analyze-repo` command (dependency health is one of 4 checks)
- DEPENDENCY-AUDITOR session invocation
- Before milestone DoD sign-off (PROJECT-AUDIT-AGENT integration)
- When a new package is proposed for installation
- Monthly ARIS self-evolution health cycle

## Procedure

1. **Read `package.json`:** extract `dependencies` and `devDependencies` with versions.
   Record total direct dependency count.

2. **Cross-reference against CLAUDE.md §2 approved list:**
   Approved direct deps: Next.js 15, React 19, MapLibre GL JS, Zustand, Tailwind CSS,
   Recharts, Serwist, Dexie.js, PMTiles, Turf.js, Supabase JS 2.
   Approved dev deps: Vitest 3, Playwright 1, TypeScript, ESLint, PostCSS.
   Transitive deps of approved packages are acceptable.

3. **Flag unapproved direct dependencies:**
   Any direct dep NOT in the approved list → `⚠️ UNAPPROVED`
   Cite: "CLAUDE.md §2: Do not introduce unlisted libraries without human approval."

4. **Run `npm outdated --json`** (read-only):
   Parse output — extract `current`, `wanted`, `latest` for each outdated package.
   Classify update type: `patch` (safe), `minor` (review), `major` (breaking-risk).

5. **Run `npm audit --json`** (read-only):
   Parse `vulnerabilities` array — extract: name, severity, cve, via[], fixAvailable.
   Classify: CRITICAL (immediate), HIGH (this sprint), MEDIUM (next sprint), LOW (backlog).

6. **Build risk table:** sort by severity (CRITICAL first):
   `PACKAGE | SEVERITY | CVE | UPDATE_TO | FIX_AVAILABLE | UNAPPROVED`

7. **Check for supply-chain anomalies:** packages in package-lock.json not in
   package.json `dependencies` or `devDependencies` at > 1 level deep with unusual
   names (typosquatting patterns: `maplibre-g1`, `supabase-js2`, etc.).

8. **Write report to `docs/architecture/DEPENDENCY_REPORT.md`** with timestamp.
   Diff against previous report if file exists (show new CVEs since last audit).

## Output Format

```
=== DEPENDENCY ANALYSIS REPORT ===
Date: 2026-03-14 | Repo: CapeTown GIS Hub | Audited: 42 direct deps

RISK SUMMARY
CRITICAL: 0 | HIGH: 1 | MEDIUM: 3 | LOW: 7 | UNAPPROVED: 0

VULNERABILITIES
PACKAGE          SEVERITY  CVE              UPDATE_TO  FIX_AVAILABLE
some-dep         HIGH      CVE-2024-12345   2.1.0      ✅ yes

OUTDATED PACKAGES
PACKAGE          CURRENT   LATEST   TYPE
next             15.0.0    15.1.0   patch (safe)
maplibre-gl      4.0.0     4.2.0    minor (review)

UNAPPROVED PACKAGES: None ✅

REPORT: docs/architecture/DEPENDENCY_REPORT.md
```

## When NOT to Use

- When auditing a single package — use `npm info <pkg>` directly
- In read-only environments where npm is unavailable (read package-lock.json directly)
- During an active development task (run at session start to avoid overhead)

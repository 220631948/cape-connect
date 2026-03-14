---
name: stack_detect
description: >
  Read package.json, tsconfig.json, and docker-compose.yml to output a structured
  tech-stack report with all dependency versions, flagging any unapproved libraries
  per CLAUDE.md §2 approved stack.
__generated_by: aris-unit-2
__timestamp: "2026-03-14T00:00:00Z"
---

## Purpose

Reads `package.json` (dependencies + devDependencies), `tsconfig.json` (compiler options,
path aliases), and `docker-compose.yml` (services, images, ports) to produce a structured
tech-stack report. Flags any library not listed in CLAUDE.md §2 approved stack as
`⚠️ UNAPPROVED — requires human sign-off per CLAUDE.md Rule`.

## Trigger Conditions

- `/analyze-repo` command invocation
- REPO-ARCHITECT session start
- Before any `npm install` of a new package
- After a developer proposes adding an unapproved library
- Monthly ARIS self-evolution health check

## Procedure

1. **Read `package.json`** — extract all `dependencies` and `devDependencies` with exact versions.

2. **Cross-reference against CLAUDE.md §2 approved stack:**
   Approved list: Next.js 15, React 19, MapLibre GL JS, Zustand, Tailwind CSS, Recharts,
   Serwist, Dexie.js, PMTiles, Turf.js, Supabase JS 2, Vitest 3, Playwright 1.
   Transitive dependencies of approved packages are acceptable.

3. **Flag unapproved direct dependencies** with `⚠️ UNAPPROVED` status and cite
   CLAUDE.md Rule: "Do not introduce unlisted libraries without human approval."

4. **Read `tsconfig.json`** — extract `compilerOptions` (strict, target, module),
   `paths` (import aliases), `include`/`exclude` patterns.

5. **Read `docker-compose.yml`** — extract service names, Docker images with tags,
   port mappings, and volume mounts relevant to the GIS stack
   (PostGIS, Martin tile server).

6. **Compile output table:**
   `PACKAGE | VERSION | STATUS | CLAUDE.md REFERENCE`
   Statuses: `✅ APPROVED`, `⚠️ UNAPPROVED`, `⚠️ VERSION_MISMATCH`

7. **Write summary to `docs/architecture/STACK_REPORT.md`** (create if absent),
   append timestamp and diff from previous report if file exists.

## Output Format

```
=== STACK DETECT REPORT ===
Date: 2026-03-14 | Repo: CapeTown GIS Hub

PACKAGE               VERSION    STATUS           CLAUDE.md REF
next                  15.x.x     ✅ APPROVED       §2 Frontend
react                 19.x.x     ✅ APPROVED       §2 Frontend
maplibre-gl           4.x.x      ✅ APPROVED       §2 Mapping
some-new-lib          1.0.0      ⚠️ UNAPPROVED     —

TSCONFIG: strict ✅ | target: ES2022 | paths: @/*→src/*
DOCKER: postgis:15-3.4 ✅ | martin:latest ✅

UNAPPROVED COUNT: 0 | VERSION MISMATCHES: 0
REPORT: docs/architecture/STACK_REPORT.md
```

## When NOT to Use

- During active coding sessions (run at session start only to avoid overhead)
- When `package.json` has not changed since the last run
- For checking a single package (use `npm info <pkg>` directly)

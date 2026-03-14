---
name: stack_detect
description: >
  Reads package.json, tsconfig.json, and config files to produce a structured
  tech-stack report with versions and dependency risk flags. Classifies
  dependencies as CORE / DEV / GIS / INFRA and flags unstable version pins.
__generated_by: REPO-ARCHITECT [aris-unit-2]
__timestamp: "2026-03-14T00:00:00Z"
---

## Purpose

Identify the exact technology stack, versions, and key dependencies in the
repository — used by REPO-ARCHITECT and DEPENDENCY-AUDITOR as baseline context
before milestone kickoff, agent onboarding, or architectural review.

## Trigger Conditions

- Before milestone kickoff analysis (run alongside `mcp_health_check`)
- When onboarding a new agent that needs stack awareness
- When asked to explain the project's technology choices
- When `stack_detect` is listed under SKILLS TO INVOKE in an agent definition

## Procedure

1. **Read `package.json`** — extract `dependencies` and `devDependencies` with
   exact version ranges. Note any `resolutions` or `overrides` entries.

2. **Read `tsconfig.json`** — note `strict` flags, `paths` aliases, `target`
   ES version, `moduleResolution` mode, and `include`/`exclude` patterns.

3. **Check for runtime version files:**
   - `docker-compose.yml` — extract service image versions (Node, PostGIS, Martin)
   - `.nvmrc` or `.node-version` — extract pinned Node version
   - `Dockerfile` — extract base image and Node version if present

4. **Classify each dependency** into one of four categories:
   - `CORE` — runtime dependency required in production (`dependencies`)
   - `DEV` — build or test only (`devDependencies`)
   - `GIS` — geospatial library (e.g., MapLibre, Turf.js, PMTiles, PostGIS client)
   - `INFRA` — deployment/infrastructure (e.g., Serwist, Docker images)

5. **Flag unstable pins:** Any dependency with version `*`, `latest`, or a
   range wider than `^major.minor` is flagged `UNSTABLE`.

6. **Cross-check against CLAUDE.md §2 (Technology Stack):** Flag any dependency
   present in `package.json` but not listed in CLAUDE.md as `UNLISTED — requires
   human approval (CLAUDE.md Rule: no new libraries without approval)`.

7. **Output a structured table:**
   ```
   PACKAGE | VERSION | CATEGORY | NOTES
   ```
   Then write a one-paragraph plain-English summary covering: framework,
   mapping library, database, hosting target, and any risk flags found.

## Output Format

Markdown table + one-paragraph summary. Optionally write the full report to
`docs/architecture/stack-report.md` when invoked with `--write` flag or when
REPO-ARCHITECT requests a persistent artefact.

Example table excerpt:
```
| PACKAGE          | VERSION   | CATEGORY | NOTES               |
|------------------|-----------|----------|---------------------|
| next             | ^15.0.0   | CORE     | App Router required |
| maplibre-gl      | ^4.0.0    | GIS      | NOT Leaflet/Mapbox  |
| @supabase/ssr    | ^0.5.0    | CORE     |                     |
| turf             | ^6.5.0    | GIS      |                     |
| tailwindcss      | ^3.4.0    | DEV      |                     |
| serwist          | ^9.0.0    | INFRA    |                     |
| some-new-lib     | latest    | CORE     | ⚠️ UNSTABLE pin     |
```

## When NOT to Use

- Inside a tight coding loop where stack context is already established
- When the stack has not changed since the last `stack_detect` report (check
  `docs/architecture/stack-report.md` timestamp before re-running)

# PLAN.md — Project Analysis & Remediation Roadmap

Date: 2026-03-14
Author: Claude Code (sequential fallback)

Executive summary

This plan consolidates the Project Analysis outputs and prescribes a prioritized, low-risk path to restore a working canonical repository, reinstate CI, and harden the service for production (M17). The highest-severity issues are: (1) the canonical app and CI workflows live inside `.claude/worktrees/` instead of repo root, leaving the root repo unbuildable; (2) server-side code uses the public Supabase anon key for privileged flows; (3) missing input validation across API routes; (4) Docker/dev infra uses unpinned images and exposes host surfaces (PostGIS / docker.sock).

Objectives

1. Restore a functional canonical codebase at repository root so local builds, CI, and PRs work. (P0)
2. Re-enable CI and migration verification so regressions and RLS/CRS violations are caught. (P0)
3. Improve server-side security (remove anon key from server privileged paths, harden SECURITY DEFINER functions). (P0)
4. Add input validation (zod) to mutation API routes. (P0)
5. Harden dev infra (pin images, restrict PostGIS bind, remove docker.sock). (P1)
6. Improve testing posture (migration checks, contract tests, basic Playwright e2e). (P1)

Work units (decomposed)

The work is split into independent units that can be implemented in isolated worktrees and merged independently.

WU-1 — Repository consolidation
- Files/directories: copy from `.claude/worktrees/agent-a3419dcd/` → root: `src/`, `package.json`, `tsconfig.json`, `next.config.ts`, `vitest.config.ts`, `Dockerfile`, `.env.example`, `supabase/migrations/`, `.github/workflows/`
- Description: Move canonical source + configs to repository root so builds and CI run.
- Effort: L | Risk: HIGH
- Acceptance: `npm install && npm run build` succeed at root; GitHub repo triggers CI after pushing workflows.

WU-2 — CI pipeline enablement & migration checks
- Files: `.github/workflows/ci.yml`, `.github/workflows/*.yml`, new CI helpers under `.github/ci/`
- Description: Move workflows to root, enable migration verification job that spins up PostGIS container and runs migrations, remove `|| true` masking.
- Effort: M | Risk: MED
- Acceptance: CI fails on RLS/CRS violations; migration job runs in CI matrix.

WU-3 — Supabase auth & server secrets hardening
- Files: `src/lib/supabase/server.ts`, `src/middleware.ts`, environment docs `.env.example`, CI secrets config
- Description: Migrate from NEXT_PUBLIC_SUPABASE_ANON_KEY for server-side privileged operations to `SUPABASE_SERVICE_ROLE_KEY` stored in secrets manager; or migrate to `@supabase/ssr`.
- Effort: M | Risk: MED
- Acceptance: grep shows no server-side use of NEXT_PUBLIC_SUPABASE_ANON_KEY for admin flows; tests for admin endpoints pass with service key.

WU-4 — API input validation
- Files: `src/app/api/**/route.ts` (all mutation routes, ~22 files), add `src/lib/validation/*`
- Description: Add zod schemas and parse all request bodies; return 400 for invalid payloads.
- Effort: M | Risk: LOW
- Acceptance: Invalid payloads return 400; unit tests assert schema enforcement.

WU-5 — Dependency & packaging fixes
- Files: `package.json`, `docker-compose.yml`, `.github/dependabot.yml`
- Description: Replace deprecated packages (`@supabase/auth-helpers-nextjs` → `@supabase/ssr`), remove unused packages (e.g., zustand if unused), pin docker images (martin, localstack, postgis), add Dependabot.
- Effort: M | Risk: MED
- Acceptance: No deprecated imports; docker-compose uses pinned tags; Dependabot creates PRs.

WU-6 — Dev infra hardening
- Files: `docker-compose.yml`, `Dockerfile`
- Description: Bind PostGIS to 127.0.0.1 for dev, remove docker.sock mount from LocalStack, pin images, optimize Dockerfile (npm ci --production in runner stage), reduce capabilities.
- Effort: S | Risk: LOW
- Acceptance: docker-compose up for local dev does not expose 5432 publicly; LocalStack runs without docker.sock.

WU-7 — Database constraints & spatial validation
- Files: `supabase/migrations/` (new migration to add ST_IsValid checks), CI migration job
- Description: Add ST_IsValid geometry CHECK constraints and tests to detect invalid geometries; align local Postgres version with hosted Supabase (or run migration matrix).
- Effort: S | Risk: LOW
- Acceptance: Migrations apply cleanly; invalid geometries rejected; CI runs migrations successfully.

WU-8 — Tests & e2e
- Files: `vitest.config.ts`, `tests/`, `.github/workflows/ci.yml` updates
- Description: Add contract tests for API routes, migration verification job, and a minimal Playwright suite covering login, map load, 3D toggle.
- Effort: L | Risk: MED
- Acceptance: CI runs unit tests, contract tests, and a Playwright smoke test in a separate job (can be optional in PRs and required in main branch merges).

WU-9 — Security audits & POPIA compliance
- Files: `supabase/migrations/*` comments, `docs/POPIA.md`, security review checklist in repo
- Description: Add search_path to SECURITY DEFINER functions, rotate impersonation token keys into secrets manager, add POPIA annotations review and remediation roadmap.
- Effort: M | Risk: LOW
- Acceptance: SECURITY DEFINER functions include search_path; POPIA annotations present and documented.

E2E test recipe (canonical)

Workers should use this recipe to verify changes end-to-end where applicable:
1. Setup env: copy `.env.example` → `.env.local` and populate necessary keys (local Postgres connection, optional SUPABASE_SERVICE_ROLE_KEY masked).
2. Start local infra:
   - docker compose up -d db martin localstack
   - npm ci
   - npm run dev (or `node ./scripts/start-local.js` if present)
3. Run migrations and seed (in a disposable database):
   - psql -h 127.0.0.1 -p 5432 -U postgres -f supabase/migrations/*.sql
4. Run unit tests:
   - npm test (vitest)
5. Run smoke API checks:
   - curl -sS -X POST http://localhost:3000/api/admin/assign-role -d '{"userId":"..."}' -H 'Content-Type: application/json' and verify response codes (400 for invalid payload), and 403 for unauthorized if impersonation not set.
6. Optional: Run Playwright smoke test to load dashboard and toggle 3D mode. Use `npx playwright test --project=chromium --grep @smoke`.

If the worker cannot run e2e (e.g., secrets or infra missing), run at minimum unit & contract tests and report skipped e2e.

Worker instructions (template)

After implementing the change, the worker must:
1. Run `npm ci` and `npm test` and fix failing tests.
2. Run the e2e recipe (or follow the documented skip path) and note any deviations.
3. Run `Skill` simplify (if available) to clean code.
4. Commit changes on a feature branch named `infra-fix/<short-desc>` or `wu-<n>-<short-desc>`.
5. Push branch and create PR with `gh pr create` including this plan link and checklist.
6. End your worker report with a single line: `PR: <url>` or `PR: none — <reason>`.

Acceptance criteria (project-level)

- Repository root builds and CI runs on PRs.
- Critical security issues (server anon key misuse, open PostGIS binding, docker.sock) resolved or documented mitigations present.
- Migrations run in CI and do not mask failures; RLS/CRS checks fail CI on violations.
- API mutation routes validate input and return 400 on schema mismatch.
- Tests added for migrations and at least two critical API contracts.

Rollback strategy

- Each WU produces its own branch and PR. If a PR causes regressions, revert the PR and create a follow-up that mitigates without broad changes.
- For infra changes (docker-compose), retain prior version as `docker-compose.prev.yml` and use feature flags to gate risky behavior.

Files created by coordinator

- .claude/changes/analysis_01_frontend.md — frontend analysis
- .claude/changes/analysis_02_repository.md — repository & worktree analysis
- .claude/changes/analysis_03_services_api.md — services & API
- .claude/changes/analysis_04_backend.md — backend & DB
- .claude/changes/analysis_05_devops.md — devops & infra
- .claude/changes/analysis_06_security.md — security
- .claude/changes/analysis_07_spatial_data.md — spatial data
- .claude/changes/analysis_08_testing.md — testing & CI
- .claude/changes/analysis_09_dependencies.md — dependencies & packaging

Next steps performed (sequential fallback)

- Created analysis files above and prioritized recommendations.
- If agent orchestration is required, re-attempting parallel workers may fail due to quota constraints observed earlier. The safe path is to continue sequentially implementing high-priority WUs and opening one PR at a time.

This PLAN.md is ready to be used as the basis for the implementation phase.

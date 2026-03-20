# chkpt-0001 — Impersonation Plan

## Scope
Implement secure admin "Login As" impersonation with tenant-scoped rules:
- `TENANT_ADMIN`: impersonate users within same tenant only.
- `PLATFORM_ADMIN`: impersonate `TENANT_ADMIN` and lower roles across tenants.

## Files inspected (targeted)
- `PROJECT_STATE.md`
- `AGENTS.md`, `.claude/AGENTS.md`, `.gemini/AGENTS.md`, `.github/AGENTS.md`
- `PLAN.md`
- `docs/RBAC_MATRIX.md`
- `docs/specs/11-multitenant-architecture.md`
- `docs/specs/10-popia-compliance.md`
- `docs/API_STATUS.md`
- `src/middleware.ts`
- `src/app/api/admin/{users,invite,audit,tenant,assign-role}/route.ts`
- `src/components/DashboardScreen.tsx`
- `src/components/dashboard/DashboardHeader.tsx`
- `src/components/admin/{UserManagementPanel,UsersTab,InvitesTab,AuditTab}.tsx`
- `supabase/migrations/{20250227140000_initial_schema.sql,20260313100000_user_management.sql,20260310000000_seed_data.sql}`
- `FILE_INDEX.json`

## Token footprint (estimated)
- Current planning/index artifacts suggest ~4.8k tokens already loaded this session baseline.
- Additional targeted reads in this checkpoint pass: ~18k–24k tokens (estimated from `wc -c` and line slices; avoids full-repo load).
- High-volume file guarded: `docs/INDEX.md` (53,187 bytes) sampled, not fully loaded.

## Design decisions
1. Add `impersonation_sessions` DB table with lifecycle fields (`started_at`, `ended_at`, `active`, `expires_at`, `jti`) and audit linkage.
2. Issue short-lived impersonation JWT (15 minutes) with claims:
   `sub`, `impersonated_by`, `impersonator_role`, `is_impersonation`, `tenant_id`, `jti`, `iat`, `exp`.
3. Add endpoints:
   - `POST /api/admin/impersonate`
   - `POST /api/admin/stop-impersonation`
   - `GET /api/admin/impersonation-state`
4. Enforce server-side authorization + reauthentication (password required; MFA input supported when enabled).
5. Extend middleware request context with impersonation headers.
6. Add admin UI controls (impersonate button + modal) and persistent banner with stop action.
7. Add tests for authz matrix, token claims/expiry, and start→act→stop flow.

## Instinct Guard pre-flight
1. Geographic scope ✓
2. No Lightstone ✓
3. File size guard ✓ (new source files planned < 300 lines; migrations/checkpoints exempt)
4. No hardcoded credentials ✓
5. RLS for new DB table ✓ planned
6. POPIA annotation ✓ for personal-data-touching files
7. Source badge impact ✓ N/A for impersonation control surfaces
8. Three-tier fallback ✓ unaffected

## Open assumptions
- Existing role column contains mixed representations (`admin` and enum-style uppercase); normalization layer required.
- Existing login route is mock UI; impersonation tests will rely on API/unit mocks rather than full real-idp E2E in CI.

## Execution summary
- Implemented DB/API/UI/middleware/test changes for impersonation (see `PROJECT_STATE.md` for full list).
- Added route-level and library-level tests:
  - `src/app/api/admin/__tests__/impersonation-routes.test.ts`
  - `src/app/api/admin/__tests__/users-route-impersonation.test.ts`
  - `src/lib/auth/__tests__/roles.test.ts`
  - `src/lib/auth/__tests__/impersonation-token.test.ts`

## Command results
- `npm run typecheck` ✅
- `npx vitest run ...impersonation*...` ✅ (13/13 passing)
- `npm run build` ✅ (full production build completed successfully)
- `npm test` ⚠️ failed from unrelated pre-existing `.gemini/extensions/*` tests.
- `npm run lint` ⚠️ interactive ESLint bootstrap prompt (non-automatable without committing new ESLint config).

## Browser verification status
- Attempted to start local app for browser pass (`npm run dev -- --port 3002`) multiple times.
- Dev mode hit recurring filesystem ownership errors under `.next` in this shared environment:
  - `EACCES ... .next/diagnostics/build-diagnostics.json`
  - `EACCES ... .next/server/app-paths-manifest.json`
  - `EACCES ... .next/trace`
- Production fallback succeeded (`npm run start -- --port 3002`), and `curl -I http://localhost:3002` returned `200 OK`.
- Browser automation for `chrome-devtools` remained blocked (`Could not find Google Chrome executable for channel 'stable'`), so verification was executed via `@playwright/test` Chromium.
- Executed impersonation verification scenarios with mocked admin API responses (to isolate UI flow and avoid dependency on external auth test accounts):
  - tenant admin → same-tenant user
  - platform admin → tenant admin (cross-tenant)
  - platform admin → power user (cross-tenant)
- Captured screenshots at required viewports (1920/1280/768/390) for tenant and platform admin scenarios.
- Captured console/page/request logs:
  - `CHECKPOINTS/artifacts/impersonation/console-log.json`
  - `CHECKPOINTS/artifacts/impersonation/page-errors.json`
  - `CHECKPOINTS/artifacts/impersonation/request-failures.json`
  - `CHECKPOINTS/artifacts/impersonation/verification-summary.json`
- Verification notes:
  - page errors: `0`
  - request failures: `0` (after excluding expected aborted navigation fetches)
  - console errors: `4` generic MapLibre style-bootstrap errors in headless mode, not tied to impersonation actions.
- Relevant logs:
  - `/tmp/copilot-detached-9-1773397905538.log`
  - `/tmp/copilot-detached-15-1773398287082.log`
  - `/tmp/copilot-detached-22-1773399537593.log`
  - `/tmp/copilot-detached-44-1773400882552.log`

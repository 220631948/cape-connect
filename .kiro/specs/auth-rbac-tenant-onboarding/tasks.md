# Implementation Plan

<!-- Auth, RBAC & Tenant Onboarding — 14 bugs, 15 correctness properties -->
<!-- Ordering: migrations → lib helpers → hooks → API routes → components → tests -->

---

## Phase 1 — Exploration: Write Bug Condition Tests (BEFORE any fix)

- [ ] 1. Write bug condition exploration tests
  - **Property 1: Bug Condition** — All 14 Bug Conditions (Bugs 1.1–1.14)
  - **CRITICAL**: Write ALL exploration tests BEFORE implementing any fix
  - **GOAL**: Surface counterexamples that confirm each bug exists on unfixed code
  - **EXPECTED OUTCOME**: Each test FAILS on unfixed code — this is correct and expected
  - **DO NOT fix the code when tests fail — document the counterexamples instead**
  - Scoped checks per bug:
    - Bug 1.1: Start Playwright without `webServer` wait; assert first test hits 503 / connection refused
    - Bug 1.2: Seed TENANT_ADMIN, log in, call `profiles.select(*)` — assert row count > 0 → returns `[]`
    - Bug 1.3: Mock `Date.now()` to `expiresAt - 200s`; assert `refreshSession` was called → never called
    - Bug 1.4: Render `DashboardScreen` with VIEWER session; assert `UserManagementPanel` absent → present in DOM
    - Bug 1.5: Navigate to `/dashboard` as GUEST; assert `ExportPanel` not rendered → rendered
    - Bug 1.6: PATCH `/api/admin/users` cross-tenant; assert no DB write before 403 → write may occur first
    - Bug 1.7: POST `/api/admin/tenant`; assert `profiles` has TENANT_ADMIN for new tenant → no profile update
    - Bug 1.8: POST `/api/admin/invite`; assert `delivery_status` column exists and equals `sent` → column absent
    - Bug 1.9: Visit `/invite?token=x` unauthenticated; assert `sessionStorage` has token → token discarded
    - Bug 1.10: POST accept with expired token; assert HTTP 410 → returns 404
    - Bug 1.11: Accept invite as existing member; assert profile unchanged → profile overwritten
    - Bug 1.12: Submit duplicate invite; assert inline error visible, email field not cleared → silent failure
    - Bug 1.13: Accept invitation; assert `window.location.reload` not called → reload is called
    - Bug 1.14: Mock fetch to fail; assert retry after 3s and warning banner shown → no retry, no banner
  - Document all counterexamples found before proceeding to Phase 2
  - Mark task complete when all 14 exploration tests are written, run, and failures documented
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 1.10, 1.11, 1.12, 1.13, 1.14_


---

## Phase 2 — Preservation: Write Baseline Tests (BEFORE any fix)

- [ ] 2. Write preservation property tests (BEFORE implementing any fix)
  - **Property 2: Preservation** — All Non-Buggy Auth, RBAC, and Invitation Flows (Req 3.1–3.12)
  - **IMPORTANT**: Follow observation-first methodology — run unfixed code with non-buggy inputs first
  - Observe and record actual outputs for each preservation requirement:
    - Req 3.1: Valid email/password login → session created, redirect to `/dashboard`
    - Req 3.2: Logout → session cookie cleared, redirect to `/login`
    - Req 3.3: Google OAuth callback → flow completes without modification
    - Req 3.4: PLATFORM_ADMIN `GET /api/admin/users` → returns all tenants' users
    - Req 3.5: TENANT_ADMIN `GET /api/admin/users` → returns own tenant users only
    - Req 3.6: `canImpersonate()` → no self, no PLATFORM_ADMIN, no cross-tenant impersonation
    - Req 3.7: Valid non-expired token + matching authenticated user → profile updated, invitation `accepted`
    - Req 3.8: Decline invitation → marked `declined`, user's current membership unchanged
    - Req 3.9: New tenant creation → `tenant_settings` row with `primary_color: '#00D1FF'`
    - Req 3.10: `getTenantConfig()` → returns white-label config or `WHITELABEL_DEFAULTS`
    - Req 3.11: RLS policies enforce tenant isolation on all scoped tables
    - Req 3.12: POPIA annotation blocks present on all personal-data-touching files
  - Write property-based tests capturing observed behavior patterns (use `@fast-check/vitest`)
  - Run all preservation tests on UNFIXED code
  - **EXPECTED OUTCOME**: All preservation tests PASS on unfixed code (confirms baseline)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10, 3.11, 3.12_


---

## Phase 3 — Implementation (ordered by dependency)

### Group A — Database Migrations (must run before any API route changes)

- [ ] 3. Apply database migrations

  - [ ] 3.1 Create `set_tenant_context` RPC migration
    - New file: `supabase/migrations/YYYYMMDD_set_tenant_context_rpc.sql`
    - `CREATE OR REPLACE FUNCTION set_tenant_context(tenant_id uuid) RETURNS void`
    - `LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp`
    - Body: `PERFORM set_config('app.current_tenant', tenant_id::text, true)`
    - Grants: `REVOKE ALL FROM PUBLIC; GRANT EXECUTE TO authenticated`
    - _Bug_Condition: isBugCondition_1_2 — app.current_tenant not set before RLS query_
    - _Expected_Behavior: set_config fires before any RLS-protected .from() call_
    - _Requirements: 2.2_

  - [ ] 3.2 Create `create_tenant_atomic` RPC migration
    - New file: `supabase/migrations/YYYYMMDD_create_tenant_atomic.sql`
    - `CREATE OR REPLACE FUNCTION create_tenant_atomic(p_name text, p_slug text, p_admin_user_id uuid) RETURNS jsonb`
    - `LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp`
    - Body: INSERT tenants → INSERT tenant_settings (primary_color '#00D1FF') → UPDATE profiles SET role='TENANT_ADMIN'
    - All three statements in a single implicit plpgsql transaction — rollback on any failure
    - Grants: `REVOKE ALL FROM PUBLIC; GRANT EXECUTE TO authenticated`
    - _Bug_Condition: isBugCondition_1_7 — tenant created without atomic admin assignment_
    - _Expected_Behavior: tenants row + tenant_settings row + TENANT_ADMIN profile in one transaction_
    - _Preservation: tenant_settings always gets primary_color '#00D1FF' (req 3.9)_
    - _Requirements: 2.7, 3.9_

  - [ ] 3.3 Add `delivery_status` column to `tenant_invitations`
    - New file: `supabase/migrations/YYYYMMDD_invitation_delivery_status.sql`
    - `ALTER TABLE tenant_invitations ADD COLUMN IF NOT EXISTS delivery_status text CHECK (delivery_status IN ('pending', 'sent', 'failed')) DEFAULT 'pending'`
    - Add column comment documenting the three states
    - _Bug_Condition: isBugCondition_1_8 — delivery_status column absent, no audit of email send_
    - _Expected_Behavior: every invitation row has delivery_status set after invite API call_
    - _Requirements: 2.8_


### Group B — Supabase Edge Function (depends on migration 3.3)

- [ ] 4. Create `send-invitation-email` Edge Function

  - [ ] 4.1 Implement Edge Function
    - New file: `supabase/functions/send-invitation-email/index.ts`
    - Receives: `{ invitation_id, email, role, tenant_name, invite_url }`
    - Sends email via Supabase built-in SMTP or configured provider (Resend/SendGrid via env var)
    - Returns `{ success: boolean }`
    - POPIA annotation required (handles email address)
    - _Bug_Condition: isBugCondition_1_8 — no email sent on invitation creation_
    - _Expected_Behavior: email dispatched; delivery_status updated to 'sent' or 'failed'_
    - _Requirements: 2.8_


### Group C — Library Helpers (depends on migration 3.1)

- [ ] 5. Fix `src/lib/supabase/server.ts` — withTenantContext helper
  - Add `withTenantContext(client, tenantId: string)` helper function
  - Calls `client.rpc('set_tenant_context', { tenant_id: tenantId })` immediately
  - Returns the same client after the RPC resolves (caller can chain `.from(...)`)
  - Throws if `tenantId` is null/undefined — never silently skip the SET LOCAL
  - POPIA annotation required (handles user ID / tenant ID)
  - Use `@supabase/ssr` server client; never `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - _Bug_Condition: isBugCondition_1_2 — app.current_tenant not injected before RLS queries_
  - _Expected_Behavior: set_tenant_context RPC fires before any .from() call on the returned client_
  - _Preservation: existing createServerSupabaseClient() callers unaffected (req 3.1, 3.4, 3.5)_
  - _Requirements: 2.2, 3.11_


### Group D — New React Hooks (client-side, no DB dependency)

- [ ] 6. Create `src/hooks/useAuthRefresh.ts`
  - New file: `src/hooks/useAuthRefresh.ts`
  - Subscribe to `supabase.auth.onAuthStateChange` on mount; unsubscribe on unmount
  - `setInterval` every 60s: if `(session.expires_at - Date.now()/1000) < 300` → call `supabase.auth.refreshSession()`
  - On `TOKEN_REFRESHED` event → no-op
  - On refresh failure or `SIGNED_OUT` → show non-blocking toast: "Session expired. Please sign in again."
  - POPIA annotation required (handles user session / JWT)
  - _Bug_Condition: isBugCondition_1_3 — no proactive refresh listener, JWT expires silently_
  - _Expected_Behavior: refreshSession called within 60s when expiresAt - now < 300; toast on failure_
  - _Preservation: valid sessions with expiresAt > 300s away are not disturbed (req 3.1)_
  - _Requirements: 2.3_

- [ ] 7. Create `src/hooks/useSessionRole.ts`
  - New file: `src/hooks/useSessionRole.ts`
  - On mount: call `supabase.auth.getUser()` then `profiles.select('role').eq('id', user.id).single()`
  - Returns `{ role: CanonicalRole, loading: boolean }`
  - Returns `'GUEST'` when no session exists (never throws)
  - Role sourced from `profiles` table — NOT from JWT claims
  - POPIA annotation required (handles user ID, role)
  - _Bug_Condition: isBugCondition_1_4 — admin UI rendered without canonical role check_
  - _Expected_Behavior: canonical role from profiles returned; JWT claims not used for role gate_
  - _Preservation: TENANT_ADMIN and PLATFORM_ADMIN roles correctly identified (req 3.4, 3.5)_
  - _Requirements: 2.4_

- [ ] 8. Create `src/hooks/useInvitations.ts`
  - New file: `src/hooks/useInvitations.ts`
  - State: `invitations`, `fetchError`, `loading`
  - `fetchInvitations(isRetry = false)`: GET `/api/invitations/pending`; on failure if not retry → `setTimeout(fetchInvitations(true), 3000)`; on second failure → `setFetchError("Could not load invitations. Check your connection.")`
  - `acceptInvitation(id)`: optimistic remove from list → POST `/api/invitations/accept` → background `fetchInvitations()` — NEVER calls `window.location.reload()`
  - `declineInvitation(id)`: optimistic remove → POST decline → background `fetchInvitations()`
  - `dismissError()`: clears `fetchError`
  - POPIA annotation required (handles invitation data including email, role)
  - _Bug_Condition: isBugCondition_1_13 — window.location.reload() called on accept/decline_
  - _Bug_Condition: isBugCondition_1_14 — no retry or warning banner on fetch failure_
  - _Expected_Behavior: optimistic update + background re-fetch; retry once after 3s; dismissible banner_
  - _Preservation: decline marks invitation 'declined', membership unchanged (req 3.8)_
  - _Requirements: 2.13, 2.14_


### Group E — New API Route (no dependencies)

- [ ] 9. Create `src/app/api/health/route.ts`
  - New file: `src/app/api/health/route.ts`
  - `GET /api/health` → `200 { status: "ok", timestamp: new Date().toISOString() }`
  - No auth required
  - No personal data — POPIA annotation not required
  - _Bug_Condition: isBugCondition_1_1 — no readiness endpoint; E2E tests start before server ready_
  - _Expected_Behavior: returns 200 { status: "ok" } immediately when Next.js is ready_
  - _Requirements: 2.1_


### Group F — Modified API Routes (depends on migrations 3.1–3.3 and Edge Function 4.1)

- [ ] 10. Fix `src/app/api/admin/users/route.ts` — tenant-mismatch check order (Bug 1.6)
  - PATCH handler: reorder so tenant-mismatch guard fires AFTER fetching targetUser but BEFORE any `assign_user_role` RPC call
  - Fixed order: (1) fetch caller profile → (2) validate role → (3) fetch targetUser → (4) CHECK `caller.tenant_id !== target.tenant_id` → 403 if mismatch → (5) call `assign_user_role` RPC
  - Return `403 { error: "Forbidden: tenant mismatch" }` on cross-tenant attempt
  - Validate request body with Zod schema (existing — verify it covers all PATCH fields)
  - POPIA annotation required (handles user ID, role, tenant ID)
  - _Bug_Condition: isBugCondition_1_6 — DB write fires before tenant-mismatch 403_
  - _Expected_Behavior: assign_user_role RPC call count === 0 when tenant mismatch detected_
  - _Preservation: PLATFORM_ADMIN cross-tenant read unaffected (req 3.4); TENANT_ADMIN own-tenant update unaffected (req 3.5)_
  - _Requirements: 2.6, 3.4, 3.5_

- [ ] 11. Fix `src/app/api/admin/tenant/route.ts` — atomic RPC (Bug 1.7)
  - Replace three sequential `client.from(...)` calls with single `client.rpc('create_tenant_atomic', { name, slug, admin_user_id: session.user.id })`
  - Call `withTenantContext(client, session.user.tenant_id)` before the RPC (task 5)
  - Validate request body with Zod: `{ name: z.string().min(1), slug: z.string().min(1) }`
  - Write audit_log entry for tenant creation (role change event)
  - POPIA annotation required (handles user ID, role)
  - _Bug_Condition: isBugCondition_1_7 — non-atomic creation leaves tenant ownerless_
  - _Expected_Behavior: single RPC call; tenants + tenant_settings + TENANT_ADMIN profile in one transaction_
  - _Preservation: tenant_settings always gets primary_color '#00D1FF' (req 3.9); getTenantConfig() unaffected (req 3.10)_
  - _Requirements: 2.7, 3.9, 3.10_

- [ ] 12. Fix `src/app/api/admin/invite/route.ts` — email dispatch + delivery_status (Bug 1.8)
  - After INSERT `tenant_invitations` (delivery_status = 'pending'), call Edge Function `send-invitation-email`
  - On Edge Function success → `UPDATE tenant_invitations SET delivery_status = 'sent'`
  - On Edge Function failure → `UPDATE tenant_invitations SET delivery_status = 'failed'` (do not surface to caller as error — invitation still created)
  - Response body now includes `delivery_status` field on the invitation object
  - Validate request body with Zod (existing — verify covers email, role, tenant_id)
  - POPIA annotation required (handles email, role, user ID)
  - _Bug_Condition: isBugCondition_1_8 — no email sent; delivery_status not recorded_
  - _Expected_Behavior: Edge Function invoked; delivery_status is 'sent' or 'failed' (never 'pending') after response_
  - _Preservation: invitation row still created even if email fails; token returned in dev mode (req 3.7)_
  - _Requirements: 2.8_

- [ ] 13. Fix `src/app/api/invitations/accept/route.ts` — 410 + existing member guard (Bugs 1.10, 1.11)
  - Split query: (1) fetch invitation by token with NO date filter → 404 if not found
  - (2) if `invitation.expires_at < now` → return `410 { error: "Invitation expired", cta: "Request new invite", invited_by_email }` 
  - (3) fetch current user profile: `SELECT tenant_id FROM profiles WHERE id = session.user.id`
  - (4) if `profile.tenant_id === invitation.tenant_id` → mark invitation `accepted`, return `200 { success: true, already_member: true }` — do NOT call `profiles.update()`
  - (5) else → UPDATE profiles SET tenant_id, role → mark invitation `accepted` → return `200 { success: true, already_member: false }`
  - Validate request body with Zod: `{ token: z.string().uuid() }`
  - POPIA annotation required (handles user ID, email, role, tenant ID)
  - _Bug_Condition: isBugCondition_1_10 — expired token returns 404 instead of 410_
  - _Bug_Condition: isBugCondition_1_11 — existing member profile overwritten silently_
  - _Expected_Behavior: 410 with CTA for expired; 200 already_member:true with no profile write for existing member_
  - _Preservation: valid non-expired token + matching user → profile updated, invitation accepted (req 3.7); decline flow unaffected (req 3.8)_
  - _Requirements: 2.10, 2.11, 3.7, 3.8_


### Group G — New Components (depends on hooks in Group D)

- [ ] 14. Create `src/components/dashboard/GuestDashboard.tsx`
  - New file: `src/components/dashboard/GuestDashboard.tsx`
  - Renders: basemap, suburb boundaries, zoning overlay, aggregate stats only
  - Must NOT render: `UserManagementPanel`, `ExportPanel`, `AnalysisResultPanel`, `PropertyDetailPanel`, risk layer controls, draw tools
  - Max 3 sign-up prompts per session (CLAUDE.md §6)
  - No data fetching in component — presentation only; pass data via props
  - ≤ 300 lines (CLAUDE.md Rule 7)
  - _Bug_Condition: isBugCondition_1_5 — GUEST sees full dashboard including protected components_
  - _Expected_Behavior: only basemap + suburbs + zoning + aggregate stats visible for GUEST role_
  - _Requirements: 2.5_


### Group H — Modified Pages (depends on hooks and components above)

- [ ] 15. Fix `src/app/dashboard/page.tsx` — RSC guest gate (Bug 1.5)
  - Convert to React Server Component
  - Use `createServerSupabaseClient()` + `withTenantContext()` to resolve session server-side
  - Fetch canonical role from `profiles` table (not JWT claims)
  - If no session → `redirect('/login?redirectTo=/dashboard')`
  - If `role === 'GUEST'` → render `<GuestDashboard />` (task 14)
  - Else → render `<DashboardScreen />`
  - POPIA annotation required (handles user ID, role)
  - _Bug_Condition: isBugCondition_1_5 — no server-side guest gate on /dashboard_
  - _Expected_Behavior: GUEST role renders GuestDashboard; unauthenticated redirected to login_
  - _Preservation: authenticated non-GUEST users continue to see full DashboardScreen (req 3.1)_
  - _Requirements: 2.5_

- [ ] 16. Fix `src/app/invite/page.tsx` — sessionStorage + redirect (Bug 1.9)
  - Before calling `POST /api/invitations/accept`, check `supabase.auth.getUser()`
  - If no session: `sessionStorage.setItem('pendingInviteToken', token)` → `router.push('/login?redirectTo=/invite')`
  - If session exists: proceed with `POST /api/invitations/accept { token }`
  - On success → `router.push('/dashboard')`
  - POPIA annotation required (handles invite token linked to email)
  - _Bug_Condition: isBugCondition_1_9 — token discarded on unauthenticated visit_
  - _Expected_Behavior: token persisted to sessionStorage; redirected to login; flow resumes after auth_
  - _Preservation: authenticated user with valid token → acceptance proceeds normally (req 3.7)_
  - _Requirements: 2.9_

- [ ] 17. Fix `src/app/login/page.tsx` — post-login token resume (Bug 1.9)
  - After successful `onLogin` callback, check `sessionStorage.getItem('pendingInviteToken')`
  - If present: clear it → `router.push('/invite?token=<token>')`
  - Else: follow existing `redirectTo` query param or default to `/dashboard`
  - POPIA annotation required (handles user session, invite token)
  - _Bug_Condition: isBugCondition_1_9 — no mechanism to resume invite flow after login_
  - _Expected_Behavior: pending invite token consumed after login; user redirected to /invite_
  - _Preservation: normal login → dashboard redirect unaffected (req 3.1); Google OAuth callback unaffected (req 3.3)_
  - _Requirements: 2.9, 3.1, 3.3_


### Group I — Modified Components (depends on hooks in Group D)

- [ ] 18. Fix `src/components/admin/InvitesTab.tsx` — inline error prop (Bug 1.12)
  - Add `error?: string` and `onClearError?: () => void` props to component interface
  - Render inline error message below submit button when `error` is set
  - Do NOT clear the email input field when `error` is set (only clear on successful 201)
  - POPIA annotation required (handles email address)
  - _Bug_Condition: isBugCondition_1_12 — 409 conflict not surfaced; email field cleared on error_
  - _Expected_Behavior: inline error visible adjacent to form; email field retains value on 409_
  - _Requirements: 2.12_

- [ ] 19. Fix `src/components/admin/UserManagementPanel.tsx` — pass error to InvitesTab (Bug 1.12)
  - In `handleInvite`, on 409 response: call `setInviteError(json.error)` (panel-level state)
  - Pass `error={inviteError}` and `onClearError={() => setInviteError(null)}` to `<InvitesTab />`
  - Remove any existing panel-level generic error display that was swallowing the 409
  - POPIA annotation required (handles email, role, user ID)
  - _Bug_Condition: isBugCondition_1_12 — error state not wired to InvitesTab_
  - _Expected_Behavior: 409 error propagated to InvitesTab inline display_
  - _Preservation: successful invite → loadData() called, email cleared (req 3.7)_
  - _Requirements: 2.12_

- [ ] 20. Fix `src/components/DashboardScreen.tsx` — role gate, auth refresh, invitation hooks (Bugs 1.3, 1.4, 1.13, 1.14)
  - Import and call `useAuthRefresh()` near top of component (task 6)
  - Import and call `useSessionRole()` → `{ role, loading }` (task 7)
  - Import and call `useInvitations()` → `{ invitations, fetchError, acceptInvitation, declineInvitation, dismissError }` (task 8)
  - Conditionally render `<UserManagementPanel />` and `<ImpersonationModal />` only when `isAdminRole(role)` is true (TENANT_ADMIN or PLATFORM_ADMIN)
  - Replace inline invitation state + `window.location.reload()` with `useInvitations()` hook calls
  - Render dismissible warning banner when `fetchError` is set; dismiss calls `dismissError()`
  - POPIA annotation required (handles user ID, role, invitation data)
  - ≤ 300 lines — split into sub-components if needed (CLAUDE.md Rule 7)
  - _Bug_Condition: isBugCondition_1_3 — no auth refresh listener_
  - _Bug_Condition: isBugCondition_1_4 — admin UI unconditionally rendered_
  - _Bug_Condition: isBugCondition_1_13 — window.location.reload() on accept/decline_
  - _Bug_Condition: isBugCondition_1_14 — silent failure on pending invitations fetch_
  - _Expected_Behavior: refresh listener active; admin UI gated by canonical role; optimistic updates; retry + banner on failure_
  - _Preservation: TENANT_ADMIN and PLATFORM_ADMIN see UserManagementPanel (req 3.4, 3.5); logout flow unaffected (req 3.2)_
  - _Requirements: 2.3, 2.4, 2.13, 2.14_


### Group J — Playwright Config (depends on health endpoint in task 9)

- [ ] 21. Fix `playwright.config.ts` — webServer readiness gate (Bug 1.1)
  - Add `webServer` block: `{ url: 'http://localhost:3000/api/health', reuseExistingServer: false, timeout: 120_000 }`
  - Playwright will poll `/api/health` until 200 before executing any test
  - _Bug_Condition: isBugCondition_1_1 — E2E tests start before server is ready_
  - _Expected_Behavior: no test runs until /api/health returns 200_
  - _Requirements: 2.1_


---

## Phase 4 — Validation: Verify Fix + Preservation

### 4A — Unit Tests

- [ ] 22. Write and run unit tests

  - [ ] 22.1 `src/__tests__/unit/health.test.ts`
    - **Property 1: Expected Behavior** — E2E Readiness Gate (P1)
    - Re-run the same exploration check from task 1 (Bug 1.1) — do NOT write a new test
    - Assert `GET /api/health` returns 200 with `{ status: "ok" }`
    - **EXPECTED OUTCOME**: PASSES (confirms Bug 1.1 fixed)
    - _Requirements: 2.1_

  - [ ] 22.2 `src/__tests__/unit/supabase-tenant-context.test.ts`
    - **Property 1: Expected Behavior** — Tenant Context Injection (P2)
    - Assert `withTenantContext(mockClient, tenantId)` calls `set_tenant_context` RPC with correct UUID
    - Assert call order: `set_tenant_context` fires BEFORE any `.from()` call
    - Assert missing `tenantId` throws rather than silently proceeding
    - **EXPECTED OUTCOME**: PASSES (confirms Bug 1.2 fixed)
    - _Requirements: 2.2_

  - [ ] 22.3 `src/__tests__/unit/useAuthRefresh.test.ts`
    - **Property 1: Expected Behavior** — Proactive JWT Refresh (P3)
    - Assert `onAuthStateChange` listener registered on mount
    - Use Vitest fake timers: advance 60s with `expiresAt - now < 300` → assert `refreshSession` called
    - Assert toast shown on refresh failure
    - **EXPECTED OUTCOME**: PASSES (confirms Bug 1.3 fixed)
    - _Requirements: 2.3_

  - [ ] 22.4 `src/__tests__/unit/useSessionRole.test.ts`
    - **Property 1: Expected Behavior** — Canonical Role Resolution (P4 dependency)
    - Assert correct `CanonicalRole` returned from profile query
    - Assert `'GUEST'` returned when no session (no throw)
    - **EXPECTED OUTCOME**: PASSES (confirms task 7 correct)
    - _Requirements: 2.4_

  - [ ] 22.5 `src/__tests__/unit/dashboard-role-gate.test.ts`
    - **Property 1: Expected Behavior** — Admin UI Role Gate (P4)
    - Property-based: for all roles in `{ GUEST, VIEWER, ANALYST, POWER_USER }` → `UserManagementPanel` NOT in DOM
    - Assert `UserManagementPanel` and `ImpersonationModal` present for TENANT_ADMIN and PLATFORM_ADMIN
    - **EXPECTED OUTCOME**: PASSES (confirms Bug 1.4 fixed)
    - _Requirements: 2.4_

  - [ ] 22.6 `src/__tests__/unit/invitations-accept.test.ts`
    - **Property 1: Expected Behavior** — Expired Token 410 (P10) + Existing Member Guard (P11)
    - Assert expired token → HTTP 410 with `{ error: "Invitation expired", cta: "Request new invite" }`
    - Assert existing member → HTTP 200 `{ already_member: true }`, profile row unchanged (spy on profiles.update)
    - Assert valid token + new user → HTTP 200 `{ already_member: false }`, profile updated
    - **EXPECTED OUTCOME**: PASSES (confirms Bugs 1.10 and 1.11 fixed)
    - _Requirements: 2.10, 2.11, 3.7_

  - [ ] 22.7 `src/__tests__/unit/invites-tab-error.test.ts`
    - **Property 1: Expected Behavior** — 409 Conflict Surfaced in InvitesTab (P12)
    - Assert 409 response → inline error rendered, email field value preserved
    - Assert 201 response → email field cleared, no error shown
    - **EXPECTED OUTCOME**: PASSES (confirms Bug 1.12 fixed)
    - _Requirements: 2.12_

  - [ ] 22.8 `src/__tests__/unit/useInvitations.test.ts`
    - **Property 1: Expected Behavior** — No Reload on Accept/Decline (P13) + Retry + Banner (P14)
    - Assert accept → optimistic remove → re-fetch triggered → `window.location.reload` spy callCount === 0
    - Assert decline → optimistic remove → no reload
    - Assert fetch failure → retry fires after 3s (fake timers) → second failure → `fetchError` set
    - Assert `dismissError()` clears `fetchError`
    - **EXPECTED OUTCOME**: PASSES (confirms Bugs 1.13 and 1.14 fixed)
    - _Requirements: 2.13, 2.14_


### 4B — Property-Based Tests

- [ ] 23. Write and run property-based tests (using `@fast-check/vitest`)

  - [ ] 23.1 Property: tenant context always set before RLS query (P2)
    - `FOR ALL tenantId: UUID` → `withTenantContext(mockClient, tenantId)` → assert `set_tenant_context` called with that UUID AND call order: RPC before any `.from()`
    - **Property 2: Preservation** — non-buggy requests (valid session, correct tenant) produce same result before and after fix
    - _Requirements: 2.2, 3.11_

  - [ ] 23.2 Property: admin UI hidden for all non-admin roles (P4)
    - `FOR ALL role IN { GUEST, VIEWER, ANALYST, POWER_USER }` → render `DashboardScreen` → assert `UserManagementPanel` NOT in document AND `ImpersonationModal` NOT in document
    - **Property 2: Preservation** — TENANT_ADMIN and PLATFORM_ADMIN still see admin UI
    - _Requirements: 2.4, 3.4, 3.5_

  - [ ] 23.3 Property: guest dashboard never shows protected components (P5)
    - `FOR ALL component IN { ExportPanel, AnalysisResultPanel, UserManagementPanel, PropertyDetailPanel, risk_layer_controls }` → render `/dashboard` as GUEST → assert component NOT in document
    - **Property 2: Preservation** — authenticated non-GUEST users see full DashboardScreen
    - _Requirements: 2.5_

  - [ ] 23.4 Property: cross-tenant PATCH always returns 403 before DB write (P6)
    - `FOR ALL (callerTenantId, targetTenantId) WHERE callerTenantId !== targetTenantId` → PATCH `/api/admin/users` → assert `response.status === 403` AND `assign_user_role` spy callCount === 0
    - **Property 2: Preservation** — same-tenant PATCH by TENANT_ADMIN succeeds; PLATFORM_ADMIN cross-tenant read unaffected
    - _Requirements: 2.6, 3.4, 3.5_

  - [ ] 23.5 Property: atomic tenant creation — every tenant has exactly one TENANT_ADMIN (P7)
    - `FOR ALL (name, slug, adminUserId): valid inputs` → POST `/api/admin/tenant` → assert `tenants.count(id=new_id) === 1` AND `tenant_settings.count(tenant_id=new_id) === 1` AND `profiles.count(tenant_id=new_id AND role='TENANT_ADMIN') === 1`
    - **Property 2: Preservation** — tenant_settings always gets `primary_color: '#00D1FF'` (req 3.9)
    - _Requirements: 2.7, 3.9_

  - [ ] 23.6 Property: invite token persistence for all token formats (P9)
    - `FOR ALL token: non-empty string (UUID, short, long, special chars)` → visit `/invite?token=<token>` unauthenticated → assert `sessionStorage.getItem('pendingInviteToken') === token` AND `router.push` called with `/login?redirectTo=/invite`
    - **Property 2: Preservation** — authenticated user with valid token proceeds directly to acceptance
    - _Requirements: 2.9, 3.7_

  - [ ] 23.7 Property: no reload on any accept/decline action (P13)
    - `FOR ALL invitationId: UUID, FOR ALL action IN { accept, decline }` → perform action → assert `window.location.reload.callCount === 0` AND invitation removed from list optimistically
    - **Property 2: Preservation** — decline marks invitation 'declined', membership unchanged (req 3.8)
    - _Requirements: 2.13, 3.8_

  - [ ] 23.8 Property: retry exactly once on fetch failure (P14)
    - `FOR ALL failureType IN { NetworkError, 500, 503 }` → mock fetch to fail → trigger `fetchInvitations()` → advance timers 3000ms → assert `fetch.callCount === 2` AND `fetchError` set after second failure
    - **Property 2: Preservation** — successful fetch sets invitations and clears fetchError
    - _Requirements: 2.14_


### 4C — E2E Tests (Playwright, seeded users only — no new user creation)

- [ ] 24. Write and run E2E tests

  - [ ] 24.1 `src/__tests__/e2e/auth-session.spec.ts`
    - **Property 1: Expected Behavior** — Readiness Gate (P1) + Tenant Context (P2) + JWT Refresh (P3)
    - Verify `/api/health` returns 200 before any test runs (readiness gate — Playwright `webServer` block)
    - Seeded TENANT_ADMIN logs in → dashboard loads with tenant-scoped data (profiles row count > 0, not empty)
    - Simulate session at 55-minute mark → assert token refresh triggered → no 401 errors on subsequent API calls
    - **Property 2: Preservation** — valid email/password login → session created, redirect to `/dashboard` (req 3.1); logout → session cleared, redirect to `/login` (req 3.2)
    - Use seeded users only
    - _Requirements: 2.1, 2.2, 2.3, 3.1, 3.2_

  - [ ] 24.2 `src/__tests__/e2e/rbac-enforcement.spec.ts`
    - **Property 1: Expected Behavior** — Admin UI Gate (P4) + Guest Mode (P5) + Tenant Mismatch (P6)
    - Seeded VIEWER logs in → assert `UserManagementPanel` not visible in DOM
    - Seeded GUEST navigates to `/dashboard` → assert only basemap/zoning/stats visible; `ExportPanel` absent
    - Seeded TENANT_ADMIN attempts cross-tenant role change via PATCH `/api/admin/users` → assert 403 returned
    - **Property 2: Preservation** — PLATFORM_ADMIN sees all users (req 3.4); TENANT_ADMIN sees own tenant only (req 3.5); `canImpersonate()` rules unchanged (req 3.6)
    - Use seeded users only
    - _Requirements: 2.4, 2.5, 2.6, 3.4, 3.5, 3.6_

  - [ ] 24.3 `src/__tests__/e2e/tenant-onboarding.spec.ts`
    - **Property 1: Expected Behavior** — Atomic Tenant Creation (P7) + Email Delivery (P8)
    - Seeded PLATFORM_ADMIN creates new tenant → assert tenant row exists AND tenant_settings row exists AND profiles row has `role='TENANT_ADMIN'` for that tenant
    - Seeded TENANT_ADMIN sends invitation → assert `delivery_status` is `'sent'` or `'failed'` (never `'pending'`) after response
    - **Property 2: Preservation** — tenant_settings always has `primary_color: '#00D1FF'` (req 3.9); `getTenantConfig()` returns white-label config (req 3.10)
    - Use seeded users only
    - _Requirements: 2.7, 2.8, 3.9, 3.10_

  - [ ] 24.4 `src/__tests__/e2e/invitation-flow.spec.ts`
    - **Property 1: Expected Behavior** — Token Persistence (P9) + 410 Expired (P10) + Existing Member (P11) + 409 Inline Error (P12)
    - Unauthenticated user visits invite link → redirected to login → after login, redirected back to `/invite?token=<token>` → invitation accepted → redirected to `/dashboard`
    - Expired token → assert 410 page with "Request new invite" CTA visible in UI
    - Seeded existing member accepts invite to same tenant → assert `already_member: true` in response → profile row unchanged
    - Duplicate invite submission → assert inline error visible in `InvitesTab`, email field not cleared
    - **Property 2: Preservation** — valid non-expired token + matching authenticated user → profile updated, invitation accepted (req 3.7); decline → marked 'declined', membership unchanged (req 3.8)
    - Use seeded users only
    - _Requirements: 2.9, 2.10, 2.11, 2.12, 3.7, 3.8_

  - [ ] 24.5 `src/__tests__/e2e/dashboard-notifications.spec.ts`
    - **Property 1: Expected Behavior** — No Reload on Accept/Decline (P13) + Retry + Warning Banner (P14)
    - Accept invitation via banner → assert no page reload (`window.location.reload` spy) → banner item removed → background re-fetch confirms updated list
    - Simulate network failure on `/api/invitations/pending` → assert retry fires after 3s → warning banner "Could not load invitations. Check your connection." appears → dismiss button clears banner
    - **Property 2: Preservation** — all non-buggy invitation interactions produce same result as before fix (P15, req 3.7, 3.8)
    - Use seeded users only
    - _Requirements: 2.13, 2.14, 3.7, 3.8_


---

## Phase 5 — Checkpoint

- [ ] 25. Checkpoint — Ensure all tests pass and compliance rules are met
  - Run `npm test` (Vitest unit + property-based) — all 8 unit test files must pass
  - Run `npm run test:e2e` (Playwright) — all 5 E2E spec files must pass
  - Run `npm run typecheck` — zero TypeScript errors
  - Run `npm run lint` — zero ESLint errors
  - Verify POPIA annotation blocks present on all files touching personal data:
    - `src/lib/supabase/server.ts`
    - `src/hooks/useAuthRefresh.ts`
    - `src/hooks/useSessionRole.ts`
    - `src/hooks/useInvitations.ts`
    - `src/app/dashboard/page.tsx`
    - `src/app/invite/page.tsx`
    - `src/app/login/page.tsx`
    - `src/app/api/admin/users/route.ts`
    - `src/app/api/admin/tenant/route.ts`
    - `src/app/api/admin/invite/route.ts`
    - `src/app/api/invitations/accept/route.ts`
    - `src/components/DashboardScreen.tsx`
    - `src/components/admin/InvitesTab.tsx`
    - `src/components/admin/UserManagementPanel.tsx`
    - `supabase/functions/send-invitation-email/index.ts`
  - Verify all source files are ≤ 300 lines (CLAUDE.md Rule 7)
  - Verify all mutation routes validate with Zod (CLAUDE.md Rule 4)
  - Verify `SECURITY DEFINER` functions set `search_path = public, pg_temp` (security.md)
  - Verify `@supabase/ssr` used for all server-side auth (security.md)
  - Confirm all 15 correctness properties (P1–P15) are validated by at least one passing test
  - Ask the user if any questions arise before marking complete
  - _Requirements: 2.1–2.14, 3.1–3.12_

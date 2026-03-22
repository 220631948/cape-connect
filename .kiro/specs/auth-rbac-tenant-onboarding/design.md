# Auth, RBAC & Tenant Onboarding — Bugfix Design

## Overview

This document formalises the fix approach for 14 defects across five areas:
authentication & session reliability, RBAC enforcement, tenant onboarding atomicity,
invitation flow correctness, and dashboard notification resilience.

Each fix is minimal and targeted. No existing auth/session logic, RLS policies, or
tenant relationships are broken. All personal-data-touching files carry the POPIA
annotation block (CLAUDE.md Rule 5). All source files stay ≤ 300 lines (Rule 7).

---

## Glossary

- **Bug_Condition (C)**: The input state or code path that triggers a defect.
- **Property (P)**: The correct observable behaviour when the fix is applied.
- **Preservation**: Existing correct behaviours that must remain unchanged.
- **isBugCondition(input)**: Pseudocode predicate — returns `true` when the defect fires.
- **expectedBehavior(result)**: Pseudocode predicate — returns `true` when the fix is correct.
- **app.current_tenant**: PostgreSQL session variable consumed by RLS policies for tenant isolation.
- **GoTrue**: Supabase Auth service managing JWTs, refresh tokens, and OAuth flows.
- **TENANT_ADMIN**: Highest per-tenant role; can manage users within their own tenant only.
- **PLATFORM_ADMIN**: Cross-tenant superuser; cannot write cross-tenant without explicit flag.
- **delivery_status**: Column on `tenant_invitations` tracking email send outcome (`sent | failed`).
- **sessionStorage token**: Invite token persisted client-side to survive the login redirect.


---

## Bug Details

### Area 1 — Authentication & Session (Bugs 1.1–1.3)

#### Bug 1.1 — No E2E Readiness Gate

The system has no `/api/health` endpoint. Playwright E2E tests start before Next.js and
FastAPI are fully ready, causing intermittent failures from race conditions.

**Formal Specification:**
```
FUNCTION isBugCondition_1_1(state)
  INPUT: state — { nextjsReady: boolean, e2eTestStarted: boolean }
  OUTPUT: boolean

  RETURN state.e2eTestStarted = true
         AND state.nextjsReady = false
END FUNCTION
```

**Examples:**
- CI starts `npm run test:e2e` immediately after `npm run build` → first test hits 503 → flaky failure.
- `playwright.config.ts` has no `webServer.reuseExistingServer` readiness check → race condition.

---

#### Bug 1.2 — Missing app.current_tenant Injection

`createServerSupabaseClient()` in `src/lib/supabase/server.ts` does not call
`SET LOCAL app.current_tenant = '<uuid>'` before executing RLS-protected queries.
RLS policies evaluate `current_setting('app.current_tenant', TRUE)` which returns `NULL`,
causing policies to silently return empty result sets.

**Formal Specification:**
```
FUNCTION isBugCondition_1_2(request)
  INPUT: request — { session: Session, query: RLSProtectedQuery }
  OUTPUT: boolean

  RETURN request.session != null
         AND request.session.user.tenant_id != null
         AND app_current_tenant_is_set() = false
         AND request.query.table IN RLS_PROTECTED_TABLES
END FUNCTION
```

**Examples:**
- Seeded TENANT_ADMIN logs in → `profiles` query returns `[]` instead of tenant users.
- `tenant_invitations` fetch returns empty even though rows exist for that tenant.

---

#### Bug 1.3 — No Proactive JWT Refresh

`DashboardScreen` and other client components do not subscribe to
`supabase.auth.onAuthStateChange`. When the 1h JWT expires mid-session, API calls
return 401 silently with no user-facing feedback.

**Formal Specification:**
```
FUNCTION isBugCondition_1_3(session)
  INPUT: session — { expiresAt: number, refreshListenerActive: boolean }
  OUTPUT: boolean

  RETURN (session.expiresAt - Date.now() / 1000) < 300
         AND session.refreshListenerActive = false
END FUNCTION
```

**Examples:**
- User opens dashboard at 09:00, JWT expires at 10:00, user still active at 09:58 → next API call returns 401 with no toast.
- Refresh token is valid (7d) but is never used because no listener triggers it.


---

### Area 2 — RBAC Enforcement (Bugs 1.4–1.6)

#### Bug 1.4 — Admin UI Visible to VIEWER and Below

`DashboardScreen` renders `<UserManagementPanel />` unconditionally. The component is
always mounted regardless of the authenticated user's role. VIEWER and GUEST users see
admin controls they cannot use.

**Formal Specification:**
```
FUNCTION isBugCondition_1_4(render)
  INPUT: render — { userRole: CanonicalRole, adminPanelMounted: boolean }
  OUTPUT: boolean

  RETURN render.userRole IN ['GUEST', 'VIEWER', 'ANALYST', 'POWER_USER']
         AND render.adminPanelMounted = true
END FUNCTION
```

**Examples:**
- Seeded VIEWER user logs in → `UserManagementPanel` is visible in the DOM.
- GUEST navigates to `/dashboard` → `ImpersonationModal` is accessible via keyboard.

---

#### Bug 1.5 — Guest Mode Not Enforced on /dashboard

`src/app/dashboard/page.tsx` renders `<DashboardScreen />` without checking the session
role. GUEST users see the full dashboard including property details, risk layers, and
export controls, violating CLAUDE.md §6.

**Formal Specification:**
```
FUNCTION isBugCondition_1_5(render)
  INPUT: render — { userRole: CanonicalRole, visibleComponents: string[] }
  OUTPUT: boolean

  RETURN render.userRole = 'GUEST'
         AND render.visibleComponents INTERSECTS
             ['PropertyDetailPanel', 'ExportPanel', 'AnalysisResultPanel',
              'UserManagementPanel', 'risk_layers']
END FUNCTION
```

**Examples:**
- GUEST hits `/dashboard` directly → `ExportPanel` is rendered.
- GUEST can trigger `runAnalysis()` via the draw tool.

---

#### Bug 1.6 — Tenant-Mismatch Check Fires After Supabase Query

In `PATCH /api/admin/users`, the target user's `tenant_id` is fetched from the DB
*before* the cross-tenant check is evaluated. If RLS is misconfigured or bypassed
(e.g., service role key), the check order allows a window where the query executes
before the 403 is returned.

**Formal Specification:**
```
FUNCTION isBugCondition_1_6(request)
  INPUT: request — { callerTenantId: string, targetUserId: string,
                     checkOrderCorrect: boolean }
  OUTPUT: boolean

  RETURN request.callerTenantId != targetUser.tenant_id
         AND request.checkOrderCorrect = false
         AND NOT isPlatformAdmin(caller.role)
END FUNCTION
```

**Examples:**
- TENANT_ADMIN from tenant-A sends PATCH with `userId` belonging to tenant-B → DB query fires before 403 is returned.


---

### Area 3 — Tenant Onboarding (Bugs 1.7–1.8)

#### Bug 1.7 — Non-Atomic Tenant Creation

`POST /api/admin/tenant` creates the `tenants` row and `tenant_settings` row in
separate statements with no transaction. The requesting admin's profile is never
updated to `TENANT_ADMIN` of the new tenant, leaving every new tenant ownerless.

**Formal Specification:**
```
FUNCTION isBugCondition_1_7(result)
  INPUT: result — { tenantCreated: boolean, adminAssigned: boolean,
                    inSingleTransaction: boolean }
  OUTPUT: boolean

  RETURN result.tenantCreated = true
         AND (result.adminAssigned = false
              OR result.inSingleTransaction = false)
END FUNCTION
```

**Examples:**
- PLATFORM_ADMIN creates tenant "Cape Winelands" → tenant row exists, `tenant_settings` row exists, but no profile has `tenant_id = new_tenant.id AND role = 'TENANT_ADMIN'`.
- Partial failure between tenant insert and settings insert leaves orphaned tenant row.

---

#### Bug 1.8 — No Email Delivery on Invitation

`POST /api/admin/invite` inserts the `tenant_invitations` row and returns the token
in dev mode, but never calls a Supabase Edge Function or any email service. The
`tenant_invitations` table has no `delivery_status` column, so there is no way to
audit whether the invited user received the link.

**Formal Specification:**
```
FUNCTION isBugCondition_1_8(result)
  INPUT: result — { invitationInserted: boolean, emailDispatched: boolean,
                    deliveryStatusRecorded: boolean }
  OUTPUT: boolean

  RETURN result.invitationInserted = true
         AND (result.emailDispatched = false
              OR result.deliveryStatusRecorded = false)
END FUNCTION
```

**Examples:**
- TENANT_ADMIN invites `user@example.com` in production → invitation row created, no email sent, `delivery_status` column absent.


---

### Area 4 — Invitation Flow (Bugs 1.9–1.12)

#### Bug 1.9 — Token Discarded on Unauthenticated Invite Visit

`src/app/invite/page.tsx` calls `POST /api/invitations/accept` immediately on mount.
If the user has no session, the API returns 401 and the token is lost. There is no
redirect to `/login` with the token preserved, so the user cannot complete the flow
after authenticating.

**Formal Specification:**
```
FUNCTION isBugCondition_1_9(visit)
  INPUT: visit — { token: string, sessionExists: boolean,
                   tokenPersistedBeforeRedirect: boolean }
  OUTPUT: boolean

  RETURN visit.token != null
         AND visit.sessionExists = false
         AND visit.tokenPersistedBeforeRedirect = false
END FUNCTION
```

---

#### Bug 1.10 — Expired Token Returns Generic 404

`POST /api/invitations/accept` uses `.gt('expires_at', now)` in the query filter.
An expired token simply returns `null` from `maybeSingle()`, which the handler maps
to a generic 404 "Invalid or expired invitation" with no guidance on next steps.

**Formal Specification:**
```
FUNCTION isBugCondition_1_10(request)
  INPUT: request — { token: string, tokenExpired: boolean, responseStatus: number }
  OUTPUT: boolean

  RETURN request.tokenExpired = true
         AND request.responseStatus != 410
END FUNCTION
```

---

#### Bug 1.11 — Existing Member Profile Overwrite

`POST /api/invitations/accept` calls `profiles.update({ tenant_id, role })` without
first checking whether the user is already an active member of that tenant. A user
who is already a POWER_USER could be silently downgraded to VIEWER by accepting a
second invitation.

**Formal Specification:**
```
FUNCTION isBugCondition_1_11(request)
  INPUT: request — { userId: string, userCurrentTenantId: string,
                     invitationTenantId: string, profileUpdated: boolean }
  OUTPUT: boolean

  RETURN request.userCurrentTenantId = request.invitationTenantId
         AND request.profileUpdated = true
END FUNCTION
```

---

#### Bug 1.12 — 409 Conflict Not Surfaced in InvitesTab

`UserManagementPanel.handleInvite()` catches the error from `POST /api/admin/invite`
and sets the panel-level `error` state. `InvitesTab` receives no error prop and has
no inline error display. The email field is cleared on submit regardless of outcome.

**Formal Specification:**
```
FUNCTION isBugCondition_1_12(ui)
  INPUT: ui — { apiResponseStatus: number, inlineErrorVisible: boolean,
                emailFieldCleared: boolean }
  OUTPUT: boolean

  RETURN ui.apiResponseStatus = 409
         AND (ui.inlineErrorVisible = false
              OR ui.emailFieldCleared = true)
END FUNCTION
```


---

### Area 5 — Dashboard Notification System (Bugs 1.13–1.14)

#### Bug 1.13 — window.location.reload() After Accept/Decline

`DashboardScreen.handleAcceptInvitation()` calls `window.location.reload()` after a
successful accept. This breaks the SPA experience, resets all component state, and
is unnecessary since the invitation list can be updated optimistically.

**Formal Specification:**
```
FUNCTION isBugCondition_1_13(action)
  INPUT: action — { type: 'accept' | 'decline', reloadCalled: boolean }
  OUTPUT: boolean

  RETURN action.reloadCalled = true
END FUNCTION
```

---

#### Bug 1.14 — Silent Failure on Pending Invitations Fetch Error

`DashboardScreen.fetchInvitations()` catches errors and logs to console only. No
retry is attempted. No user-facing warning is shown. The user has no indication that
their pending invitations could not be loaded.

**Formal Specification:**
```
FUNCTION isBugCondition_1_14(fetch)
  INPUT: fetch — { failed: boolean, retryAttempted: boolean,
                   warningBannerShown: boolean }
  OUTPUT: boolean

  RETURN fetch.failed = true
         AND (fetch.retryAttempted = false
              OR fetch.warningBannerShown = false)
END FUNCTION
```


---

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors (from bugfix.md §3):**

- Login via email/password continues through Supabase GoTrue → `LoginScreen` → `onLogin` callback (3.1).
- Logout clears the Supabase session cookie and redirects to `/login` (3.2).
- Google OAuth callback flow is not modified (3.3).
- PLATFORM_ADMIN `GET /api/admin/users` returns all users across all tenants (3.4).
- TENANT_ADMIN `GET /api/admin/users` returns only their own tenant's users (3.5).
- `canImpersonate()` rules: no self-impersonation, no PLATFORM_ADMIN impersonation, TENANT_ADMIN cross-tenant block (3.6).
- Valid non-expired invitation accepted by matching authenticated user → profile updated, invitation marked `accepted` (3.7).
- Declined invitation → marked `declined`, removed from pending list, user's current membership unchanged (3.8).
- New tenant creation always inserts default `tenant_settings` row with `primary_color: '#00D1FF'` (3.9).
- `getTenantConfig()` returns white-label config falling back to `WHITELABEL_DEFAULTS` (3.10).
- RLS policies on all tenant-scoped tables remain enforced (3.11).
- POPIA annotation blocks remain on all personal-data-touching files (3.12).

**Scope of Non-Buggy Inputs:**
All inputs that do NOT match any `isBugCondition` predicate above must produce
identical behaviour before and after the fix. This includes:
- Authenticated users with valid, non-expired JWTs.
- TENANT_ADMIN or PLATFORM_ADMIN accessing their own tenant's data.
- Valid, non-expired invitation tokens presented by authenticated matching users.
- Mouse/touch interactions unrelated to the invitation banner.


---

## Hypothesized Root Causes

1. **Missing health endpoint** — No `src/app/api/health/route.ts` exists; Playwright config has no `webServer` readiness wait.

2. **No SET LOCAL before RLS queries** — `createServerSupabaseClient()` returns a raw client with no middleware to inject `app.current_tenant`. Every caller assumes the session variable is already set, but nothing sets it.

3. **No onAuthStateChange listener** — `DashboardScreen` fetches data on mount but never subscribes to GoTrue auth events. Token refresh is entirely passive (relies on Supabase SDK auto-refresh which only fires on API calls, not proactively).

4. **Unconditional admin panel render** — `DashboardScreen` mounts `<UserManagementPanel />` in JSX with no role guard. Role is available via the session but is never checked at the render site.

5. **No server-side guest gate on /dashboard** — `src/app/dashboard/page.tsx` is a thin wrapper around `DashboardScreen` with no middleware or server component role check. Guest users are not redirected.

6. **Tenant-mismatch check after DB fetch** — In `PATCH /api/admin/users`, the target user row is fetched from the DB first, then `targetUser.tenant_id !== caller.tenant_id` is checked. The fix must reorder: fetch target, check mismatch, then proceed.

7. **Non-atomic tenant creation** — Three separate `await client.from(...)` calls with no transaction wrapper. The Supabase JS client does not support multi-statement transactions directly; a `SECURITY DEFINER` RPC function is required.

8. **No email dispatch call** — The `TODO` comment in `POST /api/admin/invite` was never implemented. The `tenant_invitations` table schema lacks a `delivery_status` column.

9. **Invite page calls accept immediately** — `InviteContent` runs `acceptInvite()` in `useEffect` on mount without checking `supabase.auth.getSession()` first. No `sessionStorage` write or login redirect exists.

10. **Expired token not distinguished from invalid** — The query filter `.gt('expires_at', now)` silently excludes expired tokens. A separate query without the date filter is needed to distinguish "expired" (→ 410) from "not found" (→ 404).

11. **No existing-member check** — `POST /api/invitations/accept` goes straight to `profiles.update()` without querying whether `user.tenant_id === invitation.tenant_id`.

12. **InvitesTab has no error prop** — `UserManagementPanel` catches errors in `handleInvite` but passes nothing to `<InvitesTab />`. The component has no `error` or `onError` prop in its interface.

13. **window.location.reload() in accept handler** — `handleAcceptInvitation` in `DashboardScreen` calls `window.location.reload()` after a successful accept response. The optimistic list update (`setInvitations(...)`) is already in place for decline but not for accept.

14. **No retry or error UI in fetchInvitations** — `fetchInvitations()` is a plain `try/catch` with `console.error`. No retry timer, no state variable for fetch failure, no warning banner component.


---

## Correctness Properties

Property 1: Bug Condition — E2E Readiness Gate

_For any_ E2E test run, the system SHALL expose a `GET /api/health` endpoint that
returns `{ status: "ok" }` with HTTP 200, and the Playwright `webServer` config SHALL
poll this endpoint before executing any test, ensuring no test starts before the
server is ready.

**Validates: Requirements 2.1**

---

Property 2: Bug Condition — Tenant Context Injection

_For any_ authenticated server-side request where the session user has a non-null
`tenant_id`, the fixed server Supabase client SHALL execute
`SET LOCAL app.current_tenant = '<tenant_id>'` before any RLS-protected query,
ensuring tenant-scoped tables return the correct rows.

**Validates: Requirements 2.2**

---

Property 3: Bug Condition — Proactive JWT Refresh

_For any_ active client session where `(expiresAt - now) < 300` seconds, the fixed
`onAuthStateChange` listener SHALL trigger a token refresh. If the refresh fails,
a non-blocking toast SHALL be displayed prompting re-authentication.

**Validates: Requirements 2.3**

---

Property 4: Bug Condition — Admin UI Role Gate

_For any_ authenticated user whose canonical role is in
`{GUEST, VIEWER, ANALYST, POWER_USER}`, the fixed dashboard SHALL NOT render
`UserManagementPanel`, `ImpersonationModal`, or any admin tab. The role check
SHALL use the session profile role, not JWT claims alone.

**Validates: Requirements 2.4**

---

Property 5: Bug Condition — Guest Mode Dashboard Enforcement

_For any_ GUEST session navigating to `/dashboard`, the fixed system SHALL restrict
visible components to: basemap, suburb boundaries, zoning overlay, and aggregate
stats. Property details, risk layers, export controls, draw tools, and admin panels
SHALL NOT be rendered or accessible.

**Validates: Requirements 2.5**

---

Property 6: Bug Condition — Tenant-Mismatch Check Order

_For any_ `PATCH /api/admin/users` request where the caller is a non-PLATFORM_ADMIN
and `caller.tenant_id !== target.tenant_id`, the fixed handler SHALL return 403
`"Forbidden: tenant mismatch"` BEFORE executing any Supabase write query against
the target user's profile.

**Validates: Requirements 2.6**

---

Property 7: Bug Condition — Atomic Tenant Creation

_For any_ successful `POST /api/admin/tenant` call, the fixed handler SHALL atomically
create the `tenants` row, the `tenant_settings` row, and update the requesting admin's
profile `tenant_id` and `role` to `TENANT_ADMIN` within a single database transaction.
If any step fails, all changes SHALL be rolled back.

**Validates: Requirements 2.7**

---

Property 8: Bug Condition — Invitation Email Delivery

_For any_ successful `POST /api/admin/invite` call, the fixed handler SHALL invoke the
Supabase Edge Function `send-invitation-email` and SHALL update the `tenant_invitations`
row with `delivery_status = 'sent'` on success or `delivery_status = 'failed'` on error.

**Validates: Requirements 2.8**

---

Property 9: Bug Condition — Invite Token Persistence on Unauthenticated Visit

_For any_ visit to `/invite?token=<token>` where no active session exists, the fixed
page SHALL persist the token to `sessionStorage`, redirect to
`/login?redirectTo=/invite`, and after successful authentication SHALL automatically
resume the acceptance flow using the stored token.

**Validates: Requirements 2.9**

---

Property 10: Bug Condition — Expired Token Returns 410

_For any_ `POST /api/invitations/accept` request where the token exists in the DB but
`expires_at < now`, the fixed handler SHALL return HTTP 410 Gone with a response body
containing `{ error: "Invitation expired", cta: "Request new invite" }`.

**Validates: Requirements 2.10**

---

Property 11: Bug Condition — Existing Member Guard

_For any_ `POST /api/invitations/accept` request where the authenticated user's
current `tenant_id` matches the invitation's `tenant_id`, the fixed handler SHALL
skip the profile update, mark the invitation as `accepted`, and return
`{ success: true, already_member: true }` with HTTP 200.

**Validates: Requirements 2.11**

---

Property 12: Bug Condition — 409 Conflict Surfaced in InvitesTab

_For any_ `POST /api/admin/invite` response with status 409, the fixed `InvitesTab`
SHALL display an inline error message adjacent to the invite form, and the email
input field SHALL retain its current value (not be cleared).

**Validates: Requirements 2.12**

---

Property 13: Bug Condition — No window.location.reload on Accept/Decline

_For any_ accept or decline action on the `InvitationBanner`, the fixed
`DashboardScreen` SHALL update the invitation list optimistically (remove the item),
trigger a background re-fetch of `/api/invitations/pending`, and SHALL NOT call
`window.location.reload()` at any point.

**Validates: Requirements 2.13**

---

Property 14: Bug Condition — Retry and Warning Banner on Fetch Failure

_For any_ failure of `GET /api/invitations/pending` (network error or 5xx), the fixed
`useInvitations` hook SHALL retry exactly once after 3 seconds. If the retry also
fails, a dismissible warning banner SHALL be rendered with the message
"Could not load invitations. Check your connection."

**Validates: Requirements 2.14**

---

Property 15: Preservation — All Non-Buggy Auth and RBAC Flows

_For any_ input where none of the 14 bug conditions hold (valid sessions, correct
roles, non-expired tokens, same-tenant operations), the fixed system SHALL produce
exactly the same behaviour as the original system, preserving all flows described
in bugfix.md §3 (requirements 3.1–3.12).

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10, 3.11, 3.12**


---

## Fix Implementation

### Area 1 — Authentication & Session

#### Fix 1.1 — Health-Check Endpoint + Playwright Readiness Gate

**New file:** `src/app/api/health/route.ts`

```
GET /api/health
Response: 200 { status: "ok", timestamp: ISO8601 }
Auth: none required
```

Data flow:
```
Playwright CI
  └─ webServer.url = "http://localhost:3000/api/health"
  └─ webServer.reuseExistingServer = false
  └─ polls until 200 before any test runs
       └─ GET /api/health → route handler → { status: "ok" }
```

**Modified file:** `playwright.config.ts`
- Add `webServer` block pointing to `/api/health` with `timeout: 120_000`.

No schema changes required.

---

#### Fix 1.2 — app.current_tenant Injection

**Modified file:** `src/lib/supabase/server.ts`

Add a wrapper `createTenantAwareSupabaseClient(tenantId: string)` that calls
`SET LOCAL app.current_tenant = $1` via `client.rpc('set_tenant_context', { tenant_id })`
immediately after client creation, before returning the client to the caller.

Alternatively, add a `withTenantContext(client, tenantId)` helper that executes the
SET LOCAL and returns the same client, to be called at the top of every server action
or API route that touches RLS-protected tables.

Data flow:
```
API Route handler
  └─ createServerSupabaseClient()
  └─ withTenantContext(client, session.user.tenant_id)
       └─ client.rpc('set_tenant_context', { tenant_id })
            └─ PostgreSQL: SET LOCAL app.current_tenant = '<uuid>'
  └─ client.from('profiles').select(...)   ← RLS now resolves correctly
```

**New migration:** `supabase/migrations/YYYYMMDD_set_tenant_context_rpc.sql`
```sql
CREATE OR REPLACE FUNCTION set_tenant_context(tenant_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  PERFORM set_config('app.current_tenant', tenant_id::text, true);
END;
$$;
```

---

#### Fix 1.3 — Proactive JWT Refresh Hook

**New file:** `src/hooks/useAuthRefresh.ts`

Client-side hook that:
1. Calls `supabase.auth.onAuthStateChange` on mount.
2. On `TOKEN_REFRESHED` event — no-op (refresh succeeded).
3. On `SIGNED_OUT` or refresh failure — shows a toast: "Session expired. Please sign in again."
4. Proactively checks `session.expires_at` every 60s; if within 300s, calls `supabase.auth.refreshSession()`.

**Modified file:** `src/components/DashboardScreen.tsx`
- Import and call `useAuthRefresh()` near the top of the component.

Data flow:
```
DashboardScreen mounts
  └─ useAuthRefresh()
       └─ supabase.auth.onAuthStateChange(handler)
       └─ setInterval(checkExpiry, 60_000)
            └─ if (expiresAt - now < 300) → supabase.auth.refreshSession()
                 ├─ success → TOKEN_REFRESHED event → no-op
                 └─ failure → toast("Session expired. Please sign in again.")
```

No schema changes required.

---

### Area 2 — RBAC Enforcement

#### Fix 1.4 — Admin UI Role Gate

**Modified file:** `src/components/DashboardScreen.tsx`

Add role resolution from the Supabase session profile (not JWT claims). Conditionally
render `<UserManagementPanel />` only when `canonicalRole` is `TENANT_ADMIN` or
`PLATFORM_ADMIN`.

Data flow:
```
DashboardScreen
  └─ useSessionRole() → { role: CanonicalRole }
       └─ supabase.auth.getUser() → session
       └─ profiles.select('role').eq('id', user.id) → canonical role
  └─ {isAdminRole(role) && <UserManagementPanel />}
  └─ {isAdminRole(role) && <ImpersonationModal />}
```

**New file:** `src/hooks/useSessionRole.ts`
- Fetches the canonical role from `profiles` on mount.
- Returns `{ role: CanonicalRole, loading: boolean }`.

---

#### Fix 1.5 — Guest Mode Gate on /dashboard

**Modified file:** `src/app/dashboard/page.tsx`

Convert to a React Server Component (RSC). Use `createServerSupabaseClient()` to
resolve the session and profile role server-side. If role is `GUEST` or no session
exists, redirect to `/login` or render a restricted `GuestDashboard` component
(basemap + suburbs + zoning + aggregate stats only).

Data flow:
```
GET /dashboard
  └─ RSC: createServerSupabaseClient()
  └─ session = await supabase.auth.getUser()
  └─ profile = await profiles.select('role').eq('id', user.id)
  └─ if role === 'GUEST' → render <GuestDashboard />
  └─ if no session → redirect('/login?redirectTo=/dashboard')
  └─ else → render <DashboardScreen />
```

**New file:** `src/components/dashboard/GuestDashboard.tsx`
- Renders basemap, suburb boundaries, zoning overlay, aggregate stats only.
- No `UserManagementPanel`, no `ExportPanel`, no `AnalysisResultPanel`, no draw tools.
- Max 3 sign-up prompts per session (CLAUDE.md §6).

---

#### Fix 1.6 — Tenant-Mismatch Check Before DB Query

**Modified file:** `src/app/api/admin/users/route.ts` — `PATCH` handler

Reorder the logic so the tenant-mismatch check uses the already-fetched `targetUser`
row and fires before any update call. The current code already fetches `targetUser`
before the check, so the fix is to move the mismatch guard immediately after the
fetch and before `client.rpc('assign_user_role', ...)`.

Current order (buggy):
```
1. fetch caller profile
2. validate role
3. fetch targetUser
4. call assign_user_role RPC   ← DB write
5. check tenant mismatch       ← too late
```

Fixed order:
```
1. fetch caller profile
2. validate role
3. fetch targetUser
4. CHECK tenant mismatch → 403 if mismatch   ← before any write
5. call assign_user_role RPC
```

No schema changes required.

---

### Area 3 — Tenant Onboarding

#### Fix 1.7 — Atomic Tenant Creation via RPC

**Modified file:** `src/app/api/admin/tenant/route.ts`

Replace the three sequential `client.from(...)` calls with a single
`client.rpc('create_tenant_atomic', { name, slug, admin_user_id })` call.

**New migration:** `supabase/migrations/YYYYMMDD_create_tenant_atomic.sql`

```sql
CREATE OR REPLACE FUNCTION create_tenant_atomic(
  p_name        text,
  p_slug        text,
  p_admin_user_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_tenant_id uuid;
BEGIN
  -- 1. Insert tenant
  INSERT INTO tenants (name, slug)
  VALUES (p_name, p_slug)
  RETURNING id INTO v_tenant_id;

  -- 2. Insert default tenant_settings
  INSERT INTO tenant_settings (tenant_id, primary_color, brand_name, features_enabled)
  VALUES (v_tenant_id, '#00D1FF', p_name, ARRAY['zoning','search','flights']);

  -- 3. Assign requesting admin as TENANT_ADMIN of new tenant
  UPDATE profiles
  SET tenant_id = v_tenant_id,
      role      = 'TENANT_ADMIN'
  WHERE id = p_admin_user_id;

  RETURN jsonb_build_object('tenant_id', v_tenant_id, 'name', p_name, 'slug', p_slug);
END;
$$;
```

Data flow:
```
POST /api/admin/tenant
  └─ validate session + PLATFORM_ADMIN role
  └─ client.rpc('create_tenant_atomic', { name, slug, admin_user_id: session.user.id })
       └─ PostgreSQL transaction (implicit in plpgsql function)
            ├─ INSERT tenants
            ├─ INSERT tenant_settings
            └─ UPDATE profiles SET role='TENANT_ADMIN', tenant_id=new_id
  └─ audit_log insert
  └─ return { tenant_id, name, slug }
```

---

#### Fix 1.8 — Email Delivery via Edge Function + delivery_status

**New migration:** `supabase/migrations/YYYYMMDD_invitation_delivery_status.sql`

```sql
ALTER TABLE tenant_invitations
  ADD COLUMN IF NOT EXISTS delivery_status text
    CHECK (delivery_status IN ('pending', 'sent', 'failed'))
    DEFAULT 'pending';
```

**Modified file:** `src/app/api/admin/invite/route.ts`

After inserting the invitation row, call the Supabase Edge Function:

```
POST https://<project>.supabase.co/functions/v1/send-invitation-email
Body: { invitation_id, email, role, tenant_name, invite_url }
```

On success → `UPDATE tenant_invitations SET delivery_status = 'sent'`
On failure → `UPDATE tenant_invitations SET delivery_status = 'failed'`

**New file:** `supabase/functions/send-invitation-email/index.ts`
- Receives invitation payload.
- Sends email via Supabase's built-in SMTP or a configured provider (Resend/SendGrid via env var).
- Returns `{ success: boolean }`.

Data flow:
```
POST /api/admin/invite
  └─ INSERT tenant_invitations (delivery_status = 'pending')
  └─ fetch('supabase/functions/v1/send-invitation-email', { invitation_id, email, ... })
       ├─ success → UPDATE delivery_status = 'sent'
       └─ failure → UPDATE delivery_status = 'failed'
  └─ return { success: true, invitation: { ..., delivery_status } }
```

API contract change — response now includes `delivery_status`:
```json
{
  "success": true,
  "invitation": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "viewer",
    "expires_at": "ISO8601",
    "delivery_status": "sent"
  }
}
```


---

### Area 4 — Invitation Flow

#### Fix 1.9 — Token Persistence + Post-Login Resume

**Modified file:** `src/app/invite/page.tsx`

Before calling `POST /api/invitations/accept`, check `supabase.auth.getUser()`.
If no session:
1. Write `sessionStorage.setItem('pendingInviteToken', token)`.
2. `router.push('/login?redirectTo=/invite')`.

**Modified file:** `src/app/login/page.tsx` (or `LoginForm`)

After successful login, check `sessionStorage.getItem('pendingInviteToken')`.
If present, clear it and `router.push('/invite?token=<token>')`.

Data flow:
```
Unauthenticated user → /invite?token=abc123
  └─ InviteContent: getUser() → no session
  └─ sessionStorage.setItem('pendingInviteToken', 'abc123')
  └─ router.push('/login?redirectTo=/invite')

User logs in
  └─ LoginForm: onLogin success
  └─ check sessionStorage.getItem('pendingInviteToken')
  └─ if present → clear → router.push('/invite?token=abc123')

/invite?token=abc123 (now authenticated)
  └─ getUser() → session exists
  └─ POST /api/invitations/accept { token: 'abc123' }
  └─ success → router.push('/dashboard')
```

---

#### Fix 1.10 — 410 Gone for Expired Tokens

**Modified file:** `src/app/api/invitations/accept/route.ts`

Split the query into two steps:
1. Fetch invitation by token (no date filter).
2. If not found → 404.
3. If found but `expires_at < now` → 410 with CTA.
4. If found and valid → proceed with acceptance.

API contract change:
```
HTTP 410 Gone
{
  "error": "Invitation expired",
  "cta": "Request new invite",
  "invited_by_email": "admin@tenant.com"   // if available
}
```

---

#### Fix 1.11 — Existing Member Guard

**Modified file:** `src/app/api/invitations/accept/route.ts`

After fetching the valid invitation, query `profiles` for the current user:
```
SELECT tenant_id FROM profiles WHERE id = session.user.id
```
If `profile.tenant_id === invitation.tenant_id`:
- Mark invitation as `accepted`.
- Return `{ success: true, already_member: true }` with HTTP 200.
- Do NOT call `profiles.update(...)`.

Data flow:
```
POST /api/invitations/accept { token }
  └─ fetch invitation (valid, not expired)
  └─ fetch current user profile
  └─ if profile.tenant_id === invitation.tenant_id
       └─ UPDATE tenant_invitations SET status='accepted'
       └─ return 200 { success: true, already_member: true }
  └─ else
       └─ UPDATE profiles SET tenant_id, role
       └─ UPDATE tenant_invitations SET status='accepted'
       └─ return 200 { success: true, already_member: false }
```

---

#### Fix 1.12 — Inline 409 Error in InvitesTab

**Modified file:** `src/components/admin/InvitesTab.tsx`

Add `error` and `onError` props to the component interface. Display the error
inline below the submit button when set. Do not clear the email field on error.

**Modified file:** `src/components/admin/UserManagementPanel.tsx`

In `handleInvite`, on 409 response, call `setInviteError(json.error)` and pass
it to `<InvitesTab error={inviteError} />` instead of the panel-level error state.

Data flow:
```
InvitesTab: user submits email
  └─ POST /api/admin/invite
       ├─ 201 → loadData(), clear email field
       └─ 409 → setInviteError("A pending invitation already exists for this email")
                 email field retains value
                 inline error renders below form
```

---

### Area 5 — Dashboard Notification System

#### Fix 1.13 — Optimistic Update + Background Re-fetch

**New file:** `src/hooks/useInvitations.ts`

Extract invitation state management from `DashboardScreen` into a dedicated hook:
- `invitations` state
- `fetchInvitations()` — fetches from `/api/invitations/pending`
- `acceptInvitation(id)` — optimistic remove, POST accept, background re-fetch
- `declineInvitation(id)` — optimistic remove, POST decline, background re-fetch
- `fetchError` state + `dismissError()` — for bug 1.14

**Modified file:** `src/components/DashboardScreen.tsx`
- Replace inline invitation logic with `useInvitations()`.
- Remove `window.location.reload()` entirely.

Data flow:
```
User clicks Accept on InvitationBanner
  └─ acceptInvitation(id)
       └─ setInvitations(prev => prev.filter(i => i.id !== id))  ← optimistic
       └─ POST /api/invitations/accept { invitationId: id }
       └─ fetchInvitations()  ← background re-fetch to confirm
            └─ GET /api/invitations/pending → update state
  // window.location.reload() is NEVER called
```

---

#### Fix 1.14 — Retry + Dismissible Warning Banner

**Modified file:** `src/hooks/useInvitations.ts` (same hook as above)

`fetchInvitations()` implementation:
```
async function fetchInvitations(isRetry = false) {
  try {
    const res = await fetch('/api/invitations/pending')
    if (!res.ok) throw new Error(res.statusText)
    const json = await res.json()
    setInvitations(json.data ?? [])
    setFetchError(null)
  } catch (err) {
    if (!isRetry) {
      setTimeout(() => fetchInvitations(true), 3000)
    } else {
      setFetchError("Could not load invitations. Check your connection.")
    }
  }
}
```

**Modified file:** `src/components/DashboardScreen.tsx`
- Render a dismissible warning banner when `fetchError` is set.
- Banner includes a dismiss button that calls `dismissError()`.

Data flow:
```
fetchInvitations() → network error
  └─ setTimeout(fetchInvitations(retry=true), 3000)
       ├─ success → setInvitations(data), setFetchError(null)
       └─ failure → setFetchError("Could not load invitations. Check your connection.")
                     render dismissible warning banner
```


---

## Database Schema Changes

### New Migration: set_tenant_context RPC

```sql
-- supabase/migrations/YYYYMMDD_set_tenant_context_rpc.sql
CREATE OR REPLACE FUNCTION set_tenant_context(tenant_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  PERFORM set_config('app.current_tenant', tenant_id::text, true);
END;
$$;
```

### New Migration: create_tenant_atomic RPC

```sql
-- supabase/migrations/YYYYMMDD_create_tenant_atomic.sql
-- (full body shown in Fix 1.7 above)
-- Grants: EXECUTE to authenticated role only
REVOKE ALL ON FUNCTION create_tenant_atomic(text, text, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION create_tenant_atomic(text, text, uuid) TO authenticated;
```

### New Migration: invitation delivery_status column

```sql
-- supabase/migrations/YYYYMMDD_invitation_delivery_status.sql
ALTER TABLE tenant_invitations
  ADD COLUMN IF NOT EXISTS delivery_status text
    CHECK (delivery_status IN ('pending', 'sent', 'failed'))
    DEFAULT 'pending';

COMMENT ON COLUMN tenant_invitations.delivery_status IS
  'Email delivery outcome: pending (not yet attempted), sent, failed';
```

### No New Tables Required

All fixes operate on existing tables: `tenants`, `tenant_settings`, `profiles`,
`tenant_invitations`, `audit_log`.

---

## API Contract Changes

| Endpoint | Change |
|---|---|
| `GET /api/health` | **New.** Returns `{ status: "ok", timestamp: ISO8601 }` |
| `POST /api/admin/tenant` | Response now includes `{ tenant_id, name, slug }` (unchanged shape, but admin profile is now atomically updated) |
| `POST /api/admin/invite` | Response now includes `delivery_status` field on the invitation object |
| `POST /api/invitations/accept` | Now returns 410 for expired tokens (was 404). Returns `{ already_member: true }` for existing members (was profile overwrite). |
| `GET /api/invitations/pending` | No contract change — shape unchanged |

---

## Component / Module Breakdown

```
src/
├── app/
│   ├── api/
│   │   ├── health/
│   │   │   └── route.ts                    [NEW] Bug 1.1
│   │   ├── admin/
│   │   │   ├── tenant/route.ts             [MOD] Bug 1.7 — atomic RPC
│   │   │   ├── invite/route.ts             [MOD] Bug 1.8 — email + delivery_status
│   │   │   └── users/route.ts              [MOD] Bug 1.6 — check order fix
│   │   └── invitations/
│   │       └── accept/route.ts             [MOD] Bugs 1.10, 1.11 — 410 + member guard
│   ├── dashboard/
│   │   └── page.tsx                        [MOD] Bug 1.5 — RSC guest gate
│   └── invite/
│       └── page.tsx                        [MOD] Bug 1.9 — sessionStorage + redirect
├── components/
│   ├── DashboardScreen.tsx                 [MOD] Bugs 1.3, 1.4, 1.13, 1.14
│   ├── admin/
│   │   ├── InvitesTab.tsx                  [MOD] Bug 1.12 — inline error prop
│   │   └── UserManagementPanel.tsx         [MOD] Bug 1.12 — pass error to InvitesTab
│   └── dashboard/
│       ├── GuestDashboard.tsx              [NEW] Bug 1.5
│       └── InvitationBanner.tsx            [no change — presentation only]
├── hooks/
│   ├── useAuthRefresh.ts                   [NEW] Bug 1.3
│   ├── useSessionRole.ts                   [NEW] Bug 1.4
│   └── useInvitations.ts                   [NEW] Bugs 1.13, 1.14
└── lib/
    └── supabase/
        └── server.ts                       [MOD] Bug 1.2 — withTenantContext helper

supabase/
├── migrations/
│   ├── YYYYMMDD_set_tenant_context_rpc.sql [NEW] Bug 1.2
│   ├── YYYYMMDD_create_tenant_atomic.sql   [NEW] Bug 1.7
│   └── YYYYMMDD_invitation_delivery_status.sql [NEW] Bug 1.8
└── functions/
    └── send-invitation-email/
        └── index.ts                        [NEW] Bug 1.8
```


---

## Testing Strategy

### Validation Approach

Two-phase approach for each bug:
1. **Exploratory** — run tests against unfixed code to confirm the bug fires and understand the root cause.
2. **Fix + Preservation** — run tests against fixed code to verify the property holds and no regression is introduced.

All unit and property-based tests use Vitest + jsdom + Testing Library.
E2E tests use Playwright against a local dev server with seeded users only.

---

### Exploratory Bug Condition Checking

**Goal:** Surface counterexamples on unfixed code before implementing any fix.

| Bug | Exploratory Test | Expected Failure on Unfixed Code |
|-----|-----------------|----------------------------------|
| 1.1 | Start Playwright without `webServer` wait; run first test immediately | Intermittent 503 / connection refused |
| 1.2 | Seed TENANT_ADMIN, log in, call `profiles.select(*)` — assert row count > 0 | Returns `[]` (RLS blocks due to missing `app.current_tenant`) |
| 1.3 | Mock `Date.now()` to return `expiresAt - 200s`; assert `refreshSession` was called | `refreshSession` never called |
| 1.4 | Render `DashboardScreen` with VIEWER session; assert `UserManagementPanel` absent | Panel is present in DOM |
| 1.5 | Navigate to `/dashboard` as GUEST; assert `ExportPanel` not rendered | Panel is rendered |
| 1.6 | PATCH `/api/admin/users` with cross-tenant userId; assert no DB write occurred | DB write may occur before 403 |
| 1.7 | POST `/api/admin/tenant`; assert `profiles` has TENANT_ADMIN for new tenant | No profile update |
| 1.8 | POST `/api/admin/invite`; assert `delivery_status` column exists and is `sent` | Column absent / no email call |
| 1.9 | Visit `/invite?token=x` unauthenticated; assert `sessionStorage` has token | Token discarded, no sessionStorage write |
| 1.10 | POST accept with expired token; assert HTTP 410 | Returns 404 |
| 1.11 | Accept invite as existing member; assert profile unchanged | Profile overwritten |
| 1.12 | Submit duplicate invite; assert inline error visible, email field not cleared | Silent failure, email cleared |
| 1.13 | Accept invitation; assert `window.location.reload` not called | `reload` is called |
| 1.14 | Mock fetch to fail; assert retry after 3s and warning banner shown | No retry, no banner |

---

### Fix Checking

**Goal:** For all inputs where `isBugCondition` returns true, verify `expectedBehavior` holds after the fix.

```
FOR ALL input WHERE isBugCondition_N(input) DO
  result := fixedFunction(input)
  ASSERT expectedBehavior_N(result)
END FOR
```

Key fix checks per property:

- **P1**: `GET /api/health` returns 200 `{ status: "ok" }` — unit test the route handler.
- **P2**: After `withTenantContext(client, tenantId)`, a `SELECT current_setting('app.current_tenant')` returns the correct UUID — integration test against local PostGIS.
- **P3**: With mocked `Date.now()` at `expiresAt - 200s`, `refreshSession` is called within 60s — Vitest fake timers.
- **P4**: Render `DashboardScreen` with VIEWER role → `UserManagementPanel` not in DOM.
- **P5**: RSC renders `GuestDashboard` for GUEST session → `ExportPanel`, `AnalysisResultPanel`, `UserManagementPanel` absent.
- **P6**: PATCH with cross-tenant userId → 403 returned, `assign_user_role` RPC never called (spy assertion).
- **P7**: POST `/api/admin/tenant` → single `create_tenant_atomic` RPC call → `profiles` row has `role='TENANT_ADMIN'` and correct `tenant_id`.
- **P8**: POST `/api/admin/invite` → Edge Function called → `delivery_status = 'sent'` on invitation row.
- **P9**: Visit `/invite?token=x` unauthenticated → `sessionStorage.getItem('pendingInviteToken') === 'x'` → redirected to `/login`.
- **P10**: POST accept with expired token → HTTP 410 with `{ error: "Invitation expired", cta: "Request new invite" }`.
- **P11**: POST accept as existing member → HTTP 200 `{ already_member: true }` → profile row unchanged.
- **P12**: Submit duplicate invite → inline error visible → email field value unchanged.
- **P13**: Accept invitation → `window.location.reload` spy never called → invitation removed from list → re-fetch triggered.
- **P14**: Mock fetch to fail twice → retry fires after 3s → warning banner rendered → dismiss button works.

---

### Preservation Checking

**Goal:** For all inputs where `isBugCondition` returns false, the fixed system produces the same result as the original.

```
FOR ALL input WHERE NOT isBugCondition_N(input) DO
  ASSERT originalFunction(input) = fixedFunction(input)
END FOR
```

Key preservation checks:

- Valid email/password login → session created, redirect to `/dashboard` (P15, req 3.1).
- Logout → session cleared, redirect to `/login` (req 3.2).
- Google OAuth callback → not modified, flow unchanged (req 3.3).
- PLATFORM_ADMIN `GET /api/admin/users` → returns all tenants' users (req 3.4).
- TENANT_ADMIN `GET /api/admin/users` → returns own tenant only (req 3.5).
- `canImpersonate()` rules unchanged — no self, no PLATFORM_ADMIN, no cross-tenant (req 3.6).
- Valid non-expired token + matching authenticated user → profile updated, invitation accepted (req 3.7).
- Decline invitation → marked `declined`, membership unchanged (req 3.8).
- New tenant → `tenant_settings` row with `primary_color: '#00D1FF'` (req 3.9).
- `getTenantConfig()` → returns white-label config or `WHITELABEL_DEFAULTS` (req 3.10).
- RLS policies still enforce tenant isolation on all scoped tables (req 3.11).
- POPIA annotation blocks present on all personal-data files (req 3.12).

---

### Unit Tests

**File:** `src/__tests__/unit/health.test.ts`
- `GET /api/health` returns 200 with `{ status: "ok" }`.

**File:** `src/__tests__/unit/supabase-tenant-context.test.ts`
- `withTenantContext` calls `set_tenant_context` RPC with correct UUID.
- Missing `tenant_id` throws rather than silently proceeding.

**File:** `src/__tests__/unit/useAuthRefresh.test.ts`
- `onAuthStateChange` listener registered on mount.
- `refreshSession` called when `expiresAt - now < 300` (Vitest fake timers).
- Toast shown on refresh failure.

**File:** `src/__tests__/unit/useSessionRole.test.ts`
- Returns correct `CanonicalRole` from profile query.
- Returns `GUEST` when no session.

**File:** `src/__tests__/unit/dashboard-role-gate.test.ts`
- `UserManagementPanel` absent for GUEST, VIEWER, ANALYST, POWER_USER.
- `UserManagementPanel` present for TENANT_ADMIN, PLATFORM_ADMIN.

**File:** `src/__tests__/unit/invitations-accept.test.ts`
- Expired token → 410 with CTA body.
- Existing member → 200 `{ already_member: true }`, profile unchanged.
- Valid token + new user → 200 `{ already_member: false }`, profile updated.

**File:** `src/__tests__/unit/invites-tab-error.test.ts`
- 409 response → inline error rendered, email field value preserved.
- 201 response → email field cleared, no error shown.

**File:** `src/__tests__/unit/useInvitations.test.ts`
- Accept → optimistic remove → re-fetch triggered → `window.location.reload` never called.
- Decline → optimistic remove → no reload.
- Fetch failure → retry after 3s → second failure → `fetchError` set.
- `dismissError()` clears `fetchError`.

---

### Property-Based Tests

Using Vitest with a fast-check style approach (or `@fast-check/vitest`):

**Property: Tenant context always set before RLS query (P2)**
```
FOR ALL tenantId: UUID
  client = withTenantContext(mockClient, tenantId)
  ASSERT mockClient.rpc.calledWith('set_tenant_context', { tenant_id: tenantId })
  ASSERT callOrder: set_tenant_context BEFORE any .from() call
```

**Property: Admin UI hidden for all non-admin roles (P4)**
```
FOR ALL role IN { GUEST, VIEWER, ANALYST, POWER_USER }
  render DashboardScreen with role
  ASSERT UserManagementPanel NOT in document
  ASSERT ImpersonationModal NOT in document
```

**Property: Guest dashboard never shows protected components (P5)**
```
FOR ALL component IN { ExportPanel, AnalysisResultPanel, UserManagementPanel,
                       PropertyDetailPanel, risk_layer_controls }
  render /dashboard as GUEST
  ASSERT component NOT in document
```

**Property: Cross-tenant PATCH always returns 403 before DB write (P6)**
```
FOR ALL (callerTenantId, targetTenantId) WHERE callerTenantId != targetTenantId
  PATCH /api/admin/users with cross-tenant userId
  ASSERT response.status === 403
  ASSERT assign_user_role_spy.callCount === 0
```

**Property: Atomic tenant creation — every tenant has exactly one TENANT_ADMIN (P7)**
```
FOR ALL (name, slug, adminUserId): valid inputs
  POST /api/admin/tenant
  ASSERT tenants.count(id = new_id) === 1
  ASSERT tenant_settings.count(tenant_id = new_id) === 1
  ASSERT profiles.count(tenant_id = new_id AND role = 'TENANT_ADMIN') === 1
```

**Property: Invite token persistence for all token formats (P9)**
```
FOR ALL token: non-empty string (UUID, short, long, special chars)
  visit /invite?token=<token> unauthenticated
  ASSERT sessionStorage.getItem('pendingInviteToken') === token
  ASSERT router.push called with '/login?redirectTo=/invite'
```

**Property: No reload on any accept/decline action (P13)**
```
FOR ALL invitationId: UUID
  FOR ALL action IN { accept, decline }
    perform action(invitationId)
    ASSERT window.location.reload.callCount === 0
    ASSERT invitations does not contain invitationId (optimistic)
```

**Property: Retry exactly once on fetch failure (P14)**
```
FOR ALL failureType IN { NetworkError, 500, 503 }
  mock fetch to fail with failureType
  trigger fetchInvitations()
  advance timers by 3000ms
  ASSERT fetch.callCount === 2  (initial + 1 retry)
  ASSERT fetchError set after second failure
```

---

### Integration Tests (Playwright E2E)

All E2E tests use seeded users only. No new user creation.

**File:** `src/__tests__/e2e/auth-session.spec.ts`
- Verify `/api/health` returns 200 before any test runs (readiness gate).
- Seeded TENANT_ADMIN logs in → dashboard loads with tenant-scoped data (not empty).
- Session active for 55 minutes → token refresh triggered → no 401 errors.

**File:** `src/__tests__/e2e/rbac-enforcement.spec.ts`
- Seeded VIEWER logs in → `UserManagementPanel` not visible in DOM.
- Seeded GUEST navigates to `/dashboard` → only basemap/zoning/stats visible.
- TENANT_ADMIN attempts cross-tenant role change via API → 403 returned.

**File:** `src/__tests__/e2e/tenant-onboarding.spec.ts`
- PLATFORM_ADMIN creates new tenant → tenant row, settings row, and TENANT_ADMIN profile all exist.
- TENANT_ADMIN sends invitation → `delivery_status` is `sent` or `failed` (not `pending`).

**File:** `src/__tests__/e2e/invitation-flow.spec.ts`
- Unauthenticated user visits invite link → redirected to login → after login, redirected back to invite → invitation accepted.
- Expired token → 410 page with "Request new invite" CTA visible.
- Existing member accepts invite → `already_member: true` response → profile unchanged.
- Duplicate invite → inline error in InvitesTab, email field not cleared.

**File:** `src/__tests__/e2e/dashboard-notifications.spec.ts`
- Accept invitation via banner → no page reload → banner item removed → re-fetch confirms.
- Simulate network failure on pending fetch → retry after 3s → warning banner appears → dismiss works.


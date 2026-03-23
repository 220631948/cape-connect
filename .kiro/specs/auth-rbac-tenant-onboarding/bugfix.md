# Bugfix Requirements Document

## Introduction

CapeTown GIS Hub is a multi-tenant PWA with a 6-tier RBAC hierarchy
(`GUEST → VIEWER → ANALYST → POWER_USER → TENANT_ADMIN → PLATFORM_ADMIN`).
The system uses Supabase Auth (GoTrue) for authentication, PostgreSQL RLS for
tenant isolation, and a Next.js 15 App Router frontend.

This document captures the defects and gaps in the end-to-end flow covering:
authentication validation, RBAC enforcement across all role tiers, tenant
onboarding (organisation creation + user invitation), invite-link acceptance,
and the dashboard notification system. The goal is to make all of these flows
reliable, testable, and regression-safe using existing seeded users only.

---

## Bug Analysis

### Current Behavior (Defect)

**Authentication & Session**

1.1 WHEN the backend (FastAPI) and frontend (Next.js) are started without a
    coordinated process, THEN the system has no reliable way to verify both
    services are healthy before running E2E tests, causing intermittent
    test failures due to race conditions.

1.2 WHEN a seeded Supabase user logs in with valid credentials, THEN the system
    does not consistently inject `app.current_tenant` into the PostgreSQL
    session context, causing RLS policies to silently fail and return empty
    result sets instead of the expected tenant-scoped data.

1.3 WHEN a user's JWT expires mid-session (1h lifetime), THEN the system does
    not reliably trigger a token refresh, leaving the user in a broken
    authenticated-but-unauthorized state with no visible feedback.

**RBAC Enforcement**

1.4 WHEN a VIEWER-role user attempts to access admin-only API routes
    (`/api/admin/*`), THEN the system returns a 403 but the frontend does not
    hide or disable the admin UI elements, exposing controls that should not
    be visible to that role.

1.5 WHEN a GUEST user navigates directly to `/dashboard`, THEN the system does
    not enforce the guest-mode restrictions defined in CLAUDE.md §6, allowing
    access to protected data layers and property details.

1.6 WHEN a TENANT_ADMIN attempts to change the role of a user in a different
    tenant, THEN the system's application-layer check in
    `/api/admin/users` (PATCH) does not always fire before the RLS check,
    creating an inconsistent enforcement order.

**Tenant Onboarding**

1.7 WHEN a PLATFORM_ADMIN creates a new tenant via `POST /api/admin/tenant`,
    THEN the system creates the tenant and default `tenant_settings` row but
    does not assign the requesting admin as the initial `TENANT_ADMIN` of the
    new organisation, leaving the tenant with no owner.

1.8 WHEN a TENANT_ADMIN sends an invitation via `POST /api/admin/invite`,
    THEN the system inserts a `tenant_invitations` row and returns the token
    in development mode, but does not send an email notification, so the
    invited user has no way to discover the invite link in non-development
    environments.

**Invitation Flow**

1.9 WHEN an invited user clicks an invite link (`/invite?token=<token>`) while
    not yet authenticated, THEN the system calls `POST /api/invitations/accept`
    which immediately returns 401 (no session), and the token is silently
    discarded — the user is redirected to login with no mechanism to resume
    the invite flow after authentication.

1.10 WHEN an invitation token has expired (`expires_at` in the past), THEN the
     system returns a generic "Invalid or expired invitation" error with no
     guidance on how to request a new invite.

1.11 WHEN a user who is already a member of a tenant attempts to accept a
     second invitation to the same tenant, THEN the system updates the
     `profiles` row (overwriting the existing `tenant_id` and `role`) without
     validating whether the user is already an active member, potentially
     downgrading their role silently.

1.12 WHEN two invitations are sent to the same email for the same tenant,
     THEN the system correctly returns a 409 conflict on the second insert,
     but the frontend `InvitesTab` does not surface this error to the admin,
     showing a silent failure.

**Dashboard Notification System**

1.13 WHEN a user has pending invitations, THEN the `InvitationBanner` component
     fetches from `/api/invitations/pending` on mount but does not poll or
     re-fetch after the user accepts/declines, requiring a full page reload
     (`window.location.reload()`) to reflect the updated state — breaking the
     SPA experience.

1.14 WHEN the `/api/invitations/pending` request fails (network error or 5xx),
     THEN the system silently swallows the error and renders no banner, with
     no fallback or retry mechanism, leaving the user unaware of pending
     invitations.

---

### Expected Behavior (Correct)

**Authentication & Session**

2.1 WHEN the backend and frontend are started, THEN the system SHALL provide a
    health-check mechanism (e.g., `/api/health` endpoint + readiness probe)
    that E2E tests can poll before executing, eliminating race-condition
    failures.

2.2 WHEN a seeded Supabase user logs in, THEN the system SHALL inject
    `app.current_tenant` into the PostgreSQL session via the server-side
    Supabase client before any RLS-protected query executes, ensuring
    tenant-scoped data is returned correctly.

2.3 WHEN a user's JWT is within 5 minutes of expiry, THEN the system SHALL
    proactively refresh the token using the Supabase `onAuthStateChange`
    listener and SHALL display a non-blocking toast if the refresh fails,
    prompting the user to re-authenticate.

**RBAC Enforcement**

2.4 WHEN a VIEWER-role user is authenticated, THEN the system SHALL hide all
    admin UI elements (UserManagementPanel, ImpersonationModal, admin tabs)
    by checking the canonical role from the session profile, not from the
    JWT claims alone.

2.5 WHEN a GUEST user navigates to `/dashboard`, THEN the system SHALL enforce
    guest-mode restrictions per CLAUDE.md §6: basemap, suburb boundaries,
    zoning overlay, and aggregate stats only — no property details, no risk
    layers, no export, no saved searches.

2.6 WHEN a TENANT_ADMIN attempts a cross-tenant role change, THEN the system
    SHALL enforce the tenant-mismatch check at the application layer
    (before the Supabase query) and SHALL return 403 with a clear
    `"Forbidden: tenant mismatch"` message.

**Tenant Onboarding**

2.7 WHEN a PLATFORM_ADMIN creates a new tenant, THEN the system SHALL
    atomically assign the requesting admin's profile `tenant_id` to the new
    tenant and set their role to `TENANT_ADMIN` within the same database
    transaction, ensuring every tenant has an owner on creation.

2.8 WHEN a TENANT_ADMIN sends an invitation, THEN the system SHALL trigger an
    email delivery mechanism (Supabase Edge Function or equivalent) containing
    the invite link, and SHALL record a `delivery_status` on the
    `tenant_invitations` row (`sent | failed`).

**Invitation Flow**

2.9 WHEN an unauthenticated user clicks an invite link, THEN the system SHALL
    persist the invite token in `sessionStorage` (or as a query param on the
    login redirect), redirect to `/login?redirectTo=/invite?token=<token>`,
    and SHALL automatically resume the acceptance flow after successful
    authentication.

2.10 WHEN an expired invitation token is presented, THEN the system SHALL
     return a 410 Gone response with a user-facing message that includes the
     inviting admin's contact or a "Request new invite" CTA.

2.11 WHEN a user who is already an active member of a tenant accepts an
     invitation to the same tenant, THEN the system SHALL detect the existing
     membership, skip the profile update, mark the invitation as `accepted`,
     and return a 200 with `"already_member": true` in the response body.

2.12 WHEN a duplicate invitation is attempted, THEN the system SHALL surface
     the 409 conflict error in the `InvitesTab` UI as an inline error message
     adjacent to the invite form, without clearing the email field.

**Dashboard Notification System**

2.13 WHEN a user accepts or declines an invitation via the `InvitationBanner`,
     THEN the system SHALL update the banner state optimistically (remove the
     item from the list) and SHALL re-fetch `/api/invitations/pending` in the
     background to confirm, without triggering a full page reload.

2.14 WHEN `/api/invitations/pending` fails, THEN the system SHALL retry once
     after 3 seconds, and if the retry also fails, SHALL display a dismissible
     warning banner: "Could not load invitations. Check your connection."

---

### Unchanged Behavior (Regression Prevention)

**Authentication**

3.1 WHEN a user logs in with valid email/password credentials, THEN the system
    SHALL CONTINUE TO authenticate via Supabase GoTrue and redirect to the
    dashboard without breaking the existing `LoginScreen` → `onLogin` callback
    flow.

3.2 WHEN a user logs out, THEN the system SHALL CONTINUE TO clear the Supabase
    session cookie and redirect to `/login`, preserving the existing session
    cleanup behaviour.

3.3 WHEN Google OAuth is used for login, THEN the system SHALL CONTINUE TO
    support the OAuth callback flow without modification.

**RBAC**

3.4 WHEN a PLATFORM_ADMIN accesses `/api/admin/users`, THEN the system SHALL
    CONTINUE TO return all users across all tenants (no tenant filter applied),
    preserving the existing cross-tenant visibility for platform admins.

3.5 WHEN a TENANT_ADMIN accesses `/api/admin/users`, THEN the system SHALL
    CONTINUE TO return only users within their own tenant, preserving the
    existing tenant-scoped filter.

3.6 WHEN `canImpersonate()` is called, THEN the system SHALL CONTINUE TO
    enforce the existing impersonation rules: no self-impersonation, no
    PLATFORM_ADMIN impersonation, and TENANT_ADMIN cross-tenant block.

**Invitation Flow**

3.7 WHEN a valid, non-expired invitation token is presented by an authenticated
    user whose email matches the invitation, THEN the system SHALL CONTINUE TO
    update the user's `profiles` row (`tenant_id`, `role`) and mark the
    invitation as `accepted`.

3.8 WHEN a user declines an invitation, THEN the system SHALL CONTINUE TO mark
    the `tenant_invitations` row as `declined` and remove it from the pending
    list without affecting the user's current tenant membership.

**Tenant Settings**

3.9 WHEN a tenant is created, THEN the system SHALL CONTINUE TO insert a
    default `tenant_settings` row with `primary_color: '#00D1FF'` and the
    tenant's name as `brand_name`.

3.10 WHEN `getTenantConfig()` is called for a valid tenant, THEN the system
     SHALL CONTINUE TO return the white-label config (colors, brand name, logo,
     font, features) from `tenant_settings`, falling back to
     `WHITELABEL_DEFAULTS` if the row is absent.

**RLS & POPIA**

3.11 WHEN any query touches a tenant-scoped table (`profiles`, `audit_log`,
     `tenant_invitations`, `tenant_settings`, etc.), THEN the system SHALL
     CONTINUE TO enforce RLS policies requiring `tenant_id` isolation, per
     CLAUDE.md Rule 4.

3.12 WHEN any file handles personal data (email, user ID, role), THEN the
     system SHALL CONTINUE TO carry the POPIA annotation block per CLAUDE.md
     Rule 5.

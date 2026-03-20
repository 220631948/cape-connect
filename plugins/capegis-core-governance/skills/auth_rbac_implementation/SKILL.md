---
name: auth-rbac-implementation
description: Implement Supabase Auth and the six-tier RBAC permission system for the CapeTown GIS Hub. Covers JWT storage in httpOnly cookies using @supabase/ssr (never localStorage), silent token refresh, tenant resolution middleware (subdomain → tenant_id), RBAC role hierarchy (GUEST→PLATFORM_ADMIN), in-memory permission checks, and POPIA consent flow at registration. Use this skill whenever the user is implementing authentication, login, logout, protected routes, JWT handling, role-based access control, permission checks, tenant routing middleware, session management, POPIA consent flow, or anything involving user roles and access. Required for Milestone M2.
---

# Auth + RBAC Implementation

## Purpose

Implement Supabase Auth with JWT in httpOnly cookies, six-tier RBAC role hierarchy, tenant-aware middleware, and POPIA-compliant registration flow.

**Milestone:** M2 — Auth, RBAC, POPIA Consent. Depends on M1 (database schema).

---

## RBAC Role Hierarchy

```
GUEST → VIEWER → ANALYST → POWER_USER → TENANT_ADMIN → PLATFORM_ADMIN
```

Never use numeric levels in code — use the named enum for clarity:

```typescript
// lib/auth/permissions.ts
export type Role = 
  | 'GUEST' 
  | 'VIEWER' 
  | 'ANALYST' 
  | 'POWER_USER' 
  | 'TENANT_ADMIN' 
  | 'PLATFORM_ADMIN';

const ROLE_HIERARCHY: Record<Role, number> = {
  GUEST: 1,
  VIEWER: 2,
  ANALYST: 3,
  POWER_USER: 4,
  TENANT_ADMIN: 5,
  PLATFORM_ADMIN: 6,
};

export function hasPermission(userRole: Role, requiredRole: Role): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

// Usage in components:
// if (!hasPermission(user.role, 'ANALYST')) return <UpgradePrompt />;
// if (!hasPermission(user.role, 'TENANT_ADMIN')) return redirect('/403');
```

---

## Permission Matrix

| Feature | GUEST | VIEWER | ANALYST | POWER_USER | TENANT_ADMIN | PLATFORM_ADMIN |
|---------|:-----:|:------:|:-------:|:----------:|:------------:|:--------------:|
| View map + basemap | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Search & filter | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| View property details | ❌¹ | ✅ | ✅ | ✅ | ✅ | ✅ |
| View valuation data | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Save favourites/searches | ❌ | ❌²| ✅ | ✅ | ✅ | ✅ |
| Draw & spatial analysis | ❌ | ❌ | ✅³| ✅ | ✅ | ✅ |
| Export CSV / GeoJSON | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| Analytics dashboard | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Manage tenant users | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| Access all tenant data | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |

> ¹ Guests see non-PII property details (Erf number, suburb) but not valuations.  
> ² VIEWER free tier: max 3 favourites, 1 saved search; over limit triggers upgrade prompt.  
> ³ Advanced analysis features may be gated to POWER_USER per pricing model.

---

## JWT Storage — httpOnly Cookies (Critical)

**Never store JWT in `localStorage`** — default `supabase-js` does this and is vulnerable to XSS. Use `@supabase/ssr` for httpOnly cookie storage:

```typescript
// lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export function createClient() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name) => cookieStore.get(name)?.value,
        set: (name, value, options) => cookieStore.set({ name, value, ...options }),
        remove: (name, options) => cookieStore.set({ name, value: '', ...options }),
      },
    }
  );
}
```

```typescript
// lib/supabase/client.ts  (browser-side)
import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

| Token | Storage | Lifetime |
|-------|---------|----------|
| Access token (JWT) | In-memory (Supabase client) | 1 hour |
| Refresh token | `httpOnly` cookie | 7 days |
| Session cookie | `httpOnly`, `Secure`, `SameSite=Lax` | Session |

---

## Middleware — Tenant + Session Resolution

Every request must refresh the Supabase session and resolve the tenant from the subdomain:

```typescript
// middleware.ts
import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  // 1. Refresh Supabase session (prevents expired JWT on navigation)
  const response = await updateSession(request);

  // 2. Resolve tenant from subdomain (e.g., stellenbosch.capegis.com → 'stellenbosch')
  const hostname = request.headers.get('host') || '';
  const subdomain = hostname.split('.')[0];
  response.headers.set('x-tenant-slug', subdomain);

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/health).*)'],
};
```

> **Security:** JWT `tenant_id` claim must match the subdomain-resolved tenant. Mismatches → 403 (prevent cross-tenant access via URL manipulation).

---

## Session Variables for RLS

The database RLS policy reads `app.current_tenant`. Set this at connection time via a Supabase RPC or connection hook:

```typescript
// lib/supabase/set-tenant-context.ts
export async function setTenantContext(supabase: SupabaseClient, tenantId: string) {
  await supabase.rpc('set_tenant_context', { tenant_id: tenantId });
}
```

```sql
-- supabase/migrations/xxx_set_tenant_context.sql
CREATE OR REPLACE FUNCTION set_tenant_context(tenant_id UUID)
RETURNS void LANGUAGE sql SECURITY DEFINER AS $$
  SELECT set_config('app.current_tenant', tenant_id::text, true);
$$;
```

This enables the canonical RLS pattern (CLAUDE.md §4):
```sql
USING (tenant_id = current_setting('app.current_tenant', TRUE)::uuid)
```

---

## POPIA Consent Flow (Rule 5)

Registration must include a mandatory, unchecked POPIA consent checkbox:

```typescript
// app/auth/register/page.tsx
export default function RegisterPage() {
  const [consentChecked, setConsentChecked] = useState(false);

  return (
    <form>
      <input type="email" name="email" required />
      <input type="password" name="password" minLength={8} required />
      
      {/* POPIA consent — must NOT be pre-checked */}
      <label>
        <input
          type="checkbox"
          checked={consentChecked}
          onChange={(e) => setConsentChecked(e.target.checked)}
        />
        I consent to the processing of my personal information for access to 
        Cape Town GIS services, in accordance with POPIA.
      </label>
      
      <button type="submit" disabled={!consentChecked}>
        Create Account
      </button>
    </form>
  );
}
```

Store `consent_version` (date of policy) in `profiles` table so you can re-prompt when policy changes.

---

## Guest Mode (CLAUDE.md §6)

Guests are unauthenticated users who may browse the map. Guest mode requirements:

- **Can see:** basemap, suburb boundaries, zoning overlay, aggregate stats, parcel outlines (zoom ≥ 14, no PII)
- **Cannot see:** property details, valuation data, risk layers, analytics
- **No PII collection** for guests (POPIA)
- **Sign-up prompts:** max 3 per session before suppressing

```typescript
// hooks/useGuestGuard.ts
export function useGuestGuard(requiredRole: Role = 'VIEWER') {
  const { user, role } = useAuth();
  const promptCount = useRef(0);

  if (!user || !hasPermission(role ?? 'GUEST', requiredRole)) {
    if (promptCount.current < 3) {
      promptCount.current++;
      return { canAccess: false, showPrompt: true };
    }
    return { canAccess: false, showPrompt: false };
  }

  return { canAccess: true, showPrompt: false };
}
```

---

## Load-Shedding Session Resilience

Sessions must survive unexpected browser close (power outages, load-shedding):

```
Power cut mid-session
  → Browser closes
  → Power restored, user reopens browser
  → Refresh token in httpOnly cookie? 
      Yes → Silent token exchange → new JWT → Map state restored from Zustand persist
      No/expired → Redirect to /login
```

Zustand map state must use `sessionStorage` persist (not `localStorage`) so it clears on new sessions but survives page reloads.

---

## Failure Modes

| Failure | Behavior | Recovery |
|---------|----------|----------|
| Supabase Auth unavailable | Forms show error | Retry with exponential backoff |
| JWT expired + refresh fails | Redirect to `/login?returnTo=...` | Re-authenticate; `returnTo` preserved |
| Rate-limited (5 failed logins in 15 min) | "Too many attempts" toast | 60-second cooldown |
| POPIA consent unchecked | Submit button disabled | User checks box |
| `tenant_id` mismatch (JWT vs subdomain) | 403 response | Log security event; force re-auth |
| Role downgrade mid-session | Next API call → 403 | "Permissions changed" toast; UI updates |
| Google OAuth email mismatch | Reject | "Email mismatch" error |

---

## Security Checklist

- [ ] JWT in `httpOnly` cookie (via `@supabase/ssr`) — never `localStorage`
- [ ] CSRF protection via `SameSite=Lax` cookie attribute
- [ ] Rate limiting: max 5 failed logins per 15 minutes per IP
- [ ] POPIA consent checkbox NOT pre-checked
- [ ] `app.current_tenant` session variable set before any DB query
- [ ] Protected API routes check `hasPermission()` server-side
- [ ] `tenant_id` claim in JWT validated against subdomain-resolved tenant
- [ ] `audit_log` entries written for: login, logout, role change, export, account deletion

---

## POPIA Annotation (Required on auth files)

```typescript
/**
 * POPIA ANNOTATION
 * Personal data handled: Email address, login timestamps, session tokens, consent record
 * Purpose: User authentication and access control for GIS platform
 * Lawful basis: Consent (registration checkbox, explicit)
 * Retention: Account active + 30 days after deletion request (POPIA §23)
 * Subject rights: access ✓ | correction ✓ | deletion ✓ | objection ✓
 */
```

---

## Performance Budget

| Metric | Target |
|--------|--------|
| Login (email/password end-to-end) | < 2s |
| JWT verification (middleware) | < 50ms |
| Role permission check | < 1ms (in-memory) |
| Token refresh (silent) | < 500ms |
| Tenant resolution (middleware) | < 10ms |

---

## Acceptance Criteria (M2)

- ✅ Login, registration, and password reset forms submit successfully
- ✅ Registration includes mandatory POPIA consent checkbox (NOT pre-checked)
- ✅ Six RBAC roles resolve permissions correctly per matrix above
- ✅ JWT stored in `httpOnly` cookie, never `localStorage`
- ✅ Sessions survive unexpected browser close (refresh token in cookie)
- ✅ Guest mode provides map browsing without auth or PII collection
- ✅ Protected routes redirect unauthenticated users with `returnTo` preserved
- ✅ Users see only their tenant's data (RLS enforced via `app.current_tenant`)
- ✅ Account deletion completes within 30 days (POPIA §23)
- ✅ Failed login attempts logged in `audit_log`
- ✅ `tenant_id` JWT mismatch → 403, logged as security event

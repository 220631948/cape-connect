---
applyTo: '**/*.{ts,tsx,sql}'
---
# RBAC Instructions

> TL;DR: Every protected route, API handler, and RLS policy must enforce the role hierarchy GUEST→PLATFORM_ADMIN. Read role from JWT claims, set session variable before queries, and never trust client-supplied role strings.

## Role Hierarchy
```
GUEST < VIEWER < ANALYST < POWER_USER < TENANT_ADMIN < PLATFORM_ADMIN
```
- Each role inherits all permissions of roles below it
- `GUEST` = unauthenticated or unverified session
- `PLATFORM_ADMIN` = cross-tenant superuser (Supabase service role only)

## JWT Claims
Roles are stored in the JWT under `app_metadata.role`:
```typescript
const role = session?.user?.app_metadata?.role ?? 'GUEST'
```
- Never read role from `user_metadata` (user-editable)
- Never accept role from request body or query params
- Validate against the enum: `['GUEST','VIEWER','ANALYST','POWER_USER','TENANT_ADMIN','PLATFORM_ADMIN']`

## TypeScript Role Guard
```typescript
type Role = 'GUEST' | 'VIEWER' | 'ANALYST' | 'POWER_USER' | 'TENANT_ADMIN' | 'PLATFORM_ADMIN'

const ROLE_RANK: Record<Role, number> = {
  GUEST: 0, VIEWER: 1, ANALYST: 2,
  POWER_USER: 3, TENANT_ADMIN: 4, PLATFORM_ADMIN: 5,
}

function hasRole(userRole: Role, required: Role): boolean {
  return ROLE_RANK[userRole] >= ROLE_RANK[required]
}
```

## Next.js Middleware Guard
```typescript
// middleware.ts
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })
  const { data: { session } } = await supabase.auth.getSession()

  const role: Role = session?.user?.app_metadata?.role ?? 'GUEST'
  if (!hasRole(role, 'VIEWER') && req.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', req.url))
  }
  return res
}
```

## Setting Session Variable for RLS
```typescript
// Set before any tenant-scoped query in server actions / API routes
await supabase.rpc('set_tenant_context', { tenant_id: tenantId })
// or raw:
await supabase.from('_sql').select(`set_config('app.current_tenant', '${tenantId}', true)`)
```
- Set `app.current_tenant` for tenant isolation
- Set `app.current_role` if RLS policies also gate by role

## RLS Policy Patterns by Role

### Tenant isolation only (all authenticated users of that tenant)
```sql
CREATE POLICY "tenant_read" ON <table>
  FOR SELECT USING (
    tenant_id = current_setting('app.current_tenant', TRUE)::uuid
  );
```

### Role-gated within tenant
```sql
CREATE POLICY "analyst_write" ON <table>
  FOR INSERT WITH CHECK (
    tenant_id = current_setting('app.current_tenant', TRUE)::uuid
    AND current_setting('app.current_role', TRUE) IN ('ANALYST','POWER_USER','TENANT_ADMIN','PLATFORM_ADMIN')
  );
```

### Guest access (public read, no PII)
```sql
CREATE POLICY "guest_read_public" ON public_layers
  FOR SELECT USING (is_public = true);
```

## Guest Mode Rules
- Guests see: basemap, suburb boundaries, zoning overlay, parcel outlines at zoom ≥14
- Guests cannot: view property details, save searches, export data, see risk layers
- Cap sign-up prompts at 3 per session

## RBAC Permission Matrix (common actions)
| Action | GUEST | VIEWER | ANALYST | POWER_USER | TENANT_ADMIN | PLATFORM_ADMIN |
|--------|-------|--------|---------|------------|--------------|----------------|
| View public layers | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| View property details | ✗ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Run spatial analysis | ✗ | ✗ | ✓ | ✓ | ✓ | ✓ |
| Export data | ✗ | ✗ | ✓ | ✓ | ✓ | ✓ |
| Manage layers | ✗ | ✗ | ✗ | ✓ | ✓ | ✓ |
| Tenant settings | ✗ | ✗ | ✗ | ✗ | ✓ | ✓ |
| Cross-tenant access | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ |

## Common Pitfalls
- **Do not** use `auth.uid()` alone for tenant scoping — it does not enforce tenant isolation
- **Do not** pass role as a URL parameter or request body field
- **Do not** skip middleware guards on API routes — RLS alone is not sufficient
- **Do not** use `PLATFORM_ADMIN` role outside service-role server contexts

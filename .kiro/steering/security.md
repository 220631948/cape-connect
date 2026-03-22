# Security & Compliance Rules

## Authentication

- Use `@supabase/ssr` for all server-side auth — never the anon key for privileged operations
- Inject `app.current_tenant` into the PostgreSQL session before any RLS-protected query
- JWT lifetime: 1h access, 7d refresh. Proactively refresh within 5 minutes of expiry via `onAuthStateChange`
- Server-side Supabase client must use `SUPABASE_SERVICE_ROLE_KEY` (never `NEXT_PUBLIC_SUPABASE_ANON_KEY`)

## RBAC Enforcement

- Role checks use the canonical role from the session profile — not JWT claims alone
- Application-layer tenant-mismatch check fires before any Supabase query in admin routes
- TENANT_ADMIN can only modify users within their own tenant
- PLATFORM_ADMIN has cross-tenant read; no cross-tenant write without explicit flag
- Guest mode enforces: basemap + suburbs + zoning only — no property details, no export, no saved searches

## API Route Security

- Every mutation route (`POST`, `PUT`, `PATCH`, `DELETE`) validates the request body with a Zod schema
- Invalid payloads return `400` with a structured error — never pass unvalidated input to the DB
- Admin routes (`/api/admin/*`) check role before executing — return `403` with `"Forbidden: <reason>"`
- No credentials, tokens, or secrets in source — use `.env` only; `NEXT_PUBLIC_` prefix only for safe-to-expose values

## RLS

- Every tenant-scoped table has RLS enabled: `profiles`, `audit_log`, `tenant_invitations`, `tenant_settings`, `saved_searches`, `favourites`, `valuation_data`
- New migrations must include RLS policy for any table containing tenant or user data
- `SECURITY DEFINER` functions must set `search_path = public, pg_temp` explicitly

## POPIA

- Any file that reads, writes, or transforms personal data (email, user ID, role, location) must include this annotation block at the top:

```ts
/**
 * @popia
 * Data handled: [list fields]
 * Purpose: [purpose]
 * Lawful basis: [basis]
 * Retention: [period]
 * Subject rights: access, correction, deletion via TENANT_ADMIN or support
 */
```

- Tenant-scoped tables are the boundary for personal data — never leak cross-tenant PII
- Audit log entries must be written for all role changes, impersonation events, and data exports

## Impersonation

- No self-impersonation
- No impersonation of `PLATFORM_ADMIN` accounts
- `TENANT_ADMIN` cannot impersonate users in other tenants
- All impersonation events written to `audit_log`

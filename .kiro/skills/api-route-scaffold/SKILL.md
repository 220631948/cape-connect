# Skill: api-route-scaffold

## Trigger
When creating a new API route under `src/app/api/`.

## Description
Ensures every new route is created with the correct structure: Zod validation, tenant injection, RLS-safe Supabase client, and consistent error envelope. Prevents the most common gaps found in this codebase.

## Steps

1. Create the route file at `src/app/api/<resource>/route.ts` (kebab-case directory).

2. For mutation handlers (`POST`, `PUT`, `PATCH`, `DELETE`):
   - Define a Zod schema in `src/lib/validation/` (or inline if single-use)
   - Parse the request body with `.safeParse()` — return `400` on failure:
     ```ts
     const result = schema.safeParse(await req.json())
     if (!result.success) return NextResponse.json({ error: result.error.flatten() }, { status: 400 })
     ```

3. Obtain the server-side Supabase client from `src/lib/supabase/server.ts` (uses `SUPABASE_SERVICE_ROLE_KEY`).

4. Inject tenant context before any query:
   ```ts
   await supabase.rpc('set_config', { key: 'app.current_tenant', value: tenantId })
   ```

5. For admin routes (`/api/admin/*`):
   - Call the role/session check from `src/lib/auth/admin-session.ts` first
   - Return `403` with `{ error: "Forbidden: <reason>" }` if check fails

6. Use this error envelope for all non-2xx responses:
   ```ts
   { error: string, code?: string }
   ```

7. If the route touches personal data (email, user ID, role), add the POPIA annotation block at the top of the file (see `security.md`).

8. Run `npm run typecheck` to confirm no type errors.

## Constraints
- Never use `NEXT_PUBLIC_SUPABASE_ANON_KEY` in a server route
- File must stay ≤ 300 lines — extract helpers to `src/lib/` if needed
- Every new route that reads live data must implement the three-tier fallback pattern (LIVE → CACHED → MOCK)

# Plan: Diagnose and Fix 500 Internal Server Error

## Background & Motivation
The user reported a `GET http://localhost:3000/ 500 (Internal Server Error)`. Although a previous commit (`47719e6`) attempted to fix a 500 error in the middleware by adding error handling, the issue persists. A likely culprit is the recent redaction of environment variables in `.env`, which may cause `createServerSupabaseClient` or the Next.js server-side rendering to fail when attempting to fetch `tenant_settings` or validate the session. 

## Scope & Impact
- Ensure the application does not crash with a 500 error on the root route `/`.
- Gracefully handle cases where Supabase credentials are missing or invalid (e.g., placeholder values in `.env`).

## Proposed Solution
1. **Investigate Server Logs**: Start the Next.js dev server (`npm run dev`) and make a curl request to `http://localhost:3000/` to capture the exact stack trace of the 500 error.
2. **Review Middleware and Layout**: Check `src/middleware.ts`, `src/app/layout.tsx`, and `src/lib/tenant/server.ts` for unhandled promise rejections or invariant violations related to `NEXT_PUBLIC_SUPABASE_URL`.
3. **Implement Graceful Fallbacks**: If the error is caused by invalid configuration (e.g., URL parsing error in `@supabase/ssr`), add defensive checks to bypass DB calls and provide default mock data or a clear error page instead of a hard 500 crash.
4. **Update Authoritative State**: Create `CHECKPOINTS/0004-500-error-investigation.md` and update `PROJECT_STATE.md`.

## Implementation Plan
1. `run_shell_command` to start the app and curl the endpoint to confirm the error.
2. Modify `src/lib/supabase/server.ts` or `src/middleware.ts` to fail gracefully if the Supabase URL is a placeholder (e.g., `REDACTED` or `placeholder`).
3. Run browser verification and capture the result.

## Verification & Testing
- `curl -I http://localhost:3000/` should return `200 OK` or `307 Temporary Redirect` (to `/login`), not `500 Internal Server Error`.

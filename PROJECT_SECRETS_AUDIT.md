# PROJECT_SECRETS_AUDIT.md
<!-- CapeTown GIS Hub — Full Environment Variable & Secrets Audit -->
<!-- Generated: 2026-03-22 -->

---

## 1. Project Overview

**Project:** CapeTown GIS Hub (`capegis`)
**Stack:** Next.js 16 (Vercel) + FastAPI (Railway) + Supabase + PostGIS + Martin
**Audit scope:** `.env`, `.env.local`, `.env.example`, `.env.sentry-build-plugin`, `next.config.ts`, `docker-compose.yml`, `backend/app/core/config.py`, `backend/app/core/auth.py`, `.mcp.json`, `.github/workflows/*.yml`, `src/**/*.ts`, `scripts/`

> **CRITICAL FINDING:** The `.env` file contains **real, live secret values** committed to the repository. This includes API keys, tokens, passwords, and webhook secrets. These must be rotated immediately and the file must be removed from git history.

---

## 2. Required Environment Variables

### 2.1 Frontend (Next.js / Vercel)

| Variable | Required | Present | Status |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | YES | YES | Set in `.env` and `.env.local` — values differ (prod vs local) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | YES | YES | Set in `.env` and `.env.local` — values differ |
| `SUPABASE_SERVICE_ROLE_KEY` | YES (server) | PARTIAL | Set in `.env.local` (local placeholder); **empty** in `.env` |
| `NEXT_PUBLIC_SENTRY_DSN` | NO | YES | Set in `.env` with real DSN |
| `NEXT_PUBLIC_GOOGLE_STREET_VIEW_KEY` | NO | NO | Empty in `.env` — Street View hidden |
| `MAPBOX_TOKEN` | NO | NO | Empty in `.env` — satellite toggle hidden |
| `MARTIN_URL` | NO | NO | Empty in `.env` — tiles fall back to Supabase |
| `CESIUM_ION_TOKEN` | NO | YES | Set in `.env` — real JWT token |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | NO | YES | Set in `.env` — test key |
| `NEXT_PUBLIC_GCS_BUCKET` | NO | NO | Missing — code defaults to `capegis-rasters` |
| `NEXT_PUBLIC_API_URL` | NO | NO | Missing — code defaults to `/api` |

### 2.2 Backend (FastAPI / Railway)

| Variable | Required | Present | Status |
|---|---|---|---|
| `DATABASE_URL` | YES | YES | Set in `.env` — local value only |
| `SUPABASE_URL` | YES | YES | Set in `.env` as `NEXT_PUBLIC_SUPABASE_URL` — backend uses `SUPABASE_URL` |
| `SUPABASE_SERVICE_ROLE_KEY` | YES | PARTIAL | Empty in `.env` |
| `CELERY_BROKER_URL` | YES | YES | Set in `.env` (implicit via `REDIS_URL`) |
| `CELERY_RESULT_BACKEND` | YES | YES | Set in `.env` (implicit via `REDIS_URL`) |
| `REDIS_URL` | YES | YES | Set in `.env` |
| `SENTRY_DSN` | NO | YES | Set in `.env` as `NEXT_PUBLIC_SENTRY_DSN` — backend reads `sentry_dsn` |
| `CORS_ORIGINS` / `ALLOWED_ORIGINS` | YES | PARTIAL | Not explicitly set — backend defaults to `https://capegis.vercel.app` |
| `DEBUG` | NO | NO | Not set — defaults to `False` |
| `APP_NAME` | NO | NO | Not set — defaults to `CapeTown GIS Hub API` |
| `APP_VERSION` | NO | NO | Not set — defaults to `0.1.0` |


---

## 3. Required Secrets and API Keys

### 3.1 Supabase

| Variable | Purpose | Status | File | Notes |
|---|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL (browser) | SET | `.env` L10 | Real prod URL present |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key (browser) | SET (UNSAFE) | `.env` L11 | Real key in `.env` — committed to repo |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side privileged key | MISSING | `.env` L12 | Empty string — server actions will fail in prod |
| `SUPABASE_URL` | Backend Supabase URL | MISSING | `.env.example` L44 | Not set separately for backend; backend `config.py` reads `supabase_url` |
| `SUPABASE_ANON_KEY` | Backend anon key | MISSING | `.env.example` L45 | Not set for backend |
| `SUPABASE_JWT_SECRET` | JWT validation secret | MISSING | `.env.example` L46 | Not set — backend uses JWKS endpoint instead |
| `DATABASE_URL` | Async PostgreSQL connection string | SET (LOCAL ONLY) | `.env` L16 | Points to `127.0.0.1:5432` — not a production value |

### 3.2 Sentry

| Variable | Purpose | Status | File | Notes |
|---|---|---|---|---|
| `NEXT_PUBLIC_SENTRY_DSN` | Frontend + server error tracking | SET (UNSAFE) | `.env` L88 | Real DSN committed to repo |
| `SENTRY_DSN` | Backend/server-side DSN alias | PARTIAL | `sentry.server.config.ts` L4 | Falls back to `NEXT_PUBLIC_SENTRY_DSN` |
| `SENTRY_AUTH_TOKEN` | Source map upload at build time | SET (UNSAFE) | `.env.sentry-build-plugin` L3 | **Real token hardcoded in file** — file should not be committed |
| `SENTRY_ORG` | Sentry org slug | HARDCODED | `next.config.ts` L68 | `"ferdi-fd"` hardcoded — should be env var |
| `SENTRY_PROJECT` | Sentry project slug | HARDCODED | `next.config.ts` L70 | `"cape-gis"` hardcoded — should be env var |
| `SENTRY_PAT` | Sentry personal access token | SET (UNSAFE) | `.env` L89 | Real PAT committed to repo |

### 3.3 Stripe

| Variable | Purpose | Status | File | Notes |
|---|---|---|---|---|
| `STRIPE_SECRET_KEY` | Server-side Stripe API key | SET (UNSAFE) | `.env` L62 | Real test key committed — `sk_test_51Q9nSw...` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Client-side Stripe key | SET (UNSAFE) | `.env` L63 | Real test key committed — `pk_test_51Q9nSw...` |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signature verification | SET (UNSAFE) | `.env` L64 | Real `whsec_...` committed to repo |

### 3.4 ArcGIS

| Variable | Purpose | Status | File | Notes |
|---|---|---|---|---|
| `ARCGIS_CLIENT_ID` | ArcGIS OAuth2 client ID | SET (UNSAFE) | `.env` L93 | Real value committed |
| `ARCGIS_CLIENT_SECRET` | ArcGIS OAuth2 client secret | SET (UNSAFE) | `.env` L94 | Real value committed |
| `ARCGIS_TEMP_TOKEN` | ArcGIS temporary access token | SET (UNSAFE) | `.env` L95 | Real long-lived token committed — likely expired but must be rotated |
| `ARCGIS_TOKEN` | Static ArcGIS token fallback | MISSING | `src/lib/auth/arcgis.ts` L21 | Referenced in code but not in `.env.example` |

### 3.5 Cesium

| Variable | Purpose | Status | File | Notes |
|---|---|---|---|---|
| `CESIUM_ION_TOKEN` | Cesium Ion access token (frontend) | SET (UNSAFE) | `.env` L91 | Real JWT committed |
| `CESIUM_ION_ACCESS_TOKEN` | Cesium Ion token (backend/scripts) | MISSING | `.env.example` L68 | Documented in example but not set in `.env` — duplicate of above |
| `COPILOT_MCP_CESIUM_ION_TOKEN` | Cesium Ion token for MCP server | SET (UNSAFE) | `.env` L43 | Same JWT value as `CESIUM_ION_TOKEN` — duplicated |

### 3.6 Google / GCP

| Variable | Purpose | Status | File | Notes |
|---|---|---|---|---|
| `GEMINI_API_KEY` | Gemini AI API key | SET (UNSAFE) | `.env` L24 | Real key committed — `AIzaSyAyOCo...` |
| `GEMINI_DEEP_RESEARCH_API_KEY` | Gemini Deep Research key | SET (UNSAFE) | `.env` L25 | Real key committed — `AIzaSyDZGUe...` |
| `GOOGLE_API_KEY` | Google APIs (MCP nano-banana) | MISSING | `.env` L29 | Empty in `.env` |
| `GOOGLE_STITCH_API_KEY` | Google Stitch API | SET (UNSAFE) | `.env` L30 | Real key committed |
| `NEXT_PUBLIC_GOOGLE_STREET_VIEW_KEY` | Street View embed | MISSING | `.env` L31 | Empty — Street View hidden |
| `GOOGLE_CRUX_API_KEY` | Core Web Vitals CrUX API | MISSING | `.env.example` L84 | Not set in `.env` |
| `GCP_PROJECT_ID` | GCP project identifier | MISSING | `.env.example` L72 | Not set in `.env` — required for Terraform CI |
| `GCS_BUCKET_NAME` | GCS staging bucket name | MISSING | `.env.example` L73 | Not set in `.env` |
| `GEE_SA_KEY_PATH` | Path to GEE service account JSON | MISSING | `.env.example` L77 | Not set — Earth Engine exports will fail |

### 3.7 MCP Server Tokens

| Variable | Purpose | Status | File | Notes |
|---|---|---|---|---|
| `CONTEXT7_API_KEY` | Context7 MCP docs server | SET (UNSAFE) | `.env` L26 | Real key committed — `ctx7sk-845d...` |
| `EXA_API_KEY` | Exa semantic search MCP | SET (UNSAFE) | `.env` L27 | Real key committed — `b9ad4b15-...` |
| `VERCEL_TOKEN` | Vercel deployment MCP | SET (UNSAFE) | `.env` L33 | Real token committed — `vcp_0FF3lJvc...` |
| `NERFSTUDIO_PATH` | Path to nerfstudio binary | MISSING | `.env` L45 | Empty — NeRF pipeline disabled |
| `MCP_STITCH_NERFSTUDIO_PATH` | Stitch MCP nerfstudio path | MISSING | `.env` L46 | Empty |

### 3.8 Third-Party Services

| Variable | Purpose | Status | File | Notes |
|---|---|---|---|---|
| `FIRECRAWL_API_KEY` | Web scraping service | SET (UNSAFE) | `.env` L52 | Real key committed — `fc-0604240c...` |
| `BROWSERBASE_API_KEY` | Headless browser automation | SET (UNSAFE) | `.env` L57 | Real key committed — `bb_live_YgJ2...` |
| `BROWSERBASE_PROJECT_ID` | Browserbase project | SET (UNSAFE) | `.env` L58 | Real UUID committed |
| `OPENSKY_USERNAME` | OpenSky Network auth | SET (UNSAFE) | `.env` L82 | Real username committed |
| `OPENSKY_PASSWORD` | OpenSky Network auth | SET (UNSAFE) | `.env` L83 | Real password committed |
| `DOPPLER_TOKEN` | Doppler secrets manager token | SET (UNSAFE) | `.env` L68 | Real token committed — `dp.pt.efFz...` |
| `LOCALSTACK_AUTH_TOKEN` | LocalStack Pro auth | SET (UNSAFE) | `.env` L99 | Real token committed |
| `ANTHROPIC_API_KEY` | Anthropic Claude API | MISSING | `.env.example` L81 | Not set in `.env` |
| `OPENAI_API_KEY` | OpenAI API | MISSING | `.env.example` L82 | Not set in `.env` |
| `TOMTOM_API_KEY` | Traffic data API | MISSING | `src/app/api/traffic/route.ts` L29 | Referenced in code, not in `.env.example` |

### 3.9 Auth & Security

| Variable | Purpose | Status | File | Notes |
|---|---|---|---|---|
| `IMPERSONATION_JWT_SECRET` | Signs impersonation tokens | MISSING | `src/lib/auth/impersonation-token.ts` L42 | Not in `.env` or `.env.example` — app throws at runtime |
| `JWT_SECRET` | Generic JWT secret | SET (UNSAFE) | `.env` L100 | Placeholder value `your_jwt_secret_here` — not a real secret |
| `NEXTAUTH_SECRET` | NextAuth session secret | SET (UNSAFE) | `.env` L101 | Placeholder value `your_nextauth_secret_here` — not a real secret |

### 3.10 CI/CD GitHub Secrets

| Secret | Purpose | Status | Workflow |
|---|---|---|---|
| `GITHUB_TOKEN` | Default GitHub Actions token | AUTO | `ci.yml`, `release.yml` |
| `SENTRY_AUTH_TOKEN` | Sentry release creation | OPTIONAL | `release.yml` |
| `SENTRY_ORG` | Sentry org for releases | OPTIONAL | `release.yml` |
| `SENTRY_PROJECT` | Sentry project for releases | OPTIONAL | `release.yml` |
| `VERCEL_TOKEN` | Vercel deployment tagging | OPTIONAL | `release.yml` |
| `GCP_PROJECT_ID` | GCP project for Terraform | REQUIRED (infra) | `terraform.yml` |
| `GCP_WIF_PROVIDER` | GCP Workload Identity Federation provider | REQUIRED (infra) | `terraform.yml` |
| `GCP_WIF_SERVICE_ACCOUNT` | GCP WIF service account email | REQUIRED (infra) | `terraform.yml` |
| `GCP_SA_KEY` | GCP SA JSON key (WIF alternative) | OPTIONAL | `terraform.yml` |

### 3.11 Backend-Only (Python / Railway)

| Variable | Purpose | Status | File |
|---|---|---|---|
| `R2_ACCOUNT_ID` | Cloudflare R2 account | MISSING | `backend/app/core/config.py` L32 |
| `R2_ACCESS_KEY_ID` | Cloudflare R2 access key | MISSING | `backend/app/core/config.py` L33 |
| `R2_SECRET_ACCESS_KEY` | Cloudflare R2 secret | MISSING | `backend/app/core/config.py` L34 |
| `R2_BUCKET_NAME` | Cloudflare R2 bucket | MISSING | `backend/app/core/config.py` L35 |
| `HUGGINGFACE_TOKEN` | HuggingFace model access | MISSING | `backend/app/core/config.py` L38 |
| `GEE_SERVICE_ACCOUNT` | GEE service account email | MISSING | `backend/app/core/config.py` L41 |
| `GEE_PRIVATE_KEY` | GEE service account private key | MISSING | `backend/app/core/config.py` L42 |
| `ALLOWED_ORIGINS` | CORS allowed origins | MISSING | `backend/app/core/config.py` L46 |
| `DATABASE_POOL_SIZE` | DB connection pool size | MISSING | `.env.example` L52 |
| `DATABASE_MAX_OVERFLOW` | DB pool overflow limit | MISSING | `.env.example` L53 |


---

## 4. Missing or Unsafe Configuration

### 4.1 CRITICAL — Secrets Committed to Repository

The following real, live credentials are present in `.env` which appears to be tracked by git (`.gitignore` should exclude it but the file exists at root and was readable):

| Secret | File | Line | Risk |
|---|---|---|---|
| `SENTRY_AUTH_TOKEN` (real token) | `.env.sentry-build-plugin` | 3 | HIGH — source map upload token; allows injecting releases |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` (real key) | `.env` | 11 | HIGH — live Supabase project key |
| `NEXT_PUBLIC_SUPABASE_URL` (real URL) | `.env` | 10 | MEDIUM — exposes project ref |
| `GEMINI_API_KEY` (real key) | `.env` | 24 | HIGH — billable API key |
| `GEMINI_DEEP_RESEARCH_API_KEY` (real key) | `.env` | 25 | HIGH — billable API key |
| `CONTEXT7_API_KEY` (real key) | `.env` | 26 | MEDIUM |
| `EXA_API_KEY` (real key) | `.env` | 27 | MEDIUM |
| `GOOGLE_STITCH_API_KEY` (real key) | `.env` | 30 | MEDIUM |
| `VERCEL_TOKEN` (real token) | `.env` | 33 | HIGH — full Vercel deployment access |
| `COPILOT_MCP_CESIUM_ION_TOKEN` (real JWT) | `.env` | 43 | MEDIUM |
| `FIRECRAWL_API_KEY` (real key) | `.env` | 52 | MEDIUM — billable |
| `BROWSERBASE_API_KEY` (real key) | `.env` | 57 | MEDIUM — billable |
| `BROWSERBASE_PROJECT_ID` (real UUID) | `.env` | 58 | LOW |
| `STRIPE_SECRET_KEY` (real test key) | `.env` | 62 | HIGH — even test keys can be misused |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (real test key) | `.env` | 63 | LOW — publishable keys are public by design |
| `STRIPE_WEBHOOK_SECRET` (real secret) | `.env` | 64 | HIGH — allows forging webhook events |
| `DOPPLER_TOKEN` (real token) | `.env` | 68 | CRITICAL — grants access to all secrets in Doppler |
| `OPENSKY_USERNAME` / `OPENSKY_PASSWORD` | `.env` | 82–83 | MEDIUM |
| `NEXT_PUBLIC_SENTRY_DSN` (real DSN) | `.env` | 88 | LOW — DSNs are semi-public but should not be committed |
| `SENTRY_PAT` (real PAT) | `.env` | 89 | HIGH — personal access token |
| `CESIUM_ION_TOKEN` (real JWT) | `.env` | 91 | MEDIUM |
| `ARCGIS_CLIENT_ID` / `ARCGIS_CLIENT_SECRET` | `.env` | 93–94 | HIGH — OAuth2 credentials |
| `ARCGIS_TEMP_TOKEN` (real token) | `.env` | 95 | HIGH — long-lived access token |
| `LOCALSTACK_AUTH_TOKEN` (real token) | `.env` | 99 | MEDIUM |

### 4.2 Hardcoded Values in Source Code

| Value | File | Line | Issue |
|---|---|---|---|
| `org: "ferdi-fd"` | `next.config.ts` | 68 | Sentry org slug hardcoded — should be `process.env.SENTRY_ORG` |
| `project: "cape-gis"` | `next.config.ts` | 70 | Sentry project slug hardcoded — should be `process.env.SENTRY_PROJECT` |
| `postgresql://postgres:postgres@localhost:5432/capegis` | `.mcp.json` | 10 | Hardcoded local DB credentials in MCP config |
| `postgresql://postgres:postgres@postgis:5432/capegis` | `docker-compose.yml` | 43 | Hardcoded local DB credentials — acceptable for local dev only |
| `POSTGRES_PASSWORD: postgres` | `docker-compose.yml` | 14 | Hardcoded local password — acceptable for local dev only |
| `allowed_origins: "https://capegis.vercel.app"` | `backend/app/core/config.py` | 46 | Hardcoded production domain as default — should be env-only |

### 4.3 Naming Inconsistencies

| Issue | Details |
|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` defined twice | `.env.example` lines 36 and 47 — duplicate key in the same file |
| `CESIUM_ION_TOKEN` vs `CESIUM_ION_ACCESS_TOKEN` vs `COPILOT_MCP_CESIUM_ION_TOKEN` | Three different names for the same token across `.env`, `.env.example`, and `.mcp.json` |
| `SENTRY_DSN` vs `NEXT_PUBLIC_SENTRY_DSN` | `sentry.server.config.ts` reads both; backend `config.py` reads `sentry_dsn` — no single canonical name |
| `SUPABASE_URL` (backend) vs `NEXT_PUBLIC_SUPABASE_URL` (frontend) | Backend `config.py` uses `supabase_url` but `.env` only sets `NEXT_PUBLIC_SUPABASE_URL` — backend will use its default `https://localhost:54321` in production |
| `ALLOWED_ORIGINS` (backend) vs `CORS_ORIGINS` (`.env.example`) | `.env.example` documents `CORS_ORIGINS`; `config.py` reads `allowed_origins` |
| `CARTO_*` variables | `.env` uses YAML-style colon syntax (`API_BASE_URL: "..."`) instead of `=` — these will not be parsed correctly by dotenv |

### 4.4 Placeholder Values That Are Not Real Secrets

| Variable | Value in `.env` | Action Required |
|---|---|---|
| `JWT_SECRET` | `your_jwt_secret_here` | Generate a real 256-bit random secret |
| `NEXTAUTH_SECRET` | `your_nextauth_secret_here` | Generate a real 256-bit random secret |
| `CARTO_API_KEY` | `your_api_key_here` | Fill in or remove if CARTO not used |
| `CARTO_USERNAME` | `your_username_here` | Fill in or remove |
| `CARTO_CLIENT_ID` | `your_client_id_here` | Fill in or remove |
| `CARTO_CLIENT_SECRET` | `your_client_secret_here` | Fill in or remove |

### 4.5 Missing Variables That Will Cause Runtime Failures

| Variable | Where Used | Failure Mode |
|---|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | All server-side API routes, admin routes | Server actions return 500 / auth failures |
| `IMPERSONATION_JWT_SECRET` | `src/lib/auth/impersonation-token.ts` L42 | Throws `Error: IMPERSONATION_JWT_SECRET is required` at runtime |
| `SUPABASE_URL` (backend) | `backend/app/core/config.py` | Backend connects to `localhost:54321` in production — all DB calls fail |
| `DATABASE_URL` (production) | `backend/app/core/database.py` | Backend uses local `127.0.0.1:5432` — all queries fail in production |
| `GEE_SERVICE_ACCOUNT` + `GEE_PRIVATE_KEY` | Earth Engine export pipeline | GEE exports silently fail |


---

## 5. Hardcoded Values to Replace

| Location | Current Value | Recommended Fix |
|---|---|---|
| `next.config.ts` L68 | `org: "ferdi-fd"` | `org: process.env.SENTRY_ORG` |
| `next.config.ts` L70 | `project: "cape-gis"` | `project: process.env.SENTRY_PROJECT` |
| `.mcp.json` L10 | `postgresql://postgres:postgres@localhost:5432/capegis` | `${DATABASE_URL}` or a dedicated `MCP_POSTGRES_URL` env var |
| `backend/app/core/config.py` L46 | `allowed_origins: str = "https://capegis.vercel.app"` | `allowed_origins: str = ""` — require explicit env var in production |
| `.env` L75–79 | YAML-colon syntax for CARTO vars | Use `=` syntax: `API_BASE_URL=https://...` |

---

## 6. File-by-File Reference Map

### `.env`
- `NEXT_PUBLIC_SUPABASE_URL` — Purpose: Supabase project URL — Status: SET (UNSAFE, real value) — Lines: `10`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Purpose: Supabase browser key — Status: SET (UNSAFE) — Lines: `11`
- `SUPABASE_SERVICE_ROLE_KEY` — Purpose: Server-side privileged key — Status: EMPTY — Lines: `12`
- `DATABASE_URL` — Purpose: PostgreSQL connection — Status: LOCAL ONLY — Lines: `16`
- `GEMINI_API_KEY` — Purpose: Gemini AI — Status: SET (UNSAFE) — Lines: `24`
- `GEMINI_DEEP_RESEARCH_API_KEY` — Purpose: Gemini Deep Research — Status: SET (UNSAFE) — Lines: `25`
- `CONTEXT7_API_KEY` — Purpose: Context7 MCP — Status: SET (UNSAFE) — Lines: `26`
- `EXA_API_KEY` — Purpose: Exa search MCP — Status: SET (UNSAFE) — Lines: `27`
- `GOOGLE_STITCH_API_KEY` — Purpose: Google Stitch — Status: SET (UNSAFE) — Lines: `30`
- `VERCEL_TOKEN` — Purpose: Vercel deployment — Status: SET (UNSAFE) — Lines: `33`
- `COPILOT_MCP_CESIUM_ION_TOKEN` — Purpose: Cesium Ion MCP — Status: SET (UNSAFE) — Lines: `43`
- `FIRECRAWL_API_KEY` — Purpose: Web scraping — Status: SET (UNSAFE) — Lines: `52`
- `BROWSERBASE_API_KEY` — Purpose: Browser automation — Status: SET (UNSAFE) — Lines: `57`
- `BROWSERBASE_PROJECT_ID` — Purpose: Browserbase project — Status: SET (UNSAFE) — Lines: `58`
- `STRIPE_SECRET_KEY` — Purpose: Stripe server key — Status: SET (UNSAFE) — Lines: `62`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` — Purpose: Stripe client key — Status: SET — Lines: `63`
- `STRIPE_WEBHOOK_SECRET` — Purpose: Stripe webhook verification — Status: SET (UNSAFE) — Lines: `64`
- `DOPPLER_TOKEN` — Purpose: Doppler secrets manager — Status: SET (UNSAFE, CRITICAL) — Lines: `68`
- `OPENSKY_USERNAME` / `OPENSKY_PASSWORD` — Purpose: OpenSky auth — Status: SET (UNSAFE) — Lines: `82–83`
- `NEXT_PUBLIC_SENTRY_DSN` — Purpose: Sentry error tracking — Status: SET (UNSAFE) — Lines: `88`
- `SENTRY_PAT` — Purpose: Sentry personal access token — Status: SET (UNSAFE) — Lines: `89`
- `CESIUM_ION_TOKEN` — Purpose: Cesium Ion access — Status: SET (UNSAFE) — Lines: `91`
- `ARCGIS_CLIENT_ID` — Purpose: ArcGIS OAuth2 — Status: SET (UNSAFE) — Lines: `93`
- `ARCGIS_CLIENT_SECRET` — Purpose: ArcGIS OAuth2 — Status: SET (UNSAFE) — Lines: `94`
- `ARCGIS_TEMP_TOKEN` — Purpose: ArcGIS temp token — Status: SET (UNSAFE) — Lines: `95`
- `LOCALSTACK_AUTH_TOKEN` — Purpose: LocalStack Pro — Status: SET (UNSAFE) — Lines: `99`
- `JWT_SECRET` — Purpose: JWT signing — Status: PLACEHOLDER — Lines: `100`
- `NEXTAUTH_SECRET` — Purpose: NextAuth sessions — Status: PLACEHOLDER — Lines: `101`

### `.env.local`
- `NEXT_PUBLIC_SUPABASE_URL` — Purpose: Local Supabase URL — Status: LOCAL PLACEHOLDER — Lines: `1`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Purpose: Local anon key — Status: LOCAL PLACEHOLDER — Lines: `2`
- `SUPABASE_SERVICE_ROLE_KEY` — Purpose: Local service role key — Status: LOCAL PLACEHOLDER — Lines: `3`

### `.env.sentry-build-plugin`
- `SENTRY_AUTH_TOKEN` — Purpose: Source map upload — Status: SET (UNSAFE, real token) — Lines: `3` — Reference: Used by `@sentry/webpack-plugin` during `next build`

### `.env.example`
- All variables documented — Status: TEMPLATE ONLY — Note: `SUPABASE_SERVICE_ROLE_KEY` appears twice (lines ~36 and ~47)

### `next.config.ts`
- `process.env.CI` — Purpose: Suppress Sentry logs in non-CI — Lines: `72` — Status: OK (standard)
- `SENTRY_ORG` hardcoded as `"ferdi-fd"` — Lines: `68` — Status: UNSAFE
- `SENTRY_PROJECT` hardcoded as `"cape-gis"` — Lines: `70` — Status: UNSAFE

### `sentry.client.config.ts`
- `process.env.NEXT_PUBLIC_SENTRY_DSN` — Lines: `4` — Status: OK (reads from env)

### `sentry.server.config.ts` / `sentry.edge.config.ts`
- `process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN` — Lines: `4` — Status: OK (dual fallback)

### `src/lib/supabase/client.ts`
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Lines: `12–13` — Status: OK (reads from env)

### `src/lib/supabase/server.ts`
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Lines: `15–16` — Status: UNSAFE — Server client should use `SUPABASE_SERVICE_ROLE_KEY`, not the anon key

### `src/lib/auth/arcgis.ts`
- `ARCGIS_CLIENT_ID`, `ARCGIS_CLIENT_SECRET`, `ARCGIS_TOKEN` — Lines: `19–21` — Status: OK (reads from env) — Note: `ARCGIS_TOKEN` not in `.env.example`

### `src/lib/auth/impersonation-token.ts`
- `IMPERSONATION_JWT_SECRET` — Lines: `42` — Status: MISSING — Throws at runtime if not set

### `src/lib/auth/admin-session.ts`
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Lines: `42–43` — Status: UNSAFE — Admin session should use service role key

### `src/lib/opensky-api.ts`
- `OPENSKY_USERNAME`, `OPENSKY_PASSWORD` — Lines: `91`, `100–101` — Status: OK (reads from env)

### `src/lib/storage/raster-storage-client.ts`
- `NEXT_PUBLIC_GCS_BUCKET` — Lines: `52` — Status: MISSING (defaults to `capegis-rasters`)
- `NEXT_PUBLIC_API_URL` — Lines: `54` — Status: MISSING (defaults to `/api`)

### `src/app/api/traffic/route.ts`
- `TOMTOM_API_KEY` — Lines: `29` — Status: MISSING — Not in `.env.example`; traffic API returns mock data when absent

### `src/app/api/tiles/cesium-3d/route.ts`
- `CESIUM_ION_TOKEN` — Lines: `88` — Status: SET (via `.env`)

### `src/instrumentation-client.ts`
- `NEXT_PUBLIC_SENTRY_DSN` — Lines: implicit via `sentry.client.config.ts` — Status: OK

### `backend/app/core/config.py`
- `supabase_url` → `SUPABASE_URL` — Lines: `24` — Status: MISSING in `.env` (only `NEXT_PUBLIC_SUPABASE_URL` is set)
- `supabase_service_role_key` → `SUPABASE_SERVICE_ROLE_KEY` — Lines: `25` — Status: EMPTY
- `database_url` → `DATABASE_URL` — Lines: `28` — Status: LOCAL ONLY
- `celery_broker_url` → `CELERY_BROKER_URL` — Lines: `31` — Status: MISSING (defaults to localhost)
- `r2_account_id` → `R2_ACCOUNT_ID` — Lines: `32` — Status: MISSING
- `r2_access_key_id` → `R2_ACCESS_KEY_ID` — Lines: `33` — Status: MISSING
- `r2_secret_access_key` → `R2_SECRET_ACCESS_KEY` — Lines: `34` — Status: MISSING
- `huggingface_token` → `HUGGINGFACE_TOKEN` — Lines: `38` — Status: MISSING
- `anthropic_api_key` → `ANTHROPIC_API_KEY` — Lines: `39` — Status: MISSING
- `gee_service_account` → `GEE_SERVICE_ACCOUNT` — Lines: `41` — Status: MISSING
- `gee_private_key` → `GEE_PRIVATE_KEY` — Lines: `42` — Status: MISSING
- `sentry_dsn` → `SENTRY_DSN` — Lines: `45` — Status: MISSING (backend won't find `NEXT_PUBLIC_SENTRY_DSN`)
- `allowed_origins` → `ALLOWED_ORIGINS` — Lines: `46` — Status: HARDCODED DEFAULT

### `docker-compose.yml`
- `POSTGRES_PASSWORD: postgres` — Lines: `14` — Status: LOCAL DEV ONLY (acceptable)
- `DATABASE_URL: postgres://postgres:postgres@postgis:5432/capegis` — Lines: `43` — Status: LOCAL DEV ONLY
- `LOCALSTACK_AUTH_TOKEN` — Lines: `36` — Status: Read from env (OK)
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` — Lines: `47–49` — Status: Passed through from env (OK)

### `.mcp.json`
- `postgresql://postgres:postgres@localhost:5432/capegis` — Lines: `10` — Status: HARDCODED local credentials
- `GEMINI_API_KEY` — Lines: `${GEMINI_API_KEY}` — Status: OK (interpolated from env)
- `CONTEXT7_API_KEY` — Lines: `${CONTEXT7_API_KEY}` — Status: OK (interpolated from env)
- `EXA_API_KEY` — Lines: `${EXA_API_KEY}` — Status: OK (interpolated from env)
- `VERCEL_TOKEN` — Lines: `${VERCEL_TOKEN}` — Status: OK (interpolated from env)
- `COPILOT_MCP_CESIUM_ION_TOKEN` — Lines: `${COPILOT_MCP_CESIUM_ION_TOKEN}` — Status: OK (interpolated from env)
- `GOOGLE_API_KEY` — Lines: `${GOOGLE_API_KEY}` — Status: MISSING (empty in `.env`)
- `NERFSTUDIO_PATH` — Lines: hardcoded `/usr/local/bin/ns-train` — Status: OK (system path, not a secret)

### `.github/workflows/terraform.yml`
- `GCP_PROJECT_ID` — Lines: `env.TF_VAR_project_id` — Status: MISSING from GitHub Secrets
- `GCP_WIF_PROVIDER` — Lines: `steps.auth` — Status: MISSING from GitHub Secrets
- `GCP_WIF_SERVICE_ACCOUNT` — Lines: `steps.auth` — Status: MISSING from GitHub Secrets


---

## 7. Recommended `.env` Template

The following is a clean, safe template to replace the current `.env`. All values are empty or clearly marked as placeholders. **Never commit a filled-in version of this file.**

```dotenv
# CapeTown GIS Hub — Environment Variables
# Copy to .env and fill in values. NEVER commit .env to git.
# Ensure .env is in .gitignore before filling in any values.

# ═══════════════════════════════════════════════════════════════
# SUPABASE (Frontend)
# ═══════════════════════════════════════════════════════════════
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# ═══════════════════════════════════════════════════════════════
# SUPABASE (Backend — FastAPI)
# Must be set separately; backend does not read NEXT_PUBLIC_ vars
# ═══════════════════════════════════════════════════════════════
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_JWT_SECRET=

# ═══════════════════════════════════════════════════════════════
# DATABASE
# ═══════════════════════════════════════════════════════════════
DATABASE_URL=
DATABASE_POOL_SIZE=5
DATABASE_MAX_OVERFLOW=10

# ═══════════════════════════════════════════════════════════════
# REDIS / CELERY
# ═══════════════════════════════════════════════════════════════
REDIS_URL=
CELERY_BROKER_URL=
CELERY_RESULT_BACKEND=

# ═══════════════════════════════════════════════════════════════
# AUTH & SECURITY
# ═══════════════════════════════════════════════════════════════
IMPERSONATION_JWT_SECRET=          # Required — generate: openssl rand -hex 32
JWT_SECRET=                        # Required — generate: openssl rand -hex 32
NEXTAUTH_SECRET=                   # Required — generate: openssl rand -hex 32

# ═══════════════════════════════════════════════════════════════
# SENTRY
# ═══════════════════════════════════════════════════════════════
NEXT_PUBLIC_SENTRY_DSN=
SENTRY_DSN=                        # Backend alias — same value as above
SENTRY_AUTH_TOKEN=                 # Build-time only — do NOT use NEXT_PUBLIC_
SENTRY_ORG=
SENTRY_PROJECT=

# ═══════════════════════════════════════════════════════════════
# STRIPE
# ═══════════════════════════════════════════════════════════════
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=

# ═══════════════════════════════════════════════════════════════
# ARCGIS
# ═══════════════════════════════════════════════════════════════
ARCGIS_CLIENT_ID=
ARCGIS_CLIENT_SECRET=
ARCGIS_TOKEN=                      # Optional static token fallback

# ═══════════════════════════════════════════════════════════════
# CESIUM
# ═══════════════════════════════════════════════════════════════
CESIUM_ION_TOKEN=
COPILOT_MCP_CESIUM_ION_TOKEN=      # Same value as CESIUM_ION_TOKEN

# ═══════════════════════════════════════════════════════════════
# GOOGLE / GCP
# ═══════════════════════════════════════════════════════════════
GEMINI_API_KEY=
GOOGLE_API_KEY=
NEXT_PUBLIC_GOOGLE_STREET_VIEW_KEY=
GOOGLE_CRUX_API_KEY=
GCP_PROJECT_ID=
GCS_BUCKET_NAME=capegis-rasters
GEE_SA_KEY_PATH=                   # Path to service account JSON file
GEE_SERVICE_ACCOUNT=               # Backend: service account email
GEE_PRIVATE_KEY=                   # Backend: private key string

# ═══════════════════════════════════════════════════════════════
# MAPBOX (optional — satellite toggle)
# ═══════════════════════════════════════════════════════════════
MAPBOX_TOKEN=

# ═══════════════════════════════════════════════════════════════
# MARTIN TILE SERVER
# ═══════════════════════════════════════════════════════════════
MARTIN_URL=

# ═══════════════════════════════════════════════════════════════
# CLOUDFLARE R2 (Backend raster storage)
# ═══════════════════════════════════════════════════════════════
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=capegis-rasters

# ═══════════════════════════════════════════════════════════════
# ML SERVICES
# ═══════════════════════════════════════════════════════════════
ANTHROPIC_API_KEY=
OPENAI_API_KEY=
HUGGINGFACE_TOKEN=

# ═══════════════════════════════════════════════════════════════
# MCP SERVERS
# ═══════════════════════════════════════════════════════════════
CONTEXT7_API_KEY=
EXA_API_KEY=
VERCEL_TOKEN=
FIRECRAWL_API_KEY=
BROWSERBASE_API_KEY=
BROWSERBASE_PROJECT_ID=
DOPPLER_TOKEN=

# ═══════════════════════════════════════════════════════════════
# OPENSKY NETWORK
# ═══════════════════════════════════════════════════════════════
OPENSKY_USERNAME=
OPENSKY_PASSWORD=

# ═══════════════════════════════════════════════════════════════
# CARTO (optional)
# ═══════════════════════════════════════════════════════════════
CARTO_API_KEY=
CARTO_USERNAME=
CARTO_CLIENT_ID=
CARTO_CLIENT_SECRET=

# ═══════════════════════════════════════════════════════════════
# TRAFFIC (optional)
# ═══════════════════════════════════════════════════════════════
TOMTOM_API_KEY=

# ═══════════════════════════════════════════════════════════════
# LOCALSTACK (local dev only)
# ═══════════════════════════════════════════════════════════════
LOCALSTACK_AUTH_TOKEN=

# ═══════════════════════════════════════════════════════════════
# BACKEND CORS
# ═══════════════════════════════════════════════════════════════
ALLOWED_ORIGINS=https://capegis.vercel.app

# ═══════════════════════════════════════════════════════════════
# NERFSTUDIO (optional — 3DGS pipeline)
# ═══════════════════════════════════════════════════════════════
NERFSTUDIO_PATH=
MCP_STITCH_NERFSTUDIO_PATH=

# ═══════════════════════════════════════════════════════════════
# FRONTEND OPTIONAL
# ═══════════════════════════════════════════════════════════════
NEXT_PUBLIC_GCS_BUCKET=capegis-rasters
NEXT_PUBLIC_API_URL=
```


---

## 8. Next Steps

### Priority 1 — IMMEDIATE (do before any further commits)

1. **Rotate all exposed secrets.** Every key, token, and password in `.env` must be considered compromised. Rotate in this order:
   - `DOPPLER_TOKEN` — grants access to all other secrets
   - `VERCEL_TOKEN` — deployment access
   - `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET`
   - `ARCGIS_CLIENT_SECRET` + `ARCGIS_TEMP_TOKEN`
   - `SENTRY_AUTH_TOKEN` + `SENTRY_PAT`
   - `GEMINI_API_KEY` + `GEMINI_DEEP_RESEARCH_API_KEY`
   - `SUPABASE_ANON_KEY` (rotate in Supabase dashboard)
   - All remaining keys in `.env`

2. **Remove `.env` from git history.** Run `git filter-repo` or BFG Repo Cleaner to purge the file from all commits. Then force-push.

3. **Verify `.gitignore` covers all env files.** Confirm `.env`, `.env.local`, `.env.*.local`, and `.env.sentry-build-plugin` are all listed.

4. **Delete `.env.sentry-build-plugin` from the repo.** The `SENTRY_AUTH_TOKEN` inside it is a real token. Move it to `.env` (gitignored) or a CI secret.

### Priority 2 — Before Production Deployment

5. **Set `SUPABASE_SERVICE_ROLE_KEY`** in both Vercel environment variables and the backend Railway environment. Without it, all server-side auth and admin routes fail.

6. **Set `IMPERSONATION_JWT_SECRET`** in Vercel env vars. The app throws a hard error at runtime without it.

7. **Set `SUPABASE_URL` for the backend** separately from `NEXT_PUBLIC_SUPABASE_URL`. The backend `config.py` reads `SUPABASE_URL`, not the `NEXT_PUBLIC_` variant.

8. **Set `SENTRY_DSN` for the backend** (same value as `NEXT_PUBLIC_SENTRY_DSN`). The backend `config.py` reads `SENTRY_DSN`, not `NEXT_PUBLIC_SENTRY_DSN`.

9. **Set `DATABASE_URL` to the production connection string** in Railway. The current value points to `127.0.0.1:5432`.

10. **Set `ALLOWED_ORIGINS`** in the Railway backend environment to the production Vercel domain.

### Priority 3 — Code Fixes

11. **Fix `next.config.ts`** — replace hardcoded `org: "ferdi-fd"` and `project: "cape-gis"` with `process.env.SENTRY_ORG` and `process.env.SENTRY_PROJECT`.

12. **Fix `src/lib/supabase/server.ts`** — the server-side Supabase client uses `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Per `security.md`, server clients must use `SUPABASE_SERVICE_ROLE_KEY`.

13. **Fix `src/lib/auth/admin-session.ts`** — same issue as above; admin session client uses anon key.

14. **Add `ARCGIS_TOKEN` and `TOMTOM_API_KEY` to `.env.example`** — both are referenced in source code but undocumented.

15. **Fix CARTO variables in `.env`** — lines 75–79 use YAML colon syntax instead of `=`. They will not be parsed by dotenv.

16. **Consolidate Cesium token naming** — pick one canonical name (`CESIUM_ION_TOKEN`) and use it everywhere. Remove `CESIUM_ION_ACCESS_TOKEN` and `COPILOT_MCP_CESIUM_ION_TOKEN` as aliases.

17. **Remove duplicate `SUPABASE_SERVICE_ROLE_KEY`** from `.env.example` (appears twice).

### Priority 4 — CI/CD

18. **Add GitHub Secrets** for Terraform workflow: `GCP_PROJECT_ID`, `GCP_WIF_PROVIDER`, `GCP_WIF_SERVICE_ACCOUNT`. Without these, `terraform.yml` will fail on any `infra/` change.

19. **Add `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT`** as GitHub Secrets for the release workflow.

20. **Consider migrating to Doppler or Vercel environment variables** as the single source of truth for all secrets, eliminating the `.env` file from the repository entirely.

---

## Summary

**What is missing:**
- `SUPABASE_SERVICE_ROLE_KEY` (empty — server auth broken in prod)
- `IMPERSONATION_JWT_SECRET` (not set — hard runtime crash)
- `SUPABASE_URL` for backend (backend uses wrong default)
- `DATABASE_URL` production value (points to localhost)
- `SENTRY_DSN` for backend (different name from frontend var)
- `GEE_SERVICE_ACCOUNT` + `GEE_PRIVATE_KEY` (Earth Engine pipeline dead)
- `R2_*` credentials (Cloudflare R2 storage unavailable)
- `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `HUGGINGFACE_TOKEN` (ML services disabled)
- All GitHub Secrets for Terraform CI (`GCP_*`)
- `IMPERSONATION_JWT_SECRET` not in `.env.example` at all

**What is already present:**
- Supabase URL and anon key (frontend)
- Sentry DSN (frontend)
- Cesium Ion token
- Stripe test keys
- ArcGIS credentials
- All MCP server tokens (Gemini, Context7, Exa, Vercel, Firecrawl, Browserbase)
- OpenSky credentials
- Doppler token

**What must be done before the project can proceed:**
1. Rotate every secret in `.env` — all are compromised by being committed to the repository.
2. Purge `.env` from git history.
3. Set `SUPABASE_SERVICE_ROLE_KEY` and `IMPERSONATION_JWT_SECRET` in Vercel — without these, the app cannot authenticate users or perform impersonation.
4. Set production `DATABASE_URL` and `SUPABASE_URL` in Railway — without these, the backend is non-functional in production.

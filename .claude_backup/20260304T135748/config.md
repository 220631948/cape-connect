# Config Manager — Environment Variable Reference

## Purpose
Maps every environment variable in `.env.example` to the agent that uses it and the milestone where it's first required.

## Variable → Agent → Milestone Map

| Variable | Required | First Needed | Agent | Absent Behaviour |
|----------|----------|-------------|-------|-----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | **YES** | M0 | All | App fails to start |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | **YES** | M0 | All | App fails to start |
| `SUPABASE_SERVICE_ROLE_KEY` | **YES** (server) | M1 | DB-AGENT | Server actions fail |
| `MARTIN_URL` | No | M4b | OVERLAY-AGENT | Tiles from Supabase fallback |
| `NEXT_PUBLIC_GOOGLE_STREET_VIEW_KEY` | No | M10 | DETAILS-AGENT | Street View tab hidden |
| `MAPBOX_TOKEN` | No | M3 | MAP-AGENT | Satellite toggle hidden |
| `NEXT_PUBLIC_SENTRY_DSN` | No | M14 | TEST-AGENT | Error tracking disabled |
| `ARCGIS_CLIENT_ID` | No | M5 | OVERLAY-AGENT | ArcGIS premium layers use public fallback |
| `POSTGRES_DB` | Local dev | M0 | DB-AGENT | Docker Compose default: `capegis` |
| `POSTGRES_USER` | Local dev | M0 | DB-AGENT | Docker Compose default: `postgres` |
| `POSTGRES_PASSWORD` | Local dev | M0 | DB-AGENT | Docker Compose default: `postgres` |
| `DATABASE_URL` | Local dev | M0 | DB-AGENT | Used by Supabase CLI |

## Milestone Readiness Checklist

### M0 — Foundation
Required env vars:
- [x] `NEXT_PUBLIC_SUPABASE_URL`
- [x] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [x] `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `DATABASE_URL`

### M1 — Database Schema
Additional required:
- [ ] `SUPABASE_SERVICE_ROLE_KEY`

### M3 — Base Map
Optional but recommended:
- [ ] `MAPBOX_TOKEN` (for satellite layer)

### M4b — Martin Integration
Optional:
- [ ] `MARTIN_URL`

### M5 — Zoning Overlay
Optional:
- [ ] `ARCGIS_CLIENT_ID`

### M10 — Property Detail
Optional:
- [ ] `NEXT_PUBLIC_GOOGLE_STREET_VIEW_KEY`

### M14 — QA
Optional:
- [ ] `NEXT_PUBLIC_SENTRY_DSN`

## Security Rules
- **Never** commit `.env` (only `.env.example`)
- **Never** use `SUPABASE_SERVICE_ROLE_KEY` in client-side code
- **Only** `NEXT_PUBLIC_*` variables are exposed to the browser
- **All** server-side env vars must be accessed via `process.env` in server components or API routes

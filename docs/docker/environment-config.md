# Docker Environment Configuration

> **TL;DR:** Environment variables are defined in `.env.example` and documented here. Required vars (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`) must be set or the app fails. Optional vars degrade gracefully. Never commit real secrets (CLAUDE.md Rule 3). See `CLAUDE.md` §7 for the authoritative variable table.

## Required Variables (from CLAUDE.md §7)

| Variable | Required | Absent Behaviour |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | **YES** | App fails to start |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | **YES** | App fails to start |
| `SUPABASE_SERVICE_ROLE_KEY` | **YES** (server) | Server actions fail |

## Optional Variables (from CLAUDE.md §7)

| Variable | Absent Behaviour |
|---|---|
| `NEXT_PUBLIC_GOOGLE_STREET_VIEW_KEY` | Street View feature hidden |
| `MAPBOX_TOKEN` | Satellite toggle hidden |
| `NEXT_PUBLIC_SENTRY_DSN` | Error tracking disabled |
| `MARTIN_URL` | Tiles from Supabase fallback |

## Docker-Specific Variables (from `docker-compose.yml`)

| Variable | Service | Default | Notes |
|---|---|---|---|
| `POSTGRES_DB` | PostGIS | `capegis` | Database name |
| `POSTGRES_USER` | PostGIS | `postgres` | DB username |
| `POSTGRES_PASSWORD` | PostGIS | `postgres` | DB password (local dev only) |
| `DATABASE_URL` | Martin | `postgres://postgres:postgres@postgis:5432/capegis` | PostGIS connection |
| `LOCALSTACK_AUTH_TOKEN` | LocalStack | from `.env` | Pro features auth |

## Security Classification
- **SECRET:** Credential material — rotate on exposure, never commit real values
- **CONFIG:** Non-secret runtime setting — validate for tenant-safe defaults

### Rotation Triggers
- Suspected leak, CI log exposure, accidental commit, contributor offboarding, or provider advisory

## Docker Volumes

| Volume | Purpose | Persistent |
|---|---|---|
| `postgis_data` | PostgreSQL data directory | Yes |
| `localstack_data` | LocalStack state | Yes |

## Operational Fallback (per CLAUDE.md Rule 2)

| Dependency | Primary | Fallback | Operator Action |
|---|---|---|---|
| Supabase | Cloud instance | Local PostGIS (Docker) | Use `docker compose up -d` |
| Martin tiles | Martin server | Supabase-backed fallback | Set `MARTIN_URL` or omit |
| Street View | Google API | Feature hidden | No action needed |
| Sentry | Cloud DSN | Monitoring disabled | No action needed |

## Assumptions
- **[VERIFIED]** Required variables match `CLAUDE.md` §7 (3 required, 4 optional)
- **[VERIFIED]** Docker services match `docker-compose.yml` (postgis, martin, localstack)
- **[ASSUMPTION — UNVERIFIED]** Production key strategy (shared vs per-tenant) pending billing decision

## References
- `CLAUDE.md` §7 (authoritative env var table)
- `.env.example` (template with documentation)
- `docker-compose.yml` (service definitions)
- `docs/docker/DOCKER_README.md` (setup guide)

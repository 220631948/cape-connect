# Docker README — Local Development

> **TL;DR:** Run `docker compose up -d` to start PostGIS (kartoza/postgis:17-3.5), Martin (MapLibre MVT server), and LocalStack. Copy `.env.example` → `.env` first. Never commit real secrets. See `CLAUDE.md` §7 for required env vars and `docker-compose.yml` for service definitions.

## Quick Start
```bash
cp .env.example .env         # Populate required values
docker compose up -d          # Start PostGIS + Martin + LocalStack
npm install                   # Install Node dependencies
npm run dev                   # Start Next.js dev server
```

## Services (from `docker-compose.yml`)

| Service | Image | Port | Purpose |
|---|---|---|---|
| `capegis-postgis` | `kartoza/postgis:17-3.5` | 5432 | PostgreSQL 17 + PostGIS 3.5 |
| `capegis-martin` | `ghcr.io/maplibre/martin:latest` | 3001→3000 | Rust MVT tile server |
| `capegis-localstack` | `localstack/localstack-pro:latest` | 4566 | AWS service emulation |

## Service Dependencies
- Martin depends on PostGIS (`service_healthy` condition)
- PostGIS auto-runs migrations from `supabase/migrations/` on first start
- PostGIS data persists in `postgis_data` volume

## Healthcheck Verification
```bash
# PostGIS
docker exec capegis-postgis pg_isready -U postgres

# Martin (should return tile catalog)
curl http://localhost:3001/catalog

# LocalStack
curl http://localhost:4566/_localstack/health
```

## Environment Variables (Required for Docker)
| Variable | Service | Default |
|---|---|---|
| `POSTGRES_DB` | PostGIS | `capegis` |
| `POSTGRES_USER` | PostGIS | `postgres` |
| `POSTGRES_PASSWORD` | PostGIS | `postgres` |
| `DATABASE_URL` | Martin | `postgres://postgres:postgres@postgis:5432/capegis` |
| `LOCALSTACK_AUTH_TOKEN` | LocalStack | from `.env` |

## Common Issues

| Problem | Cause | Fix |
|---|---|---|
| PostGIS won't start | Port 5432 in use | `lsof -i :5432` and stop conflicting service |
| Martin can't connect | PostGIS not healthy yet | Wait for healthcheck; check `docker logs capegis-martin` |
| Migrations fail | SQL syntax error | Check `supabase/migrations/` files |
| LocalStack auth error | Missing token | Set `LOCALSTACK_AUTH_TOKEN` in `.env` |

## Assumptions
- **[VERIFIED]** `docker-compose.yml` defines 3 services: postgis, martin, localstack
- **[VERIFIED]** Martin connects to PostGIS via internal Docker network
- **[ASSUMPTION — UNVERIFIED]** LocalStack Pro token required for full feature set

## References
- `docker-compose.yml` (service definitions)
- `CLAUDE.md` §7 (environment variables)
- `docs/docker/environment-config.md` (full variable reference)
- `.env.example` (template)

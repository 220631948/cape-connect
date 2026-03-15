# GIS_SUPERSTACK_10_DEVOPS — DevOps Reference for CapeTown GIS Hub (capegis)

This document describes the recommended CI/CD, infrastructure, local development, backup, monitoring and security practices for the GIS Superstack Domain 10 — DEVOPS. It is intended for platform and infrastructure engineers working on the CapeTown GIS Hub project.

Note: follow the project's CLAUDE.md rules (no new unapproved libraries, RLS, POPIA, environment variable rules) and the repository Git Safety Protocol when making changes.

---

### Overview

This file covers:
- CI/CD (GitHub Actions) and release workflows
- Infrastructure for PostGIS and Martin tile server
- Vercel deployment patterns for Next.js App Router
- Docker Compose for local development
- Backups (Postgres/PostGIS, Martin tiles, Supabase storage)
- Monitoring and observability (Sentry optional, Prometheus/Grafana)
- Secrets and key handling
- Security hardening and access control
- Disaster recovery and rollback
- Operational runbooks and maintenance windows

Each section includes a recommended tool reference in the form: [Tool vX.X] – https://url, a small code/CLI snippet, and a short rollback note.

---

### GitHub Actions CI (build/test/deploy)

[GitHub Actions v3] – https://docs.github.com/actions

Purpose: Run tests, linters, build artifacts and optionally deploy to Vercel or a staging environment. Keep CI fast — split tests into parallel jobs.

Example workflow snippet (.github/workflows/ci.yml):

```yaml
name: CI
on: [push, pull_request]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Install Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      - name: Install deps
        run: pnpm install --frozen-lockfile
      - name: Run lint
        run: pnpm lint

  test:
    runs-on: ubuntu-latest
    needs: [lint]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: pnpm install --frozen-lockfile
      - run: pnpm test -- --ci

  build:
    runs-on: ubuntu-latest
    needs: [test]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: pnpm install --frozen-lockfile
      - run: pnpm build
      - name: Upload artifact
        uses: actions/upload-artifact@v4
        with:
          name: next-build
          path: .next
```

Rollback note: If a deploy job causes site regression, revert the merge commit or use the Vercel dashboard to roll back to the last successful deployment. Tag stable builds in Git for quick rollback.

---

### CD: Vercel and Staged Deployments

[Vercel Platform v3] – https://vercel.com/docs

Deploy Next.js App Router to Vercel. Use Preview Deployments for PRs and branch protection to gate production deploys.

CLI snippet: link a project and deploy from CI

```bash
# From CI or local developer machine
vercel --prod --confirm
# Or use deployments via Git integration (recommended)
```

GitHub Actions snippet to trigger Vercel preview (optional):

```yaml
- name: Deploy to Vercel (Preview)
  uses: amondnet/vercel-action@v20
  with:
    vercel-token: ${{ secrets.VERCEL_TOKEN }}
    vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
    vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
    working-directory: ./app
```

Rollback note: Use Vercel's Rollbacks feature to restore previous deployment. Keep a tag-to-deployment mapping in your release notes.

---

### Infrastructure: PostGIS on Managed or Self-Hosted

[PostgreSQL v15 / PostGIS v3.x] – https://www.postgresql.org/ and https://postgis.net/

Recommended: Managed Postgres (Supabase, DigitalOcean, AWS RDS) with point-in-time recovery (PITR) where possible. For local/dev, use Docker Compose.

docker-compose excerpt for PostGIS:

```yaml
# docker-compose.yml (PostGIS service)
services:
  postgis:
    image: postgis/postgis:15-3.4
    environment:
      POSTGRES_USER: capegis
      POSTGRES_PASSWORD: capegis_pw
      POSTGRES_DB: capegis_db
    ports:
      - '5432:5432'
    volumes:
      - postgis_data:/var/lib/postgresql/data

volumes:
  postgis_data:
```

Backup CLI snippet (pg_dump + gs/s3):

```bash
# Logical backup
PGPASSWORD="$PG_PASS" pg_dump -h $PG_HOST -U $PG_USER -Fc -d $PG_DB -f dump-$(date +%F).dump
# Upload to object storage
aws s3 cp dump-$(date +%F).dump s3://capegis-backups/postgres/
```

Rollback note: Restore to a new instance first for verification. For PITR-enabled managed DBs, use the provider console to perform point-in-time restore. Avoid overwriting production data until validated.

---

### Martin Tile Server (MVT)

[Martin v0.12+] – https://github.com/hkjn/martin

Martin serves vector tiles (MVT) from local MBTiles or PostGIS. Run as Docker container or systemd service.

docker-compose snippet for Martin:

```yaml
services:
  martin:
    image: ghcr.io/hkjn/martin:latest
    environment:
      - MARTIN_DATABASE_URL=postgres://capegis:capegis_pw@postgis:5432/capegis_db
      - MARTIN_LOG_LEVEL=info
    ports:
      - '6767:6767'
    depends_on:
      - postgis
```

Serve tiles via reverse proxy (Caddy/Nginx) with TLS.

Backup note: Martin commonly uses PostGIS or MBTiles. For MBTiles store the MBTiles file in object storage and version it. For PostGIS-backed tiles, rely on PostGIS backups (see PostGIS section).

Rollback note: If a new Martin release breaks tile serving, revert to previous container image by pinning image digest in docker-compose and redeploying the prior image.

---

### Local Development: Docker Compose (PostGIS + Martin + Martin data loader)

[Docker Compose v2.18] – https://docs.docker.com/compose/

Example docker-compose.dev.yml (dev-friendly):

```yaml
version: '3.8'
services:
  postgis:
    image: postgis/postgis:15-3.4
    environment:
      POSTGRES_USER: capegis
      POSTGRES_PASSWORD: capegis_pw
      POSTGRES_DB: capegis_db
    volumes:
      - ./supabase/migrations:/docker-entrypoint-initdb.d
      - postgis_data:/var/lib/postgresql/data
    ports:
      - '5432:5432'

  martin:
    image: ghcr.io/hkjn/martin:latest
    environment:
      MARTIN_DATABASE_URL: postgres://capegis:capegis_pw@postgis:5432/capegis_db
    depends_on:
      - postgis
    ports:
      - '6767:6767'

  web:
    build: .
    command: pnpm dev --filter app
    volumes:
      - .:/workspace
    ports:
      - '3000:3000'
    depends_on:
      - postgis

volumes:
  postgis_data:
```

CLI snippet to start local stack:

```bash
docker compose -f docker-compose.dev.yml up --build --remove-orphans
```

Rollback note: Local stacks are ephemeral. If migrations cause local breakage, reset the volume: `docker compose down -v` and re-run the stack.

---

### Tile Generation & MBTiles (Offline builds)

[tippecanoe v1.42] – https://github.com/mapbox/tippecanoe

For large vector tiles or offline generation, build MBTiles from GeoJSON/TopoJSON and upload to object storage or mount to Martin.

Example tippecanoe command:

```bash
tippecanoe -o suburbs.mbtiles -l suburbs -z12 -Z6 --drop-smallest-as-needed suburbs.geojson
```

Upload and serve using Martin or static MBTiles server.

Rollback note: Keep original source GeoJSON and MBTiles versioned. If a tileset causes client regressions, swap back to an older MBTiles file and reload Martin.

---

### Backups: Postgres, MBTiles, and Object Storage

[pgBackRest v2.40] – https://pgbackrest.org/

Guidelines:
- Logical daily backups (pg_dump) + weekly full dumps
- PITR via WAL archiving when using self-hosted PostgreSQL
- MBTiles and uploaded static tiles: version and store in object storage with lifecycle policy
- Retention: keep 30 days of daily backups, 12 weekly snapshots, 12 monthly snapshots (adjust to cost and policy)

Example WAL archiving (self-hosted):

```bash
# On Postgres server
archive_command = 'test ! -f /var/lib/postgresql/wal_archive/%f && cp %p /var/lib/postgresql/wal_archive/%f'
```

Example restore (pg_restore from dump):

```bash
pg_restore -h new-db-host -U capegis -d capegis_db dump-2026-03-01.dump
```

Rollback note: Always restore into an isolated recovery instance and run smoke tests before swapping traffic. Document RTO and RPO in runbooks.

---

### Monitoring & Observability

[Prometheus v2.50] – https://prometheus.io/
[Grafana v10] – https://grafana.com/

What to monitor:
- Postgres: replication lag, connection counts, long-running queries, WAL usage
- Martin: request rate, error rate, latency, tile generation errors
- Vercel: deployment health, build durations (via Vercel logs + custom metrics)
- Application: RUM and server errors, trace sampling

Prometheus exporter examples:
- postgres_exporter for Postgres
- node exporter for host metrics
- custom metrics via /metrics endpoints for Martin

Grafana alerting: configure Slack/email escalation for P1/P2 alerts.

Sentry (optional): capture application exceptions and performance traces.
[Sentry SDK v1.x] – https://docs.sentry.io/

Rollback note: If an alert storm follows a release, consider rolling back the deployment and throttling alerts temporarily while diagnosing.

---

### Secrets Management and Environment Variables

[HashiCorp Vault v1.15] – https://www.vaultproject.io/

Principles:
- No secrets in source code. Use secrets manager (Vault, GitHub Secrets, Vercel environment variables)
- Use short-lived credentials where possible
- Restrict access via role-based policies

Example: set Vercel secrets from CI

```bash
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
```

GitHub Actions usage:

```yaml
- name: Use secrets
  env:
    SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
```

Rollback note: If a rotated secret breaks services, use provider console to rollback to the previous secret/version or re-issue and update dependent services in a controlled maintenance window.

---

### Security Practices and Hardening

[OpenSCAP / CIS benchmarks] – https://www.cisecurity.org/

Checklist:
- Network: allow minimal inbound ports (SSH restricted, Postgres only from app hosts), use private VPCs
- TLS everywhere: terminate TLS at reverse proxy, enforce HSTS
- RLS on all tenant tables (see CLAUDE.md Rule 4)
- Audit logging (database and application)
- Regular dependency scanning (Dependabot/GitHub code scanning)
- Use WAF for public endpoints

Example firewall rule (UFW):

```bash
ufw allow from 10.0.0.0/8 to any port 5432 proto tcp
ufw allow 80,443/tcp
ufw deny 0.0.0.0/0 to any port 22
```

POPIA annotation requirement: any file handling PII must include the POPIA ANNOTATION block as per CLAUDE.md Rule 5.

Rollback note: For discovered security misconfigurations, isolate affected services and roll back network changes. Use trusted snapshots to restore state if necessary.

---

### Deployment Rollback Strategies

[Git Tags & Releases] – https://docs.github.com/releases

Patterns:
- Blue/Green or Canary deployments where possible (Vercel supports atomic deployments)
- Keep artifacts for every build and tag stable releases
- Database migrations: prefer backward-compatible migrations and feature flags. Two-step migration pattern: (1) deploy additive schema change, (2) backfill, (3) switch behavior, (4) cleanup

Example rollback CLI:

```bash
# Revert to previous git tag and redeploy to Vercel
git checkout tags/v1.4.2 -b rollback-v1.4.2
vercel --prod --confirm
```

Rollback note: Never attempt to rollback DB schema by applying the old schema blindly. Use forward/backward compatible migration patterns and a dedicated rollback plan in the migration file.

---

### Maintenance Windows, Runbooks, and On-call

[PagerDuty] – https://www.pagerduty.com/

Include runbooks for:
- Restoring from backups
- Replacing Martin container and reloading tiles
- Rotating keys and secrets
- Scaling Postgres read replicas

On-call: ensure engineers have clear escalation paths and documented steps for common incidents. Record post-mortems for P1 incidents.

Rollback note: Schedule maintenance and inform tenants. Use read-only mode for critical DB operations if necessary.

---

### Cost & Scaling Considerations

[AWS/Azure/GCP cost calculators] – provider-specific

- Monitor storage costs for MBTiles and backup retention
- Use autoscaling for tile-serving frontends and read replicas for heavy analytical queries

Snippet: scale Martin replicas behind a load balancer (k8s example):

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: martin
spec:
  replicas: 3
  template:
    spec:
      containers:
      - name: martin
        image: ghcr.io/hkjn/martin:latest
```

Rollback note: If autoscaling causes cost surge, scale down replicas and review traffic patterns; enable budget alerts.

---

### Compliance & Data Residency

[GDPR/POPIA Guidance] – https://www.gov.za/ and https://gdpr-info.eu/

- Geo-located datasets limited to City of Cape Town and Western Cape scope (see CLAUDE.md Rule 9)
- Ensure data retention policies match POPIA annotation and tenant agreements

Rollback note: If compliance breach suspected, contact legal and take systems offline for forensics. Preserve logs and snapshots.

---

### Appendix: Useful CLI Recipes

Postgres dump (logical):

```bash
PGPASSWORD="$PG_PASS" pg_dump -h $PG_HOST -U $PG_USER -Fc -d $PG_DB -f dump-$(date +%F).dump
```

Postgres restore:

```bash
pg_restore -h host -U user -d dbname dump-file.dump
```

Martin: restart container safely

```bash
docker compose restart martin
# Or pull previous image digest and update docker-compose with pinned digest
```

Vercel: list deployments

```bash
vercel ls --token $VERCEL_TOKEN
```

---

File history and authorship

Path: /home/mr/Desktop/Geographical Informations Systems (GIS)/docs/research/GIS_SUPERSTACK_10_DEVOPS.md

If this document deviates from project-level policies (CLAUDE.md), document deviation in docs/PLAN_DEVIATIONS.md and escalate if necessary.

Generated: 2026-03-15

# Local Development with Docker & LocalStack

> **TL;DR:** Run the full GIS stack locally with `docker compose up -d`: PostGIS (kartoza/postgis:17-3.5 on :5432), Martin (v1.3.1 on :3001), and LocalStack S3 (:4566). Everything runs offline after images are downloaded — perfect for load-shedding. Production migration requires only env var changes. Use `test`/`test` for LocalStack creds.
>
> **Roadmap Relevance:** M0 (Bootstrap) — local dev environment setup. Enables all development across M1–M15 without cloud dependencies.

> Research completed: 26 February 2026 — Cape Town White-Label GIS Platform

---

## 1. What Are Docker and LocalStack? (Plain English)

### Docker

**Docker** is a tool that packages software into standardised units called **containers**. Think of a container as a tiny, self-contained computer that runs one service (a database, a tile server, etc.) with all its dependencies baked in.

**Why it matters for our GIS project:**
Instead of installing PostgreSQL + PostGIS + Martin + their specific C libraries onto your Ubuntu machine (and fighting version conflicts for hours), you write a single `docker-compose.yml` file and run **one command**. Docker downloads pre-built images and starts everything automatically, identically, every time.

> **Key concept:** A **Docker image** is a blueprint (e.g., `kartoza/postgis:17-3.5`). A **container** is a running instance of that image.

### LocalStack Pro

**LocalStack Pro** (which you have!) unlocks even more power:
- **Web UI:** View and manage your local resources in a browser.
- **Advanced Emulation:** Mock services like **RDS** (PostgreSQL-as-a-service), **Cognito** (Identity), and even **Route53**.
- **Ephemeral Environments:** Easily create and tear down complete stacks for testing.

| Concept | Real AWS | LocalStack Equivalent |
|---------|----------|----------------------|
| S3 Bucket | `s3.eu-west-1.amazonaws.com` | `http://localhost:4566` |
| Access Key | `AKIA...` (real IAM creds) | `test` (any string works) |
| Secret Key | `wJal...` (real secret) | `test` (any string works) |
| Region | `eu-west-1` | `af-south-1` (or anything) |
| **Web UI** | `aws.amazon.com/console` | `https://app.localstack.cloud` (connected to local) |

**Sources:**
- [Docker Documentation](https://docs.docker.com/get-started/)
- [LocalStack Pro Documentation](https://docs.localstack.cloud/user-guide/pro/)
- [LocalStack Web UI](https://app.localstack.cloud)

---

## 2. Prerequisites

Before running anything, make sure these are installed on your Linux machine:

| Tool | Purpose | Install Command | Verify |
|------|---------|----------------|--------|
| **Docker Engine** | Runs containers | [Install Docker Engine](https://docs.docker.com/engine/install/ubuntu/) | `docker --version` |
| **Docker Compose** | Orchestrates multi-container apps | Bundled with Docker Engine v2+ | `docker compose version` |
| **AWS CLI v2** | Interact with S3/LocalStack | `sudo apt install awscli` or [AWS CLI Install](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html) | `aws --version` |
| **awscli-local** | Wrapper that auto-targets LocalStack | `pip install awscli-local` | `awslocal --version` |
| **psql** (optional) | Connect to PostGIS directly | `sudo apt install postgresql-client` | `psql --version` |

> [!IMPORTANT]
> Make sure your user is in the `docker` group so you don't need `sudo` for every Docker command:
> ```bash
> sudo usermod -aG docker $USER
> # Then log out and log back in
> ```

---

## 3. Starting the Stack

### Step 1: Start all services

From the project root (`/home/mr/Desktop/Geographical Informations Systems (GIS)/`):

```bash
docker compose up -d
```

This pulls three images and starts three containers:

| Container | Image | Port | What It Does |
|-----------|-------|------|--------------|
| `gis_db` | `kartoza/postgis:17-3.5` | `localhost:5432` | PostgreSQL 17 + PostGIS 3.5 spatial database |
| `gis_martin` | `maplibre/martin:v1.3.1` | `localhost:3001` | Serves vector tiles from PostGIS tables |
| `gis_localstack` | `localstack/localstack:4` | `localhost:4566` | Emulates AWS S3 for file storage |

### Step 2: Verify everything is running

```bash
# Check all containers are "Up" and healthy
docker compose ps
```

Expected output:
```
NAME             IMAGE                        STATUS                    PORTS
gis_db           kartoza/postgis:17-3.5       Up (healthy)              0.0.0.0:5432->5432/tcp
gis_martin       maplibre/martin:v1.3.1       Up                        0.0.0.0:3001->3000/tcp
gis_localstack   localstack/localstack:4      Up                        0.0.0.0:4566->4566/tcp
```

### Step 3: Verify each service individually

**PostGIS:**
```bash
# Connect to the database
psql -h localhost -p 5432 -U gis_admin -d gis_platform

# Inside psql, verify PostGIS is installed:
SELECT PostGIS_Full_Version();
# Expected: POSTGIS="3.5.x" ...

# Exit psql
\q
```

**Martin:**
```bash
# Check Martin's catalog (should show an empty list initially)
curl http://localhost:3001/catalog
```

**LocalStack:**
```bash
# Check LocalStack health
curl http://localhost:4566/_localstack/health
# Expected: {"services": {"s3": "available"}, ...}
```

---

## 4. Configuring Your Development Environment

### Environment Variables

Create a `.env.local` file in `apps/web/` (the Next.js project) with these values:

```env
# ─── PostGIS (Local Docker) ───────────────────────────────────────────
DATABASE_URL="postgresql://gis_admin:gis_password@localhost:5432/gis_platform"

# ─── Martin Tile Server (Local Docker) ────────────────────────────────
NEXT_PUBLIC_TILE_URL="http://localhost:3001"

# ─── LocalStack Pro (Local Docker) ───────────────────────────────────
# Replace with your actual token from app.localstack.cloud
LOCALSTACK_AUTH_TOKEN="ls-..." 
AWS_ACCESS_KEY_ID="test"
AWS_SECRET_ACCESS_KEY="test"
AWS_REGION="af-south-1"
AWS_ENDPOINT_URL="http://localhost:4566"
S3_BUCKET_TENANT_ASSETS="tenant-assets"

# ─── Supabase (Cloud — add when ready) ───────────────────────────────
# NEXT_PUBLIC_SUPABASE_URL=
# NEXT_PUBLIC_SUPABASE_ANON_KEY=
# SUPABASE_SERVICE_ROLE_KEY=

# ─── Map Defaults (Cape Town) ────────────────────────────────────────
NEXT_PUBLIC_MAP_CENTER_LAT=-33.9249
NEXT_PUBLIC_MAP_CENTER_LNG=18.4241
NEXT_PUBLIC_MAP_ZOOM=11
```

### How Applications Find LocalStack Instead of Real AWS

The magic is in `AWS_ENDPOINT_URL`. When your Next.js app (or any AWS SDK) sees this environment variable, it sends all S3 requests to `http://localhost:4566` instead of `https://s3.amazonaws.com`.

```typescript
// Example: Using AWS SDK v3 with LocalStack in Next.js
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  endpoint: process.env.AWS_ENDPOINT_URL,         // Points to LocalStack!
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,   // "test"
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!, // "test"
  },
  forcePathStyle: true, // Required for LocalStack S3
});

// Upload a tenant logo
await s3.send(new PutObjectCommand({
  Bucket: 'tenant-assets',
  Key: 'logos/stellenbosch-municipality.png',
  Body: fileBuffer,
  ContentType: 'image/png',
}));
```

When you're ready for production, you simply remove `AWS_ENDPOINT_URL` and replace the credentials with real ones. **Zero code changes required.**

---

## 5. Working with LocalStack S3

### Create the Tenant Assets Bucket

After LocalStack is running, create the S3 bucket your app will use:

```bash
# Create the bucket
awslocal s3 mb s3://tenant-assets

# Verify it exists
awslocal s3 ls
# 2026-02-26 14:30:00 tenant-assets
```

### Upload and Retrieve Files

```bash
# Upload a test logo
awslocal s3 cp ./test-logo.png s3://tenant-assets/logos/test-logo.png

# List files in the bucket
awslocal s3 ls s3://tenant-assets/logos/
# 2026-02-26 14:31:00     12345 test-logo.png

# Get the file URL (for use in your Next.js <img> tags)
# http://localhost:4566/tenant-assets/logos/test-logo.png
```

### Create a Bucket for PMTiles

If you want to serve static vector tiles (PMTiles) without Martin:

```bash
awslocal s3 mb s3://map-tiles
awslocal s3 cp ./cape-town-buildings.pmtiles s3://map-tiles/
```

MapLibre GL JS can load these directly via the `pmtiles://` protocol pointing at your local S3.

---

## 6. Best Practices

### Credentials

| Practice | Why |
|----------|-----|
| Always use `test` / `test` for LocalStack access keys | LocalStack accepts any non-empty string. Using `test` is a convention that makes it obvious you're in local mode. |
| Never put real AWS credentials in `.env.local` | If you accidentally commit them, they could be exposed. LocalStack doesn't need real creds. |
| Use `.env.local` (not `.env`) for secrets | Next.js `.env.local` is gitignored by default. |

### Data Persistence

| Scenario | Command | What Happens |
|----------|---------|--------------|
| Stop containers, keep data | `docker compose down` | Data survives in Docker volumes (`pgdata`, `localstack_data`) |
| Start containers again | `docker compose up -d` | Picks up exactly where you left off |
| Nuke everything and start fresh | `docker compose down -v` | Deletes all volumes — database wiped, S3 buckets gone |

### Port Conflicts

| Service | Default Port | If Conflicting |
|---------|-------------|---------------|
| PostgreSQL | 5432 | Change to `5433:5432` in docker-compose.yml |
| Martin | 3001 | Change to `3002:3000` |
| LocalStack | 4566 | Change to `4567:4566` |

### Viewing Logs

```bash
# All containers
docker compose logs -f

# Just the database
docker compose logs -f db

# Just LocalStack
docker compose logs -f localstack
```

---

## 7. How This Fits Into the Development Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│                    YOUR LAPTOP (Offline-Capable)                 │
│                                                                 │
│  ┌──────────┐  ┌───────────┐  ┌─────────────┐  ┌───────────┐  │
│  │ Next.js  │  │  kartoza/ │  │  maplibre/  │  │ localstack│  │
│  │ dev      │──│  postgis  │──│  martin     │  │ (fake S3) │  │
│  │ :3000    │  │  :5432    │  │  :3001      │  │ :4566     │  │
│  └──────────┘  └───────────┘  └─────────────┘  └───────────┘  │
│       │               │               │               │        │
│       │     SQL queries│    Vector Tiles│     File uploads│     │
│       └───────────────┴───────────────┴───────────────┘        │
│                                                                 │
│  Everything runs locally. No internet required after images     │
│  are downloaded. Perfect for South African loadshedding. ⚡     │
└─────────────────────────────────────────────────────────────────┘

                    ↓ When ready to deploy ↓

┌─────────────────────────────────────────────────────────────────┐
│                    PRODUCTION (Cloud)                            │
│                                                                 │
│  Next.js → Vercel          PostGIS → Supabase (London)          │
│  Martin → Fly.io/Railway   S3 → Supabase Storage / Cloudflare  │
└─────────────────────────────────────────────────────────────────┘
```

### The Iterative Cycle

1. **`docker compose up -d`** — Start your local cloud.
2. **`npm run dev`** — Start Next.js (connects to local PostGIS, Martin, LocalStack).
3. **Build features** — Write code, add layers, test tenant branding.
4. **Test offline** — Disconnect from internet. App still works because everything is local.
5. **When satisfied** — Push code to git, connect Supabase cloud credentials, deploy.

### What Changes Between Local and Production?

| Component | Local | Production |
|-----------|-------|------------|
| Database | `kartoza/postgis:17-3.5` on Docker | Supabase PostgreSQL (London `eu-west-1`) |
| Tile Server | `maplibre/martin:v1.3.1` on Docker | Martin on Fly.io or Railway |
| File Storage | LocalStack S3 on Docker | Supabase Storage or Cloudflare R2 |
| Auth | Supabase Auth (cloud, free tier) | Same Supabase Auth (already cloud) |
| Map Tiles | CARTO basemap CDN (needs internet) | Same CDN |

**The only thing that changes is environment variables.** Your application code stays identical.

---

## Why kartoza/postgis?

We are using `kartoza/postgis` instead of the official `postgis/postgis` image for local development. Here's why:

| Feature | kartoza/postgis | postgis/postgis |
|---------|----------------|-----------------|
| **SSL by default** | ✅ Self-signed certs included | ❌ Manual setup required |
| **Multiple extensions** | ✅ `POSTGRES_MULTIPLE_EXTENSIONS` env var | ❌ Manual SQL required |
| **Built by** | [Kartoza](https://kartoza.com/) (South African GIS consultancy) | PostGIS core team |
| **Replication support** | ✅ Built-in primary/replica | ❌ Manual |
| **PG 17 + PostGIS 3.5** | ✅ Tagged `17-3.5` | ✅ Tagged `17-3.5` |
| **PG 18 + PostGIS 3.6** | ✅ Tagged `18-3.6` | ✅ Tagged `18-3.6` |
| **Custom init scripts** | ✅ `/docker-entrypoint-initdb.d/` | ✅ Same |

> [!NOTE]
> For **production** (Supabase cloud), we use Supabase's managed PostgreSQL which is based on the official PostgreSQL image. The kartoza image is for **local development only**. There is no vendor lock-in — PostgreSQL is PostgreSQL.

**Sources:**
- [kartoza/docker-postgis GitHub](https://github.com/kartoza/docker-postgis) — Full documentation and environment variables
- [Kartoza Company](https://kartoza.com/) — South African open-source GIS company
- [LocalStack S3 Docs](https://docs.localstack.cloud/user-guide/aws/s3/) — S3 emulation specifics
- [Docker Compose Docs](https://docs.docker.com/compose/) — Official Compose reference

---

*Research completed: 26 February 2026*
*Sources: docs.localstack.cloud, github.com/kartoza/docker-postgis, martin.maplibre.org, docs.docker.com*

# infra/ — Infrastructure & Deployment Configuration

Deployment, CI/CD, and infrastructure-as-code for CapeTown GIS Hub.

## Structure

```
infra/
├── docker/
│   ├── Dockerfile.backend     # → backend/Dockerfile (OSGEO GDAL base)
│   └── docker-compose.yml     # → backend/docker-compose.yml (local dev)
├── railway/
│   └── railway.toml           # Railway.app deployment config
├── vercel/
│   └── vercel.json            # → root vercel.json (frontend deploy)
└── README.md
```

## Deployment Targets

| Service  | Platform     | Config Source            |
|----------|--------------|--------------------------|
| Frontend | Vercel       | `vercel.json` (root)     |
| Backend  | Railway.app  | `backend/Dockerfile`     |
| Database | Supabase     | Managed (no IaC)         |
| Tiles    | DigitalOcean | Martin Docker on Droplet |
| Storage  | Cloudflare   | R2 via S3 API            |

## CI/CD Workflows

Located in `.github/workflows/`:

- `ci.yml` — build, test, lint (frontend + backend)
- `security.yml` — CodeQL SAST, dependency audit, license check
- `pr-validation.yml` — conventional commits, rebase check, file size
- `deploy.yml` — CI gate → Vercel + Railway deployment
- `auto-rebase.yml` — `/rebase` PR comment trigger

## Locked Decisions

- GDAL: OSGEO Docker base image ONLY — never `pip install gdal`
- CORS: Vercel domain only — no wildcard in production
- All actions SHA-pinned, least-privilege permissions

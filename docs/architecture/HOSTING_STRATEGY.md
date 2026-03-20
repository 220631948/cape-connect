# HOSTING_STRATEGY.md — CapeTown GIS Hub

This document explains the rationale for each hosting decision in the `capegis` ecosystem.

## Core Infrastructure

| Component                        | Platform                  | Rationale                                                                                                                                                                              |
| -------------------------------- | ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Frontend & API Routes**        | **Vercel**                | Next.js 15 native support, edge middleware for tenant resolution, global CDN, and automated preview deployments. _Limit:_ No persistent server processes (max 30s-60s execution time). |
| **Vector Tile Server (Martin)**  | **Heroku / DigitalOcean** | Requires a persistent Rust process and Docker support. Heroku (Container Registry) provides a managed environment with easy scaling and student credits fit.                           |
| **Spatial Database**             | **Supabase**              | PostgreSQL 17 + PostGIS 3.5 is irreplaceable at this cost. Native RLS and Auth integration simplify the multi-tenant architecture.                                                     |
| **Batch Analysis (GPU/Compute)** | **Azure / GCP**           | Used for heavy lifting like Gaussian Splat conversion (Cesium) or large PMTiles generation. Azure credits used for non-persistent batch jobs only.                                     |

## Observability & Security

- **Doppler:** Centralized secrets management. Syncs keys to Vercel, Heroku, and LocalStack. Mandatory for Rule 3.
- **Datadog / Sentry:** Error tracking and performance monitoring. Sentry for frontend exceptions; Datadog for MCP server health and API latency.
- **LocalStack:** Local simulation of AWS services (S3 for Supabase Storage testing, SNS/SQS for async data ingestion).

## Free-Tier Activation Checklist (Recommended Order)

1. **Doppler:** Create `capegis` project and import `.env.local`.
2. **Supabase:** Initialize project and apply initial migrations (`M1`).
3. **Vercel:** Connect GitHub repo and sync Doppler secrets.
4. **Sentry:** Activate project and add `NEXT_PUBLIC_SENTRY_DSN` to Doppler.
5. **CodeScene:** Connect repo for technical debt monitoring and Rule 7 enforcement.
6. **LocalStack:** Initialize local Docker container with `ls-auth-token`.

## Scalability & Costs

The current architecture is designed to stay within **$0/month** for M17 research via:

- Vercel Hobby tier.
- Supabase Free tier.
- Heroku Student credits / DigitalOcean Free credits.
- GEE Community Tier.
- ArcGIS Location Platform free monthly credits.

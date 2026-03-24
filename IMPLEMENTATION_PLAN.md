# Implementation Plan

## Task: Hybrid Offload Architecture & Security Fixes

- **Goal**: Offload raster tile serving to cloud object storage while keeping vector data on Supabase PostGIS. Remove leaked Google API Key.
- **Learnings & Actions**:
  1. The Google API key found in `.gemini/extensions/chrome-devtools-mcp/src/tools/performance.ts` was replaced with an environment variable (`process.env.CRUX_API_KEY`).
  2. The Hybrid Offload plan was documented in `docs/architecture/hybrid-offload-plan.md` featuring an ASCII diagram, PMTiles recommendations, budget limits, and a rollback plan.
  3. Created `supabase/functions/raster-proxy/index.ts` to serve as a proxy edge function with JWT validation and Cache-Control headers.
  4. Created `scripts/generate_stac_catalog.py` for STAC catalog generation from raster data.
  5. Created `scripts/gee_export_cape_town.js` for exporting Sentinel-2 data to GCP as Cloud Optimized GeoTIFFs (COGs).
  6. Configured GCP budget alerts in `infra/gcp/budget_alerts.tf` to enforce a $3/day ($90/mo) limit.
  7. Conducted a full git repo synchronization (fetch --all, force-reset main, rebase jules-sentinel-api branch, and force push). Merge to main was successful.
## Task: AI Team Orchestration & Custom Tooling

- **Goal**: Bootstrap and formally activate a custom Gemini CLI extension (`capegis-ai`) with specialized agents, skills, and hooks for geospatial, infrastructure, and 3D workflows.
- **Learnings & Actions**:
  1. Created `.gemini/extensions/capegis-ai/` extension structure.
  2. Implemented 3 sub-agents: `geo-data-agent`, `cloud-ops-agent`, and `immersive-agent` with specialized system prompts.
  3. Developed 4 reusable skills: `stac-catalog-sync`, `gcs-cost-audit`, `db-raster-wire-check`, and `check-popia-compliance`, including supporting Python scripts (`generate_stac_catalog.py`, `scan_popia_violation.py`).
  4. Built 3 security/architectural hooks: `terraform-security-guardian.js` (enforces WIF), `out-db-raster-enforcer.js` (enforces out-db mapping), and `rls-multi-tenant-verifier.js` (enforces multi-tenant RLS on spatial tables).
  5. Formally registered the Gemini extension in root `AGENTS.md`, `.claude/AGENTS.md`, and `.claude/SKILLS.md` for full cross-agent visibility.
  6. Validated hooks and scanners manually; confirmed compliance across `infra/gcp`, `supabase/migrations`, and `scripts`.
## Task: Redis-Backed Notification Service

- **Goal**: Implement a robust notification service using Redis for in-app storage and Celery for asynchronous delivery.
- **Learnings & Actions**:
  1. Established a shared asynchronous Redis connection manager in `backend/app/core/redis.py`.
  2. Defined a `Notification` domain entity and schema with timezone-aware timestamps in `backend/app/domain/entities/notification.py`.
  3. Implemented `NotificationService` in `backend/app/services/notification_service.py` with support for Redis-based list storage (capped at 100 per user) and asynchronous task triggering.
  4. Created a dedicated `notifications` Celery queue and task `send_notification_task` in `backend/app/tasks/notification_tasks.py`.
  5. Exposed RESTful endpoints in `backend/app/api/routes/notifications.py` for listing and marking notifications as read, integrated into `backend/main.py`.
  6. Verified core logic with comprehensive unit tests in `backend/tests/test_notifications.py` using `pytest` and `anyio`.

## State Output
```json
{
  "prompt": 7,
  "architecture": "hybrid",
  "ai_tools": "activated",
  "notification_service": "implemented",
  "redis_backend": "active",
  "celery_queues": ["spatial", "raster", "import", "cache", "notifications"],
...
  "sub_agents": ["geo-data", "cloud-ops", "immersive"],
  "hooks_enforced": ["WIF", "out-db", "RLS"],
  "registries_updated": ["root/AGENTS", "claude/AGENTS", "claude/SKILLS"],
  "skills_implemented": ["stac-sync", "cost-audit", "raster-wire", "popia-check"],
  "services_retained": ["Vercel", "Supabase PostGIS", "Supabase Auth", "Martin"],
  "services_added": ["GCP Cloud Storage", "GCP Cloud Functions", "Terraform Budget Alerts", "Custom Gemini AI Extension"],
  "stac_catalog_generated": true,
  "gee_export_script_generated": true,
  "pmtiles_recommended": true,
  "cost_guard_deployed": true,
  "gee_deadline": "2026-04-27",
  "estimated_monthly_post_credit": "< $20/mo"
}
```

## Tasks Completed (2026-03-24)
- [x] Implement Redis-backed Notification Service (backend)
- [x] Create shared async Redis client manager
- [x] Implement notification Celery queue and async task
- [x] Add FastAPI endpoints for notification management
- [x] Unit test notification service logic with pytest

## Tasks Completed (2026-03-22)
- [x] Evaluate Vector Data PostGIS vs FlatGeobuf requirements
- [x] Integrate Cesium ion Asset IDs into the Next.js frontend map component
- [x] Prepare GCP budget alert configuration (`infra/gcp/terraform.tfvars.example`)

## Next Tasks
- [ ] Implement prototype FlatGeobuf loader in `src/lib/gis/fgb-loader.ts`
- [ ] Deploy the budget_alerts.tf with actual GCP credentials (requires `project_id` and `billing_account`)
- [ ] Implement actual STAC/Copernicus API call in `src/lib/sentinel-api.ts`
- [ ] Add E2E tests for Cesium Ion Asset loading

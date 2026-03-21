-- Migration 001: analysis_jobs table
-- Tracks spatial analysis background jobs (Celery task results)
-- See PYTHON_BACKEND_ARCHITECTURE.md Section 7

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

CREATE TABLE IF NOT EXISTS analysis_jobs (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id       UUID NOT NULL,
    user_id         UUID NOT NULL,
    job_type        TEXT NOT NULL CHECK (job_type IN (
                        'trading_bay_suitability',
                        'intersection',
                        'buffer',
                        'proximity_score',
                        'lulc_classification',
                        'sam_inference',
                        'flood_risk',
                        'heat_island'
                    )),
    status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
                        'pending', 'running', 'completed', 'failed', 'cancelled'
                    )),
    celery_task_id  TEXT,
    input_params    JSONB NOT NULL DEFAULT '{}',
    result          JSONB,
    error_message   TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    started_at      TIMESTAMPTZ,
    completed_at    TIMESTAMPTZ,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_analysis_jobs_tenant
    ON analysis_jobs (tenant_id);
CREATE INDEX IF NOT EXISTS idx_analysis_jobs_status
    ON analysis_jobs (status) WHERE status IN ('pending', 'running');
CREATE INDEX IF NOT EXISTS idx_analysis_jobs_user
    ON analysis_jobs (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analysis_jobs_celery
    ON analysis_jobs (celery_task_id) WHERE celery_task_id IS NOT NULL;

-- RLS policy: tenants can only see their own jobs
ALTER TABLE analysis_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY analysis_jobs_tenant_isolation ON analysis_jobs
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant')::UUID);

COMMENT ON TABLE analysis_jobs IS 'Tracks spatial/ML analysis background jobs dispatched via Celery';

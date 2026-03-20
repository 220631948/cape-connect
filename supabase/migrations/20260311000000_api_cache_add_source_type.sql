-- ============================================================
-- 20260311000000_api_cache_add_source_type.sql
-- CapeTown GIS Hub — api_cache: add source_type column
--
-- Purpose : Supports M7 flight-data multi-tenant history tracking
--           by tagging each cache row with a structured source type
--           (e.g. 'flight', 'weather', 'traffic').
--
-- Safety  : Column is nullable — existing rows are unaffected.
--           RLS policies are already in place from the initial schema
--           migration and do not need to be re-created here.
-- ============================================================

ALTER TABLE api_cache
  ADD COLUMN IF NOT EXISTS source_type TEXT;

COMMENT ON COLUMN api_cache.source_type IS
  'Structured category of the upstream data source '
  '(e.g. ''flight'', ''weather'', ''traffic''). '
  'Nullable; populated for M7+ rows only.';

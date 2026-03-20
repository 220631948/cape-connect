/**
 * @file src/lib/supabase/cache.ts
 * @description API Cache CRUD utilities for three-tier fallback.
 *
 * POPIA ANNOTATION
 * Personal data handled: query patterns (endpoints), source identifiers
 * Purpose: Three-tier fallback caching to reduce external API calls and
 *          serve data during outages
 * Lawful basis: legitimate interests (system performance and resilience)
 * Retention: TTL-bound; rows expire and are eligible for pruning after
 *            expires_at timestamp
 * Subject rights: access ✓ | correction ✓ | deletion ✓ | objection ✓
 */

import { createServerSupabaseClient } from './server';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Shape of a row in the api_cache table.
 * Column names match the actual DB schema from the initial migration.
 */
export interface CacheEntry<T> {
  /** Composite key: `${source}::${endpoint}` */
  cache_key: string;
  /** Serialised response payload stored as JSONB */
  data: T;
  /** Short identifier for the upstream data source (e.g. "opensky") */
  source: string;
  /** ISO-8601 timestamp after which this entry is considered stale */
  expires_at: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Builds the composite cache key from source and endpoint parts.
 * Kept centralised so callers and tests can share the same format.
 */
function buildCacheKey(source: string, endpoint: string): string {
  return `${source}::${endpoint}`;
}

/**
 * Resolves the tenant_id for the current authenticated session.
 * Returns null when called outside of an authenticated context (e.g. guest).
 */
async function resolveTenantId(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>
): Promise<string | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) return null;

  // tenant_id is stored in the user's JWT app_metadata by the auth hook
  const tenantId =
    (session.user.app_metadata?.tenant_id as string | undefined) ?? null;

  return tenantId;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * getCachedResponse
 *
 * Retrieves a valid (non-expired) cache entry from Supabase.
 * Returns null on cache miss, expiry, or any query error.
 *
 * Signature is stable — callers pass `source` and `endpoint` separately;
 * the composite key is constructed internally.
 */
export async function getCachedResponse<T>(
  source: string,
  endpoint: string
): Promise<T | null> {
  const supabase = await createServerSupabaseClient();
  const cacheKey = buildCacheKey(source, endpoint);

  const { data, error } = await supabase
    .from('api_cache')
    .select('data')
    .eq('cache_key', cacheKey)
    .gt('expires_at', new Date().toISOString())
    .single();

  if (error || !data) return null;
  return (data as { data: T }).data as T;
}

/**
 * setCachedResponse
 *
 * Upserts a cache entry into Supabase, keyed by `tenant_id` + composite
 * `cache_key`.  Silently no-ops when no authenticated tenant can be resolved
 * (e.g. during SSG) to avoid throwing in non-auth contexts.
 *
 * Signature is stable — callers pass `source` and `endpoint` separately.
 */
export async function setCachedResponse<T>(
  source: string,
  endpoint: string,
  data: T,
  ttlHours: number = 24
): Promise<void> {
  const supabase = await createServerSupabaseClient();

  const tenantId = await resolveTenantId(supabase);
  if (!tenantId) return; // cannot write without a tenant context

  const cacheKey = buildCacheKey(source, endpoint);
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + ttlHours);

  await supabase
    .from('api_cache')
    .upsert(
      {
        tenant_id: tenantId,
        cache_key: cacheKey,
        data: data as unknown as Record<string, unknown>,
        source,
        expires_at: expiresAt.toISOString(),
      },
      { onConflict: 'tenant_id, cache_key' }
    );
}

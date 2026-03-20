/**
 * @file src/lib/db/offline-search.ts
 * @description M18 — Dexie.js Offline Full-Text Search for property metadata.
 * Provides client-side search over cached parcels when network is unavailable.
 * Uses IndexedDB compound indexing + in-memory filtering for text matching.
 * @compliance POPIA: Search is tenant-scoped; no PII stored in offline cache.
 */

import { db, type OfflineParcel } from './dexie';

/** Maximum results returned from offline search */
const MAX_RESULTS = 50;

/** Minimum query length to trigger search */
const MIN_QUERY_LENGTH = 2;

export interface OfflineSearchResult {
  id: string;
  address: string;
  geometry: unknown;
  valuation_data: unknown;
  matchType: 'address' | 'erf' | 'partial';
  score: number;
}

/**
 * Search offline parcels by address, ERF number, or partial match.
 * Tenant-scoped: only returns parcels belonging to the given tenant.
 */
export async function searchOfflineParcels(
  query: string,
  tenantId: string
): Promise<OfflineSearchResult[]> {
  if (!query || query.length < MIN_QUERY_LENGTH) return [];

  const normalised = query.toLowerCase().trim();

  // Fetch all tenant parcels from IndexedDB
  const parcels = await db.parcels
    .where('tenant_id')
    .equals(tenantId)
    .toArray();

  const results: OfflineSearchResult[] = [];

  for (const parcel of parcels) {
    const addr = (parcel.address || '').toLowerCase();
    const erfKey = parcel.id.toLowerCase();

    let matchType: OfflineSearchResult['matchType'] | null = null;
    let score = 0;

    // Exact ERF/SG-21 match (highest priority)
    if (erfKey === normalised || erfKey.includes(normalised)) {
      matchType = 'erf';
      score = erfKey === normalised ? 100 : 80;
    }
    // Address starts with query
    else if (addr.startsWith(normalised)) {
      matchType = 'address';
      score = 90;
    }
    // Address contains query
    else if (addr.includes(normalised)) {
      matchType = 'partial';
      score = 60;
    }
    // Word-level match in address
    else {
      const words = normalised.split(/\s+/);
      const matchedWords = words.filter((w) => addr.includes(w));
      if (matchedWords.length > 0) {
        matchType = 'partial';
        score = Math.round((matchedWords.length / words.length) * 50);
      }
    }

    if (matchType && score > 0) {
      results.push({
        id: parcel.id,
        address: parcel.address,
        geometry: parcel.geometry,
        valuation_data: parcel.valuation_data,
        matchType,
        score,
      });
    }
  }

  // Sort by score descending, cap at MAX_RESULTS
  return results
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_RESULTS);
}

/**
 * Bulk-cache parcels for offline use.
 * Called after a successful LIVE API fetch to seed IndexedDB.
 */
export async function cacheParcelsBulk(
  parcels: OfflineParcel[]
): Promise<number> {
  if (!parcels.length) return 0;
  await db.parcels.bulkPut(parcels);
  return parcels.length;
}

/**
 * Get offline cache stats for the current tenant.
 */
export async function getOfflineCacheStats(tenantId: string) {
  const count = await db.parcels
    .where('tenant_id')
    .equals(tenantId)
    .count();

  return { tenantId, cachedParcels: count };
}

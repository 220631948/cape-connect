/**
 * @file src/lib/utils/fallback.ts
 * @description Mandatory Three-Tier Data Fallback Pattern (LIVE -> CACHED -> MOCK).
 * @compliance POPIA: Handling resilient data retrieval for PII and spatial layers.
 */

export type DataTier = 'LIVE' | 'CACHED' | 'MOCK';

export interface FallbackConfig<T> {
  source: string;
  year: number;
  live: () => Promise<T>;
  cached: () => Promise<T | null>;
  mock: () => Promise<T>;
}

export interface FallbackResult<T> {
  data: T;
  tier: DataTier;
  source: string;
  year: number;
  timestamp: string;
}

/**
 * fetchWithFallback
 * Executes the three-tier fallback logic per ADR-009.
 */
export async function fetchWithFallback<T>(
  config: FallbackConfig<T>
): Promise<FallbackResult<T>> {
  const timestamp = new Date().toISOString();

  // Tier 1: LIVE
  try {
    const data = await config.live();
    return {
      data,
      tier: 'LIVE',
      source: config.source,
      year: config.year,
      timestamp,
    };
  } catch (error) {
    console.warn(`[Fallback] LIVE tier failed for ${config.source}:`, error);
  }

  // Tier 2: CACHED
  try {
    const cachedData = await config.cached();
    if (cachedData) {
      return {
        data: cachedData,
        tier: 'CACHED',
        source: config.source,
        year: config.year,
        timestamp,
      };
    }
  } catch (error) {
    console.warn(`[Fallback] CACHED tier failed for ${config.source}:`, error);
  }

  // Tier 3: MOCK (Final Resort - Never fail)
  try {
    const mockData = await config.mock();
    return {
      data: mockData,
      tier: 'MOCK',
      source: config.source,
      year: config.year,
      timestamp,
    };
  } catch (error) {
    console.error(`[Fallback] CRITICAL: MOCK tier failed for ${config.source}:`, error);
    throw error; // If mock fails, something is fundamentally wrong with the environment
  }
}

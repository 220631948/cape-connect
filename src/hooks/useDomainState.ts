/**
 * @file src/hooks/useDomainState.ts
 * @description State management for Domain-Specific Dashboards (M23).
 * Syncs the active 'domain mode' and specific filters (e.g., fire radius, NDVI threshold) to URL.
 */

'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useCallback, useMemo } from 'react';

export type DomainMode = 'general' | 'emergency' | 'environmental' | 'citizens' | 'farmers';

export interface DomainState {
  mode: DomainMode;
  params: Record<string, string>;
}

export function useDomainState() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const state = useMemo((): DomainState => {
    const mode = (searchParams.get('dm') as DomainMode) || 'general';
    const params: Record<string, string> = {};
    
    // Extract any keys prefixed with 'dp_' (domain param)
    searchParams.forEach((value, key) => {
      if (key.startsWith('dp_')) {
        params[key.substring(3)] = value;
      }
    });

    return { mode, params };
  }, [searchParams]);

  const setDomainMode = useCallback((mode: DomainMode, defaultParams: Record<string, string> = {}) => {
    const newParams = new URLSearchParams(searchParams.toString());
    
    // Clear old domain params
    Array.from(newParams.keys()).forEach(key => {
      if (key.startsWith('dp_')) newParams.delete(key);
    });

    if (mode === 'general') {
      newParams.delete('dm');
    } else {
      newParams.set('dm', mode);
      // Set new defaults
      Object.entries(defaultParams).forEach(([k, v]) => {
        newParams.set(`dp_${k}`, v);
      });
    }

    router.replace(`?${newParams.toString()}`, { scroll: false });
  }, [searchParams, router]);

  const updateDomainParam = useCallback((key: string, value: string | null) => {
    const newParams = new URLSearchParams(searchParams.toString());
    const fullKey = `dp_${key}`;
    
    if (value === null) {
      newParams.delete(fullKey);
    } else {
      newParams.set(fullKey, value);
    }

    router.replace(`?${newParams.toString()}`, { scroll: false });
  }, [searchParams, router]);

  return {
    ...state,
    setDomainMode,
    updateDomainParam
  };
}

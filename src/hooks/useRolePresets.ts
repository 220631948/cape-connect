/**
 * @file src/hooks/useRolePresets.ts
 * @description QW4 — Job-Specific Default Views.
 * Role-based map presets (zoom level, visible layers, panel layout).
 * RICE score: 9.00 (highest among Quick Wins).
 * @compliance POPIA: No PII involved; role derived from session claims.
 */

'use client';

import { useMemo } from 'react';
import type { ViewportState, LayerState } from './useUrlState';

// ── Role types (aligned with CLAUDE.md §4 hierarchy) ─────────────────────────
export type UserRole =
  | 'GUEST'
  | 'VIEWER'
  | 'ANALYST'
  | 'POWER_USER'
  | 'TENANT_ADMIN'
  | 'PLATFORM_ADMIN';

// ── Domain profession presets ─────────────────────────────────────────────────
export type DomainPreset =
  | 'urban_planner'
  | 'emergency_responder'
  | 'journalist'
  | 'environmental_scientist'
  | 'real_estate'
  | 'aviation'
  | 'farmer'
  | 'citizen'
  | 'default';

export interface RolePreset {
  /** MapLibre initial viewport */
  viewport: ViewportState;
  /** Which layers are visible by default */
  layers: LayerState;
  /** Which dashboard panels to show */
  panels: {
    analytics: boolean;
    copilot: boolean;
    draw: boolean;
    flights: boolean;
    search: boolean;
  };
  /** Label for UI display */
  label: string;
}

// ── Cape Town defaults (CLAUDE.md Rule 9) ─────────────────────────────────────
const CT_CENTER = { lng: 18.4241, lat: -33.9249 };

const PRESETS: Record<DomainPreset, RolePreset> = {
  default: {
    viewport: { ...CT_CENTER, zoom: 11, pitch: 0, bearing: 0 },
    layers: { zoning: true, flights: false, suburbs: true, firms: false, traffic: false },
    panels: { analytics: false, copilot: false, draw: false, flights: false, search: true },
    label: 'General View',
  },
  urban_planner: {
    viewport: { ...CT_CENTER, zoom: 13, pitch: 45, bearing: 0 },
    layers: { zoning: true, flights: false, suburbs: true, firms: false, traffic: true },
    panels: { analytics: true, copilot: true, draw: true, flights: false, search: true },
    label: 'Urban Planning',
  },
  emergency_responder: {
    viewport: { ...CT_CENTER, zoom: 12, pitch: 0, bearing: 0 },
    layers: { zoning: false, flights: false, suburbs: true, firms: true, traffic: true },
    panels: { analytics: false, copilot: false, draw: false, flights: false, search: true },
    label: 'Emergency Response',
  },
  journalist: {
    viewport: { ...CT_CENTER, zoom: 11, pitch: 0, bearing: 0 },
    layers: { zoning: true, flights: true, suburbs: true, firms: false, traffic: false },
    panels: { analytics: true, copilot: false, draw: false, flights: true, search: true },
    label: 'Investigative View',
  },
  environmental_scientist: {
    viewport: { lng: 18.45, lat: -34.05, zoom: 11, pitch: 0, bearing: 0 },
    layers: { zoning: false, flights: false, suburbs: true, firms: true, traffic: false },
    panels: { analytics: true, copilot: true, draw: true, flights: false, search: true },
    label: 'Environmental Monitor',
  },
  real_estate: {
    viewport: { ...CT_CENTER, zoom: 14, pitch: 30, bearing: 0 },
    layers: { zoning: true, flights: false, suburbs: true, firms: false, traffic: false },
    panels: { analytics: true, copilot: false, draw: false, flights: false, search: true },
    label: 'Property Intelligence',
  },
  aviation: {
    viewport: { lng: 18.6017, lat: -33.9715, zoom: 11, pitch: 0, bearing: 0 },
    layers: { zoning: false, flights: true, suburbs: false, firms: false, traffic: false },
    panels: { analytics: false, copilot: false, draw: false, flights: true, search: true },
    label: 'Aviation Tracker',
  },
  farmer: {
    viewport: { lng: 18.85, lat: -33.75, zoom: 10, pitch: 0, bearing: 0 },
    layers: { zoning: false, flights: false, suburbs: true, firms: true, traffic: false },
    panels: { analytics: true, copilot: false, draw: true, flights: false, search: true },
    label: 'Crop Intelligence',
  },
  citizen: {
    viewport: { ...CT_CENTER, zoom: 13, pitch: 0, bearing: 0 },
    layers: { zoning: true, flights: false, suburbs: true, firms: false, traffic: false },
    panels: { analytics: false, copilot: false, draw: false, flights: false, search: true },
    label: 'Community View',
  },
};

// ── Map roles to sensible domain defaults ─────────────────────────────────────
const ROLE_TO_DOMAIN: Record<UserRole, DomainPreset> = {
  GUEST: 'citizen',
  VIEWER: 'default',
  ANALYST: 'urban_planner',
  POWER_USER: 'urban_planner',
  TENANT_ADMIN: 'default',
  PLATFORM_ADMIN: 'default',
};

/**
 * Returns the default map preset for a given role/domain.
 * URL state (from useUrlState) takes precedence when present;
 * this hook provides the fallback defaults.
 */
export function useRolePresets(
  role: UserRole = 'GUEST',
  domainOverride?: DomainPreset
) {
  const preset = useMemo(() => {
    const domain = domainOverride ?? ROLE_TO_DOMAIN[role] ?? 'default';
    return { ...PRESETS[domain], domain };
  }, [role, domainOverride]);

  const allPresets = useMemo(() => {
    return Object.entries(PRESETS).map(([key, value]) => ({
      key: key as DomainPreset,
      label: value.label,
    }));
  }, []);

  return { preset, allPresets };
}

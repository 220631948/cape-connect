/**
 * @file src/lib/db/dexie.ts
 * @description Client-side IndexedDB persistence layer.
 * @compliance POPIA: Handling offline storage of spatial and tracking data.
 */

import Dexie, { type Table } from 'dexie';

export interface OfflineParcel {
  id: string;
  tenant_id: string;
  address: string;
  geometry: any;
  valuation_data: any;
  cached_at: string;
}

export interface OfflineFlight {
  icao24: string;
  callsign: string;
  origin_country: string;
  latitude: number;
  longitude: number;
  last_contact: number;
}

export interface OfflineCommunityResource {
  id: string;
  tenant_id: string;
  name: string;
  category: 'wifi' | 'library' | 'computer_lab' | 'community_centre' | 'coworking';
  address: string | null;
  is_free: boolean;
  latitude: number;
  longitude: number;
  cached_at: string;
}

export interface OfflineSafeWalkCorridor {
  id: string;
  tenant_id: string;
  name: string;
  safety_rating: number;
  has_lighting: boolean;
  has_cctv: boolean;
  distance_m: number | null;
  geometry_json: string;
  cached_at: string;
}

export class CapeGISDatabase extends Dexie {
  parcels!: Table<OfflineParcel>;
  flights!: Table<OfflineFlight>;
  communityResources!: Table<OfflineCommunityResource>;
  safeWalkCorridors!: Table<OfflineSafeWalkCorridor>;

  constructor() {
    super('CapeGISDatabase');
    this.version(1).stores({
      parcels: 'id, tenant_id, address',
      flights: 'icao24, callsign'
    });
    this.version(2).stores({
      parcels: 'id, tenant_id, address',
      flights: 'icao24, callsign',
      communityResources: 'id, tenant_id, category, name',
      safeWalkCorridors: 'id, tenant_id, name, safety_rating'
    });
  }
}

export const db = new CapeGISDatabase();

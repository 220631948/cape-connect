/**
 * Cape Town metro bounding box — single source of truth.
 *
 * Mirrors: backend/app/domain/value_objects/bbox.py (CT_WEST/CT_SOUTH/CT_EAST/CT_NORTH)
 * CLAUDE.md Rule 9: Geographic Scope constraint.
 *
 * All spatial queries MUST be clipped to this bbox.
 * Coordinates in EPSG:4326 (WGS 84).
 */
export const CAPE_TOWN_BBOX = {
    west: 18.28,
    south: -34.36,
    east: 19.02,
    north: -33.48,
} as const;

/** Initial map centre — Cape Town CBD */
export const CAPE_TOWN_CENTER = {
    lng: 18.4241,
    lat: -33.9249,
} as const;

/** Default map zoom level */
export const DEFAULT_ZOOM = 11;

/** Type for bounding box coordinates */
export type BBox = {
    readonly west: number;
    readonly south: number;
    readonly east: number;
    readonly north: number;
};

/**
 * Check if a point falls within the Cape Town bbox.
 * Complexity: O(1) — constant-time coordinate comparison.
 */
export function isWithinCapeTown(lng: number, lat: number): boolean {
    return (
        lng >= CAPE_TOWN_BBOX.west &&
        lng <= CAPE_TOWN_BBOX.east &&
        lat >= CAPE_TOWN_BBOX.south &&
        lat <= CAPE_TOWN_BBOX.north
    );
}

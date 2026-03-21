/**
 * Supported GIS formats — single source of truth.
 *
 * Mirrors: backend/app/domain/entities/layer.py (LayerFormat enum).
 * Import formats: 10, Export formats: 8.
 */

export const IMPORT_FORMATS = [
    'geojson', 'shapefile', 'gpkg', 'kml', 'kmz',
    'csv', 'geotiff', 'dxf', 'gdb', 'las', 'laz', 'arcgis_rest',
] as const;

export const EXPORT_FORMATS = [
    'geojson', 'shapefile', 'gpkg', 'kml',
    'csv', 'cog', 'dxf', 'pmtiles',
] as const;

export type ImportFormat = (typeof IMPORT_FORMATS)[number];
export type ExportFormat = (typeof EXPORT_FORMATS)[number];

/** Raster formats — route to R2 storage, not Supabase */
export const RASTER_FORMATS: ReadonlySet<string> = new Set([
    'geotiff', 'cog', 'las', 'laz',
]);

/** Formats requiring CRS prompt (GOTCHA-PY-004) */
export const CRS_PROMPT_REQUIRED: ReadonlySet<string> = new Set(['dxf']);

/** Max upload size in bytes — 500MB */
export const MAX_UPLOAD_BYTES = 500 * 1024 * 1024;

/** Storage routing threshold — files above this go to R2 */
export const R2_THRESHOLD_BYTES = 50 * 1024 * 1024;

/**
 * @file src/lib/validation/schemas/analysis.ts
 * @description Zod schemas for analysis mutation API routes.
 */
import {z} from 'zod';

const geoJsonPointSchema = z.object({
    type: z.literal('Point'),
    coordinates: z.tuple([z.number(), z.number()]),
});

const geoJsonPolygonSchema = z.object({
    type: z.literal('Polygon'),
    coordinates: z.array(z.array(z.tuple([z.number(), z.number()]))),
});

const geoJsonMultiPolygonSchema = z.object({
    type: z.literal('MultiPolygon'),
    coordinates: z.array(z.array(z.array(z.tuple([z.number(), z.number()])))),
});

// Using regular union instead of discriminatedUnion to avoid Zod v4 bug
// with optional fields in nested schemas
export const geometrySchema = z.union([
    geoJsonPointSchema,
    geoJsonPolygonSchema,
    geoJsonMultiPolygonSchema,
]);

export const analyzeAreaSchema = z.object({
    geometry: geometrySchema,
});

export const geocodeSchema = z.object({
    address: z
        .string()
        .min(3, 'Address must be at least 3 characters')
        .max(500, 'Address must be at most 500 characters'),
});

export const exportAnalysisSchema = z.object({
    geometry: geometrySchema,
    format: z.enum(['pdf', 'csv', 'geojson']).default('pdf'),
    layers: z.array(z.string().min(1)).min(1, 'At least one layer is required').optional(),
});

export const ndviSchema = z.object({
    geometry: geometrySchema,
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD format'),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD format'),
});

export const spatialStatsSchema = z.object({
    geometry: geometrySchema,
    statType: z.enum(['density', 'hotspot', 'clustering', 'interpolation']),
    parameters: z.record(z.unknown()).optional(),
});

export const nerf3dgsSchema = z.object({
    scene_path: z.string().min(1, 'scene_path is required'),
    method: z.enum(['nerfacto', '3dgs', 'instant-ngp', 'splatfacto']),
});

// cartoSchema uses a flat structure to avoid Zod v4.3.6 bug with unions + optional fields
// The bug causes "Cannot read properties of undefined (reading '_zod')" when parsing
// We use a discriminated approach with separate required/optional geometry per type
export const cartoSchema = z.union([
    z.object({
        type: z.literal('enrichment'),
        geometry: geometrySchema.optional(),
        params: z.record(z.unknown()).optional(),
    }),
    z.object({
        type: z.literal('isoline'),
        geometry: geometrySchema.optional(),
        params: z.record(z.unknown()).optional(),
    }),
    z.object({
        type: z.literal('stats'),
        geometry: geometrySchema,  // required for stats
        params: z.record(z.unknown()).optional(),
    }),
]);

const bboxSchema = z.object({
    west: z.number(),
    south: z.number(),
    east: z.number(),
    north: z.number(),
});

export const ndviBboxSchema = z.object({
    bbox: bboxSchema,
    start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD format'),
    end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD format'),
    index: z.enum(['NDVI', 'NDWI']).default('NDVI'),
});

export type AnalyzeAreaInput = z.infer<typeof analyzeAreaSchema>;
export type GeocodeInput = z.infer<typeof geocodeSchema>;
export type ExportAnalysisInput = z.infer<typeof exportAnalysisSchema>;
export type NdviInput = z.infer<typeof ndviSchema>;
export type SpatialStatsInput = z.infer<typeof spatialStatsSchema>;
export type Nerf3dgsInput = z.infer<typeof nerf3dgsSchema>;
export type CartoInput = z.infer<typeof cartoSchema>;
export type NdviBboxInput = z.infer<typeof ndviBboxSchema>;

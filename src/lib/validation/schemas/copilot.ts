/**
 * @file src/lib/validation/schemas/copilot.ts
 * @description Zod schemas for GIS Copilot API routes.
 */
import {z} from 'zod';

export const copilotSpatialSchema = z.object({
    query: z
        .string()
        .min(3, 'Query must be at least 3 characters')
        .max(1000, 'Query must be at most 1000 characters'),
    context: z.object({
        lng: z.number().optional(),
        lat: z.number().optional(),
    }).optional(),
});

export type CopilotSpatialInput = z.infer<typeof copilotSpatialSchema>;

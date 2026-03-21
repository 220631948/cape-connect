/**
 * @file src/lib/validation/schemas/admin.ts
 * @description Zod schemas for admin mutation API routes.
 */
import {z} from 'zod';

const VALID_ROLES = ['viewer', 'analyst', 'power_user', 'admin'] as const;

export const assignRoleSchema = z.object({
    userId: z.string().uuid('userId must be a valid UUID'),
    role: z.enum(VALID_ROLES, {
        message: `Invalid role. Must be one of: ${VALID_ROLES.join(', ')}`,
    }),
});

export const inviteUserSchema = z.object({
    email: z.string().email('A valid email address is required'),
    role: z.enum(VALID_ROLES, {
        message: `Invalid role. Must be one of: ${VALID_ROLES.join(', ')}`,
    }).default('viewer'),
    tenantId: z.string().uuid('tenantId must be a valid UUID').optional(),
});

export const createTenantSchema = z.object({
    name: z
        .string()
        .min(2, 'Tenant name must be at least 2 characters')
        .max(100, 'Tenant name must be at most 100 characters'),
    slug: z
        .string()
        .regex(
            /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
            'Slug must be lowercase alphanumeric with hyphens',
        )
        .min(2)
        .max(50)
        .optional(),
});

export const impersonateSchema = z.object({
    target_user_id: z.string().uuid('target_user_id must be a valid UUID'),
    reason: z
        .string()
        .max(500, 'Reason must be at most 500 characters')
        .optional()
        .transform((v) => v?.trim() || null),
    current_password: z.string().optional(),
    mfa_code: z.string().optional(),
    duration_seconds: z
        .number()
        .int()
        .min(60, 'Minimum duration is 60 seconds')
        .max(900, 'Maximum duration is 900 seconds (15 min)')
        .default(900),
});

export const stopImpersonationSchema = z.object({
    // Minimal schema - session state is validated in the route handler
    // This ensures consistent 400 response format for invalid JSON
    // Explicitly allows any additional fields using .passthrough()
}).passthrough();

export type AssignRoleInput = z.infer<typeof assignRoleSchema>;
export type InviteUserInput = z.infer<typeof inviteUserSchema>;
export type CreateTenantInput = z.infer<typeof createTenantSchema>;
export type ImpersonateInput = z.output<typeof impersonateSchema>;
export type StopImpersonationInput = z.infer<typeof stopImpersonationSchema>;

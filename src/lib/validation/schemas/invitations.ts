/**
 * @file src/lib/validation/schemas/invitations.ts
 * @description Zod schemas for invitation mutation API routes.
 */
import {z} from 'zod';

export const acceptInvitationSchema = z.object({
    invitationId: z.string().uuid('invitationId must be a valid UUID').optional(),
    token: z.string().optional(),
}).refine((data) => data.invitationId || data.token, {
    message: 'Either invitationId or token is required',
});

export const declineInvitationSchema = z.object({
    invitationId: z.string().uuid('invitationId must be a valid UUID'),
});

export type AcceptInvitationInput = z.infer<typeof acceptInvitationSchema>;
export type DeclineInvitationInput = z.infer<typeof declineInvitationSchema>;

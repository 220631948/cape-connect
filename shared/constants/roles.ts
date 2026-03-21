/**
 * Role hierarchy — single source of truth for RBAC.
 *
 * Mirrors: CLAUDE.md Section 4 (Multi-Tenancy & RBAC).
 * Order: GUEST (lowest) → PLATFORM_ADMIN (highest).
 */
export const ROLES = [
    'GUEST',
    'VIEWER',
    'ANALYST',
    'POWER_USER',
    'TENANT_ADMIN',
    'PLATFORM_ADMIN',
] as const;

export type Role = (typeof ROLES)[number];

/**
 * Role level map for O(1) permission comparisons.
 * Usage: ROLE_LEVEL[userRole] >= ROLE_LEVEL[requiredRole]
 */
export const ROLE_LEVEL: Record<Role, number> = {
    GUEST: 0,
    VIEWER: 1,
    ANALYST: 2,
    POWER_USER: 3,
    TENANT_ADMIN: 4,
    PLATFORM_ADMIN: 5,
};

/**
 * Check if a role meets the minimum required level.
 * Complexity: O(1) — hash map lookup + integer comparison.
 */
export function hasMinimumRole(userRole: Role, requiredRole: Role): boolean {
    return ROLE_LEVEL[userRole] >= ROLE_LEVEL[requiredRole];
}

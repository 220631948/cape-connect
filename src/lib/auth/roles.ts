/**
 * @file src/lib/auth/roles.ts
 * @description Role normalization and impersonation authorization rules.
 *
 * POPIA ANNOTATION
 * Personal data handled: role/tenant authorization context (user identifiers)
 * Purpose: enforce RBAC boundaries and safe impersonation controls
 * Lawful basis: legitimate interests
 * Retention: request-scoped (no persistence in this module)
 * Subject rights: access ✓ | correction ✓ | deletion ✓ | objection ✓
 */

export type CanonicalRole =
  | 'PLATFORM_ADMIN'
  | 'TENANT_ADMIN'
  | 'POWER_USER'
  | 'ANALYST'
  | 'VIEWER'
  | 'GUEST'
  | 'UNKNOWN';

const ROLE_MAP: Record<string, CanonicalRole> = {
  PLATFORM_ADMIN: 'PLATFORM_ADMIN',
  platform_admin: 'PLATFORM_ADMIN',
  TENANT_ADMIN: 'TENANT_ADMIN',
  tenant_admin: 'TENANT_ADMIN',
  admin: 'TENANT_ADMIN',
  POWER_USER: 'POWER_USER',
  power_user: 'POWER_USER',
  ANALYST: 'ANALYST',
  analyst: 'ANALYST',
  VIEWER: 'VIEWER',
  viewer: 'VIEWER',
  GUEST: 'GUEST',
  guest: 'GUEST',
};

export interface RoleProfile {
  id: string;
  tenant_id: string;
  role: string | null;
}

export interface ImpersonationDecision {
  allowed: boolean;
  reason?: string;
}

export function normalizeRole(role: string | null | undefined): CanonicalRole {
  if (!role) return 'UNKNOWN';
  return ROLE_MAP[role] ?? 'UNKNOWN';
}

export function isPlatformAdmin(role: string | null | undefined): boolean {
  return normalizeRole(role) === 'PLATFORM_ADMIN';
}

export function isTenantAdmin(role: string | null | undefined): boolean {
  return normalizeRole(role) === 'TENANT_ADMIN';
}

export function isAdminRole(role: string | null | undefined): boolean {
  const normalized = normalizeRole(role);
  return normalized === 'PLATFORM_ADMIN' || normalized === 'TENANT_ADMIN';
}

export function canImpersonate(
  requester: RoleProfile,
  target: RoleProfile
): ImpersonationDecision {
  const requesterRole = normalizeRole(requester.role);
  const targetRole = normalizeRole(target.role);

  if (requester.id === target.id) {
    return { allowed: false, reason: 'Cannot impersonate yourself' };
  }

  if (requesterRole === 'PLATFORM_ADMIN') {
    if (targetRole === 'PLATFORM_ADMIN') {
      return { allowed: false, reason: 'Cannot impersonate platform admin' };
    }
    return { allowed: true };
  }

  if (requesterRole === 'TENANT_ADMIN') {
    if (targetRole === 'PLATFORM_ADMIN') {
      return { allowed: false, reason: 'Tenant admin cannot impersonate platform admin' };
    }
    if (requester.tenant_id !== target.tenant_id) {
      return { allowed: false, reason: 'Tenant mismatch' };
    }
    return { allowed: true };
  }

  return { allowed: false, reason: 'Insufficient privileges' };
}

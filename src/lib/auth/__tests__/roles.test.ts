import { describe, expect, it } from 'vitest';
import { canImpersonate, normalizeRole } from '../roles';

describe('roles: normalizeRole', () => {
  it('normalizes legacy and canonical role values', () => {
    expect(normalizeRole('admin')).toBe('TENANT_ADMIN');
    expect(normalizeRole('TENANT_ADMIN')).toBe('TENANT_ADMIN');
    expect(normalizeRole('platform_admin')).toBe('PLATFORM_ADMIN');
  });
});

describe('roles: canImpersonate', () => {
  const tenantAdmin = { id: 'admin-1', tenant_id: 'tenant-a', role: 'TENANT_ADMIN' };
  const superAdmin = { id: 'super-1', tenant_id: 'tenant-a', role: 'PLATFORM_ADMIN' };
  const sameTenantViewer = { id: 'viewer-a', tenant_id: 'tenant-a', role: 'VIEWER' };
  const otherTenantViewer = { id: 'viewer-b', tenant_id: 'tenant-b', role: 'VIEWER' };
  const tenantAdminOtherTenant = { id: 'admin-2', tenant_id: 'tenant-b', role: 'TENANT_ADMIN' };

  it('allows tenant admin impersonation within same tenant', () => {
    const decision = canImpersonate(tenantAdmin, sameTenantViewer);
    expect(decision.allowed).toBe(true);
  });

  it('denies tenant admin impersonation across tenants', () => {
    const decision = canImpersonate(tenantAdmin, otherTenantViewer);
    expect(decision.allowed).toBe(false);
    expect(decision.reason).toContain('Tenant mismatch');
  });

  it('allows platform admin impersonation across tenants', () => {
    const decision = canImpersonate(superAdmin, tenantAdminOtherTenant);
    expect(decision.allowed).toBe(true);
  });

  it('denies impersonating another platform admin', () => {
    const decision = canImpersonate(superAdmin, {
      id: 'super-2',
      tenant_id: 'tenant-z',
      role: 'PLATFORM_ADMIN',
    });
    expect(decision.allowed).toBe(false);
  });

  it('denies self impersonation', () => {
    const decision = canImpersonate(tenantAdmin, tenantAdmin);
    expect(decision.allowed).toBe(false);
  });
});

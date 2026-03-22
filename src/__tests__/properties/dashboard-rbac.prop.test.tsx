import { describe, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { test, fc } from '@fast-check/vitest';
import { DashboardScreen } from '../../components/DashboardScreen';
import { useSessionRole } from '@/hooks/useSessionRole';
import React from 'react';

vi.mock('../../components/ui/CrayonCard', () => ({
  CrayonCard: ({ children, className }: any) => <div className={className} data-testid="crayon-card">{children}</div>,
}));

vi.mock('@/hooks/useSessionRole', () => ({
  useSessionRole: vi.fn(),
}));

vi.mock('@/hooks/useAuthRefresh', () => ({
  useAuthRefresh: vi.fn(),
}));

vi.mock('@/hooks/useDomainState', () => ({
  useDomainState: vi.fn(() => ({
    mode: 'general',
    params: {},
    setDomainMode: vi.fn(),
    updateDomainParam: vi.fn(),
  })),
}));

vi.mock('@/hooks/useInvitations', () => ({
  useInvitations: vi.fn().mockReturnValue({
    invitations: [],
    loading: false,
    fetchError: null,
    acceptInvitation: vi.fn(),
    declineInvitation: vi.fn(),
  }),
}));

// Mock default exports
vi.mock('../../components/map/SpatialView', () => ({ default: () => <div>Spatial</div> }));
vi.mock('../../components/analysis/AnalysisResultPanel', () => ({ default: () => <div>Analysis</div> }));
vi.mock('../../components/dashboard/DashboardHeader', () => ({ default: () => <div>Header</div> }));
vi.mock('../../components/dashboard/MetricsRow', () => ({ default: () => <div>Metrics</div> }));
vi.mock('../../components/dashboard/DashboardStatusIndicator', () => ({ default: () => <div>Status</div> }));
vi.mock('../../components/dashboard/DashboardSidebar', () => ({ default: () => <div>Sidebar</div> }));
vi.mock('../../components/dashboard/LiveFlightTelemetry', () => ({ default: () => <div>Telemetry</div> }));
vi.mock('../../components/dashboard/QuickDropArea', () => ({ default: () => <div>QuickDrop</div> }));
vi.mock('../../components/admin/UserManagementPanel', () => ({ default: () => <div data-testid="user-mgmt-panel">👥 User Management</div> }));

describe('DashboardScreen RBAC Properties', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ is_impersonating: false }),
    }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const nonAdminRoles = fc.constantFrom('GUEST', 'VIEWER', 'ANALYST', 'POWER_USER');
  const adminRoles = fc.constantFrom('TENANT_ADMIN', 'PLATFORM_ADMIN');

  test.prop([nonAdminRoles])('hides UserManagementPanel for any non-admin role', async (role) => {
    (useSessionRole as any).mockReturnValue({
      role,
      loading: false,
      tenantId: 't1',
    });

    render(<DashboardScreen theme="dark" />);

    await waitFor(() => {
      expect(screen.queryByTestId('user-mgmt-panel')).toBeNull();
    });
  });

  test.prop([adminRoles])('shows UserManagementPanel for any admin role', async (role) => {
    (useSessionRole as any).mockReturnValue({
      role,
      loading: false,
      tenantId: 't1',
    });

    render(<DashboardScreen theme="dark" />);

    await waitFor(() => {
      expect(screen.getByTestId('user-mgmt-panel')).toBeDefined();
    });
  });
});

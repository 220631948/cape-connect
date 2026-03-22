import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { DashboardScreen } from '../../components/DashboardScreen';
import { useSessionRole } from '@/hooks/useSessionRole';
import { useDomainState } from '@/hooks/useDomainState';
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
  useDomainState: vi.fn(),
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

describe('DashboardScreen Role Gate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ is_impersonating: false }),
    }));
    
    // Default mock for useDomainState
    (useDomainState as any).mockReturnValue({
      mode: 'general',
      params: {},
      setDomainMode: vi.fn(),
      updateDomainParam: vi.fn(),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('hides UserManagementPanel for VIEWER role', async () => {
    (useSessionRole as any).mockReturnValue({
      role: 'VIEWER',
      loading: false,
      tenantId: 't1',
    });

    render(<DashboardScreen theme="dark" />);

    await waitFor(() => {
      expect(screen.queryByTestId('user-mgmt-panel')).toBeNull();
    });
  });

  it('shows UserManagementPanel for TENANT_ADMIN role', async () => {
    (useSessionRole as any).mockReturnValue({
      role: 'TENANT_ADMIN',
      loading: false,
      tenantId: 't1',
    });

    render(<DashboardScreen theme="dark" />);

    await waitFor(() => {
      expect(screen.getByTestId('user-mgmt-panel')).toBeDefined();
    });
  });
});

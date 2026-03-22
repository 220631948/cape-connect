import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { render, screen } from '@testing-library/react';
import DashboardPage from '../../app/dashboard/page';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import React from 'react';

vi.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  // Next.js redirect throws a special error that prevents further execution
  redirect: vi.fn((url: string) => {
    const error = new Error('NEXT_REDIRECT');
    (error as any).digest = `NEXT_REDIRECT;replace;${url};303;`;
    throw error;
  }),
}));

vi.mock('../../components/DashboardScreen', () => ({
  default: () => <div data-testid="dashboard-screen">Full Dashboard</div>,
}));

vi.mock('../../components/dashboard/GuestDashboard', () => ({
  default: () => <div data-testid="guest-dashboard">Guest View</div>,
}));

describe('Dashboard Page Guest Gate Properties', () => {
  let mockSupabase: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase = {
      auth: {
        getSession: vi.fn(),
      },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn(),
      }),
    };
    (createServerSupabaseClient as any).mockResolvedValue(mockSupabase);
  });

  it('redirects to login when no session', async () => {
    mockSupabase.auth.getSession.mockResolvedValue({ data: { session: null }, error: null });
    
    await expect(DashboardPage()).rejects.toThrow('NEXT_REDIRECT');
    expect(redirect).toHaveBeenCalledWith('/login');
  });

  it('renders GuestDashboard when role is GUEST', async () => {
    mockSupabase.auth.getSession.mockResolvedValue({ 
      data: { session: { user: { id: 'u1' } } }, 
      error: null 
    });
    mockSupabase.from().single.mockResolvedValue({ data: { role: 'GUEST' }, error: null });
    
    const page = await DashboardPage();
    render(page);

    expect(screen.getByTestId('guest-dashboard')).toBeDefined();
    expect(screen.queryByTestId('dashboard-screen')).toBeNull();
  });

  it('renders DashboardScreen when role is VIEWER', async () => {
    mockSupabase.auth.getSession.mockResolvedValue({ 
      data: { session: { user: { id: 'u1' } } }, 
      error: null 
    });
    mockSupabase.from().single.mockResolvedValue({ data: { role: 'VIEWER' }, error: null });
    
    const page = await DashboardPage();
    render(page);

    expect(screen.getByTestId('dashboard-screen')).toBeDefined();
    expect(screen.queryByTestId('guest-dashboard')).toBeNull();
  });
});

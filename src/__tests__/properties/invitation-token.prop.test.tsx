import { describe, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { test, fc } from '@fast-check/vitest';
import InvitePage from '../../app/invite/page';
import { useSearchParams, useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import React from 'react';

vi.mock('next/navigation', () => ({
  useSearchParams: vi.fn(),
  useRouter: vi.fn(() => ({ push: vi.fn() })),
}));

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(),
}));

describe('Invitation Token Persistence Properties', () => {
  let mockSupabase: any;
  let mockPush: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock sessionStorage
    const store: Record<string, string> = {};
    const mockSessionStorage = {
      getItem: vi.fn((key: string) => store[key] || null),
      setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
      removeItem: vi.fn((key: string, value: string) => { delete store[key]; }),
      clear: vi.fn(() => { for (const key in store) delete store[key]; }),
    };
    vi.stubGlobal('sessionStorage', mockSessionStorage);

    mockPush = vi.fn();
    (useRouter as any).mockReturnValue({ push: mockPush });

    mockSupabase = {
      auth: {
        getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      },
    };
    (createClient as any).mockReturnValue(mockSupabase);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test.prop([fc.string({ minLength: 1 })])('always persists non-empty token to sessionStorage when unauthenticated', async (token) => {
    (useSearchParams as any).mockReturnValue({
      get: (key: string) => (key === 'token' ? token : null),
    });

    render(<InvitePage />);

    await waitFor(() => {
      expect(sessionStorage.setItem).toHaveBeenCalledWith('pendingInviteToken', token);
      expect(mockPush).toHaveBeenCalledWith('/login?redirectTo=/invite');
    });
  });
});

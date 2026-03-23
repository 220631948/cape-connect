import { describe, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { test, fc } from '@fast-check/vitest';
import { useInvitations } from '../../hooks/useInvitations';
import React from 'react';

describe('useInvitations No-Reload Properties', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: [] }),
    }));
    
    // Stub window.location
    const mockLocation = {
      ...window.location,
      reload: vi.fn(),
    };
    vi.stubGlobal('location', mockLocation);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  test.prop([fc.uuid()])('acceptInvitation never triggers page reload', async (invitationId) => {
    const { result } = renderHook(() => useInvitations());
    
    await act(async () => {
      result.current.acceptInvitation(invitationId);
    });

    expect(window.location.reload).not.toHaveBeenCalled();
  });

  test.prop([fc.uuid()])('declineInvitation never triggers page reload', async (invitationId) => {
    const { result } = renderHook(() => useInvitations());
    
    await act(async () => {
      result.current.declineInvitation(invitationId);
    });

    expect(window.location.reload).not.toHaveBeenCalled();
  });
});

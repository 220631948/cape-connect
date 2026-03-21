import { describe, expect, it, vi, beforeEach } from 'vitest';
import { verifyReauthentication } from '../admin-session';

describe('admin-session: verifyReauthentication', () => {
  const mockClient = {
    auth: {
      signInWithPassword: vi.fn(),
      mfa: {
        listFactors: vi.fn(),
        challengeAndVerify: vi.fn(),
      },
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns error if userEmail is missing', async () => {
    const result = await verifyReauthentication(mockClient, null, 'password');
    expect(result).toEqual({ ok: false, error: 'Unable to resolve current user email' });

    const result2 = await verifyReauthentication(mockClient, undefined, 'password');
    expect(result2).toEqual({ ok: false, error: 'Unable to resolve current user email' });
  });

  it('returns error if currentPassword is missing', async () => {
    const result = await verifyReauthentication(mockClient, 'test@example.com', null);
    expect(result).toEqual({ ok: false, error: 'Current password is required' });

    const result2 = await verifyReauthentication(mockClient, 'test@example.com', undefined);
    expect(result2).toEqual({ ok: false, error: 'Current password is required' });
  });

  it('returns error if signInWithPassword fails', async () => {
    mockClient.auth.signInWithPassword.mockResolvedValueOnce({
      data: null,
      error: new Error('Invalid credentials'),
    });

    const result = await verifyReauthentication(mockClient, 'test@example.com', 'wrong-password');
    expect(result).toEqual({ ok: false, error: 'Reauthentication failed' });
    expect(mockClient.auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'wrong-password',
    });
  });

  it('returns ok if signInWithPassword succeeds and no MFA factors exist', async () => {
    mockClient.auth.signInWithPassword.mockResolvedValueOnce({
      data: { user: { id: 'user-1' } },
      error: null,
    });
    mockClient.auth.mfa.listFactors.mockResolvedValueOnce({
      data: { totp: [], phone: [] },
      error: null,
    });

    const result = await verifyReauthentication(mockClient, 'test@example.com', 'password');
    expect(result).toEqual({ ok: true });
  });

  it('returns error if MFA is required but no code is provided', async () => {
    mockClient.auth.signInWithPassword.mockResolvedValueOnce({
      data: { user: { id: 'user-1' } },
      error: null,
    });
    mockClient.auth.mfa.listFactors.mockResolvedValueOnce({
      data: {
        totp: [{ id: 'factor-1', status: 'verified', factor_type: 'totp' }],
        phone: [],
      },
      error: null,
    });

    const result = await verifyReauthentication(mockClient, 'test@example.com', 'password');
    expect(result).toEqual({ ok: false, error: 'MFA code is required' });
  });

  it('returns ok if MFA verification succeeds', async () => {
    mockClient.auth.signInWithPassword.mockResolvedValueOnce({
      data: { user: { id: 'user-1' } },
      error: null,
    });
    mockClient.auth.mfa.listFactors.mockResolvedValueOnce({
      data: {
        totp: [{ id: 'factor-1', status: 'verified', factor_type: 'totp' }],
        phone: [],
      },
      error: null,
    });
    mockClient.auth.mfa.challengeAndVerify.mockResolvedValueOnce({
      data: { success: true },
      error: null,
    });

    const result = await verifyReauthentication(
      mockClient,
      'test@example.com',
      'password',
      '123456'
    );
    expect(result).toEqual({ ok: true });
    expect(mockClient.auth.mfa.challengeAndVerify).toHaveBeenCalledWith({
      factorId: 'factor-1',
      code: '123456',
    });
  });

  it('returns error if MFA verification fails', async () => {
    mockClient.auth.signInWithPassword.mockResolvedValueOnce({
      data: { user: { id: 'user-1' } },
      error: null,
    });
    mockClient.auth.mfa.listFactors.mockResolvedValueOnce({
      data: {
        totp: [{ id: 'factor-1', status: 'verified', factor_type: 'totp' }],
        phone: [],
      },
      error: null,
    });
    mockClient.auth.mfa.challengeAndVerify.mockResolvedValueOnce({
      data: null,
      error: new Error('Invalid MFA code'),
    });

    const result = await verifyReauthentication(
      mockClient,
      'test@example.com',
      'password',
      'wrong-code'
    );
    expect(result).toEqual({ ok: false, error: 'MFA verification failed' });
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '../../app/api/invitations/accept/route';
import { createServerClient } from '@supabase/ssr';

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(),
}));

describe('Accept Invitation API', () => {
  let mockClient: any;

  beforeEach(() => {
    mockClient = {
      auth: {
        getSession: vi.fn(),
      },
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(),
      maybeSingle: vi.fn(),
    };
    (createServerClient as any).mockReturnValue(mockClient);
  });

  const validUUID = '550e8400-e29b-41d4-a716-446655440000';

  it('returns 401 if no session exists', async () => {
    mockClient.auth.getSession.mockResolvedValue({ data: { session: null } });
    const req = new NextRequest('http://localhost/api/invitations/accept', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ invitationId: validUUID }),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('returns 410 if invitation is expired', async () => {
    mockClient.auth.getSession.mockResolvedValue({
      data: { session: { user: { email: 'test@test.com', id: 'u1' } } }
    });
    
    const expiredDate = new Date(Date.now() - 10000).toISOString();
    mockClient.maybeSingle.mockResolvedValue({
      data: { id: validUUID, expires_at: expiredDate, tenant_id: 't1', status: 'pending' },
      error: null
    });

    const req = new NextRequest('http://localhost/api/invitations/accept', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ invitationId: validUUID }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(410);
    expect(data.error).toBe('Invitation expired');
  });

  it('returns success but already_member true if user is already in tenant', async () => {
    mockClient.auth.getSession.mockResolvedValue({
      data: { session: { user: { email: 'test@test.com', id: 'u1' } } }
    });
    
    const validDate = new Date(Date.now() + 10000).toISOString();
    mockClient.maybeSingle.mockResolvedValue({
      data: { id: validUUID, expires_at: validDate, tenant_id: 't1', status: 'pending' },
      error: null
    });

    // Mock profiles check
    mockClient.single.mockResolvedValue({
      data: { tenant_id: 't1' },
      error: null
    });

    const req = new NextRequest('http://localhost/api/invitations/accept', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ invitationId: validUUID }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.already_member).toBe(true);
  });

  it('updates profile and invitation status for new member', async () => {
    mockClient.auth.getSession.mockResolvedValue({
      data: { session: { user: { email: 'test@test.com', id: 'u1' } } }
    });
    
    const validDate = new Date(Date.now() + 10000).toISOString();
    const invitation = { id: validUUID, expires_at: validDate, tenant_id: 't1', role: 'viewer', status: 'pending' };
    
    mockClient.maybeSingle.mockResolvedValue({
      data: invitation,
      error: null
    });

    // Mock profiles check
    mockClient.single.mockResolvedValue({
      data: { tenant_id: 'different-t' },
      error: null
    });

    // For the update call: .update().eq() -> returns a promise
    // We can use mockResolvedValue for the FINAL .eq call if we ensure we don't break the first .eq chain
    // The first .eq is followed by .maybeSingle(), which is already mocked.
    // So if .eq() returns this, then .maybeSingle() is called, it returns the promise. Correct.
    // BUT the update calls await the .eq(). So .eq() must return a promise.
    
    // I'll make eq() return an object that is both 'this' (sort of) and a promise
    const resultPromise = Promise.resolve({ error: null });
    const chainablePromise = Object.assign(resultPromise, {
      maybeSingle: vi.fn().mockResolvedValue({ data: invitation, error: null }),
      single: vi.fn().mockResolvedValue({ data: { tenant_id: 'different-t' }, error: null }),
      eq: vi.fn().mockReturnThis(),
    });

    mockClient.eq.mockReturnValue(chainablePromise);

    const req = new NextRequest('http://localhost/api/invitations/accept', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ invitationId: validUUID }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
  });
});

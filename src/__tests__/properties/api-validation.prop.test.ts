import { describe, expect, vi, beforeEach } from 'vitest';
import { test, fc } from '@fast-check/vitest';
import { POST } from '../../app/api/invitations/accept/route';
import { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(),
}));

describe('API Validation Properties', () => {
  let mockSupabase: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase = {
      auth: {
        getSession: vi.fn().mockResolvedValue({ data: { session: { user: { email: 'test@test.com', id: 'u1' } } }, error: null }),
      },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      }),
    };
    (createServerClient as any).mockReturnValue(mockSupabase);
  });

  const invalidPayloads = fc.oneof(
    fc.record({ token: fc.integer() }), // token not a string
    fc.record({ token: fc.boolean() }), // token not a string
    fc.record({ token: fc.constant('') }), // empty token
    fc.record({ }), // missing token
  );

  test.prop([invalidPayloads], { numRuns: 20 })('returns 400 for invalid invitation accept payloads', async (payload) => {
    const req = new NextRequest('http://localhost/api/invitations/accept', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  const validPayloads = fc.record({
    token: fc.string({ minLength: 1 }),
  });

  test.prop([validPayloads], { numRuns: 20 })('bypasses 400 and returns 404 (not found) for non-existent tokens', async (payload) => {
    const req = new NextRequest('http://localhost/api/invitations/accept', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    const res = await POST(req);
    // Since we mock the DB to return null, it should hit Step 2: Not found → 404
    expect(res.status).toBe(404);
  });
});

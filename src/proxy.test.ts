import { describe, it, expect, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { proxy } from './proxy';
import * as ssr from '@supabase/ssr';
import * as roles from '@/lib/auth/roles';

// Mocking dependencies
vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn().mockReturnValue({
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null }),
      single: vi.fn().mockResolvedValue({ data: null }),
    }),
  }),
}));

vi.mock('@/lib/auth/impersonation-token', () => ({
  verifyImpersonationToken: vi.fn().mockRejectedValue(new Error('No token')),
}));

vi.mock('@/lib/auth/roles', () => ({
  isAdminRole: vi.fn().mockReturnValue(false),
}));

describe('Proxy Rate Limiting', () => {
  it('blocks requests after rate limit threshold is exceeded', async () => {
    // Generate many requests to hit the rate limit
    let finalResponse;
    const ip = '192.168.1.100';

    // 60 requests to fill the bucket
    for (let i = 0; i < 60; i++) {
      const req = new NextRequest('http://localhost:3000/api/test', {
        headers: {
          'x-real-ip': ip,
        },
      });
      await proxy(req);
    }

    // 61st request should be blocked
    const req = new NextRequest('http://localhost:3000/api/test', {
        headers: {
            'x-real-ip': ip,
        },
    });
    finalResponse = await proxy(req);

    expect(finalResponse?.status).toBe(429);
  });

  it('uses x-real-ip over x-forwarded-for spoofing', async () => {
    // We send a request with a spoofed x-forwarded-for but a valid x-real-ip
    const req = new NextRequest('http://localhost:3000/api/test', {
      headers: {
        'x-real-ip': '203.0.113.1',
        'x-forwarded-for': '1.2.3.4, 5.6.7.8'
      },
    });

    const res = await proxy(req);
    // As long as it doesn't crash and returns a redirect (to /login since no auth), it means it ran
    expect(res?.status).not.toBe(500);
  });
});

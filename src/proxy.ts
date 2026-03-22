/**
 * @file src/proxy.ts
 * @description Next.js 16 Proxy (formerly Middleware) for RBAC and Tenant Isolation.
 * @compliance POPIA: Enforcing access control on PII and spatial data.
 */

import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { verifyImpersonationToken } from '@/lib/auth/impersonation-token';
import { isAdminRole } from '@/lib/auth/roles';

// --- Rate Limiting (sliding window, in-memory) ---
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 60;
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }
  entry.count++;
  return entry.count > RATE_LIMIT_MAX;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 0. Skip middleware for static assets early
  if (
    pathname.startsWith('/_next') ||
    pathname.includes('.') ||
    pathname.startsWith('/favicon')
  ) {
    return NextResponse.next();
  }

  // 0.1 Public Routes early exit
  const isPublicRoute = pathname.startsWith('/login') ||
                       pathname === '/' ||
                       pathname.startsWith('/api/health') ||
                       pathname.startsWith('/api/public');

  if (isPublicRoute && !pathname.startsWith('/api/admin') && !pathname.startsWith('/admin')) {
      return NextResponse.next();
  }

  // 1. Rate limit API routes
  if (pathname.startsWith('/api/')) {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    if (isRateLimited(ip)) {
      return new NextResponse(JSON.stringify({ error: 'Too many requests' }), {
        status: 429,
        headers: { 'Content-Type': 'application/json', 'Retry-After': '60' },
      });
    }
  }

  try {
    const requestHeaders = new Headers(request.headers);
    let response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            request.cookies.set({ name, value, ...options });
            response = NextResponse.next({
              request: {
                headers: requestHeaders,
              },
            });
            response.cookies.set({ name, value, ...options });
          },
          remove(name: string, options: CookieOptions) {
            request.cookies.set({ name, value: '', ...options });
            response = NextResponse.next({
              request: {
                headers: requestHeaders,
              },
            });
            response.cookies.set({ name, value: '', ...options });
          },
        },
      }
    );

    const { data: { session } } = await supabase.auth.getSession();

    // 2. Resolve Tenant from Subdomain
    const hostname = request.headers.get('host') || '';
    const parts = hostname.split('.');
    const isLocalhost = hostname.includes('localhost') || hostname.includes('127.0.0.1');
    const subdomain = (!isLocalhost && parts.length > 1) ? parts[0] : 'capetown';

    const { data: tenant } = await supabase
      .from('tenants')
      .select('id')
      .eq('slug', subdomain)
      .maybeSingle();

    if (tenant) {
      requestHeaders.set('x-tenant-id', tenant.id);
      requestHeaders.set('x-tenant-slug', subdomain);
      // Ensure we pass updated headers to the next response object
      response = NextResponse.next({ request: { headers: requestHeaders } });
    }

    // 3. Optional impersonation context
    let hasImpersonationContext = false;
    let effectiveRole: string | null = null;
    const bearer = request.headers.get('authorization');
    const headerToken = bearer?.startsWith('Bearer ') ? bearer.slice('Bearer '.length).trim() : null;
    const cookieToken = request.cookies.get('capegis_impersonation')?.value ?? null;
    const impersonationToken = headerToken || cookieToken;

    if (impersonationToken) {
      try {
        const claims = await verifyImpersonationToken(impersonationToken);
        const { data: impersonationSession } = await supabase
          .from('impersonation_sessions')
          .select('id, active, target_user_id, expires_at')
          .eq('token_jti', claims.jti)
          .eq('active', true)
          .maybeSingle();

        const validSession =
          !!impersonationSession &&
          impersonationSession.target_user_id === claims.sub &&
          new Date(impersonationSession.expires_at).getTime() > Date.now();

        if (validSession) {
          const { data: targetProfile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', claims.sub)
            .maybeSingle();

          hasImpersonationContext = true;
          effectiveRole = targetProfile?.role ?? null;

          requestHeaders.set('x-is-impersonation', 'true');
          requestHeaders.set('x-effective-user-id', claims.sub);
          requestHeaders.set('x-impersonated-by', claims.impersonated_by);
          requestHeaders.set('x-impersonator-role', claims.impersonator_role);
          requestHeaders.set('x-effective-tenant-id', claims.tenant_id);
          if (targetProfile?.role) {
            requestHeaders.set('x-effective-role', targetProfile.role);
          }

          response = NextResponse.next({ request: { headers: requestHeaders } });
        }
      } catch {
        // Ignore invalid
      }
    }

    // 4. Auth & RBAC Guard
    if (!session && !hasImpersonationContext) {
      const redirectUrl = new URL('/login', request.url);

      // Prevent open redirect vulnerabilities by ensuring redirectTo is a safe relative path
      // that starts with a single slash and is not protocol-relative (e.g., //evil.com)
      const isSafeRedirect = (url: string) => url.startsWith('/') && !url.startsWith('//');

      if (pathname.startsWith('/invite')) {
        redirectUrl.searchParams.set('redirectTo', '/invite');
      } else {
        const requestedUrl = request.nextUrl.pathname + request.nextUrl.search;
        if (isSafeRedirect(requestedUrl)) {
          redirectUrl.searchParams.set('redirectTo', requestedUrl);
        }
      }
      return NextResponse.redirect(redirectUrl);
    }

    // Admin Route Protection
    if (pathname.startsWith('/api/admin') || pathname.startsWith('/admin')) {
      const allowWithoutAdminRole =
        pathname.startsWith('/api/admin/stop-impersonation') ||
        pathname.startsWith('/api/admin/impersonation-state');

      if (!session && !allowWithoutAdminRole) {
        return NextResponse.redirect(new URL('/login', request.url));
      }

      if (hasImpersonationContext && !allowWithoutAdminRole && !isAdminRole(effectiveRole)) {
        return new NextResponse(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
      }

      if (session) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();

        if (!profile || !isAdminRole(profile.role)) {
          return new NextResponse(JSON.stringify({ error: 'Forbidden: Admin required' }), { status: 403 });
        }
      }
    }

    return response;
  } catch (error) {
    console.error('[Proxy Error]:', error);
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|favicon.svg|public).*)',
    '/invite/:path*',
  ],
};

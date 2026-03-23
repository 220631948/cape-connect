import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

/**
 * @file src/app/auth/callback/route.ts
 * @description Secure OAuth callback handler with forensic logging.
 * @compliance POPIA: Securing authentication tokens during exchange.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';
  const error = searchParams.get('error');
  const error_description = searchParams.get('error_description');

  if (error) {
    console.error(`[OAuth Forensic] Provider Error: ${error} - ${error_description}`);
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error_description || error)}`);
  }

  if (code) {
    try {
      const cookieStore = await cookies();
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() {
              return cookieStore.getAll();
            },
            setAll(cookiesToSet) {
              try {
                cookiesToSet.forEach(({ name, value, options }) => {
                  cookieStore.set(name, value, options);
                });
              } catch (setCookieError) {
                console.error('[OAuth Forensic] Failed to set cookies in Auth Callback:', setCookieError);
              }
            },
          },
        }
      );

      console.log(`[OAuth Forensic] Exchanging code for session...`);
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

      if (exchangeError) {
        console.error(`[OAuth Forensic] Token Exchange Error:`, exchangeError.message);
        return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(exchangeError.message)}`);
      }

      console.log(`[OAuth Forensic] Token exchange successful! Redirecting to ${next}`);
      return NextResponse.redirect(`${origin}${next}`);
    } catch (err) {
      console.error(`[OAuth Forensic] Unexpected Catch Block Error:`, err);
      return NextResponse.redirect(`${origin}/login?error=Unexpected_Auth_Error`);
    }
  }

  console.warn(`[OAuth Forensic] No code found in URL.`);
  // No code found, just redirect to login
  return NextResponse.redirect(`${origin}/login`);
}

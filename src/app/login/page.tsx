/**
 * @file src/app/login/page.tsx
 * @description Login page with Supabase Auth integration.
 * @compliance POPIA: Handling user credentials and authentication sessions.
 */

'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import LoginScreen from '../../components/LoginScreen';
import { createClient } from '@/lib/supabase/client';
import { useState } from 'react';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();
  let redirectTo = searchParams.get('redirectTo') || '/';

  // Prevent open redirect in the client by ensuring it's a safe relative path
  if (!redirectTo.startsWith('/') || redirectTo.startsWith('//')) {
    redirectTo = '/';
  }

  const handleLogin = async (email?: string, password?: string) => {
    if (!email || !password) return;
    
    setError(null);
    const { error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (loginError) {
      setError(loginError.message);
      return;
    }

    // Bug 1.9 Fix: Check for persisted invitation token after login
    const pendingToken = sessionStorage.getItem('pendingInviteToken');
    if (pendingToken) {
      sessionStorage.removeItem('pendingInviteToken');
      router.push(`/invite?token=${pendingToken}`);
    } else {
      router.push(redirectTo);
    }
  };

  return (
    <>
      <LoginScreen theme="dark" onLogin={handleLogin} />
      {error && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-red-500/90 text-white px-4 py-2 rounded-lg text-sm z-50 shadow-lg border border-white/20">
          ⚠️ {error}
        </div>
      )}
    </>
  );
}

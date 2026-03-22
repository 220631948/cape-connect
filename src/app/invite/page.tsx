/**
 * @file src/app/invite/page.tsx
 * @description Invitation acceptance page.
 * @compliance POPIA: Handling invitation tokens and tenant joining.
 */

'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CrayonCard } from '@/components/ui/CrayonCard';

function InviteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Checking your invitation... 🐢✨');
  const [error, setError] = useState<string | null>(null); // Added new state for error messages

  useEffect(() => {
    const token = searchParams.get('token'); // Moved token extraction here
    async function handleInvite() {
      if (!token) {
        setError('No invitation token provided');
        setStatus('error');
        return;
      }

      try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        const supabase = createClient(supabaseUrl!, supabaseKey!);
        const { data: { session } } = await supabase.auth.getSession();

        // Bug 1.9 Fix: Persist token to sessionStorage and redirect to login if unauthenticated
        if (!session) {
          sessionStorage.setItem('pendingInviteToken', token);
          router.push('/login?redirectTo=/invite');
          return;
        }

        const res = await fetch('/api/invitations/accept', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });

        const json = await res.json();
        
        if (!res.ok) {
          // Bug 1.10 Fix: Handle 410 Expired explicitly
          if (res.status === 410) {
            setError(json.error || 'Invitation expired');
            setStatus('error');
            return;
          }
          throw new Error(json.error || 'Failed to accept invitation');
        }

        setStatus('success');
        
        // Brief delay so user sees success message
        setTimeout(() => {
          router.push('/dashboard');
        }, 1500);

      } catch (err: any) {
        setStatus('error');
        setError(err.message);
      }
    }

    handleInvite();
  }, [searchParams, router]); // Changed dependency array to include searchParams for token

  return (
    <div className="min-h-screen flex items-center justify-center bg-capetown-dark text-white p-4">
      <div className="w-full max-w-md p-8 rounded-xl shadow-2xl bg-black border border-white/10 text-center">
        {status === 'loading' && (
          <div className="animate-pulse flex flex-col items-center">
            <span className="text-4xl mb-4">🐢</span>
            <h2 className="text-xl font-bold">Verifying invitation...</h2>
          </div>
        )}
        
        {status === 'success' && (
          <div className="flex flex-col items-center text-emerald-400">
            <span className="text-5xl mb-4">✨</span>
            <h2 className="text-xl font-bold mb-2">Welcome to your Tenant</h2>
            <p className="text-sm text-emerald-400/80">Taking you to the dashboard...</p>
          </div>
        )}
        
        {status === 'error' && (
          <div className="flex flex-col items-center text-red-400">
            <span className="text-5xl mb-4">⚠️</span>
            <h2 className="text-xl font-bold mb-2">Invitation Error</h2>
            <p className="text-sm mb-6">{error}</p>
            <button 
              onClick={() => router.push('/login')}
              className="px-6 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
            >
              Return to Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

import { createClient } from '@supabase/supabase-js';

export default function InvitePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-capetown-dark">
        <p className="text-crayon-blue animate-pulse">Loading... 🐢</p>
      </div>
    }>
      <InviteContent />
    </Suspense>
  );
}

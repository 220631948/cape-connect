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

  useEffect(() => {
    const acceptInvite = async () => {
      const token = searchParams.get('token');
      if (!token) {
        setStatus('error');
        setMessage('No invitation token found in the URL.');
        return;
      }

      try {
        const res = await fetch('/api/invitations/accept', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });

        const json = await res.json();
        if (res.ok) {
          setStatus('success');
          setMessage('Invitation accepted! Redirecting to dashboard...');
          setTimeout(() => {
            router.push('/dashboard');
          }, 2000);
        } else {
          setStatus('error');
          setMessage(json.error || 'Failed to accept invitation.');
        }
      } catch (err) {
        setStatus('error');
        setMessage('An unexpected error occurred.');
      }
    };

    acceptInvite();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-capetown-dark p-4">
      <CrayonCard colorVariant={status === 'error' ? 'pink' : 'blue'} className="max-w-md w-full text-center">
        <h1 className="text-2xl font-bold mb-4 text-white">
          {status === 'loading' && 'Joining Tenant...'}
          {status === 'success' && 'Welcome Aboard! 🎉'}
          {status === 'error' && 'Invitation Error'}
        </h1>
        <p className={`text-sm ${status === 'error' ? 'text-red-400' : 'text-crayon-blue'}`}>
          {message}
        </p>
        {status === 'error' && (
          <button
            onClick={() => router.push('/')}
            className="mt-6 px-6 py-2 rounded-lg bg-crayon-blue text-black font-bold hover:brightness-110 transition-all"
          >
            Back to Home
          </button>
        )}
      </CrayonCard>
    </div>
  );
}

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

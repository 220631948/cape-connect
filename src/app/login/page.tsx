'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import LoginScreen from '../../components/LoginScreen';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  let redirectTo = searchParams.get('redirectTo') || '/';

  // Prevent open redirect in the client by ensuring it's a safe relative path
  if (!redirectTo.startsWith('/') || redirectTo.startsWith('//')) {
    redirectTo = '/';
  }

  const handleLogin = () => {
    // For local test: redirect to destination
    router.push(redirectTo);
  };

  return <LoginScreen theme="dark" onLogin={handleLogin} />;
}

'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import LoginScreen from '../../components/LoginScreen';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') || '/';

  const handleLogin = () => {
    // For local test: redirect to destination
    router.push(redirectTo);
  };

  return <LoginScreen theme="dark" onLogin={handleLogin} />;
}

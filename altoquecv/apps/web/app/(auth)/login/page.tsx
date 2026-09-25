'use client';

import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { LoginForm } from './components/login-form';
import { LoginCredentials } from '@/types';

export default function LoginPage() {
  const { login, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, isLoading, router]);

  const handleLogin = async (credentials: LoginCredentials) => {
    await login(credentials);
    router.push('/dashboard');
  };

  if (isLoading || isAuthenticated) return null;

  return <LoginForm onSubmit={handleLogin} isLoading={isLoading} />;
}
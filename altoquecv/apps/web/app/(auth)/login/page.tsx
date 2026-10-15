'use client';

import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { LoginForm } from './components/login-form';
import { LoginCredentials } from '@/types';

interface LoginPageProps {
  searchParams?: { redirect?: string; verified?: string };
}

export default function LoginPage({ searchParams }: LoginPageProps) {
  const { login, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const requestedRedirect = searchParams?.redirect;
  const redirectTo = requestedRedirect?.startsWith('/') && !requestedRedirect.startsWith('//')
    ? requestedRedirect
    : '/dashboard';

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace(redirectTo);
    }
  }, [isAuthenticated, isLoading, redirectTo, router]);

  const handleLogin = async (credentials: LoginCredentials) => {
    await login(credentials);
    router.replace(redirectTo);
  };

  if (isAuthenticated) return null;

  return (
    <div>
      {searchParams?.verified === '1' && (
        <p role="status" className="mb-4 rounded border border-success/30 bg-success-container/20 p-3 text-label-sm text-success">
          Correo confirmado. Ya puedes iniciar sesión.
        </p>
      )}
      <LoginForm onSubmit={handleLogin} isLoading={isLoading} />
    </div>
  );
}
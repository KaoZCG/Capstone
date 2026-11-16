'use client';

import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { LoginForm } from './components/login-form';
import { LoginCredentials } from '@/types';

interface LoginPageProps {
  searchParams?: { verified?: string; redirect?: string };
}

function getSafeRedirectPath(value?: string): string {
  if (
    !value
    || !value.startsWith('/')
    || value.startsWith('//')
    || value.includes('\\')
    || /[\u0000-\u001f]/.test(value)
  ) return '/dashboard';
  const pathname = value.split(/[?#]/, 1)[0];
  if (pathname === '/login' || pathname === '/signup') return '/dashboard';
  return value;
}

export default function LoginPage({ searchParams }: LoginPageProps) {
  const { login, resendConfirmation, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const redirectPath = getSafeRedirectPath(searchParams?.redirect);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace(redirectPath);
    }
  }, [isAuthenticated, isLoading, redirectPath, router]);

  const handleLogin = async (credentials: LoginCredentials) => {
    await login(credentials);
    router.replace(redirectPath);
  };

  if (isAuthenticated) return null;

  return (
    <div>
      {searchParams?.verified === '1' && (
        <p role="status" className="mb-4 rounded border border-success/30 bg-success-container/20 p-3 text-label-sm text-success">
          Correo confirmado. Ya puedes iniciar sesión.
        </p>
      )}
      <LoginForm onSubmit={handleLogin} onResendConfirmation={resendConfirmation} isLoading={isLoading} />
    </div>
  );
}
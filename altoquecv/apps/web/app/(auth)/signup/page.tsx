'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { SignupData } from '@/types';
import { SignupForm } from './components/signup-form';

export default function SignupPage() {
  const router = useRouter();
  const { signup, isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && isAuthenticated) router.replace('/dashboard');
  }, [isAuthenticated, isLoading, router]);

  const handleSignup = async (data: SignupData) => {
    const result = await signup(data);
    if (result?.requires_email_confirmation) {
      router.replace(`/validar-correo?email=${encodeURIComponent(data.email)}`);
      return;
    }
    router.replace('/dashboard');
  };

  if (isAuthenticated) return null;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl items-center justify-center p-4">
      <SignupForm onSubmit={handleSignup} isLoading={isLoading} />
    </main>
  );
}
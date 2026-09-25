'use client';

import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { SignupForm } from './components/signup-form';
import { SignupData } from '@/types';

export default function SignupPage() {
  const { signup, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && isAuthenticated) router.push('/dashboard');
  }, [isAuthenticated, isLoading, router]);

  const handleSignup = async (data: SignupData) => {
    const result = await signup(data);
    if (result?.requires_email_confirmation) {
      setStatusMessage('Cuenta creada. Revisa tu correo para confirmar tu cuenta.');
      return;
    }
    router.push('/dashboard');
  };

  if (isLoading || isAuthenticated) return null;

  return (
    <>
      <SignupForm onSubmit={handleSignup} isLoading={isLoading} />
      {statusMessage && (
        <div className="mx-auto mt-6 max-w-md rounded border border-primary/40 bg-primary/5 p-4 text-center text-sm text-on-surface">
          {statusMessage}
        </div>
      )}
    </>
  );
}
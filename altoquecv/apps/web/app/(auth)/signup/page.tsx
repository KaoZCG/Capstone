'use client';

import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { SignupForm } from './components/signup-form';
import { SignupData } from '@/types';

export default function SignupPage() {
  const { signup, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) router.push('/dashboard');
  }, [isAuthenticated, isLoading, router]);

  const handleSignup = async (data: SignupData) => {
    await signup(data);
    router.push('/dashboard');
  };

  if (isLoading || isAuthenticated) return null;

  return <SignupForm onSubmit={handleSignup} isLoading={isLoading} />;
}
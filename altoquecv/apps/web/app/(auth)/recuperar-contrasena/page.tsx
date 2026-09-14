'use client';

import { useAuth } from '@/hooks/use-auth';
import { RecoveryForm } from './components/recovery-form';

export default function RecoveryPage() {
  const { recoverPassword, isLoading } = useAuth();
  return <RecoveryForm onSubmit={recoverPassword} isLoading={isLoading} />;
}
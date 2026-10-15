'use client';

import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { CheckCircle2, MailCheck } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

interface ValidarCorreoPageProps {
  searchParams?: { email?: string };
}

export default function ValidarCorreoPage({ searchParams }: ValidarCorreoPageProps) {
  const { resendConfirmation } = useAuth();
  const [email, setEmail] = useState(searchParams?.email ?? '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (searchParams?.email) setEmail(searchParams.email);
  }, [searchParams?.email]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setIsSubmitting(true);
    try {
      const result = await resendConfirmation(email);
      setMessage(result.mensaje);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'No fue posible reenviar el correo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-surface-container-lowest border border-border rounded-2xl shadow-xl p-8 text-center">
        <div className="w-16 h-16 bg-success-container text-success rounded-full flex items-center justify-center mx-auto mb-6">
          <MailCheck size={32} />
        </div>
        
        <h1 className="text-2xl font-bold text-on-surface mb-2">Confirma tu correo</h1>
        <p className="text-sm text-on-surface-variant mb-8">
          {email ? <>Enviamos un enlace de confirmación a <strong>{email}</strong>. Ábrelo para activar tu cuenta.</> : 'Revisa el enlace de confirmación que enviamos a tu correo para activar la cuenta.'} Si no aparece, revisa también la carpeta de spam.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!email && <label className="block text-left text-label-md text-on-surface">Correo electrónico<input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 w-full rounded-input border border-border bg-surface-container-low px-4 py-3 focus:border-primary focus:outline-none" placeholder="correo@ejemplo.com" /></label>}
          {message && <p role="status" className="rounded border border-success/30 bg-success-container/20 p-3 text-left text-sm text-success">{message}</p>}
          {error && <p role="alert" className="rounded border border-error/30 bg-error-container/20 p-3 text-left text-sm text-error">{error}</p>}
          <button
            type="submit"
            disabled={!email || isSubmitting}
            className={`w-full py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-all duration-200 ${
              email && !isSubmitting
                ? 'bg-success text-white hover:shadow-lg hover:opacity-90'
                : 'bg-surface-container-highest text-on-surface-variant cursor-not-allowed opacity-70'
            }`}
          >
            {isSubmitting ? 'Enviando...' : 'Reenviar correo de confirmación'}
            {!isSubmitting && <CheckCircle2 size={18} />}
          </button>
        </form>

        <Link href="/login" className="mt-6 inline-block text-sm font-semibold text-primary hover:underline">Volver al inicio de sesión</Link>
      </div>
    </div>
  );
}
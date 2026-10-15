'use client';

import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { CheckCircle2, KeyRound } from 'lucide-react';
import { PasswordStrength } from '../signup/components/password-strength';
import { validatePassword } from '@/lib/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api/v1';

export default function RestablecerContrasenaPage() {
  const [accessToken, setAccessToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState('');
  const [linkError, setLinkError] = useState('');

  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.slice(1));
    const queryParams = new URLSearchParams(window.location.search);
    const token = hashParams.get('access_token') ?? queryParams.get('access_token') ?? '';
    const flowType = hashParams.get('type') ?? queryParams.get('type');
    const providerError = hashParams.get('error_description') ?? queryParams.get('error_description');

    if (providerError) {
      setLinkError(decodeURIComponent(providerError.replaceAll('+', ' ')));
    } else if (!token || (flowType && flowType !== 'recovery')) {
      setLinkError('Este enlace no es válido o expiró. Solicita uno nuevo para continuar.');
    } else {
      setAccessToken(token);
    }
  }, []);

  const passwordIsValid = validatePassword(password).valid;
  const passwordsMatch = password === confirmation;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!accessToken || !passwordIsValid || !passwordsMatch) return;

    setIsSubmitting(true);
    setError('');
    try {
      const response = await fetch(`${API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ password, password_confirmation: confirmation }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        const detail = Array.isArray(body.detail)
          ? body.detail.map((item: { msg?: string }) => item.msg).filter(Boolean).join('. ')
          : body.detail;
        throw new Error(detail || 'No se pudo cambiar la contraseña. Solicita un enlace nuevo.');
      }

      window.history.replaceState(null, '', window.location.pathname);
      setAccessToken('');
      setIsComplete(true);
    } catch (submitError) {
      setError(submitError instanceof TypeError
        ? 'No fue posible conectar con el servidor. Intenta nuevamente.'
        : submitError instanceof Error ? submitError.message : 'No se pudo cambiar la contraseña.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-surface p-4">
      <section className="w-full max-w-md rounded-2xl border border-border bg-surface-container-lowest p-8 shadow-xl">
        {isComplete ? (
          <div className="text-center">
            <CheckCircle2 size={56} className="mx-auto mb-5 text-success" />
            <h1 className="text-2xl font-bold text-on-surface">Contraseña actualizada</h1>
            <p className="mb-7 mt-2 text-body-md text-on-surface-variant">Ya puedes iniciar sesión con tu nueva contraseña.</p>
            <Link href="/login" className="block rounded-lg bg-primary px-4 py-3 font-semibold text-on-primary">Ir a iniciar sesión</Link>
          </div>
        ) : (
          <>
            <div className="mb-7 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-container text-primary"><KeyRound size={24} /></div>
              <h1 className="text-2xl font-bold text-on-surface">Crear nueva contraseña</h1>
              <p className="mt-2 text-sm text-on-surface-variant">Usa al menos 8 caracteres e incluye mayúsculas, minúsculas y números.</p>
            </div>

            {linkError ? (
              <div role="alert" className="space-y-5 text-center">
                <p className="rounded border border-error/30 bg-error-container/20 p-3 text-sm text-error">{linkError}</p>
                <Link href="/recuperar-contrasena" className="font-semibold text-primary hover:underline">Solicitar otro enlace</Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <label className="block text-label-md text-on-surface">Nueva contraseña
                  <input required type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 w-full rounded-input border border-border bg-surface-container-low px-4 py-3 text-on-surface focus:border-primary focus:outline-none" />
                  <PasswordStrength password={password} />
                </label>
                <label className="block text-label-md text-on-surface">Confirmar contraseña
                  <input required type="password" autoComplete="new-password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} className="mt-2 w-full rounded-input border border-border bg-surface-container-low px-4 py-3 text-on-surface focus:border-primary focus:outline-none" />
                </label>
                {confirmation && !passwordsMatch && <p className="text-sm text-error">Las contraseñas no coinciden.</p>}
                {error && <p role="alert" aria-live="polite" className="rounded border border-error/30 bg-error-container/20 p-3 text-sm text-error">{error}</p>}
                <button type="submit" disabled={!accessToken || !passwordIsValid || !passwordsMatch || isSubmitting} className="w-full rounded-lg bg-primary px-4 py-3 font-semibold text-on-primary disabled:cursor-not-allowed disabled:opacity-50">
                  {isSubmitting ? 'Actualizando...' : 'Guardar nueva contraseña'}
                </button>
              </form>
            )}
          </>
        )}
      </section>
    </main>
  );
}
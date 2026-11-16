'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Mail, KeyRound, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

export default function RecuperarContrasenaPage() {
  const { recoverPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [emailTouched, setEmailTouched] = useState(false);

  // Validar formato de correo electrónico
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const emailError = emailTouched && !isEmailValid
    ? email.trim() ? 'Ingresa un correo electrónico válido' : 'Este campo es obligatorio'
    : '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailTouched(true);
    if (!isEmailValid) return;

    setIsSubmitting(true);
    setError('');
    try {
      const result = await recoverPassword({ email });
      setSuccessMessage(result.mensaje);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'No fue posible procesar la solicitud.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-surface-container-lowest border border-border rounded-2xl shadow-xl p-8">
        
        {successMessage ? (
          <div className="text-center">
            <div className="w-16 h-16 bg-success-container text-success rounded-full flex items-center justify-center mx-auto mb-6">
              <Mail size={32} />
            </div>
            <h1 className="text-2xl font-bold text-on-surface mb-2">Solicitud recibida</h1>
            <p className="text-sm text-on-surface-variant mb-8">
              <span className="block mb-2">{successMessage}</span>
              Revisa la bandeja de entrada y spam de <strong>{email}</strong>.
            </p>
            <Link href="/login" className="w-full block py-3 bg-surface-container text-on-surface font-medium rounded-lg hover:bg-surface-container-highest transition-colors">
              Volver al inicio de sesión
            </Link>
          </div>
        ) : (
          <>
            <div className="text-center mb-8">
              <div className="w-12 h-12 bg-primary-container text-primary rounded-xl flex items-center justify-center mx-auto mb-4">
                <KeyRound size={24} />
              </div>
              <h1 className="text-2xl font-bold text-on-surface">Recuperar contraseña</h1>
              <p className="text-sm text-on-surface-variant mt-2">
                Ingresa tu correo electrónico y te enviaremos un enlace para crear una nueva contraseña.
              </p>
            </div>

            <form noValidate onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="recovery-email" className="block text-xs font-semibold text-on-surface-variant mb-1 uppercase tracking-wider">Correo Electrónico</label>
                <div className="relative">
                  <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                  <input 
                    id="recovery-email"
                    type="email" 
                    autoComplete="email"
                    value={email}
                    onBlur={() => setEmailTouched(true)}
                    onChange={(e) => { setEmail(e.target.value); setError(''); }}
                    aria-invalid={Boolean(emailError)}
                    aria-describedby={emailError ? 'recovery-email-error' : undefined}
                    placeholder="correo@ejemplo.com"
                    className="w-full pl-10 pr-4 py-3 bg-surface-container-low border border-border rounded-lg text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  />
                </div>
                {emailError && <p id="recovery-email-error" className="mt-1 text-sm text-error">{emailError}</p>}
              </div>
              {error && <p role="alert" aria-live="polite" className="-mt-3 rounded border border-error/30 bg-error-container/20 p-3 text-sm text-error">{error}</p>}

              <button
                type="submit"
                disabled={!isEmailValid || isSubmitting}
                className={`w-full py-3 rounded-lg font-medium transition-all duration-200 ${
                  isEmailValid && !isSubmitting
                    ? 'bg-primary text-on-primary hover:shadow-lg hover:opacity-90'
                    : 'bg-surface-container-highest text-on-surface-variant cursor-not-allowed opacity-70'
                }`}
              >
                {isSubmitting ? 'Enviando enlace...' : 'Enviar instrucciones'}
              </button>
            </form>

            <div className="mt-8 text-center">
              <Link href="/login" className="inline-flex items-center gap-2 text-sm font-semibold text-on-surface-variant hover:text-primary transition-colors">
                <ArrowLeft size={16} /> Volver al inicio de sesión
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
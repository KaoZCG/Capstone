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

  // Validar formato de correo electrónico
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
            <h2 className="text-2xl font-bold text-on-surface mb-2">Enlace enviado</h2>
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

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1 uppercase tracking-wider">Correo Electrónico</label>
                <div className="relative">
                  <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="correo@ejemplo.com" 
                    className="w-full pl-10 pr-4 py-3 bg-surface-container-low border border-border rounded-lg text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" 
                  />
                </div>
              </div>
              {error && <p role="alert" aria-live="polite" className="-mt-3 rounded border border-error/30 bg-error-container/20 p-3 text-sm text-error">{error}</p>}

              <button
                type="submit"
                disabled={!isEmailValid || isSubmitting}
                className={`w-full py-3 rounded-lg font-medium transition-all duration-200 ${
                  isEmailValid && !isSubmitting
                    ? 'bg-primary text-white hover:shadow-lg hover:opacity-90'
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
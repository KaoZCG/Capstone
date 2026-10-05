'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, ShieldCheck } from 'lucide-react';

export default function ValidarCorreoPage() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validación: Solo permitir números y activar botón cuando sean 6 dígitos
  const isCodeValid = /^\d{6}$/.test(code);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, ''); // Filtrar no numéricos
    if (value.length <= 6) setCode(value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isCodeValid) return;

    setIsSubmitting(true);
    // Simulación API
    setTimeout(() => {
      setIsSubmitting(false);
      router.push('/dashboard');
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-surface-container-lowest border border-border rounded-2xl shadow-xl p-8 text-center">
        <div className="w-16 h-16 bg-success-container text-success rounded-full flex items-center justify-center mx-auto mb-6">
          <ShieldCheck size={32} />
        </div>
        
        <h1 className="text-2xl font-bold text-on-surface mb-2">Verifica tu correo</h1>
        <p className="text-sm text-on-surface-variant mb-8">
          Hemos enviado un código de 6 dígitos a tu bandeja de entrada. Ingresa el código abajo para activar tu Perfil Maestro.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <input
              type="text"
              value={code}
              onChange={handleChange}
              placeholder="000000"
              className="w-full text-center text-3xl tracking-[0.5em] font-bold py-4 bg-surface-container-low border border-border rounded-xl text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-surface-container-highest"
            />
          </div>

          <button
            type="submit"
            disabled={!isCodeValid || isSubmitting}
            className={`w-full py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-all duration-200 ${
              isCodeValid && !isSubmitting
                ? 'bg-success text-white hover:shadow-lg hover:opacity-90'
                : 'bg-surface-container-highest text-on-surface-variant cursor-not-allowed opacity-70'
            }`}
          >
            {isSubmitting ? 'Verificando...' : 'Confirmar Código'}
            {!isSubmitting && <CheckCircle2 size={18} />}
          </button>
        </form>

        <button className="mt-6 text-sm font-semibold text-primary hover:underline">
          Reenviar código
        </button>
      </div>
    </div>
  );
}
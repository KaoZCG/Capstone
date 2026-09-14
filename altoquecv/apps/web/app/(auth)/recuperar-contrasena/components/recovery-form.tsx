import React, { useState } from 'react';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { PasswordRecoveryData } from '@/types';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

interface RecoveryFormProps {
  onSubmit: (data: PasswordRecoveryData) => Promise<{ success: boolean; mensaje: string }>;
  isLoading: boolean;
}

export function RecoveryForm({ onSubmit, isLoading }: RecoveryFormProps) {
  const [emailORut, setEmailORut] = useState('');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await onSubmit({ emailORut });
    if (result.success) setSuccessMsg(result.mensaje);
  };

  if (successMsg) {
    return (
      <div className="bg-surface-container rounded-container p-8 shadow-sm border border-border text-center">
        <CheckCircle2 className="w-16 h-16 text-success mx-auto mb-4" />
        <h2 className="text-headline-sm text-on-surface mb-2">Solicitud Enviada</h2>
        <p className="text-body-md text-on-surface-variant mb-6">{successMsg}</p>
        <Link href="/login">
          <Button variant="primary" className="w-full justify-center">Volver a Iniciar Sesión</Button>
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-surface-container rounded-container p-8 shadow-sm border border-border">
      <h1 className="text-headline-md text-on-surface mb-2 text-center">Recuperar Contraseña</h1>
      <p className="text-body-sm text-on-surface-variant text-center mb-6">Ingrese su correo electrónico o RUT y le enviaremos un enlace para restablecer su contraseña.</p>
      
      <div className="mb-6">
        <label className="block text-label-md text-on-surface mb-1">Email o RUT</label>
        <input required value={emailORut} onChange={(e) => setEmailORut(e.target.value)} disabled={isLoading} className="w-full px-4 py-2 bg-surface-container-lowest border border-border rounded-input text-on-surface focus:border-primary focus:outline-none" placeholder="correo@ejemplo.com" />
      </div>

      <Button variant="primary" className="w-full justify-center" disabled={isLoading}>
        {isLoading ? <Loader2 className="animate-spin mr-2" size={18} /> : null}
        {isLoading ? 'Procesando...' : 'Enviar enlace'}
      </Button>

      <p className="mt-6 text-center text-label-sm text-on-surface-variant">
        <Link href="/login" className="text-primary hover:underline font-medium">Volver a Iniciar Sesión</Link>
      </p>
    </form>
  );
}
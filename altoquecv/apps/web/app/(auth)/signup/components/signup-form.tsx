import React, { useState } from 'react';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { SignupData } from '@/types';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { PasswordStrength } from './password-strength';
import { formatRUT, normalizeChileanPhone } from '@/lib/auth';

interface SignupFormProps {
  onSubmit: (data: SignupData) => Promise<void>;
  isLoading: boolean;
}

export function SignupForm({ onSubmit, isLoading }: SignupFormProps) {
  const [formData, setFormData] = useState<SignupData>({ nombre: '', rut: '', email: '', teléfono: '', contraseña: '', confirmarContraseña: '', aceptoTerminos: false });
  const [confirmPwd, setConfirmPwd] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const confirmation = confirmPwd || formData.confirmarContraseña || '';
    if (formData.contraseña !== confirmation) return setError('Las contraseñas no coinciden');
    try {
      await onSubmit({ ...formData, confirmarContraseña: confirmation });
    } catch (err: any) {
      setError(err.message || 'Error al registrar la cuenta');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-surface-container rounded-container p-8 shadow-sm border border-border">
      <h1 className="text-headline-md text-on-surface mb-6 text-center">Crear Cuenta</h1>
      {error && <div role="alert" aria-live="polite" className="mb-4 p-3 bg-error-container/20 text-error text-label-sm rounded border border-error/30">{error}</div>}

      <div className="space-y-4 mb-6">
        <div>
          <label htmlFor="signup-name" className="block text-label-md text-on-surface mb-1">Nombre Completo</label>
          <input id="signup-name" required value={formData.nombre} onChange={(e) => setFormData({...formData, nombre: e.target.value})} className="w-full px-4 py-2 bg-surface-container-lowest border border-border rounded-input text-on-surface focus:border-primary focus:outline-none" />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="signup-rut" className="block text-label-md text-on-surface mb-1">RUT</label>
            <input id="signup-rut" required placeholder="12.345.678-9" value={formData.rut} onChange={(e) => setFormData({...formData, rut: e.target.value})} onBlur={(e) => setFormData({...formData, rut: formatRUT(e.target.value)})} className="w-full px-4 py-2 bg-surface-container-lowest border border-border rounded-input text-on-surface focus:border-primary focus:outline-none" />
          </div>
          <div>
            <label htmlFor="signup-phone" className="block text-label-md text-on-surface mb-1">Teléfono</label>
            <input id="signup-phone" required placeholder="+56 9 1234 5678" value={formData.teléfono} onChange={(e) => setFormData({...formData, teléfono: e.target.value})} onBlur={(e) => setFormData({...formData, teléfono: normalizeChileanPhone(e.target.value)})} className="w-full px-4 py-2 bg-surface-container-lowest border border-border rounded-input text-on-surface focus:border-primary focus:outline-none" />
          </div>
        </div>

        <div>
          <label htmlFor="signup-email" className="block text-label-md text-on-surface mb-1">Correo electrónico</label>
          <input id="signup-email" type="email" required value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full px-4 py-2 bg-surface-container-lowest border border-border rounded-input text-on-surface focus:border-primary focus:outline-none" />
        </div>

        <div>
          <label htmlFor="signup-password" className="block text-label-md text-on-surface mb-1">Contraseña</label>
          <div className="relative">
            <input id="signup-password" type={showPassword ? "text" : "password"} required value={formData.contraseña} onChange={(e) => setFormData({...formData, contraseña: e.target.value})} className="w-full pl-4 pr-10 py-2 bg-surface-container-lowest border border-border rounded-input text-on-surface focus:border-primary focus:outline-none" />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface">
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          <PasswordStrength password={formData.contraseña} />
        </div>

        <div>
          <label htmlFor="signup-confirm-password" className="block text-label-md text-on-surface mb-1">Confirmar Contraseña</label>
          <input id="signup-confirm-password" type="password" required value={confirmPwd} onChange={(e) => setConfirmPwd(e.target.value)} className="w-full px-4 py-2 bg-surface-container-lowest border border-border rounded-input text-on-surface focus:border-primary focus:outline-none" />
        </div>

        <label className="flex items-start gap-2 cursor-pointer mt-4">
          <input type="checkbox" required checked={formData.aceptoTerminos} onChange={(e) => setFormData({...formData, aceptoTerminos: e.target.checked})} className="mt-1 rounded text-primary focus:ring-primary bg-surface border-border" />
          <span className="text-label-sm text-on-surface-variant">Acepto los <Link href="#" className="text-primary hover:underline">términos y condiciones</Link> y la política de privacidad.</span>
        </label>
      </div>

      <Button variant="primary" className="w-full justify-center" disabled={isLoading}>
        {isLoading ? <Loader2 className="animate-spin mr-2" size={18} /> : null}
        {isLoading ? 'Registrando...' : 'Crear Cuenta'}
      </Button>

      <p className="mt-6 text-center text-label-sm text-on-surface-variant">
        ¿Ya tiene cuenta? <Link href="/login" className="text-primary hover:underline font-medium">Ingrese aquí</Link>
      </p>
    </form>
  );
}
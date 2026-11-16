import React, { useState } from 'react';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { SignupData } from '@/types';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { PasswordStrength } from './password-strength';
import {
  formatRUT,
  isValidChileanPhone,
  isValidEmail,
  isValidPersonName,
  isValidRUT,
  normalizeChileanPhone,
  validatePassword,
} from '@/lib/auth';

interface SignupFormProps {
  onSubmit: (data: SignupData) => Promise<void>;
  isLoading: boolean;
}

export function SignupForm({ onSubmit, isLoading }: SignupFormProps) {
  const [formData, setFormData] = useState<SignupData>({ nombre: '', rut: '', email: '', teléfono: '', contraseña: '', confirmarContraseña: '', aceptoTerminos: false });
  const [confirmPwd, setConfirmPwd] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showValidation, setShowValidation] = useState(false);

  const fieldErrors = {
    nombre: formData.nombre.trim()
      ? isValidPersonName(formData.nombre) ? '' : 'Ingresa un nombre válido.'
      : 'Este campo es obligatorio.',
    rut: formData.rut.trim()
      ? isValidRUT(formData.rut) ? '' : 'RUT inválido: revisa el dígito verificador.'
      : 'Este campo es obligatorio.',
    email: formData.email.trim()
      ? isValidEmail(formData.email) ? '' : 'Ingresa un correo electrónico válido.'
      : 'Este campo es obligatorio.',
    telefono: formData.teléfono.trim()
      ? isValidChileanPhone(formData.teléfono) ? '' : 'Ingresa un teléfono móvil chileno válido.'
      : 'Este campo es obligatorio.',
    contraseña: formData.contraseña
      ? validatePassword(formData.contraseña).valid ? '' : 'Usa al menos 8 caracteres, una mayúscula, una minúscula y un número.'
      : 'Este campo es obligatorio.',
    confirmarContraseña: confirmPwd
      ? formData.contraseña === confirmPwd ? '' : 'Las contraseñas no coinciden.'
      : 'Este campo es obligatorio.',
    aceptoTerminos: formData.aceptoTerminos ? '' : 'Debes aceptar los términos y condiciones.',
  };
  const isFormValid = Object.values(fieldErrors).every((fieldError) => !fieldError);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setShowValidation(true);
    if (!isFormValid) return;
    const confirmation = confirmPwd || formData.confirmarContraseña || '';
    if (formData.contraseña !== confirmation) return setError('Las contraseñas no coinciden');
    try {
      await onSubmit({ ...formData, confirmarContraseña: confirmation });
    } catch (err: any) {
      setError(err.message || 'Error al registrar la cuenta');
    }
  };

  return (
    <form noValidate onSubmit={handleSubmit} className="bg-surface-container rounded-container p-8 shadow-sm border border-border">
      <h1 className="text-headline-md text-on-surface mb-6 text-center">Crear Cuenta</h1>
      {error && <div role="alert" aria-live="polite" className="mb-4 p-3 bg-error-container/20 text-error text-label-sm rounded border border-error/30">{error}</div>}

      <div className="space-y-4 mb-6">
        <div>
          <label htmlFor="signup-name" className="block text-label-md text-on-surface mb-1">Nombre Completo</label>
          <input id="signup-name" required autoComplete="name" value={formData.nombre} onBlur={() => setShowValidation(true)} onChange={(e) => setFormData({...formData, nombre: e.target.value})} aria-invalid={showValidation && Boolean(fieldErrors.nombre)} aria-describedby={showValidation ? 'signup-name-error' : undefined} className="w-full px-4 py-2 bg-surface-container-lowest border border-border rounded-input text-on-surface placeholder:text-on-surface-variant focus:border-primary focus:outline-none" />
          {showValidation && fieldErrors.nombre && <p id="signup-name-error" className="mt-1 text-label-sm text-error">{fieldErrors.nombre}</p>}
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="signup-rut" className="block text-label-md text-on-surface mb-1">RUT</label>
            <input id="signup-rut" required autoComplete="off" inputMode="text" placeholder="12.345.678-9" value={formData.rut} onChange={(e) => setFormData({...formData, rut: e.target.value})} onBlur={(e) => { setFormData({...formData, rut: formatRUT(e.target.value)}); setShowValidation(true); }} aria-invalid={showValidation && Boolean(fieldErrors.rut)} aria-describedby={showValidation ? 'signup-rut-error' : undefined} className="w-full px-4 py-2 bg-surface-container-lowest border border-border rounded-input text-on-surface placeholder:text-on-surface-variant focus:border-primary focus:outline-none" />
            {showValidation && fieldErrors.rut && <p id="signup-rut-error" className="mt-1 text-label-sm text-error">{fieldErrors.rut}</p>}
          </div>
          <div>
            <label htmlFor="signup-phone" className="block text-label-md text-on-surface mb-1">Teléfono</label>
            <input id="signup-phone" required autoComplete="tel" placeholder="+56 9 1234 5678" value={formData.teléfono} onChange={(e) => setFormData({...formData, teléfono: e.target.value})} onBlur={(e) => { setFormData({...formData, teléfono: normalizeChileanPhone(e.target.value)}); setShowValidation(true); }} aria-invalid={showValidation && Boolean(fieldErrors.telefono)} aria-describedby={showValidation ? 'signup-phone-error' : undefined} className="w-full px-4 py-2 bg-surface-container-lowest border border-border rounded-input text-on-surface placeholder:text-on-surface-variant focus:border-primary focus:outline-none" />
            {showValidation && fieldErrors.telefono && <p id="signup-phone-error" className="mt-1 text-label-sm text-error">{fieldErrors.telefono}</p>}
          </div>
        </div>

        <div>
          <label htmlFor="signup-email" className="block text-label-md text-on-surface mb-1">Correo electrónico</label>
          <input id="signup-email" type="email" autoComplete="email" required value={formData.email} onBlur={() => setShowValidation(true)} onChange={(e) => setFormData({...formData, email: e.target.value})} aria-invalid={showValidation && Boolean(fieldErrors.email)} aria-describedby={showValidation ? 'signup-email-error' : undefined} className="w-full px-4 py-2 bg-surface-container-lowest border border-border rounded-input text-on-surface placeholder:text-on-surface-variant focus:border-primary focus:outline-none" />
          {showValidation && fieldErrors.email && <p id="signup-email-error" className="mt-1 text-label-sm text-error">{fieldErrors.email}</p>}
        </div>

        <div>
          <label htmlFor="signup-password" className="block text-label-md text-on-surface mb-1">Contraseña</label>
          <div className="relative">
            <input id="signup-password" autoComplete="new-password" type={showPassword ? "text" : "password"} required value={formData.contraseña} onBlur={() => setShowValidation(true)} onChange={(e) => setFormData({...formData, contraseña: e.target.value})} aria-invalid={showValidation && Boolean(fieldErrors.contraseña)} aria-describedby={showValidation ? 'signup-password-error' : undefined} className="w-full pl-4 pr-10 py-2 bg-surface-container-lowest border border-border rounded-input text-on-surface placeholder:text-on-surface-variant focus:border-primary focus:outline-none" />
            <button type="button" aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'} aria-pressed={showPassword} onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface">
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {showValidation && fieldErrors.contraseña && <p id="signup-password-error" className="mt-1 text-label-sm text-error">{fieldErrors.contraseña}</p>}
          <PasswordStrength password={formData.contraseña} />
        </div>

        <div>
          <label htmlFor="signup-confirm-password" className="block text-label-md text-on-surface mb-1">Confirmar Contraseña</label>
          <input id="signup-confirm-password" autoComplete="new-password" type="password" required value={confirmPwd} onBlur={() => setShowValidation(true)} onChange={(e) => setConfirmPwd(e.target.value)} aria-invalid={showValidation && Boolean(fieldErrors.confirmarContraseña)} aria-describedby={showValidation ? 'signup-confirm-password-error' : undefined} className="w-full px-4 py-2 bg-surface-container-lowest border border-border rounded-input text-on-surface placeholder:text-on-surface-variant focus:border-primary focus:outline-none" />
          {showValidation && fieldErrors.confirmarContraseña && <p id="signup-confirm-password-error" className="mt-1 text-label-sm text-error">{fieldErrors.confirmarContraseña}</p>}
        </div>

        <label className="flex items-start gap-2 cursor-pointer mt-4">
          <input id="signup-terms" type="checkbox" required checked={formData.aceptoTerminos} onChange={(e) => setFormData({...formData, aceptoTerminos: e.target.checked})} aria-invalid={showValidation && Boolean(fieldErrors.aceptoTerminos)} aria-describedby={showValidation ? 'signup-terms-error' : undefined} className="mt-1 rounded text-primary focus:ring-primary bg-surface border-border" />
          <span className="text-label-sm text-on-surface-variant">Acepto los términos y condiciones y la política de privacidad.</span>
        </label>
        {showValidation && fieldErrors.aceptoTerminos && <p id="signup-terms-error" className="text-label-sm text-error">{fieldErrors.aceptoTerminos}</p>}
      </div>

      <Button variant="primary" className="w-full justify-center" disabled={isLoading || !isFormValid}>
        {isLoading ? <Loader2 className="animate-spin mr-2" size={18} /> : null}
        {isLoading ? 'Registrando...' : 'Crear Cuenta'}
      </Button>

      <p className="mt-6 text-center text-label-sm text-on-surface-variant">
        ¿Ya tiene cuenta? <Link href="/login" className="text-primary underline font-medium">Ingrese aquí</Link>
      </p>
    </form>
  );
}
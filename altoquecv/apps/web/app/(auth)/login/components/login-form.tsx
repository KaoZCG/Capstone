import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { LoginCredentials } from '@/types';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { loadFromStorage } from '@/lib/storage';

interface LoginFormProps {
  onSubmit: (credentials: LoginCredentials) => Promise<void>;
  onResendConfirmation?: (email: string) => Promise<{ success: boolean; mensaje: string }>;
  isLoading: boolean;
}

export function LoginForm({ onSubmit, onResendConfirmation, isLoading }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [resendMessage, setResendMessage] = useState('');
  const [isResending, setIsResending] = useState(false);

  const canResendConfirmation = Boolean(
    onResendConfirmation && email.includes('@') && error?.toLowerCase().includes('verificado'),
  );

  useEffect(() => {
    const savedEmail = loadFromStorage<string>('altoquecv_remember_email');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResendMessage('');
    const nextEmailError = email.trim()
      ? undefined
      : 'Este campo es obligatorio';
    const nextPasswordError = password
      ? undefined
      : 'Este campo es obligatorio';
    setEmailError(nextEmailError ?? '');
    setPasswordError(nextPasswordError ?? '');
    if (nextEmailError || nextPasswordError) return;
    try {
      await onSubmit({ email, contraseña: password, recuerdame: rememberMe });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Error al iniciar sesión');
    }
  };

  const handleResendConfirmation = async () => {
    if (!onResendConfirmation) return;
    setIsResending(true);
    setResendMessage('');
    try {
      const result = await onResendConfirmation(email);
      setResendMessage(result.mensaje);
    } catch (resendError) {
      setResendMessage(resendError instanceof Error ? resendError.message : 'No fue posible reenviar el correo.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <form noValidate onSubmit={handleSubmit} className="bg-surface-container rounded-container p-8 shadow-sm border border-border">
      <h1 className="text-headline-md text-on-surface mb-6 text-center">Iniciar Sesión</h1>
      
      {error && <div role="alert" aria-live="polite" className="mb-4 p-3 bg-error-container/20 text-error text-label-sm rounded border border-error/30">{error}</div>}
      {canResendConfirmation && (
        <button type="button" onClick={handleResendConfirmation} disabled={isResending} className="mb-4 text-label-sm font-semibold text-primary underline disabled:opacity-60">
          {isResending ? 'Reenviando correo…' : 'Reenviar correo de confirmación'}
        </button>
      )}
      {resendMessage && <p role="status" className="mb-4 text-label-sm text-on-surface-variant">{resendMessage}</p>}

      <div className="space-y-4 mb-6">
        <div>
          <label htmlFor="login-identifier" className="block text-label-md text-on-surface mb-1">Correo electrónico o RUT</label>
          <input
            id="login-identifier"
            type="text"
            autoComplete="username"
            required
            value={email}
            onBlur={() => setEmailError(email.trim() ? '' : 'Este campo es obligatorio')}
            onChange={(e) => { setEmail(e.target.value); setEmailError(''); setError(null); setResendMessage(''); }}
            disabled={isLoading}
            aria-invalid={Boolean(emailError)}
            aria-describedby={emailError ? 'login-identifier-error' : undefined}
            className="w-full px-4 py-2 bg-surface-container-lowest border border-border rounded-input text-on-surface placeholder:text-on-surface-variant focus:border-primary focus:outline-none"
            placeholder="correo@ejemplo.com o 12.345.678-5"
          />
          {emailError && <p id="login-identifier-error" className="mt-1 text-label-sm text-error">{emailError}</p>}
        </div>

        <div>
          <label htmlFor="login-password" className="block text-label-md text-on-surface mb-1">Contraseña</label>
          <div className="relative">
            <input
              id="login-password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              value={password}
              onBlur={() => setPasswordError(password ? '' : 'Este campo es obligatorio')}
              onChange={(e) => { setPassword(e.target.value); setPasswordError(''); setError(null); }}
              disabled={isLoading}
              aria-invalid={Boolean(passwordError)}
              aria-describedby={passwordError ? 'login-password-error' : undefined}
              className="w-full pl-4 pr-10 py-2 bg-surface-container-lowest border border-border rounded-input text-on-surface placeholder:text-on-surface-variant focus:border-primary focus:outline-none"
              placeholder="••••••••"
            />
            <button type="button" aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'} aria-pressed={showPassword} onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface">
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {passwordError && <p id="login-password-error" className="mt-1 text-label-sm text-error">{passwordError}</p>}
        </div>

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="rounded text-primary focus:ring-primary bg-surface border-border" />
            <span className="text-label-sm text-on-surface-variant">Recuérdame</span>
          </label>
          <Link href="/recuperar-contrasena" className="text-label-sm text-primary underline">¿Olvidó su contraseña?</Link>
        </div>
      </div>

      <Button variant="primary" className="w-full justify-center" disabled={isLoading}>
        {isLoading ? <Loader2 className="animate-spin mr-2" size={18} /> : null}
        {isLoading ? 'Ingresando...' : 'Ingresar'}
      </Button>

      <p className="mt-6 text-center text-label-sm text-on-surface-variant">
        ¿No tiene cuenta? <Link href="/signup" className="text-primary underline font-medium">Regístrese aquí</Link>
      </p>
    </form>
  );
}
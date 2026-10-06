import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { LoginCredentials } from '@/types';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { loadFromStorage } from '@/lib/storage';

interface LoginFormProps {
  onSubmit: (credentials: LoginCredentials) => Promise<void>;
  isLoading: boolean;
}

export function LoginForm({ onSubmit, isLoading }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    try {
      await onSubmit({ email, contraseña: password, recuerdame: rememberMe });
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-surface-container rounded-container p-8 shadow-sm border border-border">
      <h1 className="text-headline-md text-on-surface mb-6 text-center">Iniciar Sesión</h1>
      
      {error && <div role="alert" aria-live="polite" className="mb-4 p-3 bg-error-container/20 text-error text-label-sm rounded border border-error/30">{error}</div>}

      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-label-md text-on-surface mb-1">Correo electrónico</label>
          <input
            type="email" required value={email} onChange={(e) => { setEmail(e.target.value); setError(null); }} disabled={isLoading}
            className="w-full px-4 py-2 bg-surface-container-lowest border border-border rounded-input text-on-surface focus:border-primary focus:outline-none"
            placeholder="correo@ejemplo.com"
          />
        </div>

        <div>
          <label className="block text-label-md text-on-surface mb-1">Contraseña</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"} required value={password} onChange={(e) => { setPassword(e.target.value); setError(null); }} disabled={isLoading}
              className="w-full pl-4 pr-10 py-2 bg-surface-container-lowest border border-border rounded-input text-on-surface focus:border-primary focus:outline-none"
              placeholder="••••••••"
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface">
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="rounded text-primary focus:ring-primary bg-surface border-border" />
            <span className="text-label-sm text-on-surface-variant">Recuérdame</span>
          </label>
          <Link href="/recuperar-contrasena" className="text-label-sm text-primary hover:underline">¿Olvidó su contraseña?</Link>
        </div>
      </div>

      <Button variant="primary" className="w-full justify-center" disabled={isLoading}>
        {isLoading ? <Loader2 className="animate-spin mr-2" size={18} /> : null}
        {isLoading ? 'Ingresando...' : 'Ingresar'}
      </Button>

      <p className="mt-6 text-center text-label-sm text-on-surface-variant">
        ¿No tiene cuenta? <Link href="/signup" className="text-primary hover:underline font-medium">Regístrese aquí</Link>
      </p>
    </form>
  );
}
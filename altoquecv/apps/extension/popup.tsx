import React, { useEffect, useState, type FormEvent } from 'react';
import { ExternalLink, CheckCircle2, LogOut } from 'lucide-react';
declare const chrome: any;
declare const require: (id: string) => unknown;

require('./style.css'); // Plasmo procesa el CSS global para el popup directamente

import { getApiUrl, getAppUrl } from './runtime-config';

const SESSION_KEY = 'altoquecv_extension_session';

interface ExtensionSession {
  email: string;
  accessToken: string;
  expiresAt: number;
}

export default function Popup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [session, setSession] = useState<ExtensionSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    chrome.storage.local.get(SESSION_KEY, (stored: Record<string, ExtensionSession>) => {
      const current = stored[SESSION_KEY];
      if (current && current.expiresAt > Date.now()) setSession(current);
      else chrome.storage.local.remove(SESSION_KEY);
      setIsLoading(false);
    });
  }, []);

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const apiUrl = getApiUrl();
      const response = await fetch(`${apiUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok || !body.access_token) {
        throw new Error(body.detail || 'No fue posible iniciar sesión.');
      }

      const nextSession: ExtensionSession = {
        email: body.email || email,
        accessToken: body.access_token,
        expiresAt: Date.now() + ((body.expires_in || 3600) * 1000),
      };
      await new Promise<void>((resolve) => chrome.storage.local.set({ [SESSION_KEY]: nextSession }, resolve));
      setSession(nextSession);
      setPassword('');
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : 'No fue posible conectar con el backend.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    chrome.storage.local.remove(SESSION_KEY, () => setSession(null));
  };

  const handleOpenApp = () => {
    try {
      const appUrl = getAppUrl();
      if (!appUrl) {
        setError('Configura PLASMO_PUBLIC_APP_URL para abrir AltoqueCV.');
        return;
      }
      window.open(new URL('/perfil-maestro', appUrl).toString(), '_blank', 'noopener,noreferrer');
    } catch (openError) {
      setError(openError instanceof Error ? openError.message : 'No se pudo abrir AltoqueCV.');
    }
  };

  return (
    <div className="w-72 border border-[var(--color-border)] bg-[var(--color-surface)] p-5 font-sans">
      <div className="mb-5 flex items-center gap-3 border-b border-[var(--color-border)] pb-3">
        <div className="flex h-8 w-8 items-center justify-center rounded bg-[var(--color-primary)] text-lg font-bold text-[var(--color-on-primary)]">A</div>
        <h1 className="text-lg font-bold text-[var(--color-on-surface)]">AltoqueCV</h1>
      </div>

      <div className="mb-4 flex items-center gap-3 rounded-md border border-[var(--color-success)]/20 bg-[var(--color-success-container)]/20 p-3">
        <CheckCircle2 className="text-[var(--color-success)]" size={20} />
        <div>
          <p className="text-sm font-bold text-[var(--color-success)]">Extensión Activa</p>
          <p className="text-xs text-[var(--color-on-surface-variant)]">Laborum y Trabajando.com</p>
        </div>
      </div>

      {isLoading ? (
        <p className="mb-4 text-sm text-[var(--color-on-surface-variant)]">Comprobando sesión…</p>
      ) : session ? (
        <div className="mb-4 rounded-md border border-[var(--color-border)] p-3">
          <p className="text-xs text-[var(--color-on-surface-variant)]">Perfil conectado</p>
          <p className="mt-1 truncate text-sm font-semibold text-[var(--color-on-surface)]">{session.email}</p>
          <button type="button" onClick={handleLogout} className="mt-3 inline-flex items-center gap-2 text-xs font-medium text-[var(--color-error)]">
            <LogOut size={14} /> Cerrar sesión
          </button>
        </div>
      ) : (
        <form onSubmit={handleLogin} className="mb-4 space-y-3">
          <label className="block text-xs font-medium text-[var(--color-on-surface-variant)]">
            Correo o RUT de AltoqueCV
            <input required type="text" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-1 w-full rounded border border-[var(--color-border)] bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-600" />
          </label>
          <label className="block text-xs font-medium text-[var(--color-on-surface-variant)]">
            Contraseña
            <input required type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-1 w-full rounded border border-[var(--color-border)] bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-600" />
          </label>
          {error && <p role="alert" className="text-xs text-[var(--color-error)]">{error}</p>}
          <button type="submit" disabled={isLoading} className="w-full rounded bg-[var(--color-primary)] py-2 text-sm font-semibold text-[var(--color-on-primary)] disabled:opacity-60">
            {isLoading ? 'Conectando…' : 'Conectar Perfil Maestro'}
          </button>
        </form>
      )}

      <div className="mb-5">
        <h2 className="mb-2 text-xs font-bold uppercase tracking-wider text-[var(--color-on-surface-variant)]">Redes Compatibles</h2>
        <ul className="space-y-1 text-sm text-[var(--color-on-surface)]">
          <li>• Laborum Chile</li>
          <li>• Trabajando.com</li>
        </ul>
      </div>

      <button 
        onClick={handleOpenApp}
        className="flex w-full items-center justify-center gap-2 rounded bg-[var(--color-surface-container-highest)] py-2 text-sm font-medium text-[var(--color-on-surface)] transition-colors hover:bg-[var(--color-outline)]"
      >
        <ExternalLink size={16} /> Abrir Perfil Maestro
      </button>
    </div>
  );
}
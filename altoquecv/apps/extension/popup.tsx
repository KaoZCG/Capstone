import React, { useEffect, useState, type FormEvent } from 'react';
import { ExternalLink, CheckCircle2, LogOut } from 'lucide-react';
declare const chrome: any;
declare const require: (id: string) => unknown;

require('./style.css'); // Plasmo procesa el CSS global para el popup directamente

const API_URL = 'http://localhost:8000/api/v1';
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
      const response = await fetch(`${API_URL}/auth/login`, {
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
    window.open('http://localhost:3000/perfil-maestro', '_blank');
  };

  return (
    <div className="w-72 p-5 bg-[hsl(var(--surface))] font-sans border border-[hsl(var(--border))]">
      <div className="flex items-center gap-3 mb-5 border-b border-[hsl(var(--border))] pb-3">
        <div className="w-8 h-8 bg-[hsl(var(--primary))] text-white rounded font-bold flex items-center justify-center text-lg">A</div>
        <h1 className="text-lg font-bold text-[hsl(var(--on-surface))]">AltoqueCV</h1>
      </div>

      <div className="bg-[hsl(var(--success-container))]/20 border border-[hsl(var(--success))]/20 rounded-md p-3 mb-4 flex items-center gap-3">
        <CheckCircle2 className="text-[hsl(var(--success))]" size={20} />
        <div>
          <p className="text-sm font-bold text-[hsl(var(--success))]">Extensión Activa</p>
          <p className="text-xs text-[hsl(var(--on-surface-variant))]">5 portales soportados</p>
        </div>
      </div>

      {isLoading ? (
        <p className="mb-4 text-sm text-[hsl(var(--on-surface-variant))]">Comprobando sesión…</p>
      ) : session ? (
        <div className="mb-4 rounded-md border border-[hsl(var(--border))] p-3">
          <p className="text-xs text-[hsl(var(--on-surface-variant))]">Perfil conectado</p>
          <p className="mt-1 truncate text-sm font-semibold text-[hsl(var(--on-surface))]">{session.email}</p>
          <button type="button" onClick={handleLogout} className="mt-3 inline-flex items-center gap-2 text-xs font-medium text-[hsl(var(--error))]">
            <LogOut size={14} /> Cerrar sesión
          </button>
        </div>
      ) : (
        <form onSubmit={handleLogin} className="mb-4 space-y-3">
          <label className="block text-xs font-medium text-[hsl(var(--on-surface-variant))]">
            Correo de AltoqueCV
            <input required type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-1 w-full rounded border border-[hsl(var(--border))] bg-white px-3 py-2 text-sm text-gray-900" />
          </label>
          <label className="block text-xs font-medium text-[hsl(var(--on-surface-variant))]">
            Contraseña
            <input required type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-1 w-full rounded border border-[hsl(var(--border))] bg-white px-3 py-2 text-sm text-gray-900" />
          </label>
          {error && <p role="alert" className="text-xs text-[hsl(var(--error))]">{error}</p>}
          <button type="submit" disabled={isLoading} className="w-full rounded bg-[hsl(var(--primary))] py-2 text-sm font-semibold text-white disabled:opacity-60">
            {isLoading ? 'Conectando…' : 'Conectar Perfil Maestro'}
          </button>
        </form>
      )}

      <div className="mb-5">
        <h2 className="text-xs font-bold text-[hsl(var(--on-surface-variant))] uppercase tracking-wider mb-2">Redes Compatibles</h2>
        <ul className="text-sm text-[hsl(var(--on-surface))] space-y-1">
          <li>• Laborum Chile</li>
          <li>• Trabajando.com</li>
        </ul>
      </div>

      <button 
        onClick={handleOpenApp}
        className="w-full bg-[hsl(var(--surface-container-highest))] hover:bg-[hsl(var(--outline))] text-[hsl(var(--on-surface))] font-medium text-sm py-2 rounded flex items-center justify-center gap-2 transition-colors"
      >
        <ExternalLink size={16} /> Abrir Perfil Maestro
      </button>
    </div>
  );
}
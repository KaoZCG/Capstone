'use client';

import React, { useState, useEffect, useCallback, useContext, createContext, type ReactNode } from 'react';
import { User, AuthContextType, LoginCredentials, SignupData, PasswordRecoveryData } from '@/types';
import { formatRUT, isValidChileanPhone, isValidRUT, isValidEmail, isValidPersonName, normalizeChileanPhone, validatePassword, isTokenExpired } from '@/lib/auth';
import { loadFromStorage, saveToStorage } from '@/lib/storage';
import { useRouter } from 'next/navigation';

const AUTH_STORAGE_KEY = 'altoquecv_auth_session';
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api/v1';

function getApiError(body: Record<string, any>, fallback: string): string {
  if (Array.isArray(body.detail)) {
    return body.detail.map((item: { msg?: string }) => item.msg).filter(Boolean).join('. ') || fallback;
  }
  return body.detail ?? fallback;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return context;
}

function normalizeUserFromResponse(payload: Record<string, any>, fallbackEmail?: string): User {
  const firstName = payload.first_name ?? payload.firstName ?? '';
  const rawLastName = payload.last_name ?? payload.lastName ?? '';
  const lastName = rawLastName === 'Usuario' && firstName ? '' : rawLastName;
  const nombre = [firstName, lastName].filter(Boolean).join(' ') || 'Usuario';

  return {
    id: payload.user_id ?? payload.id ?? fallbackEmail ?? `user-${Date.now()}`,
    nombre,
    email: payload.email ?? fallbackEmail ?? '',
    rut: payload.rut ?? '',
    teléfono: payload.telefono ?? payload.phone ?? '',
    rol: 'usuario',
    createdAt: new Date().toISOString(),
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    async function restoreSession() {
      const saved = loadFromStorage<{ usuario: User; token: string; expiresAt: string }>(AUTH_STORAGE_KEY);
      if (!saved || isTokenExpired(saved.token) || new Date(saved.expiresAt) <= new Date()) {
        localStorage.removeItem(AUTH_STORAGE_KEY);
        if (!cancelled) setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${saved.token}` },
        });
        if (!response.ok) throw new Error('Sesión inválida');

        const currentUser = await response.json();
        const user = normalizeUserFromResponse(currentUser, saved.usuario.email);
        if (!cancelled) {
          setUsuario(user);
          setAccessToken(saved.token);
          saveToStorage(AUTH_STORAGE_KEY, { ...saved, usuario: user });
        }
      } catch {
        localStorage.removeItem(AUTH_STORAGE_KEY);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void restoreSession();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (credentials: LoginCredentials) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: credentials.email,
          password: credentials.contraseña,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.access_token) {
        throw new Error(getApiError(data, 'Credenciales inválidas'));
      }

      const user = normalizeUserFromResponse(data, credentials.email);
      const session = {
        usuario: user,
        token: data.access_token,
        expiresAt: new Date(Date.now() + ((data.expires_in ?? 3600) * 1000)).toISOString(),
      };

      setUsuario(user);
      setAccessToken(data.access_token);
      saveToStorage(AUTH_STORAGE_KEY, session);

      if (credentials.recuerdame) saveToStorage('altoquecv_remember_email', credentials.email);
      return { success: true };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signup = useCallback(async (data: SignupData) => {
    setIsLoading(true);
    try {
      const rut = formatRUT(data.rut);
      if (!isValidPersonName(data.nombre)) throw new Error('El nombre solo puede contener letras, espacios, guiones o apóstrofes');
      if (!isValidRUT(rut)) throw new Error('RUT inválido: revisa el dígito verificador');
      if (!isValidEmail(data.email)) throw new Error('Email inválido');
      if (!isValidChileanPhone(data.teléfono)) throw new Error('El teléfono debe tener formato +569XXXXXXXX');
      const pwdValidation = validatePassword(data.contraseña);
      if (!pwdValidation.valid) throw new Error('Contraseña no cumple requisitos de seguridad');
      if (!data.aceptoTerminos) throw new Error('Debes aceptar los términos y condiciones');

      const confirmation = data.confirmarContraseña ?? data.contraseña;
      if (data.contraseña !== confirmation) throw new Error('Las contraseñas no coinciden');

      const [firstName, ...restName] = (data.nombre || '').trim().split(/\s+/).filter(Boolean);
      const payload = {
        email: data.email,
        password: data.contraseña,
        password_confirmation: confirmation,
        first_name: firstName || 'Usuario',
        last_name: restName.join(' ') || 'Usuario',
        rut,
        telefono: normalizeChileanPhone(data.teléfono),
        acepto_terminos: data.aceptoTerminos,
      };

      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const body = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(getApiError(body, 'No fue posible crear la cuenta.'));
      }

      if (body.requires_email_confirmation) {
        return { requires_email_confirmation: true, message: 'Cuenta creada. Revisa tu correo para confirmar tu cuenta.' };
      }

      const user = normalizeUserFromResponse(
        {
          user_id: body.user_id,
          email: body.email,
          first_name: body.first_name ?? firstName,
          last_name: body.last_name ?? (restName.join(' ') || 'Usuario'),
        },
        data.email,
      );

      const session = {
        usuario: user,
        token: body.access_token ?? '',
        expiresAt: new Date(Date.now() + ((body.expires_in ?? 3600) * 1000)).toISOString(),
      };

      setUsuario(user);
      setAccessToken(body.access_token ?? null);
      saveToStorage(AUTH_STORAGE_KEY, session);
      return { requires_email_confirmation: false };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setUsuario(null);
    setAccessToken(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
    router.push('/login');
  }, [router]);

  const recoverPassword = useCallback(async (data: PasswordRecoveryData) => {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return { success: true, mensaje: 'Se ha enviado un enlace de recuperación a tu correo electrónico.' };
  }, []);

  return React.createElement(
    AuthContext.Provider,
    {
      value: {
        usuario,
        accessToken,
        isLoading,
        isAuthenticated: !!usuario,
        login,
        signup,
        logout,
        recoverPassword,
      },
    },
    children
  );
}
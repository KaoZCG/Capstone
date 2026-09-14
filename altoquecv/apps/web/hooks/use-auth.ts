'use client';

import React, { useState, useEffect, useCallback, useContext, createContext } from 'react';
import { User, AuthContextType, LoginCredentials, SignupData, PasswordRecoveryData } from '@/types';
import { isValidRUT, isValidEmail, validatePassword, isTokenExpired } from '@/lib/auth';
import { validateMockCredentials, createMockUser, createMockAuthSession } from '@/lib/mock/auth.mock';
import { loadFromStorage, saveToStorage } from '@/lib/storage';
import { useRouter } from 'next/navigation';

const AUTH_STORAGE_KEY = 'altoquecv_auth_session';

export const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [usuario, setUsuario] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const saved = loadFromStorage<{ usuario: User; token: string; expiresAt: string }>(AUTH_STORAGE_KEY);
    if (saved) {
      if (!isTokenExpired(saved.token) && new Date(saved.expiresAt) > new Date()) {
        setUsuario(saved.usuario);
      } else {
        localStorage.removeItem(AUTH_STORAGE_KEY);
      }
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (credentials: LoginCredentials) => {
    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      const validation = validateMockCredentials(credentials.email, credentials.contraseña);
      
      if (!validation.success) throw new Error(validation.error || 'Credenciales inválidas');

      const user = validation.user!;
      const session = createMockAuthSession(user);

      setUsuario(user);
      saveToStorage(AUTH_STORAGE_KEY, session);

      if (credentials.recuerdame) saveToStorage('altoquecv_remember_email', credentials.email);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signup = useCallback(async (data: SignupData) => {
    setIsLoading(true);
    try {
      if (!isValidRUT(data.rut)) throw new Error('RUT inválido (formato: NN.NNN.NNN-N)');
      if (!isValidEmail(data.email)) throw new Error('Email inválido');
      const pwdValidation = validatePassword(data.contraseña);
      if (!pwdValidation.valid) throw new Error('Contraseña no cumple requisitos de seguridad');
      if (!data.aceptoTerminos) throw new Error('Debes aceptar los términos y condiciones');

      await new Promise((resolve) => setTimeout(resolve, 1000));

      const newUser = createMockUser({
        nombre: data.nombre,
        rut: data.rut,
        email: data.email,
        teléfono: data.teléfono,
      });

      const session = createMockAuthSession(newUser);
      setUsuario(newUser);
      saveToStorage(AUTH_STORAGE_KEY, session);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setUsuario(null);
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
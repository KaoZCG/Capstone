import { User, AuthSession } from '@/types';
import { createMockJWT } from '@/lib/auth';

export const demoUser: User = {
  id: 'user-001',
  nombre: 'Rodrigo Andrés Sepúlveda',
  email: 'r.sepulveda@email.com',
  rut: '18.234.567-8',
  teléfono: '+56975831234',
  rol: 'usuario',
  createdAt: new Date('2024-01-15').toISOString(),
};

export const demoCredentials = {
  email: 'r.sepulveda@email.com',
  contraseña: 'Demo1234',
};

export function createMockAuthSession(user: User): AuthSession {
  const token = createMockJWT(user);
  return {
    usuario: user,
    token,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  };
}

export function validateMockCredentials(email: string, contraseña: string): { success: boolean; user?: User; error?: string } {
  if (email !== demoCredentials.email) {
    return { success: false, error: 'Email no encontrado' };
  }
  if (contraseña !== demoCredentials.contraseña) {
    return { success: false, error: 'Contraseña incorrecta' };
  }
  return { success: true, user: demoUser };
}

export function createMockUser(data: { nombre: string; rut: string; email: string; teléfono: string }): User {
  return {
    id: `user-${Date.now()}`,
    ...data,
    rol: 'usuario',
    createdAt: new Date().toISOString(),
  };
}
import { User } from '@/types';

export function createMockJWT(user: User): string {
  const payload = {
    sub: user.id,
    email: user.email,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 86400 * 7,
  };
  
  if (typeof window !== 'undefined') {
    return btoa(JSON.stringify(payload));
  }
  return Buffer.from(JSON.stringify(payload)).toString('base64');
}

export function decodeMockJWT(token: string): Record<string, any> | null {
  try {
    if (typeof window !== 'undefined') {
      return JSON.parse(atob(token));
    }
    return JSON.parse(Buffer.from(token, 'base64').toString('utf-8'));
  } catch {
    return null;
  }
}

export function isTokenExpired(token: string): boolean {
  const decoded = decodeMockJWT(token);
  if (!decoded || !decoded.exp) return true;
  return decoded.exp < Math.floor(Date.now() / 1000);
}

export function isValidRUT(rut: string): boolean {
  const rutRegex = /^\d{1,2}\.\d{3}\.\d{3}-[0-9Kk]$/;
  return rutRegex.test(rut);
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validatePassword(pwd: string): { valid: boolean; strength: 'débil' | 'media' | 'fuerte' } {
  const hasUpperCase = /[A-Z]/.test(pwd);
  const hasLowerCase = /[a-z]/.test(pwd);
  const hasNumber = /\d/.test(pwd);
  const isLongEnough = pwd.length >= 8;

  const meetsRequirements = hasUpperCase && hasLowerCase && hasNumber && isLongEnough;

  let strength: 'débil' | 'media' | 'fuerte' = 'débil';
  if (meetsRequirements) {
    strength = pwd.length >= 12 ? 'fuerte' : 'media';
  }

  return { valid: meetsRequirements, strength };
}
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
    const encodedPayload = token.split('.')[1];
    if (encodedPayload) {
      const normalizedPayload = encodedPayload.replace(/-/g, '+').replace(/_/g, '/');
      return JSON.parse(atob(normalizedPayload.padEnd(Math.ceil(normalizedPayload.length / 4) * 4, '=')));
    }
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
  if (!decoded || typeof decoded.exp !== 'number') return true;
  return decoded.exp < Math.floor(Date.now() / 1000);
}

export function isValidRUT(rut: string): boolean {
  const normalized = rut.replace(/\./g, '').trim().toUpperCase();
  if (!/^\d{7,8}-[0-9K]$/.test(normalized)) return false;

  const [number, verifier] = normalized.split('-');
  let multiplier = 2;
  let total = 0;
  for (const digit of [...number].reverse()) {
    total += Number(digit) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }

  const remainder = 11 - (total % 11);
  const expected = remainder === 11 ? '0' : remainder === 10 ? 'K' : String(remainder);
  return verifier === expected;
}

export function formatRUT(value: string): string {
  const compact = value.replace(/[^0-9kK]/g, '').toUpperCase();
  if (compact.length < 2) return compact;

  const body = compact.slice(0, -1);
  const verifier = compact.slice(-1);
  const formattedBody = body.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${formattedBody}-${verifier}`;
}

export function normalizeChileanPhone(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (digits.startsWith('569') && digits.length === 11) return `+${digits}`;
  if (digits.startsWith('9') && digits.length === 9) return `+56${digits}`;
  if (digits.startsWith('56') && digits.length === 11) return `+${digits}`;
  return value.trim();
}

export function isValidChileanPhone(value: string): boolean {
  return /^\+569\d{8}$/.test(normalizeChileanPhone(value));
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isValidPersonName(value: string): boolean {
  const normalized = value.trim().replace(/\s+/g, ' ');
  return Boolean(normalized) && /^[\p{L}][\p{L} '\-]*$/u.test(normalized);
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
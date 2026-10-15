export interface User {
  id: string;
  nombre: string;
  email: string;
  rut: string;
  teléfono: string;
  rol: 'usuario' | 'admin';
  createdAt: string;
}

export interface AuthSession {
  usuario: User;
  token: string;
  expiresAt: string;
}

export interface LoginCredentials {
  email: string;
  contraseña: string;
  recuerdame?: boolean;
}

export interface SignupData {
  nombre: string;
  rut: string;
  email: string;
  teléfono: string;
  contraseña: string;
  confirmarContraseña?: string;
  aceptoTerminos: boolean;
}

export interface PasswordRecoveryData {
  email: string;
}

export interface AuthContextType {
  usuario: User | null;
  accessToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<{ success?: boolean } | void>;
  signup: (data: SignupData) => Promise<{ requires_email_confirmation?: boolean; message?: string } | void>;
  logout: () => void;
  recoverPassword: (data: PasswordRecoveryData) => Promise<{ success: boolean; mensaje: string }>;
  resendConfirmation: (email: string) => Promise<{ success: boolean; mensaje: string }>;
}
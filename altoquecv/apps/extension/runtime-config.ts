const isDevelopmentBuild = process.env.NODE_ENV === 'development';

export function getApiUrl(): string {
  const configuredUrl = process.env.PLASMO_PUBLIC_API_URL?.trim();
  const value = configuredUrl || (isDevelopmentBuild ? 'http://localhost:8000/api/v1' : '');
  if (!value) {
    throw new Error('Configura PLASMO_PUBLIC_API_URL antes de usar la extensión.');
  }

  const parsed = new URL(value);
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error('PLASMO_PUBLIC_API_URL debe usar HTTP o HTTPS.');
  }
  if (!isDevelopmentBuild && parsed.protocol !== 'https:') {
    throw new Error('La API de producción debe usar HTTPS.');
  }
  if (parsed.username || parsed.password || parsed.search || parsed.hash) {
    throw new Error('PLASMO_PUBLIC_API_URL no debe incluir credenciales, query ni fragmento.');
  }
  return value.replace(/\/+$/, '');
}

export function getAppUrl(): string | null {
  const configuredUrl = process.env.PLASMO_PUBLIC_APP_URL?.trim();
  const value = configuredUrl || (isDevelopmentBuild ? 'http://localhost:3000' : '');
  if (!value) return null;

  const parsed = new URL(value);
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error('PLASMO_PUBLIC_APP_URL debe usar HTTP o HTTPS.');
  }
  if (parsed.username || parsed.password || parsed.pathname !== '/' || parsed.search || parsed.hash) {
    throw new Error('PLASMO_PUBLIC_APP_URL debe ser el origen de la aplicación, sin credenciales, ruta ni query.');
  }
  if (!isDevelopmentBuild && parsed.protocol !== 'https:') {
    throw new Error('La aplicación de producción debe usar HTTPS.');
  }
  return value.replace(/\/+$/, '');
}

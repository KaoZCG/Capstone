import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const extensionRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifestPath = path.join(extensionRoot, 'build', 'chrome-mv3-prod', 'manifest.json');
const apiUrlValue = process.env.PLASMO_PUBLIC_API_URL?.trim();
const appUrlValue = process.env.PLASMO_PUBLIC_APP_URL?.trim();

if (!apiUrlValue || !appUrlValue) {
  throw new Error('Configura PLASMO_PUBLIC_API_URL y PLASMO_PUBLIC_APP_URL para compilar la extensión de producción.');
}

const apiUrl = new URL(apiUrlValue);
const appUrl = new URL(appUrlValue);
if (apiUrl.protocol !== 'https:' || appUrl.protocol !== 'https:') {
  throw new Error('La API y la app deben usar HTTPS en la extensión de producción.');
}
if (apiUrl.username || apiUrl.password || apiUrl.search || apiUrl.hash) {
  throw new Error('PLASMO_PUBLIC_API_URL no debe incluir credenciales, query ni fragmento.');
}
if (appUrl.username || appUrl.password || appUrl.pathname !== '/' || appUrl.search || appUrl.hash) {
  throw new Error('PLASMO_PUBLIC_APP_URL debe ser el origen de la aplicación, sin credenciales, ruta ni query.');
}

const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
const syncContentScripts = manifest.content_scripts?.filter((contentScript) =>
  contentScript.js?.some((scriptFile) => path.basename(scriptFile).startsWith('sync.')),
);
if (syncContentScripts?.length !== 1) {
  throw new Error('No se encontró de forma única el content script de sincronización en el manifest de producción.');
}

syncContentScripts[0].matches = [`${appUrl.origin}/*`];

const portalPermissions = [
  'https://*.laborum.cl/*',
  'https://*.trabajando.com/*',
  'https://*.trabajando.cl/*',
];
manifest.host_permissions = [...new Set([`${apiUrl.origin}/*`, ...portalPermissions])];
await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

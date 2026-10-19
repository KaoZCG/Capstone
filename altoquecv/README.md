# AltoqueCV con Docker Compose

Docker Compose levanta el frontend, la API FastAPI y Ollama con el modelo
configurado. Se necesita Docker Desktop con Docker Compose v2 y acceso a
Internet para descargar las imágenes, dependencias y el modelo de IA.

## Primer inicio

1. Crea el archivo de configuración y completa `SUPABASE_URL`,
   `SUPABASE_ANON_KEY` y `SUPABASE_SERVICE_ROLE_KEY`:

   ```powershell
   Copy-Item .env.example .env
   ```

   La clave `SERVICE_ROLE` solo se entrega al backend; no la publiques ni la
   agregues al frontend.
2. Desde esta carpeta, ejecuta:

   ```sh
   docker compose up --build
   ```

Compose construye el frontend local y obtiene el backend desde la rama
`backend` de este mismo repositorio. Ollama descarga el modelo especificado en
`OLLAMA_MODEL` la primera vez y conserva sus archivos en un volumen Docker.
El primer inicio puede demorar según la conexión y el equipo.

Abre <http://localhost:3000>. La API queda disponible en
<http://localhost:8000>; su documentación está en <http://localhost:8000/docs>.
Para detener los servicios, usa `Ctrl+C`; para quitarlos después,
`docker compose down`. El modelo de Ollama se conserva en el volumen.

Sin las credenciales reales de Supabase, la interfaz y los servicios pueden
iniciar, pero registro, autenticación y sincronización del perfil no funcionarán.

La extensión del navegador no es un servidor y no se instala con Compose.
Después de arrancar la API, se construye con `pnpm --filter extension build` y se
carga en el navegador desde su carpeta `build`.

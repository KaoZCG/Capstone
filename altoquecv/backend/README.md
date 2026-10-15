# AltoqueCV Backend

API FastAPI independiente del frontend. El módulo de autenticación delega las
credenciales y la confirmación de correo a Supabase Auth. Después de crear la
cuenta, el backend guarda los datos de registro en `public.usuarios` y
`public.perfiles_candidatos`, usando el mismo UUID de `auth.users` como
`usuarios.id` y `perfiles_candidatos.usuario_id`.

## Desarrollo local con `uv`

Requiere Python 3.10+ y `uv`.

```powershell
cd backend
Copy-Item .env.example .env
uv sync
uv run uvicorn app.main:app --reload --port 8000
```

## Instalación con `pip`

Para instalar solo las dependencias de ejecución usa `requirements.txt`. Para
desarrollo y pruebas, instala `requirements-dev.txt`, que incluye las anteriores.

```powershell
cd backend
py -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements-dev.txt
Copy-Item .env.example .env
python -m uvicorn app.main:app --reload --port 8000
```

Configura `SUPABASE_URL` y `SUPABASE_ANON_KEY` en `.env` antes de usar auth.
Para escribir en `usuarios` y `perfiles_candidatos`, agrega también la clave
privada `SUPABASE_SERVICE_ROLE_KEY`; nunca la expongas en el frontend ni la
subas a Git. La restricción `UNIQUE` de `perfiles_candidatos.rut_identificador`
impide duplicar el RUT.

## Respuestas de postulación con Ollama

`POST /api/v1/auth/ia/autocompletar` usa el token del usuario para cargar su Perfil Maestro desde Supabase y genera respuestas con Ollama. El backend registra la cantidad de preguntas y la cobertura del perfil, sin guardar las preguntas ni datos personales en los logs.

Por defecto, FastAPI espera Ollama en `http://127.0.0.1:11434` y usa el modelo `phi3`. Asegúrate de tener Ollama ejecutándose y descarga el modelo:

```powershell
ollama pull phi3
ollama list
```

Los valores se pueden cambiar por entorno para desarrollo o despliegue:

```dotenv
OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_MODEL=phi3
OLLAMA_TIMEOUT_SECONDS=45
```

Comprueba la conexión desde FastAPI en `GET /health/ai`. Si FastAPI corre en Docker y Ollama en el host, configura `OLLAMA_BASE_URL=http://host.docker.internal:11434`. Para escalar, ejecuta Ollama como un servicio separado y configura la URL interna alcanzable desde FastAPI; no expongas el puerto de Ollama directamente a Internet.

## Endpoints

- `GET /health`
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `GET /api/v1/auth/me` (requiere `Authorization: Bearer <access_token>`)
- `GET /docs`

Ejemplo de registro:

```json
{
  "email": "persona@example.com",
  "password": "password123",
  "password_confirmation": "password123",
  "nombre": "Ana Pérez",
  "rut": "12.345.678-9",
  "telefono": "+56912345678",
  "acepto_terminos": true
}
```

Si la confirmación de correo está activa en Supabase, el registro responde sin
`access_token` y con `requires_email_confirmation: true`. El usuario debe abrir
el enlace recibido antes de iniciar sesión. Si la confirmación está desactivada,
Supabase entrega los tokens inmediatamente.

Si falla la escritura de `usuarios` o `perfiles_candidatos`, el backend elimina
los registros parciales y la cuenta Auth recién creada para evitar usuarios
incompletos.

Las cuentas creadas en Supabase Auth antes de esta integración se sincronizan
al iniciar sesión: se crea `usuarios` y, si la metadata contiene un RUT, también
`perfiles_candidatos`.

El endpoint `/auth/me` se usa al recargar el frontend: valida el token contra
Supabase y devuelve el identificador, correo, nombres, RUT, teléfono y fecha de
confirmación. La tabla personalizada `usuarios` se sincronizará en una etapa
posterior, idealmente con un trigger controlado sobre `auth.users`.

## Pruebas

```powershell
uv run pytest
```

Con el entorno virtual activado e instalado desde `requirements-dev.txt`, también
puedes ejecutar `python -m pytest`.

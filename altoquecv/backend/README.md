# AltoqueCV Backend

API FastAPI independiente del frontend. El módulo de autenticación delega las
credenciales y la confirmación de correo a Supabase Auth. Después de crear la
cuenta, el backend guarda los datos de registro en `public.usuarios` y
`public.perfiles_candidatos`, usando el mismo UUID de `auth.users` como
`usuarios.id` y `perfiles_candidatos.usuario_id`.

## Desarrollo local

Requiere Python 3.10+ y `uv`.

```powershell
cd backend
Copy-Item .env.example .env
uv sync
uv run uvicorn app.main:app --reload --port 8000
```

Configura `SUPABASE_URL` y `SUPABASE_ANON_KEY` en `.env` antes de usar auth.
Para escribir en `usuarios` y `perfiles_candidatos`, agrega también la clave
privada `SUPABASE_SERVICE_ROLE_KEY`; nunca la expongas en el frontend ni la
subas a Git. La restricción `UNIQUE` de `perfiles_candidatos.rut_identificador`
impide duplicar el RUT.

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

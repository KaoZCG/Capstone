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

## Configuración de IA con OpenRouter

En `/adaptador/modelo`, cada persona conecta su propia API key de OpenRouter y
elige un modelo gratuito. El modelo seleccionado se consulta y guarda en
`credenciales_proveedores_ia` en Supabase. La API key se cifra con Fernet antes
de guardarse; solo
el backend la descifra y la envía a OpenRouter. Nunca se devuelve al navegador,
se incluye en logs ni se conserva en el almacenamiento de la extensión.

Configura `AI_CREDENTIALS_ENCRYPTION_KEY` en el entorno del backend. Genera una
clave una sola vez con `python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"`,
guárdala como secreto y mantenla estable e idéntica en cada instancia de backend
que comparta la base de datos. Si se pierde o cambia, las API keys ya cifradas no
se podrán recuperar. La variable es necesaria para conectar una nueva key y
para usar una credencial existente.

Todas las operaciones de IA requieren una API key y un modelo activo guardados
en Supabase. Si falta la configuración o OpenRouter no está disponible, la API
devuelve un error explícito y no cambia a otro proveedor.

## Extracción de currículums

`POST /api/v1/auth/ia/procesar-cv` envía el texto legible del PDF al modelo
seleccionado en OpenRouter. Los documentos extensos se procesan en fragmentos solapados para
no truncar el final del CV. El modelo identifica secciones por su contenido
aunque el archivo no use el encabezado exacto «Experiencia Laboral». Los campos
de experiencia, formación y habilidades se aceptan solo si el modelo aporta
evidencia textual localizable en el documento; los campos sin respaldo se dejan
vacíos. Los PDF escaneados que no contienen texto todavía requieren OCR.

## Modelos gratuitos de OpenRouter para adaptar el CV

La interfaz consulta `GET /api/v1/auth/ia/openrouter/models` y solo ofrece
modelos de texto cuyo identificador termina en `:free` y cuyo precio de entrada
y salida es cero. El backend valida la API key y el modelo antes de guardar la
credencial cifrada. Las peticiones del frontend y de la extensión solo llevan el
token de sesión; el proveedor activo, el modelo y la clave se resuelven desde
Supabase en el backend.

Las rutas de extracción del CV, adaptación y respuestas de postulaciones envían
sus datos al modelo seleccionado. Los modelos gratuitos pueden cambiar, tener
límites o dejar de estar disponibles.

La interfaz espera hasta 30 minutos por el análisis e informa el tiempo transcurrido.
Cuando OpenRouter termina, el Perfil Maestro se sincroniza automáticamente mediante
`PUT /api/v1/auth/profile`; la importación solo se marca como completada después
de confirmar esa sincronización. Si la base de datos no responde, los datos quedan
en pantalla y se muestra un aviso para permitir reintentar.

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

`POST /api/v1/auth/refresh` recibe el `refresh_token` de la sesión y devuelve
tokens renovados. El frontend renueva automáticamente las sesiones vencidas y
reintenta una vez la sincronización del Perfil Maestro si la API rechaza un
access token expirado.

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

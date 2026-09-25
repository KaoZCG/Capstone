# `Any` describe el contenido dinámico del JSON de error recibido del proveedor.
from typing import Any

# Cliente HTTP asíncrono y respuesta tipada de la comunicación con Supabase.
import httpx

# Configuración con URL y clave pública del proyecto Supabase.
from app.core.config import Settings
# Esquemas de entrada y salida que mantienen un contrato estable para el frontend.
from app.schemas.auth import AuthResponse, CurrentUserResponse, LoginRequest, PasswordConfirmationRequest
from app.schemas.data import PostulacionResponse, ProfileResponse


class AuthServiceError(Exception):
    """Error propio para transportar mensaje y código HTTP desde el proveedor."""

    def __init__(self, message: str, status_code: int) -> None:
        # `super()` inicializa la excepción base para que `str(error)` funcione.
        super().__init__(message)
        # Guardamos el status para que la capa HTTP pueda responder sin conocer detalles
        # de httpx o Supabase.
        self.status_code = status_code


class SupabaseAuthService:
    """Encapsula todas las llamadas de autenticación hacia Supabase Auth."""

    def __init__(self, settings: Settings, client: httpx.AsyncClient) -> None:
        # El cliente se recibe desde la dependencia de FastAPI para poder cerrarlo
        # automáticamente y sustituirlo fácilmente en pruebas.
        self._client = client
        # Estas cabeceras son requeridas por la API REST de Supabase Auth.
        self._headers = {
            "apikey": settings.supabase_anon_key,
            "Content-Type": "application/json",
        }
        self._admin_headers = (
            {
                "apikey": settings.supabase_service_role_key,
                "Authorization": f"Bearer {settings.supabase_service_role_key}",
                "Content-Type": "application/json",
            }
            if settings.supabase_service_role_key
            else None
        )
        # Quitamos una barra final para no producir URLs con `//auth/v1/...`.
        self._base_url = str(settings.supabase_url).rstrip("/")

    async def register(self, payload: PasswordConfirmationRequest) -> AuthResponse:
        """Solicita a Supabase la creación de una cuenta nueva.

        `async` y `await` permiten que la espera de red no bloquee el servidor.
        La confirmación de contraseña se valida antes y no se envía como un campo
        adicional: Supabase solo necesita la contraseña original.
        """
        response = await self._client.post(
            # Endpoint oficial de Supabase para alta de usuarios.
            f"{self._base_url}/auth/v1/signup",
            headers=self._headers,
            # `data` queda guardado como metadata en el usuario de Supabase Auth.
            json={
                "email": str(payload.email),
                "password": payload.password.get_secret_value(),
                "data": {
                    "first_name": payload.first_name,
                    "last_name": payload.last_name,
                    "rut": payload.rut,
                    "telefono": payload.telefono,
                    "acepto_terminos": payload.acepto_terminos,
                },
            },
        )
        # Centralizamos éxito y errores para que register/login tengan el mismo contrato.
        auth_response = self._parse_response(response, registration=True)
        if not auth_response.user_id:
            raise AuthServiceError("Supabase no devolvió el identificador de la cuenta", status_code=502)

        try:
            await self._persist_registration(payload, auth_response)
        except AuthServiceError:
            await self._delete_auth_user(auth_response.user_id)
            raise

        return auth_response

    async def _persist_registration(
        self,
        payload: PasswordConfirmationRequest,
        auth_response: AuthResponse,
    ) -> None:
        """Guarda el usuario y su perfil después de crear la cuenta Auth."""
        if not self._admin_headers:
            raise AuthServiceError(
                "La API no tiene configurada la clave privada de Supabase",
                status_code=503,
            )

        user_id = auth_response.user_id
        user_response = await self._client.post(
            f"{self._base_url}/rest/v1/usuarios",
            headers={**self._admin_headers, "Prefer": "return=minimal"},
            json={
                "id": user_id,
                "correo_electronico": str(payload.email),
                "estado_cuenta": "pendiente_confirmacion"
                if auth_response.requires_email_confirmation
                else "activo",
            },
        )
        if user_response.is_error:
            raise AuthServiceError(
                self._database_error(user_response, "No fue posible guardar el usuario"),
                409 if user_response.status_code == 409 else 502,
            )

        try:
            profile_response = await self._client.post(
                f"{self._base_url}/rest/v1/perfiles_candidatos",
                headers={**self._admin_headers, "Prefer": "return=minimal"},
                json={
                    "usuario_id": user_id,
                    "rut_identificador": payload.rut,
                    "nombres": payload.first_name,
                    "apellidos": payload.last_name,
                    "telefono_movil": payload.telefono,
                },
            )
            if profile_response.is_error:
                raise AuthServiceError(
                    self._database_error(profile_response, "No fue posible guardar el perfil"),
                    409 if profile_response.status_code == 409 else 502,
                )
        except AuthServiceError:
            await self._delete_database_user(user_id)
            raise

    async def _delete_database_user(self, user_id: str) -> None:
        if not self._admin_headers:
            return
        await self._client.delete(
            f"{self._base_url}/rest/v1/usuarios?id=eq.{user_id}",
            headers=self._admin_headers,
        )

    async def _delete_auth_user(self, user_id: str) -> None:
        if not self._admin_headers:
            return
        await self._client.delete(
            f"{self._base_url}/auth/v1/admin/users/{user_id}",
            headers=self._admin_headers,
        )

    @staticmethod
    def _database_error(response: httpx.Response, fallback: str) -> str:
        try:
            body = response.json()
        except ValueError:
            return fallback
        return str(body.get("message") or body.get("hint") or body.get("details") or fallback)

    async def login(self, payload: LoginRequest) -> AuthResponse:
        """Solicita tokens JWT para un email y contraseña válidos."""
        response = await self._client.post(
            # `grant_type=password` indica a Supabase el flujo de login por contraseña.
            f"{self._base_url}/auth/v1/token?grant_type=password",
            headers=self._headers,
            json={
                "email": str(payload.email),
                "password": payload.password.get_secret_value(),
            },
        )
        auth_response = self._parse_response(response, registration=False)
        if auth_response.user_id and self._admin_headers:
            try:
                await self._sync_login_user(auth_response)
                profile = await self.profile(auth_response.user_id)
                auth_response.first_name = profile.first_name
                auth_response.last_name = profile.last_name
                auth_response.rut = profile.rut
                auth_response.telefono = profile.phone
            except AuthServiceError:
                # Una cuenta Auth antigua puede no tener todavía filas públicas.
                # El login sigue siendo válido y el frontend mostrará metadata de Auth.
                pass
        return auth_response

    async def _sync_login_user(self, auth_response: AuthResponse) -> None:
        """Crea filas públicas para cuentas Auth antiguas que aún no las tienen."""
        if not self._admin_headers or not auth_response.user_id or not auth_response.email:
            return

        user_response = await self._client.post(
            f"{self._base_url}/rest/v1/usuarios",
            headers={
                **self._admin_headers,
                "Prefer": "return=minimal,resolution=ignore-duplicates",
            },
            json={
                "id": auth_response.user_id,
                "correo_electronico": str(auth_response.email),
                "estado_cuenta": "activo",
            },
        )
        if user_response.is_error:
            return

        if not auth_response.rut or not auth_response.first_name:
            return

        profile_response = await self._client.post(
            f"{self._base_url}/rest/v1/perfiles_candidatos",
            headers={
                **self._admin_headers,
                "Prefer": "return=minimal,resolution=ignore-duplicates",
            },
            json={
                "usuario_id": auth_response.user_id,
                "rut_identificador": auth_response.rut,
                "nombres": auth_response.first_name,
                "apellidos": auth_response.last_name or "Usuario",
                "telefono_movil": auth_response.telefono,
            },
        )
        if profile_response.is_error:
            return

    async def current_user(self, access_token: str) -> CurrentUserResponse:
        """Obtiene el usuario asociado a un JWT vigente de Supabase Auth.

        La ruta `/auth/v1/user` requiere el JWT en `Authorization` y la clave
        pública del proyecto en `apikey`. Supabase devuelve la metadata enviada
        durante el registro, por lo que la API puede entregar el mismo contrato
        de identidad después de recargar el navegador.
        """
        response = await self._client.get(
            f"{self._base_url}/auth/v1/user",
            headers={**self._headers, "Authorization": f"Bearer {access_token}"},
        )
        if response.is_error:
            # No devolvemos el cuerpo completo del proveedor: solo un mensaje
            # controlado y el status que la capa HTTP expondrá al frontend.
            detail: Any = response.json().get("msg", "Sesión inválida o expirada")
            raise AuthServiceError(str(detail), response.status_code)

        data = response.json()
        # La metadata es opcional; el usuario puede existir aunque provenga de
        # una cuenta antigua que todavía no tenga RUT o teléfono guardados.
        metadata = data.get("user_metadata") or {}
        current_user = CurrentUserResponse(
            user_id=data["id"],
            email=data["email"],
            first_name=metadata.get("first_name"),
            last_name=metadata.get("last_name"),
            rut=metadata.get("rut"),
            telefono=metadata.get("telefono"),
            email_confirmed_at=data.get("email_confirmed_at"),
        )
        if self._admin_headers:
            try:
                profile = await self.profile(current_user.user_id)
                current_user.first_name = profile.first_name
                current_user.last_name = profile.last_name
                current_user.rut = profile.rut
                current_user.telefono = profile.phone
            except AuthServiceError:
                pass
        return current_user

    async def profile(self, user_id: str) -> ProfileResponse:
        """Lee los datos persistidos del usuario autenticado."""
        self._require_admin_headers()
        user_rows = await self._rest_get(
            "usuarios",
            {"select": "id,correo_electronico,estado_cuenta", "id": f"eq.{user_id}"},
        )
        profile_rows = await self._rest_get(
            "perfiles_candidatos",
            {
                "select": "id,rut_identificador,nombres,apellidos,telefono_movil,expectativa_salarial_liquida",
                "usuario_id": f"eq.{user_id}",
            },
        )
        if not user_rows or not profile_rows:
            raise AuthServiceError("Perfil no encontrado en la base de datos", status_code=404)

        profile_id = profile_rows[0]["id"]
        education_rows = await self._rest_get(
            "formacion_academica",
            {
                "select": "id,institucion,grado_obtenido,anio_ingreso,anio_egreso",
                "perfil_id": f"eq.{profile_id}" if profile_id else "eq.null",
            },
        )
        experience_rows = await self._rest_get(
            "trayectoria_laboral",
            {
                "select": "id,empresa,titulo_cargo,descripcion_logros,fecha_ingreso,fecha_salida,es_trabajo_actual",
                "perfil_id": f"eq.{profile_id}" if profile_id else "eq.null",
            },
        )
        skill_rows = await self._rest_get(
            "competencias_tecnicas",
            {
                "select": "nombre_habilidad",
                "perfil_id": f"eq.{profile_id}" if profile_id else "eq.null",
            },
        )
        user = user_rows[0]
        profile = profile_rows[0]
        return ProfileResponse(
            user_id=user["id"],
            email=user["correo_electronico"],
            account_status=user.get("estado_cuenta", "activo"),
            rut=profile["rut_identificador"],
            first_name=profile["nombres"],
            last_name=profile["apellidos"],
            phone=profile.get("telefono_movil"),
            education=[
                {
                    "id": row["id"],
                    "institution": row["institucion"],
                    "degree": row["grado_obtenido"],
                    "startDate": str(row["anio_ingreso"]),
                    "endDate": str(row["anio_egreso"]) if row.get("anio_egreso") else "Presente",
                    "tags": [],
                }
                for row in education_rows
            ],
            experience=[
                {
                    "id": row["id"],
                    "role": row["titulo_cargo"],
                    "company": row["empresa"],
                    "startDate": row["fecha_ingreso"],
                    "endDate": row["fecha_salida"] or "Presente",
                    "isCurrent": row.get("es_trabajo_actual", False),
                    "description": row.get("descripcion_logros") or "",
                    "stackTags": [],
                }
                for row in experience_rows
            ],
            skills=[row["nombre_habilidad"] for row in skill_rows],
            salary_min=profile.get("expectativa_salarial_liquida"),
            salary_max=None,
        )

    async def postulaciones(self, user_id: str) -> list[PostulacionResponse]:
        """Lee las postulaciones del usuario y sus porcentajes ATS asociados."""
        self._require_admin_headers()
        rows = await self._rest_get(
            "tablero_postulaciones",
            {
                "select": "id,empresa_objetivo,titulo_vacante,estado_fase,fecha_creacion",
                "usuario_id": f"eq.{user_id}",
                "order": "fecha_creacion.desc",
            },
        )
        if not rows:
            return []

        ids = ",".join(row["id"] for row in rows)
        evaluations = await self._rest_get(
            "evaluaciones_ia_ats",
            {
                "select": "postulacion_id,porcentaje_compatibilidad",
                "postulacion_id": f"in.({ids})",
            },
        )
        compatibility = {
            row["postulacion_id"]: float(row.get("porcentaje_compatibilidad") or 0)
            for row in evaluations
        }
        return [
            PostulacionResponse(
                id=row["id"],
                empresa={"id": row["empresa_objetivo"], "nombre": row["empresa_objetivo"]},
                cargo=row["titulo_vacante"],
                ubicacion="",
                compatibilidad=compatibility.get(row["id"], 0),
                status=self._to_frontend_status(row.get("estado_fase")),
                fechaPostulacion=row["fecha_creacion"],
            )
            for row in rows
        ]

    async def update_postulacion_status(self, user_id: str, postulacion_id: str, status: str) -> None:
        """Actualiza un estado solo si la postulación pertenece al usuario."""
        self._require_admin_headers()
        response = await self._client.patch(
            f"{self._base_url}/rest/v1/tablero_postulaciones",
            headers={**self._admin_headers, "Prefer": "return=minimal"},
            params={"id": f"eq.{postulacion_id}", "usuario_id": f"eq.{user_id}"},
            json={"estado_fase": status},
        )
        if response.is_error:
            raise AuthServiceError(self._database_error(response, "No fue posible actualizar la postulación"), 502)

    async def delete_postulacion(self, user_id: str, postulacion_id: str) -> None:
        """Elimina una postulación solo si pertenece al usuario autenticado."""
        self._require_admin_headers()
        response = await self._client.delete(
            f"{self._base_url}/rest/v1/tablero_postulaciones",
            headers=self._admin_headers,
            params={"id": f"eq.{postulacion_id}", "usuario_id": f"eq.{user_id}"},
        )
        if response.is_error:
            raise AuthServiceError(self._database_error(response, "No fue posible eliminar la postulación"), 502)

    def _require_admin_headers(self) -> None:
        if not self._admin_headers:
            raise AuthServiceError("La API no tiene configurada la clave privada de Supabase", 503)

    async def _rest_get(self, table: str, params: dict[str, str]) -> list[dict[str, Any]]:
        self._require_admin_headers()
        response = await self._client.get(
            f"{self._base_url}/rest/v1/{table}",
            headers=self._admin_headers,
            params=params,
        )
        if response.is_error:
            raise AuthServiceError(self._database_error(response, f"No fue posible consultar {table}"), 502)
        return response.json()

    @staticmethod
    def _to_frontend_status(status: str | None) -> str:
        return {
            "Pendiente": "postulada",
            "postulada": "postulada",
            "cv-en-revision": "cv-en-revision",
            "entrevista-agendada": "entrevista-agendada",
            "oferta-negociacion": "oferta-negociacion",
        }.get(status or "", "postulada")

    @staticmethod
    def _parse_response(response: httpx.Response, registration: bool) -> AuthResponse:
        """Convierte la respuesta de Supabase al esquema público de nuestra API.

        Si el proveedor responde 4xx/5xx, `is_error` es verdadero y levantamos
        `AuthServiceError`. La capa de rutas captura esa excepción y la convierte
        en una respuesta HTTP controlada. El `raise` evita continuar procesando
        un JSON que representa un fallo.
        """
        if response.is_error:
            # Supabase suele entregar el detalle en `msg`; el valor alternativo cubre
            # respuestas de error con otra estructura.
            detail: Any = response.json().get("msg", "Error de autenticación")
            if registration and "already registered" in str(detail).lower():
                raise AuthServiceError("El correo electrónico ya está registrado", status_code=409)
            raise AuthServiceError(str(detail), response.status_code)

        # En un caso exitoso extraemos solamente los campos que nuestra API necesita.
        data = response.json()
        # Un registro pendiente de confirmación puede no incluir objeto `user` completo.
        user = data.get("user") or {}
        # Supabase guarda los nombres enviados en registro dentro de `user_metadata`.
        metadata = user.get("user_metadata") or {}
        return AuthResponse(
            access_token=data.get("access_token"),
            refresh_token=data.get("refresh_token"),
            expires_in=data.get("expires_in"),
            user_id=user.get("id"),
            email=user.get("email"),
            first_name=metadata.get("first_name"),
            last_name=metadata.get("last_name"),
            rut=metadata.get("rut"),
            telefono=metadata.get("telefono"),
            requires_email_confirmation=registration and not data.get("access_token"),
        )

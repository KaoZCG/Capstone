# `Any` describe el contenido dinámico del JSON de error recibido del proveedor.
from typing import Any
import base64
import json
import unicodedata
from uuid import uuid4
import re
from datetime import datetime, timezone

# Cliente HTTP asíncrono y respuesta tipada de la comunicación con Supabase.
import httpx

# Configuración con URL y clave pública del proyecto Supabase.
from app.core.config import Settings
# Esquemas de entrada y salida que mantienen un contrato estable para el frontend.
from app.schemas.auth import AuthResponse, CurrentUserResponse, LoginRequest, PasswordConfirmationRequest
from app.schemas.data import (
    OfertaLaborumInput,
    OfertaLaborumResponse,
    PerfilMaestroSyncRequest,
    PostulacionCreateRequest,
    PostulacionResponse,
    ProfileResponse,
)


_EXPERIENCE_STACK_TAGS_MARKER = re.compile(
    r"\n?<!--altoquecv-stack-tags:v1:([A-Za-z0-9_-]+)-->\s*$"
)


def _normalize_stack_tags(value: Any) -> list[str]:
    values = value.split(",") if isinstance(value, str) else value
    if not isinstance(values, list):
        return []
    return list(dict.fromkeys(
        tag.strip() for tag in values
        if isinstance(tag, str) and tag.strip()
    ))


def _split_experience_stack_tags(value: Any) -> tuple[str, list[str]]:
    description = str(value or "")
    match = _EXPERIENCE_STACK_TAGS_MARKER.search(description)
    if not match:
        return description, []

    try:
        encoded = match.group(1)
        encoded += "=" * (-len(encoded) % 4)
        tags = json.loads(base64.urlsafe_b64decode(encoded).decode("utf-8"))
    except (ValueError, UnicodeDecodeError, json.JSONDecodeError):
        return description, []

    return description[:match.start()].rstrip(), _normalize_stack_tags(tags)


def _join_experience_stack_tags(description: Any, stack_tags: Any) -> str:
    clean_description, _ = _split_experience_stack_tags(description)
    tags = _normalize_stack_tags(stack_tags)
    if not tags:
        return clean_description

    encoded = base64.urlsafe_b64encode(
        json.dumps(tags, ensure_ascii=False).encode("utf-8")
    ).decode("ascii").rstrip("=")
    marker = f"<!--altoquecv-stack-tags:v1:{encoded}-->"
    return f"{clean_description.rstrip()}\n\n{marker}" if clean_description.strip() else marker


_MATCH_STOPWORDS = {
    "para", "desde", "sobre", "entre", "hasta", "como", "donde", "cuando", "quien",
    "con", "sin", "una", "uno", "unas", "unos", "las", "los", "del", "por", "que",
    "esta", "este", "estas", "estos", "ser", "estar", "tener", "haber", "experiencia",
    "conocimiento", "deseable", "requisito", "requisitos", "trabajo", "cargo", "empresa",
    "de", "el", "la", "y", "o", "en", "al", "se", "un", "a", "e", "su", "sus",
}


def _normalize_match_text(value: Any) -> str:
    text = unicodedata.normalize("NFKD", str(value or "")).encode("ascii", "ignore").decode("ascii")
    return " ".join(re.findall(r"[a-z0-9+#.]+", text.lower()))


def _profile_term_coverage(values: list[str], offer_text: str) -> int:
    terms = {
        token
        for value in values
        for token in _normalize_match_text(value).split()
        if len(token) > 1 and token not in _MATCH_STOPWORDS and not token.isdigit()
    }
    if not terms:
        return 0
    offer_terms = set(offer_text.split())
    return round(len(terms & offer_terms) / len(terms) * 100)


def _match_laborum_offer(offer: dict[str, Any], profile: ProfileResponse | None) -> dict[str, Any]:
    offer_text = _normalize_match_text(f"{offer.get('titulo', '')} {offer.get('notas_usuario', '')}")
    padded_offer_text = f" {offer_text} "
    skills = list(dict.fromkeys(skill.strip() for skill in (profile.skills if profile else []) if skill.strip()))
    matched_skills = [
        skill for skill in skills
        if (normalized_skill := _normalize_match_text(skill)) and f" {normalized_skill} " in padded_offer_text
    ]
    skill_score = round(len(matched_skills) / len(skills) * 100) if skills else 0

    experience_values = [
        str(value)
        for experience in (profile.experience if profile else [])
        for value in [experience.get("role", ""), *(experience.get("stackTags", []) or [])]
        if value
    ]
    education_values = [
        str(education.get("degree", ""))
        for education in (profile.education if profile else [])
        if education.get("degree")
    ]
    experience_score = _profile_term_coverage(experience_values, offer_text)
    education_score = _profile_term_coverage(education_values, offer_text)

    dimensions: list[tuple[int, int]] = []
    if skills:
        dimensions.append((skill_score, 70))
    if experience_values:
        dimensions.append((experience_score, 20))
    if education_values:
        dimensions.append((education_score, 10))
    compatibility = round(sum(score * weight for score, weight in dimensions) / sum(weight for _, weight in dimensions)) if dimensions else 0

    return {
        "compatibilidad": compatibility,
        "habilidades_coincidentes": matched_skills,
        "habilidades_totales": len(skills),
        "skills_match": skill_score,
        "experiencia_match": experience_score,
        "formacion_match": education_score,
    }


def _profile_experience_from_row(row: dict[str, Any]) -> dict[str, Any]:
    description, stack_tags = _split_experience_stack_tags(row.get("descripcion_logros"))
    return {
        "id": row["id"],
        "role": row["titulo_cargo"],
        "company": row["empresa"],
        "startDate": row["fecha_ingreso"],
        "endDate": row["fecha_salida"] or "Presente",
        "isCurrent": row.get("es_trabajo_actual", False),
        "description": description,
        "stackTags": stack_tags,
    }


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
        self._frontend_url = str(settings.frontend_url).rstrip("/")

    async def request_password_recovery(self, email: str) -> None:
        """Pide a Supabase enviar el enlace al correo registrado.

        El proveedor sólo enviará el correo si encuentra una cuenta asociada;
        la API devuelve el mismo mensaje para correos existentes y desconocidos.
        """
        response = await self._client.post(
            f"{self._base_url}/auth/v1/recover",
            headers=self._headers,
            params={"redirect_to": f"{self._frontend_url}/restablecer-contrasena"},
            json={"email": email},
        )
        if response.status_code == 429:
            raise AuthServiceError("Se alcanzó el límite de solicitudes. Espera antes de intentarlo otra vez.", 429)
        if response.is_error:
            raise AuthServiceError("No fue posible solicitar el cambio de contraseña. Intenta más tarde.", 502)

    async def reset_password(self, access_token: str, password: str) -> None:
        """Actualiza la clave del usuario usando el token temporal del correo."""
        response = await self._client.put(
            f"{self._base_url}/auth/v1/user",
            headers={**self._headers, "Authorization": f"Bearer {access_token}"},
            json={"password": password},
        )
        if response.status_code in (401, 403):
            raise AuthServiceError("El enlace expiró o ya no es válido. Solicita uno nuevo.", 401)
        if response.status_code == 429:
            raise AuthServiceError("Se alcanzó el límite de intentos. Espera antes de volver a probar.", 429)
        if response.is_error:
            raise AuthServiceError("No se pudo actualizar la contraseña. Solicita un enlace nuevo.", 502)

    async def resend_confirmation(self, email: str) -> None:
        """Reenvía el correo de confirmación sin revelar el estado de la cuenta."""
        response = await self._client.post(
            f"{self._base_url}/auth/v1/resend",
            headers=self._headers,
            params={"redirect_to": f"{self._frontend_url}/login?verified=1"},
            json={"type": "signup", "email": email},
        )
        if response.status_code == 429:
            raise AuthServiceError("Se alcanzó el límite de solicitudes. Espera antes de intentarlo otra vez.", 429)
        if response.is_error:
            raise AuthServiceError("No fue posible reenviar el correo. Intenta más tarde.", 502)

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
            params={"redirect_to": f"{self._frontend_url}/login?verified=1"},
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
        try:
            auth_response = self._parse_response(response, registration=False)
        except AuthServiceError as error:
            if "confirm" in str(error).lower() or "verif" in str(error).lower():
                raise AuthServiceError("Correo no verificado", status_code=403) from error
            raise AuthServiceError("Correo o contraseña incorrectos", status_code=401) from error

        if not auth_response.access_token or not auth_response.user_id:
            raise AuthServiceError("Correo o contraseña incorrectos", status_code=401)

        self._require_admin_headers()
        await self._sync_login_user(auth_response)
        await self._ensure_active_account(auth_response.user_id)
        try:
            profile = await self.profile(auth_response.user_id)
            auth_response.first_name = profile.first_name
            auth_response.last_name = profile.last_name
            auth_response.rut = profile.rut
            auth_response.telefono = profile.phone
        except AuthServiceError:
            # El perfil extendido es opcional para completar la respuesta de login.
            pass
        return auth_response

    async def _ensure_active_account(self, user_id: str) -> None:
        """Exige que exista una cuenta pública activa además del usuario Auth."""
        rows = await self._rest_get(
            "usuarios",
            {"select": "estado_cuenta", "id": f"eq.{user_id}"},
        )
        if not rows or rows[0].get("estado_cuenta") != "activo":
            raise AuthServiceError("La cuenta no está activa", status_code=403)

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

    async def sync_profile(self, user_id: str, payload: PerfilMaestroSyncRequest) -> None:
        """Persiste el Perfil Maestro únicamente dentro del perfil autenticado."""
        self._require_admin_headers()
        profile_rows = await self._rest_get(
            "perfiles_candidatos",
            {"select": "id", "usuario_id": f"eq.{user_id}"},
        )
        if not profile_rows:
            raise AuthServiceError("Perfil del usuario no encontrado", status_code=404)
        profile_id = str(profile_rows[0]["id"])

        personal = payload.personalData
        full_name = str(personal.get("nombre") or "").strip()
        name_parts = full_name.split()
        profile_update: dict[str, Any] = {}
        if name_parts:
            profile_update["nombres"] = name_parts[0]
            profile_update["apellidos"] = " ".join(name_parts[1:]) or "Usuario"
        if personal.get("rut"):
            profile_update["rut_identificador"] = personal["rut"]
        if "teléfono" in personal:
            profile_update["telefono_movil"] = personal["teléfono"] or None
        if "min" in payload.salaryData:
            salary = payload.salaryData["min"]
            if salary in (None, ""):
                profile_update["expectativa_salarial_liquida"] = None
            else:
                try:
                    profile_update["expectativa_salarial_liquida"] = float(salary)
                except (TypeError, ValueError):
                    pass

        if profile_update:
            response = await self._client.patch(
                f"{self._base_url}/rest/v1/perfiles_candidatos",
                headers={**self._admin_headers, "Prefer": "return=minimal"},
                params={"usuario_id": f"eq.{user_id}"},
                json=profile_update,
            )
            if response.is_error:
                raise AuthServiceError(self._database_error(response, "No fue posible guardar los datos personales"), 502)

        education = []
        for item in payload.education:
            institution = str(item.get("institution") or item.get("institucion") or "").strip()
            degree = str(item.get("degree") or item.get("titulo") or "").strip()
            if not institution and not degree:
                continue
            education.append({
                "institution": institution,
                "degree": degree,
                "startDate": item.get("startDate") or item.get("fecha_inicio"),
                "endDate": item.get("endDate") or item.get("fecha_fin"),
            })
        await self._replace_profile_rows("formacion_academica", profile_id, education)

        experience = []
        for item in payload.experience:
            company = str(item.get("company") or item.get("empresa") or "").strip()
            role = str(item.get("role") or item.get("cargo") or "").strip()
            if not company and not role:
                continue
            experience.append({
                "company": company,
                "role": role,
                "startDate": item.get("startDate") or item.get("fecha_inicio"),
                "endDate": item.get("endDate") or item.get("fecha_fin"),
                "isCurrent": item.get("isCurrent") or item.get("actual") or False,
                "description": item.get("description") or item.get("descripcion") or item.get("responsabilidades") or "",
                "stackTags": item.get("stackTags") or item.get("habilidades") or item.get("technologies") or [],
            })
        await self._replace_profile_rows("trayectoria_laboral", profile_id, experience)

        existing_skills = await self._rest_get(
            "competencias_tecnicas",
            {"select": "nombre_habilidad", "perfil_id": f"eq.{profile_id}"},
        )
        existing_names = {str(row.get("nombre_habilidad", "")).strip() for row in existing_skills}
        requested_names = {skill.strip() for skill in payload.skills if skill.strip()}
        removed_names = existing_names - requested_names
        added_names = requested_names - existing_names
        if removed_names:
            await self._delete_profile_rows(
                "competencias_tecnicas",
                {"perfil_id": f"eq.{profile_id}", "nombre_habilidad": f"in.({','.join(removed_names)})"},
            )
        if added_names:
            response = await self._client.post(
                f"{self._base_url}/rest/v1/competencias_tecnicas",
                headers={**self._admin_headers, "Prefer": "return=minimal"},
                json=[{"perfil_id": profile_id, "nombre_habilidad": skill} for skill in sorted(added_names)],
            )
            if response.is_error:
                raise AuthServiceError(self._database_error(response, "No fue posible guardar las habilidades"), 502)

    async def _replace_profile_rows(self, table: str, profile_id: str, items: list[dict[str, Any]]) -> None:
        current_rows = await self._rest_get(
            table,
            {"select": "id", "perfil_id": f"eq.{profile_id}"},
        )
        current_ids = {str(row["id"]) for row in current_rows if row.get("id")}
        rows: list[dict[str, Any]] = []
        for item in items:
            supplied_id = str(item.get("id", ""))
            row_id = supplied_id if supplied_id in current_ids else str(uuid4())
            if table == "formacion_academica":
                rows.append({
                    "id": row_id,
                    "perfil_id": profile_id,
                    "institucion": item["institution"],
                    "grado_obtenido": item["degree"],
                    "anio_ingreso": self._year(item["startDate"]),
                    "anio_egreso": self._year(item["endDate"]),
                })
            else:
                is_current = bool(item["isCurrent"]) or str(item["endDate"] or "").lower() in {"presente", "actualidad"}
                rows.append({
                    "id": row_id,
                    "perfil_id": profile_id,
                    "empresa": item["company"],
                    "titulo_cargo": item["role"],
                    "descripcion_logros": _join_experience_stack_tags(
                        item["description"], item.get("stackTags")
                    ),
                    "fecha_ingreso": self._date(item["startDate"]),
                    "fecha_salida": None if is_current else self._date(item["endDate"]),
                    "es_trabajo_actual": is_current,
                })

        if rows:
            response = await self._client.post(
                f"{self._base_url}/rest/v1/{table}",
                headers={**self._admin_headers, "Prefer": "resolution=merge-duplicates,return=minimal"},
                params={"on_conflict": "id"},
                json=rows,
            )
            if response.is_error:
                raise AuthServiceError(self._database_error(response, f"No fue posible guardar {table}"), 502)

        retained_ids = {str(row["id"]) for row in rows}
        stale_ids = current_ids - retained_ids
        if stale_ids:
            await self._delete_profile_rows(table, {
                "perfil_id": f"eq.{profile_id}",
                "id": f"in.({','.join(stale_ids)})",
            })

    async def _delete_profile_rows(self, table: str, params: dict[str, str]) -> None:
        response = await self._client.delete(
            f"{self._base_url}/rest/v1/{table}",
            headers=self._admin_headers,
            params=params,
        )
        if response.is_error:
            raise AuthServiceError(self._database_error(response, f"No fue posible actualizar {table}"), 502)

    @staticmethod
    def _year(value: Any) -> int | None:
        if value in (None, "") or str(value).strip().lower() in {"presente", "actualidad"}:
            return None
        match = re.search(r"\b(19|20)\d{2}\b", str(value))
        return int(match.group(0)) if match else None

    @staticmethod
    def _date(value: Any) -> str | None:
        if value in (None, "") or str(value).strip().lower() in {"presente", "actualidad"}:
            return None
        normalized = str(value).strip()
        iso_match = re.search(r"\b((?:19|20)\d{2})-(\d{1,2})(?:-(\d{1,2}))?\b", normalized)
        if iso_match:
            year, month, day = iso_match.groups()
            return f"{year}-{int(month):02d}-{int(day or 1):02d}"
        months = {
            "enero": 1, "ene": 1, "febrero": 2, "feb": 2, "marzo": 3, "mar": 3,
            "abril": 4, "abr": 4, "mayo": 5, "may": 5, "junio": 6, "jun": 6,
            "julio": 7, "jul": 7, "agosto": 8, "ago": 8, "septiembre": 9, "setiembre": 9,
            "sep": 9, "set": 9, "octubre": 10, "oct": 10, "noviembre": 11, "nov": 11,
            "diciembre": 12, "dic": 12,
        }
        month_match = re.search(r"([A-Za-zÁÉÍÓÚáéíóú.]+)\s+(?:de\s+)?((?:19|20)\d{2})", normalized)
        if month_match:
            month_name = month_match.group(1).lower().rstrip(".")
            if month_name in months:
                return f"{month_match.group(2)}-{months[month_name]:02d}-01"
        year = SupabaseAuthService._year(normalized)
        return f"{year}-01-01" if year else None

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
            experience=[_profile_experience_from_row(row) for row in experience_rows],
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
                "select": "id,empresa_objetivo,titulo_vacante,estado_fase,fecha_creacion,url_oferta",
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
                url_oferta=row.get("url_oferta"),
            )
            for row in rows
        ]

    async def create_postulacion(self, user_id: str, payload: PostulacionCreateRequest) -> PostulacionResponse:
        """Registra la postulación confirmada por el usuario, limitada a su propia cuenta."""
        self._require_admin_headers()
        url = payload.url_oferta
        params = {
            "select": "id,empresa_objetivo,titulo_vacante,estado_fase,fecha_creacion,url_oferta",
            "usuario_id": f"eq.{user_id}",
            "url_oferta": f"eq.{url}",
            "limit": "1",
        }
        rows = await self._rest_get("tablero_postulaciones", params)
        saved = rows[0] if rows else None

        if saved is None:
            now = datetime.now(timezone.utc).isoformat()
            response = await self._client.post(
                f"{self._base_url}/rest/v1/tablero_postulaciones",
                headers={**self._admin_headers, "Prefer": "resolution=ignore-duplicates,return=representation"},
                params={"on_conflict": "usuario_id,url_oferta"},
                json=[{
                    "usuario_id": user_id,
                    "empresa_objetivo": payload.empresa,
                    "titulo_vacante": payload.cargo,
                    "estado_fase": "Pendiente",
                    "fecha_creacion": now,
                    "url_oferta": url,
                }],
            )
            if response.is_error:
                raise AuthServiceError(self._database_error(response, "No fue posible registrar la postulación"), 502)
            inserted = response.json()
            saved = inserted[0] if inserted else None

        if saved is None:
            # Another request may have inserted the same offer concurrently.
            rows = await self._rest_get("tablero_postulaciones", params)
            saved = rows[0] if rows else None
        if saved is None:
            raise AuthServiceError("No fue posible confirmar el registro de la postulación", 502)

        return PostulacionResponse(
            id=saved["id"],
            empresa={"id": saved["empresa_objetivo"], "nombre": saved["empresa_objetivo"]},
            cargo=saved["titulo_vacante"],
            ubicacion="",
            compatibilidad=0,
            status=self._to_frontend_status(saved.get("estado_fase")),
            fechaPostulacion=saved["fecha_creacion"],
            url_oferta=saved.get("url_oferta"),
        )

    async def save_laborum_offers(self, user_id: str, offers: list[OfertaLaborumInput]) -> int:
        """Guarda datos de ofertas de Laborum ingresados manualmente por el usuario."""
        self._require_admin_headers()
        now = datetime.now(timezone.utc).isoformat()
        rows_by_url: dict[str, dict[str, Any]] = {}
        for offer in offers:
            row = offer.model_dump()
            rows_by_url[row["url"]] = {
                "usuario_id": user_id,
                **row,
                "origen_ingreso": "manual",
                "ultima_vista": now,
            }

        response = await self._client.post(
            f"{self._base_url}/rest/v1/ofertas_laborum",
            headers={**self._admin_headers, "Prefer": "resolution=merge-duplicates,return=minimal"},
            params={"on_conflict": "usuario_id,url"},
            json=list(rows_by_url.values()),
        )
        if response.is_error:
            raise AuthServiceError(self._database_error(response, "No fue posible guardar las ofertas de Laborum"), 502)
        return len(rows_by_url)

    async def laborum_offers(self, user_id: str) -> list[OfertaLaborumResponse]:
        """Lee ofertas ingresadas manualmente y calcula compatibilidad con el perfil actual."""
        rows = await self._rest_get(
            "ofertas_laborum",
            {
                "select": "id,titulo,empresa,ubicacion,url,notas_usuario,fecha_captura",
                "usuario_id": f"eq.{user_id}",
                "origen_ingreso": "eq.manual",
                "order": "ultima_vista.desc",
                "limit": "300",
            },
        )
        if not rows:
            return []

        try:
            profile = await self.profile(user_id)
        except AuthServiceError as error:
            if error.status_code != 404:
                raise
            profile = None

        return [
            OfertaLaborumResponse(**row, **_match_laborum_offer(row, profile))
            for row in rows
        ]

    async def delete_laborum_offer(self, user_id: str, offer_id: str) -> None:
        """Elimina una oferta guardada solo si pertenece al usuario autenticado."""
        self._require_admin_headers()
        response = await self._client.delete(
            f"{self._base_url}/rest/v1/ofertas_laborum",
            headers=self._admin_headers,
            params={"id": f"eq.{offer_id}", "usuario_id": f"eq.{user_id}"},
        )
        if response.is_error:
            raise AuthServiceError(self._database_error(response, "No fue posible eliminar la oferta"), 502)

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

# `TestClient` permite probar endpoints FastAPI de forma síncrona sin levantar
# un servidor real; internamente ejecuta la aplicación ASGI en memoria.
import pytest
import httpx
from fastapi.testclient import TestClient

# Importamos la misma instancia que utiliza Uvicorn para probar rutas reales.
from app.main import app
from app.api import get_auth_service
from app.core.config import Settings
from app.services.supabase_auth import AuthServiceError, SupabaseAuthService
from pydantic import ValidationError

from app.schemas.auth import AuthResponse, CurrentUserResponse, PasswordConfirmationRequest


# Cliente reutilizable para las pruebas HTTP locales.
client = TestClient(app)


def test_health() -> None:
    """Comprueba que el endpoint de salud responde con HTTP 200 y JSON esperado."""
    response = client.get("/health")

    # Verificamos tanto el código HTTP como el cuerpo para detectar fallos de ruta
    # y también cambios accidentales en el contrato de respuesta.
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_register_rejects_mismatched_passwords() -> None:
    """Comprueba que Pydantic rechaza contraseñas de registro diferentes."""
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": "persona@example.com",
            "password": "Password123",
            "password_confirmation": "Different123",
            "first_name": "Ana",
            "last_name": "Pérez",
        },
    )

    # HTTP 422 significa que el cuerpo tiene una estructura o regla de validación
    # inválida; FastAPI genera esta respuesta antes de llamar a Supabase.
    assert response.status_code == 422


def test_register_accepts_frontend_signup_shape() -> None:
    """Acepta el payload del formulario actual del frontend (nombre, rut y teléfono)."""
    payload = PasswordConfirmationRequest(
        email="frontend@example.com",
        password="Password123",
        password_confirmation="Password123",
        nombre="Ana Pérez",
        rut="12.345.678-5",
        telefono="+56912345678",
        acepto_terminos=True,
    )

    assert payload.nombre == "Ana Pérez"
    assert payload.rut == "12.345.678-5"
    assert payload.telefono == "+56912345678"
    assert payload.acepto_terminos is True


def test_current_user_requires_bearer_token() -> None:
    """Rechaza la consulta de sesión cuando el cliente no envía credenciales."""
    response = client.get("/api/v1/auth/me")

    assert response.status_code == 401
    assert response.json() == {"detail": "Token requerido"}


def test_login_returns_401_for_invalid_credentials() -> None:
    """Normaliza un fallo del proveedor al contrato de la HU de login."""
    class InvalidCredentialsService:
        async def login(self, payload: object) -> None:
            raise AuthServiceError("invalid login", status_code=401)

    async def override_auth_service():
        yield InvalidCredentialsService()

    app.dependency_overrides[get_auth_service] = override_auth_service
    try:
        response = client.post(
            "/api/v1/auth/login",
            json={"email": "persona@example.com", "password": "Wrong123"},
        )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 401
    assert response.json() == {"detail": "Correo o contraseña incorrectos"}


def test_login_rejects_empty_fields() -> None:
    """No permite enviar al servicio un correo o contraseña vacíos."""
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "", "password": ""},
    )

    assert response.status_code == 422


def test_login_rejects_sql_injection_like_email() -> None:
    """Rechaza un email con sintaxis SQL antes de llamar al proveedor de auth."""
    response = client.post(
        "/api/v1/auth/login",
        json={
            "email": "admin' OR 1=1 --@example.com",
            "password": "cualquier-password",
        },
    )

    # EmailStr valida el formato como dato, no como fragmento de una consulta.
    assert response.status_code == 422


@pytest.mark.parametrize("email", ["registered@example.com", "unknown@example.com"])
def test_password_recovery_uses_same_response_for_any_email(email: str) -> None:
    """La solicitud de recovery no confirma si el correo está asociado a una cuenta."""
    received_emails: list[str] = []

    class RecoveryService:
        async def request_password_recovery(self, requested_email: str) -> None:
            received_emails.append(requested_email)

    async def override_auth_service():
        yield RecoveryService()

    app.dependency_overrides[get_auth_service] = override_auth_service
    try:
        response = client.post("/api/v1/auth/password-recovery", json={"email": email})
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 202
    assert response.json() == {
        "success": True,
        "message": "Si existe una cuenta asociada a ese correo, recibirás un enlace para cambiar tu contraseña.",
    }
    assert received_emails == [email]


def test_password_recovery_rejects_invalid_email() -> None:
    """Valida el email antes de intentar enviar una solicitud a Supabase."""
    response = client.post("/api/v1/auth/password-recovery", json={"email": "not-an-email"})

    assert response.status_code == 422


def test_password_reset_requires_recovery_token() -> None:
    """No permite cambiar la contraseña sin el token temporal del correo."""
    response = client.post(
        "/api/v1/auth/reset-password",
        json={"password": "NewPassword123", "password_confirmation": "NewPassword123"},
    )

    assert response.status_code == 401
    assert response.json() == {"detail": "Token requerido"}


def test_password_reset_rejects_mismatched_passwords() -> None:
    """Rechaza contraseñas distintas antes de llamar al servicio de auth."""
    response = client.post(
        "/api/v1/auth/reset-password",
        headers={"Authorization": "Bearer fake-token"},
        json={"password": "NewPassword123", "password_confirmation": "OtherPassword123"},
    )

    assert response.status_code == 422


def test_password_reset_rejects_expired_recovery_token() -> None:
    """Expone un error controlado cuando Supabase rechaza el token temporal."""
    class ExpiredTokenService:
        async def current_user(self, access_token: str) -> None:
            raise AuthServiceError("Sesión inválida o expirada", 401)

    async def override_auth_service():
        yield ExpiredTokenService()

    app.dependency_overrides[get_auth_service] = override_auth_service
    try:
        response = client.post(
            "/api/v1/auth/reset-password",
            headers={"Authorization": "Bearer expired-token"},
            json={"password": "NewPassword123", "password_confirmation": "NewPassword123"},
        )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 401
    assert response.json() == {"detail": "Sesión inválida o expirada"}


@pytest.mark.asyncio
async def test_password_recovery_targets_email_and_reset_page() -> None:
    """El correo y la URL de retorno llegan a Supabase sin hacer una petición real."""
    requests: list[httpx.Request] = []

    def mock_supabase(request: httpx.Request) -> httpx.Response:
        requests.append(request)
        return httpx.Response(200, json={}, request=request)

    settings = Settings(
        supabase_url="https://project.supabase.co",
        supabase_anon_key="test-anon-key",
        frontend_url="http://localhost:3000",
    )
    async with httpx.AsyncClient(transport=httpx.MockTransport(mock_supabase)) as http_client:
        service = SupabaseAuthService(settings, http_client)
        await service.request_password_recovery("person@example.com")

    assert len(requests) == 1
    assert requests[0].url.path == "/auth/v1/recover"
    assert requests[0].url.params["redirect_to"] == "http://localhost:3000/restablecer-contrasena"
    assert requests[0].read() == b'{"email":"person@example.com"}'


@pytest.mark.asyncio
async def test_password_reset_sends_new_password_with_recovery_bearer_token() -> None:
    """Envía el token temporal y la nueva clave a Supabase sin hacer llamadas reales."""
    requests: list[httpx.Request] = []

    def mock_supabase(request: httpx.Request) -> httpx.Response:
        requests.append(request)
        return httpx.Response(200, json={"id": "user-id"}, request=request)

    settings = Settings(
        supabase_url="https://project.supabase.co",
        supabase_anon_key="test-anon-key",
        frontend_url="http://localhost:3000",
    )
    async with httpx.AsyncClient(transport=httpx.MockTransport(mock_supabase)) as http_client:
        service = SupabaseAuthService(settings, http_client)
        await service.reset_password("recovery-token", "NewPassword123")

    assert len(requests) == 1
    assert requests[0].method == "PUT"
    assert requests[0].url.path == "/auth/v1/user"
    assert requests[0].headers["Authorization"] == "Bearer recovery-token"
    assert requests[0].read() == b'{"password":"NewPassword123"}'


@pytest.mark.parametrize("message", ["Correo no verificado", "La cuenta no está activa"])
def test_login_returns_403_for_restricted_accounts(message: str) -> None:
    """Diferencia una cuenta pendiente de confirmación de credenciales inválidas."""
    class RestrictedLoginService:
        async def login(self, payload: object) -> None:
            raise AuthServiceError(message, 403)

    async def override_auth_service():
        yield RestrictedLoginService()

    app.dependency_overrides[get_auth_service] = override_auth_service
    try:
        response = client.post(
            "/api/v1/auth/login",
            json={"email": "person@example.com", "password": "Password123"},
        )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 403
    assert response.json() == {"detail": message}


def test_register_returns_409_for_duplicate_email() -> None:
    """Devuelve un conflicto claro si Supabase informa que el correo ya existe."""
    class DuplicateEmailService:
        async def register(self, payload: object) -> None:
            raise AuthServiceError("El correo electrónico ya está registrado", 409)

    async def override_auth_service():
        yield DuplicateEmailService()

    app.dependency_overrides[get_auth_service] = override_auth_service
    try:
        response = client.post(
            "/api/v1/auth/register",
            json={
                "email": "person@example.com",
                "password": "Password123",
                "password_confirmation": "Password123",
                "nombre": "Ana Pérez",
                "rut": "12.345.678-5",
                "telefono": "+56912345678",
                "acepto_terminos": True,
            },
        )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 409
    assert response.json() == {"detail": "El correo electrónico ya está registrado"}


def test_register_returns_confirmation_required_on_success() -> None:
    """Devuelve 201 y el estado de confirmación que el frontend usa para guiar al usuario."""
    class ConfirmationRequiredService:
        async def register(self, payload: object) -> AuthResponse:
            return AuthResponse(
                user_id="test-user-id",
                email="person@example.com",
                requires_email_confirmation=True,
            )

    async def override_auth_service():
        yield ConfirmationRequiredService()

    app.dependency_overrides[get_auth_service] = override_auth_service
    try:
        response = client.post(
            "/api/v1/auth/register",
            json={
                "email": "person@example.com",
                "password": "Password123",
                "password_confirmation": "Password123",
                "nombre": "Ana Pérez",
                "rut": "12.345.678-5",
                "telefono": "+56912345678",
                "acepto_terminos": True,
            },
        )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 201
    assert response.json()["requires_email_confirmation"] is True


def test_password_recovery_returns_rate_limit_from_supabase() -> None:
    """Convierte el límite de Supabase en una respuesta 429 comprensible."""
    class RateLimitedRecoveryService:
        async def request_password_recovery(self, email: str) -> None:
            raise AuthServiceError("Se alcanzó el límite de solicitudes", 429)

    async def override_auth_service():
        yield RateLimitedRecoveryService()

    app.dependency_overrides[get_auth_service] = override_auth_service
    try:
        response = client.post(
            "/api/v1/auth/password-recovery",
            json={"email": "person@example.com"},
        )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 429


def test_password_reset_returns_success_for_valid_recovery_token() -> None:
    """Completa el reset sólo después de validar el bearer token de recuperación."""
    reset_requests: list[tuple[str, str]] = []

    class ValidRecoveryService:
        async def current_user(self, access_token: str) -> CurrentUserResponse:
            return CurrentUserResponse(user_id="test-user-id", email="person@example.com")

        async def reset_password(self, access_token: str, password: str) -> None:
            reset_requests.append((access_token, password))

    async def override_auth_service():
        yield ValidRecoveryService()

    app.dependency_overrides[get_auth_service] = override_auth_service
    try:
        response = client.post(
            "/api/v1/auth/reset-password",
            headers={"Authorization": "Bearer recovery-token"},
            json={"password": "NewPassword123", "password_confirmation": "NewPassword123"},
        )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    assert response.json()["message"] == "La contraseña de person@example.com se actualizó correctamente."
    assert reset_requests == [("recovery-token", "NewPassword123")]


def test_register_accepts_valid_chilean_rut_and_phone() -> None:
    """Acepta un RUT cuyo dígito verificador y teléfono chileno son válidos."""
    payload = PasswordConfirmationRequest(
        email="valid@example.com",
        password="Password123",
        password_confirmation="Password123",
        nombre="Ana Pérez",
        rut="12.345.678-5",
        telefono="+56912345678",
        acepto_terminos=True,
    )

    assert payload.rut == "12.345.678-5"
    assert payload.telefono == "+56912345678"


@pytest.mark.parametrize(
    ("field", "value", "message"),
    [
        ("rut", "12.345.678-9", "RUT inválido"),
        ("telefono", "912345678", "teléfono"),
        ("nombre", "Ana3 Pérez", "nombre"),
        ("password", "password123", "contraseña"),
        ("acepto_terminos", False, "términos"),
    ],
)
def test_register_rejects_invalid_business_field(field: str, value: object, message: str) -> None:
    """Rechaza cada campo de registro que incumple las reglas del negocio."""
    valid_payload = {
        "email": "invalid@example.com",
        "password": "Password123",
        "password_confirmation": "Password123",
        "nombre": "Ana Pérez",
        "rut": "12.345.678-5",
        "telefono": "+56912345678",
        "acepto_terminos": True,
    }
    valid_payload[field] = value

    with pytest.raises(ValidationError, match=message):
        PasswordConfirmationRequest(**valid_payload)

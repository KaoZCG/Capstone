# `TestClient` permite probar endpoints FastAPI de forma síncrona sin levantar
# un servidor real; internamente ejecuta la aplicación ASGI en memoria.
import pytest
from fastapi.testclient import TestClient

# Importamos la misma instancia que utiliza Uvicorn para probar rutas reales.
from app.main import app
from app.api import get_auth_service
from app.services.supabase_auth import AuthServiceError
from pydantic import ValidationError

from app.schemas.auth import PasswordConfirmationRequest


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

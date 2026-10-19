# `TestClient` permite probar endpoints FastAPI de forma síncrona sin levantar
# un servidor real; internamente ejecuta la aplicación ASGI en memoria.
import json

import pytest
import httpx
from fastapi.testclient import TestClient

# Importamos la misma instancia que utiliza Uvicorn para probar rutas reales.
from app import api
from app.main import app
from app.api import extraer_json_seguro, extraer_perfil_local_cv, get_auth_service, obtener_registros_cv
from app.core.config import Settings, get_settings
from app.services.supabase_auth import AuthServiceError, SupabaseAuthService
from pydantic import ValidationError

from app.schemas.auth import AuthResponse, CurrentUserResponse, PasswordConfirmationRequest
from app.schemas.data import PerfilMaestroSyncRequest, ProfileResponse


# Cliente reutilizable para las pruebas HTTP locales.
client = TestClient(app)


def test_cv_record_extraction_accepts_spanish_and_english_keys() -> None:
    spanish_records = [{"cargo": "Desarrolladora", "empresa": "AltoqueCV"}, None]
    english_records = [{"role": "Engineer", "company": "Example"}]

    assert obtener_registros_cv({"experiencia": spanish_records}, "experiencia", "experience") == [spanish_records[0]]
    assert obtener_registros_cv({"experience": english_records}, "experiencia", "experience") == english_records
    assert obtener_registros_cv({"experiencia": "sin registros"}, "experiencia", "experience") == []


def test_cv_json_parser_rejects_truncated_model_output() -> None:
    assert extraer_json_seguro('{"experiencia":[{"cargo":"Desarrolladora"') == {}


def test_local_cv_fallback_extracts_attached_resume_sections() -> None:
    cv_text = """Marcela Isidora Segovia Ponce marcela@example.com
ANALISTA PROGRAMADORA COMPUTACIONAL
OBJETIVO
Analista orientada a backend e ingeniería de datos, cursando el último año de Ingeniería en Informática.
RESUMEN DE HABILIDADES
Desarrollo de software y automatización.
EXPERIENCIA PROFESIONAL
BLACK AI SPA | Santiago, Chile
Consultora Junior de Analítica, Automatización e Inteligencia Artificial Agosto 2025 - Febrero 2026
- Desarrollo tecnológico para clientes corporativos.
- FlixBus: arquitectura B2B con OCR y APIs.
PROYECTOS PROPIOS Y FREELANCE | Santiago, Chile
Desarrolladora Fullstack y de Automatización Inteligente Diciembre 2023 - Julio 2025
- Desarrollo con Angular, Node.js y PostgreSQL.
HERRAMIENTAS Y TECNOLOGÍAS
Lenguajes: Python, Javascript, TypeScript, Java.
FORMACIÓN ACADÉMICA Y CERTIFICACIONES
Certificado en Calidad Software.
Certificado en Inteligencia de Negocios.
REFERENCIAS
"""

    profile = extraer_perfil_local_cv(cv_text, "marcela@example.com", "", "+56912345678")

    assert len(profile["experience"]) == 2
    assert profile["experience"][0]["empresa"] == "BLACK AI SPA"
    assert profile["experience"][0]["cargo"] == "Consultora Junior de Analítica, Automatización e Inteligencia Artificial"
    assert profile["experience"][0]["fecha_inicio"] == "Agosto 2025"
    assert profile["experience"][1]["fecha_fin"] == "Julio 2025"
    assert "Python" in profile["skills"]
    assert len(profile["education"]) == 3


def test_local_cv_uses_verbatim_professional_summary_and_separates_education() -> None:
    summary = "Analista de datos con experiencia en automatización de procesos."
    cv_text = f"""RESUMEN PROFESIONAL
{summary}
EXPERIENCIA LABORAL
Macroactiva SPA
Desarrollador Jr. Enero 2022 - Diciembre 2023
Análisis y automatización de procesos.
ACADÉMICOS
Universidad Ejemplo
Ingeniería en Informática Enero 2018 - Diciembre 2021
"""

    profile = extraer_perfil_local_cv(cv_text, "", "", "")

    assert profile["personalData"]["resumen"] == summary
    assert len(profile["experience"]) == 1
    assert profile["experience"][0]["empresa"] == "Macroactiva SPA"
    assert profile["experience"][0]["cargo"] == "Desarrollador Jr."
    assert "Universidad Ejemplo" not in str(profile["experience"])
    assert "Ingeniería en Informática" not in str(profile["experience"])


def test_local_cv_does_not_classify_education_as_work_experience() -> None:
    cv_text = """FORMACIÓN ACADÉMICA
Universidad Ejemplo
Ingeniería en Informática Enero 2018 - Diciembre 2021
"""

    assert extraer_perfil_local_cv(cv_text, "", "", "")["experience"] == []


def test_experience_parser_recognizes_standalone_heading_extracts_location_and_sorts_latest_first() -> None:
    cv_text = """EXPERIENCIA
Probus
Santiago, Chile
Analista de Datos
Enero 2020 - Diciembre 2021
Análisis de información.
Macroactiva SPA
Valparaíso, Chile
Desarrollador Jr.
Enero 2022 - Diciembre 2023
Automatización de procesos.
FORMACIÓN ACADÉMICA
Universidad Ejemplo
"""

    experiences = api.extraer_experiencia_local(cv_text)

    assert [experience["empresa"] for experience in experiences] == ["Macroactiva SPA", "Probus"]
    assert experiences[0]["cargo"] == "Desarrollador Jr."
    assert experiences[0]["ubicacion"] == "Valparaíso, Chile"
    assert experiences[1]["ubicacion"] == "Santiago, Chile"


def test_ai_experience_fields_require_relevant_source_evidence() -> None:
    cv_text = """Macroactiva SPA
Desarrollador Jr.
Macroactiva SPA - LABORAL (EXPERIENCIA) Desarrollador Jr.
Enero 2022 - Diciembre 2023
Automatización de procesos con Python.
"""
    experiences = [{
        "cargo": "Macroactiva SPA - LABORAL (EXPERIENCIA) Desarrollador Jr.",
        "empresa": "Macroactiva SPA",
        "fecha_inicio": "Enero 2022",
        "fecha_fin": "Diciembre 2023",
        "ubicacion": "Santiago, Chile",
        "tipo_jornada": "Jornada completa",
        "descripcion": "Lideró un equipo internacional.",
        "habilidades": ["Python"],
        "evidencia": {
            "cargo": "Macroactiva SPA - LABORAL (EXPERIENCIA) Desarrollador Jr.",
            "empresa": "Macroactiva SPA",
            "fecha_inicio": "Enero 2022",
            "fecha_fin": "Diciembre 2023",
            "ubicacion": "Santiago, Chile",
            "tipo_jornada": "Jornada completa",
            "descripcion": "Automatización de procesos con Python.",
            "habilidades": ["Python"],
        },
        "pertinencia": {
            "experiencia_laboral": True,
            "cargo": True,
            "empresa": True,
            "fecha_inicio": True,
            "fecha_fin": True,
            "ubicacion": True,
            "tipo_jornada": True,
            "descripcion": True,
            "habilidades": [True],
        },
    }]

    valid = api.validar_experiencias_ia(experiences, cv_text)

    assert len(valid) == 1
    assert valid[0]["cargo"] == "Desarrollador Jr."
    assert valid[0]["empresa"] == "Macroactiva SPA"
    assert valid[0]["ubicacion"] == ""
    assert valid[0]["tipo_jornada"] == ""
    assert valid[0]["descripcion"] == ""
    assert valid[0]["habilidades"] == ["Python"]


def test_ai_education_and_skills_require_source_evidence() -> None:
    cv_text = """Ingeniería en Informática, Universidad Ejemplo.
Formación completada en 2024.
Herramientas: Python, SQL.
"""
    education = api.validar_educacion_ia([{
        "titulo": "Ingeniería en Informática",
        "institucion": "Universidad Ejemplo",
        "fecha_inicio": "",
        "fecha_fin": "2024",
        "descripcion": "Especialización en inteligencia artificial",
        "evidencia": {
            "titulo": "Ingeniería en Informática",
            "institucion": "Universidad Ejemplo",
            "fecha_inicio": "",
            "fecha_fin": "Formación completada en 2024.",
            "descripcion": "Universidad Ejemplo",
        },
        "pertinencia": {
            "titulo": True,
            "institucion": True,
            "fecha_inicio": False,
            "fecha_fin": True,
            "descripcion": True,
        },
    }], cv_text)
    skills = api.validar_habilidades_ia(
        ["Python", "Java"],
        ["Herramientas: Python, SQL.", "Java"],
        [True, True],
        cv_text,
    )

    assert education == [{
        "titulo": "Ingeniería en Informática",
        "institucion": "Universidad Ejemplo",
        "fecha_inicio": "",
        "fecha_fin": "2024",
        "descripcion": "",
    }]
    assert skills == ["Python"]


def test_ai_experience_accepts_directly_quoted_fields_from_llama_compat_output() -> None:
    cv_text = """At North Harbor Robotics, I worked as a Robotics Software Engineer from March 2022 to November 2024.
Built Python automation tools for warehouse robots and reduced manual review time.
"""
    experiences = [{
        "cargo": "Robotics Software Engineer",
        "empresa": "North Harbor Robotics",
        "fecha_inicio": "March 2022",
        "fecha_fin": "November 2024",
        "ubicacion": "",
        "tipo_jornada": "",
        "descripcion": "Built Python automation tools for warehouse robots and reduced manual review time.",
        "habilidades": [],
        "experiencia_laboral": True,
        "evidencia": [{"habilidad": "", "cita": ""}],
        "pertinencia": [{"habilidad": "", "booleano": False}],
    }]

    valid = api.validar_experiencias_ia(experiences, cv_text)

    assert len(valid) == 1
    assert valid[0]["cargo"] == "Robotics Software Engineer"
    assert valid[0]["empresa"] == "North Harbor Robotics"
    assert valid[0]["fecha_inicio"] == "March 2022"
    assert valid[0]["descripcion"] == "Built Python automation tools for warehouse robots and reduced manual review time."


def test_ollama_cannot_invent_experience_or_rewrite_cv_summary(monkeypatch: pytest.MonkeyPatch) -> None:
    summary = "Analista con experiencia en automatización y análisis de datos."
    cv_text = f"""RESUMEN PROFESIONAL
{summary}
FORMACIÓN ACADÉMICA
Universidad Ejemplo
Ingeniería en Informática Enero 2018 - Diciembre 2021
"""

    class FakePage:
        def extract_text(self) -> str:
            return cv_text

    class FakeReader:
        pages = [FakePage()]

    class FakeOllamaResponse:
        is_error = False

        @staticmethod
        def json() -> dict[str, str]:
            return {
                "response": json.dumps({
                    "resumen": "Experiencia laboral destacada en Universidad Ejemplo.",
                    "experiencia": [{
                        "empresa": "Universidad Ejemplo",
                        "cargo": "Estudiante",
                        "fecha_inicio": "2018",
                        "fecha_fin": "2021",
                    }],
                    "educacion": [{
                        "institucion": "Universidad Ejemplo",
                        "titulo": "Ingeniería en Informática",
                        "fecha_inicio": "2018",
                        "fecha_fin": "2021",
                    }],
                }),
            }

    class FakeOllamaClient:
        async def __aenter__(self):
            return self

        async def __aexit__(self, *args: object) -> None:
            return None

        async def post(self, *args: object, **kwargs: object) -> FakeOllamaResponse:
            return FakeOllamaResponse()

    monkeypatch.setattr(api.PyPDF2, "PdfReader", lambda _: FakeReader())
    monkeypatch.setattr(api.httpx, "AsyncClient", lambda **kwargs: FakeOllamaClient())

    response = client.post(
        "/api/v1/auth/ia/procesar-cv",
        files={"cv_file": ("cv-academico.pdf", b"mocked pdf bytes", "application/pdf")},
    )

    assert response.status_code == 200
    body = response.json()["datos"]
    assert body["experience"] == []
    assert body["personalData"]["resumen"] == summary


def test_ollama_experience_fields_need_source_quotes_and_work_section(monkeypatch: pytest.MonkeyPatch) -> None:
    cv_text = """EXPERIENCIA
Macroactiva SPA
Desarrollador Jr.
Automatización de procesos con Python.
RESUMEN PROFESIONAL
Analista de datos.
"""

    class FakePage:
        def extract_text(self) -> str:
            return cv_text

    class FakeReader:
        pages = [FakePage()]

    class FakeOllamaResponse:
        is_error = False

        @staticmethod
        def json() -> dict[str, str]:
            record = {
                "cargo": "Desarrollador Jr.",
                "empresa": "Macroactiva SPA",
                "fecha_inicio": "",
                "fecha_fin": "",
                "ubicacion": "",
                "tipo_jornada": "",
                "descripcion": "Automatización de procesos con Python.",
                "habilidades": ["Python"],
                "evidencia": {
                    "cargo": "Desarrollador Jr.",
                    "empresa": "Macroactiva SPA",
                    "fecha_inicio": "",
                    "fecha_fin": "",
                    "ubicacion": "",
                    "tipo_jornada": "",
                    "descripcion": "Automatización de procesos con Python.",
                    "habilidades": ["Python"],
                },
                "pertinencia": {
                    "experiencia_laboral": True,
                    "cargo": True,
                    "empresa": True,
                    "fecha_inicio": False,
                    "fecha_fin": False,
                    "ubicacion": False,
                    "tipo_jornada": False,
                    "descripcion": True,
                    "habilidades": [True],
                },
            }
            return {
                "response": json.dumps({
                    "resumen": "Experiencia laboral destacada en Macroactiva SPA.",
                    "experiencia": [record],
                    "educacion": [],
                }),
            }

    class FakeOllamaClient:
        async def __aenter__(self):
            return self

        async def __aexit__(self, *args: object) -> None:
            return None

        async def post(self, *args: object, **kwargs: object) -> FakeOllamaResponse:
            prompt = kwargs["json"]["prompt"]
            assert "evalúa si cada campo es pertinente" in prompt
            assert "cita textual exacta" in prompt
            return FakeOllamaResponse()

    monkeypatch.setattr(api.PyPDF2, "PdfReader", lambda _: FakeReader())
    monkeypatch.setattr(api.httpx, "AsyncClient", lambda **kwargs: FakeOllamaClient())

    response = client.post(
        "/api/v1/auth/ia/procesar-cv",
        files={"cv_file": ("cv-experiencia.pdf", b"mocked pdf bytes", "application/pdf")},
    )

    assert response.status_code == 200
    body = response.json()["datos"]["experience"]
    assert len(body) == 1
    assert body[0]["empresa"] == "Macroactiva SPA"
    assert body[0]["cargo"] == "Desarrollador Jr."
    assert body[0]["descripcion"] == "Automatización de procesos con Python."
    assert body[0]["ubicacion"] == ""
    assert body[0]["tipo_jornada"] == ""


def test_cv_ollama_receives_entire_long_document_without_relying_on_local_headings(monkeypatch: pytest.MonkeyPatch) -> None:
    intro = "Perfil de postulante con trayectoria y logros. " * 650
    job_text = """Analista de Operaciones
Comercial Ejemplo Ltda.
Desde marzo de 2021 hasta noviembre de 2024
Coordiné inventario, mejoré procesos y gestioné reportes.
"""
    cv_text = intro + "\n" + job_text
    prompts: list[str] = []

    class FakePage:
        def extract_text(self) -> str:
            return cv_text

    class FakeReader:
        pages = [FakePage()]

    class FakeOllamaResponse:
        is_error = False

        def __init__(self, response: str):
            self.response = response

        def json(self) -> dict[str, str]:
            return {"response": self.response, "done_reason": "stop"}

    class FakeOllamaClient:
        async def __aenter__(self):
            return self

        async def __aexit__(self, *args: object) -> None:
            return None

        async def post(self, *args: object, **kwargs: object) -> FakeOllamaResponse:
            prompt = kwargs["json"]["prompt"]
            prompts.append(prompt)
            if "Comercial Ejemplo Ltda." not in prompt:
                return FakeOllamaResponse(json.dumps({"experiencia": [], "educacion": [], "skills": []}))

            record = {
                "cargo": "Analista de Operaciones",
                "empresa": "Comercial Ejemplo Ltda.",
                "fecha_inicio": "marzo de 2021",
                "fecha_fin": "noviembre de 2024",
                "ubicacion": "",
                "tipo_jornada": "",
                "descripcion": "Coordiné inventario, mejoré procesos y gestioné reportes.",
                "habilidades": [],
                "evidencia": {
                    "cargo": "Analista de Operaciones",
                    "empresa": "Comercial Ejemplo Ltda.",
                    "fecha_inicio": "marzo de 2021",
                    "fecha_fin": "noviembre de 2024",
                    "ubicacion": "",
                    "tipo_jornada": "",
                    "descripcion": "Coordiné inventario, mejoré procesos y gestioné reportes.",
                    "habilidades": [],
                },
                "pertinencia": {
                    "experiencia_laboral": True,
                    "cargo": True,
                    "empresa": True,
                    "fecha_inicio": True,
                    "fecha_fin": True,
                    "ubicacion": False,
                    "tipo_jornada": False,
                    "descripcion": True,
                    "habilidades": [],
                },
            }
            return FakeOllamaResponse(json.dumps({
                "experiencia": [record],
                "educacion": [],
                "skills": [],
            }))

    monkeypatch.setattr(api.PyPDF2, "PdfReader", lambda _: FakeReader())
    monkeypatch.setattr(api.httpx, "AsyncClient", lambda **kwargs: FakeOllamaClient())

    response = client.post(
        "/api/v1/auth/ia/procesar-cv",
        files={"cv_file": ("cv-largo.pdf", b"mocked pdf bytes", "application/pdf")},
    )

    assert response.status_code == 200
    assert len(prompts) == 3
    assert all("identifica experiencia, educación, habilidades y datos personales" in prompt for prompt in prompts)
    assert all("La única fuente permitida" not in prompt for prompt in prompts)
    assert job_text.strip() in prompts[-1]
    experiences = response.json()["datos"]["experience"]
    assert len(experiences) == 1
    assert experiences[0]["empresa"] == "Comercial Ejemplo Ltda."
    assert experiences[0]["cargo"] == "Analista de Operaciones"


def test_deduplicate_experiences_handles_model_field_aliases() -> None:
    experiences = [
        {"company": "Macroactiva SPA", "role": "Desarrollador Jr.", "startDate": "2022", "endDate": "2023"},
        {"company": "Macroactiva SPA", "role": "Desarrollador Jr.", "startDate": "2022", "endDate": "2023"},
        {"company": "Probus", "role": "Analista", "startDate": "2020", "endDate": "2021"},
    ]

    assert len(api._deduplicar_experiencias(experiences)) == 2


def test_cv_endpoint_uses_local_profile_when_ollama_times_out(monkeypatch: pytest.MonkeyPatch) -> None:
    cv_text = """Marcela Segovia marcela@example.com
ANALISTA PROGRAMADORA COMPUTACIONAL
OBJETIVO
Analista orientada a backend.
RESUMEN DE HABILIDADES
Automatización y datos.
EXPERIENCIA PROFESIONAL
BLACK AI SPA | Santiago, Chile
Consultora de Analítica Agosto 2025 - Febrero 2026
- Automatización de procesos con Python y OCR.
HERRAMIENTAS Y TECNOLOGÍAS
Lenguajes: Python, TypeScript.
FORMACIÓN ACADÉMICA Y CERTIFICACIONES
Certificado en Calidad Software.
REFERENCIAS
"""

    class FakePage:
        def extract_text(self) -> str:
            return cv_text

    class FakeReader:
        pages = [FakePage()]

    ollama_requests: list[tuple[tuple[object, ...], dict[str, object]]] = []
    ollama_timeouts: list[object] = []

    def fail_on_console_print(*args: object, **kwargs: object) -> None:
        raise UnicodeEncodeError("cp1252", "📄", 0, 1, "character maps to <undefined>")

    class TimedOutOllama:
        async def __aenter__(self):
            return self

        async def __aexit__(self, *args: object) -> None:
            return None

        async def post(self, *args: object, **kwargs: object) -> None:
            ollama_requests.append((args, kwargs))
            raise httpx.ReadTimeout("simulated Ollama timeout")

    def fake_async_client(**kwargs: object) -> TimedOutOllama:
        ollama_timeouts.append(kwargs["timeout"])
        return TimedOutOllama()

    app.dependency_overrides[get_settings] = lambda: Settings(
        ollama_base_url="http://ollama.test:11434",
        ollama_model="llama3.2",
        ollama_timeout_seconds=12,
    )
    monkeypatch.setattr("builtins.print", fail_on_console_print)
    monkeypatch.setattr(api.PyPDF2, "PdfReader", lambda _: FakeReader())
    monkeypatch.setattr(api.httpx, "AsyncClient", fake_async_client)

    try:
        response = client.post(
            "/api/v1/auth/ia/procesar-cv",
            files={"cv_file": ("CV-SEGOVIA.pdf", b"mocked pdf bytes", "application/pdf")},
        )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    body = response.json()
    assert body["exito"] is True
    assert body["datos"]["experience"][0]["empresa"] == "BLACK AI SPA"
    assert "Python" in body["datos"]["skills"]
    assert body["advertencia"] == "Ollama tardó demasiado; se usó extracción local del PDF."
    assert ollama_timeouts == [12]
    assert ollama_requests[0][0] == ("http://ollama.test:11434/api/generate",)
    assert ollama_requests[0][1]["json"]["model"] == "llama3.2"


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


def test_register_returns_503_when_supabase_is_unreachable() -> None:
    class UnavailableSupabaseService:
        async def register(self, payload: PasswordConfirmationRequest) -> None:
            raise httpx.ConnectError("Supabase DNS unavailable")

    async def override_auth_service():
        yield UnavailableSupabaseService()

    app.dependency_overrides[get_auth_service] = override_auth_service
    try:
        response = client.post(
            "/api/v1/auth/register",
            json={
                "email": "frontend@example.com",
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

    assert response.status_code == 503
    assert response.json() == {
        "detail": "No fue posible conectar con Supabase. Verifica la URL y la conectividad del backend."
    }


def test_current_user_requires_bearer_token() -> None:
    """Rechaza la consulta de sesión cuando el cliente no envía credenciales."""
    response = client.get("/api/v1/auth/me")

    assert response.status_code == 401
    assert response.json() == {"detail": "Token requerido"}


def test_autocomplete_uses_authenticated_database_profile_and_limits_answer(monkeypatch: pytest.MonkeyPatch) -> None:
    sent_messages: list[dict[str, str]] = []
    sent_urls: list[str] = []

    class ProfileService:
        async def current_user(self, access_token: str) -> CurrentUserResponse:
            assert access_token == "valid-session-token"
            return CurrentUserResponse(user_id="user-123", email="marcela@example.com", first_name="Marcela", last_name="Segovia")

        async def profile(self, user_id: str) -> ProfileResponse:
            assert user_id == "user-123"
            return ProfileResponse(
                user_id=user_id,
                email="marcela@example.com",
                account_status="activo",
                rut="12.345.678-5",
                first_name="Marcela",
                last_name="Segovia",
                phone=None,
                education=[],
                experience=[{
                    "id": "experience-1",
                    "role": "Consultora de Analítica",
                    "company": "BLACK AI SPA",
                    "startDate": "2025-08-01",
                    "endDate": "2026-02-01",
                    "isCurrent": False,
                    "description": "Automatización RPA con Python y OCR.",
                    "stackTags": [],
                }],
                skills=["Python", "OCR"],
                salary_min=None,
                salary_max=None,
            )

    class FakeOllamaResponse:
        is_error = False

        @staticmethod
        def json() -> dict[str, object]:
            return {"message": {"content": "{\"respuestas\":[\"Tengo experiencia con Python y OCR en BLACK AI SPA.\"]}"}}

    class FakeOllamaClient:
        async def __aenter__(self):
            return self

        async def __aexit__(self, *args: object) -> None:
            return None

        async def post(self, url: str, json: dict[str, object]):
            sent_urls.append(url)
            sent_messages.extend(json["messages"])
            return FakeOllamaResponse()

    async def override_auth_service():
        yield ProfileService()

    monkeypatch.setattr(api.httpx, "AsyncClient", lambda **kwargs: FakeOllamaClient())
    app.dependency_overrides[get_auth_service] = override_auth_service
    try:
        response = client.post(
            "/api/v1/auth/ia/autocompletar",
            headers={"Authorization": "Bearer valid-session-token"},
            json={
                "preguntas": ["¿Qué experiencia tienes en automatización?"],
                "cargo_postulacion": "Analista de Automatización",
                "empresa": "Laborum",
            },
        )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    assert sent_urls == ["http://127.0.0.1:11434/api/chat"]
    assert len(sent_messages) == 2
    assert "1." in sent_messages[1]["content"]
    answer = response.json()["respuestas"][0]
    assert len(answer.split()) <= 35
    ollama_prompt = "\n".join(message["content"] for message in sent_messages)
    assert "BLACK AI SPA" in ollama_prompt
    assert "Python" in ollama_prompt
    assert "Analista de Automatización" in ollama_prompt


def test_profile_sync_requires_and_uses_authenticated_user() -> None:
    synchronized: list[tuple[str, object]] = []

    class ProfileSyncService:
        async def current_user(self, access_token: str) -> CurrentUserResponse:
            return CurrentUserResponse(user_id="user-123", email="marcela@example.com")

        async def sync_profile(self, user_id: str, payload: object) -> None:
            synchronized.append((user_id, payload))

        async def profile(self, user_id: str) -> ProfileResponse:
            return ProfileResponse(
                user_id=user_id,
                email="marcela@example.com",
                account_status="activo",
                rut="12.345.678-5",
                first_name="Marcela",
                last_name="Segovia",
                phone=None,
            )

    async def override_auth_service():
        yield ProfileSyncService()

    app.dependency_overrides[get_auth_service] = override_auth_service
    try:
        response = client.put(
            "/api/v1/auth/profile",
            headers={"Authorization": "Bearer valid-session-token"},
            json={"experience": [{"role": "Desarrolladora", "company": "BLACK AI SPA"}], "skills": ["Python"]},
        )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    assert synchronized[0][0] == "user-123"


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
@pytest.mark.parametrize(
    ("phone", "expected_phone"),
    [("+56942149351", "+56942149351"), ("", None)],
)
async def test_profile_sync_saves_salary_and_clears_empty_phone(
    monkeypatch: pytest.MonkeyPatch,
    phone: str,
    expected_phone: str | None,
) -> None:
    """Sincroniza la expectativa y permite limpiar el teléfono en la base de datos."""
    requests: list[httpx.Request] = []

    def mock_supabase(request: httpx.Request) -> httpx.Response:
        requests.append(request)
        return httpx.Response(204, request=request)

    settings = Settings(
        supabase_url="https://project.supabase.co",
        supabase_anon_key="test-anon-key",
        supabase_service_role_key="test-service-role-key",
    )
    async with httpx.AsyncClient(transport=httpx.MockTransport(mock_supabase)) as http_client:
        service = SupabaseAuthService(settings, http_client)

        async def mock_rest_get(table: str, params: dict[str, str]) -> list[dict[str, str]]:
            return [{"id": "profile-id"}] if table == "perfiles_candidatos" else []

        monkeypatch.setattr(service, "_rest_get", mock_rest_get)
        payload = PerfilMaestroSyncRequest(
            personalData={
                "nombre": "Marcela Segovia",
                "rut": "12345678-5",
                "email": "marcela@example.com",
                "teléfono": phone,
            },
            salaryData={"min": ""},
        )

        await service.sync_profile("user-id", payload)

    profile_patch = next(request for request in requests if request.method == "PATCH")
    assert json.loads(profile_patch.content) == {
        "nombres": "Marcela",
        "apellidos": "Segovia",
        "rut_identificador": "12345678-5",
        "telefono_movil": expected_phone,
        "expectativa_salarial_liquida": None,
    }


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

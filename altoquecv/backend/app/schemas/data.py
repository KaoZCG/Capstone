from typing import Any, Dict, List, Literal
from urllib.parse import urlsplit

from pydantic import BaseModel, Field, field_validator
from pydantic import SecretStr


class ProfileResponse(BaseModel):
    user_id: str
    email: str
    account_status: str
    rut: str
    first_name: str
    last_name: str
    phone: str | None = None
    cargo_objetivo: str = ""
    region: str = ""
    comuna: str = ""
    linkedin: str = ""
    portafolio: str = ""
    resumen_profesional: str = ""
    education: list[dict[str, object]] = Field(default_factory=list)
    experience: list[dict[str, object]] = Field(default_factory=list)
    skills: list[str] = Field(default_factory=list)
    salary_min: float | None = None
    salary_max: float | None = None


class PostulacionStatusRequest(BaseModel):
    status: str


class PostulacionCreateRequest(BaseModel):
    cargo: str = Field(min_length=1, max_length=200)
    empresa: str = Field(min_length=1, max_length=200)
    url_oferta: str = Field(min_length=1, max_length=2048)

    @field_validator("url_oferta")
    @classmethod
    def validate_laborum_application_url(cls, value: str) -> str:
        parsed = urlsplit(value.strip())
        host = (parsed.hostname or "").lower()
        if (
            parsed.scheme != "https"
            or not (host == "laborum.cl" or host.endswith(".laborum.cl"))
            or not parsed.path.startswith("/empleos/")
        ):
            raise ValueError("La URL debe corresponder a una vacante de Laborum Chile.")
        return parsed._replace(query="", fragment="").geturl()


class PostulacionResponse(BaseModel):
    id: str
    empresa: dict[str, str]
    cargo: str
    ubicacion: str
    compatibilidad: float
    status: str
    fechaPostulacion: str
    url_oferta: str | None = None


class OfertaLaborumInput(BaseModel):
    titulo: str = Field(min_length=1, max_length=200)
    empresa: str = Field(default="Confidencial", max_length=200)
    ubicacion: str = Field(default="Ubicación no informada", max_length=200)
    url: str = Field(min_length=1, max_length=2048)
    notas_usuario: str = Field(default="", max_length=500)

    @field_validator("url")
    @classmethod
    def validate_laborum_url(cls, value: str) -> str:
        parsed = urlsplit(value.strip())
        host = (parsed.hostname or "").lower()
        if (
            parsed.scheme != "https"
            or not (host == "laborum.cl" or host.endswith(".laborum.cl"))
            or not parsed.path.startswith("/empleos/")
        ):
            raise ValueError("La URL debe corresponder a una vacante de Laborum Chile.")
        return parsed._replace(query="", fragment="").geturl()


class OfertasLaborumBatchRequest(BaseModel):
    ofertas: list[OfertaLaborumInput] = Field(min_length=1, max_length=1)


class OfertasLaborumSaveResponse(BaseModel):
    exito: bool
    guardadas: int


class OfertaLaborumResponse(BaseModel):
    id: str
    titulo: str
    empresa: str
    ubicacion: str
    url: str
    notas_usuario: str
    compatibilidad: int
    habilidades_coincidentes: list[str] = Field(default_factory=list)
    habilidades_totales: int
    skills_match: int
    experiencia_match: int
    formacion_match: int
    fecha_captura: str

class IAAutocompletarRequest(BaseModel):
    preguntas: List[str] = Field(min_length=1, max_length=20)
    cargo_postulacion: str = Field(min_length=1, max_length=200)
    empresa: str = Field(min_length=1, max_length=200)
    descripcion_oferta: str = Field(default="", max_length=6000)


class PerfilResumenExperienciaRequest(BaseModel):
    cargo: str = Field(default="", max_length=160)
    empresa: str = Field(default="", max_length=160)
    fecha_inicio: str = Field(default="", max_length=60)
    fecha_fin: str = Field(default="", max_length=60)
    descripcion: str = Field(default="", max_length=1200)
    habilidades: list[str] = Field(default_factory=list, max_length=20)


class PerfilResumenEducacionRequest(BaseModel):
    titulo: str = Field(default="", max_length=200)
    institucion: str = Field(default="", max_length=200)
    fecha_inicio: str = Field(default="", max_length=60)
    fecha_fin: str = Field(default="", max_length=60)


class GenerarResumenProfesionalRequest(BaseModel):
    nombre: str = Field(default="", max_length=120)
    cargo_objetivo: str = Field(default="", max_length=200)
    resumen_actual: str = Field(default="", max_length=1200)
    experiencia: list[PerfilResumenExperienciaRequest] = Field(default_factory=list, max_length=10)
    educacion: list[PerfilResumenEducacionRequest] = Field(default_factory=list, max_length=8)
    habilidades: list[str] = Field(default_factory=list, max_length=40)


class AIProviderSettingsRequest(BaseModel):
    provider: Literal["openrouter"]
    model_id: str | None = Field(default=None, min_length=1, max_length=200)
    api_key: SecretStr | None = Field(default=None, min_length=1, max_length=512)


class OpenRouterKeyValidationRequest(BaseModel):
    api_key: SecretStr = Field(min_length=1, max_length=512)
    model_id: str | None = Field(default=None, min_length=1, max_length=200)


class AIProviderSettingsResponse(BaseModel):
    provider: Literal["openrouter"]
    model_id: str | None = None
    has_api_key: bool = False


class PerfilMaestroSyncRequest(BaseModel):
    personalData: Dict[str, Any] = Field(default_factory=dict)
    education: List[Dict[str, Any]] = Field(default_factory=list)
    experience: List[Dict[str, Any]] = Field(default_factory=list)
    skills: List[str] = Field(default_factory=list)
    salaryData: Dict[str, Any] = Field(default_factory=dict)

class IARespuesta(BaseModel):
    exito: bool
    respuestas: list[str]


class CVExperienceDraft(BaseModel):
    role: str = Field(default="", max_length=160)
    company: str = Field(default="", max_length=160)
    start_date: str = Field(default="", max_length=60)
    end_date: str = Field(default="", max_length=60)
    description: str = Field(default="", max_length=1600)
    skills: list[str] = Field(default_factory=list, max_length=30)


class CVEducationDraft(BaseModel):
    degree: str = Field(default="", max_length=200)
    institution: str = Field(default="", max_length=200)
    year: int | None = Field(default=None, ge=1900, le=2100)


class CVDraft(BaseModel):
    summary: str = Field(default="", max_length=1600)
    experiences: list[CVExperienceDraft] = Field(default_factory=list, max_length=15)
    education: list[CVEducationDraft] = Field(default_factory=list, max_length=12)
    skills: list[str] = Field(default_factory=list, max_length=60)


class CVAdaptRequest(BaseModel):
    cargo_postulacion: str = Field(min_length=1, max_length=200)
    empresa: str = Field(default="", max_length=200)
    descripcion_oferta: str = Field(default="", max_length=6000)
    cv_actual: CVDraft


class CVExperienceAdaptation(BaseModel):
    indice: int = Field(ge=0)
    logros: list[str] = Field(default_factory=list, max_length=6)
    habilidades: list[str] = Field(default_factory=list, max_length=30)


class CVAdaptResponse(BaseModel):
    exito: bool
    resumen: str
    experiencias: list[CVExperienceAdaptation]
    habilidades: list[str]

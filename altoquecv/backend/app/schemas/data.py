from pydantic import BaseModel, Field


class ProfileResponse(BaseModel):
    user_id: str
    email: str
    account_status: str
    rut: str
    first_name: str
    last_name: str
    phone: str | None = None
    education: list[dict[str, object]] = Field(default_factory=list)
    experience: list[dict[str, object]] = Field(default_factory=list)
    skills: list[str] = Field(default_factory=list)
    salary_min: float | None = None
    salary_max: float | None = None


class PostulacionStatusRequest(BaseModel):
    status: str


class PostulacionResponse(BaseModel):
    id: str
    empresa: dict[str, str]
    cargo: str
    ubicacion: str
    compatibilidad: float
    status: str
    fechaPostulacion: str
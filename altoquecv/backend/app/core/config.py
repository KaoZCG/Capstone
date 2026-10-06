# `lru_cache` memoriza el resultado de `get_settings`, evitando leer y validar
# el archivo `.env` repetidamente durante la vida del proceso.
from functools import lru_cache

# `AnyHttpUrl` valida que la URL de Supabase tenga un formato HTTP correcto.
# `Field` permite declarar restricciones y valores por defecto de forma explícita.
from pydantic import AnyHttpUrl, Field
# `BaseSettings` lee valores desde variables de entorno y `.env` usando los nombres
# de los atributos; `SettingsConfigDict` configura ese comportamiento.
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Configuración tipada de la API.

    Las credenciales reales se deben colocar en `.env`, que está excluido de Git.
    Los valores de ejemplo de Supabase permiten arrancar healthchecks y pruebas
    locales sin configurar todavía una cuenta, pero no sirven para autenticarse.
    """

    # Nombre visible de la aplicación en la documentación OpenAPI.
    app_name: str = "AltoqueCV API"
    # Entorno actual: development, test o production, según el despliegue.
    app_env: str = "development"
    # Prefijo común para versionar los endpoints.
    api_prefix: str = "/api/v1"
    # URL del proyecto Supabase; Pydantic verifica que sea una URL HTTP válida.
    supabase_url: AnyHttpUrl = "https://example.supabase.co"
    # URL pública de la app usada como destino del enlace enviado por correo.
    frontend_url: AnyHttpUrl = "http://localhost:3000"
    # Clave pública usada por Supabase Auth; `min_length` evita una cadena vacía.
    supabase_anon_key: str = Field(default="not-configured", min_length=1)
    # Clave privada necesaria para consultar metadata de usuarios y detectar RUT duplicados.
    supabase_service_role_key: str | None = None
    # Orígenes de navegador autorizados por CORS.
    cors_origins: list[str] = ["http://localhost:3000"]

    # Configura la carga automática desde `.env` y rechaza errores por variables extra.
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")


@lru_cache
def get_settings() -> Settings:
    """Devuelve la configuración de la aplicación, reutilizando la misma instancia."""
    return Settings()

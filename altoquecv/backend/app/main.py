# `asynccontextmanager` convierte una función asíncrona en un gestor de contexto.
# Aquí permite definir acciones de arranque y cierre de la aplicación FastAPI.
from contextlib import asynccontextmanager
# `AsyncIterator` describe una función asíncrona que puede entregar valores con `yield`.
from collections.abc import AsyncIterator

# `FastAPI` es el framework que crea la API HTTP y genera OpenAPI automáticamente.
from fastapi import FastAPI
# `CORSMiddleware` permite que el frontend en otro origen, como localhost:3000,
# pueda realizar peticiones al backend.
from fastapi.middleware.cors import CORSMiddleware

# Importamos el router donde viven las rutas de registro e inicio de sesión.
from app.api import router
# Importamos la función centralizada que carga la configuración desde `.env`.
from app.core.config import get_settings


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    """Gestiona el ciclo de vida de la aplicación.

    `yield` separa la fase anterior al arranque de la fase posterior al cierre.
    Actualmente no necesitamos abrir conexiones compartidas, pero mantener este
    punto de extensión facilita añadirlas más adelante sin cambiar `main.py`.
    El parámetro se llama `_` porque FastAPI entrega la aplicación, pero aquí no
    necesitamos utilizar ese objeto.
    """
    yield


# Se carga una sola instancia de configuración para construir la aplicación.
settings = get_settings()
# Se crea la instancia central de FastAPI, que luego ejecutará Uvicorn.
app = FastAPI(title=settings.app_name, version="0.1.0", lifespan=lifespan)
# CORS controla qué frontend puede llamar a esta API desde el navegador.
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "apikey"],
)
# El prefijo agrupa todas las rutas bajo `/api/v1`, facilitando versionar la API.
app.include_router(router, prefix=settings.api_prefix)


@app.get("/health", tags=["Sistema"])
async def health() -> dict[str, str]:
    """Devuelve una respuesta mínima para comprobar que el servidor está vivo."""
    return {"status": "ok"}

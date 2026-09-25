# `httpx` proporciona el cliente HTTP asíncrono usado para comunicarnos con Supabase.
import httpx
# `AsyncIterator` describe correctamente una dependencia asíncrona que usa `yield`.
from collections.abc import AsyncIterator
# `APIRouter` organiza endpoints; `Depends` inyecta dependencias; `HTTPException`
# transforma errores internos controlados en respuestas HTTP; `status` evita números mágicos.
from fastapi import APIRouter, Depends, Header, HTTPException, status

# Tipos y lector de configuración de la aplicación.
from app.core.config import Settings, get_settings
# Modelos Pydantic que validan las entradas y serializan las salidas.
from app.schemas.auth import AuthResponse, CurrentUserResponse, LoginRequest, PasswordConfirmationRequest
from app.schemas.data import PostulacionResponse, PostulacionStatusRequest, ProfileResponse
# Servicio que contiene la comunicación y traducción de errores de Supabase Auth.
from app.services.supabase_auth import AuthServiceError, SupabaseAuthService

# El prefijo de este router se combina con `/api/v1` en `main.py`.
router = APIRouter(prefix="/auth", tags=["Autenticación"])


async def authenticated_user(
    authorization: str | None,
    service: SupabaseAuthService,
) -> CurrentUserResponse:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token requerido")
    access_token = authorization.split(" ", 1)[1].strip()
    if not access_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token requerido")
    try:
        return await service.current_user(access_token)
    except AuthServiceError as error:
        raise HTTPException(status_code=error.status_code, detail=str(error)) from error


async def get_auth_service(
    settings: Settings = Depends(get_settings),
) -> AsyncIterator[SupabaseAuthService]:
    """Construye el servicio de autenticación para una solicitud.

    `Depends` le indica a FastAPI que obtenga `Settings` automáticamente.
    `async with` garantiza que el cliente HTTP se cierre al terminar la solicitud,
    liberando conexiones y evitando fugas de recursos. `yield` convierte esta
    función en una dependencia con ciclo de vida administrado por FastAPI.
    """
    async with httpx.AsyncClient(timeout=10.0) as client:
        yield SupabaseAuthService(settings, client)


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
async def register(
    payload: PasswordConfirmationRequest,
    service: SupabaseAuthService = Depends(get_auth_service),
) -> AuthResponse:
    """Registra una cuenta usando el servicio de Supabase Auth.

    Pydantic valida `payload` antes de entrar a esta función. El `try` contiene
    únicamente la llamada que puede fallar por razones externas, como credenciales
    inválidas o un email ya registrado. El `except` captura el error propio del
    servicio y lo convierte en `HTTPException`, que FastAPI serializa como JSON.
    `raise ... from error` conserva la causa original para depuración sin exponer
    un traceback al cliente.
    """
    try:
        return await service.register(payload)
    except AuthServiceError as error:
        raise HTTPException(status_code=error.status_code, detail=str(error)) from error


@router.post("/login", response_model=AuthResponse)
async def login(
    payload: LoginRequest,
    service: SupabaseAuthService = Depends(get_auth_service),
) -> AuthResponse:
    """Inicia sesión usando email y contraseña a través de Supabase Auth.

    `await` espera la operación de red sin bloquear el hilo del servidor. Al igual
    que en registro, el `try/except` traduce un error del proveedor externo a una
    respuesta HTTP controlada.
    """
    try:
        return await service.login(payload)
    except AuthServiceError as error:
        if error.status_code == 401:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Correo o contraseña incorrectos",
            ) from error
        raise HTTPException(status_code=error.status_code, detail=str(error)) from error


@router.get("/me", response_model=CurrentUserResponse)
async def current_user(
    authorization: str | None = Header(default=None),
    service: SupabaseAuthService = Depends(get_auth_service),
) -> CurrentUserResponse:
    """Revalida el token del cliente y devuelve la identidad actual.

    El backend no decodifica ni confía solamente en el contenido del JWT. En su
    lugar, reenvía el token a Supabase Auth, que es quien verifica firma,
    expiración y existencia del usuario. Esto permite que el frontend restaure
    una sesión guardada sin aceptar credenciales vencidas o revocadas.
    """
    return await authenticated_user(authorization, service)


@router.get("/profile", response_model=ProfileResponse, tags=["Perfil"])
async def profile(
    authorization: str | None = Header(default=None),
    service: SupabaseAuthService = Depends(get_auth_service),
) -> ProfileResponse:
    user = await authenticated_user(authorization, service)
    try:
        return await service.profile(user.user_id)
    except AuthServiceError as error:
        raise HTTPException(status_code=error.status_code, detail=str(error)) from error


@router.get("/postulaciones", response_model=list[PostulacionResponse], tags=["Postulaciones"])
async def postulaciones(
    authorization: str | None = Header(default=None),
    service: SupabaseAuthService = Depends(get_auth_service),
) -> list[PostulacionResponse]:
    user = await authenticated_user(authorization, service)
    try:
        return await service.postulaciones(user.user_id)
    except AuthServiceError as error:
        raise HTTPException(status_code=error.status_code, detail=str(error)) from error


@router.patch("/postulaciones/{postulacion_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["Postulaciones"])
async def update_postulacion(
    postulacion_id: str,
    payload: PostulacionStatusRequest,
    authorization: str | None = Header(default=None),
    service: SupabaseAuthService = Depends(get_auth_service),
) -> None:
    user = await authenticated_user(authorization, service)
    try:
        await service.update_postulacion_status(user.user_id, postulacion_id, payload.status)
    except AuthServiceError as error:
        raise HTTPException(status_code=error.status_code, detail=str(error)) from error


@router.delete("/postulaciones/{postulacion_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["Postulaciones"])
async def delete_postulacion(
    postulacion_id: str,
    authorization: str | None = Header(default=None),
    service: SupabaseAuthService = Depends(get_auth_service),
) -> None:
    user = await authenticated_user(authorization, service)
    try:
        await service.delete_postulacion(user.user_id, postulacion_id)
    except AuthServiceError as error:
        raise HTTPException(status_code=error.status_code, detail=str(error)) from error

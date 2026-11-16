import asyncio
import hashlib
import math
import time
from collections import deque

from fastapi import HTTPException


class LoginAttemptLimiter:
    def __init__(
        self,
        max_attempts: int = 5,
        window_seconds: int = 900,
        max_ip_attempts: int = 50,
    ) -> None:
        self._max_attempts = max_attempts
        self._window_seconds = window_seconds
        self._max_ip_attempts = max_ip_attempts
        self._attempts: dict[str, deque[float]] = {}
        self._lock = asyncio.Lock()

    @staticmethod
    def _identifier_key(ip_address: str, identifier: str) -> str:
        value = f"{ip_address}\0{identifier.strip().casefold()}".encode("utf-8")
        return "identifier:" + hashlib.sha256(value).hexdigest()

    def _active_attempts(self, key: str, now: float) -> deque[float]:
        attempts = self._attempts.setdefault(key, deque())
        while attempts and now - attempts[0] >= self._window_seconds:
            attempts.popleft()
        if not attempts:
            self._attempts.pop(key, None)
            return deque()
        return attempts

    async def check(self, ip_address: str, identifier: str) -> None:
        now = time.monotonic()
        keys = (
            (self._identifier_key(ip_address, identifier), self._max_attempts),
            ("ip:" + ip_address, self._max_ip_attempts),
        )
        async with self._lock:
            retry_after = 0
            for key, limit in keys:
                attempts = self._active_attempts(key, now)
                if len(attempts) >= limit:
                    retry_after = max(
                        retry_after,
                        math.ceil(self._window_seconds - (now - attempts[0])),
                    )
            if retry_after:
                raise HTTPException(
                    status_code=429,
                    detail="Demasiados intentos de inicio de sesión. Espera antes de volver a intentarlo.",
                    headers={"Retry-After": str(retry_after)},
                )

    async def record_failure(self, ip_address: str, identifier: str) -> None:
        now = time.monotonic()
        keys = (
            self._identifier_key(ip_address, identifier),
            "ip:" + ip_address,
        )
        async with self._lock:
            for key in keys:
                self._active_attempts(key, now)
                self._attempts.setdefault(key, deque()).append(now)

    async def clear_identifier(self, ip_address: str, identifier: str) -> None:
        async with self._lock:
            self._attempts.pop(self._identifier_key(ip_address, identifier), None)

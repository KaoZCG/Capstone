# `re` se usa para validar formatos que deben cumplir una estructura exacta.
import re

# `BaseModel` crea esquemas con validación automática y serialización JSON.
# `EmailStr` valida el formato de email; `Field` define restricciones de campos.
# `SecretStr` evita mostrar contraseñas accidentalmente en representaciones/logs.
# `field_validator` valida un campo individual y `model_validator` reglas entre campos.
from pydantic import AliasChoices, BaseModel, EmailStr, Field, SecretStr, field_validator, model_validator


def is_valid_chilean_rut(rut: str) -> bool:
    """Comprueba el formato y el dígito verificador de un RUT chileno.

    Se aceptan RUT con puntos (`12.345.678-5`) o sin puntos (`12345678-5`),
    pero siempre se exige guion y un cuerpo de 7 u 8 dígitos. El dígito
    verificador se calcula con el algoritmo módulo 11 usado en Chile.
    """
    # Quitamos espacios y puntos para trabajar con una representación única,
    # y convertimos `k` a `K` porque ambos representan el mismo verificador.
    normalized = rut.strip().replace(".", "").upper()
    # Primero comprobamos la estructura para evitar errores al separar el RUT.
    if not re.fullmatch(r"\d{7,8}-[\dK]", normalized):
        return False

    # El cuerpo contiene los números y la parte posterior al guion es el
    # dígito verificador que debemos comparar con el resultado calculado.
    number, verifier = normalized.split("-")
    # El algoritmo multiplica los dígitos, de derecha a izquierda, por la
    # secuencia 2, 3, 4, 5, 6, 7 y vuelve a comenzar en 2.
    multiplier = 2
    total = 0
    for digit in reversed(number):
        total += int(digit) * multiplier
        multiplier = 2 if multiplier == 7 else multiplier + 1

    # El resto de la división determina si el verificador esperado es un
    # número, cero o la letra K.
    remainder = 11 - (total % 11)
    expected = "0" if remainder == 11 else "K" if remainder == 10 else str(remainder)
    return verifier == expected


def validate_person_name(value: str | None, field_name: str) -> str | None:
    """Rechaza nombres vacíos o que contengan números y símbolos no válidos."""
    if value is None:
        return None
    normalized = " ".join(value.strip().split())
    if not normalized or not all(character.isalpha() or character in " -'" for character in normalized):
        raise ValueError(f"{field_name} solo puede contener letras, espacios, guiones o apóstrofes")
    return normalized


class RegisterRequest(BaseModel):
    """Datos básicos de registro sin confirmación de contraseña.

    Mantiene compatibilidad con el backend original y con los nuevos nombres del
    frontend actual, que usan `nombre`, `rut`, `telefono` y `acepto_terminos`.
    """

    email: EmailStr
    password: SecretStr = Field(
        min_length=8,
        validation_alias=AliasChoices("password", "contraseña"),
    )
    nombre: str | None = Field(
        default=None,
        min_length=1,
        max_length=200,
        validation_alias=AliasChoices("nombre", "full_name", "first_name"),
    )
    first_name: str | None = Field(
        default=None,
        min_length=1,
        max_length=100,
        validation_alias=AliasChoices("first_name", "nombre"),
    )
    last_name: str | None = Field(
        default=None,
        min_length=1,
        max_length=100,
        validation_alias=AliasChoices("last_name", "apellido", "apellidos"),
    )
    rut: str | None = Field(default=None, validation_alias=AliasChoices("rut", "rut_usuario"))
    telefono: str | None = Field(default=None, validation_alias=AliasChoices("telefono", "phone", "celular"))
    acepto_terminos: bool = Field(default=False, validation_alias=AliasChoices("acepto_terminos", "aceptoTerminos"))

    @field_validator("password")
    @classmethod
    def validate_password(cls, value: SecretStr) -> SecretStr:
        """Exige la misma política mínima de seguridad que el frontend."""
        # SecretStr protege la contraseña en representaciones y logs; solo se
        # revela aquí, durante la validación, para comprobar sus caracteres.
        password = value.get_secret_value()
        # Cada expresión regular busca una categoría obligatoria. Si falta una,
        # el backend rechaza el registro antes de comunicarse con Supabase.
        if not re.search(r"[A-Z]", password) or not re.search(r"[a-z]", password) or not re.search(r"\d", password):
            raise ValueError("La contraseña debe incluir mayúsculas, minúsculas y números")
        return value

    @field_validator("rut")
    @classmethod
    def validate_rut(cls, value: str | None) -> str | None:
        """Comprueba el dígito verificador antes de enviar el registro a Supabase."""
        if value is not None and not is_valid_chilean_rut(value):
            raise ValueError("RUT inválido: revisa el formato y el dígito verificador")
        return value.strip().upper() if value is not None else None

    @field_validator("telefono")
    @classmethod
    def validate_phone(cls, value: str | None) -> str | None:
        """Acepta únicamente números móviles chilenos en formato internacional."""
        if value is not None and not re.fullmatch(r"\+569\d{8}", value.strip()):
            raise ValueError("El teléfono debe tener el formato +569XXXXXXXX")
        return value.strip() if value is not None else None

    @model_validator(mode="after")
    def normalize_names(self) -> "RegisterRequest":
        """Completa first_name y last_name cuando el frontend manda un nombre completo."""
        # El frontend actual envía un nombre completo, pero los campos legacy
        # pueden enviar solo `first_name`; por eso elegimos el primer valor útil.
        source_name = self.nombre or self.first_name or ""
        if source_name:
            # Separar por espacios permite transformar "Ana Pérez Soto" en
            # `first_name="Ana"` y `last_name="Pérez Soto"`.
            parts = source_name.strip().split()
            if len(parts) >= 2:
                self.first_name = parts[0]
                self.last_name = " ".join(parts[1:])
            elif len(parts) == 1:
                self.first_name = parts[0]
                self.last_name = "Usuario"
        elif not self.first_name:
            self.first_name = "Usuario"
        if not self.last_name:
            self.last_name = "Usuario"
        if self.nombre is None and self.first_name:
            self.nombre = self.first_name
        # Validamos los valores ya normalizados para cubrir tanto `nombre` como
        # los campos separados y evitar que un alias salte la regla de nombres.
        self.nombre = validate_person_name(self.nombre, "El nombre")
        self.first_name = validate_person_name(self.first_name, "El nombre") or "Usuario"
        self.last_name = validate_person_name(self.last_name, "Los apellidos") or "Usuario"
        # La aceptación legal debe ser explícita; `False` o la ausencia del
        # campo tienen el mismo resultado: el registro no puede continuar.
        if not self.acepto_terminos:
            raise ValueError("Debes aceptar los términos y condiciones")
        return self


class LoginRequest(BaseModel):
    """Cuerpo esperado por el endpoint de inicio de sesión."""

    email: EmailStr
    password: SecretStr = Field(
        min_length=1,
        validation_alias=AliasChoices("password", "contraseña"),
    )


class PasswordRecoveryRequest(BaseModel):
    """Correo al que Supabase enviará un enlace de recuperación."""

    email: EmailStr


class PasswordResetRequest(BaseModel):
    """Nueva contraseña y confirmación para el enlace de recuperación."""

    password: SecretStr = Field(min_length=8)
    password_confirmation: SecretStr = Field(min_length=8)

    @field_validator("password")
    @classmethod
    def validate_password(cls, value: SecretStr) -> SecretStr:
        password = value.get_secret_value()
        if not re.search(r"[A-Z]", password) or not re.search(r"[a-z]", password) or not re.search(r"\d", password):
            raise ValueError("La contraseña debe incluir mayúsculas, minúsculas y números")
        return value

    @model_validator(mode="after")
    def passwords_match(self) -> "PasswordResetRequest":
        if self.password.get_secret_value() != self.password_confirmation.get_secret_value():
            raise ValueError("Las contraseñas no coinciden")
        return self


class AuthMessageResponse(BaseModel):
    """Mensaje público sin datos sensibles de la cuenta."""

    success: bool = True
    message: str


class AuthResponse(BaseModel):
    """Respuesta pública normalizada de Supabase Auth.

    Los campos opcionales cubren los dos casos: login con tokens inmediatos y
    registro que exige confirmar el correo antes de emitir tokens.
    """

    access_token: str | None = None
    refresh_token: str | None = None
    token_type: str = "bearer"
    expires_in: int | None = None
    user_id: str | None = None
    email: EmailStr | None = None
    first_name: str | None = None
    last_name: str | None = None
    rut: str | None = None
    telefono: str | None = None
    requires_email_confirmation: bool = False


class CurrentUserResponse(BaseModel):
    """Perfil mínimo devuelto para revalidar una sesión existente.

    `email_confirmed_at` permite que el cliente conozca el estado de confirmación
    sin exponer el objeto completo de `auth.users`. RUT y teléfono proceden de
    `user_metadata`, mientras no exista una tabla de perfil de negocio conectada.
    """

    user_id: str
    email: EmailStr
    first_name: str | None = None
    last_name: str | None = None
    rut: str | None = None
    telefono: str | None = None
    email_confirmed_at: str | None = None


class PasswordConfirmationRequest(RegisterRequest):
    """Modelo de registro que agrega confirmación para evitar errores de tipeo."""

    password_confirmation: SecretStr | None = Field(
        default=None,
        min_length=8,
        validation_alias=AliasChoices(
            "password_confirmation",
            "confirm_password",
            "confirmPassword",
            "confirmar_contraseña",
        ),
    )

    @model_validator(mode="after")
    def passwords_match(self) -> "PasswordConfirmationRequest":
        """Rechaza el registro si ambas contraseñas no son exactamente iguales."""
        if self.password_confirmation is None:
            return self
        if self.password.get_secret_value() != self.password_confirmation.get_secret_value():
            raise ValueError("Las contraseñas no coinciden")
        return self

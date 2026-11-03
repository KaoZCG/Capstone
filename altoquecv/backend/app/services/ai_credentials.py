from cryptography.fernet import Fernet, InvalidToken


class AICredentialEncryptionError(ValueError):
    pass


def _fernet(encryption_key: str | None) -> Fernet:
    if not encryption_key:
        raise AICredentialEncryptionError("Falta configurar AI_CREDENTIALS_ENCRYPTION_KEY.")
    try:
        return Fernet(encryption_key.encode("ascii"))
    except (ValueError, UnicodeEncodeError) as error:
        raise AICredentialEncryptionError("AI_CREDENTIALS_ENCRYPTION_KEY no tiene un formato Fernet válido.") from error


def encrypt_api_key(api_key: str, encryption_key: str | None) -> str:
    return _fernet(encryption_key).encrypt(api_key.encode("utf-8")).decode("ascii")


def decrypt_api_key(encrypted_api_key: str, encryption_key: str | None) -> str:
    try:
        return _fernet(encryption_key).decrypt(encrypted_api_key.encode("ascii")).decode("utf-8")
    except (InvalidToken, UnicodeEncodeError, UnicodeDecodeError) as error:
        raise AICredentialEncryptionError("No fue posible descifrar la credencial del proveedor de IA.") from error

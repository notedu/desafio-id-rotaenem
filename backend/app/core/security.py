"""Hash de senhas e criação/validação de tokens de acesso."""

from datetime import datetime, timedelta, timezone

import jwt
from jwt.exceptions import InvalidTokenError
from pwdlib import PasswordHash

from app.core.config import get_settings

JWT_ALGORITHM = "HS256"
password_hash = PasswordHash.recommended()


class AuthConfigurationError(RuntimeError):
    """Indica que a chave necessária para assinar tokens não foi configurada."""


def _get_signing_key() -> str:
    settings = get_settings()
    if settings.jwt_secret_key is None:
        raise AuthConfigurationError("JWT_SECRET_KEY não está configurada.")
    secret = settings.jwt_secret_key.get_secret_value()
    if len(secret.encode("utf-8")) < 32:
        raise AuthConfigurationError("JWT_SECRET_KEY deve ter pelo menos 32 bytes.")
    return secret


def hash_password(password: str) -> str:
    """Gera um hash Argon2id para persistir no PostgreSQL."""
    return password_hash.hash(password)


def verify_password(password: str, hashed_password: str) -> bool:
    """Compara uma senha recebida com o hash persistido."""
    return password_hash.verify(password, hashed_password)


def create_access_token(student_id: int) -> tuple[str, int]:
    """Assina um JWT com identificador do estudante e expiração configurada."""
    settings = get_settings()
    secret = _get_signing_key()

    expires_in = settings.jwt_access_token_expire_minutes * 60
    now = datetime.now(timezone.utc)
    payload = {
        "sub": str(student_id),
        "iat": now,
        "exp": now + timedelta(seconds=expires_in),
    }
    token = jwt.encode(
        payload,
        secret,
        algorithm=JWT_ALGORITHM,
    )
    return token, expires_in


def decode_access_token(token: str) -> int:
    """Valida assinatura e expiração, retornando o ID contido no token."""
    secret = _get_signing_key()

    payload = jwt.decode(
        token,
        secret,
        algorithms=[JWT_ALGORITHM],
        options={"require": ["sub", "iat", "exp"]},
    )
    subject = payload.get("sub")
    if not isinstance(subject, str) or not subject.isdecimal():
        raise InvalidTokenError("Identificador de estudante inválido.")

    student_id = int(subject)
    if student_id <= 0:
        raise InvalidTokenError("Identificador de estudante inválido.")
    return student_id

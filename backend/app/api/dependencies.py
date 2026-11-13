"""Dependências HTTP compartilhadas pelas rotas da API."""

import logging
from typing import Annotated

import psycopg
from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jwt.exceptions import InvalidTokenError

from app.core.security import AuthConfigurationError, decode_access_token
from app.db.postgres import get_db_connection
from app.services.auth import get_student

logger = logging.getLogger(__name__)
bearer_scheme = HTTPBearer(auto_error=False, scheme_name="BearerAuth")
DbConnection = Annotated[psycopg.Connection, Depends(get_db_connection)]


def get_mongo_contents_collection(request: Request):
    """Retorna a coleção configurada ou None quando MongoDB está desabilitado."""
    from app.core.config import get_settings

    client = getattr(request.app.state, "mongo_client", None)
    if client is None:
        return None
    settings = get_settings()
    return client[settings.mongodb_database][settings.mongodb_collection]


def get_current_student(
    credentials: Annotated[
        HTTPAuthorizationCredentials | None,
        Depends(bearer_scheme),
    ],
    connection: DbConnection,
) -> dict:
    """Valida o Bearer token e carrega o estudante do PostgreSQL."""
    unauthorized = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Token ausente, inválido ou expirado.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if credentials is None:
        raise unauthorized

    try:
        student_id = decode_access_token(credentials.credentials)
    except AuthConfigurationError:
        logger.exception("Autenticação indisponível: falta configurar JWT_SECRET_KEY.")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Autenticação indisponível. Configure JWT_SECRET_KEY no ambiente.",
        ) from None
    except InvalidTokenError:
        raise unauthorized from None

    student = get_student(connection, student_id)
    if student is None:
        raise unauthorized
    return student

"""Rotas de cadastro e autenticação do estudante."""

import logging
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status

from app.api.dependencies import DbConnection, get_current_student
from app.core.security import AuthConfigurationError, create_access_token
from app.schemas.auth import LoginRequest, StudentPublic, StudentRegister, TokenResponse
from app.services.auth import (
    EmailAlreadyRegisteredError,
    InvalidCredentialsError,
    authenticate_student,
    register_student,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/auth", tags=["Autenticação"])


@router.post(
    "/register",
    response_model=StudentPublic,
    status_code=status.HTTP_201_CREATED,
    summary="Cadastra um estudante",
)
def register(payload: StudentRegister, connection: DbConnection) -> dict:
    try:
        return register_student(connection, payload)
    except EmailAlreadyRegisteredError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Já existe uma conta com este e-mail.",
        ) from None


@router.post(
    "/login",
    response_model=TokenResponse,
    summary="Valida as credenciais e emite um token",
)
def login(payload: LoginRequest, connection: DbConnection) -> dict:
    try:
        student = authenticate_student(
            connection,
            str(payload.email),
            payload.senha.get_secret_value(),
        )
        token, expires_in = create_access_token(student["id"])
    except InvalidCredentialsError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="E-mail ou senha inválidos.",
            headers={"WWW-Authenticate": "Bearer"},
        ) from None
    except AuthConfigurationError:
        logger.exception("Autenticação indisponível: falta configurar JWT_SECRET_KEY.")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Autenticação indisponível. Configure JWT_SECRET_KEY no ambiente.",
        ) from None

    return {
        "access_token": token,
        "token_type": "bearer",
        "expires_in": expires_in,
        "estudante": student,
    }


@router.get(
    "/me",
    response_model=StudentPublic,
    summary="Retorna o estudante autenticado",
)
def read_current_student(
    current_student: Annotated[dict, Depends(get_current_student)],
) -> dict:
    return current_student

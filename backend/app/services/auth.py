"""Casos de uso de cadastro, login e identificação do estudante."""

import psycopg

from app.repositories import auth as auth_repository
from app.schemas.auth import StudentRegister
from app.core.security import hash_password, verify_password


class EmailAlreadyRegisteredError(Exception):
    """O e-mail já está associado a uma conta."""


class InvalidCredentialsError(Exception):
    """E-mail ou senha não correspondem a uma conta."""


def register_student(
    connection: psycopg.Connection,
    payload: StudentRegister,
) -> dict:
    """Cria estudante e hash de senha sem persistir a senha original."""
    student = auth_repository.create_student_with_credentials(
        connection,
        nome=payload.nome,
        email=str(payload.email),
        uf=payload.uf,
        senha_hash=hash_password(payload.senha.get_secret_value()),
    )
    if student is None:
        raise EmailAlreadyRegisteredError
    return student


def authenticate_student(connection: psycopg.Connection, email: str, password: str) -> dict:
    """Valida credenciais sem revelar se o e-mail está cadastrado."""
    student = auth_repository.get_student_auth_by_email(connection, email)
    if student is None or not verify_password(password, student["senha_hash"]):
        raise InvalidCredentialsError
    student.pop("senha_hash", None)
    return student


def get_student(connection: psycopg.Connection, student_id: int) -> dict | None:
    """Retorna o estudante associado ao identificador validado do token."""
    return auth_repository.get_student_by_id(connection, student_id)

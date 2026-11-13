"""Modelos de validação para cadastro e autenticação."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field, SecretStr, field_validator


class StudentRegister(BaseModel):
    model_config = ConfigDict(extra="forbid")

    nome: str = Field(min_length=2, max_length=100)
    email: EmailStr
    senha: SecretStr = Field(min_length=8, max_length=128)
    uf: str | None = Field(default=None, min_length=2, max_length=2)

    @field_validator("nome")
    @classmethod
    def normalize_name(cls, value: str) -> str:
        value = value.strip()
        if len(value) < 2:
            raise ValueError("Informe um nome com pelo menos 2 caracteres.")
        return value

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: EmailStr) -> str:
        return str(value).strip().lower()

    @field_validator("uf")
    @classmethod
    def normalize_state(cls, value: str | None) -> str | None:
        if value is None or not value.strip():
            return None
        normalized = value.strip().upper()
        if len(normalized) != 2 or not normalized.isalpha() or not normalized.isascii():
            raise ValueError("UF deve conter duas letras, como SP.")
        return normalized


class LoginRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    email: EmailStr
    senha: SecretStr = Field(min_length=1, max_length=128)

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: EmailStr) -> str:
        return str(value).strip().lower()


class StudentPublic(BaseModel):
    id: int
    nome: str
    email: EmailStr
    uf: str | None
    criado_em: datetime


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    estudante: StudentPublic

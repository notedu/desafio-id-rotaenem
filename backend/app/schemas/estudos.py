"""Modelos de entrada e saída para metas e simulados."""

from datetime import date, datetime
from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator

AreaSigla = Literal["MT", "CN", "CH", "LC", "RED"]
AREA_SIGLAS: tuple[AreaSigla, ...] = ("MT", "CN", "CH", "LC", "RED")
Nota = Annotated[float, Field(ge=0, le=1000)]


class MetaAreaInput(BaseModel):
    model_config = ConfigDict(extra="forbid")

    sigla: AreaSigla
    nota_alvo: Nota
    peso: float = Field(default=1, ge=0, le=10)


class MetaInput(BaseModel):
    model_config = ConfigDict(extra="forbid")

    curso: str = Field(min_length=1, max_length=100)
    nota_corte: Nota | None = None
    data_prova: date | None = None
    areas: list[MetaAreaInput] = Field(min_length=5, max_length=5)

    @field_validator("curso")
    @classmethod
    def normalize_course(cls, value: str) -> str:
        normalized = value.strip()
        if not normalized:
            raise ValueError("Informe o curso desejado.")
        return normalized

    @field_validator("areas")
    @classmethod
    def require_each_area_once(cls, value: list[MetaAreaInput]) -> list[MetaAreaInput]:
        codes = [area.sigla for area in value]
        if set(codes) != set(AREA_SIGLAS) or len(codes) != len(set(codes)):
            raise ValueError("Informe uma configuração para cada área: MT, CN, CH, LC e RED.")
        return value


class MetaAreaOutput(BaseModel):
    sigla: AreaSigla
    nome: str
    nota_alvo: float
    peso: float


class MetaOutput(BaseModel):
    id: int
    curso: str
    nota_corte: float | None
    data_prova: date | None
    criado_em: datetime
    areas: list[MetaAreaOutput]


class SimuladoInput(BaseModel):
    model_config = ConfigDict(extra="forbid")

    realizado_em: date
    descricao: str | None = Field(default=None, max_length=150)
    notas: dict[AreaSigla, Nota]

    @field_validator("descricao")
    @classmethod
    def normalize_description(cls, value: str | None) -> str | None:
        if value is None:
            return None
        normalized = value.strip()
        return normalized or None

    @field_validator("notas")
    @classmethod
    def require_each_area_once(cls, value: dict[AreaSigla, float]) -> dict[AreaSigla, float]:
        if set(value) != set(AREA_SIGLAS):
            raise ValueError("Informe uma nota para cada área: MT, CN, CH, LC e RED.")
        return value


class SimuladoOutput(BaseModel):
    id: int
    realizado_em: date
    descricao: str | None
    criado_em: datetime
    notas: dict[AreaSigla, float]

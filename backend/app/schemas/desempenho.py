"""Modelos de resposta para desempenho, comparativos e prioridades."""

from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel

from app.schemas.estudos import AreaSigla, MetaOutput


class SimulationSummary(BaseModel):
    id: int
    realizado_em: date
    descricao: str | None
    criado_em: datetime
    nota_media: float | None


class ReferenceSummary(BaseModel):
    disponivel: bool
    ano: int | None
    uf: str | None
    abrangencia: Literal["estadual", "nacional"] | None
    participantes: int | None
    mensagem: str | None


class PerformanceArea(BaseModel):
    sigla: AreaSigla
    nome: str
    nota_atual: float | None
    nota_alvo: float | None
    peso: float | None
    media_referencia: float | None
    diferenca_referencia: float | None
    diferenca_meta: float | None
    ganho_necessario: float | None
    prioridade: float | None


class PriorityItem(BaseModel):
    sigla: AreaSigla
    nome: str
    prioridade: float
    nota_atual: float
    nota_alvo: float
    peso: float
    ganho_necessario: float


class PerformanceOutput(BaseModel):
    meta: MetaOutput | None
    simulado_atual: SimulationSummary | None
    referencia: ReferenceSummary
    areas: list[PerformanceArea]
    ranking_prioridades: list[PriorityItem]

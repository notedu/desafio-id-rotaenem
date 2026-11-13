"""Contratos para geração e consulta do plano semanal."""

from datetime import date, datetime, time
from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

Weekday = Literal["SEG", "TER", "QUA", "QUI", "SEX", "SAB", "DOM"]


class GeneratePlanInput(BaseModel):
    model_config = ConfigDict(extra="forbid")

    semana_inicio: date | None = None
    horas_semanais: Annotated[float, Field(ge=0.5, le=40)]
    dias_disponiveis: list[Weekday] = Field(
        default_factory=lambda: ["SEG", "TER", "QUA", "QUI", "SEX"]
    )
    horario_inicio: time = time(9, 0)

    @field_validator("semana_inicio")
    @classmethod
    def require_monday(cls, value: date | None) -> date | None:
        if value is not None and value.weekday() != 0:
            raise ValueError("semana_inicio deve ser uma segunda-feira.")
        return value

    @field_validator("horas_semanais")
    @classmethod
    def require_half_hour_increment(cls, value: float) -> float:
        if round(value * 2) != value * 2:
            raise ValueError("horas_semanais deve usar incrementos de 0,5 hora.")
        return value

    @field_validator("dias_disponiveis")
    @classmethod
    def require_unique_days(cls, value: list[Weekday]) -> list[Weekday]:
        if not value or len(value) != len(set(value)):
            raise ValueError("Informe pelo menos um dia, sem repetições.")
        return value

    @field_validator("horario_inicio")
    @classmethod
    def require_half_hour_start(cls, value: time) -> time:
        if value.minute not in (0, 30) or value.second or value.microsecond:
            raise ValueError("horario_inicio deve estar em uma hora cheia ou meia hora.")
        return value

    @model_validator(mode="after")
    def cap_daily_study_hours(self) -> "GeneratePlanInput":
        if self.horas_semanais > 10 * len(self.dias_disponiveis):
            raise ValueError("O plano pode ter no máximo 10 horas por dia disponível.")
        return self


class StudyContent(BaseModel):
    id: str
    tipo: str | None
    titulo: str
    url: str | None
    fonte: str | None
    detalhe: str | None


class PlanSession(BaseModel):
    id: int
    data: date
    dia_semana: Weekday
    horario_inicio: time
    horas: float
    area_sigla: str
    area_nome: str
    topico_id: int | None
    topico_nome: str | None
    prioridade: float
    conteudo: StudyContent | None


class WeeklyPlanOutput(BaseModel):
    id: int
    semana_inicio: date
    semana_fim: date
    horas_semanais: float
    criado_em: datetime
    conteudos_disponiveis: bool
    mensagem_conteudos: str | None
    sessoes: list[PlanSession]



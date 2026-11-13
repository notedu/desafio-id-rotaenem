"""Rotas protegidas para geração e consulta do plano semanal."""

from datetime import date
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pymongo.collection import Collection

from app.api.dependencies import DbConnection, get_current_student, get_mongo_contents_collection
from app.schemas.plano import GeneratePlanInput, WeeklyPlanOutput
from app.services.planos import (
    PlanPrerequisitesError,
    StudyScheduleTimeError,
    WeeklyPlanNotFoundError,
    generate_student_plan,
    read_student_plan,
)

router = APIRouter(prefix="/planos", tags=["Plano semanal"])
CurrentStudent = Annotated[dict, Depends(get_current_student)]
MongoContentsCollection = Annotated[
    Collection | None,
    Depends(get_mongo_contents_collection),
]


@router.post(
    "/me/gerar",
    response_model=WeeklyPlanOutput,
    summary="Gera ou substitui o plano semanal do estudante autenticado",
)
def create_weekly_plan(
    payload: GeneratePlanInput,
    current_student: CurrentStudent,
    connection: DbConnection,
    contents: MongoContentsCollection,
) -> dict:
    try:
        return generate_student_plan(connection, current_student, contents, payload)
    except PlanPrerequisitesError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Cadastre uma meta e registre ao menos um simulado antes de gerar o plano.",
        ) from None
    except StudyScheduleTimeError:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="O horário de início não comporta as sessões planejadas até a meia-noite.",
        ) from None
    except WeeklyPlanNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="O plano foi salvo, mas não foi possível carregá-lo.",
        ) from None


@router.get(
    "/me",
    response_model=WeeklyPlanOutput,
    summary="Consulta o plano semanal do estudante autenticado",
)
def read_weekly_plan(
    current_student: CurrentStudent,
    connection: DbConnection,
    contents: MongoContentsCollection,
    semana_inicio: date | None = Query(default=None),
) -> dict:
    if semana_inicio is not None and semana_inicio.weekday() != 0:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="semana_inicio deve ser uma segunda-feira.",
        )
    try:
        return read_student_plan(
            connection,
            current_student["id"],
            contents,
            semana_inicio,
        )
    except WeeklyPlanNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Não há plano salvo para a semana solicitada.",
        ) from None

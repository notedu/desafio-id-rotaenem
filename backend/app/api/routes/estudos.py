"""Rotas protegidas para meta atual e simulados do estudante."""

from typing import Annotated

import psycopg
from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.api.dependencies import DbConnection, get_current_student
from app.schemas.estudos import MetaInput, MetaOutput, SimuladoInput, SimuladoOutput
from app.services.estudos import (
    StudyAreasNotConfiguredError,
    create_simulation,
    get_current_goal,
    list_simulations,
    save_current_goal,
)

router = APIRouter(tags=["Meta e simulados"])
CurrentStudent = Annotated[dict, Depends(get_current_student)]


@router.get(
    "/metas/me",
    response_model=MetaOutput,
    summary="Consulta a meta atual do estudante autenticado",
)
def read_current_goal(current_student: CurrentStudent, connection: DbConnection) -> dict:
    goal = get_current_goal(connection, current_student["id"])
    if goal is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ainda não há uma meta cadastrada para este estudante.",
        )
    return goal


@router.put(
    "/metas/me",
    response_model=MetaOutput,
    summary="Cria ou atualiza a meta atual do estudante autenticado",
)
def upsert_current_goal(
    payload: MetaInput,
    current_student: CurrentStudent,
    connection: DbConnection,
) -> dict:
    try:
        return save_current_goal(connection, current_student["id"], payload)
    except StudyAreasNotConfiguredError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="As áreas de conhecimento não estão cadastradas no banco.",
        ) from None


@router.post(
    "/simulados",
    response_model=SimuladoOutput,
    status_code=status.HTTP_201_CREATED,
    summary="Registra um simulado para o estudante autenticado",
)
def add_simulation(
    payload: SimuladoInput,
    current_student: CurrentStudent,
    connection: DbConnection,
) -> dict:
    try:
        return create_simulation(connection, current_student["id"], payload)
    except StudyAreasNotConfiguredError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="As áreas de conhecimento não estão cadastradas no banco.",
        ) from None


@router.get(
    "/simulados",
    response_model=list[SimuladoOutput],
    summary="Lista os simulados do estudante autenticado",
)
def read_simulations(
    current_student: CurrentStudent,
    connection: DbConnection,
    limit: int = Query(default=20, ge=1, le=100),
) -> list[dict]:
    return list_simulations(connection, current_student["id"], limit)

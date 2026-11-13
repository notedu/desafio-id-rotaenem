"""Endpoint protegido de desempenho, comparação e prioridades."""

from typing import Annotated

import psycopg
from fastapi import APIRouter, Depends

from app.api.dependencies import DbConnection, get_current_student
from app.schemas.desempenho import PerformanceOutput
from app.services.desempenho import get_student_performance

router = APIRouter(tags=["Desempenho"])
CurrentStudent = Annotated[dict, Depends(get_current_student)]


@router.get(
    "/desempenho/me",
    response_model=PerformanceOutput,
    summary="Compara notas, meta e referência do ENEM e calcula prioridades",
)
def read_student_performance(
    current_student: CurrentStudent,
    connection: DbConnection,
) -> dict:
    return get_student_performance(connection, current_student)

"""Rotas para verificar a disponibilidade da API e do PostgreSQL."""

import logging

import psycopg
from fastapi import APIRouter, Depends, HTTPException, status
from psycopg_pool import PoolTimeout

from app.db.postgres import get_db_connection

logger = logging.getLogger(__name__)
router = APIRouter(tags=["Saúde"])


@router.get("/health", summary="Verifica se a API está no ar")
def health_check() -> dict[str, str]:
    """Retorna sucesso quando o processo da API está respondendo."""
    return {"status": "ok"}


@router.get("/health/ready", summary="Verifica se a API pode acessar o PostgreSQL")
def readiness_check(
    connection: psycopg.Connection = Depends(get_db_connection),
) -> dict[str, str]:
    """Faz uma consulta leve para verificar a conexão com o banco."""
    try:
        connection.execute("SELECT 1").fetchone()
    except (psycopg.Error, PoolTimeout):
        logger.exception("Falha ao verificar a conexão com o PostgreSQL.")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={"status": "not_ready", "database": "unavailable"},
        ) from None

    return {"status": "ok", "database": "connected"}

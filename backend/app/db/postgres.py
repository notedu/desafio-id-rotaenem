"""Pool de conexões PostgreSQL e dependência para rotas FastAPI."""

from collections.abc import Generator

import psycopg
from fastapi import HTTPException, Request, status
from psycopg_pool import ConnectionPool, PoolTimeout


def get_db_connection(request: Request) -> Generator[psycopg.Connection, None, None]:
    """Disponibiliza uma conexão do pool durante uma requisição."""
    pool: ConnectionPool | None = getattr(request.app.state, "postgres_pool", None)
    if pool is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={"status": "not_ready", "database": "not_configured"},
        )

    try:
        with pool.connection(timeout=3) as connection:
            yield connection
    except (psycopg.Error, PoolTimeout):
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={"status": "not_ready", "database": "unavailable"},
        ) from None

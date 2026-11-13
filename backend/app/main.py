"""Ponto de entrada da API RotaENEM."""

from contextlib import asynccontextmanager
from typing import AsyncIterator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pymongo import MongoClient
from psycopg_pool import ConnectionPool

from app.api.routes.auth import router as auth_router
from app.api.routes.estudos import router as estudos_router
from app.api.routes.desempenho import router as desempenho_router
from app.api.routes.planos import router as planos_router
from app.api.routes.health import router as health_router
from app.core.config import get_settings

settings = get_settings()


@asynccontextmanager
async def lifespan(application: FastAPI) -> AsyncIterator[None]:
    """Abre o pool no início da API e fecha-o ao encerrar o processo."""
    pool: ConnectionPool | None = None
    if settings.database_url is not None:
        pool = ConnectionPool(
            conninfo=settings.database_url.get_secret_value(),
            min_size=1,
            max_size=5,
            timeout=3,
            open=False,
        )
        pool.open(wait=False)

    mongo_client: MongoClient | None = None
    if settings.mongodb_uri is not None:
        mongo_client = MongoClient(
            settings.mongodb_uri.get_secret_value(),
            serverSelectionTimeoutMS=3000,
        )

    application.state.postgres_pool = pool
    application.state.mongo_client = mongo_client
    try:
        yield
    finally:
        if pool is not None:
            pool.close()
        if mongo_client is not None:
            mongo_client.close()


app = FastAPI(
    title="RotaENEM API",
    description="API do plano de estudos inteligente com integração de dados.",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router)
app.include_router(auth_router)
app.include_router(estudos_router)
app.include_router(desempenho_router)
app.include_router(planos_router)

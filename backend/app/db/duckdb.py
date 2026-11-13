"""Abertura somente leitura do DuckDB usado nas estatísticas do ENEM."""

from pathlib import Path

import duckdb

from app.core.config import BACKEND_DIR, get_settings


class DuckDBUnavailableError(RuntimeError):
    """O arquivo ou as views do DuckDB necessários à análise não estão disponíveis."""


def open_duckdb_readonly() -> duckdb.DuckDBPyConnection:
    """Abre o banco analítico sem permitir que a API altere as cargas do Hop."""
    configured_path = get_settings().duckdb_path
    db_path = configured_path if configured_path.is_absolute() else BACKEND_DIR / configured_path
    db_path = Path(db_path)
    if not db_path.is_file():
        raise DuckDBUnavailableError(f"Arquivo DuckDB não encontrado: {db_path}")

    try:
        return duckdb.connect(str(db_path), read_only=True)
    except duckdb.Error as error:
        raise DuckDBUnavailableError("Não foi possível abrir o banco DuckDB.") from error

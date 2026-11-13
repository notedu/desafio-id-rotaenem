"""Consultas das médias de referência carregadas no DuckDB."""

import duckdb

from app.db.duckdb import DuckDBUnavailableError, open_duckdb_readonly

AREA_MEDIA_COLUNAS = {
    "MT": "media_mt",
    "CN": "media_cn",
    "CH": "media_ch",
    "LC": "media_lc",
    "RED": "media_red",
}


def get_latest_enem_reference(uf: str | None) -> dict | None:
    """Busca médias do último ano disponível, priorizando a UF e usando nacional como fallback."""
    connection = open_duckdb_readonly()
    try:
        latest_year = connection.execute(
            "SELECT MAX(ano) FROM enem_media_nacional_area"
        ).fetchone()[0]
        if latest_year is None:
            return None

        if uf:
            state_row = connection.execute(
                """
                SELECT ano, uf, media_cn, media_ch, media_lc, media_mt, media_red,
                       (SELECT COUNT(*) FROM enem_notas n WHERE n.ano = v.ano AND n.uf = v.uf) AS participantes
                FROM enem_media_uf_area AS v
                WHERE ano = ? AND uf = ?
                """,
                [latest_year, uf],
            ).fetchone()
            if state_row is not None:
                return _as_reference(state_row, "estadual")

        national_row = connection.execute(
            """
            SELECT ano, NULL AS uf, media_cn, media_ch, media_lc, media_mt, media_red,
                   (SELECT COUNT(*) FROM enem_notas n WHERE n.ano = v.ano) AS participantes
            FROM enem_media_nacional_area AS v
            WHERE ano = ?
            """,
            [latest_year],
        ).fetchone()
        return _as_reference(national_row, "nacional") if national_row is not None else None
    except duckdb.Error as error:
        raise DuckDBUnavailableError(
            "As tabelas ou views de referência do ENEM não estão disponíveis no DuckDB."
        ) from error
    finally:
        connection.close()


def _as_reference(row: tuple, abrangencia: str) -> dict:
    return {
        "ano": row[0],
        "uf": row[1],
        "abrangencia": abrangencia,
        "participantes": row[7],
        "medias": {
            "CN": row[2],
            "CH": row[3],
            "LC": row[4],
            "MT": row[5],
            "RED": row[6],
        },
    }

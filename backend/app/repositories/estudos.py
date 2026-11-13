"""Consultas PostgreSQL para metas, áreas e simulados."""

from typing import Any

import psycopg
from psycopg.rows import dict_row

from app.schemas.estudos import MetaInput, SimuladoInput


def _get_area_map(connection: psycopg.Connection) -> dict[str, dict[str, Any]]:
    with connection.cursor(row_factory=dict_row) as cursor:
        cursor.execute("SELECT id, sigla, nome FROM area_conhecimento")
        return {row["sigla"]: dict(row) for row in cursor.fetchall()}


def get_current_goal(connection: psycopg.Connection, student_id: int) -> dict | None:
    with connection.cursor(row_factory=dict_row) as cursor:
        cursor.execute(
            """
            SELECT id, curso, nota_corte, data_prova, criado_em
            FROM meta
            WHERE estudante_id = %s
            ORDER BY id DESC
            LIMIT 1
            """,
            (student_id,),
        )
        goal = cursor.fetchone()
        if goal is None:
            return None

        cursor.execute(
            """
            SELECT a.sigla, a.nome, ma.nota_alvo, ma.peso
            FROM meta_area AS ma
            JOIN area_conhecimento AS a ON a.id = ma.area_id
            WHERE ma.meta_id = %s
            ORDER BY CASE a.sigla
                WHEN 'MT' THEN 1 WHEN 'CN' THEN 2 WHEN 'CH' THEN 3
                WHEN 'LC' THEN 4 WHEN 'RED' THEN 5 ELSE 6
            END
            """,
            (goal["id"],),
        )
        goal["areas"] = [dict(row) for row in cursor.fetchall()]
    return dict(goal)


def get_knowledge_areas(connection: psycopg.Connection) -> list[dict]:
    """Lista as áreas de referência em ordem fixa do ENEM."""
    with connection.cursor(row_factory=dict_row) as cursor:
        cursor.execute(
            """
            SELECT id, sigla, nome
            FROM area_conhecimento
            ORDER BY CASE sigla
                WHEN 'MT' THEN 1 WHEN 'CN' THEN 2 WHEN 'CH' THEN 3
                WHEN 'LC' THEN 4 WHEN 'RED' THEN 5 ELSE 6
            END
            """
        )
        return [dict(row) for row in cursor.fetchall()]


def get_latest_simulation(connection: psycopg.Connection, student_id: int) -> dict | None:
    """Retorna o simulado mais recente do estudante com notas agrupadas por sigla."""
    with connection.cursor(row_factory=dict_row) as cursor:
        cursor.execute(
            """
            SELECT id, realizado_em, descricao, criado_em
            FROM simulado
            WHERE estudante_id = %s
            ORDER BY realizado_em DESC, id DESC
            LIMIT 1
            """,
            (student_id,),
        )
        simulation = cursor.fetchone()
        if simulation is None:
            return None

        cursor.execute(
            """
            SELECT a.sigla, ns.nota
            FROM nota_simulado AS ns
            JOIN area_conhecimento AS a ON a.id = ns.area_id
            WHERE ns.simulado_id = %s
            ORDER BY CASE a.sigla
                WHEN 'MT' THEN 1 WHEN 'CN' THEN 2 WHEN 'CH' THEN 3
                WHEN 'LC' THEN 4 WHEN 'RED' THEN 5 ELSE 6
            END
            """,
            (simulation["id"],),
        )
        simulation["notas"] = {row["sigla"]: row["nota"] for row in cursor.fetchall()}
    return dict(simulation)


def save_current_goal(
    connection: psycopg.Connection,
    student_id: int,
    payload: MetaInput,
) -> dict | None:
    """Cria ou atualiza a meta mais recente e seus pesos em uma transação."""
    with connection.transaction():
        with connection.cursor(row_factory=dict_row) as cursor:
            # Serializa alterações da meta do mesmo estudante, inclusive no primeiro cadastro.
            cursor.execute("SELECT id FROM estudante WHERE id = %s FOR UPDATE", (student_id,))
            if cursor.fetchone() is None:
                return None

            area_map = _get_area_map(connection)
            if any(area.sigla not in area_map for area in payload.areas):
                return None

            cursor.execute(
                "SELECT id FROM meta WHERE estudante_id = %s ORDER BY id DESC LIMIT 1",
                (student_id,),
            )
            current = cursor.fetchone()
            if current is None:
                cursor.execute(
                    """
                    INSERT INTO meta (estudante_id, curso, nota_corte, data_prova)
                    VALUES (%s, %s, %s, %s)
                    RETURNING id
                    """,
                    (student_id, payload.curso, payload.nota_corte, payload.data_prova),
                )
                meta_id = cursor.fetchone()["id"]
            else:
                meta_id = current["id"]
                cursor.execute(
                    """
                    UPDATE meta
                    SET curso = %s, nota_corte = %s, data_prova = %s
                    WHERE id = %s
                    """,
                    (payload.curso, payload.nota_corte, payload.data_prova, meta_id),
                )

            for area in payload.areas:
                cursor.execute(
                    """
                    INSERT INTO meta_area (meta_id, area_id, nota_alvo, peso)
                    VALUES (%s, %s, %s, %s)
                    ON CONFLICT (meta_id, area_id)
                    DO UPDATE SET nota_alvo = EXCLUDED.nota_alvo, peso = EXCLUDED.peso
                    """,
                    (meta_id, area_map[area.sigla]["id"], area.nota_alvo, area.peso),
                )

    return get_current_goal(connection, student_id)


def create_simulation(
    connection: psycopg.Connection,
    student_id: int,
    payload: SimuladoInput,
) -> dict | None:
    """Grava simulado e as cinco notas atomicamente."""
    with connection.transaction():
        area_map = _get_area_map(connection)
        if any(sigla not in area_map for sigla in payload.notas):
            return None

        with connection.cursor(row_factory=dict_row) as cursor:
            cursor.execute(
                """
                INSERT INTO simulado (estudante_id, realizado_em, descricao)
                VALUES (%s, %s, %s)
                RETURNING id, realizado_em, descricao, criado_em
                """,
                (student_id, payload.realizado_em, payload.descricao),
            )
            simulation = cursor.fetchone()
            for sigla, nota in payload.notas.items():
                cursor.execute(
                    """
                    INSERT INTO nota_simulado (simulado_id, area_id, nota)
                    VALUES (%s, %s, %s)
                    """,
                    (simulation["id"], area_map[sigla]["id"], nota),
                )
    simulation["notas"] = payload.notas
    return dict(simulation)


def list_simulations(
    connection: psycopg.Connection,
    student_id: int,
    limit: int,
) -> list[dict]:
    with connection.cursor(row_factory=dict_row) as cursor:
        cursor.execute(
            """
            SELECT s.id, s.realizado_em, s.descricao, s.criado_em,
                   a.sigla, ns.nota
            FROM simulado AS s
            JOIN nota_simulado AS ns ON ns.simulado_id = s.id
            JOIN area_conhecimento AS a ON a.id = ns.area_id
            WHERE s.estudante_id = %s
            ORDER BY s.realizado_em DESC, s.id DESC,
                     CASE a.sigla
                       WHEN 'MT' THEN 1 WHEN 'CN' THEN 2 WHEN 'CH' THEN 3
                       WHEN 'LC' THEN 4 WHEN 'RED' THEN 5 ELSE 6
                     END
            LIMIT %s
            """,
            (student_id, limit * 5),
        )
        rows = cursor.fetchall()

    simulations: dict[int, dict] = {}
    for row in rows:
        simulation = simulations.setdefault(
            row["id"],
            {
                "id": row["id"],
                "realizado_em": row["realizado_em"],
                "descricao": row["descricao"],
                "criado_em": row["criado_em"],
                "notas": {},
            },
        )
        simulation["notas"][row["sigla"]] = row["nota"]
    return list(simulations.values())[:limit]

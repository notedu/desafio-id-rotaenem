"""Persistência dos planos semanais no PostgreSQL."""

from datetime import date

import psycopg
from psycopg.rows import dict_row


def get_topics(connection: psycopg.Connection) -> list[dict]:
    with connection.cursor(row_factory=dict_row) as cursor:
        cursor.execute(
            """
            SELECT t.id, t.nome, t.termo_busca, a.id AS area_id,
                   a.sigla AS area_sigla, a.nome AS area_nome
            FROM topico_estudo AS t
            JOIN area_conhecimento AS a ON a.id = t.area_id
            ORDER BY a.sigla, t.id
            """
        )
        return [dict(row) for row in cursor.fetchall()]


def save_weekly_plan(
    connection: psycopg.Connection,
    student_id: int,
    week_start: date,
    sessions: list[dict],
) -> int:
    """Substitui o plano da semana em uma única transação."""
    with connection.transaction():
        with connection.cursor(row_factory=dict_row) as cursor:
            cursor.execute("SELECT id FROM estudante WHERE id = %s FOR UPDATE", (student_id,))
            if cursor.fetchone() is None:
                raise ValueError("Estudante não encontrado.")
            cursor.execute(
                """
                INSERT INTO plano_semanal (estudante_id, semana_inicio)
                VALUES (%s, %s)
                ON CONFLICT (estudante_id, semana_inicio)
                DO UPDATE SET criado_em = NOW()
                RETURNING id
                """,
                (student_id, week_start),
            )
            plan_id = cursor.fetchone()["id"]
            cursor.execute("DELETE FROM plano_item WHERE plano_id = %s", (plan_id,))
            cursor.executemany(
                """
                INSERT INTO plano_item (
                    plano_id, area_id, topico_id, horas, conteudo_ref,
                    prioridade, data_sessao, horario_inicio
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                """,
                [
                    (
                        plan_id,
                        session["area_id"],
                        session["topico_id"],
                        session["horas"],
                        session["conteudo_ref"],
                        session["prioridade"],
                        session["data"],
                        session["horario_inicio"],
                    )
                    for session in sessions
                ],
            )
    return plan_id


def get_weekly_plan(
    connection: psycopg.Connection,
    student_id: int,
    week_start: date,
) -> dict | None:
    with connection.cursor(row_factory=dict_row) as cursor:
        cursor.execute(
            """
            SELECT id, semana_inicio, criado_em
            FROM plano_semanal
            WHERE estudante_id = %s AND semana_inicio = %s
            """,
            (student_id, week_start),
        )
        plan = cursor.fetchone()
        if plan is None:
            return None
        cursor.execute(
            """
            SELECT pi.id, pi.data_sessao AS data, pi.horario_inicio,
                   pi.horas, pi.prioridade, pi.conteudo_ref, a.id AS area_id,
                   a.sigla AS area_sigla, a.nome AS area_nome,
                   t.id AS topico_id, t.nome AS topico_nome
            FROM plano_item AS pi
            JOIN area_conhecimento AS a ON a.id = pi.area_id
            LEFT JOIN topico_estudo AS t ON t.id = pi.topico_id
            WHERE pi.plano_id = %s
            ORDER BY pi.data_sessao, pi.horario_inicio, pi.id
            """,
            (plan["id"],),
        )
        plan["sessoes"] = [dict(row) for row in cursor.fetchall()]
    return dict(plan)

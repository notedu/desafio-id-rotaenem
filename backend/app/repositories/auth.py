"""Consultas PostgreSQL usadas pelo fluxo de autenticação."""

import psycopg
from psycopg.rows import dict_row


def create_student_with_credentials(
    connection: psycopg.Connection,
    *,
    nome: str,
    email: str,
    uf: str | None,
    senha_hash: str,
) -> dict | None:
    """Cria estudante e credencial atomicamente; retorna None para e-mail repetido."""
    with connection.transaction():
        with connection.cursor(row_factory=dict_row) as cursor:
            cursor.execute(
                """
                INSERT INTO estudante (nome, email, uf)
                VALUES (%s, %s, %s)
                ON CONFLICT (email) DO NOTHING
                RETURNING id, nome, email, uf, criado_em
                """,
                (nome, email, uf),
            )
            student = cursor.fetchone()
        if student is None:
            return None

        connection.execute(
            """
            INSERT INTO credencial_estudante (estudante_id, senha_hash)
            VALUES (%s, %s)
            """,
            (student["id"], senha_hash),
        )
    return dict(student)


def get_student_auth_by_email(connection: psycopg.Connection, email: str) -> dict | None:
    """Busca dados públicos e hash da senha para validar o login."""
    with connection.cursor(row_factory=dict_row) as cursor:
        cursor.execute(
            """
            SELECT e.id, e.nome, e.email, e.uf, e.criado_em, c.senha_hash
            FROM estudante AS e
            JOIN credencial_estudante AS c ON c.estudante_id = e.id
            WHERE e.email = %s
            """,
            (email,),
        )
        row = cursor.fetchone()
    return dict(row) if row is not None else None


def get_student_by_id(connection: psycopg.Connection, student_id: int) -> dict | None:
    """Busca o estudante atual para validar que a conta ainda existe."""
    with connection.cursor(row_factory=dict_row) as cursor:
        cursor.execute(
            """
            SELECT id, nome, email, uf, criado_em
            FROM estudante
            WHERE id = %s
            """,
            (student_id,),
        )
        row = cursor.fetchone()
    return dict(row) if row is not None else None

"""Verifica a conexão do projeto com o PostgreSQL do Neon.

Lê DATABASE_URL de backend/.env sem imprimir a credencial.
Execute a partir da raiz do repositório com:
    python backend/database/postgres/check_connection.py
"""

import os
import sys
from pathlib import Path

import psycopg
from dotenv import load_dotenv


BACKEND_DIR = Path(__file__).resolve().parents[2]
ENV_FILE = BACKEND_DIR / ".env"


def main() -> int:
    if not ENV_FILE.is_file():
        print(f"Arquivo de configuração não encontrado: {ENV_FILE}", file=sys.stderr)
        return 1

    load_dotenv(dotenv_path=ENV_FILE)
    database_url = os.getenv("DATABASE_URL")

    if not database_url:
        print("A variável DATABASE_URL não foi encontrada em backend/.env.", file=sys.stderr)
        return 1

    try:
        with psycopg.connect(database_url, connect_timeout=10) as connection:
            with connection.cursor() as cursor:
                cursor.execute(
                    """
                    SELECT
                        current_database(),
                        current_user,
                        current_setting('server_version'),
                        (
                            SELECT COUNT(*)
                            FROM information_schema.tables
                            WHERE table_schema = 'public'
                              AND table_type = 'BASE TABLE'
                        )
                    """
                )
                database, user, version, table_count = cursor.fetchone()

        print("Conexão com o PostgreSQL estabelecida com sucesso.")
        print(f"Banco: {database}")
        print(f"Usuário: {user}")
        print(f"Versão do PostgreSQL: {version}")
        print(f"Tabelas no schema public: {table_count}")
        return 0

    except psycopg.Error as error:
        # Usa só a mensagem principal do servidor; nunca mostra a URI/credencial.
        detail = getattr(getattr(error, "diag", None), "message_primary", None)
        print("Não foi possível conectar ao PostgreSQL do Neon.", file=sys.stderr)
        print(f"Detalhe: {detail or type(error).__name__}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())

from pathlib import Path

import duckdb

script_dir = Path(__file__).resolve().parent
db_path = script_dir / "enem.duckdb"
schema_path = script_dir / "schema.sql"

con = duckdb.connect(str(db_path))
con.execute(schema_path.read_text(encoding="utf-8"))

print(con.execute("SHOW TABLES").fetchall())
con.close()

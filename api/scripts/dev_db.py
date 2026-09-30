"""Start (or reuse) a local development Postgres with pgserver and print its URL.

Free and local; no Neon account needed for development or end-to-end tests.
Usage: uv run python scripts/dev_db.py
"""

from pathlib import Path

import pgserver  # pyright: ignore[reportMissingImports]

DATA_DIR = Path(__file__).resolve().parents[1] / ".pgdata-dev"

server = pgserver.get_server(str(DATA_DIR), cleanup_mode=None)  # keep running after exit
exists = server.psql("SELECT 1 FROM pg_database WHERE datname = 'buzzcrew_dev';")
if "1 row" not in exists:
    server.psql("CREATE DATABASE buzzcrew_dev;")
base = server.get_uri().rsplit("/", 1)[0]
print(f"{base}/buzzcrew_dev")

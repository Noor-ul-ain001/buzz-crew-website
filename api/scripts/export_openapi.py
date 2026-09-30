"""Print the OpenAPI schema without starting a server or touching a database.

Usage: uv run python scripts/export_openapi.py > ../web/lib/api/openapi.json
"""

import json
import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

# Placeholder settings: building the schema never connects to anything.
for key, value in {
    "DATABASE_URL": "postgresql://unused@localhost/unused",
    "CLIENT_URL": "http://localhost:3000",
    "RESEND_API_KEY": "unused",
    "EMAIL_FROM": "unused@example.com",
    "TEAM_NOTIFICATION_EMAIL": "unused@example.com",
    "IP_HASH_SALT": "unused-salt",
}.items():
    os.environ.setdefault(key, value)

from app.main import app  # noqa: E402

json.dump(app.openapi(), sys.stdout, indent=2)
sys.stdout.write("\n")

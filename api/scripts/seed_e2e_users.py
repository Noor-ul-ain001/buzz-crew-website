"""Create the two accounts the Playwright admin tests sign in with. Development only.

Usage: DATABASE_URL=<dev db> uv run python scripts/seed_e2e_users.py
Refuses to run against a Neon (production-like) database.
"""

import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from sqlmodel import Session  # noqa: E402

from app.core.database import get_engine  # noqa: E402
from app.core.security import hash_password  # noqa: E402
from app.models.user import User, UserRole, UserStatus  # noqa: E402
from app.services import auth_service  # noqa: E402

PASSWORD = "correct horse battery staple"  # noqa: S105 - local test accounts only
ACCOUNTS = [
    ("e2e-admin@example.com", "E2E Admin", UserRole.ADMIN),
    ("e2e-editor@example.com", "E2E Editor", UserRole.EDITOR),
]

if "neon.tech" in os.environ.get("DATABASE_URL", ""):
    sys.exit("Refusing to seed test accounts into a Neon database.")

with Session(get_engine()) as session:
    for email, name, role in ACCOUNTS:
        user = auth_service.find_user(session, email) or User(email=email, name=name, role=role)
        user.role = role
        user.status = UserStatus.ACTIVE
        user.password_hash = hash_password(PASSWORD)
        session.add(user)
    session.commit()
print("Seeded e2e-admin@example.com and e2e-editor@example.com")

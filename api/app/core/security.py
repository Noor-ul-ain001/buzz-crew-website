import hashlib
import secrets

from fastapi import Response
from pwdlib import PasswordHash
from pwdlib.hashers.argon2 import Argon2Hasher

from app.core.config import get_settings

# Argon2id with pwdlib's recommended parameters (research R4).
password_hash = PasswordHash((Argon2Hasher(),))

# Verifying against this for unknown emails keeps timing similar to real accounts.
_DUMMY_HASH = password_hash.hash("dummy-password-for-timing")


def hash_password(password: str) -> str:
    return password_hash.hash(password)


def verify_password(password: str, hashed: str | None) -> tuple[bool, str | None]:
    """Return (valid, new_hash_if_rehash_needed). Unknown users still pay the hashing cost."""
    if hashed is None:
        password_hash.verify(password, _DUMMY_HASH)
        return False, None
    valid, updated = password_hash.verify_and_update(password, hashed)
    return valid, updated


def new_token() -> str:
    return secrets.token_urlsafe(32)


def hash_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def set_session_cookie(response: Response, token: str) -> None:
    settings = get_settings()
    # Host-only cookie on the web domain via the same-origin rewrite (DEPLOYMENT D2).
    response.set_cookie(
        key=settings.session_cookie_name,
        value=token,
        httponly=True,
        secure=settings.session_cookie_secure,
        samesite="lax",
        path="/",
        max_age=settings.session_max_hours * 3600,
    )


def clear_session_cookie(response: Response) -> None:
    settings = get_settings()
    response.delete_cookie(
        key=settings.session_cookie_name,
        path="/",
        secure=settings.session_cookie_secure,
        httponly=True,
        samesite="lax",
    )

"""Password rules (FR-015): length and known-bad checks, no composition rules or expiry."""

import hashlib
from functools import lru_cache
from pathlib import Path

import httpx
import structlog

from app.core.config import get_settings

log = structlog.get_logger()

MIN_LENGTH = 12
MAX_LENGTH = 128
RULES_TEXT = (
    "Use at least 12 characters. Avoid common passwords, passwords found in data breaches, "
    "and anything based on your email address."
)
_COMMON_FILE = Path(__file__).resolve().parents[1] / "data" / "common_passwords.txt"


@lru_cache
def _common_passwords() -> frozenset[str]:
    lines = _COMMON_FILE.read_text(encoding="utf-8").splitlines()
    return frozenset(line.strip().lower() for line in lines if line and not line.startswith("#"))


def _is_breached(password: str) -> bool:
    """Have I Been Pwned range API (k-anonymity: only a 5-char SHA-1 prefix leaves us)."""
    digest = hashlib.sha1(password.encode("utf-8")).hexdigest().upper()  # noqa: S324
    prefix, suffix = digest[:5], digest[5:]
    try:
        response = httpx.get(
            f"https://api.pwnedpasswords.com/range/{prefix}",
            timeout=get_settings().hibp_timeout_seconds,
            headers={"Add-Padding": "true"},
        )
        response.raise_for_status()
    except httpx.HTTPError:
        log.warning("hibp_unavailable")
        return False  # Fail open after the local checks (research R4).
    for line in response.text.splitlines():
        hash_suffix, _, count = line.partition(":")
        if hash_suffix.strip() == suffix and count.strip() not in ("", "0"):
            return True
    return False


def check(password: str, email: str) -> list[str]:
    """Return human-readable problems; an empty list means the password is acceptable."""
    problems: list[str] = []
    if len(password) < MIN_LENGTH:
        problems.append("Use at least 12 characters.")
    if len(password) > MAX_LENGTH:
        problems.append("Use at most 128 characters.")
    local_part = email.split("@", 1)[0].lower()
    lowered = password.lower()
    # Very short local parts ("al", "new") match ordinary words, so only 4+ characters count.
    if email.lower() in lowered or (len(local_part) >= 4 and local_part in lowered):
        problems.append("Don't base your password on your email address.")
    # "password1234" is still "password": check the word with trailing digits/symbols removed.
    base = lowered.rstrip("0123456789!@#$%^&*.?_- ")
    if lowered in _common_passwords() or (len(base) >= 4 and base in _common_passwords()):
        problems.append("This password is too common. Choose something harder to guess.")
    if not problems and get_settings().hibp_enabled and _is_breached(password):
        problems.append("This password has appeared in a data breach. Choose a different one.")
    return problems

from collections.abc import Iterator
from functools import lru_cache

from sqlalchemy import Engine
from sqlmodel import Session, create_engine

from app.core.config import get_settings


def normalise_url(url: str) -> str:
    """Use the psycopg 3 driver whatever scheme the connection string was given with."""
    for prefix in ("postgresql+psycopg://", "postgresql://", "postgres://"):
        if url.startswith(prefix):
            return "postgresql+psycopg://" + url[len(prefix) :]
    return url


@lru_cache
def get_engine() -> Engine:
    # Small pool: Vercel Fluid compute reuses warm instances, and Neon's pooled endpoint
    # multiplexes connections (specs/DEPLOYMENT.md D8).
    return create_engine(
        normalise_url(get_settings().database_url),
        pool_size=1,
        max_overflow=2,
        pool_pre_ping=True,
    )


def get_session() -> Iterator[Session]:
    with Session(get_engine()) as session:
        yield session

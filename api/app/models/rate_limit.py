from datetime import datetime

from sqlalchemy import CHAR, Column, DateTime, Integer, String
from sqlmodel import Field, SQLModel


class RateLimitHit(SQLModel, table=True):
    """Fixed-window counters shared by every function instance (specs/DEPLOYMENT.md D3)."""

    __tablename__ = "rate_limit_hits"  # pyright: ignore[reportAssignmentType]

    key_hash: str = Field(sa_column=Column(CHAR(64), primary_key=True))
    kind: str = Field(sa_column=Column(String(40), primary_key=True))
    window_start: datetime = Field(sa_column=Column(DateTime(timezone=True), primary_key=True))
    count: int = Field(sa_column=Column(Integer, nullable=False, server_default="0"))

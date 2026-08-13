"""SQLAlchemy engine, sessions, and schema initialization helpers."""

from __future__ import annotations

from collections.abc import Generator
from pathlib import Path

from sqlalchemy import Engine, create_engine, event
from sqlalchemy.engine import make_url
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from .config import database_url


class Base(DeclarativeBase):
    """Base class for all ORM models."""


def _enable_sqlite_foreign_keys(dbapi_connection: object, _: object) -> None:
    cursor = dbapi_connection.cursor()  # type: ignore[attr-defined]
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()


def create_database_engine(url: str | None = None) -> Engine:
    """Create a SQLite engine with foreign-key enforcement enabled."""
    resolved_url = url or database_url()
    parsed_url = make_url(resolved_url)
    if parsed_url.drivername.startswith("sqlite") and parsed_url.database not in (None, ":memory:"):
        Path(parsed_url.database).parent.mkdir(parents=True, exist_ok=True)

    connect_args = {"check_same_thread": False} if parsed_url.drivername.startswith("sqlite") else {}
    engine = create_engine(resolved_url, connect_args=connect_args)
    if parsed_url.drivername.startswith("sqlite"):
        event.listen(engine, "connect", _enable_sqlite_foreign_keys)
    return engine


engine = create_database_engine()
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, expire_on_commit=False)


def get_session() -> Generator[Session, None, None]:
    """FastAPI-ready session dependency for later API routes."""
    with SessionLocal() as session:
        yield session


def create_schema(target_engine: Engine | None = None) -> None:
    """Create all tables if they do not already exist."""
    # Importing models registers every mapped table on Base.metadata.
    from . import models  # noqa: F401

    Base.metadata.create_all(target_engine or engine)

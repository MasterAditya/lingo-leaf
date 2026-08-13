"""Runtime configuration for the backend."""

from __future__ import annotations

import os
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_DATABASE_PATH = PROJECT_ROOT / "data" / "german_a1.db"


def database_url() -> str:
    """Return the configured SQLite URL, creating no files as a side effect."""
    return os.environ.get("DATABASE_URL", f"sqlite:///{DEFAULT_DATABASE_PATH.as_posix()}")

"""Command-line schema initialization without importing course content."""

from __future__ import annotations

import argparse

from .database import create_database_engine, create_schema, database_url


def main() -> None:
    parser = argparse.ArgumentParser(description="Initialize the German A1 SQLite schema.")
    parser.add_argument("--database-url", default=database_url())
    args = parser.parse_args()
    create_schema(create_database_engine(args.database_url))
    print(f"Initialized database schema at {args.database_url}")


if __name__ == "__main__":
    main()

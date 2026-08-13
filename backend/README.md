# Backend foundation

This phase contains the FastAPI application shell, SQLAlchemy/SQLite models, password-hashing primitives, and approved German A1 seed content. It deliberately does not expose product API routes or an authentication flow yet.

## Setup

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements-dev.txt
```

## Initialize and seed

The seed command creates the SQLite schema if needed and idempotently imports only records marked `"approved": true` in the structured JSON seed file.

```powershell
python -m backend.app.init_db
python -m backend.app.seed
```

By default this creates `data/german_a1.db`. To target a separate database:

```powershell
python -m backend.app.seed --database-url sqlite:///./data/dev.db
```

## Run checks

```powershell
python -m pytest
python -m ruff check .
```

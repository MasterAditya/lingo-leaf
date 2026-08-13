"""FastAPI application entry point for the backend foundation."""

from fastapi import FastAPI

from .database import create_schema

app = FastAPI(title="German A1 Foundations API")


@app.on_event("startup")
def initialize_database() -> None:
    create_schema()


@app.get("/health")
def health_check() -> dict[str, str]:
    return {"status": "ok"}

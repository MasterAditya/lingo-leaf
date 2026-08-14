"""FastAPI application entry point for the backend foundation."""

from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .api import router
from .database import create_schema, create_database_engine
from .seed import seed_database


@asynccontextmanager
async def lifespan(_: FastAPI):
    create_schema()
    # Seed the database with approved German A1 content
    engine = create_database_engine()
    seed_database(engine)
    yield


app = FastAPI(title="German A1 Foundations API", lifespan=lifespan)

# Configure CORS for frontend-backend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "https://lingo-leaf.vercel.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)


@app.exception_handler(HTTPException)
async def http_error_handler(_: Request, exc: HTTPException) -> JSONResponse:
    detail = exc.detail if isinstance(exc.detail, dict) else {"code": "HTTP_ERROR", "message": str(exc.detail)}
    return JSONResponse(status_code=exc.status_code, content={"error": detail})


@app.exception_handler(Exception)
async def unexpected_error_handler(_: Request, exc: Exception) -> JSONResponse:
    # FastAPI's HTTP and validation exceptions are handled by their dedicated handlers below.
    return JSONResponse(
        status_code=500, content={"error": {"code": "INTERNAL_ERROR", "message": "An unexpected error occurred."}}
    )


@app.exception_handler(RequestValidationError)
async def validation_error_handler(_: Request, exc: RequestValidationError) -> JSONResponse:
    return JSONResponse(
        status_code=422,
        content={
            "error": {"code": "VALIDATION_ERROR", "message": "Request validation failed.", "details": exc.errors()}
        },
    )


@app.get("/health")
def health_check() -> dict[str, str]:
    return {"status": "ok"}

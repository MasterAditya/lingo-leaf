"""Cookie-session authentication helpers backed by the existing sessions table."""

from __future__ import annotations

import secrets
from datetime import datetime, timedelta, timezone

from fastapi import Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from .database import get_session
from .models import SessionRecord, User

SESSION_COOKIE_NAME = "german_a1_session"
SESSION_LIFETIME = timedelta(days=7)


def utcnow() -> datetime:
    """Return a UTC timestamp compatible with the existing naive SQLite DateTime columns."""
    return datetime.now(timezone.utc).replace(tzinfo=None)


def create_session(db: Session, user: User) -> SessionRecord:
    """Create a server-side session whose opaque token is placed in an HTTP-only cookie."""
    record = SessionRecord(
        session_token=secrets.token_urlsafe(32),
        user_id=user.id,
        expires_at=utcnow() + SESSION_LIFETIME,
    )
    db.add(record)
    db.flush()
    return record


def current_user_optional(request: Request, db: Session = Depends(get_session)) -> User | None:
    """Return the authenticated user, if the request has a valid active cookie session."""
    token = request.cookies.get(SESSION_COOKIE_NAME)
    if not token:
        return None
    record = db.scalar(
        select(SessionRecord).where(
            SessionRecord.session_token == token,
            SessionRecord.revoked.is_(False),
        )
    )
    if record is None or record.expires_at is None or record.expires_at <= utcnow():
        return None
    return record.user


def require_current_user(user: User | None = Depends(current_user_optional)) -> User:
    """Require a valid authenticated user for learner-state mutations and reads."""
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication is required.")
    return user

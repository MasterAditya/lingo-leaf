"""Product-level FastAPI routes for approved course content and learner state."""

from __future__ import annotations

import os
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from pydantic import BaseModel
from sqlalchemy import select, func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from .auth import SESSION_COOKIE_NAME, SESSION_LIFETIME, create_session, current_user_optional, require_current_user
from .database import get_session
from .learning import complete_lesson, is_lesson_unlocked, is_skill_unlocked, public_payload, record_attempt
from .models import Attempt, Exercise, Lesson, LessonProgress, SessionRecord, Skill, SkillProgress, Unit, User
from .security import hash_password, verify_password

router = APIRouter(prefix="/api")
# Default to secure cookies for production HTTPS, but allow override for local HTTP development
COOKIE_SECURE = os.environ.get("SESSION_COOKIE_SECURE", "true").lower() == "true"


class RegisterRequest(BaseModel):
    email: str
    password: str
    display_name: str | None = None


class LoginRequest(BaseModel):
    email: str
    password: str


class AttemptRequest(BaseModel):
    response: Any


class CompletionRequest(BaseModel):
    summary: dict[str, Any] | None = None


def _error(status_code: int, code: str, message: str) -> HTTPException:
    return HTTPException(status_code=status_code, detail={"code": code, "message": message})


def _unit_data(unit: Unit) -> dict[str, Any]:
    return {
        "id": unit.id,
        "slug": unit.slug,
        "title": unit.title,
        "description": unit.description,
        "sort_order": unit.sort_order,
    }


def _skill_data(db: Session, skill: Skill, user: User | None) -> dict[str, Any]:
    data: dict[str, Any] = {
        "id": skill.id,
        "slug": skill.slug,
        "title": skill.title,
        "description": skill.description,
        "sort_order": skill.sort_order,
        "unlocked": is_skill_unlocked(db, user, skill.id),
    }
    if user is not None:
        progress = db.scalar(
            select(SkillProgress).where(SkillProgress.user_id == user.id, SkillProgress.skill_id == skill.id)
        )
        if progress is not None:
            data["progress"] = {"xp": progress.xp, "mastered": progress.mastered}
    return data


def _lesson_data(lesson: Lesson, user: User | None = None, db: Session | None = None) -> dict[str, Any]:
    data: dict[str, Any] = {
        "id": lesson.id,
        "content_id": lesson.content_id,
        "title": lesson.title,
        "sort_order": lesson.sort_order,
        "hearts_allowed": lesson.hearts_allowed,
        "xp_reward": lesson.xp_reward,
    }
    if user is not None and db is not None:
        from .learning import is_lesson_unlocked
        data["unlocked"] = is_lesson_unlocked(db, user, lesson)
    return data


def _progress_data(db: Session, user: User) -> dict[str, Any]:
    skills = list(
        db.scalars(select(SkillProgress).where(SkillProgress.user_id == user.id).order_by(SkillProgress.skill_id))
    )
    lessons = list(
        db.scalars(select(LessonProgress).where(LessonProgress.user_id == user.id).order_by(LessonProgress.lesson_id))
    )
    return {
        "user_id": user.id,
        "xp": user.xp,
        "streak_count": user.streak_count,
        "gems": user.gems,
        "daily_xp": user.daily_xp,
        "daily_goal_target": user.daily_goal_target,
        "last_active": user.last_active,
        "skills": [{"skill_id": item.skill_id, "xp": item.xp, "mastered": item.mastered} for item in skills],
        "lessons": [
            {
                "lesson_id": item.lesson_id,
                "completed": item.completed,
                "attempts_count": item.attempts_count,
                "hearts_remaining": item.hearts_remaining,
            }
            for item in lessons
        ],
    }


@router.post("/auth/register", status_code=status.HTTP_201_CREATED)
def register(body: RegisterRequest, response: Response, db: Session = Depends(get_session)) -> dict[str, Any]:
    if not body.email or "@" not in body.email or not body.password or len(body.password.encode("utf-8")) > 72:
        raise _error(
            status.HTTP_422_UNPROCESSABLE_ENTITY,
            "INVALID_REGISTRATION",
            "A valid email and a password of at most 72 bytes are required.",
        )
    user = User(
        email=body.email.strip().lower(), password_hash=hash_password(body.password), display_name=body.display_name
    )
    db.add(user)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise _error(
            status.HTTP_409_CONFLICT, "EMAIL_ALREADY_REGISTERED", "That email is already registered."
        ) from None
    session_record = create_session(db, user)
    db.commit()
    response.set_cookie(
        SESSION_COOKIE_NAME,
        session_record.session_token,
        httponly=True,
        samesite="lax",
        secure=COOKIE_SECURE,
        max_age=int(SESSION_LIFETIME.total_seconds()),
        path="/",
    )
    return {"user": {"id": user.id, "display_name": user.display_name}}


@router.post("/auth/login")
def login(body: LoginRequest, response: Response, db: Session = Depends(get_session)) -> dict[str, Any]:
    user = db.scalar(select(User).where(User.email == body.email.strip().lower()))
    if user is None or not verify_password(body.password, user.password_hash):
        raise _error(status.HTTP_401_UNAUTHORIZED, "INVALID_CREDENTIALS", "Email or password is incorrect.")
    session_record = create_session(db, user)
    db.commit()
    response.set_cookie(
        SESSION_COOKIE_NAME,
        session_record.session_token,
        httponly=True,
        samesite="lax",
        secure=COOKIE_SECURE,
        max_age=int(SESSION_LIFETIME.total_seconds()),
        path="/",
    )
    return {"user": {"id": user.id, "display_name": user.display_name}}


@router.post("/auth/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(
    request: Request,
    response: Response,
    _: User = Depends(require_current_user),
    db: Session = Depends(get_session),
) -> Response:
    token = request.cookies.get(SESSION_COOKIE_NAME)
    if token:
        record = db.scalar(select(SessionRecord).where(SessionRecord.session_token == token))
        if record is not None:
            record.revoked = True
    db.commit()
    response.delete_cookie(SESSION_COOKIE_NAME, samesite="lax", secure=COOKIE_SECURE, path="/")
    return response


@router.get("/auth/me")
def get_current_user(user: User = Depends(require_current_user)) -> dict[str, Any]:
    """Return the current authenticated user's information."""
    return {"id": user.id, "display_name": user.display_name}


@router.get("/units")
def list_units(db: Session = Depends(get_session)) -> dict[str, Any]:
    units = list(db.scalars(select(Unit).order_by(Unit.sort_order, Unit.id)))
    return {"units": [_unit_data(unit) for unit in units]}


@router.get("/units/{unit_id}/skills")
def list_skills(
    unit_id: int,
    db: Session = Depends(get_session),
    user: User | None = Depends(current_user_optional),
) -> dict[str, Any]:
    if db.get(Unit, unit_id) is None:
        raise _error(status.HTTP_404_NOT_FOUND, "UNIT_NOT_FOUND", "Unit not found.")
    skills = list(db.scalars(select(Skill).where(Skill.unit_id == unit_id).order_by(Skill.sort_order, Skill.id)))
    return {"skills": [_skill_data(db, skill, user) for skill in skills]}


@router.get("/skills/{skill_id}/lessons")
def list_lessons(
    skill_id: int,
    db: Session = Depends(get_session),
    user: User | None = Depends(current_user_optional),
) -> dict[str, Any]:
    skill = db.get(Skill, skill_id)
    if skill is None:
        raise _error(status.HTTP_404_NOT_FOUND, "SKILL_NOT_FOUND", "Skill not found.")
    if user is not None and not is_skill_unlocked(db, user, skill.id):
        raise _error(status.HTTP_403_FORBIDDEN, "SKILL_LOCKED", "Complete the previous skill to unlock this one.")
    lessons = list(db.scalars(select(Lesson).where(Lesson.skill_id == skill.id).order_by(Lesson.sort_order, Lesson.id)))
    return {"lessons": [_lesson_data(lesson, user, db) for lesson in lessons]}


@router.get("/lessons/{lesson_id}")
def get_lesson(
    lesson_id: int,
    db: Session = Depends(get_session),
    user: User | None = Depends(current_user_optional),
) -> dict[str, Any]:
    lesson = db.get(Lesson, lesson_id)
    if lesson is None:
        raise _error(status.HTTP_404_NOT_FOUND, "LESSON_NOT_FOUND", "Lesson not found.")
    if user is not None and not is_skill_unlocked(db, user, lesson.skill_id):
        raise _error(status.HTTP_403_FORBIDDEN, "SKILL_LOCKED", "Complete the previous skill to unlock this one.")
    if user is not None and not is_lesson_unlocked(db, user, lesson):
        raise _error(status.HTTP_403_FORBIDDEN, "LESSON_LOCKED", "Complete the previous lesson to unlock this one.")
    exercises = sorted(lesson.exercises, key=lambda item: (item.sort_order or 0, item.id))
    return {
        "lesson": {
            **_lesson_data(lesson, user, db),
            "exercises": [
                {
                    "id": exercise.id,
                    "content_id": exercise.content_id,
                    "type": exercise.type,
                    "prompt": exercise.prompt,
                    "payload": public_payload(exercise),
                }
                for exercise in exercises
            ],
        }
    }


@router.post("/exercises/{exercise_id}/attempt")
def submit_attempt(
    exercise_id: int,
    body: AttemptRequest,
    db: Session = Depends(get_session),
    user: User = Depends(require_current_user),
) -> dict[str, Any]:
    exercise = db.get(Exercise, exercise_id)
    if exercise is None:
        raise _error(status.HTTP_404_NOT_FOUND, "EXERCISE_NOT_FOUND", "Exercise not found.")
    if not is_skill_unlocked(db, user, exercise.lesson.skill_id):
        raise _error(status.HTTP_403_FORBIDDEN, "SKILL_LOCKED", "Complete the previous skill to unlock this one.")
    try:
        correct, xp_awarded, progress = record_attempt(db, user, exercise, body.response)
    except ValueError as error:
        if str(error) == "LESSON_ALREADY_COMPLETED":
            raise _error(
                status.HTTP_409_CONFLICT, "LESSON_ALREADY_COMPLETED", "This lesson is already complete."
            ) from None
        raise _error(status.HTTP_409_CONFLICT, "LESSON_OUT_OF_HEARTS", "No hearts remain for this lesson.") from None
    db.commit()
    payload = exercise.payload or {}
    return {
        "result": "correct" if correct else "incorrect",
        "xp_awarded": xp_awarded,
        "correct_answers": payload.get("correct_answers", []),
        "user_hearts_remaining": progress.hearts_remaining,
        "explanation": payload.get("explanation"),
        "progress": _progress_data(db, user),
    }


@router.post("/lessons/{lesson_id}/complete")
def finish_lesson(
    lesson_id: int,
    _: CompletionRequest,
    db: Session = Depends(get_session),
    user: User = Depends(require_current_user),
) -> dict[str, Any]:
    lesson = db.get(Lesson, lesson_id)
    if lesson is None:
        raise _error(status.HTTP_404_NOT_FOUND, "LESSON_NOT_FOUND", "Lesson not found.")
    if not is_skill_unlocked(db, user, lesson.skill_id):
        raise _error(status.HTTP_403_FORBIDDEN, "SKILL_LOCKED", "Complete the previous skill to unlock this one.")
    completed, progress, skill_completed = complete_lesson(db, user, lesson)
    db.commit()
    return {
        "lesson_completed": completed,
        "xp_total": sum(
            item.xp_awarded or 0
            for item in db.scalars(
                select(Attempt).where(
                    Attempt.user_id == user.id,
                    Attempt.exercise_id.in_([exercise.id for exercise in lesson.exercises]),
                )
            )
        ),
        "next_skill_unlocked": skill_completed,
        "user_hearts_remaining": progress.hearts_remaining,
        "progress": _progress_data(db, user),
    }


@router.get("/users/{user_id}/progress")
def get_progress(
    user_id: int, db: Session = Depends(get_session), user: User = Depends(require_current_user)
) -> dict[str, Any]:
    if user.id != user_id:
        raise _error(status.HTTP_403_FORBIDDEN, "PROGRESS_FORBIDDEN", "You may only view your own progress.")
    return _progress_data(db, user)


@router.get("/users/{user_id}/mistakes")
def get_mistakes(
    user_id: int, db: Session = Depends(get_session), user: User = Depends(require_current_user)
) -> dict[str, Any]:
    """Get incorrect attempts for practice review."""
    if user.id != user_id:
        raise _error(status.HTTP_403_FORBIDDEN, "MISTAKES_FORBIDDEN", "You may only view your own mistakes.")
    
    # Get incorrect attempts with exercise details
    mistakes = list(
        db.scalars(
            select(Attempt)
            .where(Attempt.user_id == user.id, Attempt.correct == False)
            .order_by(Attempt.created_at.desc())
            .limit(50)
        )
    )
    
    mistake_data = []
    for attempt in mistakes:
        exercise = attempt.exercise
        if exercise:
            payload = exercise.payload or {}
            mistake_data.append({
                "attempt_id": attempt.id,
                "exercise_id": exercise.id,
                "exercise_type": exercise.type,
                "prompt": exercise.prompt,
                "user_answer": attempt.raw_response,
                "correct_answers": payload.get("correct_answers", []),
                "explanation": payload.get("explanation"),
                "created_at": attempt.created_at.isoformat(),
            })
    
    return {"mistakes": mistake_data}


@router.get("/users/{user_id}/vocabulary")
def get_learned_vocabulary(
    user_id: int, db: Session = Depends(get_session), user: User = Depends(require_current_user)
) -> dict[str, Any]:
    """Get vocabulary from completed lessons for practice."""
    if user.id != user_id:
        raise _error(status.HTTP_403_FORBIDDEN, "VOCABULARY_FORBIDDEN", "You may only view your own vocabulary.")
    
    # Get completed lesson IDs
    completed_lesson_ids = [
        lp.lesson_id
        for lp in db.scalars(
            select(LessonProgress).where(LessonProgress.user_id == user.id, LessonProgress.completed == True)
        )
    ]
    
    if not completed_lesson_ids:
        return {"vocabulary": []}
    
    # Get vocabulary from exercises in completed lessons
    from .models import Vocabulary, exercise_vocabulary
    from sqlalchemy import and_
    
    vocab_items = list(
        db.scalars(
            select(Vocabulary)
            .join(exercise_vocabulary, Vocabulary.id == exercise_vocabulary.c.vocabulary_id)
            .join(Exercise, exercise_vocabulary.c.exercise_id == Exercise.id)
            .where(Exercise.lesson_id.in_(completed_lesson_ids))
            .distinct()
        )
    )
    
    vocabulary_data = [
        {
            "id": v.id,
            "german": v.german,
            "english_meaning": v.english_meaning,
            "article": v.article,
            "plural": v.plural,
            "category": v.category,
            "example_german": v.example_german,
            "example_english": v.example_english,
        }
        for v in vocab_items
    ]
    
    return {"vocabulary": vocabulary_data}


@router.get("/users/{user_id}/practice-exercises")
def get_practice_exercises(
    user_id: int, db: Session = Depends(get_session), user: User = Depends(require_current_user)
) -> dict[str, Any]:
    """Get mixed exercises from completed lessons for quick practice."""
    if user.id != user_id:
        raise _error(status.HTTP_403_FORBIDDEN, "PRACTICE_FORBIDDEN", "You may only view your own practice exercises.")
    
    # Get completed lesson IDs
    completed_lesson_ids = [
        lp.lesson_id
        for lp in db.scalars(
            select(LessonProgress).where(LessonProgress.user_id == user.id, LessonProgress.completed == True)
        )
    ]
    
    if not completed_lesson_ids:
        return {"exercises": []}
    
    # Get exercises from completed lessons (limit to 20 for practice session)
    exercises = list(
        db.scalars(
            select(Exercise)
            .where(Exercise.lesson_id.in_(completed_lesson_ids))
            .order_by(func.random())
            .limit(20)
        )
    )
    
    exercises_data = [
        {
            "id": ex.id,
            "content_id": ex.content_id,
            "type": ex.type,
            "prompt": ex.prompt,
            "payload": public_payload(ex),
            "lesson_id": ex.lesson_id,
        }
        for ex in exercises
    ]
    
    return {"exercises": exercises_data}

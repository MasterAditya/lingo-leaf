"""Authoritative exercise validation and learner-progress rules."""

from __future__ import annotations

import json
import unicodedata
from datetime import date, datetime, timedelta, timezone
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from .models import Attempt, Exercise, Lesson, LessonProgress, SkillProgress, User


def utcnow() -> datetime:
    """Return a UTC timestamp compatible with the existing naive SQLite DateTime columns."""
    return datetime.now(timezone.utc).replace(tzinfo=None)


def normalize_text(value: str) -> str:
    """Normalize typed answers without replacing German diacritics or ß."""
    return " ".join(unicodedata.normalize("NFC", value).strip().split()).casefold()


def _response_text(response: Any) -> str | None:
    if isinstance(response, str):
        return response
    if isinstance(response, list) and all(isinstance(item, str) for item in response):
        return " ".join(response)
    return None


def _matching_response(response: Any) -> dict[str, str] | None:
    if isinstance(response, dict) and all(
        isinstance(left, str) and isinstance(right, str) for left, right in response.items()
    ):
        return {normalize_text(left): normalize_text(right) for left, right in response.items()}
    if isinstance(response, list):
        pairs: dict[str, str] = {}
        for item in response:
            if (
                not isinstance(item, dict)
                or not isinstance(item.get("left"), str)
                or not isinstance(item.get("right"), str)
            ):
                return None
            pairs[normalize_text(item["left"])] = normalize_text(item["right"])
        return pairs
    return None


def validate_response(exercise: Exercise, response: Any) -> tuple[bool, str | None]:
    """Validate a learner response against the approved exercise payload."""
    payload = exercise.payload or {}
    if exercise.type == "matching":
        submitted = _matching_response(response)
        pairs = payload.get("pairs", [])
        expected = {
            normalize_text(pair["left"]): normalize_text(pair["right"])
            for pair in pairs
            if isinstance(pair, dict) and isinstance(pair.get("left"), str) and isinstance(pair.get("right"), str)
        }
        if submitted is None or not expected:
            return False, None
        return submitted == expected, json.dumps(submitted, ensure_ascii=False, sort_keys=True)

    text = _response_text(response)
    if text is None:
        return False, None
    normalized = normalize_text(text)
    answers = [*payload.get("correct_answers", []), *payload.get("accepted_answers", [])]
    accepted = {normalize_text(answer) for answer in answers if isinstance(answer, str)}
    return normalized in accepted, normalized


def public_payload(exercise: Exercise) -> dict[str, Any]:
    """Return exercise data needed for rendering without disclosing answer keys."""
    payload = dict(exercise.payload or {})
    for key in ("correct_answers", "accepted_answers", "blanks", "explanation"):
        payload.pop(key, None)
    if exercise.type == "matching" and isinstance(payload.get("pairs"), list):
        pairs = payload.pop("pairs")
        left_items = [pair["left"] for pair in pairs if isinstance(pair, dict) and isinstance(pair.get("left"), str)]
        right_items = [pair["right"] for pair in pairs if isinstance(pair, dict) and isinstance(pair.get("right"), str)]
        payload["left_items"] = left_items
        payload["right_items"] = sorted(right_items, key=str.casefold)
    if exercise.type == "word_bank" and isinstance(payload.get("tokens"), list):
        tokens = payload.pop("tokens")
        payload["words"] = [token for token in tokens if isinstance(token, str)]
    return payload


def get_or_start_lesson_progress(db: Session, user: User, lesson: Lesson) -> LessonProgress:
    progress = db.scalar(
        select(LessonProgress).where(LessonProgress.user_id == user.id, LessonProgress.lesson_id == lesson.id)
    )
    if progress is None:
        progress = LessonProgress(
            user_id=user.id,
            lesson_id=lesson.id,
            completed=False,
            attempts_count=0,
            hearts_remaining=lesson.hearts_allowed,
        )
        db.add(progress)
        db.flush()
    elif progress.hearts_remaining is None and not progress.completed:
        progress.hearts_remaining = lesson.hearts_allowed
    return progress


def exercise_xp(lesson: Lesson) -> int:
    count = max(1, len(lesson.exercises))
    return max(1, lesson.xp_reward // count)


def get_current_hearts(user: User) -> tuple[int, datetime]:
    """Calculate current hearts with regeneration based on elapsed time.
    
    Returns:
        Tuple of (current_hearts, last_heart_update_at)
    """
    now = utcnow()
    last_update = user.last_heart_update_at
    
    # Calculate elapsed time in minutes
    elapsed_minutes = int((now - last_update).total_seconds() / 60)
    
    # Calculate how many complete 30-minute intervals have passed
    hearts_to_add = elapsed_minutes // 30
    
    if hearts_to_add > 0:
        # Add regenerated hearts, cap at 5
        new_hearts = min(5, user.current_hearts + hearts_to_add)
        
        # Update last update time to account for partial intervals
        # If we added 2 hearts (60 minutes), we keep the remaining partial time
        minutes_used = hearts_to_add * 30
        user.last_heart_update_at = last_update + timedelta(minutes=minutes_used)
        user.current_hearts = new_hearts
        
        return new_hearts, user.last_heart_update_at
    
    return user.current_hearts, last_update


def consume_heart(user: User) -> bool:
    """Consume one heart if available.
    
    Returns:
        True if heart was consumed, False if no hearts available
    """
    current_hearts, _ = get_current_hearts(user)
    
    if current_hearts <= 0:
        return False
    
    user.current_hearts = max(0, current_hearts - 1)
    user.last_heart_update_at = utcnow()
    return True


def record_activity_and_xp(user: User, xp_awarded: int) -> None:
    today = date.today()
    if user.last_daily_reset != today:
        user.daily_xp = 0
        user.last_daily_reset = today
    if user.last_active != today:
        if user.last_active == today - timedelta(days=1):
            user.streak_count += 1
        else:
            user.streak_count = 1
        user.last_active = today
    user.xp += xp_awarded
    user.daily_xp += xp_awarded


def record_attempt(db: Session, user: User, exercise: Exercise, response: Any) -> tuple[bool, int, LessonProgress]:
    """Persist an attempt and apply the minimum XP/hearts rules exactly once per correct exercise."""
    lesson = exercise.lesson
    progress = get_or_start_lesson_progress(db, user, lesson)
    if progress.completed:
        raise ValueError("LESSON_ALREADY_COMPLETED")
    
    # Check user's current hearts before allowing attempt
    current_hearts, _ = get_current_hearts(user)
    if current_hearts <= 0:
        raise ValueError("OUT_OF_HEARTS")

    correct, normalized = validate_response(exercise, response)
    prior_correct = db.scalar(
        select(Attempt.id).where(
            Attempt.user_id == user.id,
            Attempt.exercise_id == exercise.id,
            Attempt.correct.is_(True),
        )
    )
    xp_awarded = exercise_xp(lesson) if correct and prior_correct is None else 0
    raw_response = response if isinstance(response, str) else json.dumps(response, ensure_ascii=False, sort_keys=True)
    db.add(
        Attempt(
            user_id=user.id,
            exercise_id=exercise.id,
            correct=correct,
            raw_response=raw_response,
            normalized_response=normalized,
            xp_awarded=xp_awarded,
        )
    )
    progress.attempts_count += 1
    progress.last_attempt = utcnow()
    
    # Consume heart on incorrect answer
    if not correct:
        consume_heart(user)
    elif xp_awarded:
        skill_progress = db.scalar(
            select(SkillProgress).where(SkillProgress.user_id == user.id, SkillProgress.skill_id == lesson.skill_id)
        )
        if skill_progress is None:
            skill_progress = SkillProgress(user_id=user.id, skill_id=lesson.skill_id, xp=0, mastered=False)
            db.add(skill_progress)
        skill_progress.xp += xp_awarded
        skill_progress.last_practiced = utcnow()
        record_activity_and_xp(user, xp_awarded)
    db.flush()
    return correct, xp_awarded, progress


def complete_lesson(db: Session, user: User, lesson: Lesson) -> tuple[bool, LessonProgress, bool]:
    """Complete only when every exercise has a persisted correct attempt."""
    progress = get_or_start_lesson_progress(db, user, lesson)
    if progress.completed:
        return True, progress, False
    exercise_ids = [exercise.id for exercise in lesson.exercises]
    completed_exercise_ids = set(
        db.scalars(
            select(Attempt.exercise_id).where(
                Attempt.user_id == user.id,
                Attempt.exercise_id.in_(exercise_ids),
                Attempt.correct.is_(True),
            )
        )
    )
    if set(exercise_ids) != completed_exercise_ids:
        return False, progress, False

    progress.completed = True
    progress.last_completed_at = utcnow()
    all_lessons = list(db.scalars(select(Lesson).where(Lesson.skill_id == lesson.skill_id)))
    completed_lesson_ids = set(
        db.scalars(
            select(LessonProgress.lesson_id).where(
                LessonProgress.user_id == user.id,
                LessonProgress.completed.is_(True),
            )
        )
    )
    skill_completed = all(item.id in completed_lesson_ids or item.id == lesson.id for item in all_lessons)
    if skill_completed:
        skill_progress = db.scalar(
            select(SkillProgress).where(SkillProgress.user_id == user.id, SkillProgress.skill_id == lesson.skill_id)
        )
        if skill_progress is None:
            skill_progress = SkillProgress(user_id=user.id, skill_id=lesson.skill_id, xp=0, mastered=False)
            db.add(skill_progress)
        skill_progress.mastered = True
        skill_progress.last_practiced = utcnow()
    db.flush()
    return True, progress, skill_completed


def is_skill_unlocked(db: Session, user: User | None, skill_id: int) -> bool:
    """First seeded skill is available; later skills follow a mastered predecessor."""
    if user is None:
        return True
    from .models import Skill

    skills = list(db.scalars(select(Skill).order_by(Skill.unit_id, Skill.sort_order, Skill.id)))
    index = next((position for position, skill in enumerate(skills) if skill.id == skill_id), None)
    if index is None:
        return False
    if index == 0:
        return True
    predecessor = skills[index - 1]
    return bool(
        db.scalar(
            select(SkillProgress.id).where(
                SkillProgress.user_id == user.id,
                SkillProgress.skill_id == predecessor.id,
                SkillProgress.mastered.is_(True),
            )
        )
    )


def is_lesson_unlocked(db: Session, user: User | None, lesson: Lesson) -> bool:
    """First lesson in a skill is available if skill is unlocked; later lessons require previous lesson completion."""
    if user is None:
        return True
    if not is_skill_unlocked(db, user, lesson.skill_id):
        return False
    from .models import Lesson as LessonModel

    lessons = list(
        db.scalars(
            select(LessonModel)
            .where(LessonModel.skill_id == lesson.skill_id)
            .order_by(LessonModel.sort_order, LessonModel.id)
        )
    )
    index = next((position for position, lesson_item in enumerate(lessons) if lesson_item.id == lesson.id), None)
    if index is None:
        return False
    if index == 0:
        return True
    predecessor = lessons[index - 1]
    return bool(
        db.scalar(
            select(LessonProgress.lesson_id).where(
                LessonProgress.user_id == user.id,
                LessonProgress.lesson_id == predecessor.id,
                LessonProgress.completed.is_(True),
            )
        )
    )

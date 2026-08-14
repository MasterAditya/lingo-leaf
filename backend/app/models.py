"""Persistent domain models defined in docs/DATABASE.md."""

from __future__ import annotations

from datetime import date, datetime
from typing import Any

from sqlalchemy import (
    JSON,
    Boolean,
    Column,
    Date,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    Table,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base

exercise_vocabulary = Table(
    "exercise_vocabulary",
    Base.metadata,
    Column("exercise_id", ForeignKey("exercises.id"), primary_key=True),
    Column("vocabulary_id", ForeignKey("vocabulary.id"), primary_key=True),
)

exercise_grammar_topics = Table(
    "exercise_grammar_topics",
    Base.metadata,
    Column("exercise_id", ForeignKey("exercises.id"), primary_key=True),
    Column("grammar_topic_id", ForeignKey("grammar_topics.id"), primary_key=True),
)


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(320), unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    display_name: Mapped[str | None] = mapped_column(String(100))
    gems: Mapped[int] = mapped_column(Integer, nullable=False, default=0, server_default="0")
    xp: Mapped[int] = mapped_column(Integer, nullable=False, default=0, server_default="0")
    streak_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0, server_default="0")
    daily_goal_target: Mapped[int] = mapped_column(Integer, nullable=False, default=10, server_default="10")
    daily_xp: Mapped[int] = mapped_column(Integer, nullable=False, default=0, server_default="0")
    last_daily_reset: Mapped[date | None] = mapped_column(Date)
    last_active: Mapped[date | None] = mapped_column(Date)
    current_hearts: Mapped[int] = mapped_column(Integer, nullable=False, default=5, server_default="5")
    last_heart_update_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, server_default=func.current_timestamp())
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, server_default=func.current_timestamp())

    attempts: Mapped[list[Attempt]] = relationship(back_populates="user")
    skill_progress: Mapped[list[SkillProgress]] = relationship(back_populates="user")
    lesson_progress: Mapped[list[LessonProgress]] = relationship(back_populates="user")
    sessions: Mapped[list[SessionRecord]] = relationship(back_populates="user")
    password_resets: Mapped[list["PasswordReset"]] = relationship(back_populates="user")


class Unit(Base):
    __tablename__ = "units"

    id: Mapped[int] = mapped_column(primary_key=True)
    slug: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    sort_order: Mapped[int | None] = mapped_column(Integer)

    skills: Mapped[list[Skill]] = relationship(back_populates="unit")


class Skill(Base):
    __tablename__ = "skills"

    id: Mapped[int] = mapped_column(primary_key=True)
    unit_id: Mapped[int] = mapped_column(ForeignKey("units.id"), nullable=False)
    slug: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    sort_order: Mapped[int | None] = mapped_column(Integer)

    unit: Mapped[Unit] = relationship(back_populates="skills")
    lessons: Mapped[list[Lesson]] = relationship(back_populates="skill")
    progress: Mapped[list[SkillProgress]] = relationship(back_populates="skill")


class Lesson(Base):
    __tablename__ = "lessons"

    id: Mapped[int] = mapped_column(primary_key=True)
    content_id: Mapped[str] = mapped_column(String(150), unique=True, nullable=False)
    skill_id: Mapped[int] = mapped_column(ForeignKey("skills.id"), nullable=False)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    sort_order: Mapped[int | None] = mapped_column(Integer)
    hearts_allowed: Mapped[int] = mapped_column(Integer, nullable=False, default=5, server_default="5")
    xp_reward: Mapped[int] = mapped_column(Integer, nullable=False, default=10, server_default="10")

    skill: Mapped[Skill] = relationship(back_populates="lessons")
    exercises: Mapped[list[Exercise]] = relationship(back_populates="lesson")
    progress: Mapped[list[LessonProgress]] = relationship(back_populates="lesson")


class Exercise(Base):
    __tablename__ = "exercises"

    id: Mapped[int] = mapped_column(primary_key=True)
    content_id: Mapped[str] = mapped_column(String(150), unique=True, nullable=False)
    lesson_id: Mapped[int] = mapped_column(ForeignKey("lessons.id"), nullable=False)
    type: Mapped[str] = mapped_column(String(50), nullable=False)
    prompt: Mapped[str] = mapped_column(Text, nullable=False)
    payload: Mapped[dict[str, Any] | None] = mapped_column(JSON)
    sort_order: Mapped[int | None] = mapped_column(Integer)
    difficulty: Mapped[str | None] = mapped_column(String(20))

    lesson: Mapped[Lesson] = relationship(back_populates="exercises")
    attempts: Mapped[list[Attempt]] = relationship(back_populates="exercise")
    vocabulary_items: Mapped[list[Vocabulary]] = relationship(secondary=exercise_vocabulary, back_populates="exercises")
    grammar_topics: Mapped[list[GrammarTopic]] = relationship(
        secondary=exercise_grammar_topics, back_populates="exercises"
    )


class Vocabulary(Base):
    __tablename__ = "vocabulary"

    id: Mapped[int] = mapped_column(primary_key=True)
    content_id: Mapped[str] = mapped_column(String(150), unique=True, nullable=False)
    german: Mapped[str] = mapped_column(String(200), nullable=False)
    english_meaning: Mapped[str] = mapped_column(String(300), nullable=False)
    article: Mapped[str | None] = mapped_column(String(20))
    plural: Mapped[str | None] = mapped_column(String(200))
    category: Mapped[str | None] = mapped_column(String(100))
    cefr_level: Mapped[str] = mapped_column(String(10), nullable=False, default="A1", server_default="A1")
    example_german: Mapped[str | None] = mapped_column(Text)
    example_english: Mapped[str | None] = mapped_column(Text)

    exercises: Mapped[list[Exercise]] = relationship(secondary=exercise_vocabulary, back_populates="vocabulary_items")


class GrammarTopic(Base):
    __tablename__ = "grammar_topics"

    id: Mapped[int] = mapped_column(primary_key=True)
    content_id: Mapped[str] = mapped_column(String(150), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    explanation: Mapped[str] = mapped_column(Text, nullable=False)
    cefr_level: Mapped[str] = mapped_column(String(10), nullable=False, default="A1", server_default="A1")
    example_data: Mapped[dict[str, Any] | None] = mapped_column(JSON)

    exercises: Mapped[list[Exercise]] = relationship(secondary=exercise_grammar_topics, back_populates="grammar_topics")


class Attempt(Base):
    __tablename__ = "attempts"
    __table_args__ = (Index("ix_attempts_user_exercise_created", "user_id", "exercise_id", "created_at"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    exercise_id: Mapped[int] = mapped_column(ForeignKey("exercises.id"), nullable=False)
    correct: Mapped[bool | None] = mapped_column(Boolean)
    raw_response: Mapped[str | None] = mapped_column(Text)
    normalized_response: Mapped[str | None] = mapped_column(Text)
    xp_awarded: Mapped[int | None] = mapped_column(Integer)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, server_default=func.current_timestamp())

    user: Mapped[User] = relationship(back_populates="attempts")
    exercise: Mapped[Exercise] = relationship(back_populates="attempts")


class SkillProgress(Base):
    __tablename__ = "skill_progress"
    __table_args__ = (UniqueConstraint("user_id", "skill_id", name="uq_skill_progress_user_skill"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    skill_id: Mapped[int] = mapped_column(ForeignKey("skills.id"), nullable=False)
    xp: Mapped[int] = mapped_column(Integer, nullable=False, default=0, server_default="0")
    mastered: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default="0")
    last_practiced: Mapped[datetime | None] = mapped_column(DateTime)

    user: Mapped[User] = relationship(back_populates="skill_progress")
    skill: Mapped[Skill] = relationship(back_populates="progress")


class LessonProgress(Base):
    __tablename__ = "lesson_progress"
    __table_args__ = (UniqueConstraint("user_id", "lesson_id", name="uq_lesson_progress_user_lesson"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    lesson_id: Mapped[int] = mapped_column(ForeignKey("lessons.id"), nullable=False)
    completed: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default="0")
    attempts_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0, server_default="0")
    hearts_remaining: Mapped[int | None] = mapped_column(Integer)
    last_attempt: Mapped[datetime | None] = mapped_column(DateTime)
    last_completed_at: Mapped[datetime | None] = mapped_column(DateTime)

    user: Mapped[User] = relationship(back_populates="lesson_progress")
    lesson: Mapped[Lesson] = relationship(back_populates="progress")


class Asset(Base):
    __tablename__ = "assets"

    id: Mapped[int] = mapped_column(primary_key=True)
    key: Mapped[str | None] = mapped_column(String(255), unique=True)
    type: Mapped[str | None] = mapped_column(String(50))
    path: Mapped[str | None] = mapped_column(String(500))
    duration_ms: Mapped[int | None] = mapped_column(Integer)


class SessionRecord(Base):
    __tablename__ = "sessions"

    id: Mapped[int] = mapped_column(primary_key=True)
    session_token: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, server_default=func.current_timestamp())
    expires_at: Mapped[datetime | None] = mapped_column(DateTime)
    revoked: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default="0")

    user: Mapped[User] = relationship(back_populates="sessions")


class PasswordReset(Base):
    __tablename__ = "password_resets"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    token: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, server_default=func.current_timestamp())
    expires_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    used: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default="0")

    user: Mapped[User] = relationship(back_populates="password_resets")

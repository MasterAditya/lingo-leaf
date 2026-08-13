from __future__ import annotations

from sqlalchemy import inspect
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from backend.app.database import create_database_engine, create_schema
from backend.app.models import (
    Exercise,
    GrammarTopic,
    Lesson,
    LessonProgress,
    Skill,
    SkillProgress,
    Unit,
    User,
    Vocabulary,
)
from backend.app.security import hash_password, verify_password


def test_schema_creation_includes_documented_tables(tmp_path) -> None:
    engine = create_database_engine(f"sqlite:///{tmp_path / 'foundation.db'}")
    create_schema(engine)

    assert set(inspect(engine).get_table_names()) == {
        "assets",
        "attempts",
        "exercises",
        "exercise_grammar_topics",
        "exercise_vocabulary",
        "grammar_topics",
        "lesson_progress",
        "lessons",
        "sessions",
        "skill_progress",
        "skills",
        "units",
        "users",
        "vocabulary",
    }


def test_course_and_progress_relationships_and_constraints(tmp_path) -> None:
    engine = create_database_engine(f"sqlite:///{tmp_path / 'relationships.db'}")
    create_schema(engine)
    with Session(engine) as session:
        user = User(email="learner@example.test", password_hash=hash_password("correct horse battery staple"))
        unit = Unit(slug="test-unit", title="Test unit", sort_order=1)
        skill = Skill(unit=unit, slug="test-skill", title="Test skill", sort_order=1)
        lesson = Lesson(skill=skill, title="Test lesson", sort_order=1)
        lesson.content_id = "lesson-test"
        exercise = Exercise(
            lesson=lesson,
            content_id="exercise-test",
            type="type_answer",
            prompt="Type hello",
            sort_order=1,
        )
        vocabulary = Vocabulary(content_id="vocab-test", german="Hallo", english_meaning="hello")
        grammar_topic = GrammarTopic(content_id="grammar-test", name="Test topic", explanation="Test explanation")
        exercise.vocabulary_items.append(vocabulary)
        exercise.grammar_topics.append(grammar_topic)
        session.add_all([user, unit, skill, lesson, exercise])
        session.commit()

        assert exercise.lesson.skill.unit.slug == "test-unit"
        assert exercise.content_id == "exercise-test"
        assert exercise.vocabulary_items == [vocabulary]
        assert exercise.grammar_topics == [grammar_topic]
        assert verify_password("correct horse battery staple", user.password_hash)
        assert not verify_password("wrong password", user.password_hash)

        session.add(SkillProgress(user_id=user.id, skill_id=skill.id))
        session.add(LessonProgress(user_id=user.id, lesson_id=lesson.id))
        session.commit()

        session.add(SkillProgress(user_id=user.id, skill_id=skill.id))
        try:
            session.commit()
        except IntegrityError:
            session.rollback()
        else:
            raise AssertionError("skill progress must be unique per user and skill")

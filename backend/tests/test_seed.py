from __future__ import annotations

import json

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from backend.app.database import create_database_engine
from backend.app.models import Exercise, GrammarTopic, Lesson, Skill, Unit, Vocabulary
from backend.app.seed import SEED_FILE, seed_database


def _counts(engine) -> tuple[int, int, int, int, int, int]:
    with Session(engine) as session:
        return tuple(
            session.scalar(select(func.count(model.id)))
            for model in (Unit, Skill, Lesson, Exercise, Vocabulary, GrammarTopic)
        )


def test_seed_is_deterministic_and_contains_required_exercise_types(tmp_path) -> None:
    engine = create_database_engine(f"sqlite:///{tmp_path / 'seed.db'}")
    seed_database(engine)
    first_counts = _counts(engine)
    seed_database(engine)

    assert _counts(engine) == first_counts == (1, 2, 2, 6, 4, 1)
    with Session(engine) as session:
        exercise_types = set(session.scalars(select(Exercise.type)))
        translation = session.scalar(
            select(Exercise).where(Exercise.content_id == "exercise-introductions-name-translation")
        )
        assert translation is not None
        vocabulary_content_ids = [item.content_id for item in translation.vocabulary_items]
        grammar_content_ids = [topic.content_id for topic in translation.grammar_topics]
    assert {"multiple_choice", "word_bank", "matching", "fill_blank", "type_answer"} <= exercise_types
    assert vocabulary_content_ids == ["vocab-heissen"]
    assert grammar_content_ids == ["grammar-heissen-present"]


def test_seed_skips_unapproved_content(tmp_path) -> None:
    data = json.loads(SEED_FILE.read_text(encoding="utf-8"))
    data["units"][0]["skills"][1]["approved"] = False
    seed_file = tmp_path / "reviewed-content.json"
    seed_file.write_text(json.dumps(data), encoding="utf-8")
    engine = create_database_engine(f"sqlite:///{tmp_path / 'approved-only.db'}")

    seed_database(engine, seed_file)

    assert _counts(engine) == (1, 1, 1, 5, 4, 1)


def test_stable_content_ids_survive_sort_order_changes(tmp_path) -> None:
    engine = create_database_engine(f"sqlite:///{tmp_path / 'stable-ids.db'}")
    seed_database(engine)
    with Session(engine) as session:
        original_lesson_id = session.scalar(
            select(Lesson.id).where(Lesson.content_id == "lesson-foundations-greetings-hello")
        )
        original_exercise_id = session.scalar(
            select(Exercise.id).where(Exercise.content_id == "exercise-greetings-hello-choice")
        )

    data = json.loads(SEED_FILE.read_text(encoding="utf-8"))
    data["units"][0]["skills"][0]["lessons"][0]["sort_order"] = 99
    data["units"][0]["skills"][0]["lessons"][0]["exercises"][0]["sort_order"] = 99
    seed_file = tmp_path / "reordered-content.json"
    seed_file.write_text(json.dumps(data), encoding="utf-8")
    seed_database(engine, seed_file)

    with Session(engine) as session:
        lesson = session.scalar(select(Lesson).where(Lesson.content_id == "lesson-foundations-greetings-hello"))
        exercise = session.scalar(select(Exercise).where(Exercise.content_id == "exercise-greetings-hello-choice"))
    assert lesson is not None and lesson.id == original_lesson_id and lesson.sort_order == 99
    assert exercise is not None and exercise.id == original_exercise_id and exercise.sort_order == 99

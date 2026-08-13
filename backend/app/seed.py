"""Deterministic import of approved German A1 course content."""

from __future__ import annotations

import argparse
import json
from collections.abc import Mapping
from pathlib import Path
from typing import Any

from sqlalchemy import select
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session

from .database import create_database_engine, create_schema, database_url
from .models import Asset, Exercise, GrammarTopic, Lesson, Skill, Unit, Vocabulary

SEED_FILE = Path(__file__).parent / "content" / "german_a1_foundations.json"


def _approved(record: Mapping[str, Any]) -> bool:
    return record.get("approved") is True


def _upsert_by_slug(
    session: Session, model: type[Unit] | type[Skill], slug: str, values: dict[str, Any]
) -> Unit | Skill:
    item = session.scalar(select(model).where(model.slug == slug))
    if item is None:
        item = model(slug=slug, **values)
        session.add(item)
    else:
        for key, value in values.items():
            setattr(item, key, value)
    session.flush()
    return item


def _upsert_by_content_id(
    session: Session,
    model: type[Lesson] | type[Exercise] | type[Vocabulary] | type[GrammarTopic],
    content_id: str,
    values: dict[str, Any],
) -> Lesson | Exercise | Vocabulary | GrammarTopic:
    item = session.scalar(select(model).where(model.content_id == content_id))
    if item is None:
        item = model(content_id=content_id, **values)
        session.add(item)
    else:
        for key, value in values.items():
            setattr(item, key, value)
    session.flush()
    return item


def _approved_records(records: list[dict[str, Any]]) -> list[dict[str, Any]]:
    return [record for record in records if _approved(record)]


def _reference_items(
    session: Session,
    model: type[Vocabulary] | type[GrammarTopic],
    content_ids: list[str],
    reference_name: str,
) -> list[Vocabulary] | list[GrammarTopic]:
    items = list(session.scalars(select(model).where(model.content_id.in_(content_ids))))
    found_ids = {item.content_id for item in items}
    missing_ids = set(content_ids) - found_ids
    if missing_ids:
        missing = ", ".join(sorted(missing_ids))
        raise ValueError(f"Unknown or unapproved {reference_name}: {missing}")
    return items


def seed_database(target_engine: Engine, seed_file: Path = SEED_FILE) -> None:
    """Create the schema and idempotently import only approved content."""
    data = json.loads(seed_file.read_text(encoding="utf-8"))
    if not _approved(data["course"]):
        raise ValueError("The course itself must be approved before it can be seeded.")

    create_schema(target_engine)
    with Session(target_engine) as session, session.begin():
        for vocabulary_data in _approved_records(data.get("vocabulary", [])):
            _upsert_by_content_id(
                session,
                Vocabulary,
                vocabulary_data["content_id"],
                {
                    "german": vocabulary_data["german"],
                    "english_meaning": vocabulary_data["english_meaning"],
                    "article": vocabulary_data.get("article"),
                    "plural": vocabulary_data.get("plural"),
                    "category": vocabulary_data.get("category"),
                    "cefr_level": vocabulary_data.get("cefr_level", "A1"),
                    "example_german": vocabulary_data.get("example_german"),
                    "example_english": vocabulary_data.get("example_english"),
                },
            )
        for grammar_data in _approved_records(data.get("grammar_topics", [])):
            _upsert_by_content_id(
                session,
                GrammarTopic,
                grammar_data["content_id"],
                {
                    "name": grammar_data["name"],
                    "explanation": grammar_data["explanation"],
                    "cefr_level": grammar_data.get("cefr_level", "A1"),
                    "example_data": grammar_data.get("example_data"),
                },
            )
        for unit_data in data.get("units", []):
            if not _approved(unit_data):
                continue
            unit = _upsert_by_slug(
                session,
                Unit,
                unit_data["slug"],
                {
                    "title": unit_data["title"],
                    "description": unit_data.get("description"),
                    "sort_order": unit_data.get("sort_order"),
                },
            )
            for skill_data in unit_data.get("skills", []):
                if not _approved(skill_data):
                    continue
                skill = _upsert_by_slug(
                    session,
                    Skill,
                    skill_data["slug"],
                    {
                        "unit_id": unit.id,
                        "title": skill_data["title"],
                        "description": skill_data.get("description"),
                        "sort_order": skill_data.get("sort_order"),
                    },
                )
                for lesson_data in skill_data.get("lessons", []):
                    if not _approved(lesson_data):
                        continue
                    lesson = _upsert_by_content_id(
                        session,
                        Lesson,
                        lesson_data["content_id"],
                        {
                            "skill_id": skill.id,
                            "title": lesson_data["title"],
                            "sort_order": lesson_data["sort_order"],
                            "hearts_allowed": lesson_data.get("hearts_allowed", 5),
                            "xp_reward": lesson_data.get("xp_reward", 10),
                        },
                    )
                    for exercise_data in lesson_data.get("exercises", []):
                        if not _approved(exercise_data):
                            continue
                        exercise = _upsert_by_content_id(
                            session,
                            Exercise,
                            exercise_data["content_id"],
                            {
                                "lesson_id": lesson.id,
                                "type": exercise_data["type"],
                                "prompt": exercise_data["prompt"],
                                "payload": exercise_data.get("payload"),
                                "sort_order": exercise_data["sort_order"],
                                "difficulty": exercise_data.get("difficulty"),
                            },
                        )
                        exercise.vocabulary_items = _reference_items(
                            session,
                            Vocabulary,
                            exercise_data.get("vocabulary_content_ids", []),
                            "vocabulary content IDs",
                        )
                        exercise.grammar_topics = _reference_items(
                            session,
                            GrammarTopic,
                            exercise_data.get("grammar_topic_content_ids", []),
                            "grammar topic content IDs",
                        )
        for asset_data in data.get("assets", []):
            if not _approved(asset_data):
                continue
            asset = session.scalar(select(Asset).where(Asset.key == asset_data["key"]))
            if asset is None:
                session.add(Asset(**{key: asset_data.get(key) for key in ("key", "type", "path", "duration_ms")}))
            else:
                for key in ("type", "path", "duration_ms"):
                    setattr(asset, key, asset_data.get(key))


def main() -> None:
    parser = argparse.ArgumentParser(description="Initialize and seed the German A1 SQLite database.")
    parser.add_argument("--database-url", default=database_url())
    parser.add_argument("--seed-file", type=Path, default=SEED_FILE)
    args = parser.parse_args()
    target_engine = create_database_engine(args.database_url)
    seed_database(target_engine, args.seed_file)
    print(f"Seeded approved German A1 content into {args.database_url}")


if __name__ == "__main__":
    main()

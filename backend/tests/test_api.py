from __future__ import annotations

from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from backend.app.database import create_database_engine, create_schema, get_session
from backend.app.main import app
from backend.app.seed import seed_database


@pytest.fixture
def client(tmp_path) -> Generator[TestClient, None, None]:
    engine = create_database_engine(f"sqlite:///{tmp_path / 'api.db'}")
    create_schema(engine)
    seed_database(engine)

    def override_session() -> Generator[Session, None, None]:
        with Session(engine) as session:
            yield session

    app.dependency_overrides[get_session] = override_session
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


def register(client: TestClient, email: str = "learner@example.test") -> int:
    response = client.post(
        "/api/auth/register", json={"email": email, "password": "safe test password", "display_name": "Learner"}
    )
    assert response.status_code == 201
    return response.json()["user"]["id"]


def lesson_and_exercises(client: TestClient) -> tuple[int, dict[str, int]]:
    units = client.get("/api/units").json()["units"]
    skills = client.get(f"/api/units/{units[0]['id']}/skills").json()["skills"]
    # Use greetings-farewells skill (index 0) for existing tests
    response = client.get(f"/api/skills/{skills[0]['id']}/lessons")
    assert response.status_code == 200, f"Failed to get lessons: {response.text}"
    lessons = response.json()["lessons"]
    lesson = client.get(f"/api/lessons/{lessons[0]['id']}").json()["lesson"]
    return lesson["id"], {exercise["content_id"]: exercise["id"] for exercise in lesson["exercises"]}


def test_course_and_lesson_endpoints_expose_only_approved_content_without_answer_keys(client: TestClient) -> None:
    units_response = client.get("/api/units")
    assert units_response.status_code == 200
    units = units_response.json()["units"]
    assert [unit["slug"] for unit in units] == ["foundations", "numbers-dates-time"]

    skills = client.get(f"/api/units/{units[0]['id']}/skills").json()["skills"]
    assert [skill["slug"] for skill in skills] == ["greetings-farewells", "alphabet-pronunciation", "personal-information", "basic-questions-how-are-you"]
    # Use greetings-farewells skill (index 0) for existing tests
    response = client.get(f"/api/skills/{skills[0]['id']}/lessons")
    assert response.status_code == 200, f"Failed to get lessons: {response.text}"
    lessons = response.json()["lessons"]
    lesson_id, _ = lesson_and_exercises(client)
    lesson = client.get(f"/api/lessons/{lesson_id}").json()["lesson"]
    assert [exercise["content_id"] for exercise in lesson["exercises"]] == [
        "exercise-greetings-hello-choice",
        "exercise-greetings-good-morning-bank",
        "exercise-greetings-good-morning-blank",
        "exercise-greetings-hello-type",
        "exercise-greetings-matching",
    ]
    for exercise in lesson["exercises"]:
        assert "correct_answers" not in exercise["payload"]
        assert "accepted_answers" not in exercise["payload"]
    matching = next(exercise for exercise in lesson["exercises"] if exercise["type"] == "matching")
    assert "pairs" not in matching["payload"]
    assert matching["payload"]["left_items"]
    assert matching["payload"]["right_items"]


def test_attempt_requires_authentication_and_invalid_ids_use_json_errors(client: TestClient) -> None:
    assert client.post("/api/exercises/999/attempt", json={"response": "Hallo"}).status_code == 401
    response = client.get("/api/lessons/999")
    assert response.status_code == 404
    assert response.json()["error"]["code"] == "LESSON_NOT_FOUND"
    response = client.get("/api/units/999/skills")
    assert response.status_code == 404
    assert response.json()["error"]["code"] == "UNIT_NOT_FOUND"


def test_correct_and_incorrect_attempts_persist_xp_hearts_and_unicode_answers(client: TestClient) -> None:
    user_id = register(client)
    lesson_id, exercises = lesson_and_exercises(client)
    correct = client.post(
        f"/api/exercises/{exercises['exercise-greetings-hello-choice']}/attempt", json={"response": "  hAlLo  "}
    )
    assert correct.status_code == 200
    assert correct.json()["result"] == "correct"
    assert correct.json()["xp_awarded"] == 2
    assert correct.json()["user_hearts_remaining"] == 5

    repeated = client.post(
        f"/api/exercises/{exercises['exercise-greetings-hello-choice']}/attempt", json={"response": "Hallo"}
    )
    assert repeated.status_code == 200
    assert repeated.json()["xp_awarded"] == 0

    incorrect = client.post(
        f"/api/exercises/{exercises['exercise-greetings-hello-choice']}/attempt", json={"response": "Tschüss"}
    )
    assert incorrect.status_code == 200
    assert incorrect.json()["result"] == "incorrect"
    assert incorrect.json()["xp_awarded"] == 0
    assert incorrect.json()["user_hearts_remaining"] == 4

    progress = client.get(f"/api/users/{user_id}/progress")
    assert progress.status_code == 200
    assert progress.json()["xp"] == 2
    assert progress.json()["lessons"] == [
        {"lesson_id": lesson_id, "completed": False, "attempts_count": 3, "hearts_remaining": 4}
    ]


def test_lesson_completion_uses_server_attempts_and_unlocks_next_skill(client: TestClient) -> None:
    user_id = register(client, "complete@example.test")
    lesson_id, exercises = lesson_and_exercises(client)
    incomplete = client.post(f"/api/lessons/{lesson_id}/complete", json={"summary": {"exercises": []}})
    assert incomplete.status_code == 200
    assert incomplete.json()["lesson_completed"] is False

    answers = {
        "exercise-greetings-hello-choice": "Hallo",
        "exercise-greetings-good-morning-bank": ["Guten", "Morgen"],
        "exercise-greetings-good-morning-blank": "Morgen",
        "exercise-greetings-hello-type": "Hallo",
        "exercise-greetings-matching": {
            "Hallo": "Hello",
            "Guten Morgen": "Good morning",
        },
    }
    for content_id, answer in answers.items():
        response = client.post(f"/api/exercises/{exercises[content_id]}/attempt", json={"response": answer})
        assert response.status_code == 200
        assert response.json()["result"] == "correct"

    completed = client.post(f"/api/lessons/{lesson_id}/complete", json={"summary": {"exercises": []}})
    assert completed.status_code == 200
    assert completed.json()["lesson_completed"] is True
    assert completed.json()["xp_total"] == 10
    assert completed.json()["user_hearts_remaining"] is None

    duplicate = client.post(f"/api/lessons/{lesson_id}/complete", json={"summary": {"exercises": []}})
    assert duplicate.status_code == 200
    assert duplicate.json()["xp_total"] == 10

    progress = client.get(f"/api/users/{user_id}/progress").json()
    assert progress["xp"] == 10
    assert progress["skills"] == [{"skill_id": 1, "xp": 10, "mastered": False}]

    # Verify Lesson 2 is now unlocked
    lessons = client.get("/api/skills/1/lessons").json()["lessons"]
    assert len(lessons) == 2
    assert lessons[0]["id"] == lesson_id
    assert lessons[0]["unlocked"] is True
    assert lessons[1]["unlocked"] is True


def test_typed_answer_preserves_german_characters_and_progress_is_private(client: TestClient) -> None:
    owner_id = register(client, "unicode@example.test")
    lesson_id, _ = lesson_and_exercises(client)
    # Complete the greeting lesson through the public exercise IDs.
    _, exercises = lesson_and_exercises(client)
    answers = {
        "exercise-greetings-hello-choice": "Hallo",
        "exercise-greetings-good-morning-bank": ["Guten", "Morgen"],
        "exercise-greetings-good-morning-blank": "Morgen",
        "exercise-greetings-hello-type": "Hallo",
        "exercise-greetings-matching": {"Hallo": "Hello", "Guten Morgen": "Good morning"},
    }
    for content_id, answer in answers.items():
        assert (
            client.post(f"/api/exercises/{exercises[content_id]}/attempt", json={"response": answer}).json()["result"]
            == "correct"
        )
    assert client.post(f"/api/lessons/{lesson_id}/complete", json={"summary": {}}).json()["lesson_completed"]

    # Test that progress is private - another user cannot see the first user's progress
    client.post("/api/auth/logout")
    other_id = register(client, "other@example.test")
    response = client.get(f"/api/users/{owner_id}/progress")
    assert response.status_code == 403
    assert response.json()["error"]["code"] == "PROGRESS_FORBIDDEN"
    assert other_id != owner_id


def test_exhausted_hearts_and_authenticated_invalid_exercise_are_rejected(client: TestClient) -> None:
    register(client, "hearts@example.test")
    _, exercises = lesson_and_exercises(client)
    exercise_id = exercises["exercise-greetings-hello-choice"]
    for _ in range(5):
        response = client.post(f"/api/exercises/{exercise_id}/attempt", json={"response": "Danke"})
        assert response.status_code == 200
        assert response.json()["user_hearts_remaining"] >= 0
    exhausted = client.post(f"/api/exercises/{exercise_id}/attempt", json={"response": "Hallo"})
    assert exhausted.status_code == 409
    assert exhausted.json()["error"]["code"] == "LESSON_OUT_OF_HEARTS"

    invalid = client.post("/api/exercises/999/attempt", json={"response": "Hallo"})
    assert invalid.status_code == 404
    assert invalid.json()["error"]["code"] == "EXERCISE_NOT_FOUND"

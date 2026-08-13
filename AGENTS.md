# AGENTS.md

## Project

This repository contains a full-stack German A1 language-learning web application inspired by the core learning and gamification experience of Duolingo.

The application is being developed for a software engineering assignment. AI-assisted development is explicitly permitted and encouraged by the assignment.

## Source of Truth

Before making implementation changes, read the relevant documentation under `docs/`.

Important documents:

- `docs/PRODUCT_SPEC.md` — product requirements and scope
- `docs/CURRICULUM_SPEC.md` — German A1 curriculum and content model
- `docs/UX_SPEC.md` — visual and interaction requirements
- `docs/ARCHITECTURE.md` — system architecture and boundaries
- `docs/DATABASE.md` — database schema and persistence rules
- `docs/API.md` — API contracts
- `docs/ROADMAP.md` — implementation priorities
- `docs/DECISIONS.md` — frozen architectural/product decisions

If these documents do not exist yet, do not invent a large architecture. First inspect the repository and report what is missing.

## Frozen Decisions

Do not change a decision marked `FROZEN` in `docs/DECISIONS.md` without explicit human approval.

Do not change the core technology stack, product direction, API contracts, database relationships, or UX principles merely because another approach is convenient.

If a change is genuinely necessary, explain:
1. Why the existing decision is insufficient.
2. What would change.
3. What other parts of the system would be affected.

Wait for approval before changing a frozen decision.

## Technology

Target stack:

- Frontend: Next.js + TypeScript
- Backend: Python + FastAPI
- Database: SQLite
- ORM/data layer: SQLAlchemy
- Frontend styling/components should remain consistent with the project's UX specification.

Do not introduce major frameworks, infrastructure, databases, or dependencies without justification.

## Architecture Principles

- Keep frontend, backend, database, authentication, content, and business logic separated.
- The frontend must not access SQLite directly.
- Business rules belong in backend services/domain logic, not React components.
- Course content must be externalized from application logic.
- Exercise validation should have a centralized, testable implementation.
- User progress must be persisted per account.
- Authentication must be isolated from learner-progress logic.
- Prefer small, reusable components and services.
- Avoid unnecessary abstractions and premature generalization.

## Content

The initial course is:

- Interface language: English
- Learning direction: English → German
- Course: German A1 Foundations

Course content should be stored as structured seed data and loaded into SQLite through a deterministic seed process.

Do not hard-code course content into frontend components.

AI may be used to generate candidate educational content, but generated German content must be reviewed for correctness before being treated as final seed data.

## Required Core Experience

The application must support the assignment's core learning experience, including:

- Learning path
- Units and skills
- Locked/unlocked progression
- Lessons
- Multiple-choice exercises
- Translation / word-bank exercises
- Matching exercises
- Fill-in-the-blank exercises
- Type-the-answer exercises
- Immediate answer feedback
- Hearts
- XP
- Streak
- Skill progress
- Lesson completion/failure
- Persistent learner progress

The application should also support the planned German A1 learning experience:

- Vocabulary
- Reading
- Writing
- Listening
- Speaking practice
- Essential beginner grammar
- Practice/review

Features explicitly marked optional or deferred in the project documentation must not block completion of the core assignment.

## Authentication

Planned authentication:

- Email/password registration and login using secure HTTP-only cookie-based sessions. Do not store auth credentials or session tokens in localStorage or other writable browser storage.
- Logout endpoint that clears server-side sessions and instructs clients to remove the session cookie.
- Multiple independent learner accounts
- Google authentication is P1/optional for the first MVP: implement only after the core learning experience is stable. The architecture should provide a clean extension point for Google OAuth.

Never store plaintext passwords.

If Google authentication threatens the core assignment deadline, follow the priority order in `docs/ROADMAP.md`. Ensure Google OAuth is added only after core flows are stable.

## UI/UX

The product should strongly resemble the learning flow and gamification patterns of a modern Duolingo-style application while using original implementation and original visual assets.

Do not copy proprietary source code or blindly import proprietary assets.

Prioritize:

- clear visual hierarchy
- playful but polished interactions
- responsive layouts
- lesson feedback
- progress visualization
- animations where useful
- loading/error/empty states
- accessibility and usable keyboard interaction

## Implementation Rules

Before modifying code:

1. Inspect the existing implementation.
2. Read relevant documentation.
3. Identify dependencies and API contracts affected by the change.
4. Make the smallest coherent change that satisfies the task.

After modifying code:

1. Run relevant tests.
2. Run type checking where applicable.
3. Run lint/build checks where applicable.
4. Inspect the actual UI for frontend changes.
5. Report failures rather than hiding them.
6. Do not modify unrelated files.

## Testing

Every important business rule should have tests.

Prioritize tests for:

- authentication
- exercise validation
- heart deduction
- lesson completion
- XP calculation
- streak logic
- skill unlocking
- progress persistence
- API error cases

## Git Discipline

Keep commits logically grouped by implementation phase.

Do not make huge unrelated commits.

Before committing, inspect the diff and ensure secrets, credentials, local databases, generated artifacts, and unnecessary files are not committed.

Never commit API keys, OAuth secrets, passwords, or `.env` files containing secrets.

## Agent Behavior

Do not silently expand scope.

If requirements conflict, identify the conflict.

If a requirement is ambiguous, inspect the project documentation first. If it remains ambiguous and materially affects architecture or product behavior, ask for clarification rather than making a large irreversible decision.

When completing a task, report:

- what changed
- files changed
- tests/checks run
- known limitations
- anything that needs human review
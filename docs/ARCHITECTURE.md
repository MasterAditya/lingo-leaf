Architecture — boundaries and contracts (high level)

Purpose

Document the high-level architecture, module boundaries, and API contract responsibilities without prescribing low-level implementation details beyond the chosen tech stack.

High-level components

1. Frontend (Next.js + TypeScript)
  - Responsibilities: UI rendering, input validation for UX, sequencing lessons/exercises, audio playback, local caching for session responsiveness.
  - Must not access database directly; communicates with Backend over HTTP(S) JSON APIs.

2. Backend API (Python + FastAPI)
  - Responsibilities: authentication, user management, course content delivery (seeded data), authoritative exercise validation, progress persistence, XP and streak calculations, practice queue generation.
  - Exposes a RESTful JSON API (see API.md) and serves audio/static assets.

3. Database (SQLite via SQLAlchemy)
  - Responsibilities: persistent storage of users, progress, seeded course content, assets metadata, leaderboards.
  - Single-file SQLite DB for assignment; migrations via simple migration script or ORM-based create-if-not-exists.

4. Assets storage
  - Static audio/image assets stored on the backend server or served from a static path. Keep references in DB.

5. Seed process
  - Deterministic seeding of course content (Units, Skills, Lessons, Exercises) into SQLite.

Inter-process boundaries and contracts

- Frontend -> Backend: JSON over HTTPS (or HTTP during local dev). Authenticate requests using secure HTTP-only cookie-based sessions for the primary email/password flow (see API.md). Do not store auth credentials in localStorage. The backend is authoritative for authentication, exercise validation, XP calculations, hearts and streak logic, progression rules, and all canonical persistent learner state. Frontend may provide immediate visual feedback for UX responsiveness, but canonical state must come from backend responses — do not rely on optimistic client-side updates for authoritative learner state.

- Backend -> Database: SQLAlchemy as ORM to map domain models (User, Skill, Lesson, Exercise, Attempt, Progress).

- Asset access: Serve audio and images as static endpoints (e.g., /static/audio/{id} or signed URLs if needed later).

Key domain models (conceptual)

- User: id, email, password_hash, created_at, last_login, profile fields, streak_info
- Unit: id, title, order
- Skill: id, unit_id, title, order, unlock_rules
- Lesson: id, skill_id, title, order, metadata (xp, hearts, exercise_count)
- Exercise: id, lesson_id, type, prompt, correct_answers, distractors, audio_ref, metadata
- Progress / Attempt: user_id, skill_id, lesson_id, xp_awarded, result, attempt_time

Auth choices and tradeoffs (high level)

- Email/password: required. Secure storage with bcrypt/argon2.
- Sessions: use secure HTTP-only cookie sessions as the primary method for email/password authentication. Do not store credentials in localStorage.
- Google OAuth: optional and classified as P1 priority for the first MVP (implement only after the core learning experience is stable). Provide a clean extension point for adding Google as an external auth provider.

Service responsibilities (who does what)

- Backend enforces business rules: XP award rules, hearts deduction, mastery thresholds, skill unlocking.
- Frontend enforces only UX-oriented quick validation and renders feedback from backend.

Scalability and non-functional notes

- SQLite is sufficient for the assignment and small-scale testing. If the application needs to scale beyond a single-file DB, migrating to PostgreSQL is the recommended path.
- Keep heavy processing (e.g., speech recognition) deferred or routed to external services if added.

Security considerations

- Never store plaintext passwords. Use a proven KDF.
- Protect API endpoints with authentication and proper rate-limiting in production.
- Do not expose PII on leaderboards — use display names or anonymized handles.

Testing and local development

- Provide deterministic seeds for content so frontend and backend teams can develop against consistent data.
- Provide API mock responses or a minimal dev server to enable frontend UI work before full backend implementation.

Notes

- This document intentionally avoids implementation minutiae (framework-specific wiring) while making the boundaries of responsibility explicit. Refer to API.md for concrete endpoints and data shapes.

## Content Architecture

Course content is persisted in SQLite and exposed to the frontend through
product-level FastAPI APIs.

The frontend must not hard-code course content.

Seed content is maintained separately from application logic and loaded
through a deterministic seed process.

The MVP does not require runtime AI-generated content.

The architecture should allow a future AI content-generation service to
create candidate exercises/content, but generated content must pass
validation and human review before becoming persistent course content.
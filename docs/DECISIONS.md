DECISIONS — recorded product & architectural decisions

Purpose

Record explicit product and architecture decisions for the project. Decisions marked FROZEN should not be changed without explicit human approval.

Decisions (current project direction)

1) Language direction and UI
- Decision: Interface language will be English and the initial course will be English -> German A1 Foundations.
- Status: FROZEN PRODUCT DECISION
- Rationale: Assignment requires an English UI and the team selected German A1 as the course focus.

2) Course scope
- Decision: Implement a compressed German A1 Foundations curriculum (approx. 30–40 skills across 6–8 units).
- Status: FROZEN PRODUCT DECISION
- Rationale: Provides a realistic but deliverable scope for the assignment.

3) Tech stack
- Decision: Frontend: Next.js + TypeScript. Backend: Python + FastAPI. Database: SQLite with SQLAlchemy.
- Status: FROZEN PRODUCT DECISION
- Rationale: Matches assignment constraints and simplifies grading and local development.

4) Content storage and seeding
- Decision: Course content will be externalized as deterministic seed data (JSON/YAML) and imported into SQLite.
- Status: FROZEN PRODUCT DECISION
- Rationale: Enables reproducible grading and consistent dev environments.

5) Authentication
- Decision: Email/password login required, implemented using secure HTTP-only cookie-based sessions as the primary flow. Do not store auth credentials or session tokens in localStorage. Google OAuth is P1/optional for the first MVP and should be implemented only after the core learning experience is stable. The architecture must provide a clean extension point for adding Google OAuth later.
- Status: FROZEN PRODUCT DECISION (email/password + cookie sessions). OPTIONAL (Google OAuth, P1)
- Rationale: Server-managed cookie sessions are simple and secure for a single-server assignment deployment and make logout/session invalidation straightforward. Google OAuth is valuable but should not block core learning functionality.

6) Exercise types
- Decision: Support the following exercise types in MVP: multiple-choice, translation/word-bank, matching, fill-in-the-blank, type-the-answer.
- Status: FROZEN PRODUCT DECISION
- Rationale: These exercise types satisfy assignment requirements and cover receptive and productive practice.

7) Gamification primitives
- Decision: Include XP, Hearts, Streak, Gems, Daily goal, Leaderboard, Profile in product design.
- Status: FROZEN PRODUCT DECISION
- Rationale: Required by the product direction; Gems and Leaderboard details can be tuned over time.

8) Speaking and advanced features
- Decision: Implement a real microphone interaction and speaking exercise UI as an optional enhancement if time permits, but do not require external speech-recognition services for the core MVP. Text-to-speech and listening exercises should be functional where practical. Advanced automatic pronunciation scoring is DEFERRED.
- Status: DEFERRED (automatic scoring). OPTIONAL (microphone UI, TTS where feasible)
- Rationale: Basic microphone UI and listening playback improve UX and can be added without requiring an external speech-recognition dependency; accurate automated scoring requires additional infrastructure and is not required for MVP.

9) Assets and IP
- Decision: Use original mascot and original visual assets only. Do not copy Duolingo art or proprietary assets.
- Status: FROZEN PRODUCT DECISION

10) Leaderboard
- Decision: Use a global leaderboard. Users are represented by display name/username only. Never expose email addresses or other private account information on leaderboards.
- Status: FROZEN PRODUCT DECISION

11) Typed-answer validation
- Decision: Centralize typed-answer normalization and validation on the backend. Rules include Unicode normalization, trimming whitespace, collapsing repeated whitespace, case-insensitive comparison, and preserving German characters (ä, ö, ü, ß). Do not silently convert umlauts or ß into alternative spellings unless those variants are explicitly accepted in the exercise's approved answers.
- Status: FROZEN PRODUCT DECISION

12) AI-generated content
- Decision: AI-assisted generation of candidate content is allowed, but all AI-generated German content must be reviewed and approved by a human fluent in German before being included in final seeded content.
- Status: FROZEN PRODUCT DECISION (content review requirement)

Open questions and items needing human approval

- Session lifecycle details: choose session expiration and renewal policy (sliding expiration vs absolute expiration) and session revocation strategy. (Action required prior to implementation.)
- Level of fidelity for pronunciation exercises and whether to integrate external speech APIs for scoring (deferred unless approved).
- Privacy policy details for leaderboard display (global leaderboard using display names is decided; confirm any additional filtering, class-level views, or anonymization policies for grading/export).

Change log

- [2026-08-13] Initial decisions file created to reflect current product direction and frozen choices.

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>
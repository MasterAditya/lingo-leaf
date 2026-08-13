API contract — high-level endpoints and data shapes

Purpose

Provide a concrete but minimal set of API endpoints and request/response shapes that the frontend will use to implement the required product behavior. This is intentionally implementation-agnostic about auth tokens vs cookies; pick one at implementation time and document it here.

Auth notes
- Primary auth: secure HTTP-only cookie-based sessions (server-side session store). Do not store credentials or session tokens in localStorage.
- Google OAuth may be added later as an external provider (see DECISIONS.md). The API will provide an extension point for external auth flows.

Authentication endpoints

POST /api/auth/register
- Body: { email: string, password: string, display_name?: string }
- Response: 201 Created { user: { id, display_name } }
- Notes: On successful registration the backend sets a secure HTTP-only session cookie. Do not rely on tokens returned in response bodies.

POST /api/auth/login
- Body: { email: string, password: string }
- Response: 200 OK { user: { id, display_name } }
- Notes: On successful login the backend sets a secure HTTP-only session cookie. Frontend should not store credentials or tokens in localStorage.

POST /api/auth/logout
- Body: {}
- Response: 204 No Content
- Notes: Logout clears the server-side session and instructs the client to remove the session cookie.

Course content endpoints (public read)

GET /api/units
- Response: 200 OK { units: [{ id, slug, title, description, sort_order }] }

GET /api/units/{unit_id}/skills
- Response: 200 OK { skills: [{ id, slug, title, description, sort_order, unlocked: boolean, progress?: { xp, mastered } }] }

GET /api/skills/{skill_id}/lessons
- Response: 200 OK { lessons: [{ id, title, sort_order, hearts_allowed, xp_reward }] }

GET /api/lessons/{lesson_id}
- Response: 200 OK { lesson: { id, title, exercises: [{ id, type, prompt, payload (trimmed for security) }] } }

Exercise attempt and validation (authenticated)

POST /api/exercises/{exercise_id}/attempt
- Body: { response: any }
- Response: 200 OK {
    result: 'correct' | 'incorrect' | 'partial',
    xp_awarded: number,
    correct_answers: [string],
    user_hearts_remaining: number,
    explanation?: string
  }
- Notes: The attempt endpoint is authoritative: the backend updates attempts, lesson_progress (including hearts_remaining and attempts_count), skill_progress and user xp/streak as required, and returns the canonical new values (xp_awarded, user_hearts_remaining). Frontend must use the values returned by this endpoint as canonical.

Lesson completion and summary

POST /api/lessons/{lesson_id}/complete
- Body: { summary: { exercises: [{ exercise_id, correct, xp_awarded }] } }
- Response: 200 OK { lesson_completed: boolean, xp_total: number, next_skill_unlocked?: boolean }

Practice / review

GET /api/users/{user_id}/practice-queue
- Response: 200 OK { exercises: [exercise objects] }

Progress endpoints

GET /api/users/{user_id}/progress
- Response: 200 OK { xp, streak_count, gems, skills: [{ skill_id, xp, mastered }], last_active }

Leaderboards (basic)

GET /api/leaderboard?limit=20
- Response: 200 OK { entries: [{ user_id, display_name, xp }] }
- Notes: Leaderboard is global by default. Do not expose emails or other PII. Display names/username only.

Asset endpoints

GET /static/audio/{asset_key}
- Response: audio binary with proper headers

Administrative / seeding

POST /api/admin/seed
- Protected endpoint for deterministic seeding during development
- Notes: The seed process should include an "approved" flag on content items. Admin/seed endpoints should not make unapproved (staged) AI-generated content visible to normal users until it is reviewed and marked approved.

Error handling

- Use standard HTTP status codes. Return JSON error payloads:
  { error: { code: string, message: string, details?: any } }

Security notes

- Validate all user inputs server-side for exercise correctness and anti-cheat. Typed-answer validation rules:
  - Unicode-normalize input (NFC or NFKC as chosen by implementation).
  - Trim leading/trailing whitespace and collapse repeated internal whitespace.
  - Compare case-insensitively.
  - Preserve German characters (ä, ö, ü, ß); do not silently convert them to ASCII alternatives unless the exercise explicitly allows those variants.
  - Centralize validation logic on the backend; frontend may mirror the rules for responsiveness but backend is authoritative.
- Rate-limit endpoints that could be abused (auth, attempt endpoints).

Extensibility

- Keep exercise payloads flexible so new types can be added without changing the API surface drastically; use versioning for breaking changes (e.g., /api/v1/...).

Implementation notes for implementation

- Primary auth method: secure HTTP-only cookie-based sessions as documented above. Document cookie settings (Secure, SameSite, expiration) during implementation.

## API Principle

APIs expose product-level resources and actions rather than mirroring
database tables one-to-one.

Examples include courses, units, skills, lessons, lesson attempts,
progress, authentication, and learner statistics.

Database implementation details remain behind the backend API.
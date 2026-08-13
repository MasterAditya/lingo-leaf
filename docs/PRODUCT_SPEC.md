Product spec — German A1 Foundations (Duolingo-inspired)

Purpose

This document defines the product scope, user problems, and the minimal deliverable for the assignment: a web application that teaches German A1 Foundations with a Duolingo-inspired learning flow.

Target users

- Beginner English-speaking learners wanting to learn German A1.
- Students needing a lightweight, web-based practice tool for vocabulary, simple grammar, reading, listening and basic speaking exercises.

Primary user problems (what this product solves)

- Provide a short, structured learning path from absolute beginner to A1 foundations.
- Make practice enjoyable and motivating through gamification (XP, hearts, streaks, gems).
- Persist user progress across devices/accounts.
- Offer immediate feedback and incremental mastery of core items.

Scope and core features (minimum viable product)

Required (assignment MUST include these):
- English UI (interface language is English)
- English -> German A1 Foundations course content
- Structured learning hierarchy: Units -> Skills -> Lessons -> Exercises
- Persistent user accounts with per-user progress
- Authentication: Email/password registration + login using secure HTTP-only cookie-based sessions. Do not store auth credentials or tokens in localStorage or other writable browser storage. See Authentication lifecycle notes below.
- Multiple-choice exercises
- Translation / word-bank exercises
- Matching exercises
- Fill-in-the-blank exercises
- Type-the-answer exercises
- Immediate answer feedback for exercises
- Hearts (limited mistakes per lesson/attempt)
- XP tracking for completing lessons/exercises
- Streak tracking (daily goal)
- Skill unlock/lock progression
- Practice/review system (basic) for past skills/lessons
- Backend: Python + FastAPI (authoritative for authentication, exercise validation, XP, hearts, streaks, progression, and persistent learner state)
- Frontend: Next.js + TypeScript
- Database: SQLite using SQLAlchemy ORM
- Original mascot and original visual assets (no proprietary copying)
- AI-assisted development is allowed for content & implementation

Authentication lifecycle (summary):
- Sessions are represented by a secure, HTTP-only cookie set by the backend on successful login/registration.
- Session cookie has a sensible expiration (e.g., 7 days) and the backend must provide an explicit logout endpoint that clears the server-side session and the cookie.
- Session renewal and expiration behaviour (refresh on activity vs sliding expiration) should be chosen during implementation; frontend must never store credentials in localStorage.
- The backend is authoritative for session validity; frontend may show optimistic UI but must re-sync with backend for canonical learner state.

Typed-answer validation (high-level rules):
- Validation rules are centralized on the backend (authoritative).
- Inputs should be Unicode-normalized, trimmed, repeated whitespace collapsed, and compared case-insensitively.
- German characters (ä, ö, ü, ß) are preserved; do not silently convert them to alternative spellings unless the exercise explicitly lists those forms as accepted answers.
- The backend should document normalization rules and any accepted answer variants in exercise seed data.

AI-generated content and quality control:
- AI may generate candidate vocabulary, example sentences, translations, and exercise drafts.
- All AI-generated German content must be reviewed by a human fluent in German before being committed as final seeded content.
- The seed process must allow reviewers to mark items as "approved" before they affect learner experience.

Leaderboard privacy:
- Leaderboard displays users by display name/username only. Never expose email addresses or other private account information on public leaderboards.

FROZEN PRODUCT DECISIONS (approved and must not be changed without approval):
- English UI
- English -> German A1 Foundations course direction
- Tech stack: Next.js + TypeScript frontend, Python + FastAPI backend, SQLite + SQLAlchemy
- Course structure: Units -> Skills -> Lessons -> Exercises
- Gamification primitives: XP, Hearts, Streak, Gems, Daily goal, Leaderboard, Profile
- Persistent progress per account
- Original mascot and original visual assets

Optional (desirable but not required for baseline assignment):
- Google authentication (P1 — optional for the first MVP; implement only after core learning experience is stable)
- Advanced speaking recognition/evaluation (DEFERRED; basic microphone UI optional)
- Social features beyond a simple leaderboard (friends, clubs)
- Large, exhaustive curriculum beyond a compressed A1 course
- Mobile-specific packaging (PWA/installer)

Deferred (explicitly postponed unless time permits):
- Third-party SSO beyond Google (e.g., Apple, Facebook)
- Sophisticated adaptive learning algorithms or cross-session spaced repetition beyond a basic practice queue
- Advanced voice evaluation with automatic pronunciation scoring
- Extensive audio recording storage/processing infrastructure

Success metrics (how to judge the MVP):
- A student can complete the German A1 Foundations learning path (all required units/skills) using only the app.
- User progress (skill levels, XP, streak, hearts) persists across login sessions.
- Automated exercise validation and immediate feedback works consistently for implemented exercise types.
- Basic practice/review session returns relevant content from previously seen skills.

Constraints and non-goals

- The frontend must not access SQLite directly (backend API only).
- Do not import proprietary Duolingo assets or copy UI code from Duolingo.
- This product is not meant to replace a complete commercially certified A1 course; it is a compressed, assignment-appropriate A1 foundations course.

Notes

- Content must be externalized (seeded into the database) rather than hard-coded into UI components.
- All features marked FROZEN are treated as product constraints for design and roadmap.
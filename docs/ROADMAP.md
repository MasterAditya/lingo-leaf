Roadmap — priorities and phased delivery

Purpose

Provide a prioritized plan that delivers the assignment's mandatory functionality first, then adds optional/ambitious features as time permits.

Phase 0 — Planning & Documentation (current)
- Complete docs: PRODUCT_SPEC, CURRICULUM_SPEC, UX_SPEC, ARCHITECTURE, DATABASE, API, ROADMAP, DECISIONS

Phase 1 — Core MVP (required for assignment)
Estimated priority: Highest
- Implement backend data models and deterministic seed process for compressed A1 course
- Implement email/password authentication and secure password storage
- Implement core API endpoints for units, skills, lessons, exercises, attempts, progress
- Implement frontend: Dashboard, Learning path (Units->Skills->Lessons), Lesson player, Exercise types listed in product spec
- Implement XP, Hearts, Streak, basic Gems, and Profile summary
- Implement persistent progress per user and unlock rules
- Provide a basic practice/review queue
- Provide static audio/image asset serving
- Add unit tests for exercise validation and progress rules

Phase 2 — Polish and grading enhancements
Estimated priority: High
- Add leaderboard, nicer UI polishing and responsive tests
- Add seed content completion for all planned A1 skills (30–40 skills)
- Accessibility fixes and keyboard support
- Add export of user progress (sanitized) for grading
- (Optional P1) Add Google OAuth as an external auth provider — implement only after the core learning experience is stable and as a clean extension to the auth flow.

Phase 3 — Low-risk optional features
Estimated priority: Medium
- Add additional content/audio quality improvements
- Add small cosmetic rewards store using Gems (non-pay)

Phase 4 — Ambitious / deferred features
Estimated priority: Low / Deferred
- Advanced speaking recognition and scoring
- Sophisticated spaced-repetition and adaptive algorithms
- Social features beyond basic leaderboard (friends, clubs)
- Multi-language support for UI

Notes and trade-offs

- Google OAuth is optional and should be implemented only after core MVP is stable; treat as medium priority if time allows.
- Advanced speech features require external services or heavy processing; defer unless the team commits additional time.
- Prioritize correctness of exercise validation and progress persistence over adding many ancillary features.

Milestones and acceptance criteria

- Milestone 1 (MVP backend): API endpoints implemented and seed data loads successfully.
- Milestone 2 (MVP frontend): Users can register, login, play lessons, and progress persists.
- Milestone 3 (Course content): Compressed A1 content available and testable.
- Milestone 4 (Grading readiness): Exportable progress snapshot and basic admin seed endpoint implemented.

Deliverables at each milestone should include tests and brief documentation for graders on how to run/seed the system.
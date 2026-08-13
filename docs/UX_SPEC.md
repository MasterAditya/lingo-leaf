UX specification — Duolingo-inspired learning experience (English UI)

Purpose

Define the high-level UX goals, key screens, interactions, and accessibility constraints for a Duolingo-inspired learner flow while avoiding copying proprietary UI/layouts or assets.

UX principles

- Clear learning hierarchy and progress: Units > Skills > Lessons > Exercises
- Delightful gamification: make progress visible and rewarding but not distracting from learning
- Immediate, informative feedback for answers
- Consistency across screens and device sizes (responsive)
- Accessible: keyboard navigation, readable contrast, semantic HTML

Key screens and flows (high-level)

1. Landing / Home (signed out)
  - Short product pitch, sign up / log in CTA
2. Dashboard / Home (signed in)
  - Daily goal progress, streak, current XP, quick access to current unit/skill, practice button, leaderboard summary, profile access
3. Learning path (Units & Skills)
  - Visual progression of skills (locked/unlocked states)
  - Ability to open a skill to see lessons and progress inside
4. Skill / Lesson view
  - Lesson goals (XP, hearts at start)
  - Sequence of exercises with progress indicator (e.g., 1/8)
  - Immediate feedback overlay after each attempt (correct/incorrect + short hint)
  - Option to repeat or practice weaker items after completion
5. Practice / Review flow
  - Focused session on weak items and recent content, shorter than a full lesson
6. Profile & Settings
  - Show XP, streak calendar, gems, achievements, account settings, logout
7. Leaderboard
  - Global leaderboard only. Display names/username only; never expose emails or other PII.

Exercise UI patterns

- Multiple choice: large, touch-friendly buttons; immediate highlight for correct answer.
- Type-the-answer / translation: text input with enter/submit; backend-centralized normalized comparison is used (Unicode-normalize, trim, collapse repeated whitespace, case-insensitive) and German characters (ä, ö, ü, ß) are preserved; show a short explanation when incorrect.
- Word bank (translation / reorder): drag-and-drop or button-select tokens for desktop and mobile; allow keyboard alternatives.
- Matching: two-column pairing; allow keyboard selection.
- Fill-in-the-blank: inline inputs within a sentence; show missing word count and hints.
- Listening: play icon next to prompt; ensure audio controls are accessible.

Gamification and feedback

- Hearts: displayed prominently at lesson start; lose heart on incorrect high-cost mistakes; provide clear wording for retry/continue options.
- XP: awarded per exercise and aggregated to show progress to next level.
- Streak: display daily streak on dashboard and on completion screens; encourage but do not block learning if a day is missed.
- Gems / currency: simple reward for completion; used later for cosmetic/unblocking features (deferred if not implemented).

Accessibility

- All interactive items reachable by keyboard (tab order and visible focus states)
- Use ARIA roles and semantics for dynamic content (hints, feedback)
- Color choices with sufficient contrast; do not rely on color alone to convey correctness
- Provide alt text and transcripts for audio assets

Non-functional UX constraints

- Keep network interactions responsive. Frontend may provide immediate visual feedback for responsiveness, but canonical learner state must come from backend responses — do not rely on optimistic client-side updates for authoritative state.
- Minimize blocking modals; prefer inline feedback

Design assets and styling

- Use original mascot and original visual assets only
- Keep visual language playful and simple; avoid copying Duolingo's trademark layout and assets

Notes for implementation team

- Centralize exercise rendering components so that new exercise types can be added without duplicating layout logic
- Keep validation logic in backend (authoritative) and mirror lightweight validation in frontend for responsiveness
- Document UI data contracts in API.md to ensure consistent behavior between frontend and backend

Deliverables

- High-level component map for UI (to be created before implementation)
- Accessibility checklist for implemented screens
- Mock data samples for UI development (seeded JSON)
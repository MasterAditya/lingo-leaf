Database design — SQLite (conceptual schema and seed rules)

Purpose

Describe the target schema for persistent state using SQLite + SQLAlchemy and the data required to seed the course content and users for the assignment.

Design goals

- Simple, auditable schema suitable for assignment grading
- Seedable and deterministic content import
- Clear mapping from domain model to storage

Core tables (recommended)

1. users
- id INTEGER PRIMARY KEY AUTOINCREMENT
- email TEXT UNIQUE NOT NULL
- password_hash TEXT NOT NULL
- display_name TEXT
- gems INTEGER DEFAULT 0
- xp INTEGER DEFAULT 0
- streak_count INTEGER DEFAULT 0
- daily_goal_target INTEGER DEFAULT 10  -- XP target per day for daily goal
- daily_xp INTEGER DEFAULT 0            -- XP earned today (reset at day boundary)
- last_daily_reset DATE                 -- date when daily_xp was last reset
- last_active DATE
- created_at DATETIME DEFAULT CURRENT_TIMESTAMP

2. units
- id INTEGER PRIMARY KEY AUTOINCREMENT
- slug TEXT UNIQUE NOT NULL
- title TEXT NOT NULL
- description TEXT
- sort_order INTEGER

3. skills
- id INTEGER PRIMARY KEY AUTOINCREMENT
- unit_id INTEGER NOT NULL REFERENCES units(id)
- slug TEXT UNIQUE NOT NULL
- title TEXT NOT NULL
- description TEXT
- sort_order INTEGER

4. lessons
- id INTEGER PRIMARY KEY AUTOINCREMENT
- content_id TEXT UNIQUE NOT NULL -- stable seed/content identity
- skill_id INTEGER NOT NULL REFERENCES skills(id)
- title TEXT NOT NULL
- sort_order INTEGER
- hearts_allowed INTEGER DEFAULT 5
- xp_reward INTEGER DEFAULT 10

5. exercises
- id INTEGER PRIMARY KEY AUTOINCREMENT
- content_id TEXT UNIQUE NOT NULL -- stable seed/content identity
- lesson_id INTEGER NOT NULL REFERENCES lessons(id)
- type TEXT NOT NULL -- enum: multiple_choice, translation, word_bank, matching, fill_blank, type_answer, listening
- prompt TEXT NOT NULL
- payload JSON -- exercise-type-specific metadata (options, answer variants, audio refs)
- sort_order INTEGER
- difficulty TEXT

6. vocabulary
- id INTEGER PRIMARY KEY AUTOINCREMENT
- content_id TEXT UNIQUE NOT NULL -- stable seed/content identity
- german TEXT NOT NULL
- english_meaning TEXT NOT NULL
- article TEXT NULL
- plural TEXT NULL
- category TEXT NULL
- cefr_level TEXT NOT NULL DEFAULT 'A1'
- example_german TEXT NULL
- example_english TEXT NULL

7. grammar_topics
- id INTEGER PRIMARY KEY AUTOINCREMENT
- content_id TEXT UNIQUE NOT NULL -- stable seed/content identity
- name TEXT NOT NULL
- explanation TEXT NOT NULL
- cefr_level TEXT NOT NULL DEFAULT 'A1'
- example_data JSON NULL

8. exercise_vocabulary
- exercise_id INTEGER NOT NULL REFERENCES exercises(id)
- vocabulary_id INTEGER NOT NULL REFERENCES vocabulary(id)
- PRIMARY KEY (exercise_id, vocabulary_id)

9. exercise_grammar_topics
- exercise_id INTEGER NOT NULL REFERENCES exercises(id)
- grammar_topic_id INTEGER NOT NULL REFERENCES grammar_topics(id)
- PRIMARY KEY (exercise_id, grammar_topic_id)

10. attempts (history of attempts)
- id INTEGER PRIMARY KEY AUTOINCREMENT
- user_id INTEGER NOT NULL REFERENCES users(id)
- exercise_id INTEGER NOT NULL REFERENCES exercises(id)
- correct BOOLEAN
- raw_response TEXT
- normalized_response TEXT NULL -- optional: normalized form used for matching/analytics
- xp_awarded INTEGER
- created_at DATETIME DEFAULT CURRENT_TIMESTAMP

7. skill_progress
- id INTEGER PRIMARY KEY AUTOINCREMENT
- user_id INTEGER NOT NULL REFERENCES users(id)
- skill_id INTEGER NOT NULL REFERENCES skills(id)
- xp INTEGER DEFAULT 0
- mastered BOOLEAN DEFAULT 0
- last_practiced DATETIME

8. lesson_progress
- id INTEGER PRIMARY KEY AUTOINCREMENT
- user_id INTEGER NOT NULL REFERENCES users(id)
- lesson_id INTEGER NOT NULL REFERENCES lessons(id)
- completed BOOLEAN DEFAULT 0
- attempts_count INTEGER DEFAULT 0
- hearts_remaining INTEGER DEFAULT NULL  -- track remaining hearts for an in-progress lesson attempt; NULL if no active session
- last_attempt DATETIME
- last_completed_at DATETIME NULL

9. assets (audio/images metadata)
- id INTEGER PRIMARY KEY AUTOINCREMENT
- key TEXT UNIQUE
- type TEXT
- path TEXT
- duration_ms INTEGER NULL

10. sessions (server-side session store — recommended for HTTP-only cookie sessions)
- id INTEGER PRIMARY KEY AUTOINCREMENT
- session_token TEXT UNIQUE NOT NULL
- user_id INTEGER NOT NULL REFERENCES users(id)
- created_at DATETIME DEFAULT CURRENT_TIMESTAMP
- expires_at DATETIME
- revoked BOOLEAN DEFAULT 0

Notes: A sessions table lets the backend map a secure HTTP-only cookie to a server-side session and supports explicit logout and session revocation. For small deployments this can be an in-process store or a dedicated table as shown above.

Indexes and constraints

- Index on attempts(user_id, exercise_id, created_at) for recent activity queries
- Unique constraints on unit/skill slugs and vocabulary, grammar-topic, lesson, and exercise content IDs so seeding is idempotent

Seeding rules

- Provide a deterministic seeding script that reads structured JSON/YAML data and inserts vocabulary, grammar topics, units, skills, lessons, exercises, and assets.
- If a slug or stable content ID already exists, update the record rather than duplicating (idempotent seed). Lessons and exercises must use stable `content_id` values rather than parent-local sort order as their seed identity.
- Seed data should include an "approved" or "reviewed" flag for exercises and content items so that AI-generated candidate content can be staged and then marked approved after human review.
- Exercises may reference zero or more vocabulary records and grammar topics by stable content ID; the database stores those links through many-to-many association tables while retaining the flexible exercise payload.
- Production seed files live under `backend/app/content/`. Reference or source materials must remain outside that directory and are never imported by the production seed command.

Validation and typed-answer data

- The backend centralizes typed-answer normalization and validation logic. Exercise payloads should include accepted answer variants explicitly; the backend performs Unicode normalization, trimming, collapsing repeated whitespace, and case-insensitive comparison while preserving German characters (ä, ö, ü, ß).
- Store the raw user response in attempts.raw_response and store any normalized form used for matching if useful for analytics; canonical correctness decisions are stored in the attempts record (correct boolean, xp_awarded).

Notes on normalization vs JSON payloads

- The exercises table uses a payload JSON field to allow flexible exercise metadata while keeping core queryable columns normalized (lesson_id, type, difficulty).
- SQLite's JSON support is limited; keep payloads small and predictable and document structure in seed files.

Migration and dev notes

- For the assignment, a simple create-if-not-exists migration is acceptable. If schema evolution is needed, provide migration scripts.

Security

- Store only references to audio/image assets, not the binary content, in the DB.
- Do not store plaintext passwords; only store a secure hash.

Export and grading

- Provide a means to export a sanitized snapshot of a user's progress for grading (anonymized display_name/email optional).

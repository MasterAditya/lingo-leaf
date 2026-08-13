German A1 Foundations — Curriculum specification

Purpose

Describe a realistic, compressed German A1 Foundations curriculum suitable for the assignment. The curriculum is intentionally focused on core vocabulary, high-impact grammar, and beginner reading/listening/writing/speaking practice.

Principles and constraints

- Scope is limited to a practical A1 foundation appropriate for a semester-sized assignment.
- Content is modular and seedable into the app as structured data.
- Each skill is small and teachable in one or two lessons; lessons include exercises of multiple types to reinforce learning.
- Emphasize productive practice (type/translate) and receptive skills (listening/reading).

Course structure

- Course -> Units -> Skills -> Lessons -> Exercises
- Suggested sizes: 6–8 Units, each containing 4–6 Skills. Each Skill contains 1–3 Lessons. Total ~30–40 skills.

Suggested Units and sample skills (compressed A1)

1. Foundations (Greetings, Introductions)
  - Skills: Alphabet & Pronunciation, Greetings & Farewells, Introducing Yourself, Asking "How are you?"
2. Numbers, Dates, Time
  - Skills: Numbers 1–100, Days/Months, Telling time, Dates and simple calendar phrases
3. Family & People
  - Skills: Family vocabulary, Professions, Basic descriptions (tall, old, young)
4. Home & Daily Life
  - Skills: Rooms & furniture, Daily routine verbs (eat, sleep, work), Household objects
5. Food & Shopping
  - Skills: Common food items, Ordering at a cafe, Simple shopping phrases and quantities
6. Travel & Directions
  - Skills: Places in town, Asking directions, Public transport basics
7. Basic Grammar & Sentence Building
  - Skills: Definite/indefinite articles, Gender and noun-adjective basics, Present tense regular verbs, Modal verbs (können, wollen), Negation (nicht, kein), Word order for main clauses

Lesson design

- Each lesson targets 6–12 lexical items or 1–2 grammar points.
- Lessons combine multiple exercise types: multiple-choice, translation, type-the-answer, fill-in-the-blank, matching, and short listening items.
- Provide at least one active production exercise per lesson (type or translation).
- Include immediate feedback and a short explanation for grammar items.

Exercise bank and item metadata

Each exercise seed should include:
- canonical prompt and answers
- audio asset reference (for listening exercises)
- difficulty tag (easy/medium/hard)
- skill_id, lesson_id
- distractors for multiple-choice
- accept list for type-the-answer (spelling variants, diacritics tolerant)

Progress and mastery

- Skill progress: track XP and mastery level per skill (e.g., 0–100% with thresholds for "exposed", "practiced", "mastered").
- Unlocking: completing a skill at "practiced" threshold unlocks next skill(s).
- Review: practice queue selects items from recently learned and weakly mastered items.

Audio and speaking

- Include short native-speaker audio for key vocabulary and example sentences where feasible.
- Basic speaking tasks are optional and may be deferred to post-MVP due to infrastructure complexity.

Assessment

- End-of-unit mini-tests composed of mixed exercise types to validate retention.
- Lesson completion criteria: achieve a minimum correct rate or repeat until hearts are exhausted.

Content quality note

- If AI-generated content is used for candidate items, it must be reviewed manually for correctness before being treated as authoritative seed data.

Deliverables for the assignment

- A seed dataset containing Units, Skills, Lessons, and an exercise bank for the compressed A1 Foundations course (approx. 30–40 skills).
- Documentation of the schema used for seeding and any content-review process.
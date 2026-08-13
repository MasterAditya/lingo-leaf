# German A1 Learning App

A full-stack, gamified German A1 language-learning web application inspired by the core learning path, lesson, and gamification experience of modern language-learning platforms such as Duolingo.

> Built as an SDE Fullstack assignment with AI-assisted development.

## Overview

The application provides an English-language interface for learners studying German at beginner A1 level.

The goal is to create a polished, functional learning experience rather than a static collection of quizzes.

Learners can progress through a structured German course, complete interactive lessons, earn XP, maintain a streak, manage hearts, practice vocabulary, and track their learning progress.

## Core Experience

### Learning Path

- Structured units
- Skills within units
- Lessons within skills
- Locked and unlocked progression
- Skill progress
- Completed skills

### Lesson Engine

The lesson system supports multiple exercise types:

- Multiple choice
- Translation / word bank
- Matching pairs
- Fill in the blank
- Type the answer

Lessons provide:

- Progress indicators
- Immediate correct/incorrect feedback
- Heart deduction for incorrect answers
- Lesson completion
- Lesson failure
- XP rewards
- Typed-answer validation with normalized comparison: inputs will be Unicode-normalized, trimmed, and compared case-insensitively by the backend; German characters (ä, ö, ü, ß) are preserved unless an exercise explicitly allows alternate forms.

## German A1 Learning Content

The course is designed around beginner German A1 foundations.

Content areas include:

- Greetings and introductions
- Numbers and counting
- Days and months
- Dates and time
- Family and people
- Food and drinks
- Fruits and everyday vocabulary
- Home and daily life
- Shopping
- Places and directions
- Basic conversations
- Essential beginner grammar
- Sentence formation

The learning experience also includes practice across:

- Reading
- Writing
- Listening
- Speaking
- Vocabulary

Course content is stored separately from application logic and seeded into the database.

## Gamification

The application includes:

- XP
- Hearts
- Streaks
- Gems
- Daily goals
- Skill progress
- Leaderboard
- Lesson completion celebrations

## Accounts

The application is designed to support independent learner accounts.

Planned authentication:

- Email/password registration and login using secure HTTP-only cookie-based sessions (primary flow). Do not store credentials or session tokens in localStorage.
- Logout endpoint that clears server-side sessions and the session cookie.
- Persistent sessions with a documented expiration/renewal policy.
- Google sign-in: optional (P1) and to be implemented only after the core learning experience is stable. The architecture will expose an extension point for external auth providers.

Learner progress is associated with the authenticated user rather than a hard-coded demo account.

## Technology Stack

### Frontend

- Next.js
- TypeScript
- React

### Backend

- Python
- FastAPI

### Database

- SQLite
- SQLAlchemy

### Development

- Git
- AI-assisted development
- Automated tests
- Local development environment

## Architecture

```text
┌───────────────────────────────┐
│           Next.js             │
│       TypeScript / React      │
└───────────────┬───────────────┘
                │
                │ REST API
                ▼
┌───────────────────────────────┐
│           FastAPI             │
│  API + Services + Validation  │
└───────────────┬───────────────┘
                │
                │ SQLAlchemy
                ▼
┌───────────────────────────────┐
│            SQLite             │
│ Users / Course / Progress     │
└───────────────────────────────┘
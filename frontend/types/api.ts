// Type definitions matching the FastAPI backend API contracts

export interface Unit {
  id: number;
  slug: string;
  title: string;
  description: string | null;
  sort_order: number | null;
}

export interface Skill {
  id: number;
  slug: string;
  title: string;
  description: string | null;
  sort_order: number | null;
  unlocked: boolean;
  progress?: {
    xp: number;
    mastered: boolean;
  };
}

export interface Lesson {
  id: number;
  content_id: string;
  title: string;
  sort_order: number | null;
  hearts_allowed: number;
  xp_reward: number;
  unlocked?: boolean;
}

export interface Exercise {
  id: number;
  content_id: string;
  type: 'multiple_choice' | 'word_bank' | 'matching' | 'fill_blank' | 'type_answer';
  prompt: string;
  payload: Record<string, unknown>;
  audio_asset_key?: string | null;
  audio_url?: string | null;
  speaking_mode?: boolean | null;
}

export interface LessonWithExercises extends Lesson {
  exercises: Exercise[];
}

export interface User {
  id: number;
  display_name: string | null;
}

export interface Progress {
  user_id: number;
  xp: number;
  streak_count: number;
  gems: number;
  daily_xp: number;
  daily_goal_target: number;
  last_active: string | null;
  current_hearts: number;
  minutes_until_next_heart: number;
  skills: Array<{
    skill_id: number;
    xp: number;
    mastered: boolean;
  }>;
  lessons: Array<{
    lesson_id: number;
    completed: boolean;
    attempts_count: number;
  }>;
}

export interface AttemptResult {
  result: 'correct' | 'incorrect';
  xp_awarded: number;
  correct_answers: string[];
  explanation?: string;
  progress: Progress;
}

export interface CompletionResult {
  lesson_completed: boolean;
  xp_total: number;
  next_skill_unlocked: boolean;
  progress: Progress;
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface Mistake {
  attempt_id: number;
  exercise_id: number;
  exercise_type: string;
  prompt: string;
  user_answer: string | null;
  correct_answers: string[];
  explanation?: string;
  created_at: string;
}

export interface VocabularyItem {
  id: number;
  german: string;
  english_meaning: string;
  article: string | null;
  plural: string | null;
  category: string | null;
  example_german: string | null;
  example_english: string | null;
}

export interface PracticeExercise {
  id: number;
  content_id: string;
  type: string;
  prompt: string;
  payload: Record<string, unknown>;
  lesson_id: number;
}

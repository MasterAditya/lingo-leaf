// Centralized API client for FastAPI backend
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://lingo-leaf.onrender.com';

class ApiError extends Error {
  constructor(public code: string, message: string, public details?: unknown) {
    super(message);
    this.name = 'ApiError';
  }
}

async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    credentials: 'include', // Important for HTTP-only cookies
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => null);
    const errorCode = error?.error?.code;
    const errorMessage = error?.error?.message;
    
    if (response.status === 401) {
      throw new ApiError(errorCode || 'UNAUTHORIZED', errorMessage || 'Authentication required');
    }
    if (response.status === 403) {
      throw new ApiError(errorCode || 'FORBIDDEN', errorMessage || 'Access denied');
    }
    if (response.status === 404) {
      throw new ApiError(errorCode || 'NOT_FOUND', errorMessage || 'Resource not found');
    }
    if (response.status === 409) {
      throw new ApiError(errorCode || 'CONFLICT', errorMessage || 'Conflict');
    }
    if (response.status === 422) {
      throw new ApiError(errorCode || 'VALIDATION_ERROR', errorMessage || 'Validation failed');
    }
    throw new ApiError(errorCode || 'UNKNOWN', errorMessage || `HTTP ${response.status}: ${response.statusText}`);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

// Authentication
export async function register(email: string, password: string, displayName?: string) {
  return fetchApi<{ user: { id: number; display_name: string | null } }>(
    '/api/auth/register',
    {
      method: 'POST',
      body: JSON.stringify({ email, password, display_name: displayName }),
    }
  );
}

export async function login(email: string, password: string) {
  return fetchApi<{ user: { id: number; display_name: string | null } }>(
    '/api/auth/login',
    {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }
  );
}

export async function logout() {
  try {
    await fetchApi<void>('/api/auth/logout', { method: 'POST' });
  } catch (error) {
    // Log error but don't prevent redirect
    console.error('Logout API call failed:', error);
  }
}

export async function getCurrentUser() {
  return fetchApi<{ id: number; display_name: string | null }>('/api/auth/me');
}

export async function updateProfile(displayName: string) {
  return fetchApi<{ id: number; display_name: string }>('/api/auth/me', {
    method: 'PUT',
    body: JSON.stringify({ display_name: displayName }),
  });
}

export async function forgotPassword(email: string) {
  return fetchApi<{ message: string }>('/api/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export async function resetPassword(token: string, newPassword: string) {
  return fetchApi<{ message: string }>('/api/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ token, new_password: newPassword }),
  });
}

// Course content
export async function getUnits() {
  return fetchApi<{ units: import('../types/api').Unit[] }>('/api/units');
}

export async function getSkills(unitId: number) {
  return fetchApi<{ skills: import('../types/api').Skill[] }>(`/api/units/${unitId}/skills`);
}

export async function getLessons(skillId: number) {
  return fetchApi<{ lessons: import('../types/api').Lesson[] }>(`/api/skills/${skillId}/lessons`);
}

export async function getLesson(lessonId: number) {
  return fetchApi<{ lesson: import('../types/api').LessonWithExercises }>(`/api/lessons/${lessonId}`);
}

// Exercise attempts
export async function submitAttempt(exerciseId: number, response: unknown) {
  return fetchApi<import('../types/api').AttemptResult>(
    `/api/exercises/${exerciseId}/attempt`,
    {
      method: 'POST',
      body: JSON.stringify({ response }),
    }
  );
}

export async function completeLesson(lessonId: number) {
  return fetchApi<import('../types/api').CompletionResult>(
    `/api/lessons/${lessonId}/complete`,
    {
      method: 'POST',
      body: JSON.stringify({ summary: {} }),
    }
  );
}

// Progress
export async function getProgress(userId: number) {
  return fetchApi<import('../types/api').Progress>(`/api/users/${userId}/progress`);
}

// Practice
export async function getMistakes(userId: number) {
  return fetchApi<{ mistakes: Array<{
    attempt_id: number;
    exercise_id: number;
    exercise_type: string;
    prompt: string;
    user_answer: string | null;
    correct_answers: string[];
    explanation?: string;
    created_at: string;
  }> }>(`/api/users/${userId}/mistakes`);
}

export async function getLearnedVocabulary(userId: number) {
  return fetchApi<{ vocabulary: Array<{
    id: number;
    german: string;
    english_meaning: string;
    article: string | null;
    plural: string | null;
    category: string | null;
    example_german: string | null;
    example_english: string | null;
  }> }>(`/api/users/${userId}/vocabulary`);
}

export async function getPracticeExercises(userId: number) {
  return fetchApi<{ exercises: Array<{
    id: number;
    content_id: string;
    type: string;
    prompt: string;
    payload: Record<string, unknown>;
    lesson_id: number;
  }> }>(`/api/users/${userId}/practice-exercises`);
}

export { ApiError };

'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import MultipleChoiceExercise from '@/components/exercises/MultipleChoiceExercise';
import WordBankExercise from '@/components/exercises/WordBankExercise';
import MatchingExercise from '@/components/exercises/MatchingExercise';
import FillBlankExercise from '@/components/exercises/FillBlankExercise';
import TypeAnswerExercise from '@/components/exercises/TypeAnswerExercise';
import { getLesson, submitAttempt, completeLesson, getProgress, getCurrentUser, ApiError } from '@/lib/api';
import type { LessonWithExercises, CompletionResult, Progress } from '@/types/api';

export default function LessonPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const lessonId = parseInt(id);
  
  const [lesson, setLesson] = useState<LessonWithExercises | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [hearts, setHearts] = useState<number>(5);
  const [minutesUntilNextHeart, setMinutesUntilNextHeart] = useState<number>(0);
  const [totalXP, setTotalXP] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ correct: boolean; message: string; xp: number; correctAnswer?: string } | null>(null);
  const [error, setError] = useState('');
  const [completed, setCompleted] = useState(false);
  const [completionResult, setCompletionResult] = useState<CompletionResult | null>(null);
  const [mistakes, setMistakes] = useState<Array<{ exerciseId: number; question: string; userAnswer: string; correctAnswer: string; explanation: string }>>([]);
  const [showMistakeReview, setShowMistakeReview] = useState(false);

  useEffect(() => {
    async function loadLesson() {
      try {
        const data = await getLesson(lessonId);
        setLesson(data.lesson);
        
        // Load user's current hearts
        try {
          const userData = await getCurrentUser();
          const progressData = await getProgress(userData.id);
          setHearts(progressData.current_hearts);
          setMinutesUntilNextHeart(progressData.minutes_until_next_heart);
        } catch {
          // If progress fails, use lesson default
          setHearts(data.lesson.hearts_allowed);
        }
      } catch (err) {
        if (err instanceof ApiError) {
          if (err.code === 'UNAUTHORIZED') {
            router.push('/login');
          } else if (err.code === 'FORBIDDEN') {
            setError('This lesson is locked. Complete previous skills to unlock it.');
          } else {
            setError('Failed to load lesson');
          }
        } else {
          setError('An unexpected error occurred');
        }
      } finally {
        setLoading(false);
      }
    }
    loadLesson();
  }, [lessonId, router]);

  // Countdown timer for heart regeneration
  useEffect(() => {
    if (hearts >= 5 || minutesUntilNextHeart <= 0) return;

    const interval = setInterval(() => {
      setMinutesUntilNextHeart((prev) => {
        if (prev <= 1) {
          // Heart regenerated, refresh progress
          getCurrentUser().then(userData => {
            getProgress(userData.id).then(progressData => {
              setHearts(progressData.current_hearts);
              setMinutesUntilNextHeart(progressData.minutes_until_next_heart);
            });
          });
          return 0;
        }
        return prev - 1;
      });
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [hearts, minutesUntilNextHeart]);

  const currentExercise = lesson?.exercises[currentIndex];

  const handleSubmit = async (answer: unknown) => {
    if (!currentExercise || submitting) return;

    setSubmitting(true);
    setFeedback(null);

    try {
      const result = await submitAttempt(currentExercise.id, answer);
      setHearts(result.progress.current_hearts);
      setMinutesUntilNextHeart(result.progress.minutes_until_next_heart);
      setTotalXP((prev) => prev + result.xp_awarded);
      
      const isCorrect = result.result === 'correct';
      const correctAnswer = result.correct_answers?.[0] || '';
      
      setFeedback({
        correct: isCorrect,
        message: result.explanation || (isCorrect ? 'Correct!' : 'Incorrect'),
        xp: result.xp_awarded,
        correctAnswer,
      });

      // Track mistakes
      if (!isCorrect) {
        setMistakes((prev) => [
          ...prev,
          {
            exerciseId: currentExercise.id,
            question: currentExercise.prompt,
            userAnswer: String(answer),
            correctAnswer,
            explanation: result.explanation || '',
          },
        ]);
      }

      // Auto-advance after short delay
      setTimeout(() => {
        setFeedback(null);
        if (result.progress.current_hearts === 0) {
          setError('No hearts remaining. Try again later!');
          setTimeout(() => {
            router.push('/learn');
          }, 2000);
        } else if (currentIndex < (lesson?.exercises.length || 0) - 1) {
          setCurrentIndex((prev) => prev + 1);
        } else {
          handleCompleteLesson();
        }
      }, 1500);
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.code === 'OUT_OF_HEARTS') {
          setError('No hearts remaining. Try again later!');
          setTimeout(() => {
            router.push('/learn');
          }, 2000);
        } else if (error.code === 'LESSON_ALREADY_COMPLETED') {
          // Allow replay - don't block on already completed
          setFeedback({
            correct: true,
            message: 'Lesson already completed. Practicing for review.',
            xp: 0,
          });
          setTimeout(() => {
            setFeedback(null);
            if (currentIndex < (lesson?.exercises.length || 0) - 1) {
              setCurrentIndex((prev) => prev + 1);
            } else {
              handleCompleteLesson();
            }
          }, 1500);
        } else {
          setError(error.message);
        }
      } else {
        setError('Failed to submit answer');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleCompleteLesson = async () => {
    try {
      const result = await completeLesson(lessonId);
      if (result.lesson_completed) {
        setCompletionResult(result);
        setCompleted(true);
      } else {
        setError('Complete all exercises correctly to finish the lesson.');
      }
    } catch {
      setError('Failed to complete lesson');
    }
  };

  const handleReturnToPath = () => {
    router.push('/learn');
  };

  const handleReplayLesson = () => {
    setCurrentIndex(0);
    setTotalXP(0);
    setMistakes([]);
    setCompleted(false);
    setCompletionResult(null);
    setShowMistakeReview(false);
  };

  const handleReviewMistakes = () => {
    setShowMistakeReview(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading lesson...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-2xl mx-auto px-4 py-8">
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg">
            {error}
          </div>
        </main>
      </div>
    );
  }

  if (showMistakeReview) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-2xl mx-auto px-4 py-8">
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Mistake Review</h2>
              <button
                onClick={() => setShowMistakeReview(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {mistakes.length === 0 ? (
              <p className="text-gray-600 text-center py-8">No mistakes to review!</p>
            ) : (
              <div className="space-y-4">
                {mistakes.map((mistake, index) => (
                  <div key={index} className="bg-red-50 border border-red-200 rounded-xl p-4">
                    <p className="font-medium text-gray-800 mb-2">{mistake.question}</p>
                    <div className="space-y-1 text-sm">
                      <p className="text-red-700">
                        <span className="font-medium">Your answer:</span> {mistake.userAnswer}
                      </p>
                      <p className="text-green-700">
                        <span className="font-medium">Correct answer:</span> {mistake.correctAnswer}
                      </p>
                      {mistake.explanation && (
                        <p className="text-gray-600">{mistake.explanation}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() => setShowMistakeReview(false)}
              className="mt-6 w-full bg-gray-500 hover:bg-gray-600 text-white font-semibold py-3 px-6 rounded-xl transition"
            >
              Back to Results
            </button>
          </div>
        </main>
      </div>
    );
  }

  if (completed && completionResult) {
    const allCorrect = mistakes.length === 0;
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-green-100">
        <Header />
        <main className="max-w-2xl mx-auto px-4 py-8">
          <div className="bg-white rounded-3xl shadow-2xl p-8 text-center border border-gray-100">
            <div className={`w-28 h-28 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg ${
              allCorrect ? 'bg-gradient-to-br from-green-500 to-emerald-500' : 'bg-gradient-to-br from-yellow-500 to-amber-500'
            }`}>
              {allCorrect ? (
                <svg className="w-14 h-14 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-14 h-14 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              )}
            </div>
            <h1 className="text-4xl font-bold text-gray-800 mb-3">
              {allCorrect ? 'Lesson Complete!' : 'Lesson Finished'}
            </h1>
            <p className="text-gray-600 mb-8 text-lg">
              {allCorrect ? 'Great job! You completed this lesson perfectly.' : `You made ${mistakes.length} mistake${mistakes.length > 1 ? 's' : ''}. Keep practicing!`}
            </p>
            
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-100 shadow-sm">
                <p className="text-4xl font-bold text-green-600">{completionResult.xp_total}</p>
                <p className="text-sm font-medium text-gray-600 mt-1">XP Earned</p>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100 shadow-sm">
                <p className="text-4xl font-bold text-blue-600">{completionResult.progress.xp}</p>
                <p className="text-sm font-medium text-gray-600 mt-1">Total XP</p>
              </div>
            </div>

            {!allCorrect && (
              <div className="bg-gradient-to-br from-red-50 to-pink-50 border border-red-200 rounded-2xl p-5 mb-6">
                <p className="text-red-800 font-bold mb-2">Mistakes: {mistakes.length}</p>
                <button
                  onClick={handleReviewMistakes}
                  className="text-sm font-bold text-red-700 hover:text-red-900 underline"
                >
                  Review Mistakes
                </button>
              </div>
            )}

            {completionResult.next_skill_unlocked && (
              <div className="bg-gradient-to-br from-yellow-50 to-amber-50 border border-yellow-200 rounded-2xl p-5 mb-6">
                <p className="text-yellow-800 font-bold">🎉 New skill unlocked!</p>
              </div>
            )}

            <div className="space-y-3">
              <button
                onClick={handleReplayLesson}
                className="w-full bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white font-bold py-4 px-6 rounded-2xl transition-all duration-200 shadow-md hover:shadow-lg"
              >
                Replay Lesson
              </button>
              <button
                onClick={handleReturnToPath}
                className="w-full bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-bold py-4 px-6 rounded-2xl transition-all duration-200 shadow-md hover:shadow-lg"
              >
                Back to Learn
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!lesson || !currentExercise) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-2xl mx-auto px-4 py-8">
          <div className="bg-gray-100 rounded-xl p-8 text-center">
            <p className="text-gray-600">Lesson not found</p>
          </div>
        </main>
      </div>
    );
  }

  const progress = ((currentIndex + 1) / lesson.exercises.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-emerald-50/30">
      <Header />
      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-2xl font-bold text-gray-800">{lesson.title}</h1>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 bg-red-50 px-3 py-1.5 rounded-full border border-red-100">
                <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
                <span className="font-bold text-red-700">{hearts}</span>
                {hearts < 5 && minutesUntilNextHeart > 0 && (
                  <span className="text-xs text-red-600 ml-1">
                    +{minutesUntilNextHeart}m
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-2 bg-yellow-50 px-3 py-1.5 rounded-full border border-yellow-100">
                <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                </svg>
                <span className="font-bold text-yellow-700">{totalXP}</span>
              </div>
            </div>
          </div>
          <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden shadow-inner">
            <div className="h-full bg-gradient-to-r from-emerald-400 to-green-500 transition-all duration-500 rounded-full" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-sm text-gray-500 mt-2 font-medium">
            {currentIndex + 1} of {lesson.exercises.length}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 mb-6">
          {currentExercise.type === 'multiple_choice' && (
            <MultipleChoiceExercise
              exercise={currentExercise}
              onSubmit={handleSubmit}
              disabled={submitting || !!feedback}
            />
          )}
          {currentExercise.type === 'word_bank' && (
            <WordBankExercise
              exercise={currentExercise}
              onSubmit={handleSubmit}
              disabled={submitting || !!feedback}
            />
          )}
          {currentExercise.type === 'matching' && (
            <MatchingExercise
              exercise={currentExercise}
              onSubmit={handleSubmit}
              disabled={submitting || !!feedback}
            />
          )}
          {currentExercise.type === 'fill_blank' && (
            <FillBlankExercise
              exercise={currentExercise}
              onSubmit={handleSubmit}
              disabled={submitting || !!feedback}
            />
          )}
          {currentExercise.type === 'type_answer' && (
            <TypeAnswerExercise
              exercise={currentExercise}
              onSubmit={handleSubmit}
              disabled={submitting || !!feedback}
            />
          )}
        </div>

        {feedback && (
          <div
            className={`rounded-2xl shadow-xl p-6 border-2 ${
              feedback.correct ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200' : 'bg-gradient-to-br from-red-50 to-pink-50 border-red-200'
            }`}
          >
            <div className="flex items-start space-x-4">
              <div
                className={`w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md ${
                  feedback.correct ? 'bg-gradient-to-br from-green-500 to-emerald-500' : 'bg-gradient-to-br from-red-500 to-pink-500'
                }`}
              >
                {feedback.correct ? (
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </div>
              <div className="flex-1">
                <h3 className={`text-xl font-bold ${feedback.correct ? 'text-green-800' : 'text-red-800'}`}>
                  {feedback.correct ? 'Correct!' : 'Incorrect'}
                </h3>
                <p className={`mt-2 ${feedback.correct ? 'text-green-700' : 'text-red-700'}`}>{feedback.message}</p>
                {feedback.xp > 0 && (
                  <div className="mt-3 inline-flex items-center space-x-1 bg-green-100 px-3 py-1 rounded-full">
                    <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                    </svg>
                    <span className="text-sm font-bold text-green-600">+{feedback.xp} XP</span>
                  </div>
                )}
                {!feedback.correct && feedback.correctAnswer && (
                  <div className="mt-3 p-3 bg-white rounded-lg border border-gray-200">
                    <p className="text-sm text-gray-600">
                      <span className="font-bold">Correct answer:</span> {feedback.correctAnswer}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

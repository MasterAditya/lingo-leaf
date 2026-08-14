'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import MultipleChoiceExercise from '@/components/exercises/MultipleChoiceExercise';
import WordBankExercise from '@/components/exercises/WordBankExercise';
import MatchingExercise from '@/components/exercises/MatchingExercise';
import FillBlankExercise from '@/components/exercises/FillBlankExercise';
import TypeAnswerExercise from '@/components/exercises/TypeAnswerExercise';
import { getCurrentUser, getPracticeExercises, submitAttempt, ApiError } from '@/lib/api';
import type { PracticeExercise, Exercise } from '@/types/api';

export default function QuickPracticePage() {
  const router = useRouter();
  const [exercises, setExercises] = useState<PracticeExercise[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ correct: boolean; message: string; xp: number; correctAnswer?: string } | null>(null);
  const [completed, setCompleted] = useState(false);
  const [totalXP, setTotalXP] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);

  useEffect(() => {
    async function loadExercises() {
      try {
        const userData = await getCurrentUser();
        const exercisesData = await getPracticeExercises(userData.id);
        setExercises(exercisesData.exercises);
      } catch (err) {
        if (err instanceof ApiError && err.code === 'UNAUTHORIZED') {
          router.push('/login');
        }
      } finally {
        setLoading(false);
      }
    }
    loadExercises();
  }, [router]);

  const currentExercise = exercises[currentIndex];

  // Convert PracticeExercise to Exercise format for components
  const convertToExercise = (pe: PracticeExercise): Exercise => ({
    id: pe.id,
    content_id: pe.content_id,
    type: pe.type as any,
    prompt: pe.prompt,
    payload: pe.payload,
  });

  const handleSubmit = async (answer: unknown) => {
    if (!currentExercise || submitting) return;

    setSubmitting(true);
    setFeedback(null);

    try {
      const result = await submitAttempt(currentExercise.id, answer);
      setTotalXP((prev) => prev + result.xp_awarded);
      
      const isCorrect = result.result === 'correct';
      const correctAnswer = result.correct_answers?.[0] || '';
      
      if (isCorrect) {
        setCorrectCount(prev => prev + 1);
      }
      
      setFeedback({
        correct: isCorrect,
        message: result.explanation || (isCorrect ? 'Correct!' : 'Incorrect'),
        xp: result.xp_awarded,
        correctAnswer,
      });

      // Auto-advance after short delay
      setTimeout(() => {
        setFeedback(null);
        if (currentIndex < exercises.length - 1) {
          setCurrentIndex((prev) => prev + 1);
        } else {
          setCompleted(true);
        }
      }, 1500);
    } catch (error) {
      if (error instanceof ApiError) {
        setFeedback({
          correct: false,
          message: error.message,
          xp: 0,
        });
      } else {
        setFeedback({
          correct: false,
          message: 'Failed to submit answer',
          xp: 0,
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading practice exercises...</p>
        </div>
      </div>
    );
  }

  if (exercises.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
            <svg className="w-16 h-16 text-yellow-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">No Practice Exercises</h2>
            <p className="text-gray-600 mb-6">Complete some lessons to unlock quick practice.</p>
            <Link
              href="/practice"
              className="inline-block bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-6 rounded-xl transition"
            >
              Back to Practice
            </Link>
          </div>
        </main>
      </div>
    );
  }

  if (completed) {
    const accuracy = Math.round((correctCount / exercises.length) * 100);
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-green-100">
        <Header />
        <main className="max-w-2xl mx-auto px-4 py-8">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="w-24 h-24 rounded-full bg-emerald-500 flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Practice Complete!</h1>
            <p className="text-gray-600 mb-6">
              Great job! You've completed your quick practice session.
            </p>
            
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-emerald-50 rounded-xl p-4">
                <p className="text-3xl font-bold text-emerald-600">{totalXP}</p>
                <p className="text-sm text-gray-600">XP Earned</p>
              </div>
              <div className="bg-blue-50 rounded-xl p-4">
                <p className="text-3xl font-bold text-blue-600">{accuracy}%</p>
                <p className="text-sm text-gray-600">Accuracy</p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <p className="text-gray-800">
                <span className="font-medium">{correctCount}</span> of {exercises.length} exercises correct
              </p>
            </div>

            <div className="space-y-3">
              <Link
                href="/practice/quick"
                className="block w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-3 px-6 rounded-xl transition text-center"
                onClick={() => window.location.reload()}
              >
                Practice Again
              </Link>
              <Link
                href="/practice"
                className="block w-full bg-gray-500 hover:bg-gray-600 text-white font-semibold py-3 px-6 rounded-xl transition text-center"
              >
                Back to Practice
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const progress = ((currentIndex + 1) / exercises.length) * 100;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <Link href="/practice" className="text-gray-600 hover:text-gray-800 flex items-center space-x-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span>Back to Practice</span>
            </Link>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                </svg>
                <span className="font-semibold text-gray-700">{totalXP}</span>
              </div>
            </div>
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-sm text-gray-500 mt-1">
            {currentIndex + 1} of {exercises.length}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          {currentExercise.type === 'multiple_choice' && (
            <MultipleChoiceExercise
              exercise={convertToExercise(currentExercise)}
              onSubmit={handleSubmit}
              disabled={submitting || !!feedback}
            />
          )}
          {currentExercise.type === 'word_bank' && (
            <WordBankExercise
              exercise={convertToExercise(currentExercise)}
              onSubmit={handleSubmit}
              disabled={submitting || !!feedback}
            />
          )}
          {currentExercise.type === 'matching' && (
            <MatchingExercise
              exercise={convertToExercise(currentExercise)}
              onSubmit={handleSubmit}
              disabled={submitting || !!feedback}
            />
          )}
          {currentExercise.type === 'fill_blank' && (
            <FillBlankExercise
              exercise={convertToExercise(currentExercise)}
              onSubmit={handleSubmit}
              disabled={submitting || !!feedback}
            />
          )}
          {currentExercise.type === 'type_answer' && (
            <TypeAnswerExercise
              exercise={convertToExercise(currentExercise)}
              onSubmit={handleSubmit}
              disabled={submitting || !!feedback}
            />
          )}
        </div>

        {feedback && (
          <div
            className={`rounded-2xl shadow-lg p-6 ${
              feedback.correct ? 'bg-green-50 border-2 border-green-200' : 'bg-red-50 border-2 border-red-200'
            }`}
          >
            <div className="flex items-start space-x-4">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                  feedback.correct ? 'bg-green-500' : 'bg-red-500'
                }`}
              >
                {feedback.correct ? (
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </div>
              <div className="flex-1">
                <h3 className={`text-lg font-semibold ${feedback.correct ? 'text-green-800' : 'text-red-800'}`}>
                  {feedback.correct ? 'Correct!' : 'Incorrect'}
                </h3>
                <p className={`mt-1 ${feedback.correct ? 'text-green-700' : 'text-red-700'}`}>{feedback.message}</p>
                {feedback.xp > 0 && (
                  <p className="mt-2 text-sm font-medium text-green-600">+{feedback.xp} XP</p>
                )}
                {!feedback.correct && feedback.correctAnswer && (
                  <p className="mt-2 text-sm text-gray-600">
                    <span className="font-medium">Correct answer:</span> {feedback.correctAnswer}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
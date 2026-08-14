'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import { getCurrentUser, getMistakes, ApiError } from '@/lib/api';
import type { Mistake } from '@/types/api';

export default function ReviewMistakesPage() {
  const router = useRouter();
  const [mistakes, setMistakes] = useState<Mistake[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMistakeIndex, setCurrentMistakeIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);

  useEffect(() => {
    async function loadMistakes() {
      try {
        const userData = await getCurrentUser();
        const mistakesData = await getMistakes(userData.id);
        setMistakes(mistakesData.mistakes);
      } catch (err) {
        if (err instanceof ApiError && err.code === 'UNAUTHORIZED') {
          router.push('/login');
        }
      } finally {
        setLoading(false);
      }
    }
    loadMistakes();
  }, [router]);

  const handleNext = () => {
    if (currentMistakeIndex < mistakes.length - 1) {
      setCurrentMistakeIndex(prev => prev + 1);
      setShowAnswer(false);
    }
  };

  const handlePrevious = () => {
    if (currentMistakeIndex > 0) {
      setCurrentMistakeIndex(prev => prev - 1);
      setShowAnswer(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading mistakes...</p>
        </div>
      </div>
    );
  }

  if (mistakes.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
            <svg className="w-16 h-16 text-green-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">No Mistakes to Review</h2>
            <p className="text-gray-600 mb-6">Great job! You haven't made any mistakes yet.</p>
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

  const currentMistake = mistakes[currentMistakeIndex];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/practice" className="text-gray-600 hover:text-gray-800 flex items-center space-x-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span>Back to Practice</span>
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-800">Review Mistakes</h1>
            <span className="text-sm text-gray-500">
              {currentMistakeIndex + 1} of {mistakes.length}
            </span>
          </div>

          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mb-6">
            <div
              className="h-full bg-red-500 transition-all"
              style={{ width: `${((currentMistakeIndex + 1) / mistakes.length) * 100}%` }}
            />
          </div>

          <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-6">
            <h3 className="font-semibold text-gray-800 mb-2">Question:</h3>
            <p className="text-gray-700 mb-4">{currentMistake.prompt}</p>

            <div className="space-y-2">
              <div className="flex items-start space-x-2">
                <span className="text-red-600 font-medium">Your answer:</span>
                <span className="text-gray-700">{currentMistake.user_answer || 'No answer provided'}</span>
              </div>

              {showAnswer && (
                <div className="space-y-2 pt-2 border-t border-red-200">
                  <div className="flex items-start space-x-2">
                    <span className="text-green-600 font-medium">Correct answer:</span>
                    <span className="text-gray-700">
                      {Array.isArray(currentMistake.correct_answers) 
                        ? currentMistake.correct_answers.join(', ') 
                        : currentMistake.correct_answers}
                    </span>
                  </div>
                  {currentMistake.explanation && (
                    <div className="pt-2">
                      <span className="text-gray-600 text-sm">{currentMistake.explanation}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {!showAnswer && (
              <button
                onClick={() => setShowAnswer(true)}
                className="mt-4 bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-lg transition"
              >
                Show Answer
              </button>
            )}
          </div>

          <div className="flex items-center justify-between">
            <button
              onClick={handlePrevious}
              disabled={currentMistakeIndex === 0}
              className="bg-gray-500 hover:bg-gray-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-2 px-6 rounded-xl transition"
            >
              Previous
            </button>

            {currentMistakeIndex < mistakes.length - 1 ? (
              <button
                onClick={handleNext}
                className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-6 rounded-xl transition"
              >
                Next
              </button>
            ) : (
              <Link
                href="/practice"
                className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-6 rounded-xl transition"
              >
                Finish Review
              </Link>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
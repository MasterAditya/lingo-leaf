'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import { getProgress, getCurrentUser, getMistakes, getLearnedVocabulary, getPracticeExercises, ApiError } from '@/lib/api';
import type { Progress } from '@/types/api';

export default function PracticePage() {
  const router = useRouter();
  const [progress, setProgress] = useState<Progress | null>(null);
  const [hasMistakes, setHasMistakes] = useState(false);
  const [hasVocabulary, setHasVocabulary] = useState(false);
  const [hasPracticeExercises, setHasPracticeExercises] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const userData = await getCurrentUser();
        const progressData = await getProgress(userData.id);
        setProgress(progressData);
        
        // Check if user has practice data
        const [mistakesData, vocabData, exercisesData] = await Promise.all([
          getMistakes(userData.id),
          getLearnedVocabulary(userData.id),
          getPracticeExercises(userData.id),
        ]);
        
        setHasMistakes(mistakesData.mistakes.length > 0);
        setHasVocabulary(vocabData.vocabulary.length > 0);
        setHasPracticeExercises(exercisesData.exercises.length > 0);
      } catch (err) {
        if (err instanceof ApiError && err.code === 'UNAUTHORIZED') {
          router.push('/login');
        }
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading practice options...</p>
        </div>
      </div>
    );
  }

  const completedLessons = progress?.lessons?.filter(l => l.completed) || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30">
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent mb-2">Practice</h1>
          <p className="text-gray-600">Strengthen your skills with focused practice sessions.</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Review Mistakes */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-14 h-14 bg-gradient-to-br from-red-400 to-red-500 rounded-xl flex items-center justify-center shadow-md">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-800">Review Mistakes</h3>
                <p className="text-sm text-gray-500">Practice exercises you got wrong</p>
              </div>
            </div>
            {!hasMistakes ? (
              <button
                disabled
                className="w-full bg-gray-200 cursor-not-allowed text-gray-400 font-semibold py-3 px-6 rounded-xl transition"
              >
                No mistakes to review
              </button>
            ) : (
              <Link
                href="/practice/review-mistakes"
                className="block w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg text-center"
              >
                Start Review
              </Link>
            )}
          </div>

          {/* Practice Vocabulary */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-blue-500 rounded-xl flex items-center justify-center shadow-md">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-800">Practice Vocabulary</h3>
                <p className="text-sm text-gray-500">Review words you've learned</p>
              </div>
            </div>
            {!hasVocabulary ? (
              <button
                disabled
                className="w-full bg-gray-200 cursor-not-allowed text-gray-400 font-semibold py-3 px-6 rounded-xl transition"
              >
                No vocabulary to practice
              </button>
            ) : (
              <Link
                href="/practice/vocabulary"
                className="block w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg text-center"
              >
                Start Practice
              </Link>
            )}
          </div>

          {/* Quick Practice */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-14 h-14 bg-gradient-to-br from-emerald-400 to-green-500 rounded-xl flex items-center justify-center shadow-md">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-800">Quick Practice</h3>
                <p className="text-sm text-gray-500">Mixed exercises from completed lessons</p>
              </div>
            </div>
            {!hasPracticeExercises ? (
              <button
                disabled
                className="w-full bg-gray-200 cursor-not-allowed text-gray-400 font-semibold py-3 px-6 rounded-xl transition"
              >
                No exercises to practice
              </button>
            ) : (
              <Link
                href="/practice/quick"
                className="block w-full bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg text-center"
              >
                Start Practice
              </Link>
            )}
          </div>

          {/* Timed Challenge */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 opacity-60">
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-400 to-purple-500 rounded-xl flex items-center justify-center shadow-md">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-800">Timed Challenge</h3>
                <p className="text-sm text-gray-500">Race against the clock</p>
              </div>
            </div>
            <button
              disabled
              className="w-full bg-gradient-to-r from-purple-500 to-purple-600 disabled:from-gray-300 disabled:to-gray-400 disabled:text-gray-500 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-xl transition"
            >
              Coming Soon
            </button>
          </div>
        </div>

        {completedLessons.length === 0 && (
          <div className="mt-8 bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-200 rounded-2xl p-8 text-center shadow-sm">
            <svg className="w-16 h-16 text-amber-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-xl font-bold text-amber-800 mb-2">No Practice Data Yet</h3>
            <p className="text-amber-700 mb-6">Complete some lessons to unlock practice modes.</p>
            <Link
              href="/learn"
              className="inline-block bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white font-semibold py-3 px-8 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg"
            >
              Go to Learn
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}

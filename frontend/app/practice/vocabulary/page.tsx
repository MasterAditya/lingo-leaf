'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import { getCurrentUser, getLearnedVocabulary, ApiError } from '@/lib/api';
import type { VocabularyItem } from '@/types/api';

export default function PracticeVocabularyPage() {
  const router = useRouter();
  const [vocabulary, setVocabulary] = useState<VocabularyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('all');

  useEffect(() => {
    async function loadVocabulary() {
      try {
        const userData = await getCurrentUser();
        const vocabData = await getLearnedVocabulary(userData.id);
        setVocabulary(vocabData.vocabulary);
      } catch (err) {
        if (err instanceof ApiError && err.code === 'UNAUTHORIZED') {
          router.push('/login');
        }
      } finally {
        setLoading(false);
      }
    }
    loadVocabulary();
  }, [router]);

  const categories = Array.from(new Set(vocabulary.map(v => v.category).filter(Boolean)));
  const filteredVocabulary = filterCategory === 'all' 
    ? vocabulary 
    : vocabulary.filter(v => v.category === filterCategory);

  const currentWord = filteredVocabulary[currentIndex];

  const handleNext = () => {
    if (currentIndex < filteredVocabulary.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setFlipped(false);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setFlipped(false);
    }
  };

  const handleFlip = () => {
    setFlipped(!flipped);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading vocabulary...</p>
        </div>
      </div>
    );
  }

  if (vocabulary.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
            <svg className="w-16 h-16 text-yellow-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">No Vocabulary Yet</h2>
            <p className="text-gray-600 mb-6">Complete some lessons to build your vocabulary.</p>
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

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Practice Vocabulary</h1>
          <p className="text-gray-600">Review words you've learned from completed lessons.</p>
        </div>

        {categories.length > 0 && (
          <div className="mb-6 flex flex-wrap gap-2">
            <button
              onClick={() => setFilterCategory('all')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filterCategory === 'all' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              All ({vocabulary.length})
            </button>
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setFilterCategory(category || 'all')}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  filterCategory === category 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                {category} ({vocabulary.filter(v => v.category === category).length})
              </button>
            ))}
          </div>
        )}

        {filteredVocabulary.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
            <p className="text-gray-600">No vocabulary in this category.</p>
          </div>
        ) : (
          <>
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm text-gray-500">
                {currentIndex + 1} of {filteredVocabulary.length}
              </span>
              <span className="text-sm text-gray-500">
                Total: {vocabulary.length} words
              </span>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
              <div
                className="cursor-pointer"
                onClick={handleFlip}
                style={{ minHeight: '300px' }}
              >
                {!flipped ? (
                  /* Front - German */
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-8 flex flex-col items-center justify-center">
                    <div className="text-center">
                      {currentWord.article && (
                        <span className="text-lg text-blue-600 font-medium mr-2">{currentWord.article}</span>
                      )}
                      <h2 className="text-4xl font-bold text-gray-800 mb-4">{currentWord.german}</h2>
                      {currentWord.plural && (
                        <p className="text-gray-600">Plural: {currentWord.plural}</p>
                      )}
                      <p className="text-sm text-gray-500 mt-4">Click to reveal meaning</p>
                    </div>
                  </div>
                ) : (
                  /* Back - English */
                  <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-8 flex flex-col items-center justify-center">
                    <div className="text-center">
                      <h2 className="text-3xl font-bold text-gray-800 mb-4">{currentWord.english_meaning}</h2>
                      {currentWord.category && (
                        <span className="inline-block bg-green-200 text-green-800 px-3 py-1 rounded-full text-sm font-medium mb-4">
                          {currentWord.category}
                        </span>
                      )}
                      {currentWord.example_german && currentWord.example_english && (
                        <div className="mt-4 p-4 bg-white rounded-lg">
                          <p className="text-gray-700 text-sm">{currentWord.example_german}</p>
                          <p className="text-gray-500 text-sm mt-1">{currentWord.example_english}</p>
                        </div>
                      )}
                      <p className="text-sm text-gray-500 mt-4">Click to see German</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <button
                onClick={handlePrevious}
                disabled={currentIndex === 0}
                className="bg-gray-500 hover:bg-gray-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-2 px-6 rounded-xl transition"
              >
                Previous
              </button>

              <button
                onClick={handleFlip}
                className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-6 rounded-xl transition"
              >
                {flipped ? 'Show German' : 'Show English'}
              </button>

              {currentIndex < filteredVocabulary.length - 1 ? (
                <button
                  onClick={handleNext}
                  className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-6 rounded-xl transition"
                >
                  Next
                </button>
              ) : (
                <Link
                  href="/practice"
                  className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-6 rounded-xl transition"
                >
                  Finish
                </Link>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
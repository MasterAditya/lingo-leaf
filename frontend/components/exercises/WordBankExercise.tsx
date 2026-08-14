'use client';

import { useState } from 'react';
import type { Exercise } from '@/types/api';

interface WordBankExerciseProps {
  exercise: Exercise;
  onSubmit: (answer: string[]) => void;
  disabled: boolean;
}

export default function WordBankExercise({ exercise, onSubmit, disabled }: WordBankExerciseProps) {
  const [selectedWords, setSelectedWords] = useState<string[]>([]);
  const availableWords = (exercise.payload.words as string[]) || [];

  const toggleWord = (word: string) => {
    if (disabled) return;
    if (selectedWords.includes(word)) {
      setSelectedWords(selectedWords.filter((w) => w !== word));
    } else {
      setSelectedWords([...selectedWords, word]);
    }
  };

  const handleSubmit = () => {
    if (selectedWords.length > 0 && !disabled) {
      onSubmit(selectedWords);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-800">{exercise.prompt}</h2>

      <div className="min-h-16 p-4 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
        {selectedWords.length === 0 ? (
          <p className="text-gray-400 text-center">Select words to build your answer</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {selectedWords.map((word, index) => (
              <span
                key={index}
                onClick={() => !disabled && toggleWord(word)}
                className={`px-3 py-2 bg-green-100 text-green-800 rounded-lg cursor-pointer hover:bg-green-200 transition ${
                  disabled ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {word}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {availableWords.map((word: string, index: number) => (
          <button
            key={index}
            onClick={() => toggleWord(word)}
            disabled={disabled}
            className={`px-4 py-2 rounded-lg border-2 transition ${
              selectedWords.includes(word)
                ? 'border-green-500 bg-green-50 text-green-800 opacity-50 cursor-not-allowed'
                : 'border-gray-300 hover:border-green-300 text-gray-700'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {word}
          </button>
        ))}
      </div>

      <button
        onClick={handleSubmit}
        disabled={selectedWords.length === 0 || disabled}
        className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-xl transition"
      >
        Check
      </button>
    </div>
  );
}

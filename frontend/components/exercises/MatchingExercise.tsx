'use client';

import { useState } from 'react';
import type { Exercise } from '@/types/api';

interface MatchingExerciseProps {
  exercise: Exercise;
  onSubmit: (answer: Record<string, string>) => void;
  disabled: boolean;
}

export default function MatchingExercise({ exercise, onSubmit, disabled }: MatchingExerciseProps) {
  const [matches, setMatches] = useState<Record<string, string>>({});
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);

  const leftItems = (exercise.payload.left_items as string[]) || [];
  const rightItems = (exercise.payload.right_items as string[]) || [];

  const handleLeftClick = (item: string) => {
    if (disabled) return;
    setSelectedLeft(selectedLeft === item ? null : item);
  };

  const handleRightClick = (item: string) => {
    if (disabled || !selectedLeft) return;
    setMatches({ ...matches, [selectedLeft]: item });
    setSelectedLeft(null);
  };

  const handleRemoveMatch = (leftItem: string) => {
    if (disabled) return;
    const newMatches = { ...matches };
    delete newMatches[leftItem];
    setMatches(newMatches);
  };

  const handleSubmit = () => {
    if (Object.keys(matches).length === leftItems.length && !disabled) {
      onSubmit(matches);
    }
  };

  const isMatched = (item: string) => Object.values(matches).includes(item);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-800">{exercise.prompt}</h2>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Match these</h3>
          {leftItems.map((item: string, index: number) => {
            const matchedRight = matches[item];
            return (
              <div key={index} className="space-y-1">
                <button
                  onClick={() => handleLeftClick(item)}
                  disabled={disabled}
                  className={`w-full p-3 rounded-lg border-2 text-left transition ${
                    selectedLeft === item
                      ? 'border-green-500 bg-green-50 text-green-800'
                      : matchedRight
                      ? 'border-green-300 bg-green-100 text-green-700'
                      : 'border-gray-200 hover:border-green-300 text-gray-700'
                  } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  {item}
                </button>
                {matchedRight && (
                  <button
                    onClick={() => handleRemoveMatch(item)}
                    disabled={disabled}
                    className="w-full p-2 rounded bg-green-50 text-green-700 text-sm border border-green-200 hover:bg-green-100 transition"
                  >
                    → {matchedRight}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-600 mb-2">With these</h3>
          {rightItems.map((item: string, index: number) => (
            <button
              key={index}
              onClick={() => handleRightClick(item)}
              disabled={disabled || isMatched(item)}
              className={`w-full p-3 rounded-lg border-2 text-left transition ${
                isMatched(item)
                  ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                  : selectedLeft
                  ? 'border-green-300 hover:border-green-500 hover:bg-green-50 text-gray-700'
                  : 'border-gray-200 text-gray-700'
              } ${disabled ? 'opacity-50' : ''}`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={handleSubmit}
        disabled={Object.keys(matches).length !== leftItems.length || disabled}
        className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-xl transition"
      >
        Check
      </button>
    </div>
  );
}

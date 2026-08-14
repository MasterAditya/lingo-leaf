'use client';

import { useState } from 'react';
import type { Exercise } from '@/types/api';

interface MultipleChoiceExerciseProps {
  exercise: Exercise;
  onSubmit: (answer: string) => void;
  disabled: boolean;
}

export default function MultipleChoiceExercise({ exercise, onSubmit, disabled }: MultipleChoiceExerciseProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const options = (exercise.payload.options as string[]) || [];

  const handleSubmit = () => {
    if (selected && !disabled) {
      onSubmit(selected);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-800">{exercise.prompt}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {options.map((option: string, index: number) => (
          <button
            key={index}
            onClick={() => !disabled && setSelected(option)}
            disabled={disabled}
            className={`p-4 rounded-xl border-2 text-left transition ${
              selected === option
                ? 'border-green-500 bg-green-50 text-green-800'
                : 'border-gray-200 hover:border-green-300 hover:bg-gray-50 text-gray-700'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <span className="text-lg">{option}</span>
          </button>
        ))}
      </div>
      <button
        onClick={handleSubmit}
        disabled={!selected || disabled}
        className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-xl transition"
      >
        Check
      </button>
    </div>
  );
}

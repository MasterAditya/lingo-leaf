'use client';

import { useState } from 'react';
import type { Exercise } from '@/types/api';

interface TypeAnswerExerciseProps {
  exercise: Exercise;
  onSubmit: (answer: string) => void;
  disabled: boolean;
}

export default function TypeAnswerExercise({ exercise, onSubmit, disabled }: TypeAnswerExerciseProps) {
  const [answer, setAnswer] = useState('');

  const handleSubmit = () => {
    if (answer.trim() && !disabled) {
      onSubmit(answer.trim());
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-800">{exercise.prompt}</h2>

      <div>
        <input
          type="text"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          disabled={disabled}
          className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition disabled:opacity-50"
          placeholder="Type your answer..."
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          autoFocus
        />
        <p className="mt-2 text-sm text-gray-500">Type the German translation</p>
      </div>

      <button
        onClick={handleSubmit}
        disabled={!answer.trim() || disabled}
        className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-xl transition"
      >
        Check
      </button>
    </div>
  );
}

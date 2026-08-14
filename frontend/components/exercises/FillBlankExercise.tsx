'use client';

import { useState } from 'react';
import type { Exercise } from '@/types/api';

interface FillBlankExerciseProps {
  exercise: Exercise;
  onSubmit: (answer: string) => void;
  disabled: boolean;
}

export default function FillBlankExercise({ exercise, onSubmit, disabled }: FillBlankExerciseProps) {
  const [answer, setAnswer] = useState('');

  const handleSubmit = () => {
    if (answer.trim() && !disabled) {
      onSubmit(answer.trim());
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-800">{exercise.prompt}</h2>

      <div className="p-6 bg-gray-50 rounded-xl">
        <p className="text-lg text-gray-700 leading-relaxed">
          {(exercise.payload.sentence_before as string) && <span>{exercise.payload.sentence_before as string} </span>}
          <input
            type="text"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            disabled={disabled}
            className="inline-block w-32 px-3 py-2 border-b-2 border-green-500 bg-white text-center text-lg font-medium focus:outline-none focus:border-green-600 disabled:opacity-50"
            placeholder="..."
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          />
          {(exercise.payload.sentence_after as string) && <span> {exercise.payload.sentence_after as string}</span>}
        </p>
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

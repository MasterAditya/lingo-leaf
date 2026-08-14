'use client';

import { playSound, markAudioInteraction } from '@/lib/audio';

interface AudioIndicatorProps {
  audioUrl?: string | null;
  audioAssetKey?: string | null;
  speakingMode?: boolean | null;
}

export default function AudioIndicator({ audioUrl, audioAssetKey, speakingMode }: AudioIndicatorProps) {
  const handleClick = () => {
    markAudioInteraction();
    if (audioUrl) {
      // Play actual audio if available
      const audio = new Audio(audioUrl);
      audio.play().catch(() => {
        // Fallback if audio fails to load
        console.debug('Audio playback failed');
      });
    } else {
      // Show that audio is coming soon
      playSound('click');
    }
  };

  const hasAudio = audioUrl || audioAssetKey || speakingMode;

  if (!hasAudio) {
    return null;
  }

  return (
    <button
      onClick={handleClick}
      className="flex items-center space-x-2 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors duration-200"
      title={audioUrl ? 'Listen to audio' : 'Audio coming soon'}
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
      </svg>
      <span className="text-sm font-medium">
        {audioUrl ? '🔊 Listen' : '🔊 Audio coming soon'}
      </span>
    </button>
  );
}
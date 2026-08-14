'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { getProgress, getCurrentUser, ApiError } from '@/lib/api';
import type { Progress } from '@/types/api';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [progress, setProgress] = useState<Progress | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProgress() {
      try {
        const userData = await getCurrentUser();
        setUserName(userData.display_name);
        const progressData = await getProgress(userData.id);
        setProgress(progressData);
      } catch (err) {
        if (err instanceof ApiError && err.code === 'UNAUTHORIZED') {
          router.push('/login');
        }
      } finally {
        setLoading(false);
      }
    }
    loadProgress();
  }, [router]);

  const achievements: Achievement[] = [
    {
      id: 'first-lesson',
      title: 'First Steps',
      description: 'Complete your first lesson',
      icon: '🎯',
      unlocked: (progress?.lessons?.filter(l => l.completed).length || 0) >= 1,
      unlockedAt: (progress?.lessons?.filter(l => l.completed).length || 0) >= 1 ? progress?.last_active || undefined : undefined,
    },
    {
      id: '100-xp',
      title: 'Century Club',
      description: 'Earn 100 total XP',
      icon: '💯',
      unlocked: (progress?.xp || 0) >= 100,
      unlockedAt: (progress?.xp || 0) >= 100 ? progress?.last_active || undefined : undefined,
    },
    {
      id: '3-day-streak',
      title: 'On Fire',
      description: 'Maintain a 3-day streak',
      icon: '🔥',
      unlocked: (progress?.streak_count || 0) >= 3,
      unlockedAt: (progress?.streak_count || 0) >= 3 ? progress?.last_active || undefined : undefined,
    },
    {
      id: '10-lessons',
      title: 'Dedicated Learner',
      description: 'Complete 10 lessons',
      icon: '📚',
      unlocked: (progress?.lessons?.filter(l => l.completed).length || 0) >= 10,
      unlockedAt: (progress?.lessons?.filter(l => l.completed).length || 0) >= 10 ? progress?.last_active || undefined : undefined,
    },
    {
      id: '500-xp',
      title: 'XP Master',
      description: 'Earn 500 total XP',
      icon: '⭐',
      unlocked: (progress?.xp || 0) >= 500,
      unlockedAt: (progress?.xp || 0) >= 500 ? progress?.last_active || undefined : undefined,
    },
    {
      id: '7-day-streak',
      title: 'Week Warrior',
      description: 'Maintain a 7-day streak',
      icon: '🏆',
      unlocked: (progress?.streak_count || 0) >= 7,
      unlockedAt: (progress?.streak_count || 0) >= 7 ? progress?.last_active || undefined : undefined,
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  const completedLessons = progress?.lessons?.filter(l => l.completed).length || 0;
  const completedSkills = progress?.skills?.filter(s => s.mastered).length || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50/30">
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Profile Header */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 mb-6">
          <div className="flex items-center space-x-6">
            <div className="w-24 h-24 bg-gradient-to-br from-emerald-400 to-green-500 rounded-2xl flex items-center justify-center shadow-lg">
              <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">{userName || 'LingoLeaf Learner'}</h1>
              <p className="text-gray-500 mt-1">German A1 • Foundations</p>
              <div className="flex items-center space-x-2 mt-2">
                <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full">Active Learner</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-xl shadow-md border border-yellow-100 p-4 text-center">
            <p className="text-3xl font-bold text-yellow-700">{progress?.xp || 0}</p>
            <p className="text-sm font-medium text-gray-600">Total XP</p>
          </div>
          <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl shadow-md border border-orange-100 p-4 text-center">
            <p className="text-3xl font-bold text-orange-700">{progress?.streak_count || 0}</p>
            <p className="text-sm font-medium text-gray-600">Day Streak</p>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-md border border-blue-100 p-4 text-center">
            <p className="text-3xl font-bold text-blue-700">{completedLessons}</p>
            <p className="text-sm font-medium text-gray-600">Lessons</p>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl shadow-md border border-purple-100 p-4 text-center">
            <p className="text-3xl font-bold text-purple-700">{completedSkills}</p>
            <p className="text-sm font-medium text-gray-600">Skills</p>
          </div>
        </div>

        {/* Learning Statistics */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Learning Statistics</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 font-medium">Daily XP Goal Progress</span>
              <span className="font-bold text-emerald-600">
                {progress?.daily_xp || 0} / {progress?.daily_goal_target || 50} XP
              </span>
            </div>
            <div className="w-full h-4 bg-gray-100 rounded-full overflow-hidden shadow-inner">
              <div
                className="h-full bg-gradient-to-r from-emerald-400 to-green-500 transition-all duration-500 rounded-full"
                style={{ width: `${Math.min(100, ((progress?.daily_xp || 0) / (progress?.daily_goal_target || 50)) * 100)}%` }}
              />
            </div>
            
            <div className="flex justify-between items-center pt-2">
              <span className="text-gray-600 font-medium">Total Attempts</span>
              <span className="font-bold text-gray-800">
                {progress?.lessons?.reduce((sum, l) => sum + l.attempts_count, 0) || 0}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-600 font-medium">Last Active</span>
              <span className="font-bold text-gray-800">
                {progress?.last_active ? new Date(progress.last_active).toLocaleDateString() : 'Never'}
              </span>
            </div>
          </div>
        </div>

        {/* Achievements */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Achievements</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {achievements.map((achievement) => (
              <div
                key={achievement.id}
                className={`rounded-xl p-4 border transition-all duration-200 ${
                  achievement.unlocked
                    ? 'bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200 shadow-sm'
                    : 'bg-gray-50 border-gray-200 opacity-60'
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div className={`text-4xl ${achievement.unlocked ? 'filter drop-shadow-sm' : 'grayscale opacity-50'}`}>
                    {achievement.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className={`font-bold ${achievement.unlocked ? 'text-emerald-800' : 'text-gray-600'}`}>
                      {achievement.title}
                    </h3>
                    <p className={`text-sm ${achievement.unlocked ? 'text-emerald-700' : 'text-gray-500'}`}>
                      {achievement.description}
                    </p>
                    {achievement.unlocked && (
                      <div className="mt-2 flex items-center space-x-1">
                        <svg className="w-4 h-4 text-emerald-600" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                        </svg>
                        <span className="text-xs font-bold text-emerald-600">Unlocked</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {achievements.filter(a => a.unlocked).length === 0 && (
            <div className="text-center py-8 bg-gray-50 rounded-xl">
              <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-gray-500 font-medium">Complete lessons and earn XP to unlock achievements!</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

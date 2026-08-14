'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import { getUnits, getSkills, getLessons, getProgress, getCurrentUser, ApiError } from '@/lib/api';
import type { Unit, Skill, Lesson, Progress } from '@/types/api';

export default function LearnPage() {
  const router = useRouter();
  const [units, setUnits] = useState<Unit[]>([]);
  const [skills, setSkills] = useState<Record<number, Skill[]>>({});
  const [lessons, setLessons] = useState<Record<number, Lesson[]>>({});
  const [progress, setProgress] = useState<Progress | null>(null);
  const [expandedUnits, setExpandedUnits] = useState<Set<number>>(new Set());
  const [expandedSkills, setExpandedSkills] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        const unitsData = await getUnits();
        setUnits(unitsData.units);

        // Load skills for all units
        const skillsMap: Record<number, Skill[]> = {};
        for (const unit of unitsData.units) {
          const skillsData = await getSkills(unit.id);
          skillsMap[unit.id] = skillsData.skills;
        }
        setSkills(skillsMap);

        // Load user progress using authenticated user ID
        try {
          const userData = await getCurrentUser();
          const progressData = await getProgress(userData.id);
          setProgress(progressData);
        } catch {
          // Progress might not be available yet
        }

        // Load lessons for first unit's first skill by default
        if (unitsData.units.length > 0 && skillsMap[unitsData.units[0].id]?.length > 0) {
          const firstSkill = skillsMap[unitsData.units[0].id][0];
          if (firstSkill.unlocked) {
            const lessonsData = await getLessons(firstSkill.id);
            setLessons((prev) => ({ ...prev, [firstSkill.id]: lessonsData.lessons }));
            setExpandedUnits(new Set([unitsData.units[0].id]));
            setExpandedSkills(new Set([firstSkill.id]));
          }
        }
      } catch (err) {
        if (err instanceof ApiError && err.code === 'UNAUTHORIZED') {
          router.push('/login');
        } else {
          setError('Failed to load learning path');
        }
      } finally {
        setLoading(false);
      }
    }
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Countdown timer for heart regeneration
  useEffect(() => {
    if (!progress || progress.current_hearts === undefined || progress.current_hearts >= 5 || progress.minutes_until_next_heart === undefined || progress.minutes_until_next_heart <= 0) return;

    const interval = setInterval(() => {
      // Refresh progress to get updated heart count
      async function refreshProgress() {
        try {
          const userData = await getCurrentUser();
          const progressData = await getProgress(userData.id);
          setProgress(progressData);
        } catch {
          // Ignore errors
        }
      }
      refreshProgress();
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [progress?.current_hearts, progress?.minutes_until_next_heart]);

  const toggleUnit = (unitId: number) => {
    setExpandedUnits((prev) => {
      const next = new Set(prev);
      if (next.has(unitId)) {
        next.delete(unitId);
      } else {
        next.add(unitId);
      }
      return next;
    });
  };

  const toggleSkill = async (skillId: number) => {
    setExpandedSkills((prev) => {
      const next = new Set(prev);
      if (next.has(skillId)) {
        next.delete(skillId);
      } else {
        next.add(skillId);
      }
      return next;
    });

    // Load lessons if not already loaded
    if (!lessons[skillId]) {
      try {
        const lessonsData = await getLessons(skillId);
        setLessons((prev) => ({ ...prev, [skillId]: lessonsData.lessons }));
      } catch (err) {
        console.error('Failed to load lessons:', err);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading learning path...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg max-w-md">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-emerald-50/30">
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Stats Dashboard */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">German A1</h1>
              <p className="text-sm text-gray-500 mt-1">Foundations</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500 mb-1">Daily Goal</p>
              <div className="flex items-center justify-end space-x-2">
                <span className="text-2xl font-bold text-emerald-600">{progress?.daily_xp || 0}</span>
                <span className="text-gray-400">/</span>
                <span className="text-lg text-gray-600">{progress?.daily_goal_target || 10} XP</span>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-xl p-4 text-center border border-yellow-100 shadow-sm">
              <div className="flex items-center justify-center space-x-1 mb-2">
                <svg className="w-6 h-6 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                </svg>
                <span className="text-3xl font-bold text-yellow-700">{progress?.xp || 0}</span>
              </div>
              <p className="text-sm font-medium text-gray-600">Total XP</p>
            </div>
            
            <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-4 text-center border border-orange-100 shadow-sm">
              <div className="flex items-center justify-center space-x-1 mb-2">
                <svg className="w-6 h-6 text-orange-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.66 11.2C17.43 10.9 17.15 10.64 16.89 10.38C16.22 9.78 15.46 9.35 14.82 8.72C13.33 7.26 13 4.85 13.95 3C13 3.23 12.17 3.75 11.46 4.32C8.87 6.4 7.85 10.07 9.07 13.22C9.11 13.32 9.15 13.42 9.15 13.55C9.15 13.77 9 13.97 8.8 14.05C8.57 14.15 8.33 14.09 8.14 13.93C8.08 13.88 8.04 13.83 8 13.76C6.87 12.33 6.69 10.28 7.45 8.64C5.78 10 4.87 12.3 5 14.47C5.06 14.97 5.12 15.47 5.29 15.97C5.43 16.57 5.7 17.17 6 17.7C7.08 19.43 8.95 20.67 10.96 20.92C13.1 21.19 15.39 20.8 17 19.32C18.35 18.11 19.22 16.5 19.55 14.77C19.77 13.53 19.65 12.21 19.19 11.05C19.07 10.8 18.86 10.5 18.65 10.32L17.66 11.2Z" />
                </svg>
                <span className="text-3xl font-bold text-orange-700">{progress?.streak_count || 0}</span>
              </div>
              <p className="text-sm font-medium text-gray-600">Day Streak</p>
            </div>
            
            <div className="bg-gradient-to-br from-red-50 to-pink-50 rounded-xl p-4 text-center border border-red-100 shadow-sm">
              <div className="flex items-center justify-center space-x-1 mb-2">
                <svg className="w-6 h-6 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
                <span className="text-3xl font-bold text-red-700">{progress?.current_hearts || 5}</span>
              </div>
              <p className="text-sm font-medium text-gray-600">Hearts</p>
              {progress?.current_hearts !== undefined && progress.current_hearts < 5 && progress?.minutes_until_next_heart !== undefined && progress.minutes_until_next_heart > 0 && (
                <p className="text-xs text-red-600 mt-1">+{progress.minutes_until_next_heart}m</p>
              )}
            </div>
            
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 text-center border border-blue-100 shadow-sm">
              <div className="flex items-center justify-center space-x-1 mb-2">
                <svg className="w-6 h-6 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4z" />
                </svg>
                <span className="text-3xl font-bold text-blue-700">{progress?.lessons?.filter(l => l.completed).length || 0}</span>
              </div>
              <p className="text-sm font-medium text-gray-600">Lessons</p>
            </div>
          </div>
          
          {/* Daily XP Progress */}
          <div className="mt-6">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-600">Daily Progress</span>
              <span className="font-medium text-emerald-600">
                {(() => {
                  const dailyXp = progress?.daily_xp || 0;
                  const dailyGoal = progress?.daily_goal_target || 10;
                  const goalComplete = dailyXp >= dailyGoal;
                  if (goalComplete) {
                    return `${dailyXp} XP • Goal complete`;
                  }
                  return `${Math.round((dailyXp / dailyGoal) * 100)}%`;
                })()}
              </span>
            </div>
            <div className="w-full h-4 bg-gray-100 rounded-full overflow-hidden shadow-inner">
              <div
                className="h-full bg-gradient-to-r from-emerald-400 to-green-500 transition-all duration-500 ease-out rounded-full"
                style={{ width: `${Math.min(100, ((progress?.daily_xp || 0) / (progress?.daily_goal_target || 10)) * 100)}%` }}
              />
            </div>
            {(() => {
              const dailyXp = progress?.daily_xp || 0;
              const dailyGoal = progress?.daily_goal_target || 10;
              const xpBeyondGoal = dailyXp > dailyGoal ? dailyXp - dailyGoal : 0;
              if (xpBeyondGoal > 0) {
                return <p className="text-xs font-medium text-emerald-600 mt-1">+{xpBeyondGoal} XP beyond daily goal</p>;
              }
              return null;
            })()}
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Learning Path</h2>
          <p className="text-gray-600">Complete lessons to unlock new skills and progress through the course.</p>
        </div>

        <div className="space-y-6">
          {units.map((unit, index) => {
            const isComingSoon = index >= 2; // Units 3-7 (index 2+)
            return (
              <div key={unit.id} className={`bg-white rounded-2xl shadow-md border overflow-hidden ${isComingSoon ? 'border-gray-200 opacity-60' : 'border-gray-100'}`}>
                <button
                  onClick={() => !isComingSoon && toggleUnit(unit.id)}
                  disabled={isComingSoon}
                  className={`w-full px-6 py-5 flex items-center justify-between hover:bg-gray-50 transition ${isComingSoon ? 'cursor-not-allowed' : ''}`}
                >
                  <div className="flex items-center space-x-4">
                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center shadow-sm ${isComingSoon ? 'bg-gray-100' : 'bg-gradient-to-br from-emerald-400 to-green-500'}`}>
                      {isComingSoon ? (
                        <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      ) : (
                        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                      )}
                    </div>
                    <div className="text-left">
                      <div className="flex items-center space-x-2">
                        <h2 className="text-xl font-bold text-gray-800">{unit.title}</h2>
                        {isComingSoon && (
                          <span className="px-3 py-1 bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-800 text-xs font-bold rounded-full border border-amber-200">Coming Soon</span>
                        )}
                      </div>
                      {unit.description && <p className="text-sm text-gray-500 mt-1">{unit.description}</p>}
                    </div>
                  </div>
                  {!isComingSoon && (
                    <svg
                      className={`w-6 h-6 text-gray-400 transition-transform ${expandedUnits.has(unit.id) ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  )}
                </button>

                {!isComingSoon && expandedUnits.has(unit.id) && (
                  <div className="border-t border-gray-100 divide-y divide-gray-50 bg-gray-50/50">
                    {(skills[unit.id] || []).map((skill) => (
                      <div key={skill.id}>
                        <button
                          onClick={() => toggleSkill(skill.id)}
                          disabled={!skill.unlocked}
                          className={`w-full px-6 py-4 flex items-center justify-between hover:bg-white transition ${
                            !skill.unlocked ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                        >
                          <div className="flex items-center space-x-4">
                            <div
                              className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-sm ${
                                skill.unlocked ? 'bg-gradient-to-br from-emerald-400 to-green-500' : 'bg-gray-300'
                              }`}
                            >
                              {skill.unlocked ? (
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              ) : (
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                              )}
                            </div>
                            <div className="text-left">
                              <h3 className="font-semibold text-gray-800">{skill.title}</h3>
                              {skill.progress && (
                                <div className="flex items-center space-x-2 mt-1">
                                  <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-gradient-to-r from-emerald-400 to-green-500 transition-all"
                                      style={{ width: `${Math.min(100, (skill.progress.xp / 10) * 100)}%` }}
                                    />
                                  </div>
                                  <span className="text-xs text-gray-500 font-medium">{skill.progress.xp} XP</span>
                                </div>
                              )}
                            </div>
                          </div>
                          <svg
                            className={`w-5 h-5 text-gray-400 transition-transform ${expandedSkills.has(skill.id) ? 'rotate-180' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>

                        {expandedSkills.has(skill.id) && skill.unlocked && (
                          <div className="px-6 py-4 bg-white">
                            <div className="space-y-3">
                              {(lessons[skill.id] || []).map((lesson) => {
                                const lessonProgress = progress?.lessons?.find(l => l.lesson_id === lesson.id);
                                const isCompleted = lessonProgress?.completed;
                                
                                return lesson.unlocked !== false ? (
                                  <Link
                                    key={lesson.id}
                                    href={`/lesson/${lesson.id}`}
                                    className={`block rounded-xl border p-4 hover:shadow-md transition-all ${
                                      isCompleted 
                                        ? 'bg-gradient-to-r from-emerald-50 to-green-50 border-emerald-200' 
                                        : 'bg-white border-gray-200 hover:border-emerald-300'
                                    }`}
                                  >
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center space-x-3">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                          isCompleted ? 'bg-emerald-500' : 'bg-gray-100'
                                        }`}>
                                          {isCompleted ? (
                                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                          ) : (
                                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                            </svg>
                                          )}
                                        </div>
                                        <div>
                                          <h4 className="font-semibold text-gray-800">{lesson.title}</h4>
                                          <p className="text-sm text-gray-500 mt-1">
                                            {lesson.xp_reward} XP • {lesson.hearts_allowed} hearts
                                          </p>
                                        </div>
                                      </div>
                                      {isCompleted && (
                                        <span className="text-xs font-bold text-emerald-600 bg-emerald-100 px-2 py-1 rounded-full">Completed</span>
                                      )}
                                    </div>
                                  </Link>
                                ) : (
                                  <div
                                    key={lesson.id}
                                    className="block bg-gray-100 rounded-xl border border-gray-200 p-4 opacity-60"
                                  >
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center space-x-3">
                                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                                          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                          </svg>
                                        </div>
                                        <div>
                                          <h4 className="font-medium text-gray-600">{lesson.title}</h4>
                                          <p className="text-sm text-gray-400 mt-1">
                                            {lesson.xp_reward} XP • {lesson.hearts_allowed} hearts
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}

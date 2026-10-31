import React, { useState } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import { DailyGoal } from '../../types/index.ts';
import {
  CheckCircle2,
  Flame,
  Plus,
  Sparkles,
  Trophy,
  Target,
  Sun,
  Moon,
  Brain,
  X
} from 'lucide-react';

export const GoalsView: React.FC = () => {
  const { dailyGoals, toggleGoal, triggerConfetti } = useApp();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newTarget, setNewTarget] = useState('');
  const [newCategory, setNewCategory] = useState<'study' | 'wellness' | 'focus' | 'sleep'>('study');

  const completedCount = dailyGoals.filter(g => g.completed).length;
  const totalCount = dailyGoals.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    // Local append
    const newGoal: DailyGoal = {
      id: `g_${Date.now()}`,
      title: newTitle.trim(),
      target: newTarget.trim() || 'Daily Target',
      completed: false,
      category: newCategory
    };

    // save via context
    setIsAddModalOpen(false);
    setNewTitle('');
    setNewTarget('');
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'study':
        return <Brain className="w-4 h-4 text-indigo-400" />;
      case 'wellness':
        return <Sun className="w-4 h-4 text-emerald-400" />;
      case 'focus':
        return <Target className="w-4 h-4 text-amber-400" />;
      case 'sleep':
        return <Moon className="w-4 h-4 text-violet-400" />;
      default:
        return <Sparkles className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Progress & Streak Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Streak Card */}
        <div className="p-6 rounded-2xl bg-gradient-to-br from-amber-500/20 via-amber-500/5 to-transparent border border-amber-500/30 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
              Consistency Streak
            </span>
            <div className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span>7 Days</span>
              <Flame className="w-7 h-7 text-amber-500 fill-amber-500 animate-bounce" />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Personal record: 14 days. 7 more to beat it!
            </p>
          </div>
        </div>

        {/* Completion Progress Card */}
        <div className="p-6 rounded-2xl bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-500 dark:text-slate-400 uppercase">
              Today's Completion
            </span>
            <span className="font-mono font-bold text-emerald-500 text-sm">
              {progressPercent}%
            </span>
          </div>

          <div className="text-2xl font-black text-slate-900 dark:text-white my-2">
            {completedCount} of {totalCount} Goals Done
          </div>

          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Milestone Card */}
        <div className="p-6 rounded-2xl bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800/80 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-500">
            <Trophy className="w-8 h-8" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              Focus Discipline Tier
            </h4>
            <p className="text-xs text-indigo-500 font-semibold mt-0.5">
              Rank: Master Scholar
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Top 8% of digital wellness students this week
            </p>
          </div>
        </div>
      </div>

      {/* Goals Checklist Card */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800/80 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Daily Habit Protocol
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Click checkboxes to toggle completion. Completing all goals triggers a celebration!
            </p>
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Goal</span>
          </button>
        </div>

        <div className="space-y-3">
          {dailyGoals.map(goal => (
            <div
              key={goal.id}
              onClick={() => toggleGoal(goal.id)}
              className={`p-4 rounded-xl border flex items-center justify-between gap-4 transition-all cursor-pointer ${
                goal.completed
                  ? 'bg-emerald-500/5 border-emerald-500/20 text-slate-400'
                  : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/60 text-slate-800 dark:text-slate-200 hover:border-indigo-500/40'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-6 h-6 rounded-lg flex items-center justify-center border transition-all ${
                    goal.completed
                      ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm'
                      : 'border-slate-300 dark:border-slate-600'
                  }`}
                >
                  {goal.completed && <CheckCircle2 className="w-4 h-4 stroke-[3]" />}
                </div>

                <div>
                  <p
                    className={`text-sm font-semibold ${
                      goal.completed ? 'line-through text-slate-400' : 'text-slate-900 dark:text-white'
                    }`}
                  >
                    {goal.title}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400">
                    <span className="capitalize flex items-center gap-1">
                      {getCategoryIcon(goal.category)}
                      {goal.category}
                    </span>
                    <span>•</span>
                    <span className="font-mono">{goal.target}</span>
                  </div>
                </div>
              </div>

              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  goal.completed
                    ? 'bg-emerald-500/20 text-emerald-500'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                }`}
              >
                {goal.completed ? 'COMPLETED' : 'PENDING'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Add Goal Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-inherit">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Add Daily Goal
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddGoal} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Goal Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 3 hours deep study, No phone in bed"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-sm bg-slate-100 dark:bg-slate-800 border-none text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Target Metric
                </label>
                <input
                  type="text"
                  placeholder="e.g. 3 hours, 4 sessions, < 60 mins"
                  value={newTarget}
                  onChange={e => setNewTarget(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-sm bg-slate-100 dark:bg-slate-800 border-none text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Category
                </label>
                <select
                  value={newCategory}
                  onChange={e => setNewCategory(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl text-sm bg-slate-100 dark:bg-slate-800 border-none text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="study">Academic Study</option>
                  <option value="wellness">Digital Wellness & Detox</option>
                  <option value="focus">Focus Pomodoro</option>
                  <option value="sleep">Sleep & Wind-down</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-inherit">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/20 cursor-pointer"
                >
                  Save Goal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

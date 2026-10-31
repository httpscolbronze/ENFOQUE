import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import {
  Timer,
  Play,
  Pause,
  RotateCcw,
  X,
  Volume2,
  CheckCircle2,
  BookOpen,
  Sparkles
} from 'lucide-react';
import { formatMinutes } from '../../utils/analytics.ts';

export const PomodoroModal: React.FC = () => {
  const {
    isPomodoroModalOpen,
    closePomodoroModal,
    subjects,
    saveSubject,
    triggerConfetti
  } = useApp();

  const [mode, setMode] = useState<'focus' | 'shortBreak' | 'longBreak'>('focus');
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [selectedSubjectId, setSelectedSubjectId] = useState(subjects[0]?.id || '');
  const [sessionsCompleted, setSessionsCompleted] = useState(0);

  useEffect(() => {
    let interval: any = null;
    if (isActive && secondsLeft > 0) {
      interval = setInterval(() => {
        setSecondsLeft(sec => sec - 1);
      }, 1000);
    } else if (secondsLeft === 0 && isActive) {
      setIsActive(false);
      handleSessionComplete();
    }
    return () => clearInterval(interval);
  }, [isActive, secondsLeft]);

  const handleSessionComplete = () => {
    triggerConfetti();
    if (mode === 'focus') {
      setSessionsCompleted(prev => prev + 1);
      // Credit 0.5h to the selected subject
      const sub = subjects.find(s => s.id === selectedSubjectId);
      if (sub) {
        saveSubject({
          ...sub,
          completed_hours: Math.round((sub.completed_hours + 0.4) * 10) / 10
        });
      }
      setMode('shortBreak');
      setSecondsLeft(5 * 60);
    } else {
      setMode('focus');
      setSecondsLeft(25 * 60);
    }
  };

  const handleModeSwitch = (newMode: 'focus' | 'shortBreak' | 'longBreak') => {
    setIsActive(false);
    setMode(newMode);
    if (newMode === 'focus') setSecondsLeft(25 * 60);
    if (newMode === 'shortBreak') setSecondsLeft(5 * 60);
    if (newMode === 'longBreak') setSecondsLeft(15 * 60);
  };

  const handleReset = () => {
    setIsActive(false);
    if (mode === 'focus') setSecondsLeft(25 * 60);
    if (mode === 'shortBreak') setSecondsLeft(5 * 60);
    if (mode === 'longBreak') setSecondsLeft(15 * 60);
  };

  if (!isPomodoroModalOpen) return null;

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const timeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const totalModeSeconds = mode === 'focus' ? 25 * 60 : mode === 'shortBreak' ? 5 * 60 : 15 * 60;
  const progressPercent = ((totalModeSeconds - secondsLeft) / totalModeSeconds) * 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in">
      <div className="bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl flex flex-col items-center text-center space-y-6">
        {/* Header */}
        <div className="w-full flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Timer className="w-5 h-5 text-indigo-500" />
            <span className="font-bold text-sm text-slate-900 dark:text-white">
              Focus Pomodoro Chamber
            </span>
          </div>

          <button
            onClick={closePomodoroModal}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
          <button
            onClick={() => handleModeSwitch('focus')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              mode === 'focus'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Focus (25m)
          </button>
          <button
            onClick={() => handleModeSwitch('shortBreak')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              mode === 'shortBreak'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Short Break (5m)
          </button>
          <button
            onClick={() => handleModeSwitch('longBreak')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              mode === 'longBreak'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Long Break (15m)
          </button>
        </div>

        {/* Big Circular Clock */}
        <div className="relative w-56 h-56 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="44"
              className="text-slate-100 dark:text-slate-800"
              strokeWidth="6"
              stroke="currentColor"
              fill="transparent"
            />
            <circle
              cx="50"
              cy="50"
              r="44"
              className="text-indigo-600 transition-all duration-300"
              strokeWidth="6"
              strokeDasharray={276}
              strokeDashoffset={276 - (276 * progressPercent) / 100}
              strokeLinecap="round"
              stroke="currentColor"
              fill="transparent"
            />
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-mono text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              {timeFormatted}
            </span>
            <span className="text-xs uppercase tracking-widest text-slate-400 font-semibold mt-1">
              {mode === 'focus' ? 'Deep Flow' : 'Rest Window'}
            </span>
          </div>
        </div>

        {/* Subject selector */}
        {mode === 'focus' && (
          <div className="w-full text-left space-y-1">
            <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Credit this interval to:</span>
            </label>
            <select
              value={selectedSubjectId}
              onChange={e => setSelectedSubjectId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-xs bg-slate-100 dark:bg-slate-800 border-none text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              {subjects.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.priority} • {s.completed_hours}h / {s.target_hours}h)
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Controls */}
        <div className="flex items-center gap-4">
          <button
            onClick={handleReset}
            className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition-all cursor-pointer"
            title="Reset timer"
          >
            <RotateCcw className="w-5 h-5" />
          </button>

          <button
            onClick={() => setIsActive(!isActive)}
            className="px-8 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-xl shadow-indigo-600/30 transition-all flex items-center gap-2 cursor-pointer"
          >
            {isActive ? (
              <>
                <Pause className="w-5 h-5 fill-white" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-5 h-5 fill-white" />
                <span>Start Focus</span>
              </>
            )}
          </button>
        </div>

        <div className="text-xs text-slate-400">
          Completed sessions today: <span className="font-bold text-indigo-500">{sessionsCompleted}</span> 🔥
        </div>
      </div>
    </div>
  );
};

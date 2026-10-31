import React from 'react';
import { useApp } from '../../context/AppContext.tsx';
import {
  Menu,
  AlertCircle,
  Timer,
  MessageSquare,
  Sun,
  Moon,
  Sparkles,
  Flame,
  Check
} from 'lucide-react';

interface HeaderProps {
  onOpenMobile: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenMobile }) => {
  const {
    activeTab,
    setActiveTab,
    theme,
    toggleTheme,
    metrics,
    settings,
    openWhatsAppModal,
    openPomodoroModal
  } = useApp();

  const getPageInfo = () => {
    switch (activeTab) {
      case 'dashboard':
        return {
          title: 'Wellness Dashboard',
          subtitle: 'Daily screen time overview, focus ratio & health metrics'
        };
      case 'analytics':
        return {
          title: 'App Usage Analytics',
          subtitle: 'Interactive breakdown by app, categories & hourly timeline'
        };
      case 'limits':
        return {
          title: 'Usage Limits & Warnings',
          subtitle: 'Configure daily app boundaries & monitor over-usage alerts'
        };
      case 'planner':
        return {
          title: 'Study Planner & Timetable',
          subtitle: 'AI-generated study schedule balancing urgency & deadlines'
        };
      case 'goals':
        return {
          title: 'Daily Goals & Habits',
          subtitle: 'Track digital detox milestones, study hours & focus streaks'
        };
      case 'nightly':
        return {
          title: 'Nightly Reflection Report',
          subtitle: 'End-of-day screen time audit & tomorrow\'s prioritized agenda'
        };
      case 'csv':
        return {
          title: 'CSV Data Import',
          subtitle: 'Import screen time datasets using app,minutes format'
        };
      case 'assistant':
        return {
          title: 'AI Wellness Assistant',
          subtitle: 'Personalized digital detox coaching powered by Gemini AI'
        };
      case 'settings':
        return {
          title: 'Preferences & Supabase DB',
          subtitle: 'Account settings, WhatsApp delivery & Python backend configuration'
        };
      default:
        return { title: 'ENFOQUE AI', subtitle: 'Digital Wellness Assistant' };
    }
  };

  const page = getPageInfo();

  return (
    <header
      className={`sticky top-0 z-30 flex flex-col border-b ${
        theme === 'dark'
          ? 'bg-[#0E131F]/90 border-slate-800/80 backdrop-blur-md'
          : 'bg-white/90 border-slate-200 backdrop-blur-md'
      }`}
    >
      {/* Over-Limit Warning Banner if any apps exceeded limits */}
      {metrics.warnings.length > 0 && (
        <div className="bg-rose-500/10 dark:bg-rose-950/40 border-b border-rose-500/20 px-4 py-2 flex items-center justify-between text-xs text-rose-600 dark:text-rose-300">
          <div className="flex items-center gap-2 overflow-hidden text-ellipsis whitespace-nowrap">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 animate-pulse" />
            <span className="font-semibold">App Limit Warning:</span>
            <span>
              {metrics.warnings.map(w => `${w.app} (+${w.exceeded_by}m)`).join(', ')} exceeded today's limit!
            </span>
          </div>
          <button
            onClick={() => setActiveTab('limits')}
            className="ml-3 shrink-0 px-2 py-0.5 rounded bg-rose-500 text-white font-medium hover:bg-rose-600 transition-colors text-[11px] cursor-pointer"
          >
            Manage Limits
          </button>
        </div>
      )}

      {/* Main Bar */}
      <div className="px-4 md:px-8 py-3.5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenMobile}
            className="p-2 -ml-2 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 md:hidden cursor-pointer"
            aria-label="Open mobile menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div>
            <h1 className="text-lg md:text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              {page.title}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
              {page.subtitle}
            </p>
          </div>
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-2 md:gap-3">
          {/* Streak badge */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-xs font-semibold">
            <Flame className="w-4 h-4 fill-amber-500 text-amber-500 animate-bounce" />
            <span>7-Day Streak</span>
          </div>

          {/* Quick Focus Pomodoro button */}
          <button
            onClick={openPomodoroModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium transition-all cursor-pointer"
            title="Launch Pomodoro Timer"
          >
            <Timer className="w-4 h-4 text-indigo-500" />
            <span className="hidden md:inline">Focus Timer</span>
          </button>

          {/* WhatsApp Action button */}
          <button
            onClick={openWhatsAppModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium shadow-sm transition-all cursor-pointer"
            title="Share daily progress to WhatsApp"
          >
            <MessageSquare className="w-4 h-4 fill-white" />
            <span className="hidden sm:inline">WhatsApp</span>
          </button>

          {/* Theme switcher */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-500" />
            )}
          </button>

          {/* User profile avatar */}
          <div
            onClick={() => setActiveTab('settings')}
            className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800 cursor-pointer"
            title="Open Settings"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-emerald-400 flex items-center justify-center text-white font-bold text-xs ring-2 ring-indigo-500/20">
              {settings.user_name.charAt(0)}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

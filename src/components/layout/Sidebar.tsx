import React from 'react';
import { useApp, ActiveNavTab } from '../../context/AppContext.tsx';
import {
  LayoutDashboard,
  BarChart3,
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  MoonStar,
  UploadCloud,
  Sparkles,
  Settings,
  MessageSquare,
  Timer,
  Activity,
  Sun,
  Moon,
  X
} from 'lucide-react';

interface SidebarProps {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, onCloseMobile }) => {
  const {
    activeTab,
    setActiveTab,
    theme,
    toggleTheme,
    metrics,
    activityWatchStatus,
    openWhatsAppModal,
    openPomodoroModal,
    dailyGoals
  } = useApp();

  const completedGoalsCount = dailyGoals.filter(g => g.completed).length;

  const navItems: {
    id: ActiveNavTab;
    label: string;
    icon: React.ReactNode;
    badge?: string | number;
    badgeColor?: string;
  }[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <LayoutDashboard className="w-5 h-5" />,
      badge: metrics.total_formatted,
      badgeColor: 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono'
    },
    {
      id: 'analytics',
      label: 'AW Analytics',
      icon: <BarChart3 className="w-5 h-5" />
    },
    {
      id: 'limits',
      label: 'Usage Limits',
      icon: <AlertTriangle className="w-5 h-5" />,
      badge: metrics.warning_count > 0 ? `${metrics.warning_count} Alert` : undefined,
      badgeColor: 'bg-rose-500 text-white'
    },
    {
      id: 'planner',
      label: 'Study Planner',
      icon: <CalendarDays className="w-5 h-5" />
    },
    {
      id: 'goals',
      label: 'Daily Goals',
      icon: <CheckCircle2 className="w-5 h-5" />,
      badge: `${completedGoalsCount}/${dailyGoals.length}`,
      badgeColor: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
    },
    {
      id: 'nightly',
      label: 'Nightly Report',
      icon: <MoonStar className="w-5 h-5" />
    },
    {
      id: 'csv',
      label: 'ActivityWatch / CSV',
      icon: <UploadCloud className="w-5 h-5" />
    },
    {
      id: 'assistant',
      label: 'AI Wellness Coach',
      icon: <Sparkles className="w-5 h-5 text-indigo-400" />,
      badge: 'AI',
      badgeColor: 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
    },
    {
      id: 'settings',
      label: 'Settings & Supabase',
      icon: <Settings className="w-5 h-5" />
    }
  ];

  const handleNavClick = (tabId: ActiveNavTab) => {
    setActiveTab(tabId);
    if (onCloseMobile) onCloseMobile();
  };

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 flex flex-col transition-transform duration-300 ease-in-out md:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        } ${
          theme === 'dark'
            ? 'bg-[#0E131F] border-r border-slate-800/80 text-slate-200'
            : 'bg-white border-r border-slate-200 text-slate-700 shadow-sm'
        }`}
      >
        <div className="p-5 flex items-center justify-between border-b border-inherit">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-emerald-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white font-black text-xl tracking-wider">
              E
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold tracking-tight text-lg text-slate-900 dark:text-white">
                  ENFOQUE
                </span>
                <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30">
                  AI
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                ActivityWatch & Study AI
              </p>
            </div>
          </div>
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-200 md:hidden"
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="px-4 py-3 gap-2 flex flex-col">
          <button
            onClick={() => {
              openPomodoroModal();
              if (onCloseMobile) onCloseMobile();
            }}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Timer className="w-4 h-4" />
              <span>Start Focus Pomodoro</span>
            </div>
            <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded font-mono">
              25m
            </span>
          </button>

          <button
            onClick={() => {
              openWhatsAppModal();
              if (onCloseMobile) onCloseMobile();
            }}
            className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-semibold transition-all cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-emerald-500" />
              <span>Send WhatsApp Report</span>
            </div>
            <span className="text-[10px] bg-emerald-500/20 px-1.5 py-0.5 rounded font-medium">
              Daily
            </span>
          </button>
        </div>

        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Navigation
          </div>
          {navItems.map(item => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20 font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={isActive ? 'text-white' : 'text-slate-400'}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${item.badgeColor || 'bg-slate-700 text-slate-200'}`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* ActivityWatch & Python Status Badge */}
        <div className="p-4 border-t border-inherit">
          <div
            className={`p-3 rounded-xl border text-xs flex flex-col gap-1.5 ${
              theme === 'dark'
                ? 'bg-slate-900/70 border-slate-800'
                : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-medium">
                <Activity className="w-3.5 h-3.5 text-indigo-400" />
                <span className="text-slate-700 dark:text-slate-300">
                  ActivityWatch
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">
                  {activityWatchStatus.connected ? 'LIVE :5600' : 'MONITORING'}
                </span>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight font-mono truncate">
              {activityWatchStatus.current_window_app} • {metrics.total_formatted}
            </p>
          </div>

          <div className="mt-3 flex items-center justify-between pt-2">
            <button
              onClick={toggleTheme}
              className="flex items-center gap-2 text-xs font-medium text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              aria-label="Toggle dark/light theme"
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-4 h-4 text-amber-400" />
                  <span>Light Mode</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-indigo-500" />
                  <span>Dark Mode</span>
                </>
              )}
            </button>
            <span className="text-[10px] text-slate-400 font-mono">AW v0.13</span>
          </div>
        </div>
      </aside>
    </>
  );
};

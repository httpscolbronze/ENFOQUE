import React, { useState } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import {
  Clock,
  ShieldAlert,
  Brain,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Calendar,
  Play,
  Share2,
  Activity,
  RefreshCw,
  Monitor,
  Radio,
  Sliders,
  Plus,
  Terminal
} from 'lucide-react';
import { formatMinutes } from '../../utils/analytics.ts';

export const DashboardView: React.FC = () => {
  const {
    screenTime,
    limits,
    metrics,
    studySchedule,
    dailyGoals,
    toggleGoal,
    setActiveTab,
    openPomodoroModal,
    openWhatsAppModal,
    setSelectedAppForAnalytics,
    activityWatchStatus,
    isSyncingAW,
    syncActivityWatchNow,
    toggleLiveWatcher,
    applyActivityWatchProfile,
    updateAppMinutes
  } = useApp();

  const [syncBannerMsg, setSyncBannerMsg] = useState<string | null>(null);
  const [showQuickAdjust, setShowQuickAdjust] = useState<boolean>(false);
  const [editApp, setEditApp] = useState<string>(screenTime[0]?.app || 'VS Code');
  const [editMins, setEditMins] = useState<number>(screenTime[0]?.minutes || 120);
  const [editWindowTitle, setEditWindowTitle] = useState<string>('');

  const completedGoalsCount = dailyGoals.filter(g => g.completed).length;
  const topApps = [...screenTime].sort((a, b) => b.minutes - a.minutes).slice(0, 6);

  const handleSyncAW = async () => {
    const res = await syncActivityWatchNow();
    setSyncBannerMsg(res.message);
    setTimeout(() => setSyncBannerMsg(null), 4000);
  };

  const handleQuickAdjustSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateAppMinutes(editApp, editMins, editWindowTitle.trim() || undefined);
    setShowQuickAdjust(false);
    setEditWindowTitle('');
  };

  return (
    <div className="space-y-6">
      {/* Top Welcome & ActivityWatch Live Telemetry Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-950 via-slate-900 to-[#0B101E] p-6 md:p-8 border border-indigo-500/30 shadow-xl">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-500/30">
                <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                <span>ActivityWatch Screen-Time Monitor</span>
              </div>
              <span className="text-[11px] font-mono px-2.5 py-1 rounded-full bg-slate-800/90 text-slate-300 border border-slate-700">
                {activityWatchStatus.connected ? 'aw-server :5600 Connected' : 'aw-watcher-window + aw-watcher-afk'}
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                Last Sync: {activityWatchStatus.last_sync}
              </span>
            </div>

            <h2 className="text-2xl md:text-3xl font-black tracking-tight text-white">
              Total Active Screen Time:{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-sky-300 to-emerald-400 font-mono">
                {metrics.total_formatted}
              </span>
            </h2>

            <p className="text-sm text-slate-300 leading-relaxed">
              ActivityWatch filtered out <span className="text-amber-300 font-semibold font-mono">{metrics.afk_formatted}</span> of AFK/idle time from{' '}
              <span className="text-white font-semibold font-mono">{metrics.raw_window_formatted}</span> total raw window time across{' '}
              <span className="text-indigo-300 font-semibold font-mono">{metrics.total_events_count}</span> window events.
            </p>

            {/* Live Active Window Stream Bar */}
            <div className="pt-1 flex flex-wrap items-center gap-2 text-xs">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-700/80 text-slate-200 font-mono">
                <Monitor className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span className="text-indigo-400 font-bold">{activityWatchStatus.current_window_app}:</span>
                <span className="truncate max-w-xs sm:max-w-md text-slate-300">
                  {activityWatchStatus.current_window_title}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 shrink-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={handleSyncAW}
                disabled={isSyncingAW}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 ${isSyncingAW ? 'animate-spin' : ''}`} />
                <span>{isSyncingAW ? 'Syncing :5600...' : 'Sync ActivityWatch'}</span>
              </button>

              <button
                onClick={() => setShowQuickAdjust(!showQuickAdjust)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition-all cursor-pointer"
              >
                <Sliders className="w-4 h-4 text-indigo-400" />
                <span>Modify Screen Time</span>
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={openPomodoroModal}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600/20 hover:bg-violet-600/30 text-violet-300 border border-violet-500/30 text-xs font-bold transition-all cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Focus Session</span>
              </button>

              <button
                onClick={openWhatsAppModal}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-bold transition-all cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>WhatsApp Brief</span>
              </button>
            </div>
          </div>
        </div>

        {/* Sync Feedback Toast */}
        {syncBannerMsg && (
          <div className="mt-4 px-4 py-2 rounded-xl bg-indigo-500/20 border border-indigo-400/30 text-xs text-indigo-200 flex items-center justify-between">
            <span>{syncBannerMsg}</span>
            <button onClick={() => setSyncBannerMsg(null)} className="text-indigo-300 hover:text-white font-bold">
              Dismiss
            </button>
          </div>
        )}
      </div>

      {/* ActivityWatch Telemetry Bar: Watchers + Profile Switcher + Quick Screen Time Editor */}
      <div className="p-4 md:p-5 rounded-2xl bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800/80 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Active Watchers */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mr-1 flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-indigo-500" />
              <span>Watchers:</span>
            </span>
            {activityWatchStatus.watchers.map(w => (
              <div
                key={w.id}
                className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/70 text-xs"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">{w.id.split('_')[0]}</span>
                <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400">({w.events_today} ev)</span>
              </div>
            ))}
            <button
              onClick={toggleLiveWatcher}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                activityWatchStatus.live_watcher_running
                  ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-300 dark:border-slate-700'
              }`}
            >
              <Radio className="w-3 h-3" />
              <span>{activityWatchStatus.live_watcher_running ? 'Live Stream ON' : 'Stream Paused'}</span>
            </button>
          </div>

          {/* ActivityWatch Telemetry Preset Switcher */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-400 mr-1">Telemetry Dataset:</span>
            <button
              onClick={() => applyActivityWatchProfile('balanced')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                metrics.total_minutes === 312
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              Standard (5h 12m)
            </button>
            <button
              onClick={() => applyActivityWatchProfile('deep_focus')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                metrics.total_minutes === 375
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              Deep Coding (6h 15m)
            </button>
            <button
              onClick={() => applyActivityWatchProfile('distracted')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                metrics.total_minutes === 405
                  ? 'bg-rose-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              High Social (6h 45m)
            </button>
          </div>
        </div>

        {/* Collapsible Quick Screen Time Editor */}
        {showQuickAdjust && (
          <form
            onSubmit={handleQuickAdjustSubmit}
            className="pt-4 border-t border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-4 gap-3 items-end"
          >
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                Application (aw-watcher-window)
              </label>
              <select
                value={editApp}
                onChange={e => {
                  const val = e.target.value;
                  setEditApp(val);
                  const found = screenTime.find(a => a.app === val);
                  if (found) setEditMins(found.minutes);
                }}
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
              >
                {screenTime.map(a => (
                  <option key={a.app} value={a.app}>
                    {a.app} (Current: {formatMinutes(a.minutes)})
                  </option>
                ))}
                <option value="Obsidian">Obsidian</option>
                <option value="PyCharm">PyCharm</option>
                <option value="TikTok">TikTok</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                Active Minutes (not-afk)
              </label>
              <input
                type="number"
                min="0"
                max="720"
                value={editMins}
                onChange={e => setEditMins(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-xl text-xs font-mono bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                Active Window Title (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. neural_net.py - Visual Studio Code"
                value={editWindowTitle}
                onChange={e => setEditWindowTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                type="submit"
                className="flex-1 py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold cursor-pointer"
              >
                Update Total Screen Time
              </button>
            </div>
          </form>
        )}
      </div>

      {/* 4 Core Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Active Screen Time (ActivityWatch) */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800/80 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-3">
            <span className="text-xs font-medium uppercase tracking-wider">Total Screen Time (AW)</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white font-mono">
            {metrics.total_formatted}
          </div>
          <div className="mt-2 flex items-center justify-between text-xs">
            <span className="inline-flex items-center gap-1 text-emerald-500 font-medium">
              <Activity className="w-3.5 h-3.5" /> AFK filtered: -{metrics.afk_formatted}
            </span>
            <span className="text-slate-400 font-mono">{metrics.total_minutes}m</span>
          </div>
          <div className="mt-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                metrics.total_minutes > 330 ? 'bg-amber-500' : 'bg-indigo-500'
              }`}
              style={{ width: `${Math.min(100, (metrics.total_minutes / 360) * 100)}%` }}
            />
          </div>
        </div>

        {/* Card 2: Wellness Score */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800/80 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-3">
            <span className="text-xs font-medium uppercase tracking-wider">Wellness Score</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
              <Brain className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <div className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white font-mono">
              {metrics.wellness_score}
            </div>
            <span className="text-xs text-slate-400">/ 100</span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs">
            <span
              className={`font-semibold ${
                metrics.wellness_score >= 75
                  ? 'text-emerald-500'
                  : metrics.wellness_score >= 50
                  ? 'text-amber-500'
                  : 'text-rose-500'
              }`}
            >
              {metrics.wellness_score >= 75
                ? 'Optimal Balance'
                : metrics.wellness_score >= 50
                ? 'Moderate Strain'
                : 'High Distraction'}
            </span>
          </div>
          <div className="mt-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                metrics.wellness_score >= 75
                  ? 'bg-emerald-500'
                  : metrics.wellness_score >= 50
                  ? 'bg-amber-500'
                  : 'bg-rose-500'
              }`}
              style={{ width: `${metrics.wellness_score}%` }}
            />
          </div>
        </div>

        {/* Card 3: Focus Ratio */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800/80 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-3">
            <span className="text-xs font-medium uppercase tracking-wider">Focus Ratio</span>
            <div className="p-2 rounded-xl bg-violet-500/10 text-violet-500">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white font-mono">
            {metrics.focus_ratio}%
          </div>
          <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            {formatMinutes(metrics.productivity_minutes)} productive vs {formatMinutes(metrics.social_ent_minutes)} social
          </div>
          <div className="mt-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 transition-all duration-500"
              style={{ width: `${metrics.focus_ratio}%` }}
            />
          </div>
        </div>

        {/* Card 4: Limit Alerts */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800/80 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-3">
            <span className="text-xs font-medium uppercase tracking-wider">Limit Alerts</span>
            <div
              className={`p-2 rounded-xl ${
                metrics.warning_count > 0 ? 'bg-rose-500/10 text-rose-500' : 'bg-emerald-500/10 text-emerald-500'
              }`}
            >
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white font-mono">
            {metrics.warning_count}
          </div>
          <div className="mt-2 text-xs">
            {metrics.warning_count > 0 ? (
              <span className="text-rose-500 font-semibold cursor-pointer" onClick={() => setActiveTab('limits')}>
                {metrics.warnings[0].app} (+{metrics.warnings[0].exceeded_by}m)
              </span>
            ) : (
              <span className="text-emerald-500 font-medium">All boundaries respected</span>
            )}
          </div>
          <div className="mt-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                metrics.warning_count > 0 ? 'bg-rose-500' : 'bg-emerald-500'
              }`}
              style={{ width: metrics.warning_count > 0 ? '100%' : '0%' }}
            />
          </div>
        </div>
      </div>

      {/* Main Grid: ActivityWatch App & Window Telemetry vs Timetable */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 spans): ActivityWatch Monitored Apps & Window Titles */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 rounded-2xl bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800/80 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Activity className="w-4 h-4 text-indigo-500" />
                  <span>ActivityWatch Monitored Applications & Window Titles</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Real-time breakdown captured from <code className="font-mono">aw-watcher-window</code> &{' '}
                  <code className="font-mono">aw-watcher-web</code>
                </p>
              </div>
              <button
                onClick={() => setActiveTab('analytics')}
                className="text-xs font-semibold text-indigo-500 hover:text-indigo-400 flex items-center gap-1 cursor-pointer"
              >
                <span>Deep Analytics</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-4">
              {topApps.map(app => {
                const limitObj = limits.find(l => l.app.toLowerCase() === app.app.toLowerCase());
                const limitMin = limitObj?.enabled ? limitObj.limit_minutes : null;
                const isExceeded = limitMin !== null && app.minutes > limitMin;
                const exceededBy = isExceeded ? app.minutes - limitMin : 0;
                const percentOfLimit = limitMin ? Math.min(100, Math.round((app.minutes / limitMin) * 100)) : 100;

                return (
                  <div
                    key={app.id}
                    onClick={() => {
                      setSelectedAppForAnalytics(app.app);
                      setActiveTab('analytics');
                    }}
                    className="p-3.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all cursor-pointer border border-slate-100 dark:border-slate-800/60 hover:border-slate-200 dark:hover:border-slate-700/60"
                  >
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: app.color || '#6366F1' }}
                        />
                        <span className="font-bold text-slate-900 dark:text-white text-sm">
                          {app.app}
                        </span>
                        <span className="text-[11px] text-slate-400 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800">
                          {app.category}
                        </span>
                        {app.source && (
                          <span className="text-[10px] font-mono text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded">
                            {app.source}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900 dark:text-white">
                          {formatMinutes(app.minutes)}
                        </span>
                        {limitMin && (
                          <span className="text-[11px] text-slate-400">
                            / {formatMinutes(limitMin)} limit
                          </span>
                        )}
                        {isExceeded && (
                          <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-500 font-bold text-[10px]">
                            +{exceededBy}m
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Recent window title captured by ActivityWatch */}
                    {app.window_titles && app.window_titles.length > 0 && (
                      <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 mb-2 truncate">
                        ↳ Window: {app.window_titles[0]}
                      </div>
                    )}

                    <div className="w-full bg-slate-100 dark:bg-slate-800/80 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${
                          isExceeded
                            ? 'bg-gradient-to-r from-rose-500 to-red-600'
                            : percentOfLimit > 80
                            ? 'bg-amber-500'
                            : 'bg-indigo-500'
                        }`}
                        style={{
                          width: `${Math.min(100, (app.minutes / (limitMin || 200)) * 100)}%`
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* AI Coach Suggestion Card */}
          <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-950/40 via-[#111726] to-[#0E131F] border border-indigo-500/30 shadow-md">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 shrink-0">
                <Brain className="w-6 h-6" />
              </div>
              <div className="space-y-2 flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>AI Wellness Recommendation</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/30 text-indigo-300">
                      ActivityWatch Telemetry Grounded
                    </span>
                  </h4>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {metrics.warnings.length > 0
                    ? `ActivityWatch detected ${metrics.warnings[0].usage_minutes}m on ${metrics.warnings[0].app}, exceeding your ${metrics.warnings[0].limit_minutes}m limit by +${metrics.warnings[0].exceeded_by}m. Enable grayscale mode or block social tabs during your next VS Code study block.`
                    : `ActivityWatch logged ${formatMinutes(metrics.productivity_minutes)} of focused work (${metrics.focus_ratio}% Focus Ratio). Keep this momentum for your Discrete Mathematics deadline!`}
                </p>
                <div className="pt-2 flex items-center gap-3">
                  <button
                    onClick={() => setActiveTab('assistant')}
                    className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Open AI Coach Chat</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Today's Timetable & Daily Goals */}
        <div className="space-y-6">
          {/* Study Timetable preview */}
          <div className="p-6 rounded-2xl bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800/80 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Study Timetable
                </h3>
              </div>
              <button
                onClick={() => setActiveTab('planner')}
                className="text-xs font-semibold text-indigo-500 hover:text-indigo-400 cursor-pointer"
              >
                View All
              </button>
            </div>

            {studySchedule.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">No study blocks scheduled</p>
            ) : (
              <div className="space-y-3">
                {studySchedule.slice(0, 3).map((block, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/50 flex flex-col gap-1.5"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono text-slate-400 font-medium">
                        {block.time_slot}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          block.priority === 'Urgent'
                            ? 'bg-rose-500/20 text-rose-500'
                            : block.priority === 'High'
                            ? 'bg-amber-500/20 text-amber-500'
                            : 'bg-indigo-500/20 text-indigo-400'
                        }`}
                      >
                        {block.priority}
                      </span>
                    </div>
                    <div className="font-semibold text-slate-900 dark:text-white text-xs">
                      {block.subject_name}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      Duration: {block.allocated_formatted}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Daily Goals Checklist */}
          <div className="p-6 rounded-2xl bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800/80 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Daily Goals
                </h3>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                {completedGoalsCount}/{dailyGoals.length} Done
              </span>
            </div>

            <div className="space-y-2.5">
              {dailyGoals.map(goal => (
                <div
                  key={goal.id}
                  onClick={() => toggleGoal(goal.id)}
                  className={`p-3 rounded-xl border text-xs flex items-start gap-3 transition-all cursor-pointer ${
                    goal.completed
                      ? 'bg-emerald-500/5 border-emerald-500/20 text-slate-400 line-through'
                      : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-indigo-500/40'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded mt-0.5 flex items-center justify-center shrink-0 border ${
                      goal.completed
                        ? 'bg-emerald-500 border-emerald-500 text-white'
                        : 'border-slate-400 dark:border-slate-600'
                    }`}
                  >
                    {goal.completed && <CheckCircle2 className="w-3.5 h-3.5" />}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium leading-snug">{goal.title}</p>
                    <span className="text-[10px] text-slate-400 font-mono">{goal.target}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

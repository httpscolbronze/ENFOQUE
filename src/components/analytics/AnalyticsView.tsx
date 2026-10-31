import React, { useState } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import {
  BarChart3,
  PieChart,
  Clock,
  Filter,
  ArrowUpDown,
  Sliders,
  Activity,
  Monitor
} from 'lucide-react';
import { formatMinutes } from '../../utils/analytics.ts';

export const AnalyticsView: React.FC = () => {
  const {
    screenTime,
    limits,
    metrics,
    selectedAppForAnalytics,
    setSelectedAppForAnalytics,
    setActiveTab,
    updateLimit,
    updateAppMinutes
  } = useApp();

  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'minutes' | 'name' | 'exceeded'>('minutes');
  const [selectedApp, setSelectedApp] = useState<string>(
    selectedAppForAnalytics || (screenTime[0]?.app ?? '')
  );

  const categories = ['all', 'Social Media', 'Entertainment', 'Productivity', 'Education', 'Information', 'Communication'];

  const filteredApps = screenTime.filter(app => {
    if (categoryFilter === 'all') return true;
    return app.category === categoryFilter;
  });

  const sortedApps = [...filteredApps].sort((a, b) => {
    if (sortBy === 'minutes') return b.minutes - a.minutes;
    if (sortBy === 'name') return a.app.localeCompare(b.app);
    if (sortBy === 'exceeded') {
      const limitA = limits.find(l => l.app.toLowerCase() === a.app.toLowerCase())?.limit_minutes || 999;
      const limitB = limits.find(l => l.app.toLowerCase() === b.app.toLowerCase())?.limit_minutes || 999;
      const excA = Math.max(0, a.minutes - limitA);
      const excB = Math.max(0, b.minutes - limitB);
      return excB - excA;
    }
    return 0;
  });

  const activeAppObj = screenTime.find(a => a.app.toLowerCase() === selectedApp.toLowerCase()) || screenTime[0];
  const activeAppLimit = limits.find(l => l.app.toLowerCase() === activeAppObj?.app.toLowerCase());
  const maxMinutes = Math.max(...screenTime.map(a => a.minutes), 180);

  const hourlySlots = [
    { label: '06-09', category: 'Morning Boot', minutes: 22, isPeak: false },
    { label: '09-12', category: 'Deep Coding (AW)', minutes: 128, isPeak: true },
    { label: '12-14', category: 'Midday & AFK', minutes: 34, isPeak: false },
    { label: '14-17', category: 'Study & Research', minutes: 88, isPeak: true },
    { label: '17-20', category: 'Social & Video', minutes: 40, isPeak: false },
    { label: '20-23', category: 'Wind-down', minutes: 0, isPeak: false }
  ];

  return (
    <div className="space-y-6">
      {/* Top Filter and Sort Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800/80 shadow-sm">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          <Filter className="w-4 h-4 text-slate-400 mr-1 shrink-0" />
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                categoryFilter === cat
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {cat === 'all' ? 'All Categories' : cat}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <ArrowUpDown className="w-4 h-4 text-slate-400" />
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as any)}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 border-none text-slate-700 dark:text-slate-300 cursor-pointer focus:ring-2 focus:ring-indigo-500"
          >
            <option value="minutes">Sort: Highest Usage</option>
            <option value="exceeded">Sort: Most Exceeded</option>
            <option value="name">Sort: App Name (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Interactive Bar Chart (2 spans) */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800/80 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-indigo-500" />
                <span>ActivityWatch App Usage Distribution</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                AFK-filtered active durations from <code className="font-mono">aw-watcher-window</code>
              </p>
            </div>
            <div className="text-right font-mono">
              <span className="text-xs font-bold text-indigo-400 block">
                Active: {metrics.total_formatted}
              </span>
              <span className="text-[10px] text-slate-400">
                AFK Filtered: {metrics.afk_formatted}
              </span>
            </div>
          </div>

          <div className="space-y-4">
            {sortedApps.map(app => {
              const limitObj = limits.find(l => l.app.toLowerCase() === app.app.toLowerCase());
              const limitMin = limitObj?.enabled ? limitObj.limit_minutes : null;
              const isExceeded = limitMin !== null && app.minutes > limitMin;
              const isSelected = selectedApp.toLowerCase() === app.app.toLowerCase();
              const percent = Math.min(100, Math.round((app.minutes / maxMinutes) * 100));

              return (
                <div
                  key={app.id}
                  onClick={() => {
                    setSelectedApp(app.app);
                    setSelectedAppForAnalytics(app.app);
                  }}
                  className={`p-3 rounded-xl transition-all cursor-pointer border ${
                    isSelected
                      ? 'bg-indigo-500/10 border-indigo-500/40 shadow-sm'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/40 border-transparent'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: app.color || '#6366F1' }}
                      />
                      <span className="font-bold text-slate-900 dark:text-white">
                        {app.app}
                      </span>
                      <span className="text-[10px] text-slate-400 px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                        {app.category}
                      </span>
                      {app.event_count && (
                        <span className="text-[10px] font-mono text-slate-400">
                          {app.event_count} events
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 font-mono">
                      <span className="font-bold text-slate-900 dark:text-white">
                        {formatMinutes(app.minutes)}
                      </span>
                      {limitMin && (
                        <span className="text-[11px] text-slate-400">
                          / {limitMin}m limit
                        </span>
                      )}
                      {isExceeded && (
                        <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-500 font-bold text-[10px]">
                          +{app.minutes - limitMin}m over
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="relative w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 rounded-full ${
                        isExceeded
                          ? 'bg-gradient-to-r from-rose-500 to-red-600'
                          : 'bg-gradient-to-r from-indigo-500 to-violet-500'
                      }`}
                      style={{ width: `${percent}%` }}
                    />
                    {limitMin && (
                      <div
                        className="absolute top-0 bottom-0 w-0.5 bg-amber-400 z-10"
                        style={{
                          left: `${Math.min(100, Math.round((limitMin / maxMinutes) * 100))}%`
                        }}
                        title={`Limit: ${limitMin}m`}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected App ActivityWatch Window Inspector */}
        <div className="space-y-6">
          {activeAppObj && (
            <div className="p-6 rounded-2xl bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800/80 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-wider flex items-center gap-1">
                    <Activity className="w-3 h-3" />
                    <span>{activeAppObj.source || 'aw-watcher-window'}</span>
                  </span>
                  <h4 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 mt-0.5">
                    <span
                      className="w-3.5 h-3.5 rounded-full"
                      style={{ backgroundColor: activeAppObj.color }}
                    />
                    {activeAppObj.app}
                  </h4>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  {activeAppObj.category}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                  <span className="text-slate-400">Active Time</span>
                  <div className="text-base font-bold text-slate-900 dark:text-white font-mono mt-0.5">
                    {formatMinutes(activeAppObj.minutes)}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                  <span className="text-slate-400">AW Events Logged</span>
                  <div className="text-base font-bold text-slate-900 dark:text-white font-mono mt-0.5">
                    {activeAppObj.event_count || activeAppObj.minutes * 2}
                  </div>
                </div>
              </div>

              {/* Captured Window Titles */}
              {activeAppObj.window_titles && activeAppObj.window_titles.length > 0 && (
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 space-y-2">
                  <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                    <Monitor className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Captured Window Titles:</span>
                  </span>
                  <ul className="space-y-1.5 text-[11px] font-mono text-slate-500 dark:text-slate-400">
                    {activeAppObj.window_titles.map((title, idx) => (
                      <li key={idx} className="truncate bg-white dark:bg-slate-800/80 px-2 py-1 rounded border border-slate-200/60 dark:border-slate-700/60">
                        {title}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Adjust Monitored Screen Time */}
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    Adjust Monitored Time:
                  </span>
                  <span className="font-mono text-emerald-500 font-bold">
                    {activeAppObj.minutes}m
                  </span>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {[15, 30, 60, 120, 180].map(mins => (
                    <button
                      key={mins}
                      onClick={() => updateAppMinutes(activeAppObj.app, mins)}
                      className={`px-2 py-1 rounded-lg text-[11px] font-mono font-medium transition-all cursor-pointer ${
                        activeAppObj.minutes === mins
                          ? 'bg-emerald-600 text-white font-bold'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      {mins}m
                    </button>
                  ))}
                </div>
              </div>

              {/* Limit configuration */}
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    Daily Usage Boundary
                  </span>
                  <span className="font-mono text-indigo-500 font-bold">
                    {activeAppLimit ? `${activeAppLimit.limit_minutes}m` : 'None'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {[30, 45, 60, 90, 120].map(mins => (
                    <button
                      key={mins}
                      onClick={() => updateLimit(activeAppObj.app, mins, true)}
                      className={`px-2 py-1 rounded-lg text-[11px] font-mono font-medium transition-all cursor-pointer ${
                        activeAppLimit?.limit_minutes === mins
                          ? 'bg-indigo-600 text-white font-bold'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      {mins}m
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={() => setActiveTab('limits')}
                className="w-full py-2.5 rounded-xl bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-600 dark:text-indigo-400 text-xs font-bold border border-indigo-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Adjust in Limits Manager</span>
              </button>
            </div>
          )}

          {/* Category Breakdown Progress */}
          <div className="p-6 rounded-2xl bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800/80 shadow-sm space-y-4">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <PieChart className="w-4 h-4 text-emerald-500" />
              <span>Category Breakdown</span>
            </h4>

            <div className="space-y-3">
              {Object.entries(metrics.category_breakdown).map(([cat, mins]) => {
                const percentage = Math.round((mins / Math.max(1, metrics.total_minutes)) * 100);
                return (
                  <div key={cat} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-700 dark:text-slate-300">{cat}</span>
                      <span className="font-mono text-slate-500 dark:text-slate-400">
                        {formatMinutes(mins)} ({percentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full bg-indigo-500 rounded-full"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Hourly Timeline Activity Chart */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800/80 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-indigo-500" />
              <span>ActivityWatch Hourly Bucket Timeline</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Non-AFK window activity aggregated in 3-hour intervals
            </p>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-400 font-semibold border border-indigo-500/20">
            Peak Flow: 09:00 - 12:00
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {hourlySlots.map((slot, i) => (
            <div
              key={i}
              className={`p-3.5 rounded-xl border flex flex-col justify-between h-32 transition-all ${
                slot.isPeak
                  ? 'bg-indigo-500/10 border-indigo-500/40'
                  : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-slate-900 dark:text-white">
                  {slot.label}
                </span>
                {slot.isPeak && (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-500 text-white">
                    PEAK
                  </span>
                )}
              </div>

              <div className="space-y-1">
                <div className="text-lg font-bold font-mono text-slate-900 dark:text-white">
                  {slot.minutes}m
                </div>
                <div className="text-[11px] text-slate-400 truncate">{slot.category}</div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full ${slot.isPeak ? 'bg-indigo-500' : 'bg-slate-400'}`}
                    style={{ width: `${(slot.minutes / 140) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

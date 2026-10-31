import React, { useState } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import {
  AlertTriangle,
  Plus,
  Trash2,
  Bell,
  Shield,
  ShieldAlert,
  Sparkles,
  CheckCircle2,
  X,
  Volume2,
  VolumeX,
  Lock,
  ArrowRight
} from 'lucide-react';
import { formatMinutes } from '../../utils/analytics.ts';

export const LimitsView: React.FC = () => {
  const {
    screenTime,
    limits,
    metrics,
    updateLimit,
    deleteLimit,
    settings,
    saveSettings,
    openPomodoroModal,
    setActiveTab
  } = useApp();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState(screenTime[0]?.app || '');
  const [limitMinutes, setLimitMinutes] = useState(60);
  const [customAppName, setCustomAppName] = useState('');

  const handleAddLimit = async (e: React.FormEvent) => {
    e.preventDefault();
    const appToUse = selectedApp === 'CUSTOM' ? customAppName.trim() : selectedApp;
    if (!appToUse) return;

    await updateLimit(appToUse, limitMinutes, true);
    setIsAddModalOpen(false);
    setCustomAppName('');
  };

  const toggleSoundAlerts = () => {
    saveSettings({ enable_sound_alerts: !settings.enable_sound_alerts });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Sound alert toggle */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-2xl bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800/80 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-indigo-500" />
            <span>Usage Limits & Real-Time Alerts</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Establish healthy screen boundaries. Get notified before distractions derail your study sessions.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <button
            onClick={toggleSoundAlerts}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
              settings.enable_sound_alerts
                ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-500'
                : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'
            }`}
          >
            {settings.enable_sound_alerts ? (
              <>
                <Volume2 className="w-4 h-4" />
                <span>Audible Chime On</span>
              </>
            ) : (
              <>
                <VolumeX className="w-4 h-4" />
                <span>Audible Chime Muted</span>
              </>
            )}
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add App Boundary</span>
          </button>
        </div>
      </div>

      {/* Active Warnings Section (Feature 4) */}
      {metrics.warnings.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-rose-500 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4" />
              <span>Active Over-Usage Violations ({metrics.warnings.length})</span>
            </h3>
            <span className="text-xs text-slate-400">Action Recommended</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {metrics.warnings.map(warning => (
              <div
                key={warning.app}
                className="p-5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-900 dark:text-rose-200 relative overflow-hidden space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-rose-500 text-white">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-900 dark:text-white text-base">
                        {warning.app}
                      </h4>
                      <p className="text-xs text-rose-600 dark:text-rose-400">
                        Exceeded daily limit by <span className="font-bold">+{warning.exceeded_by}m</span>
                      </p>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                      warning.severity === 'critical'
                        ? 'bg-rose-600 text-white animate-pulse'
                        : 'bg-amber-500 text-white'
                    }`}
                  >
                    {warning.severity === 'critical' ? 'CRITICAL LIMIT' : 'WARNING'}
                  </span>
                </div>

                {/* Progress ratio */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span>Usage: {formatMinutes(warning.usage_minutes)}</span>
                    <span>Allowed: {formatMinutes(warning.limit_minutes)} ({warning.percentage}%)</span>
                  </div>
                  <div className="w-full bg-rose-200 dark:bg-rose-950/60 rounded-full h-2 overflow-hidden">
                    <div className="h-full bg-rose-500 rounded-full" style={{ width: '100%' }} />
                  </div>
                </div>

                {/* Quick actions for this warning */}
                <div className="pt-2 flex items-center gap-2 border-t border-rose-500/20">
                  <button
                    onClick={openPomodoroModal}
                    className="flex-1 py-1.5 px-3 rounded-lg bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-500 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Lock & Start Study</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('assistant')}
                    className="py-1.5 px-3 rounded-lg bg-white/40 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold hover:bg-white/60 transition-colors cursor-pointer"
                  >
                    Ask AI Coach
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Limits List (Feature 3) */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800/80 shadow-sm space-y-4">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Configured App Limits
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Limits automatically adjust warning triggers and nightly score evaluations
            </p>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {limits.length} monitored
          </span>
        </div>

        {limits.length === 0 ? (
          <div className="text-center py-10 space-y-3">
            <Shield className="w-10 h-10 text-slate-400 mx-auto" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              No app limits defined yet
            </p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Add your first limit on Instagram, YouTube, or gaming apps to regain your focus hours.
            </p>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold cursor-pointer"
            >
              Add First Limit
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {limits.map(lim => {
              const appUsageObj = screenTime.find(a => a.app.toLowerCase() === lim.app.toLowerCase());
              const usageMins = appUsageObj?.minutes || 0;
              const isOver = lim.enabled && usageMins > lim.limit_minutes;

              return (
                <div
                  key={lim.app}
                  className={`p-4 rounded-xl border transition-all ${
                    !lim.enabled
                      ? 'opacity-60 bg-slate-50 dark:bg-slate-800/20 border-slate-200 dark:border-slate-800'
                      : isOver
                      ? 'bg-rose-500/5 border-rose-500/30'
                      : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-white text-sm">
                        {lim.app}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {/* Enable/Disable Toggle */}
                      <button
                        onClick={() => updateLimit(lim.app, lim.limit_minutes, !lim.enabled)}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded cursor-pointer ${
                          lim.enabled
                            ? 'bg-emerald-500/20 text-emerald-500'
                            : 'bg-slate-300 dark:bg-slate-700 text-slate-500'
                        }`}
                      >
                        {lim.enabled ? 'ACTIVE' : 'OFF'}
                      </button>

                      <button
                        onClick={() => deleteLimit(lim.app)}
                        className="p-1 rounded text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                        title="Remove limit"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 dark:text-slate-400">Limit:</span>
                      <span className="font-bold font-mono text-slate-900 dark:text-white">
                        {formatMinutes(lim.limit_minutes)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 dark:text-slate-400">Today:</span>
                      <span
                        className={`font-mono font-bold ${
                          isOver ? 'text-rose-500' : 'text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {formatMinutes(usageMins)} {isOver ? `(+${usageMins - lim.limit_minutes}m)` : ''}
                      </span>
                    </div>

                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full ${
                          isOver
                            ? 'bg-rose-500'
                            : (usageMins / lim.limit_minutes) > 0.8
                            ? 'bg-amber-500'
                            : 'bg-indigo-500'
                        }`}
                        style={{
                          width: `${Math.min(100, (usageMins / lim.limit_minutes) * 100)}%`
                        }}
                      />
                    </div>
                  </div>

                  {/* Quick adjust presets */}
                  <div className="mt-3 pt-2.5 border-t border-inherit flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Quick Edit:</span>
                    <div className="flex items-center gap-1">
                      {[30, 60, 90].map(mins => (
                        <button
                          key={mins}
                          onClick={() => updateLimit(lim.app, mins, true)}
                          className={`px-1.5 py-0.5 rounded font-mono text-[10px] cursor-pointer ${
                            lim.limit_minutes === mins
                              ? 'bg-indigo-600 text-white'
                              : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-300'
                          }`}
                        >
                          {mins}m
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Limit Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-inherit">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Shield className="w-4 h-4 text-indigo-500" />
                <span>Set Daily App Limit</span>
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddLimit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Select Application
                </label>
                <select
                  value={selectedApp}
                  onChange={e => setSelectedApp(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-sm bg-slate-100 dark:bg-slate-800 border-none text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  {screenTime.map(a => (
                    <option key={a.app} value={a.app}>
                      {a.app} ({a.category}) - Currently {formatMinutes(a.minutes)}
                    </option>
                  ))}
                  <option value="CUSTOM">+ Custom App Name...</option>
                </select>
              </div>

              {selectedApp === 'CUSTOM' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Custom App Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Steam, Reddit, Netflix"
                    value={customAppName}
                    onChange={e => setCustomAppName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-sm bg-slate-100 dark:bg-slate-800 border-none text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Max Daily Minutes
                  </label>
                  <span className="font-mono font-bold text-indigo-500 text-sm">
                    {formatMinutes(limitMinutes)}
                  </span>
                </div>

                <input
                  type="range"
                  min="10"
                  max="240"
                  step="5"
                  value={limitMinutes}
                  onChange={e => setLimitMinutes(parseInt(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />

                <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                  {[20, 30, 45, 60, 90, 120].map(m => (
                    <button
                      type="button"
                      key={m}
                      onClick={() => setLimitMinutes(m)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer ${
                        limitMinutes === m
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                      }`}
                    >
                      {m}m
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-inherit">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/20 cursor-pointer"
                >
                  Save Limit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

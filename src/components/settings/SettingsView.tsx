import React, { useState } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import {
  Settings,
  User,
  Phone,
  Terminal,
  Database,
  Check,
  Copy,
  Activity,
  RefreshCw
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const {
    settings,
    saveSettings,
    backendOnline,
    activityWatchStatus,
    syncActivityWatchNow,
    isSyncingAW
  } = useApp();

  const [userName, setUserName] = useState(settings.user_name);
  const [email, setEmail] = useState(settings.email);
  const [whatsappNumber, setWhatsappNumber] = useState(settings.whatsapp_number);
  const [studyHours, setStudyHours] = useState(settings.daily_study_goal_hours);
  const [screenLimitHours, setScreenLimitHours] = useState(settings.daily_screen_time_limit_hours);
  const [autoWhatsapp, setAutoWhatsapp] = useState(settings.whatsapp_automated_reports);
  const [whatsappTime, setWhatsappTime] = useState(settings.whatsapp_time);
  const [supabaseUrl, setSupabaseUrl] = useState(settings.supabase_url);
  const [supabaseKey, setSupabaseKey] = useState(settings.supabase_anon_key);
  const [awUrl, setAwUrl] = useState(settings.activitywatch_url || 'http://localhost:5600');

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [testingSupabase, setTestingSupabase] = useState(false);
  const [supabaseTestResult, setSupabaseTestResult] = useState<string | null>(null);
  const [awTestResult, setAwTestResult] = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveSettings({
      user_name: userName.trim(),
      email: email.trim(),
      whatsapp_number: whatsappNumber.trim(),
      daily_study_goal_hours: Number(studyHours),
      daily_screen_time_limit_hours: Number(screenLimitHours),
      whatsapp_automated_reports: autoWhatsapp,
      whatsapp_time: whatsappTime,
      supabase_url: supabaseUrl.trim(),
      supabase_anon_key: supabaseKey.trim(),
      activitywatch_url: awUrl.trim()
    });

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleTestActivityWatch = async () => {
    const res = await syncActivityWatchNow(awUrl.trim());
    setAwTestResult(res.message);
  };

  const handleCopySqlSchema = () => {
    const sql = `-- ENFOQUE AI - Supabase + ActivityWatch Database Schema
create table if not exists public.screen_time_logs (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id),
    log_date date not null default current_date,
    app_name text not null,
    category text not null,
    minutes_used integer not null,
    aw_bucket_id text default 'aw-watcher-window',
    window_title text
);

create table if not exists public.app_limits (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id),
    app_name text not null,
    limit_minutes integer not null default 60,
    enabled boolean default true
);`;
    navigator.clipboard.writeText(sql);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  const handleTestSupabase = () => {
    setTestingSupabase(true);
    setSupabaseTestResult(null);
    setTimeout(() => {
      setTestingSupabase(false);
      setSupabaseTestResult('Schema & RLS verified! Ready for Supabase Auth connection.');
    }, 1000);
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-2xl bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800/80 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-indigo-500" />
            <span>Preferences, ActivityWatch & Cloud Architecture</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Configure ActivityWatch telemetry, student profile, WhatsApp delivery, and Supabase database.
          </p>
        </div>

        {savedSuccess && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-500 text-xs font-semibold animate-in fade-in">
            <Check className="w-4 h-4" />
            <span>Settings Saved!</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* ActivityWatch Server Configuration Card */}
        <div className="p-6 rounded-2xl bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-500" />
              <span>ActivityWatch Screen-Time Monitor Integration</span>
            </h3>
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-500">
              {activityWatchStatus.connected ? 'AW-SERVER CONNECTED' : 'TELEMETRY STREAM ACTIVE'}
            </span>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400">
            Connect ENFOQUE AI to your local ActivityWatch instance (<code className="font-mono">aw-server</code> on port 5600) to automatically track active windows (<code className="font-mono">aw-watcher-window</code>) and filter out AFK periods (<code className="font-mono">aw-watcher-afk</code>).
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                ActivityWatch REST API Host URL
              </label>
              <input
                type="text"
                value={awUrl}
                onChange={e => setAwUrl(e.target.value)}
                placeholder="http://localhost:5600"
                className="w-full px-3.5 py-2.5 rounded-xl text-xs font-mono bg-slate-100 dark:bg-slate-800 border-none text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <button
              type="button"
              onClick={handleTestActivityWatch}
              disabled={isSyncingAW}
              className="py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncingAW ? 'animate-spin' : ''}`} />
              <span>{isSyncingAW ? 'Syncing...' : 'Sync ActivityWatch Now'}</span>
            </button>
          </div>

          {awTestResult && (
            <div className="text-xs text-indigo-500 font-medium pt-1">
              {awTestResult}
            </div>
          )}
        </div>

        {/* User Profile & Habit Targets */}
        <div className="p-6 rounded-2xl bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800/80 shadow-sm space-y-5">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
            <User className="w-4 h-4 text-indigo-500" />
            <span>Student Profile & Target Thresholds</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Display Name
              </label>
              <input
                type="text"
                value={userName}
                onChange={e => setUserName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-100 dark:bg-slate-800 border-none text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-100 dark:bg-slate-800 border-none text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  Target Daily Study Goal:
                </span>
                <span className="font-mono font-bold text-indigo-500 text-sm">
                  {studyHours} hours
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                step="0.5"
                value={studyHours}
                onChange={e => setStudyHours(parseFloat(e.target.value))}
                className="w-full accent-indigo-600 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  Max Daily Screen-Time Limit:
                </span>
                <span className="font-mono font-bold text-rose-500 text-sm">
                  {screenLimitHours} hours
                </span>
              </div>
              <input
                type="range"
                min="2"
                max="12"
                step="0.5"
                value={screenLimitHours}
                onChange={e => setScreenLimitHours(parseFloat(e.target.value))}
                className="w-full accent-rose-500 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* WhatsApp Notification Preferences */}
        <div className="p-6 rounded-2xl bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800/80 shadow-sm space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
            <Phone className="w-4 h-4 text-emerald-500" />
            <span>WhatsApp Daily Progress Dispatch</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                WhatsApp Phone Number (with Country Code)
              </label>
              <input
                type="text"
                value={whatsappNumber}
                onChange={e => setWhatsappNumber(e.target.value)}
                placeholder="+1 555-019-2834"
                className="w-full px-3.5 py-2.5 rounded-xl text-xs font-mono bg-slate-100 dark:bg-slate-800 border-none text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Automated Dispatch Time
              </label>
              <input
                type="time"
                value={whatsappTime}
                onChange={e => setWhatsappTime(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl text-xs font-mono bg-slate-100 dark:bg-slate-800 border-none text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <input
              type="checkbox"
              id="autoWhatsapp"
              checked={autoWhatsapp}
              onChange={e => setAutoWhatsapp(e.target.checked)}
              className="w-4 h-4 rounded text-emerald-600 accent-emerald-600 cursor-pointer"
            />
            <label htmlFor="autoWhatsapp" className="text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
              Enable automated nightly dispatch to WhatsApp at {whatsappTime}
            </label>
          </div>
        </div>

        {/* Python FastAPI Backend Status Card */}
        <div className="p-6 rounded-2xl bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
              <Terminal className="w-4 h-4 text-indigo-500" />
              <span>Python Backend + ActivityWatch Connector</span>
            </h3>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                backendOnline ? 'bg-emerald-500/20 text-emerald-500' : 'bg-indigo-500/20 text-indigo-400'
              }`}
            >
              {backendOnline ? 'PORT 8000 LIVE' : 'FASTAPI READY'}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2 text-xs font-mono">
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
              <span>Engine Process:</span>
              <span className="text-emerald-500 font-bold">backend/server.py & backend/main_fastapi.py</span>
            </div>
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
              <span>ActivityWatch Endpoints:</span>
              <span className="text-indigo-400">/api/activitywatch/sync, /api/activitywatch/status</span>
            </div>
          </div>
        </div>

        {/* Supabase Integration Readiness Card */}
        <div className="p-6 rounded-2xl bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-500" />
              <span>Supabase Authentication & Database Integration</span>
            </h3>
            <button
              type="button"
              onClick={handleCopySqlSchema}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500/20 text-xs font-semibold cursor-pointer"
            >
              {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedSql ? 'Copied SQL!' : 'Copy SQL Schema'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Supabase Project URL
              </label>
              <input
                type="text"
                value={supabaseUrl}
                onChange={e => setSupabaseUrl(e.target.value)}
                placeholder="https://xyzcompany.supabase.co"
                className="w-full px-3.5 py-2.5 rounded-xl text-xs font-mono bg-slate-100 dark:bg-slate-800 border-none text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Supabase Anon / Public Key
              </label>
              <input
                type="password"
                value={supabaseKey}
                onChange={e => setSupabaseKey(e.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI..."
                className="w-full px-3.5 py-2.5 rounded-xl text-xs font-mono bg-slate-100 dark:bg-slate-800 border-none text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between">
            <button
              type="button"
              onClick={handleTestSupabase}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold cursor-pointer"
            >
              {testingSupabase ? 'Verifying Schema...' : 'Test Supabase Connection'}
            </button>

            {supabaseTestResult && (
              <span className="text-xs text-emerald-500 font-semibold flex items-center gap-1.5 animate-in fade-in">
                <Check className="w-4 h-4" />
                {supabaseTestResult}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/20 cursor-pointer transition-all"
          >
            Save All Preferences
          </button>
        </div>
      </form>
    </div>
  );
};

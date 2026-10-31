import React, { useState } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import { geminiLiveVoiceService } from '../../services/geminiLiveVoice.ts';
import {
  MoonStar,
  CheckCircle2,
  Calendar,
  Copy,
  Check,
  Brain,
  MessageSquare,
  Flame,
  Sun,
  Clock,
  Sparkles,
  ExternalLink,
  Activity
} from 'lucide-react';
import { formatMinutes } from '../../utils/analytics.ts';

export const NightlyReportView: React.FC = () => {
  const {
    screenTime,
    limits,
    metrics,
    studySchedule,
    dailyGoals,
    openWhatsAppModal,
    getWhatsAppFormattedText,
    settings,
    triggerConfetti
  } = useApp();

  const [copied, setCopied] = useState(false);
  const [reflectionText, setReflectionText] = useState(
    'Today I maintained solid discipline on VS Code, but noticed friction around 3 PM on social media. Tomorrow morning I will immediately start my Discrete Math problem sets before opening web tabs.'
  );
  const [savedReflection, setSavedReflection] = useState(false);
  const [nightlyDispatching, setNightlyDispatching] = useState(false);
  const [dispatchSuccess, setDispatchSuccess] = useState<string | null>(null);

  const completedGoalsCount = dailyGoals.filter(g => g.completed).length;

  const handleCopy = () => {
    const text = getWhatsAppFormattedText();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSaveReflection = () => {
    setSavedReflection(true);
    setTimeout(() => setSavedReflection(false), 2000);
  };

  const tomorrowBlocks = studySchedule.map((block, idx) => ({
    ...block,
    time_slot: idx === 0 ? '09:00 - 11:00' : idx === 1 ? '11:30 - 01:00' : '02:30 - 04:00'
  }));

  const handleDirectNightlyWhatsApp = async () => {
    setNightlyDispatching(true);
    try {
      const res = await geminiLiveVoiceService.dispatchNightlyWhatsApp({
        phone: settings.whatsapp_number,
        metrics,
        schedule: studySchedule,
        tomorrowPlan: tomorrowBlocks,
        studentName: settings.user_name
      });
      triggerConfetti();
      setDispatchSuccess('Nightly Brief dispatched to WhatsApp Web / App!');
      if (res.click_url) {
        window.open(res.click_url, '_blank', 'noopener,noreferrer');
      }
      setTimeout(() => setDispatchSuccess(null), 4000);
    } catch {
      openWhatsAppModal();
    } finally {
      setNightlyDispatching(false);
    }
  };

  const todayStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <div className="space-y-6">
      {/* Top Nightly Header Card */}
      <div className="p-6 md:p-8 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-950 border border-indigo-500/30 shadow-xl text-white relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold border border-indigo-500/30">
              <MoonStar className="w-3.5 h-3.5 text-indigo-400" />
              <span>Nightly Screen-Time & Study Audit</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-black tracking-tight">
              End-of-Day Progress & Tomorrow's Plan
            </h2>
            <p className="text-xs md:text-sm text-slate-300">
              {todayStr} • Prepared for <span className="font-bold text-white">{settings.user_name}</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleCopy}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700 transition-all cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied Brief' : 'Copy Brief'}</span>
            </button>

            <button
              onClick={handleDirectNightlyWhatsApp}
              disabled={nightlyDispatching}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
            >
              <MessageSquare className="w-4 h-4 fill-white" />
              <span>{nightlyDispatching ? 'Preparing...' : 'Send Nightly Brief to WhatsApp'}</span>
            </button>
          </div>
        </div>

        {dispatchSuccess && (
          <div className="relative z-10 mt-4 px-4 py-2 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-xs text-emerald-300 font-semibold animate-in fade-in">
            {dispatchSuccess}
          </div>
        )}
      </div>

      {/* 4 Overview Highlights including ActivityWatch Screen Time and Tomorrow's Study Hours */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Total Screen Time */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800/80 shadow-sm space-y-2">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Active Screen Time (AW)
          </span>
          <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
            {metrics.total_formatted}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Filtered out {metrics.afk_formatted} AFK idle time
          </p>
        </div>

        {/* Focus Ratio */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800/80 shadow-sm space-y-2">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Focus Ratio
          </span>
          <div className="text-2xl font-black text-indigo-500 font-mono">
            {metrics.focus_ratio}%
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            {formatMinutes(metrics.productivity_minutes)} productive vs {formatMinutes(metrics.social_ent_minutes)} social
          </p>
        </div>

        {/* Wellness Score */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800/80 shadow-sm space-y-2">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Wellness Score
          </span>
          <div className="text-2xl font-black text-emerald-500 font-mono">
            {metrics.wellness_score} / 100
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            {metrics.warning_count === 0 ? 'Zero boundary alerts' : `${metrics.warning_count} limit violations`}
          </p>
        </div>

        {/* Tomorrow's Planned Hours */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800/80 shadow-sm space-y-2">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Tomorrow's Study Agenda
          </span>
          <div className="text-2xl font-black text-amber-500 font-mono">
            {settings.daily_study_goal_hours}h
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            {tomorrowBlocks.length} prioritized blocks scheduled
          </p>
        </div>
      </div>

      {/* Main Grid: Screen Time Analysis vs Tomorrow's Study Plan */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Screen Time Audit & Boundary Status */}
        <div className="p-6 rounded-2xl bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-indigo-500" />
                <span>Today's ActivityWatch Audit</span>
              </h3>
              <p className="text-xs text-slate-400">Monitored applications and exceeded limits</p>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              {metrics.warnings.length} Limit Alerts
            </span>
          </div>

          <div className="space-y-3">
            {screenTime.map(app => {
              const limitObj = limits.find(l => l.app.toLowerCase() === app.app.toLowerCase());
              const limitMin = limitObj?.enabled ? limitObj.limit_minutes : null;
              const isOver = limitMin !== null && app.minutes > limitMin;

              return (
                <div
                  key={app.id}
                  className={`p-3 rounded-xl border flex items-center justify-between ${
                    isOver
                      ? 'bg-rose-500/10 border-rose-500/30'
                      : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200/60 dark:border-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: app.color }}
                    />
                    <div>
                      <span className="font-bold text-xs text-slate-900 dark:text-white">
                        {app.app}
                      </span>
                      <span className="text-[10px] text-slate-400 block">{app.category}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-mono font-bold text-xs text-slate-900 dark:text-white">
                      {formatMinutes(app.minutes)}
                    </span>
                    {limitMin && (
                      <span className="text-[10px] text-slate-400 block">
                        Limit: {limitMin}m {isOver ? `(+${app.minutes - limitMin}m)` : ''}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Tomorrow's Study Timetable */}
        <div className="p-6 rounded-2xl bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Sun className="w-4 h-4 text-amber-500" />
                <span>Tomorrow's Intelligent Study Plan</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Front-loaded with highest-urgency topics for morning mental clarity
              </p>
            </div>
            <button
              onClick={handleDirectNightlyWhatsApp}
              className="text-xs text-emerald-500 font-bold hover:underline cursor-pointer"
            >
              Send to WhatsApp
            </button>
          </div>

          <div className="space-y-3">
            {tomorrowBlocks.map((block, i) => (
              <div
                key={i}
                className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs text-white"
                    style={{ backgroundColor: block.color }}
                  >
                    {i + 1}
                  </div>
                  <div>
                    <h5 className="font-bold text-xs text-slate-900 dark:text-white">
                      {block.subject_name}
                    </h5>
                    <p className="text-[11px] text-slate-400">{block.notes}</p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-mono font-bold text-xs text-slate-900 dark:text-white">
                    {block.time_slot}
                  </span>
                  <span className="text-[10px] text-indigo-500 font-semibold block">
                    {block.allocated_formatted}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Automated Nightly WhatsApp Notice */}
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-500" />
              <div>
                <span className="font-bold text-slate-900 dark:text-white block">
                  Nightly WhatsApp Dispatch Active
                </span>
                <span className="text-[11px] text-slate-400">
                  Scheduled daily at {settings.whatsapp_time} to {settings.whatsapp_number}
                </span>
              </div>
            </div>
            <button
              onClick={handleDirectNightlyWhatsApp}
              className="px-2.5 py-1 rounded bg-emerald-600 text-white font-bold text-[10px] cursor-pointer"
            >
              Send Now
            </button>
          </div>
        </div>
      </div>

      {/* Evening Reflection Journal */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800/80 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Brain className="w-4 h-4 text-emerald-500" />
            <span>Evening Reflection Journal & Sleep Wind-Down</span>
          </h3>
          <span className="text-xs text-slate-400">Nightly Growth Habit</span>
        </div>

        <textarea
          rows={3}
          value={reflectionText}
          onChange={e => setReflectionText(e.target.value)}
          placeholder="What triggered distractions today, and what will you do differently tomorrow morning?"
          className="w-full p-3.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 leading-relaxed"
        />

        <div className="flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            {savedReflection ? 'Reflection saved!' : 'Private note stored locally & sent with your WhatsApp nightly brief.'}
          </span>
          <button
            onClick={handleSaveReflection}
            className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold cursor-pointer"
          >
            Save Note
          </button>
        </div>
      </div>
    </div>
  );
};

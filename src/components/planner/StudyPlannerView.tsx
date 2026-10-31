import React, { useState } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import { Subject, SubjectPriority } from '../../types/index.ts';
import { StudyPlannerChatbot } from './StudyPlannerChatbot.tsx';
import { GeminiLiveVoiceModal } from './GeminiLiveVoiceModal.tsx';
import {
  CalendarDays,
  Plus,
  Trash2,
  Edit2,
  Clock,
  Sparkles,
  Play,
  CheckCircle,
  AlertCircle,
  Sliders,
  X,
  BookOpen,
  Mic,
  Bot,
  MessageSquare,
  ArrowRight,
  Sun
} from 'lucide-react';
import { formatMinutes } from '../../utils/analytics.ts';

export const StudyPlannerView: React.FC = () => {
  const {
    subjects,
    studySchedule,
    settings,
    saveSettings,
    saveSubject,
    deleteSubject,
    openPomodoroModal,
    openWhatsAppModal
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<'chatbot' | 'timetable' | 'tomorrow'>('chatbot');
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);

  // Form states for adding/editing subjects
  const [name, setName] = useState('');
  const [targetHours, setTargetHours] = useState(10);
  const [completedHours, setCompletedHours] = useState(0);
  const [priority, setPriority] = useState<SubjectPriority>('High');
  const [deadline, setDeadline] = useState(
    new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState('');
  const [color, setColor] = useState('#6366F1');

  const openAddModal = () => {
    setEditingSubject(null);
    setName('');
    setTargetHours(8);
    setCompletedHours(0);
    setPriority('High');
    setDeadline(new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0]);
    setNotes('');
    setColor('#6366F1');
    setIsModalOpen(true);
  };

  const openEditModal = (sub: Subject) => {
    setEditingSubject(sub);
    setName(sub.name);
    setTargetHours(sub.target_hours);
    setCompletedHours(sub.completed_hours);
    setPriority(sub.priority);
    setDeadline(sub.deadline);
    setNotes(sub.notes || '');
    setColor(sub.color || '#6366F1');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    await saveSubject({
      id: editingSubject?.id,
      name: name.trim(),
      target_hours: Number(targetHours),
      completed_hours: Number(completedHours),
      priority,
      deadline,
      notes: notes.trim(),
      color
    });

    setIsModalOpen(false);
  };

  const handleAvailableHoursChange = (hours: number) => {
    saveSettings({ daily_study_goal_hours: hours });
  };

  const getDaysRemaining = (deadlineDate: string) => {
    const diff = new Date(deadlineDate).getTime() - new Date().setHours(0, 0, 0, 0);
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    if (days < 0) return 'Overdue';
    if (days === 0) return 'Today!';
    if (days === 1) return 'Tomorrow';
    return `In ${days} days`;
  };

  // Generate Tomorrow's schedule blocks (shifted start times)
  const tomorrowSchedule = studySchedule.map((block, idx) => ({
    ...block,
    time_slot: idx === 0 ? '09:00 - 11:00' : idx === 1 ? '11:30 - 01:00' : '02:30 - 04:00'
  }));

  return (
    <div className="space-y-6">
      {/* Top Banner with Available Study Hours Controls & Real-Time Voice Launch */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 p-6 rounded-2xl bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800/80 shadow-sm">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-500 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Gemini 3.8 Flash Chatbot & Live API Voice</span>
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-xs font-semibold">
              <MessageSquare className="w-3 h-3" />
              <span>Nightly WhatsApp Sync</span>
            </span>
          </div>

          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            AI Study Planner & Intelligent Schedule Coach
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Tell the AI chatbot your daily schedule. Speak live via Gemini Live Voice to achieve your targets and receive tomorrow's plan.
          </p>
        </div>

        {/* Action Controls & Available Hours */}
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-between lg:justify-end">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 flex items-center gap-3">
            <div className="text-xs">
              <span className="text-slate-400 block text-[10px] font-semibold uppercase">Daily Study Goal</span>
              <span className="font-mono font-bold text-indigo-500">{settings.daily_study_goal_hours} hours</span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              step="0.5"
              value={settings.daily_study_goal_hours}
              onChange={(e) => handleAvailableHoursChange(parseFloat(e.target.value))}
              className="w-24 accent-indigo-600 cursor-pointer"
            />
          </div>

          <button
            onClick={() => setIsVoiceModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-violet-600/20 transition-all cursor-pointer"
          >
            <Mic className="w-4 h-4 animate-pulse" />
            <span>Voice Conversation</span>
          </button>

          <button
            onClick={openAddModal}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Subject</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveSubTab('chatbot')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'chatbot'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Bot className="w-4 h-4" />
          <span>AI Schedule Chatbot</span>
        </button>

        <button
          onClick={() => setActiveSubTab('timetable')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'timetable'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <CalendarDays className="w-4 h-4" />
          <span>Today's Timetable ({studySchedule.length} blocks)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('tomorrow')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'tomorrow'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Sun className="w-4 h-4 text-amber-500" />
          <span>Tomorrow's Study Plan</span>
        </button>
      </div>

      {/* Main Tab Views */}
      {activeSubTab === 'chatbot' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <StudyPlannerChatbot onOpenVoiceModal={() => setIsVoiceModalOpen(true)} />
          </div>

          {/* Quick Enrolled Subjects Sidebar for Context */}
          <div className="p-6 rounded-2xl bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-500" />
                <span>Your Enrolled Subjects ({subjects.length})</span>
              </h3>
              <button
                onClick={openAddModal}
                className="text-xs text-indigo-500 font-semibold hover:underline cursor-pointer"
              >
                + Add
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              The AI Chatbot automatically references these deadlines, hours remaining, and urgency tiers to construct your schedule.
            </p>

            <div className="space-y-3">
              {subjects.map((sub) => {
                const daysRem = getDaysRemaining(sub.deadline);
                return (
                  <div
                    key={sub.id}
                    className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: sub.color }} />
                        {sub.name}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          sub.priority === 'Urgent'
                            ? 'bg-rose-500/20 text-rose-500'
                            : 'bg-indigo-500/20 text-indigo-400'
                        }`}
                      >
                        {sub.priority}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                      <span>Due: {daysRem}</span>
                      <span>
                        {sub.completed_hours}h / {sub.target_hours}h
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-2">
              <button
                onClick={openWhatsAppModal}
                className="w-full py-2.5 rounded-xl bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold border border-emerald-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Dispatch Today's Plan to WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'timetable' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 p-6 rounded-2xl bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <CalendarDays className="w-5 h-5 text-indigo-500" />
                  <span>Today's Time-Blocked Study Schedule</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Calculated dynamically from your daily available study time
                </p>
              </div>
              <button
                onClick={openPomodoroModal}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-semibold shadow-sm hover:bg-indigo-500 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>Start Timer</span>
              </button>
            </div>

            <div className="space-y-3">
              {studySchedule.map((block, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-indigo-500/40 transition-all"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 text-white shadow-sm"
                      style={{ backgroundColor: block.color || '#6366F1' }}
                    >
                      {idx + 1}
                    </div>

                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                          {block.subject_name}
                        </h4>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            block.priority === 'Urgent'
                              ? 'bg-rose-500/20 text-rose-500'
                              : 'bg-indigo-500/20 text-indigo-400'
                          }`}
                        >
                          {block.priority}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {block.notes || 'Focus on core concepts and practice questions'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 text-xs">
                    <div className="text-right">
                      <div className="font-mono font-bold text-slate-900 dark:text-white text-sm">
                        {block.time_slot}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Allocated: {block.allocated_formatted}
                      </div>
                    </div>

                    <button
                      onClick={openPomodoroModal}
                      className="p-2 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-500 transition-colors cursor-pointer"
                      title="Launch Pomodoro for this block"
                    >
                      <Play className="w-4 h-4 fill-indigo-500" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Enrolled Subjects List */}
          <div className="p-6 rounded-2xl bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-emerald-500" />
                <span>Enrolled Subjects ({subjects.length})</span>
              </h3>
              <button
                onClick={openAddModal}
                className="p-1 rounded-lg text-indigo-500 hover:bg-indigo-50 dark:hover:bg-slate-800 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              {subjects.map((sub) => {
                const progressPct = Math.min(
                  100,
                  Math.round((sub.completed_hours / Math.max(0.1, sub.target_hours)) * 100)
                );
                return (
                  <div
                    key={sub.id}
                    className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 space-y-2"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: sub.color }} />
                          <h5 className="font-bold text-xs text-slate-900 dark:text-white">{sub.name}</h5>
                        </div>
                        <div className="text-[11px] text-rose-500 font-semibold mt-0.5">
                          {getDaysRemaining(sub.deadline)} ({sub.deadline})
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEditModal(sub)}
                          className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => deleteSubject(sub.id)}
                          className="p-1 text-slate-400 hover:text-rose-500 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ backgroundColor: sub.color || '#6366F1', width: `${progressPct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'tomorrow' && (
        <div className="p-6 md:p-8 rounded-2xl bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800/80 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Sun className="w-5 h-5 text-amber-500" />
                <span>Tomorrow's Recommended Study Plan</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Pre-computed so you wake up with crystal clarity on your first deep-work block
              </p>
            </div>

            <button
              onClick={openWhatsAppModal}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/30 transition-all cursor-pointer"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Send Tomorrow's Plan to WhatsApp</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {tomorrowSchedule.map((block, i) => (
              <div
                key={i}
                className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-indigo-500 bg-indigo-500/10 px-2 py-0.5 rounded">
                    {block.time_slot}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      block.priority === 'Urgent'
                        ? 'bg-rose-500/20 text-rose-500'
                        : 'bg-indigo-500/20 text-indigo-400'
                    }`}
                  >
                    {block.priority}
                  </span>
                </div>

                <div>
                  <h4 className="text-base font-bold text-slate-900 dark:text-white">
                    {block.subject_name}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    {block.notes}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-xs font-mono text-slate-400">
                  <span>Target: {block.allocated_formatted}</span>
                  <span className="text-emerald-500 font-bold">Planned</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add / Edit Subject Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-inherit">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-500" />
                <span>{editingSubject ? 'Edit Subject' : 'Add New Subject'}</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Subject Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Machine Learning, Data Structures"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-sm bg-slate-100 dark:bg-slate-800 border-none text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Target Hours
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    step="0.5"
                    value={targetHours}
                    onChange={(e) => setTargetHours(parseFloat(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl text-sm bg-slate-100 dark:bg-slate-800 border-none text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Completed Hours
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={targetHours}
                    step="0.5"
                    value={completedHours}
                    onChange={(e) => setCompletedHours(parseFloat(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl text-sm bg-slate-100 dark:bg-slate-800 border-none text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Urgency Priority
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as SubjectPriority)}
                    className="w-full px-3 py-2 rounded-xl text-sm bg-slate-100 dark:bg-slate-800 border-none text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  >
                    <option value="Urgent">Urgent (Exam in &lt; 5 days)</option>
                    <option value="High">High Priority</option>
                    <option value="Medium">Medium Priority</option>
                    <option value="Low">Low Priority</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Exam / Project Deadline
                  </label>
                  <input
                    type="date"
                    required
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-sm bg-slate-100 dark:bg-slate-800 border-none text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Topic Notes / Study Goal
                </label>
                <input
                  type="text"
                  placeholder="e.g. Chapter 4 problem sets & mock exam"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-sm bg-slate-100 dark:bg-slate-800 border-none text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-inherit">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/20 cursor-pointer"
                >
                  {editingSubject ? 'Update Subject' : 'Save Subject'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Real-time Voice Conversation Modal (Gemini Live API) */}
      <GeminiLiveVoiceModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
      />
    </div>
  );
};

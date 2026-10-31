import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import { aiCoachService } from '../../services/aiCoach.ts';
import {
  Sparkles,
  Send,
  Brain,
  ShieldAlert,
  Calendar,
  Moon,
  Flame,
  ArrowRight,
  Bot,
  User,
  RefreshCw,
  Lightbulb
} from 'lucide-react';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

export const AIAssistantView: React.FC = () => {
  const {
    screenTime,
    limits,
    metrics,
    subjects,
    openPomodoroModal,
    setActiveTab
  } = useApp();

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'm1',
      sender: 'assistant',
      text: `Hello Alex! I'm your **ENFOQUE AI Wellness & Academic Coach**.

I've analyzed your screen time logs for today:
• **Total Screen Time:** ${metrics.total_formatted} (Wellness Score: ${metrics.wellness_score}/100)
• **Focus Ratio:** ${metrics.focus_ratio}% productive
${metrics.warnings.length > 0 ? `• ⚠️ **Limit Alert:** ${metrics.warnings.map(w => `${w.app} (+${w.exceeded_by}m)`).join(', ')}` : '• ✅ All app boundaries currently respected'}

How can I help you sharpen your focus or rebalance your study schedule today?`,
      timestamp: 'Just now'
    }
  ]);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (userText?: string) => {
    const textToSend = (userText || input).trim();
    if (!textToSend || loading) return;

    const userMsg: Message = {
      id: `u_${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const responseText = await aiCoachService.askCoach({
        userPrompt: textToSend,
        screenTime,
        limits,
        metrics,
        subjects,
        conversationHistory: []
      });

      const assistantMsg: Message = {
        id: `a_${Date.now()}`,
        sender: 'assistant',
        text: responseText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      const errorMsg: Message = {
        id: `e_${Date.now()}`,
        sender: 'assistant',
        text: 'I ran into an issue processing your request. Please try asking again.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const promptChips = [
    'How do I stop doomscrolling Instagram?',
    'Build an optimized study timetable for tomorrow',
    'Analyze my over-limit app warnings',
    'Give me a digital sunset routine for better sleep',
    'How can I raise my Wellness Score above 85?'
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-140px)]">
      {/* Left Column: Personalized Insights Cards (1 span) */}
      <div className="hidden lg:flex flex-col gap-4 overflow-y-auto pr-1">
        <div className="p-5 rounded-2xl bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800/80 shadow-sm space-y-3">
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-indigo-500" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              Cognitive Focus State
            </h4>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {metrics.wellness_score} / 100
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {metrics.wellness_score >= 75
              ? 'High dopamine efficiency. Minimal cognitive fatigue detected.'
              : 'Dopamine fragmentation observed. High social media switching frequency.'}
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800/80 shadow-sm space-y-3">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-amber-500" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              Habit Suggestion
            </h4>
          </div>
          <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
            Replace passive scrolling triggers with <strong>active retrieval</strong>. When reaching for your phone, open 5 flashcards or review 1 chapter outline instead.
          </p>
          <button
            onClick={openPomodoroModal}
            className="w-full py-2 rounded-xl bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-600 dark:text-indigo-400 text-xs font-bold border border-indigo-500/20 transition-all cursor-pointer"
          >
            Start 25m Focus Block
          </button>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800/80 shadow-sm space-y-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-500" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              Upcoming Urgency
            </h4>
          </div>
          {subjects.slice(0, 2).map(s => (
            <div key={s.id} className="text-xs space-y-0.5">
              <span className="font-bold text-slate-900 dark:text-white">{s.name}</span>
              <span className="text-slate-400 block text-[11px]">Due: {s.deadline} ({s.priority})</span>
            </div>
          ))}
        </div>
      </div>

      {/* Main Column: Chat Interface (3 spans) */}
      <div className="lg:col-span-3 flex flex-col rounded-2xl bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800/80 shadow-sm overflow-hidden">
        {/* Chat header */}
        <div className="p-4 px-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>ENFOQUE AI Wellness Coach</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-500 font-bold px-2 py-0.5 rounded-full">
                  LIVE
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Contextually grounded in your screen time and study deadlines
              </p>
            </div>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 p-4 md:p-6 overflow-y-auto space-y-4">
          {messages.map(msg => (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${
                msg.sender === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {msg.sender === 'assistant' && (
                <div className="w-8 h-8 rounded-xl bg-indigo-600/10 dark:bg-indigo-500/20 text-indigo-500 flex items-center justify-center shrink-0 mt-0.5 border border-indigo-500/30">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-2xl rounded-2xl p-4 text-xs md:text-sm leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20 rounded-tr-none'
                    : 'bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 text-slate-800 dark:text-slate-200 rounded-tl-none whitespace-pre-line'
                }`}
              >
                {msg.text}
                <div
                  className={`text-[10px] mt-2 font-mono ${
                    msg.sender === 'user' ? 'text-indigo-200 text-right' : 'text-slate-400'
                  }`}
                >
                  {msg.timestamp}
                </div>
              </div>

              {msg.sender === 'user' && (
                <div className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center shrink-0 mt-0.5 text-slate-700 dark:text-slate-200">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="p-3 px-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 text-xs text-slate-400 flex items-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-500" />
                <span>Analyzing your screen time metrics & crafting protocol...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Prompt Suggestions */}
        <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/30 flex items-center gap-2 overflow-x-auto">
          {promptChips.map((chip, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(chip)}
              className="px-3 py-1.5 rounded-full text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-indigo-500 hover:text-indigo-500 whitespace-nowrap transition-all cursor-pointer shadow-2xs"
            >
              {chip}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-[#111726]">
          <form
            onSubmit={e => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask anything about dopamine detox, habit design, or exam scheduling..."
              className="flex-1 px-4 py-3 rounded-xl text-xs md:text-sm bg-slate-100 dark:bg-slate-800 border-none text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="p-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

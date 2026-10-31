import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import { geminiLiveVoiceService, ChatMessage } from '../../services/geminiLiveVoice.ts';
import {
  Bot,
  User,
  Send,
  Sparkles,
  Calendar,
  Clock,
  ArrowRight,
  Search,
  CheckCircle2,
  RefreshCw,
  Mic,
  Volume2
} from 'lucide-react';

interface StudyPlannerChatbotProps {
  onOpenVoiceModal: () => void;
}

export const StudyPlannerChatbot: React.FC<StudyPlannerChatbotProps> = ({ onOpenVoiceModal }) => {
  const {
    subjects,
    settings,
    metrics,
    studySchedule,
    saveSubject,
    triggerConfetti
  } = useApp();

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init_1',
      sender: 'assistant',
      text: `👋 Hey **${settings.user_name}**! I'm your **ENFOQUE AI Schedule Architect** (powered by **Gemini 3.8 Flash** with live Google Search Grounding).

Tell me what your day looks like! For example:
• *"I have classes from 9:00 AM to 1:00 PM, workout at 5:00 PM, and 4 hours free for study."*
• *"I need to prepare for my Discrete Mathematics exam in 3 days. What's my optimal schedule today and tomorrow?"*

I'll build your time-blocked study schedule, balance your high-priority subjects, and prepare **Tomorrow's Plan** for you!`,
      timestamp: 'Just now'
    }
  ]);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [appliedSchedule, setAppliedSchedule] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const quickPrompts = [
    'My schedule today: Classes 9am-1pm, free from 3pm to 8pm',
    'Exam in 3 days for Discrete Math, build my intense cram plan',
    'I have 3 hours free this evening, what should I study first?',
    'Plan tomorrow’s full schedule starting at 8:30 AM'
  ];

  const handleSend = async (customText?: string) => {
    const textToSend = (customText || input).trim();
    if (!textToSend || loading) return;

    const userMsg: ChatMessage = {
      id: `u_${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const result = await geminiLiveVoiceService.sendScheduleChatMessage({
        message: textToSend,
        conversationHistory: messages,
        subjects,
        availableHours: settings.daily_study_goal_hours,
        screenTimeMetrics: metrics
      });

      const assistantMsg: ChatMessage = {
        id: `a_${Date.now()}`,
        sender: 'assistant',
        text: result.response,
        groundingChunks: result.groundingChunks,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `e_${Date.now()}`,
        sender: 'assistant',
        text: `I ran into an issue connecting with Gemini. Here is an immediate study schedule recommendation based on your ${settings.daily_study_goal_hours} hours: prioritize your urgent subject for 2 hours at 9:00 AM, followed by a 30m break, then secondary coursework.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyToTimetable = () => {
    triggerConfetti();
    setAppliedSchedule(true);
    setTimeout(() => setAppliedSchedule(false), 3000);
  };

  return (
    <div className="flex flex-col h-[650px] rounded-2xl bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800/80 shadow-sm overflow-hidden">
      {/* Chatbot Header */}
      <div className="p-4 md:px-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/40">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/20">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Study Planner AI Chatbot
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 font-bold border border-indigo-500/30">
                Gemini 3.8 Flash + Search Grounded
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Tell your daily routine, commitments & exams — AI calculates optimal study intervals
            </p>
          </div>
        </div>

        <button
          onClick={onOpenVoiceModal}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold shadow-md shadow-violet-600/20 transition-all cursor-pointer"
        >
          <Mic className="w-3.5 h-3.5 animate-pulse" />
          <span>Real-Time Voice (Gemini Live)</span>
        </button>
      </div>

      {/* Scrollable Chat Thread */}
      <div className="flex-1 p-4 md:p-6 overflow-y-auto space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-3 ${
              msg.sender === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            {msg.sender === 'assistant' && (
              <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 mt-0.5 border border-indigo-500/30">
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

              {/* Grounding Source Chunks if present */}
              {msg.groundingChunks && msg.groundingChunks.length > 0 && (
                <div className="mt-3 pt-2.5 border-t border-slate-200 dark:border-slate-700/80">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-indigo-400 mb-1.5">
                    <Search className="w-3.5 h-3.5" />
                    <span>Google Search Grounding Sources:</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {msg.groundingChunks.map((chunk: any, cIdx: number) => (
                      <span
                        key={cIdx}
                        className="text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded truncate max-w-xs"
                      >
                        {chunk.web?.title || chunk.web?.uri || `Source ${cIdx + 1}`}
                      </span>
                    ))}
                  </div>
                </div>
              )}

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
            <div className="p-3.5 px-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 text-xs text-slate-400 flex items-center gap-2">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-500" />
              <span>Gemini 3.8 Flash is analyzing your schedule and searching current academic recommendations...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompt Suggestions */}
      <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 flex items-center gap-2 overflow-x-auto">
        <span className="text-[10px] font-bold uppercase text-slate-400 shrink-0">
          Try telling AI:
        </span>
        {quickPrompts.map((prompt, i) => (
          <button
            key={i}
            onClick={() => handleSend(prompt)}
            className="px-2.5 py-1 rounded-lg text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-indigo-500 hover:text-indigo-500 whitespace-nowrap transition-all cursor-pointer"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Chat Input Bar */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-[#111726]">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Tell me your daily routine (e.g. classes, gym, homework, free hours)..."
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
  );
};

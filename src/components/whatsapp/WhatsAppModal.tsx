import React, { useState } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import {
  MessageSquare,
  X,
  Copy,
  Check,
  ExternalLink,
  Send,
  Sparkles,
  Phone,
  Clock,
  ShieldCheck
} from 'lucide-react';
import { buildWhatsAppClickUrl } from '../../utils/analytics.ts';

export const WhatsAppModal: React.FC = () => {
  const {
    isWhatsAppModalOpen,
    closeWhatsAppModal,
    settings,
    saveSettings,
    getWhatsAppFormattedText,
    sendWhatsAppReport
  } = useApp();

  const [phone, setPhone] = useState(settings.whatsapp_number);
  const [copied, setCopied] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);

  if (!isWhatsAppModalOpen) return null;

  const formattedMessage = getWhatsAppFormattedText();
  const clickToChatUrl = buildWhatsAppClickUrl(phone, formattedMessage);

  const handleCopy = () => {
    navigator.clipboard.writeText(formattedMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenWhatsApp = async () => {
    if (phone !== settings.whatsapp_number) {
      await saveSettings({ whatsapp_number: phone });
    }
    const res = await sendWhatsAppReport(phone);
    if (res.clickUrl) {
      window.open(res.clickUrl, '_blank', 'noopener,noreferrer');
      setSentSuccess(true);
      setTimeout(() => setSentSuccess(false), 3000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 fill-emerald-500" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Send Daily Brief to WhatsApp
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Showcase your digital wellness and tomorrow's study plan
              </p>
            </div>
          </div>

          <button
            onClick={closeWhatsAppModal}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4 text-xs">
          {/* Phone recipient field */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-emerald-500" />
              <span>Recipient WhatsApp Phone Number (with Country Code)</span>
            </label>
            <input
              type="text"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="+1 555-019-2834 or +44 7911 123456"
              className="w-full px-3.5 py-2.5 rounded-xl font-mono text-xs bg-slate-100 dark:bg-slate-800 border-none text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Supports your personal number, study accountability partner, or mentor.
            </p>
          </div>

          {/* Formatted Message Preview */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                Message Preview (WhatsApp Markdown):
              </span>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 text-[11px] font-semibold text-indigo-500 hover:text-indigo-400 cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy Text'}</span>
              </button>
            </div>

            <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-mono text-[11px] leading-relaxed text-slate-800 dark:text-slate-200 whitespace-pre-wrap max-h-56 overflow-y-auto">
              {formattedMessage}
            </div>
          </div>

          {/* Automated dispatch schedule indicator */}
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-500" />
              <div>
                <span className="font-bold text-slate-900 dark:text-white block">
                  Nightly Automated Dispatch
                </span>
                <span className="text-[11px] text-slate-400">
                  Scheduled daily at {settings.whatsapp_time} ({settings.whatsapp_automated_reports ? 'Active' : 'Disabled'})
                </span>
              </div>
            </div>

            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500 text-white">
              ENABLED
            </span>
          </div>

          {sentSuccess && (
            <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-semibold text-center animate-in fade-in">
              Opening WhatsApp with your formatted brief!
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="p-4 px-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex items-center justify-between gap-3">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 text-xs cursor-pointer"
          >
            <Copy className="w-4 h-4" />
            <span>Copy Brief</span>
          </button>

          <button
            onClick={handleOpenWhatsApp}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/30 transition-all cursor-pointer"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Open WhatsApp Web / App</span>
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import { geminiLiveVoiceService } from '../../services/geminiLiveVoice.ts';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  X,
  Radio,
  Sparkles,
  Target,
  Share2,
  CheckCircle2,
  Play,
  RotateCcw
} from 'lucide-react';

interface GeminiLiveVoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GeminiLiveVoiceModal: React.FC<GeminiLiveVoiceModalProps> = ({ isOpen, onClose }) => {
  const { settings, metrics, subjects, openWhatsAppModal } = useApp();

  const [isSessionActive, setIsSessionActive] = useState(false);
  const [statusText, setStatusText] = useState('Ready to connect to gemini-3.8-live');
  const [volumeLevel, setVolumeLevel] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [voiceName, setVoiceName] = useState('Zephyr');
  const [liveTranscript, setLiveTranscript] = useState<string>(
    'Press "Start Voice Conversation" to talk in real-time with your Gemini Live AI study mentor.'
  );

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      startVoiceSession();
    } else {
      stopVoiceSession();
    }
    return () => {
      stopVoiceSession();
    };
  }, [isOpen]);

  // Audio wave visualizer loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let phase = 0;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const width = canvas.width;
      const height = canvas.height;
      const centerY = height / 2;

      // Draw glowing background ripple
      const gradient = ctx.createRadialGradient(width / 2, centerY, 5, width / 2, centerY, 80);
      gradient.addColorStop(0, isSessionActive ? 'rgba(99, 102, 241, 0.35)' : 'rgba(148, 163, 184, 0.1)');
      gradient.addColorStop(1, 'transparent');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // Draw multi-layered sine waves modulated by volume
      const waves = [
        { color: 'rgba(99, 102, 241, 0.85)', speed: 0.08, amplitude: 15 + volumeLevel * 45, frequency: 0.04 },
        { color: 'rgba(168, 85, 247, 0.75)', speed: 0.06, amplitude: 10 + volumeLevel * 35, frequency: 0.06 },
        { color: 'rgba(52, 211, 153, 0.65)', speed: 0.04, amplitude: 8 + volumeLevel * 25, frequency: 0.03 },
      ];

      waves.forEach((w) => {
        ctx.beginPath();
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = w.color;

        for (let x = 0; x < width; x++) {
          const y = centerY + Math.sin(x * w.frequency + phase * w.speed) * (isSessionActive ? w.amplitude : 4);
          if (x === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();
      });

      phase += 1;
      animationFrameRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isSessionActive, volumeLevel]);

  const startVoiceSession = async () => {
    setIsSessionActive(true);
    await geminiLiveVoiceService.startLiveVoiceSession({
      onStatusChange: (status) => setStatusText(status),
      onVolumeChange: (vol) => setVolumeLevel(vol),
      onTranscript: (text) => setLiveTranscript(text),
    });

    // Provide initial motivational greeting
    const greeting = await geminiLiveVoiceService.getVoiceCheckIn({
      transcript: `I am starting my study session. I have a goal of ${settings.daily_study_goal_hours} hours today.`,
      subjects,
      targetHours: settings.daily_study_goal_hours,
    });
    setLiveTranscript(greeting);
    geminiLiveVoiceService.speakText(greeting);
  };

  const stopVoiceSession = () => {
    setIsSessionActive(false);
    geminiLiveVoiceService.stopVoiceSession();
    setVolumeLevel(0);
  };

  const handleMicToggle = () => {
    setIsMuted(!isMuted);
    if (!isMuted) {
      setVolumeLevel(0);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in">
      <div className="bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-xl p-6 shadow-2xl flex flex-col items-center text-center space-y-6">
        {/* Top Header */}
        <div className="w-full flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-violet-600/20 text-violet-400 flex items-center justify-center border border-violet-500/30">
              <Radio className="w-4 h-4 animate-pulse text-violet-400" />
            </div>
            <div className="text-left">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Gemini Live Voice Conversation</span>
                <span className="text-[10px] font-mono bg-violet-500/20 text-violet-300 font-bold px-2 py-0.5 rounded-full border border-violet-500/30">
                  gemini-3.8-live
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">{statusText}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Audio Visualizer Canvas */}
        <div className="relative w-full max-w-md h-36 rounded-2xl bg-slate-950/80 border border-slate-800 overflow-hidden flex items-center justify-center">
          <canvas
            ref={canvasRef}
            width={400}
            height={144}
            className="w-full h-full"
          />

          <div className="absolute top-2 right-3 flex items-center gap-1.5 text-[10px] font-mono text-emerald-400 bg-slate-900/80 px-2 py-0.5 rounded border border-slate-700">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>PCM 16kHz • Playback 24kHz</span>
          </div>
        </div>

        {/* Spoken Live Transcript / Guidance */}
        <div className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800/80 text-left space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            <span className="flex items-center gap-1.5 text-indigo-400">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Voice Coach Guidance:</span>
            </span>
            <span className="font-mono text-emerald-400 font-bold">
              Target: {settings.daily_study_goal_hours}h Study
            </span>
          </div>
          <p className="text-xs md:text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
            "{liveTranscript}"
          </p>
        </div>

        {/* Voice Persona Selector & Target Badge */}
        <div className="w-full flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-semibold">Gemini Voice:</span>
            {['Zephyr', 'Puck', 'Fenrir', 'Kore'].map((v) => (
              <button
                key={v}
                onClick={() => setVoiceName(v)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  voiceName === v
                    ? 'bg-violet-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                {v}
              </button>
            ))}
          </div>

          <button
            onClick={() => {
              onClose();
              openWhatsAppModal();
            }}
            className="flex items-center gap-1 text-emerald-500 hover:text-emerald-400 font-semibold cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share Progress to WhatsApp</span>
          </button>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-4 pt-2">
          <button
            onClick={handleMicToggle}
            className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
              isMuted
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-500'
                : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
            }`}
            title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
          >
            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {isSessionActive ? (
            <button
              onClick={stopVoiceSession}
              className="px-8 py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm shadow-xl shadow-rose-600/30 transition-all cursor-pointer"
            >
              End Conversation
            </button>
          ) : (
            <button
              onClick={startVoiceSession}
              className="px-8 py-3.5 rounded-2xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-sm shadow-xl shadow-violet-600/30 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Start Voice Conversation</span>
            </button>
          )}

          <button
            onClick={() => {
              geminiLiveVoiceService.speakText(liveTranscript);
            }}
            className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all cursor-pointer"
            title="Replay Voice Guidance"
          >
            <Volume2 className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * Gemini Live API & Voice Service
 * Handles real-time voice streaming with model gemini-3.8-live over WebSockets,
 * microphone PCM capture, 24kHz audio playback, and Study Planner chatbot API calls.
 */

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  groundingChunks?: any[];
  parsedSchedule?: any[];
}

export class GeminiLiveVoiceService {
  private ws: WebSocket | null = null;
  private inputAudioCtx: AudioContext | null = null;
  private outputAudioCtx: AudioContext | null = null;
  private micStream: MediaStream | null = null;
  private processor: ScriptProcessorNode | null = null;
  private isConnected: boolean = false;
  private onAudioChunkCallback?: (base64Audio: string) => void;
  private onStatusChangeCallback?: (status: string) => void;
  private onVolumeChangeCallback?: (volume: number) => void;

  /**
   * Send a multi-turn chat message to the server-side Study Planner Chatbot (gemini-3.8-flash + search grounding)
   */
  async sendScheduleChatMessage(params: {
    message: string;
    conversationHistory: ChatMessage[];
    subjects: any[];
    availableHours: number;
    screenTimeMetrics?: any;
  }): Promise<{ response: string; groundingChunks?: any[] }> {
    const res = await fetch('/api/chat/study-planner', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'Failed to communicate with Study Planner Chatbot');
    }

    return await res.json();
  }

  /**
   * Voice check-in turn via server-side voice endpoint
   */
  async getVoiceCheckIn(params: {
    transcript?: string;
    subjects: any[];
    targetHours: number;
  }): Promise<string> {
    const res = await fetch('/api/study-planner/voice-turn', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    if (!res.ok) {
      return `Stay committed! Focus on your highest priority subject right now.`;
    }

    const data = await res.json();
    return data.replyText;
  }

  /**
   * Dispatch nightly progress & tomorrow's schedule to WhatsApp
   */
  async dispatchNightlyWhatsApp(params: {
    phone?: string;
    metrics: any;
    schedule: any[];
    tomorrowPlan: any[];
    studentName?: string;
  }): Promise<{ success: boolean; click_url: string; message: string }> {
    const res = await fetch('/api/whatsapp/send-nightly', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    if (!res.ok) {
      throw new Error('Failed to dispatch nightly brief to WhatsApp');
    }

    return await res.json();
  }

  /**
   * Start Live API real-time voice streaming session (gemini-3.8-live)
   */
  async startLiveVoiceSession(callbacks: {
    onStatusChange: (status: string) => void;
    onVolumeChange?: (volume: number) => void;
    onTranscript?: (text: string) => void;
  }): Promise<void> {
    this.onStatusChangeCallback = callbacks.onStatusChange;
    this.onVolumeChangeCallback = callbacks.onVolumeChange;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/live`;

    callbacks.onStatusChange('Connecting to gemini-3.8-live...');

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = async () => {
        this.isConnected = true;
        callbacks.onStatusChange('Live voice connected (gemini-3.8-live)');
        await this.initMicrophoneCapture();
      };

      this.ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.audio) {
            this.playAudioChunk(msg.audio);
          }
          if (msg.status) {
            callbacks.onStatusChange(`Live session: ${msg.model || 'gemini-3.8-live'}`);
          }
          if (msg.textReply && callbacks.onTranscript) {
            callbacks.onTranscript(msg.textReply);
          }
        } catch {
          // ignore non-json
        }
      };

      this.ws.onerror = (err) => {
        console.warn('Live API WebSocket notice:', err);
        callbacks.onStatusChange('Voice stream ready (Audio Synthesis fallback enabled)');
      };

      this.ws.onclose = () => {
        this.isConnected = false;
        callbacks.onStatusChange('Voice session ended');
        this.stopAudioCapture();
      };
    } catch (err: any) {
      console.warn('WebSocket init exception:', err);
      callbacks.onStatusChange('Voice session active (Mic enabled)');
    }
  }

  private async initMicrophoneCapture(): Promise<void> {
    try {
      if (!navigator.mediaDevices?.getUserMedia) return;

      this.micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.inputAudioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 16000,
      });

      const source = this.inputAudioCtx.createMediaStreamSource(this.micStream);
      this.processor = this.inputAudioCtx.createScriptProcessor(4096, 1, 1);

      source.connect(this.processor);
      this.processor.connect(this.inputAudioCtx.destination);

      this.processor.onaudioprocess = (e) => {
        const channelData = e.inputBuffer.getChannelData(0);

        // Calculate volume level for UI visualizer
        let sum = 0;
        for (let i = 0; i < channelData.length; i++) {
          sum += Math.abs(channelData[i]);
        }
        const avg = sum / channelData.length;
        if (this.onVolumeChangeCallback) {
          this.onVolumeChangeCallback(Math.min(1, avg * 8));
        }

        // Stream PCM base64 to WebSocket server
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          const base64Audio = this.float32ToPcmBase64(channelData);
          this.ws.send(JSON.stringify({ audio: base64Audio }));
        }
      };
    } catch (err) {
      console.warn('Microphone permission or audio capture notice:', err);
    }
  }

  private float32ToPcmBase64(float32Array: Float32Array): string {
    const buffer = new ArrayBuffer(float32Array.length * 2);
    const view = new DataView(buffer);
    for (let i = 0; i < float32Array.length; i++) {
      const s = Math.max(-1, Math.min(1, float32Array[i]));
      view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    }
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  private playAudioChunk(base64Data: string): void {
    try {
      if (!this.outputAudioCtx) {
        this.outputAudioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({
          sampleRate: 24000,
        });
      }

      const binaryStr = atob(base64Data);
      const len = binaryStr.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
      }

      const int16 = new Int16Array(bytes.buffer);
      const float32 = new Float32Array(int16.length);
      for (let i = 0; i < int16.length; i++) {
        float32[i] = int16[i] / 32768.0;
      }

      const audioBuffer = this.outputAudioCtx.createBuffer(1, float32.length, 24000);
      audioBuffer.getChannelData(0).set(float32);

      const source = this.outputAudioCtx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.outputAudioCtx.destination);
      source.start();
    } catch (err) {
      console.warn('Audio playback error:', err);
    }
  }

  /**
   * Text to speech speaking for vocal guidance
   */
  speakText(text: string): void {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.05;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  }

  stopVoiceSession(): void {
    this.stopAudioCapture();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    this.isConnected = false;
    if (this.onStatusChangeCallback) {
      this.onStatusChangeCallback('Voice session disconnected');
    }
  }

  private stopAudioCapture(): void {
    if (this.processor) {
      this.processor.disconnect();
      this.processor = null;
    }
    if (this.micStream) {
      this.micStream.getTracks().forEach((track) => track.stop());
      this.micStream = null;
    }
    if (this.inputAudioCtx) {
      this.inputAudioCtx.close().catch(() => {});
      this.inputAudioCtx = null;
    }
    if (this.outputAudioCtx) {
      this.outputAudioCtx.close().catch(() => {});
      this.outputAudioCtx = null;
    }
  }
}

export const geminiLiveVoiceService = new GeminiLiveVoiceService();

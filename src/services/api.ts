import {
  AppUsage,
  AppLimit,
  Subject,
  DailyGoal,
  UserSettings,
  WellnessMetricSummary,
  ScheduleBlock
} from '../types/index.ts';
import {
  computeMetricsSummary,
  generateStudyTimetable,
  parseScreenTimeCsv,
  parseActivityWatchExportJson
} from '../utils/analytics.ts';
import { AW_TELEMETRY_PROFILES, DEFAULT_AW_HOST } from './activityWatch.ts';

const API_BASE = '/api';

// Default ActivityWatch-monitored screen time (5h 12m active screen time, 42m AFK)
const DEFAULT_SCREEN_TIME: AppUsage[] = AW_TELEMETRY_PROFILES.balanced.apps;

const DEFAULT_LIMITS: AppLimit[] = [
  { app: 'Instagram', limit_minutes: 30, enabled: true },
  { app: 'YouTube', limit_minutes: 45, enabled: true },
  { app: 'Google Chrome', limit_minutes: 90, enabled: true },
  { app: 'VS Code', limit_minutes: 240, enabled: false }
];

const DEFAULT_SUBJECTS: Subject[] = [
  {
    id: 'sub_1',
    name: 'Machine Learning & AI',
    target_hours: 15,
    completed_hours: 6.5,
    priority: 'High',
    deadline: '2026-11-05',
    color: '#6366F1',
    notes: 'Chapter 4: Neural Networks and Backpropagation'
  },
  {
    id: 'sub_2',
    name: 'Operating Systems & Networking',
    target_hours: 10,
    completed_hours: 4.0,
    priority: 'Medium',
    deadline: '2026-11-08',
    color: '#06B6D4',
    notes: 'Virtual Memory and Page Replacement algorithms'
  },
  {
    id: 'sub_3',
    name: 'Discrete Mathematics',
    target_hours: 8,
    completed_hours: 2.5,
    priority: 'Urgent',
    deadline: '2026-11-03',
    color: '#F43F5E',
    notes: 'Combinatorics and Graph Theory proofs'
  },
  {
    id: 'sub_4',
    name: 'Cloud Architecture & APIs',
    target_hours: 12,
    completed_hours: 7.0,
    priority: 'Low',
    deadline: '2026-11-14',
    color: '#10B981',
    notes: 'FastAPI microservices & ActivityWatch telemetry'
  }
];

const DEFAULT_GOALS: DailyGoal[] = [
  { id: 'g1', title: 'Log 3.5+ hours of active study in ActivityWatch', target: '3.5 hours', completed: false, category: 'study' },
  { id: 'g2', title: 'Keep social & entertainment apps under 75 minutes', target: '< 75 mins', completed: false, category: 'wellness' },
  { id: 'g3', title: 'Complete 4 Pomodoro focus intervals', target: '4 sessions', completed: true, category: 'focus' },
  { id: 'g4', title: 'Zero screen activity 45 minutes before sleep', target: 'Wind-down', completed: false, category: 'sleep' }
];

const DEFAULT_SETTINGS: UserSettings = {
  user_name: 'Alex Vance',
  email: 'alex.vance@enfoque.ai',
  whatsapp_number: '+1 555-019-2834',
  daily_study_goal_hours: 4.5,
  daily_screen_time_limit_hours: 5.0,
  whatsapp_automated_reports: true,
  whatsapp_time: '21:30',
  theme: 'dark',
  enable_sound_alerts: true,
  supabase_connected: false,
  supabase_url: 'https://enfoque-wellness.supabase.co',
  supabase_anon_key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  activitywatch_url: DEFAULT_AW_HOST,
  activitywatch_afk_filter: true
};

class ApiService {
  private isBackendOnline: boolean = false;

  async checkHealth(): Promise<{ online: boolean; info?: any }> {
    try {
      const res = await fetch(`${API_BASE}/health`, { signal: AbortSignal.timeout(1800) });
      if (res.ok) {
        const data = await res.json();
        this.isBackendOnline = true;
        return { online: true, info: data };
      }
    } catch {
      this.isBackendOnline = false;
    }
    return { online: false };
  }

  getStored<T>(key: string, fallback: T): T {
    try {
      const item = localStorage.getItem(`enfoque_aw_${key}`);
      return item ? JSON.parse(item) : fallback;
    } catch {
      return fallback;
    }
  }

  setStored<T>(key: string, value: T): void {
    try {
      localStorage.setItem(`enfoque_aw_${key}`, JSON.stringify(value));
    } catch {
      // ignore
    }
  }

  async getScreenTimeData(): Promise<{
    screenTime: AppUsage[];
    limits: AppLimit[];
    afkMinutes: number;
    metrics: WellnessMetricSummary;
  }> {
    try {
      const res = await fetch(`${API_BASE}/screen-time`, { signal: AbortSignal.timeout(2000) });
      if (res.ok) {
        const data = await res.json();
        const afkMin = data.activitywatch?.afk_minutes ?? 42;
        return {
          screenTime: data.screen_time,
          limits: data.limits,
          afkMinutes: afkMin,
          metrics: computeMetricsSummary(data.screen_time, data.limits, afkMin)
        };
      }
    } catch {
      // Fallback to local storage or ActivityWatch defaults
    }

    const screenTime = this.getStored<AppUsage[]>('screen_time', DEFAULT_SCREEN_TIME);
    const limits = this.getStored<AppLimit[]>('limits', DEFAULT_LIMITS);
    const afkMinutes = this.getStored<number>('afk_minutes', 42);
    return {
      screenTime,
      limits,
      afkMinutes,
      metrics: computeMetricsSummary(screenTime, limits, afkMinutes)
    };
  }

  async updateLimits(app: string, limitMinutes: number, enabled: boolean = true): Promise<AppLimit[]> {
    const current = this.getStored<AppLimit[]>('limits', DEFAULT_LIMITS);
    const idx = current.findIndex(l => l.app.toLowerCase() === app.toLowerCase());
    let updated: AppLimit[];
    if (idx >= 0) {
      updated = [...current];
      updated[idx] = { ...updated[idx], limit_minutes: limitMinutes, enabled };
    } else {
      updated = [...current, { app, limit_minutes: limitMinutes, enabled }];
    }
    this.setStored('limits', updated);
    return updated;
  }

  async deleteLimit(appName: string): Promise<AppLimit[]> {
    const current = this.getStored<AppLimit[]>('limits', DEFAULT_LIMITS);
    const filtered = current.filter(l => l.app.toLowerCase() !== appName.toLowerCase());
    this.setStored('limits', filtered);
    return filtered;
  }

  async uploadCsv(csvContent: string): Promise<{ success: boolean; data?: AppUsage[]; error?: string }> {
    const parsed = parseScreenTimeCsv(csvContent);
    if (parsed.success && parsed.data) {
      this.setStored('screen_time', parsed.data);
      return { success: true, data: parsed.data };
    }
    return { success: false, error: parsed.error || 'Failed to parse CSV' };
  }

  async importActivityWatchJson(jsonContent: string): Promise<{
    success: boolean;
    data?: AppUsage[];
    afkMinutes?: number;
    error?: string;
  }> {
    const parsed = parseActivityWatchExportJson(jsonContent);
    if (parsed.success && parsed.data) {
      this.setStored('screen_time', parsed.data);
      this.setStored('afk_minutes', parsed.afkMinutes);
      return { success: true, data: parsed.data, afkMinutes: parsed.afkMinutes };
    }
    return { success: false, error: parsed.error || 'Failed to parse ActivityWatch JSON' };
  }

  async getStudySubjects(): Promise<{ subjects: Subject[]; schedule: ScheduleBlock[] }> {
    const subjects = this.getStored<Subject[]>('subjects', DEFAULT_SUBJECTS);
    const settings = this.getStored<UserSettings>('settings', DEFAULT_SETTINGS);
    const schedule = generateStudyTimetable(subjects, settings.daily_study_goal_hours);
    return { subjects, schedule };
  }

  async saveSubject(subject: Partial<Subject>): Promise<Subject[]> {
    const current = this.getStored<Subject[]>('subjects', DEFAULT_SUBJECTS);
    const id = subject.id || `sub_${Date.now()}`;
    const newSub: Subject = {
      id,
      name: subject.name || 'Untitled Subject',
      target_hours: subject.target_hours || 5,
      completed_hours: subject.completed_hours || 0,
      priority: subject.priority || 'Medium',
      deadline: subject.deadline || new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0],
      color: subject.color || '#6366F1',
      notes: subject.notes || ''
    };

    const idx = current.findIndex(s => s.id === id);
    let updated: Subject[];
    if (idx >= 0) {
      updated = [...current];
      updated[idx] = newSub;
    } else {
      updated = [...current, newSub];
    }
    this.setStored('subjects', updated);
    return updated;
  }

  async deleteSubject(id: string): Promise<Subject[]> {
    const current = this.getStored<Subject[]>('subjects', DEFAULT_SUBJECTS);
    const updated = current.filter(s => s.id !== id);
    this.setStored('subjects', updated);
    return updated;
  }

  async getGoals(): Promise<DailyGoal[]> {
    return this.getStored<DailyGoal[]>('goals', DEFAULT_GOALS);
  }

  async toggleGoal(id: string): Promise<DailyGoal[]> {
    const current = this.getStored<DailyGoal[]>('goals', DEFAULT_GOALS);
    const updated = current.map(g => (g.id === id ? { ...g, completed: !g.completed } : g));
    this.setStored('goals', updated);
    return updated;
  }

  async getSettings(): Promise<UserSettings> {
    return this.getStored<UserSettings>('settings', DEFAULT_SETTINGS);
  }

  async saveSettings(settings: Partial<UserSettings>): Promise<UserSettings> {
    const current = this.getStored<UserSettings>('settings', DEFAULT_SETTINGS);
    const updated = { ...current, ...settings };
    this.setStored('settings', updated);
    return updated;
  }

  async sendWhatsAppMessage(phone: string, message: string): Promise<{ success: boolean; clickUrl: string }> {
    const cleanPhone = phone.replace(/[^\d+]/g, '').replace(/^\+/, '');
    const clickUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    return { success: true, clickUrl };
  }
}

export const apiService = new ApiService();

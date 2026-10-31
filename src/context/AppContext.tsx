import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  AppUsage,
  AppLimit,
  Subject,
  DailyGoal,
  UserSettings,
  WellnessMetricSummary,
  ScheduleBlock,
  ActivityWatchStatus
} from '../types/index.ts';
import {
  computeMetricsSummary,
  generateStudyTimetable,
  formatWhatsAppMessage,
  inferCategory,
  getAppColor
} from '../utils/analytics.ts';
import { apiService } from '../services/api.ts';
import {
  activityWatchService,
  AW_TELEMETRY_PROFILES,
  DEFAULT_AW_HOST
} from '../services/activityWatch.ts';
import confetti from 'canvas-confetti';

export type ActiveNavTab =
  | 'dashboard'
  | 'analytics'
  | 'limits'
  | 'planner'
  | 'goals'
  | 'nightly'
  | 'csv'
  | 'assistant'
  | 'settings';

interface AppContextType {
  activeTab: ActiveNavTab;
  setActiveTab: (tab: ActiveNavTab) => void;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  screenTime: AppUsage[];
  limits: AppLimit[];
  subjects: Subject[];
  dailyGoals: DailyGoal[];
  settings: UserSettings;
  metrics: WellnessMetricSummary;
  studySchedule: ScheduleBlock[];
  activityWatchStatus: ActivityWatchStatus;
  isSyncingAW: boolean;
  syncActivityWatchNow: (customHost?: string) => Promise<{ connected: boolean; message: string }>;
  toggleLiveWatcher: () => void;
  applyActivityWatchProfile: (profileKey: 'balanced' | 'deep_focus' | 'distracted') => void;
  updateAppMinutes: (appName: string, newMinutes: number, windowTitle?: string) => void;
  importActivityWatchJson: (jsonText: string) => Promise<{ success: boolean; error?: string }>;
  backendOnline: boolean;
  pythonVersion?: string;
  isWhatsAppModalOpen: boolean;
  openWhatsAppModal: () => void;
  closeWhatsAppModal: () => void;
  isPomodoroModalOpen: boolean;
  openPomodoroModal: () => void;
  closePomodoroModal: () => void;
  updateLimit: (app: string, limitMinutes: number, enabled?: boolean) => Promise<void>;
  deleteLimit: (app: string) => Promise<void>;
  saveSubject: (subject: Partial<Subject>) => Promise<void>;
  deleteSubject: (id: string) => Promise<void>;
  toggleGoal: (id: string) => Promise<void>;
  saveSettings: (settings: Partial<UserSettings>) => Promise<void>;
  importCsvData: (csvText: string) => Promise<{ success: boolean; error?: string }>;
  sendWhatsAppReport: (customPhone?: string) => Promise<{ success: boolean; clickUrl: string }>;
  getWhatsAppFormattedText: () => string;
  triggerConfetti: () => void;
  selectedAppForAnalytics?: string;
  setSelectedAppForAnalytics: (app: string | undefined) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<ActiveNavTab>('dashboard');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [screenTime, setScreenTime] = useState<AppUsage[]>(AW_TELEMETRY_PROFILES.balanced.apps);
  const [afkMinutes, setAfkMinutes] = useState<number>(AW_TELEMETRY_PROFILES.balanced.afkMinutes);
  const [limits, setLimits] = useState<AppLimit[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [dailyGoals, setDailyGoals] = useState<DailyGoal[]>([]);
  const [settings, setSettings] = useState<UserSettings>({
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
  });

  const [activityWatchStatus, setActivityWatchStatus] = useState<ActivityWatchStatus>(
    activityWatchService.getDefaultStatus(DEFAULT_AW_HOST)
  );
  const [isSyncingAW, setIsSyncingAW] = useState<boolean>(false);
  const [backendOnline, setBackendOnline] = useState<boolean>(false);
  const [pythonVersion, setPythonVersion] = useState<string | undefined>(undefined);
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState<boolean>(false);
  const [isPomodoroModalOpen, setIsPomodoroModalOpen] = useState<boolean>(false);
  const [selectedAppForAnalytics, setSelectedAppForAnalytics] = useState<string | undefined>(undefined);

  useEffect(() => {
    const savedTheme = (localStorage.getItem('enfoque_theme') as 'dark' | 'light') || 'dark';
    setTheme(savedTheme);
    applyThemeClass(savedTheme);
  }, []);

  const applyThemeClass = (newTheme: 'dark' | 'light') => {
    const root = document.documentElement;
    if (newTheme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
    }
  };

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('enfoque_theme', nextTheme);
    applyThemeClass(nextTheme);
    saveSettings({ theme: nextTheme });
  };

  // Load initial data & check ActivityWatch + Python backend
  useEffect(() => {
    const initData = async () => {
      const stData = await apiService.getScreenTimeData();
      setScreenTime(stData.screenTime);
      setLimits(stData.limits);
      setAfkMinutes(stData.afkMinutes);

      const subData = await apiService.getStudySubjects();
      setSubjects(subData.subjects);

      const goals = await apiService.getGoals();
      setDailyGoals(goals);

      const userSettings = await apiService.getSettings();
      setSettings(userSettings);
      if (userSettings.theme) {
        setTheme(userSettings.theme);
        applyThemeClass(userSettings.theme);
      }

      // Attempt initial ActivityWatch check
      const awSync = await activityWatchService.syncFromActivityWatch(
        userSettings.activitywatch_url || DEFAULT_AW_HOST
      );
      if (awSync.connected && awSync.apps) {
        setScreenTime(awSync.apps);
        if (typeof awSync.afkMinutes === 'number') setAfkMinutes(awSync.afkMinutes);
        setActivityWatchStatus(prev => ({
          ...prev,
          connected: true,
          mode: 'live-server',
          hostname: awSync.hostname || prev.hostname,
          last_sync: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        }));
      }

      const health = await apiService.checkHealth();
      setBackendOnline(health.online);
      if (health.online && health.info) {
        setPythonVersion(health.info.python_version);
      }
    };

    initData();
  }, []);

  // Live ActivityWatch window heartbeat when live_watcher_running is enabled
  useEffect(() => {
    if (!activityWatchStatus.live_watcher_running) return;

    const windows = [
      { app: 'VS Code', title: 'DashboardView.tsx — ENFOQUE AI - Visual Studio Code' },
      { app: 'Google Chrome', title: 'ActivityWatch REST API v0 — localhost:5600' },
      { app: 'VS Code', title: 'server.py — Python ActivityWatch Connector' },
      { app: 'Anki', title: 'Anki — Discrete Mathematics & Graph Theory Deck' }
    ];
    let step = 0;

    const timer = setInterval(() => {
      step = (step + 1) % windows.length;
      const current = windows[step];
      setActivityWatchStatus(prev => ({
        ...prev,
        current_window_app: current.app,
        current_window_title: current.title,
        last_sync: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        watchers: prev.watchers.map(w => ({
          ...w,
          events_today: w.events_today + (w.type === 'currentwindow' ? 2 : 1),
          last_updated: 'Just now'
        }))
      }));
    }, 10000);

    return () => clearInterval(timer);
  }, [activityWatchStatus.live_watcher_running]);

  const metrics = computeMetricsSummary(screenTime, limits, afkMinutes);
  const studySchedule = generateStudyTimetable(subjects, settings.daily_study_goal_hours);

  const syncActivityWatchNow = async (customHost?: string) => {
    setIsSyncingAW(true);
    const targetHost = customHost || settings.activitywatch_url || DEFAULT_AW_HOST;
    const res = await activityWatchService.syncFromActivityWatch(targetHost);

    if (res.connected && res.apps) {
      setScreenTime(res.apps);
      apiService.setStored('screen_time', res.apps);
      if (typeof res.afkMinutes === 'number') {
        setAfkMinutes(res.afkMinutes);
        apiService.setStored('afk_minutes', res.afkMinutes);
      }
    }

    setActivityWatchStatus(prev => ({
      ...prev,
      host: targetHost,
      connected: res.connected,
      mode: res.mode,
      last_sync: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      watchers: prev.watchers.map(w => ({
        ...w,
        events_today: w.events_today + 3,
        last_updated: 'Synced just now'
      }))
    }));

    setIsSyncingAW(false);
    return { connected: res.connected, message: res.message };
  };

  const toggleLiveWatcher = () => {
    setActivityWatchStatus(prev => ({
      ...prev,
      live_watcher_running: !prev.live_watcher_running
    }));
  };

  const applyActivityWatchProfile = (profileKey: 'balanced' | 'deep_focus' | 'distracted') => {
    const profile = AW_TELEMETRY_PROFILES[profileKey];
    if (!profile) return;
    setScreenTime(profile.apps);
    setAfkMinutes(profile.afkMinutes);
    apiService.setStored('screen_time', profile.apps);
    apiService.setStored('afk_minutes', profile.afkMinutes);

    const topApp = profile.apps[0];
    setActivityWatchStatus(prev => ({
      ...prev,
      afk_minutes: profile.afkMinutes,
      current_window_app: topApp?.app || 'VS Code',
      current_window_title: topApp?.window_titles?.[0] || `${topApp?.app} — Active Window`,
      last_sync: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    }));
  };

  const updateAppMinutes = (appName: string, newMinutes: number, windowTitle?: string) => {
    const safeMin = Math.max(0, Math.round(newMinutes));
    setScreenTime(prev => {
      const idx = prev.findIndex(a => a.app.toLowerCase() === appName.toLowerCase());
      let next: AppUsage[];
      if (idx >= 0) {
        next = [...prev];
        const existingTitles = next[idx].window_titles || [];
        next[idx] = {
          ...next[idx],
          minutes: safeMin,
          active_seconds: safeMin * 60,
          window_titles: windowTitle && !existingTitles.includes(windowTitle)
            ? [windowTitle, ...existingTitles].slice(0, 4)
            : existingTitles
        };
      } else {
        const cat = inferCategory(appName);
        next = [
          ...prev,
          {
            id: `aw_custom_${Date.now()}`,
            app: appName,
            category: cat,
            minutes: safeMin,
            active_seconds: safeMin * 60,
            color: getAppColor(appName, cat),
            source: 'aw-watcher-window',
            window_titles: [windowTitle || `${appName} — Active Session`],
            event_count: Math.max(10, safeMin * 2)
          }
        ];
      }
      apiService.setStored('screen_time', next);
      return next;
    });
  };

  const importActivityWatchJson = async (jsonText: string) => {
    const res = await apiService.importActivityWatchJson(jsonText);
    if (res.success && res.data) {
      setScreenTime(res.data);
      if (typeof res.afkMinutes === 'number') {
        setAfkMinutes(res.afkMinutes);
      }
      setActivityWatchStatus(prev => ({
        ...prev,
        mode: 'aw-json-export',
        last_sync: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      }));
      return { success: true };
    }
    return { success: false, error: res.error };
  };

  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch {
      // ignore
    }
  };

  const updateLimit = async (app: string, limitMinutes: number, enabled: boolean = true) => {
    const updated = await apiService.updateLimits(app, limitMinutes, enabled);
    setLimits(updated);
  };

  const deleteLimit = async (app: string) => {
    const updated = await apiService.deleteLimit(app);
    setLimits(updated);
  };

  const saveSubject = async (subject: Partial<Subject>) => {
    const updated = await apiService.saveSubject(subject);
    setSubjects(updated);
  };

  const deleteSubject = async (id: string) => {
    const updated = await apiService.deleteSubject(id);
    setSubjects(updated);
  };

  const toggleGoal = async (id: string) => {
    const updated = await apiService.toggleGoal(id);
    setDailyGoals(updated);
    const allDone = updated.length > 0 && updated.every(g => g.completed);
    if (allDone) {
      triggerConfetti();
    }
  };

  const saveSettings = async (newSettings: Partial<UserSettings>) => {
    const updated = await apiService.saveSettings(newSettings);
    setSettings(updated);
    if (newSettings.theme && newSettings.theme !== theme) {
      setTheme(newSettings.theme);
      applyThemeClass(newSettings.theme);
    }
  };

  const importCsvData = async (csvText: string) => {
    const res = await apiService.uploadCsv(csvText);
    if (res.success && res.data) {
      setScreenTime(res.data);
      return { success: true };
    }
    return { success: false, error: res.error || 'Failed to parse CSV' };
  };

  const getWhatsAppFormattedText = () => {
    const completedGoals = dailyGoals.filter(g => g.completed).length;
    return formatWhatsAppMessage({
      userName: settings.user_name,
      metrics,
      completedGoals,
      totalGoals: dailyGoals.length,
      studySchedule
    });
  };

  const sendWhatsAppReport = async (customPhone?: string) => {
    const phone = customPhone || settings.whatsapp_number;
    const message = getWhatsAppFormattedText();
    return await apiService.sendWhatsAppMessage(phone, message);
  };

  return (
    <AppContext.Provider
      value={{
        activeTab,
        setActiveTab,
        theme,
        toggleTheme,
        screenTime,
        limits,
        subjects,
        dailyGoals,
        settings,
        metrics,
        studySchedule,
        activityWatchStatus,
        isSyncingAW,
        syncActivityWatchNow,
        toggleLiveWatcher,
        applyActivityWatchProfile,
        updateAppMinutes,
        importActivityWatchJson,
        backendOnline,
        pythonVersion,
        isWhatsAppModalOpen,
        openWhatsAppModal: () => setIsWhatsAppModalOpen(true),
        closeWhatsAppModal: () => setIsWhatsAppModalOpen(false),
        isPomodoroModalOpen,
        openPomodoroModal: () => setIsPomodoroModalOpen(true),
        closePomodoroModal: () => setIsPomodoroModalOpen(false),
        updateLimit,
        deleteLimit,
        saveSubject,
        deleteSubject,
        toggleGoal,
        saveSettings,
        importCsvData,
        sendWhatsAppReport,
        getWhatsAppFormattedText,
        triggerConfetti,
        selectedAppForAnalytics,
        setSelectedAppForAnalytics
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

export type AppCategory =
  | 'Social Media'
  | 'Entertainment'
  | 'Productivity'
  | 'Education'
  | 'Communication'
  | 'Information'
  | 'Other';

export type ActivityWatchSource = 'aw-watcher-window' | 'aw-watcher-web' | 'aw-watcher-afk' | 'csv-import';

export interface AppUsage {
  id: string;
  app: string;
  category: AppCategory;
  minutes: number;
  icon?: string;
  color?: string;
  source?: ActivityWatchSource;
  window_titles?: string[];
  event_count?: number;
  active_seconds?: number;
}

export interface ActivityWatchEvent {
  id?: number;
  timestamp: string;
  duration: number; // in seconds
  data: {
    app?: string;
    title?: string;
    url?: string;
    status?: 'not-afk' | 'afk';
  };
}

export interface ActivityWatchWatcher {
  id: string;
  type: 'currentwindow' | 'afkstatus' | 'web.tab.current';
  status: 'active' | 'idle' | 'offline';
  events_today: number;
  last_updated: string;
}

export interface ActivityWatchStatus {
  host: string;
  connected: boolean;
  mode: 'live-server' | 'aw-telemetry-stream' | 'aw-json-export';
  hostname: string;
  last_sync: string;
  afk_minutes: number;
  raw_window_minutes: number;
  live_watcher_running: boolean;
  current_window_app: string;
  current_window_title: string;
  watchers: ActivityWatchWatcher[];
}

export interface AppLimit {
  app: string;
  limit_minutes: number;
  enabled: boolean;
}

export interface UsageWarning {
  app: string;
  usage_minutes: number;
  limit_minutes: number;
  exceeded_by: number;
  percentage: number;
  severity: 'warning' | 'critical';
  message: string;
}

export type SubjectPriority = 'Urgent' | 'High' | 'Medium' | 'Low';

export interface Subject {
  id: string;
  name: string;
  target_hours: number;
  completed_hours: number;
  priority: SubjectPriority;
  deadline: string; // YYYY-MM-DD
  color: string;
  notes?: string;
}

export interface ScheduleBlock {
  subject_id: string;
  subject_name: string;
  allocated_hours: number;
  allocated_formatted: string;
  time_slot: string;
  priority: SubjectPriority;
  notes?: string;
  color: string;
}

export interface DailyGoal {
  id: string;
  title: string;
  target: string;
  completed: boolean;
  category: 'study' | 'wellness' | 'focus' | 'sleep';
}

export interface UserSettings {
  user_name: string;
  email: string;
  whatsapp_number: string;
  daily_study_goal_hours: number;
  daily_screen_time_limit_hours: number;
  whatsapp_automated_reports: boolean;
  whatsapp_time: string;
  theme: 'dark' | 'light';
  enable_sound_alerts: boolean;
  supabase_connected: boolean;
  supabase_url: string;
  supabase_anon_key: string;
  activitywatch_url?: string;
  activitywatch_afk_filter?: boolean;
}

export interface WellnessMetricSummary {
  total_minutes: number;
  total_formatted: string;
  raw_window_minutes: number;
  raw_window_formatted: string;
  afk_minutes: number;
  afk_formatted: string;
  total_events_count: number;
  category_breakdown: Record<string, number>;
  warnings: UsageWarning[];
  warning_count: number;
  wellness_score: number;
  social_ent_minutes: number;
  productivity_minutes: number;
  focus_ratio: number;
}

export interface AICoachRecommendation {
  id: string;
  type: 'warning' | 'success' | 'study' | 'wellness';
  title: string;
  description: string;
  tag: string;
  action_label?: string;
}

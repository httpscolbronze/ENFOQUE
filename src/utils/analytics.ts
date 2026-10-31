import {
  AppCategory,
  AppUsage,
  AppLimit,
  UsageWarning,
  Subject,
  ScheduleBlock,
  WellnessMetricSummary,
  ActivityWatchEvent
} from '../types/index.ts';

export function calculateTotalScreenTime(apps: AppUsage[]): number {
  return apps.reduce((sum, item) => sum + (Number.isFinite(item.minutes) ? Math.max(0, item.minutes) : 0), 0);
}

export function formatMinutes(minutes: number): string {
  const safeMin = Math.max(0, Math.round(minutes));
  const h = Math.floor(safeMin / 60);
  const m = safeMin % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function inferCategory(appName: string): AppCategory {
  const lower = appName.toLowerCase();
  const social = ['instagram', 'tiktok', 'twitter', 'x', 'facebook', 'snapchat', 'reddit', 'threads'];
  const entertainment = ['youtube', 'netflix', 'spotify', 'twitch', 'prime', 'hulu', 'disney', 'gaming', 'steam', 'vlc'];
  const productivity = ['vs code', 'vscode', 'code', 'notion', 'figma', 'github', 'slack', 'zoom', 'cursor', 'excel', 'word', 'terminal', 'pycharm'];
  const education = ['duolingo', 'coursera', 'udemy', 'khan', 'anki', 'quizlet', 'canvas', 'obsidian', 'arxiv'];
  const communication = ['whatsapp', 'telegram', 'messages', 'discord', 'signal', 'gmail', 'thunderbird'];
  const information = ['chrome', 'safari', 'firefox', 'edge', 'arc', 'brave', 'wikipedia'];

  if (social.some(s => lower.includes(s))) return 'Social Media';
  if (entertainment.some(e => lower.includes(e))) return 'Entertainment';
  if (productivity.some(p => lower.includes(p))) return 'Productivity';
  if (education.some(ed => lower.includes(ed))) return 'Education';
  if (communication.some(c => lower.includes(c))) return 'Communication';
  if (information.some(i => lower.includes(i))) return 'Information';
  return 'Other';
}

export function getAppColor(appName: string, category: AppCategory): string {
  const lower = appName.toLowerCase();
  if (lower.includes('instagram')) return '#E1306C';
  if (lower.includes('youtube')) return '#FF0000';
  if (lower.includes('vs code') || lower.includes('vscode') || lower === 'code') return '#007ACC';
  if (lower.includes('notion')) return '#202020';
  if (lower.includes('tiktok')) return '#FE2C55';
  if (lower.includes('chrome')) return '#4285F4';
  if (lower.includes('whatsapp')) return '#25D366';
  if (lower.includes('duolingo') || lower.includes('anki')) return '#10B981';
  if (lower.includes('reddit')) return '#FF4500';
  if (lower.includes('spotify')) return '#1DB954';
  if (lower.includes('obsidian')) return '#8B5CF6';

  switch (category) {
    case 'Social Media': return '#EC4899';
    case 'Entertainment': return '#F59E0B';
    case 'Productivity': return '#3B82F6';
    case 'Education': return '#10B981';
    case 'Communication': return '#14B8A6';
    case 'Information': return '#8B5CF6';
    default: return '#64748B';
  }
}

export function checkAppLimits(apps: AppUsage[], limits: AppLimit[]): UsageWarning[] {
  const activeLimits = new Map<string, number>();
  for (const lim of limits) {
    if (lim.enabled && lim.limit_minutes > 0) {
      activeLimits.set(lim.app.toLowerCase().trim(), lim.limit_minutes);
    }
  }

  const warnings: UsageWarning[] = [];
  for (const app of apps) {
    const key = app.app.toLowerCase().trim();
    if (activeLimits.has(key)) {
      const limitMin = activeLimits.get(key)!;
      if (app.minutes > limitMin) {
        const exceededBy = app.minutes - limitMin;
        const severity: 'warning' | 'critical' = (exceededBy / limitMin) >= 0.25 ? 'critical' : 'warning';
        warnings.push({
          app: app.app,
          usage_minutes: app.minutes,
          limit_minutes: limitMin,
          exceeded_by: exceededBy,
          percentage: Math.round((app.minutes / limitMin) * 100),
          severity,
          message: `${app.app} exceeded limit by ${exceededBy}m (${app.minutes}m / ${limitMin}m limit)`
        });
      }
    }
  }

  return warnings.sort((a, b) => b.exceeded_by - a.exceeded_by);
}

/**
 * Aggregates raw ActivityWatch window events (aw-watcher-window / aw-watcher-web)
 * and optional AFK events (aw-watcher-afk) into ENFOQUE AI AppUsage items.
 */
export function aggregateActivityWatchEvents(
  windowEvents: ActivityWatchEvent[],
  afkEvents: ActivityWatchEvent[] = []
): { apps: AppUsage[]; afkMinutes: number; totalEvents: number } {
  const appDurationsSec = new Map<string, number>();
  const appTitles = new Map<string, Set<string>>();
  const appCounts = new Map<string, number>();

  for (const ev of windowEvents) {
    const duration = Number(ev.duration) || 0;
    if (duration <= 0) continue;
    const rawApp = (ev.data?.app || 'Unknown App').trim();
    const title = (ev.data?.title || '').trim();

    appDurationsSec.set(rawApp, (appDurationsSec.get(rawApp) || 0) + duration);
    appCounts.set(rawApp, (appCounts.get(rawApp) || 0) + 1);

    if (title) {
      if (!appTitles.has(rawApp)) {
        appTitles.set(rawApp, new Set());
      }
      const set = appTitles.get(rawApp)!;
      if (set.size < 4) {
        set.add(title);
      }
    }
  }

  let afkSeconds = 0;
  for (const afkEv of afkEvents) {
    if (afkEv.data?.status === 'afk') {
      afkSeconds += Number(afkEv.duration) || 0;
    }
  }

  const apps: AppUsage[] = Array.from(appDurationsSec.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([appName, seconds], idx) => {
      const minutes = Math.max(1, Math.round(seconds / 60));
      const category = inferCategory(appName);
      return {
        id: `aw_ev_${idx + 1}`,
        app: appName,
        category,
        minutes,
        active_seconds: Math.round(seconds),
        color: getAppColor(appName, category),
        source: 'aw-watcher-window',
        window_titles: Array.from(appTitles.get(appName) || []),
        event_count: appCounts.get(appName) || 1
      };
    });

  return {
    apps,
    afkMinutes: Math.round(afkSeconds / 60),
    totalEvents: windowEvents.length + afkEvents.length
  };
}

/**
 * Parses an ActivityWatch JSON export (either { buckets: { ... } } or { events: [ ... ] } or raw array)
 */
export function parseActivityWatchExportJson(jsonText: string): {
  success: boolean;
  data: AppUsage[];
  afkMinutes: number;
  error?: string;
} {
  if (!jsonText || !jsonText.trim()) {
    return { success: false, data: [], afkMinutes: 0, error: 'ActivityWatch JSON is empty' };
  }

  try {
    const parsed = JSON.parse(jsonText);
    let windowEvents: ActivityWatchEvent[] = [];
    let afkEvents: ActivityWatchEvent[] = [];

    if (Array.isArray(parsed)) {
      windowEvents = parsed;
    } else if (parsed.buckets && typeof parsed.buckets === 'object') {
      for (const [bucketId, bucketObj] of Object.entries<any>(parsed.buckets)) {
        const evs = Array.isArray(bucketObj?.events) ? bucketObj.events : [];
        if (bucketId.includes('afk') || bucketObj?.type === 'afkstatus') {
          afkEvents.push(...evs);
        } else {
          windowEvents.push(...evs);
        }
      }
    } else if (Array.isArray(parsed.events)) {
      windowEvents = parsed.events;
    }

    if (windowEvents.length === 0) {
      return {
        success: false,
        data: [],
        afkMinutes: 0,
        error: 'No valid ActivityWatch window events found in JSON'
      };
    }

    const { apps, afkMinutes } = aggregateActivityWatchEvents(windowEvents, afkEvents);
    if (apps.length === 0) {
      return {
        success: false,
        data: [],
        afkMinutes: 0,
        error: 'ActivityWatch events had zero duration'
      };
    }

    return { success: true, data: apps, afkMinutes };
  } catch (err: any) {
    return {
      success: false,
      data: [],
      afkMinutes: 0,
      error: `Invalid ActivityWatch JSON: ${err?.message || 'Parse error'}`
    };
  }
}

export function parseScreenTimeCsv(csvText: string): { success: boolean; data: AppUsage[]; error?: string; rawCount?: number } {
  if (!csvText || !csvText.trim()) {
    return { success: false, data: [], error: 'CSV content is empty' };
  }

  const lines = csvText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if (lines.length === 0) {
    return { success: false, data: [], error: 'No valid lines in CSV' };
  }

  const results: AppUsage[] = [];
  let startIndex = 0;

  const firstLine = lines[0].toLowerCase().split(',');
  if (firstLine[0]?.trim() === 'app' && firstLine[1]?.trim() === 'minutes') {
    startIndex = 1;
  }

  for (let i = startIndex; i < lines.length; i++) {
    const parts = lines[i].split(',').map(s => s.trim().replace(/^["']|["']$/g, ''));
    if (parts.length < 2) continue;
    const appName = parts[0];
    const minutesVal = parseFloat(parts[1]);
    const windowTitle = parts[2] || `${appName} — Active Session`;

    if (!appName || isNaN(minutesVal) || minutesVal < 0) continue;

    const category = inferCategory(appName);
    results.push({
      id: `csv_${results.length + 1}`,
      app: appName,
      category,
      minutes: Math.round(minutesVal),
      icon: 'activity',
      color: getAppColor(appName, category),
      source: 'csv-import',
      window_titles: [windowTitle],
      event_count: Math.max(5, Math.round(minutesVal * 1.8))
    });
  }

  if (results.length === 0) {
    return { success: false, data: [], error: 'No valid rows with app,minutes format found' };
  }

  return { success: true, data: results, rawCount: results.length };
}

export function calculateWellnessScore(
  totalMinutes: number,
  socialMinutes: number,
  studyMinutes: number,
  warningCount: number
): number {
  if (totalMinutes === 0) return 95;
  const base = 85;
  const socialPenalty = Math.min(45, Math.floor(socialMinutes / 20) * 4);
  const studyBonus = Math.min(25, Math.floor(studyMinutes / 30) * 5);
  const warningPenalty = warningCount * 7;
  const score = base - socialPenalty + studyBonus - warningPenalty;
  return Math.max(10, Math.min(100, Math.round(score)));
}

export function computeMetricsSummary(
  apps: AppUsage[],
  limits: AppLimit[],
  afkMinutes: number = 42
): WellnessMetricSummary {
  const total = calculateTotalScreenTime(apps);
  const warnings = checkAppLimits(apps, limits);
  const safeAfk = Math.max(0, Math.round(afkMinutes));
  const rawWindowMinutes = total + safeAfk;

  const categories: Record<string, number> = {};
  let socialEnt = 0;
  let productivity = 0;
  let totalEvents = 0;

  for (const app of apps) {
    categories[app.category] = (categories[app.category] || 0) + app.minutes;
    totalEvents += app.event_count || Math.max(8, app.minutes * 2);
    if (app.category === 'Social Media' || app.category === 'Entertainment') {
      socialEnt += app.minutes;
    }
    if (app.category === 'Productivity' || app.category === 'Education') {
      productivity += app.minutes;
    }
  }

  const wellnessScore = calculateWellnessScore(total, socialEnt, productivity, warnings.length);
  const focusRatio = total > 0 ? Math.round((productivity / total) * 100) : 0;

  return {
    total_minutes: total,
    total_formatted: formatMinutes(total),
    raw_window_minutes: rawWindowMinutes,
    raw_window_formatted: formatMinutes(rawWindowMinutes),
    afk_minutes: safeAfk,
    afk_formatted: formatMinutes(safeAfk),
    total_events_count: totalEvents,
    category_breakdown: categories,
    warnings,
    warning_count: warnings.length,
    wellness_score: wellnessScore,
    social_ent_minutes: socialEnt,
    productivity_minutes: productivity,
    focus_ratio: focusRatio
  };
}

export function generateStudyTimetable(subjects: Subject[], availableHours: number): ScheduleBlock[] {
  if (!subjects || subjects.length === 0) return [];
  const hours = Math.max(1, availableHours);

  const weights: Record<string, number> = {
    Urgent: 4.5,
    High: 3.0,
    Medium: 2.0,
    Low: 1.0
  };

  const scored = subjects.map(s => {
    const remaining = Math.max(0.5, s.target_hours - s.completed_hours);
    const weight = weights[s.priority] || 2.0;
    return {
      ...s,
      remaining,
      score: remaining * weight
    };
  });

  const totalScore = scored.reduce((sum, s) => sum + s.score, 0) || 1;
  const schedule: ScheduleBlock[] = [];
  let currentHour = 9;

  for (const item of scored) {
    const rawAllocated = (item.score / totalScore) * hours;
    const allocated = Math.max(0.5, Math.round(rawAllocated * 2) / 2);
    const wholeHours = Math.floor(allocated);
    const halfMinutes = (allocated % 1) * 60;

    const endHour = currentHour + wholeHours;
    const endMinutes = halfMinutes;

    const startStr = `${String(currentHour).padStart(2, '0')}:00`;
    const endStr = `${String(endHour).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;

    schedule.push({
      subject_id: item.id,
      subject_name: item.name,
      allocated_hours: allocated,
      allocated_formatted: formatMinutes(allocated * 60),
      time_slot: `${startStr} - ${endStr}`,
      priority: item.priority,
      notes: item.notes || `Focus on key exercises and concept review`,
      color: item.color
    });

    currentHour = endHour + (endMinutes >= 30 ? 1 : 0);
  }

  return schedule;
}

export function formatWhatsAppMessage(params: {
  userName: string;
  metrics: WellnessMetricSummary;
  completedGoals: number;
  totalGoals: number;
  studySchedule: ScheduleBlock[];
}): string {
  const { userName, metrics, completedGoals, totalGoals, studySchedule } = params;
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric'
  });

  let limitAlerts = '';
  if (metrics.warnings.length > 0) {
    limitAlerts =
      '\n⚠️ *ActivityWatch Limit Alerts:*\n' +
      metrics.warnings
        .map(w => ` • ${w.app}: *${w.usage_minutes}m* (Limit: ${w.limit_minutes}m) [Exceeded by ${w.exceeded_by}m]`)
        .join('\n') +
      '\n';
  } else {
    limitAlerts = '\n✅ *All apps stayed within target limits!*\n';
  }

  let studyBlocks = '';
  if (studySchedule.length > 0) {
    studyBlocks =
      "\n📚 *Tomorrow's Study Plan:*\n" +
      studySchedule
        .slice(0, 3)
        .map(s => ` • ${s.time_slot}: *${s.subject_name}* (${s.allocated_formatted})`)
        .join('\n') +
      '\n';
  }

  return `📱 *ENFOQUE AI - ActivityWatch Daily Wellness Brief*
👤 *Student:* ${userName}
📅 *Date:* ${today}

⏱️ *ActivityWatch Screen Time Overview:*
 • Active Screen Time (not-afk): *${metrics.total_formatted}*
 • AFK / Idle Filtered Out: *${metrics.afk_formatted}*
 • Raw Window Time: *${metrics.raw_window_formatted}*
 • Focus Ratio: *${metrics.focus_ratio}%* (Productive vs Total)
 • Wellness Score: *${metrics.wellness_score}/100*
${limitAlerts}
🎯 *Daily Goals Completed:* *${completedGoals}/${totalGoals}*
${studyBlocks}
💡 *AI Coach Tip:*
"ActivityWatch logged ${metrics.productivity_minutes}m of deep study today. Keep your morning window free of social tabs!"

_Monitored via ActivityWatch & ENFOQUE AI_`;
}

export function buildWhatsAppClickUrl(phone: string, message: string): string {
  const cleanPhone = phone.replace(/[^\d+]/g, '').replace(/^\+/, '');
  const encodedText = encodeURIComponent(message);
  if (!cleanPhone) {
    return `https://wa.me/?text=${encodedText}`;
  }
  return `https://wa.me/${cleanPhone}?text=${encodedText}`;
}

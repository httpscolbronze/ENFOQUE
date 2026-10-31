import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateTotalScreenTime,
  formatMinutes,
  inferCategory,
  checkAppLimits,
  parseScreenTimeCsv,
  calculateWellnessScore,
  generateStudyTimetable,
  buildWhatsAppClickUrl,
  aggregateActivityWatchEvents,
  parseActivityWatchExportJson,
  computeMetricsSummary
} from './analytics.ts';
import { AppUsage, AppLimit, Subject, ActivityWatchEvent } from '../types/index.ts';

test('calculateTotalScreenTime sums valid positive minutes correctly', () => {
  const apps: AppUsage[] = [
    { id: '1', app: 'Instagram', category: 'Social Media', minutes: 120 },
    { id: '2', app: 'VS Code', category: 'Productivity', minutes: 180 },
    { id: '3', app: 'YouTube', category: 'Entertainment', minutes: 60 }
  ];
  assert.equal(calculateTotalScreenTime(apps), 360);
});

test('formatMinutes formats minutes to human readable hours and minutes', () => {
  assert.equal(formatMinutes(45), '45m');
  assert.equal(formatMinutes(60), '1h');
  assert.equal(formatMinutes(135), '2h 15m');
  assert.equal(formatMinutes(0), '0m');
});

test('inferCategory categorizes common app names accurately', () => {
  assert.equal(inferCategory('Instagram'), 'Social Media');
  assert.equal(inferCategory('VS Code'), 'Productivity');
  assert.equal(inferCategory('YouTube'), 'Entertainment');
  assert.equal(inferCategory('Anki'), 'Education');
  assert.equal(inferCategory('WhatsApp'), 'Communication');
  assert.equal(inferCategory('Google Chrome'), 'Information');
});

test('aggregateActivityWatchEvents aggregates seconds into minutes and extracts window titles', () => {
  const windowEvents: ActivityWatchEvent[] = [
    {
      timestamp: '2026-10-31T09:00:00Z',
      duration: 3600, // 60 mins
      data: { app: 'VS Code', title: 'server.py - ENFOQUE AI' }
    },
    {
      timestamp: '2026-10-31T10:00:00Z',
      duration: 1800, // 30 mins
      data: { app: 'VS Code', title: 'DashboardView.tsx - ENFOQUE AI' }
    },
    {
      timestamp: '2026-10-31T10:30:00Z',
      duration: 1200, // 20 mins
      data: { app: 'Instagram', title: 'Instagram • Reels' }
    }
  ];
  const afkEvents: ActivityWatchEvent[] = [
    {
      timestamp: '2026-10-31T11:00:00Z',
      duration: 900, // 15 mins AFK
      data: { status: 'afk' }
    }
  ];

  const res = aggregateActivityWatchEvents(windowEvents, afkEvents);
  assert.equal(res.apps.length, 2);
  assert.equal(res.apps[0].app, 'VS Code');
  assert.equal(res.apps[0].minutes, 90);
  assert.equal(res.apps[0].window_titles?.length, 2);
  assert.equal(res.apps[1].app, 'Instagram');
  assert.equal(res.apps[1].minutes, 20);
  assert.equal(res.afkMinutes, 15);
});

test('parseActivityWatchExportJson parses standard ActivityWatch bucket export format', () => {
  const sampleExport = JSON.stringify({
    buckets: {
      'aw-watcher-window_laptop': {
        id: 'aw-watcher-window_laptop',
        type: 'currentwindow',
        events: [
          { timestamp: '2026-10-31T08:00:00Z', duration: 5400, data: { app: 'VS Code', title: 'main.py' } },
          { timestamp: '2026-10-31T09:30:00Z', duration: 2400, data: { app: 'YouTube', title: 'ML Lecture' } }
        ]
      },
      'aw-watcher-afk_laptop': {
        id: 'aw-watcher-afk_laptop',
        type: 'afkstatus',
        events: [
          { timestamp: '2026-10-31T10:10:00Z', duration: 1200, data: { status: 'afk' } }
        ]
      }
    }
  });

  const parsed = parseActivityWatchExportJson(sampleExport);
  assert.equal(parsed.success, true);
  assert.equal(parsed.data.length, 2);
  assert.equal(parsed.data[0].app, 'VS Code');
  assert.equal(parsed.data[0].minutes, 90);
  assert.equal(parsed.afkMinutes, 20);
});

test('computeMetricsSummary calculates active screen time, AFK time, and raw window time', () => {
  const apps: AppUsage[] = [
    { id: '1', app: 'VS Code', category: 'Productivity', minutes: 120, event_count: 200 },
    { id: '2', app: 'Instagram', category: 'Social Media', minutes: 40, event_count: 80 }
  ];
  const limits: AppLimit[] = [{ app: 'Instagram', limit_minutes: 30, enabled: true }];

  const summary = computeMetricsSummary(apps, limits, 35);
  assert.equal(summary.total_minutes, 160);
  assert.equal(summary.total_formatted, '2h 40m');
  assert.equal(summary.afk_minutes, 35);
  assert.equal(summary.raw_window_minutes, 195);
  assert.equal(summary.warning_count, 1);
});

test('checkAppLimits accurately identifies exceeded app limits and severity', () => {
  const apps: AppUsage[] = [
    { id: '1', app: 'Instagram', category: 'Social Media', minutes: 90 },
    { id: '2', app: 'YouTube', category: 'Entertainment', minutes: 50 },
    { id: '3', app: 'TikTok', category: 'Social Media', minutes: 45 }
  ];
  const limits: AppLimit[] = [
    { app: 'Instagram', limit_minutes: 60, enabled: true },
    { app: 'YouTube', limit_minutes: 60, enabled: true },
    { app: 'TikTok', limit_minutes: 40, enabled: true }
  ];

  const warnings = checkAppLimits(apps, limits);
  assert.equal(warnings.length, 2);
  assert.equal(warnings[0].app, 'Instagram');
  assert.equal(warnings[0].exceeded_by, 30);
  assert.equal(warnings[0].severity, 'critical');
});

test('parseScreenTimeCsv parses standard app,minutes format properly', () => {
  const csvContent = `app,minutes
Instagram,120
VS Code,200`;

  const result = parseScreenTimeCsv(csvContent);
  assert.equal(result.success, true);
  assert.equal(result.data.length, 2);
  assert.equal(result.data[0].app, 'Instagram');
  assert.equal(result.data[0].minutes, 120);
});

test('generateStudyTimetable produces valid time blocks proportional to urgency', () => {
  const subjects: Subject[] = [
    {
      id: 'sub_1',
      name: 'Discrete Math',
      target_hours: 8,
      completed_hours: 2,
      priority: 'Urgent',
      deadline: '2026-11-03',
      color: '#F43F5E'
    },
    {
      id: 'sub_2',
      name: 'Networking',
      target_hours: 6,
      completed_hours: 4,
      priority: 'Low',
      deadline: '2026-11-15',
      color: '#10B981'
    }
  ];

  const schedule = generateStudyTimetable(subjects, 4.0);
  assert.equal(schedule.length, 2);
  assert.ok(schedule[0].allocated_hours >= schedule[1].allocated_hours);
});

test('buildWhatsAppClickUrl creates a valid wa.me URL with encoded text', () => {
  const url = buildWhatsAppClickUrl('+1 555-234-5678', 'Hello World & Test');
  assert.ok(url.startsWith('https://wa.me/15552345678?text='));
  assert.ok(url.includes('Hello%20World%20%26%20Test'));
});

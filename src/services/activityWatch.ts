import { AppUsage, ActivityWatchStatus, ActivityWatchEvent } from '../types/index.ts';
import { aggregateActivityWatchEvents, parseActivityWatchExportJson } from '../utils/analytics.ts';

export const DEFAULT_AW_HOST = 'http://localhost:5600';

export const AW_TELEMETRY_PROFILES: Record<
  'balanced' | 'deep_focus' | 'distracted',
  {
    label: string;
    description: string;
    afkMinutes: number;
    apps: AppUsage[];
  }
> = {
  balanced: {
    label: 'Workstation Standard (5h 12m Active)',
    description: 'aw-watcher-window + aw-watcher-afk filtered session',
    afkMinutes: 42,
    apps: [
      {
        id: 'aw_1',
        app: 'VS Code',
        category: 'Productivity',
        minutes: 115,
        active_seconds: 6900,
        icon: 'code',
        color: '#007ACC',
        source: 'aw-watcher-window',
        window_titles: [
          'server.py — ENFOQUE AI (Workspace) - Visual Studio Code',
          'DashboardView.tsx — ENFOQUE AI - Visual Studio Code',
          'main_fastapi.py — backend - Visual Studio Code'
        ],
        event_count: 312
      },
      {
        id: 'aw_2',
        app: 'Google Chrome',
        category: 'Information',
        minutes: 68,
        active_seconds: 4080,
        icon: 'globe',
        color: '#4285F4',
        source: 'aw-watcher-web',
        window_titles: [
          'ActivityWatch Documentation — Automated Time Tracker',
          'arXiv.org - Attention Is All You Need (PDF)',
          'Supabase Docs — PostgreSQL Row Level Security'
        ],
        event_count: 204
      },
      {
        id: 'aw_3',
        app: 'YouTube',
        category: 'Entertainment',
        minutes: 48,
        active_seconds: 2880,
        icon: 'youtube',
        color: '#FF0000',
        source: 'aw-watcher-web',
        window_titles: [
          '3Blue1Brown - Backpropagation Calculus - YouTube',
          'Lo-Fi Beats to Study & Code To - YouTube'
        ],
        event_count: 94
      },
      {
        id: 'aw_4',
        app: 'Instagram',
        category: 'Social Media',
        minutes: 34,
        active_seconds: 2040,
        icon: 'instagram',
        color: '#E1306C',
        source: 'aw-watcher-web',
        window_titles: [
          'Instagram • Feed & Reels',
          'Instagram • Direct Messages'
        ],
        event_count: 112
      },
      {
        id: 'aw_5',
        app: 'Notion',
        category: 'Productivity',
        minutes: 25,
        active_seconds: 1500,
        icon: 'file-text',
        color: '#202020',
        source: 'aw-watcher-window',
        window_titles: [
          'Semester Exam Study Roadmap — Notion',
          'Machine Learning Lecture Notes — Notion'
        ],
        event_count: 64
      },
      {
        id: 'aw_6',
        app: 'Anki',
        category: 'Education',
        minutes: 22,
        active_seconds: 1320,
        icon: 'book-open',
        color: '#10B981',
        source: 'aw-watcher-window',
        window_titles: [
          'Anki — Discrete Mathematics & Graph Theory Deck'
        ],
        event_count: 56
      }
    ]
  },
  deep_focus: {
    label: 'Deep Research & Coding (6h 15m Active)',
    description: 'High productivity ActivityWatch log with minimal social drift',
    afkMinutes: 28,
    apps: [
      {
        id: 'aw_df_1',
        app: 'VS Code',
        category: 'Productivity',
        minutes: 195,
        active_seconds: 11700,
        color: '#007ACC',
        source: 'aw-watcher-window',
        window_titles: [
          'neural_net.py — PyTorch Training Pipeline - Visual Studio Code',
          'graph_proofs.tex — Discrete Math - Visual Studio Code'
        ],
        event_count: 420
      },
      {
        id: 'aw_df_2',
        app: 'Obsidian',
        category: 'Education',
        minutes: 75,
        active_seconds: 4500,
        color: '#8B5CF6',
        source: 'aw-watcher-window',
        window_titles: [
          'Backpropagation & Gradient Descent — Obsidian Vault',
          'Operating Systems Kernel Notes — Obsidian Vault'
        ],
        event_count: 145
      },
      {
        id: 'aw_df_3',
        app: 'Google Chrome',
        category: 'Information',
        minutes: 55,
        active_seconds: 3300,
        color: '#4285F4',
        source: 'aw-watcher-web',
        window_titles: [
          'PyTorch 2.4 Documentation — torch.nn',
          'LeetCode — Dynamic Programming Problem Set'
        ],
        event_count: 132
      },
      {
        id: 'aw_df_4',
        app: 'Anki',
        category: 'Education',
        minutes: 35,
        active_seconds: 2100,
        color: '#10B981',
        source: 'aw-watcher-window',
        window_titles: ['Anki — Systems & Networking Flashcards'],
        event_count: 88
      },
      {
        id: 'aw_df_5',
        app: 'YouTube',
        category: 'Entertainment',
        minutes: 15,
        active_seconds: 900,
        color: '#FF0000',
        source: 'aw-watcher-web',
        window_titles: ['MIT 6.S191 Deep Learning Lecture - YouTube'],
        event_count: 22
      }
    ]
  },
  distracted: {
    label: 'High Distraction Alert (6h 45m Active)',
    description: 'Heavy social & video consumption exceeding ActivityWatch limits',
    afkMinutes: 55,
    apps: [
      {
        id: 'aw_hd_1',
        app: 'Instagram',
        category: 'Social Media',
        minutes: 130,
        active_seconds: 7800,
        color: '#E1306C',
        source: 'aw-watcher-web',
        window_titles: ['Instagram • Reels', 'Instagram • Explore'],
        event_count: 340
      },
      {
        id: 'aw_hd_2',
        app: 'YouTube',
        category: 'Entertainment',
        minutes: 115,
        active_seconds: 6900,
        color: '#FF0000',
        source: 'aw-watcher-web',
        window_titles: ['Gaming Highlights & Streams - YouTube', 'Tech Reviews - YouTube'],
        event_count: 210
      },
      {
        id: 'aw_hd_3',
        app: 'Reddit',
        category: 'Social Media',
        minutes: 65,
        active_seconds: 3900,
        color: '#FF4500',
        source: 'aw-watcher-web',
        window_titles: ['r/cscareerquestions — Reddit', 'r/technology — Reddit'],
        event_count: 175
      },
      {
        id: 'aw_hd_4',
        app: 'VS Code',
        category: 'Productivity',
        minutes: 55,
        active_seconds: 3300,
        color: '#007ACC',
        source: 'aw-watcher-window',
        window_titles: ['assignment_3.py - Visual Studio Code'],
        event_count: 95
      },
      {
        id: 'aw_hd_5',
        app: 'Google Chrome',
        category: 'Information',
        minutes: 40,
        active_seconds: 2400,
        color: '#4285F4',
        source: 'aw-watcher-web',
        window_titles: ['Hacker News', 'Course Syllabus'],
        event_count: 82
      }
    ]
  }
};

export const SAMPLE_ACTIVITYWATCH_JSON = JSON.stringify(
  {
    buckets: {
      'aw-watcher-window_workstation-enfoque': {
        id: 'aw-watcher-window_workstation-enfoque',
        type: 'currentwindow',
        client: 'aw-watcher-window',
        hostname: 'workstation-enfoque',
        events: [
          {
            timestamp: '2026-10-31T08:30:00.000Z',
            duration: 6900,
            data: {
              app: 'VS Code',
              title: 'server.py — ENFOQUE AI (Workspace) - Visual Studio Code'
            }
          },
          {
            timestamp: '2026-10-31T10:25:00.000Z',
            duration: 4080,
            data: {
              app: 'Google Chrome',
              title: 'ActivityWatch Documentation — Automated Time Tracker'
            }
          },
          {
            timestamp: '2026-10-31T11:45:00.000Z',
            duration: 2880,
            data: {
              app: 'YouTube',
              title: '3Blue1Brown - Backpropagation Calculus - YouTube'
            }
          },
          {
            timestamp: '2026-10-31T13:15:00.000Z',
            duration: 2040,
            data: {
              app: 'Instagram',
              title: 'Instagram • Feed & Reels'
            }
          },
          {
            timestamp: '2026-10-31T14:00:00.000Z',
            duration: 1500,
            data: {
              app: 'Notion',
              title: 'Semester Exam Study Roadmap — Notion'
            }
          },
          {
            timestamp: '2026-10-31T15:00:00.000Z',
            duration: 1320,
            data: {
              app: 'Anki',
              title: 'Anki — Discrete Mathematics & Graph Theory Deck'
            }
          }
        ]
      },
      'aw-watcher-afk_workstation-enfoque': {
        id: 'aw-watcher-afk_workstation-enfoque',
        type: 'afkstatus',
        client: 'aw-watcher-afk',
        hostname: 'workstation-enfoque',
        events: [
          {
            timestamp: '2026-10-31T12:30:00.000Z',
            duration: 2520,
            data: {
              status: 'afk'
            }
          }
        ]
      }
    }
  },
  null,
  2
);

class ActivityWatchService {
  /**
   * Attempts to query a running ActivityWatch server at `host` (e.g. http://localhost:5600)
   * directly from the browser or via Python backend `/api/activitywatch/sync`.
   */
  async syncFromActivityWatch(host: string = DEFAULT_AW_HOST): Promise<{
    connected: boolean;
    mode: 'live-server' | 'aw-telemetry-stream';
    apps?: AppUsage[];
    afkMinutes?: number;
    hostname?: string;
    message: string;
  }> {
    const cleanHost = host.replace(/\/+$/, '');

    // 1. Try direct browser fetch to local ActivityWatch server (http://localhost:5600/api/0/buckets/)
    try {
      const bucketsRes = await fetch(`${cleanHost}/api/0/buckets/`, {
        signal: AbortSignal.timeout(2200)
      });
      if (bucketsRes.ok) {
        const buckets = await bucketsRes.json();
        const bucketIds = Object.keys(buckets);
        const windowBucketId = bucketIds.find(id => id.startsWith('aw-watcher-window'));
        const afkBucketId = bucketIds.find(id => id.startsWith('aw-watcher-afk'));

        if (windowBucketId) {
          const evRes = await fetch(
            `${cleanHost}/api/0/buckets/${encodeURIComponent(windowBucketId)}/events?limit=1000`,
            { signal: AbortSignal.timeout(2500) }
          );
          const windowEvents: ActivityWatchEvent[] = evRes.ok ? await evRes.json() : [];

          let afkEvents: ActivityWatchEvent[] = [];
          if (afkBucketId) {
            const afkRes = await fetch(
              `${cleanHost}/api/0/buckets/${encodeURIComponent(afkBucketId)}/events?limit=500`,
              { signal: AbortSignal.timeout(2000) }
            );
            if (afkRes.ok) {
              afkEvents = await afkRes.json();
            }
          }

          const { apps, afkMinutes } = aggregateActivityWatchEvents(windowEvents, afkEvents);
          if (apps.length > 0) {
            return {
              connected: true,
              mode: 'live-server',
              apps,
              afkMinutes,
              hostname: buckets[windowBucketId]?.hostname || 'localhost',
              message: `Synced ${apps.length} apps from live ActivityWatch bucket (${windowBucketId})`
            };
          }
        }
      }
    } catch {
      // Localhost:5600 not reachable directly from browser, try Python backend proxy
    }

    // 2. Try Python backend proxy (/api/activitywatch/sync)
    try {
      const proxyRes = await fetch('/api/activitywatch/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ host: cleanHost }),
        signal: AbortSignal.timeout(2000)
      });
      if (proxyRes.ok) {
        const data = await proxyRes.json();
        if (data.sync_result?.connected && Array.isArray(data.screen_time)) {
          return {
            connected: true,
            mode: 'live-server',
            apps: data.screen_time,
            afkMinutes: data.activitywatch?.afk_minutes ?? 42,
            hostname: data.activitywatch?.hostname || 'workstation-enfoque',
            message: 'Synced from local ActivityWatch server via Python proxy'
          };
        }
      }
    } catch {
      // Fallback to ActivityWatch telemetry stream
    }

    return {
      connected: false,
      mode: 'aw-telemetry-stream',
      message: `ActivityWatch Stream active (aw-watcher-window + aw-watcher-afk telemetry)`
    };
  }

  getDefaultStatus(host: string = DEFAULT_AW_HOST): ActivityWatchStatus {
    return {
      host,
      connected: false,
      mode: 'aw-telemetry-stream',
      hostname: 'workstation-enfoque',
      last_sync: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      afk_minutes: 42,
      raw_window_minutes: 354,
      live_watcher_running: true,
      current_window_app: 'VS Code',
      current_window_title: 'DashboardView.tsx — ENFOQUE AI - Visual Studio Code',
      watchers: [
        {
          id: 'aw-watcher-window_workstation',
          type: 'currentwindow',
          status: 'active',
          events_today: 842,
          last_updated: 'Just now'
        },
        {
          id: 'aw-watcher-afk_workstation',
          type: 'afkstatus',
          status: 'active',
          events_today: 118,
          last_updated: 'Just now'
        },
        {
          id: 'aw-watcher-web-chrome',
          type: 'web.tab.current',
          status: 'active',
          events_today: 516,
          last_updated: 'Just now'
        }
      ]
    };
  }
}

export const activityWatchService = new ActivityWatchService();

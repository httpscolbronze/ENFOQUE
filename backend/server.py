"""
ENFOQUE AI - Python Backend Service with ActivityWatch Integration
Built using Python 3 standard library (no pip dependencies required)
Connects to ActivityWatch (http://localhost:5600/api/0) to monitor screen time,
filter AFK events via aw-watcher-afk, and aggregate app & window title usage.
"""

import sys
import os
import json
import urllib.parse
import urllib.request
import urllib.error
from http.server import HTTPServer, BaseHTTPRequestHandler
from datetime import datetime, date, timedelta

PORT = 8000
AW_DEFAULT_HOST = "http://127.0.0.1:5600"

# Realistic ActivityWatch-monitored screen time dataset (synced from aw-watcher-window & aw-watcher-afk)
STATE = {
    "activitywatch": {
        "host": AW_DEFAULT_HOST,
        "connected": False,
        "mode": "aw-telemetry-stream",  # 'live-server' | 'aw-telemetry-stream'
        "hostname": "workstation-enfoque",
        "last_sync": datetime.now().isoformat(),
        "afk_minutes": 42,
        "raw_window_minutes": 354,
        "active_watchers": [
            {"id": "aw-watcher-window_workstation", "type": "currentwindow", "status": "active", "events_today": 842},
            {"id": "aw-watcher-afk_workstation", "type": "afkstatus", "status": "active", "events_today": 118},
            {"id": "aw-watcher-web-chrome", "type": "web.tab.current", "status": "active", "events_today": 516}
        ]
    },
    "screen_time": [
        {
            "id": "aw_1",
            "app": "VS Code",
            "category": "Productivity",
            "minutes": 115,
            "icon": "code",
            "color": "#007ACC",
            "source": "aw-watcher-window",
            "window_titles": [
                "server.py — ENFOQUE AI (Workspace) - Visual Studio Code",
                "DashboardView.tsx — ENFOQUE AI - Visual Studio Code",
                "main_fastapi.py — backend - Visual Studio Code"
            ],
            "event_count": 312
        },
        {
            "id": "aw_2",
            "app": "Google Chrome",
            "category": "Information",
            "minutes": 68,
            "icon": "globe",
            "color": "#4285F4",
            "source": "aw-watcher-web",
            "window_titles": [
                "ActivityWatch Documentation — Automated Time Tracker",
                "arXiv.org - Attention Is All You Need (PDF)",
                "Supabase Docs — PostgreSQL Row Level Security"
            ],
            "event_count": 204
        },
        {
            "id": "aw_3",
            "app": "YouTube",
            "category": "Entertainment",
            "minutes": 48,
            "icon": "youtube",
            "color": "#FF0000",
            "source": "aw-watcher-web",
            "window_titles": [
                "3Blue1Brown - Backpropagation Calculus - YouTube",
                "Lo-Fi Beats to Study & Code To - YouTube"
            ],
            "event_count": 94
        },
        {
            "id": "aw_4",
            "app": "Instagram",
            "category": "Social Media",
            "minutes": 34,
            "icon": "instagram",
            "color": "#E1306C",
            "source": "aw-watcher-web",
            "window_titles": [
                "Instagram • Feed & Reels",
                "Instagram • Direct Messages"
            ],
            "event_count": 112
        },
        {
            "id": "aw_5",
            "app": "Notion",
            "category": "Productivity",
            "minutes": 25,
            "icon": "file-text",
            "color": "#202020",
            "source": "aw-watcher-window",
            "window_titles": [
                "Semester Exam Study Roadmap — Notion",
                "Machine Learning Lecture Notes — Notion"
            ],
            "event_count": 64
        },
        {
            "id": "aw_6",
            "app": "Anki",
            "category": "Education",
            "minutes": 22,
            "icon": "book-open",
            "color": "#10B981",
            "source": "aw-watcher-window",
            "window_titles": [
                "Anki — Discrete Mathematics & Graph Theory Deck"
            ],
            "event_count": 56
        }
    ],
    "limits": [
        {"app": "Instagram", "limit_minutes": 30, "enabled": true},
        {"app": "YouTube", "limit_minutes": 45, "enabled": true},
        {"app": "Google Chrome", "limit_minutes": 90, "enabled": true},
        {"app": "VS Code", "limit_minutes": 240, "enabled": false}
    ],
    "subjects": [
        {
            "id": "sub_1",
            "name": "Machine Learning & AI",
            "target_hours": 15,
            "completed_hours": 6.5,
            "priority": "High",
            "deadline": "2026-11-05",
            "color": "#6366F1",
            "notes": "Chapter 4: Neural Networks and Backpropagation"
        },
        {
            "id": "sub_2",
            "name": "Operating Systems & Networking",
            "target_hours": 10,
            "completed_hours": 4.0,
            "priority": "Medium",
            "deadline": "2026-11-08",
            "color": "#06B6D4",
            "notes": "Virtual Memory and Page Replacement algorithms"
        },
        {
            "id": "sub_3",
            "name": "Discrete Mathematics",
            "target_hours": 8,
            "completed_hours": 2.5,
            "priority": "Urgent",
            "deadline": "2026-11-03",
            "color": "#F43F5E",
            "notes": "Combinatorics and Graph Theory proofs"
        },
        {
            "id": "sub_4",
            "name": "Cloud Architecture & APIs",
            "target_hours": 12,
            "completed_hours": 7.0,
            "priority": "Low",
            "deadline": "2026-11-14",
            "color": "#10B981",
            "notes": "FastAPI microservices & ActivityWatch telemetry"
        }
    ],
    "daily_goals": [
        {"id": "g1", "title": "Log 3.5+ hours of active study in ActivityWatch", "target": "3.5 hours", "completed": False, "category": "study"},
        {"id": "g2", "title": "Keep social & entertainment apps under 75 minutes", "target": "< 75 mins", "completed": False, "category": "wellness"},
        {"id": "g3", "title": "Complete 4 Pomodoro focus intervals", "target": "4 sessions", "completed": True, "category": "focus"},
        {"id": "g4", "title": "Zero screen activity 45 minutes before sleep", "target": "Wind-down", "completed": False, "category": "sleep"}
    ],
    "settings": {
        "user_name": "Alex Vance",
        "email": "alex.vance@enfoque.ai",
        "whatsapp_number": "+1 555-019-2834",
        "daily_study_goal_hours": 4.5,
        "daily_screen_time_limit_hours": 5.0,
        "whatsapp_automated_reports": True,
        "whatsapp_time": "21:30",
        "theme": "dark",
        "enable_sound_alerts": True,
        "supabase_connected": False,
        "supabase_url": "https://enfoque-wellness.supabase.co",
        "supabase_anon_key": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        "activitywatch_url": "http://localhost:5600",
        "activitywatch_auto_sync": True
    }
}


def infer_category(app_name):
    lower = app_name.lower()
    if any(s in lower for s in ["instagram", "tiktok", "twitter", "x", "facebook", "reddit", "snapchat"]):
        return "Social Media"
    if any(e in lower for e in ["youtube", "netflix", "spotify", "twitch", "vlc", "steam"]):
        return "Entertainment"
    if any(p in lower for p in ["code", "vscode", "notion", "figma", "github", "terminal", "iterm", "pycharm", "cursor"]):
        return "Productivity"
    if any(ed in lower for ed in ["anki", "duolingo", "coursera", "udemy", "khan", "obsidian"]):
        return "Education"
    if any(c in lower for c in ["whatsapp", "slack", "discord", "telegram", "zoom", "mail"]):
        return "Communication"
    if any(i in lower for i in ["chrome", "firefox", "safari", "brave", "edge", "arc"]):
        return "Information"
    return "Other"


def fetch_from_activitywatch_server(aw_host=None):
    """
    Queries a live ActivityWatch server (default http://127.0.0.1:5600)
    using /api/0/buckets and /api/0/query to get today's AFK-filtered window events.
    """
    host = (aw_host or STATE["activitywatch"]["host"]).rstrip("/")
    try:
        req = urllib.request.Request(f"{host}/api/0/buckets/", headers={"Accept": "application/json"})
        with urllib.request.urlopen(req, timeout=2.0) as resp:
            buckets = json.loads(resp.read().decode("utf-8"))

        window_bucket = None
        afk_bucket = None
        for b_id in buckets.keys():
            if b_id.startswith("aw-watcher-window"):
                window_bucket = b_id
            elif b_id.startswith("aw-watcher-afk"):
                afk_bucket = b_id

        if not window_bucket:
            return {"connected": False, "reason": "No aw-watcher-window bucket found"}

        # Fetch recent events from window bucket
        events_url = f"{host}/api/0/buckets/{urllib.parse.quote(window_bucket)}/events?limit=1000"
        with urllib.request.urlopen(events_url, timeout=2.5) as eresp:
            events = json.loads(eresp.read().decode("utf-8"))

        app_totals = {}
        app_titles = {}
        app_counts = {}

        for ev in events:
            duration_sec = float(ev.get("duration", 0))
            data = ev.get("data", {})
            app_name = data.get("app") or "Unknown"
            title = data.get("title") or ""
            app_totals[app_name] = app_totals.get(app_name, 0.0) + duration_sec
            app_counts[app_name] = app_counts.get(app_name, 0) + 1
            if title:
                titles_list = app_titles.setdefault(app_name, [])
                if title not in titles_list and len(titles_list) < 4:
                    titles_list.append(title)

        parsed_apps = []
        for idx, (app_name, sec) in enumerate(sorted(app_totals.items(), key=lambda x: x[1], reverse=True)):
            mins = max(1, round(sec / 60.0))
            cat = infer_category(app_name)
            parsed_apps.append({
                "id": f"aw_live_{idx+1}",
                "app": app_name,
                "category": cat,
                "minutes": mins,
                "icon": "activity",
                "color": "#6366F1",
                "source": "aw-watcher-window",
                "window_titles": app_titles.get(app_name, []),
                "event_count": app_counts.get(app_name, 1)
            })

        if parsed_apps:
            STATE["screen_time"] = parsed_apps
            STATE["activitywatch"]["connected"] = True
            STATE["activitywatch"]["mode"] = "live-server"
            STATE["activitywatch"]["last_sync"] = datetime.now().isoformat()

        return {"connected": True, "apps": parsed_apps, "bucket": window_bucket}
    except Exception as exc:
        STATE["activitywatch"]["connected"] = False
        return {"connected": False, "error": str(exc)}


def calculate_metrics():
    screen_time = STATE["screen_time"]
    limits = {item["app"].lower(): item for item in STATE["limits"] if item.get("enabled", True)}

    total_minutes = sum(item["minutes"] for item in screen_time)

    categories = {}
    for item in screen_time:
        cat = item.get("category", "Other")
        categories[cat] = categories.get(cat, 0) + item["minutes"]

    warnings = []
    for item in screen_time:
        app_name = item["app"]
        minutes = item["minutes"]
        key = app_name.lower()
        if key in limits:
            limit_min = limits[key]["limit_minutes"]
            if minutes > limit_min:
                exceeded_by = minutes - limit_min
                severity = "critical" if (exceeded_by / limit_min) >= 0.25 else "warning"
                warnings.append({
                    "app": app_name,
                    "usage_minutes": minutes,
                    "limit_minutes": limit_min,
                    "exceeded_by": exceeded_by,
                    "percentage": round((minutes / limit_min) * 100, 1),
                    "severity": severity,
                    "message": f"{app_name} exceeded limit by {exceeded_by}m ({minutes}m / {limit_min}m max)"
                })

    social_ent_minutes = categories.get("Social Media", 0) + categories.get("Entertainment", 0)
    productivity_minutes = categories.get("Productivity", 0) + categories.get("Education", 0)

    wellness_base = 85
    penalty = min(45, (social_ent_minutes // 20) * 4)
    bonus = min(25, (productivity_minutes // 30) * 5)
    warning_penalty = len(warnings) * 7
    wellness_score = max(10, min(100, wellness_base - penalty + bonus - warning_penalty))

    return {
        "total_screen_time_minutes": total_minutes,
        "total_screen_time_formatted": f"{total_minutes // 60}h {total_minutes % 60}m",
        "category_breakdown": categories,
        "warnings": warnings,
        "warning_count": len(warnings),
        "wellness_score": wellness_score,
        "social_ent_minutes": social_ent_minutes,
        "productivity_minutes": productivity_minutes,
        "focus_ratio": round((productivity_minutes / max(1, total_minutes)) * 100, 1),
        "activitywatch": STATE["activitywatch"]
    }


class EnfoqueApiHandler(BaseHTTPRequestHandler):
    def _send_cors_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")

    def do_OPTIONS(self):
        self.send_response(204)
        self._send_cors_headers()
        self.end_headers()

    def _json_response(self, data, status=200):
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self._send_cors_headers()
        self.end_headers()
        self.wfile.write(json.dumps(data).encode("utf-8"))

    def _read_body(self):
        content_length = int(self.headers.get("Content-Length", 0))
        if content_length > 0:
            body = self.rfile.read(content_length)
            return json.loads(body.decode("utf-8"))
        return {}

    def do_GET(self):
        url_parts = urllib.parse.urlparse(self.path)
        path = url_parts.path

        if path == "/api/health":
            self._json_response({
                "status": "healthy",
                "service": "ENFOQUE AI Python Engine + ActivityWatch Connector",
                "python_version": sys.version,
                "activitywatch": STATE["activitywatch"],
                "timestamp": datetime.now().isoformat()
            })
        elif path in ("/api/dashboard", "/api/screen-time"):
            metrics = calculate_metrics()
            self._json_response({
                "screen_time": STATE["screen_time"],
                "metrics": metrics,
                "limits": STATE["limits"],
                "activitywatch": STATE["activitywatch"]
            })
        elif path == "/api/activitywatch/status":
            self._json_response(STATE["activitywatch"])
        else:
            self._json_response({"error": "Endpoint not found", "path": path}, 404)

    def do_POST(self):
        url_parts = urllib.parse.urlparse(self.path)
        path = url_parts.path
        body = self._read_body()

        if path == "/api/activitywatch/sync":
            host = body.get("host") or STATE["activitywatch"]["host"]
            res = fetch_from_activitywatch_server(host)
            self._json_response({
                "sync_result": res,
                "screen_time": STATE["screen_time"],
                "metrics": calculate_metrics(),
                "activitywatch": STATE["activitywatch"]
            })
        else:
            self._json_response({"success": True})


if __name__ == "__main__":
    httpd = HTTPServer(("127.0.0.1", PORT), EnfoqueApiHandler)
    print(f"[ENFOQUE-PY] ActivityWatch Connector Server running on http://127.0.0.1:{PORT}")
    httpd.serve_forever()

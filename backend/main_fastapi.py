"""
ENFOQUE AI - Production FastAPI Backend with ActivityWatch Telemetry Integration
Run with: uvicorn main_fastapi:app --reload --port 8000
"""

from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime
import urllib.parse
import urllib.request
import json

app = FastAPI(
    title="ENFOQUE AI - ActivityWatch & Digital Wellness API",
    description="Python FastAPI backend powering ActivityWatch screen time monitoring (aw-watcher-window + aw-watcher-afk), study timetables, and WhatsApp updates.",
    version="1.4.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ActivityWatchSyncRequest(BaseModel):
    host: str = "http://localhost:5600"
    filter_afk: bool = True

class ActivityWatchImportPayload(BaseModel):
    json_content: str

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "ENFOQUE AI FastAPI + ActivityWatch Engine",
        "framework": "FastAPI + ActivityWatch REST v0",
        "timestamp": datetime.now().isoformat()
    }

@app.post("/api/activitywatch/sync")
def sync_activitywatch(payload: ActivityWatchSyncRequest):
    host = payload.host.rstrip("/")
    try:
        with urllib.request.urlopen(f"{host}/api/0/buckets/", timeout=2.0) as response:
            buckets = json.loads(response.read().decode("utf-8"))
        return {"connected": True, "host": host, "buckets": list(buckets.keys())}
    except Exception as e:
        return {"connected": False, "host": host, "fallback": "aw-telemetry-stream", "detail": str(e)}

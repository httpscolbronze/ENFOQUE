import React, { useState } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import {
  UploadCloud,
  FileText,
  Download,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  RefreshCw,
  Activity,
  Code
} from 'lucide-react';
import { parseScreenTimeCsv, parseActivityWatchExportJson, formatMinutes } from '../../utils/analytics.ts';
import { SAMPLE_ACTIVITYWATCH_JSON } from '../../services/activityWatch.ts';
import { AppUsage } from '../../types/index.ts';

export const CsvUploadView: React.FC = () => {
  const {
    importCsvData,
    importActivityWatchJson,
    syncActivityWatchNow,
    isSyncingAW,
    setActiveTab,
    triggerConfetti
  } = useApp();

  const [mode, setMode] = useState<'activitywatch' | 'csv'>('activitywatch');

  const sampleCsvContent = `app,minutes
VS Code,145
Google Chrome,80
YouTube,50
Instagram,35
Notion,40
Anki,30`;

  const [csvText, setCsvText] = useState(sampleCsvContent);
  const [awJsonText, setAwJsonText] = useState(SAMPLE_ACTIVITYWATCH_JSON);
  const [dragActive, setDragActive] = useState(false);

  const [csvParseResult, setCsvParseResult] = useState<{
    success: boolean;
    data: AppUsage[];
    error?: string;
  }>(parseScreenTimeCsv(sampleCsvContent));

  const [awParseResult, setAwParseResult] = useState<{
    success: boolean;
    data: AppUsage[];
    afkMinutes: number;
    error?: string;
  }>(parseActivityWatchExportJson(SAMPLE_ACTIVITYWATCH_JSON));

  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [awHostInput, setAwHostInput] = useState('http://localhost:5600');
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  const handleCsvChange = (text: string) => {
    setCsvText(text);
    setCsvParseResult(parseScreenTimeCsv(text));
    setImportStatus('idle');
  };

  const handleAwJsonChange = (text: string) => {
    setAwJsonText(text);
    setAwParseResult(parseActivityWatchExportJson(text));
    setImportStatus('idle');
  };

  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = e => {
      const content = e.target?.result as string;
      if (!content) return;
      if (file.name.endsWith('.json') || content.trim().startsWith('{') || content.trim().startsWith('[')) {
        setMode('activitywatch');
        handleAwJsonChange(content);
      } else {
        setMode('csv');
        handleCsvChange(content);
      }
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleDownloadSample = () => {
    if (mode === 'activitywatch') {
      const blob = new Blob([SAMPLE_ACTIVITYWATCH_JSON], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'aw-bucket-export.json';
      a.click();
      URL.revokeObjectURL(url);
    } else {
      const blob = new Blob([sampleCsvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'screen_time_sample.csv';
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const handleExecuteImport = async () => {
    if (mode === 'activitywatch') {
      if (!awParseResult.success || awParseResult.data.length === 0) return;
      const res = await importActivityWatchJson(awJsonText);
      if (res.success) {
        setImportStatus('success');
        triggerConfetti();
        setTimeout(() => setActiveTab('dashboard'), 1200);
      } else {
        setImportStatus('error');
      }
    } else {
      if (!csvParseResult.success || csvParseResult.data.length === 0) return;
      const res = await importCsvData(csvText);
      if (res.success) {
        setImportStatus('success');
        triggerConfetti();
        setTimeout(() => setActiveTab('dashboard'), 1200);
      } else {
        setImportStatus('error');
      }
    }
  };

  const handleDirectAwSync = async () => {
    const res = await syncActivityWatchNow(awHostInput);
    setSyncMessage(res.message);
  };

  const activeData = mode === 'activitywatch' ? awParseResult.data : csvParseResult.data;
  const isValid = mode === 'activitywatch' ? awParseResult.success : csvParseResult.success;
  const activeError = mode === 'activitywatch' ? awParseResult.error : csvParseResult.error;
  const totalParsedMins = activeData.reduce((s, a) => s + a.minutes, 0);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-2xl bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800/80 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-indigo-500" />
            <span>ActivityWatch Telemetry & CSV Import</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Sync directly from ActivityWatch (<code className="font-mono text-indigo-500">localhost:5600</code>), upload an ActivityWatch JSON bucket export, or import <code className="font-mono text-indigo-500">app,minutes</code> CSV data.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setMode('activitywatch')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              mode === 'activitywatch'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>ActivityWatch JSON</span>
          </button>

          <button
            onClick={() => setMode('csv')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              mode === 'csv'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>CSV (app,minutes)</span>
          </button>

          <button
            onClick={handleDownloadSample}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span>Sample</span>
          </button>
        </div>
      </div>

      {/* Live ActivityWatch Server Endpoint Bar */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-indigo-950/60 via-slate-900 to-slate-950 border border-indigo-500/30 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
            <Activity className="w-4 h-4" />
            <span>Direct ActivityWatch Server Connector (aw-server REST API v0)</span>
          </div>
          <p className="text-xs text-slate-300">
            Pulls <code className="font-mono text-indigo-300">aw-watcher-window</code> and <code className="font-mono text-indigo-300">aw-watcher-afk</code> buckets to compute AFK-filtered Total Screen Time.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <input
            type="text"
            value={awHostInput}
            onChange={e => setAwHostInput(e.target.value)}
            placeholder="http://localhost:5600"
            className="px-3.5 py-2 rounded-xl text-xs font-mono bg-slate-900/90 border border-slate-700 text-white w-full md:w-56"
          />
          <button
            onClick={handleDirectAwSync}
            disabled={isSyncingAW}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shrink-0 flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncingAW ? 'animate-spin' : ''}`} />
            <span>{isSyncingAW ? 'Querying...' : 'Sync Server'}</span>
          </button>
        </div>
      </div>

      {syncMessage && (
        <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-xs text-indigo-600 dark:text-indigo-300 font-medium">
          {syncMessage}
        </div>
      )}

      {/* Upload Zone & Raw Textarea Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div
            onDragOver={e => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all ${
              dragActive
                ? 'border-indigo-500 bg-indigo-500/10'
                : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40'
            }`}
          >
            <UploadCloud className="w-9 h-9 text-indigo-500 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              {mode === 'activitywatch'
                ? 'Drop ActivityWatch Bucket JSON Export (.json)'
                : 'Drop Screen-Time CSV File (.csv)'}
            </h4>
            <p className="text-xs text-slate-400 mt-1 mb-3">
              {mode === 'activitywatch'
                ? 'Supports standard ActivityWatch Web UI bucket exports (aw-watcher-window & aw-watcher-afk)'
                : 'Supports comma-separated files with headers: app,minutes'}
            </p>

            <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold cursor-pointer transition-all shadow-md shadow-indigo-600/20">
              <Code className="w-4 h-4" />
              <span>Browse {mode === 'activitywatch' ? 'JSON' : 'CSV'} File</span>
              <input
                type="file"
                accept=".json,.csv,application/json,text/csv"
                onChange={e => e.target.files && handleFileUpload(e.target.files[0])}
                className="hidden"
              />
            </label>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              {mode === 'activitywatch'
                ? 'ActivityWatch Bucket / Event JSON Payload:'
                : 'Raw CSV Content (app,minutes):'}
            </label>
            <textarea
              rows={10}
              value={mode === 'activitywatch' ? awJsonText : csvText}
              onChange={e =>
                mode === 'activitywatch'
                  ? handleAwJsonChange(e.target.value)
                  : handleCsvChange(e.target.value)
              }
              className="w-full p-3 font-mono text-xs bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Live Parser Preview */}
        <div className="p-6 rounded-2xl bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800/80 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Parsed Screen-Time Preview
                </h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  New Total Screen Time: <strong className="text-indigo-400">{formatMinutes(totalParsedMins)}</strong>
                  {mode === 'activitywatch' && ` (AFK filtered: ${awParseResult.afkMinutes}m)`}
                </p>
              </div>
              {isValid ? (
                <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-500 bg-emerald-500/10 px-2.5 py-0.5 rounded-full">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{activeData.length} apps ready</span>
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-xs font-semibold text-rose-500 bg-rose-500/10 px-2.5 py-0.5 rounded-full">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{activeError}</span>
                </span>
              )}
            </div>

            <div className="mt-4 max-h-72 overflow-y-auto rounded-xl border border-slate-100 dark:border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/70 text-slate-400 uppercase text-[10px] font-bold">
                  <tr>
                    <th className="p-3">Application & Window</th>
                    <th className="p-3">Category</th>
                    <th className="p-3 text-right">Active Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {activeData.map((row, i) => (
                    <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                      <td className="p-3">
                        <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: row.color }}
                          />
                          <span>{row.app}</span>
                        </div>
                        {row.window_titles?.[0] && (
                          <span className="text-[10px] font-mono text-slate-400 block truncate max-w-xs">
                            {row.window_titles[0]}
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-slate-500 dark:text-slate-400">
                        {row.category}
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                        {formatMinutes(row.minutes)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <button
              disabled={!isValid || activeData.length === 0}
              onClick={handleExecuteImport}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>
                Apply {mode === 'activitywatch' ? 'ActivityWatch Telemetry' : 'CSV Data'} ({formatMinutes(totalParsedMins)}) to ENFOQUE AI
              </span>
            </button>

            {importStatus === 'success' && (
              <p className="text-center text-xs font-semibold text-emerald-500 animate-in fade-in">
                Total Screen Time updated! Redirecting to Dashboard...
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

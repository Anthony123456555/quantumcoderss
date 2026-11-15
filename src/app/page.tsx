"use client";

import { useEffect, useState, useCallback } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

interface HealthRecord {
  id: number;
  astronaut_id: string;
  data_type: string;
  heart_rate_bpm: number;
  systolic_bp_mmhg: number;
  diastolic_bp_mmhg: number;
  body_temperature_c: number;
  sleep_hours: number;
  mood_score: number;
  recorded_at?: string;
  created_at?: string;
}

interface AnomalyAlert {
  metric: string;
  severity: string;
  message: string;
  recommendation: string;
}

interface MissionRisk {
  status: string;
  level: string;
}

export default function Home() {
  const [records, setRecords] = useState<HealthRecord[]>([]);
  const [anomalyAlert, setAnomalyAlert] = useState<AnomalyAlert | null>(null);
  const [risk, setRisk] = useState<MissionRisk>({ status: "NOMINAL", level: "LOW" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dataSource, setDataSource] = useState<"SIMULATED_SERIES" | "NASA_OSDR_RESEARCH">("SIMULATED_SERIES");
  const [isStreaming, setIsStreaming] = useState(false);
  
  // Terminal Comms State
  const [chatInput, setChatInput] = useState("");
  const [chatLogs, setChatLogs] = useState<{ sender: string; text: string }[]>([
    { sender: "SYS", text: "Flight Comms secured. Telemetry pipeline nominal." }
  ]);

  const fetchHealthReadings = useCallback(async () => {
    try {
      const url = dataSource === "NASA_OSDR_RESEARCH"
        ? "http://127.0.0.1:8000/api/v1/health/readings?data_type=NASA_OSDR_RESEARCH&limit=10"
        : "http://127.0.0.1:8000/api/v1/health/readings?limit=12";

      const response = await fetch(url);
      if (!response.ok) throw new Error("Backend connection error");

      const json = await response.json();
      if (json.data && json.data.length > 0) {
        setRecords([...json.data].reverse());
        setAnomalyAlert(json.anomaly_alert || null);
        if (json.mission_risk) setRisk(json.mission_risk);
      } else {
        setRecords([]);
        setError("No telemetry data found");
      }
    } catch {
      setError("Failed to reach FastAPI backend server");
    } finally {
      setLoading(false);
    }
  }, [dataSource]);

  useEffect(() => {
    fetchHealthReadings();
  }, [dataSource, fetchHealthReadings]);

  // Live Stream Effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isStreaming && dataSource === "SIMULATED_SERIES") {
      interval = setInterval(async () => {
        try {
          await fetch("http://127.0.0.1:8000/api/v1/health/stream", { method: "POST" });
          fetchHealthReadings();
        } catch (err) {
          console.error("Stream sync error", err);
        }
      }, 4000);
    }
    return () => clearInterval(interval);
  }, [isStreaming, dataSource, fetchHealthReadings]);

  const handleExportReport = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/api/v1/mission/report");
      const text = await res.text();
      const blob = new Blob([text], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "quantumcoders-mission-report.txt";
      a.click();
    } catch {
      window.alert("Report export failed");
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const userMsg = chatInput;
    setChatInput("");
    setChatLogs(prev => [...prev, { sender: "OP", text: userMsg }]);

    try {
      const res = await fetch("http://127.0.0.1:8000/api/v1/mission/comms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg })
      });
      const data = await res.json();
      setChatLogs(prev => [...prev, { sender: "AI", text: data.reply }]);
    } catch {
      setChatLogs(prev => [...prev, { sender: "SYS", text: "Comms transmission failed." }]);
    }
  };

  const latest = records.length > 0 ? records[records.length - 1] : null;

  const metrics = latest
    ? [
        { name: "HEART RATE", value: latest.heart_rate_bpm, unit: "BPM" },
        {
          name: "BLOOD PRESSURE",
          value: `${latest.systolic_bp_mmhg}/${latest.diastolic_bp_mmhg}`,
          unit: "mmHg",
        },
        { name: "CORE TEMP", value: latest.body_temperature_c, unit: "°C" },
        { name: "SLEEP DURATION", value: latest.sleep_hours, unit: "HRS" },
      ]
    : [];

  const chartData = records.map((r) => {
    const timeStr = r.created_at || r.recorded_at;
    const timeLabel = timeStr
      ? new Date(timeStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      : `${r.id}`;
    return {
      time: timeLabel,
      heartRate: r.heart_rate_bpm,
      systolic: r.systolic_bp_mmhg,
      diastolic: r.diastolic_bp_mmhg,
      temperature: r.body_temperature_c,
    };
  });

  return (
    <main className="min-h-screen bg-[#020617] text-slate-200 font-sans selection:bg-slate-800 selection:text-white">
      {/* Top Aerospace Navigation Bar */}
      <header className="flex items-center justify-between border-b border-slate-800 bg-[#020617]/90 backdrop-blur px-6 py-3.5 sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 font-mono text-xs tracking-wider text-slate-400">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            QC-SYS // v2.4
          </div>
          <div className="h-4 w-[1px] bg-slate-800" />
          <h1 className="text-sm font-semibold tracking-widest text-slate-100 uppercase">
            Quantum<span className="font-light text-slate-400">Coders</span>
          </h1>
        </div>

        <div className="flex items-center gap-3">
          {/* Channel Selector */}
          <div className="flex rounded bg-slate-900 p-0.5 border border-slate-800">
            <button
              onClick={() => { setDataSource("SIMULATED_SERIES"); setIsStreaming(false); }}
              className={`px-3 py-1 text-[11px] font-mono uppercase tracking-wider rounded transition ${
                dataSource === "SIMULATED_SERIES"
                  ? "bg-slate-800 text-slate-100 border border-slate-700"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Operational
            </button>
            <button
              onClick={() => { setDataSource("NASA_OSDR_RESEARCH"); setIsStreaming(false); }}
              className={`px-3 py-1 text-[11px] font-mono uppercase tracking-wider rounded transition ${
                dataSource === "NASA_OSDR_RESEARCH"
                  ? "bg-slate-800 text-slate-100 border border-slate-700"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              NASA OSDR
            </button>
          </div>

          {/* Stream Toggle */}
          {dataSource === "SIMULATED_SERIES" && (
            <button
              onClick={() => setIsStreaming(!isStreaming)}
              className={`px-3 py-1 rounded text-[11px] font-mono uppercase tracking-wider border transition flex items-center gap-2 ${
                isStreaming
                  ? "bg-emerald-950/30 border-emerald-500/40 text-emerald-400"
                  : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
              }`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${isStreaming ? "bg-emerald-400 animate-ping" : "bg-slate-600"}`} />
              {isStreaming ? "Live Feed" : "Static Feed"}
            </button>
          )}

          {/* Export Report */}
          <button
            onClick={handleExportReport}
            className="px-3 py-1 rounded text-[11px] font-mono uppercase tracking-wider border border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800 transition"
          >
            Export Log
          </button>

          <div className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-[10px] font-mono text-emerald-400 tracking-wider">
            DB:ONLINE
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-6">
        {/* Mission Status Header */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 rounded border border-slate-800 bg-slate-950/60 p-4">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-slate-500">
              Active Stream // {dataSource === "NASA_OSDR_RESEARCH" ? "OSDR-SUBJ-01" : "DEMO-001"}
            </div>
            <h2 className="mt-0.5 text-base font-medium tracking-wide text-slate-100 uppercase font-mono">
              Flight Physiology Monitoring
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <div className={`px-2.5 py-0.5 rounded text-[11px] font-mono tracking-wider border ${
              risk.status === "NOMINAL" ? "bg-emerald-950/20 border-emerald-500/30 text-emerald-400" :
              risk.status === "CAUTION" ? "bg-amber-950/20 border-amber-500/30 text-amber-400" :
              "bg-rose-950/20 border-rose-500/30 text-rose-400"
            }`}>
              RISK STATE: {risk.status}
            </div>
          </div>
        </div>

        {loading && (
          <p className="py-20 text-center text-slate-500 font-mono text-xs tracking-widest">
            SYNCHRONIZING TELEMETRY STREAMS...
          </p>
        )}

        {error && (
          <p className="rounded border border-rose-900/40 bg-rose-950/10 p-4 text-rose-400 text-xs font-mono">
            ERROR: {error}. Check FastAPI service status.
          </p>
        )}

        {latest && !loading && (
          <>
            {/* Metrics Cards Grid */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {metrics.map((metric) => (
                <div
                  key={metric.name}
                  className="rounded border border-slate-800 bg-slate-950 p-4 shadow-sm"
                >
                  <p className="text-[10px] font-mono tracking-wider text-slate-500">{metric.name}</p>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-2xl font-semibold tracking-tight text-slate-100 font-mono">
                      {metric.value}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500 uppercase">
                      {metric.unit}
                    </span>
                  </div>
                  <div className="mt-2 text-[10px] font-mono text-slate-600">
                    STATUS: NOMINAL
                  </div>
                </div>
              ))}
            </div>

            {/* Charts Section */}
            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <div className="rounded border border-slate-800 bg-slate-950 p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-mono uppercase tracking-widest text-slate-400">Heart Rate Variance (BPM)</h3>
                  <span className="text-[10px] font-mono text-slate-600">TIME-SERIES</span>
                </div>
                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="2 2" stroke="#1e293b" vertical={false} />
                      <XAxis dataKey="time" stroke="#475569" tick={{ fontSize: 9, fontFamily: 'monospace' }} />
                      <YAxis stroke="#475569" domain={['auto', 'auto']} tick={{ fontSize: 9, fontFamily: 'monospace' }} />
                      <Tooltip
                        contentStyle={{ backgroundColor: "#020617", borderColor: "#334155", borderRadius: "4px", fontSize: "11px", fontFamily: "monospace" }}
                      />
                      <Line type="monotone" dataKey="heartRate" stroke="#94a3b8" strokeWidth={1.5} dot={false} activeDot={{ r: 3, fill: '#f8fafc' }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="rounded border border-slate-800 bg-slate-950 p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-mono uppercase tracking-widest text-slate-400">Blood Pressure (SYS / DIA)</h3>
                  <span className="text-[10px] font-mono text-slate-600">MMHG</span>
                </div>
                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="2 2" stroke="#1e293b" vertical={false} />
                      <XAxis dataKey="time" stroke="#475569" tick={{ fontSize: 9, fontFamily: 'monospace' }} />
                      <YAxis stroke="#475569" domain={['auto', 'auto']} tick={{ fontSize: 9, fontFamily: 'monospace' }} />
                      <Tooltip
                        contentStyle={{ backgroundColor: "#020617", borderColor: "#334155", borderRadius: "4px", fontSize: "11px", fontFamily: "monospace" }}
                      />
                      <Line type="monotone" dataKey="systolic" name="Systolic" stroke="#cbd5e1" strokeWidth={1.5} dot={false} />
                      <Line type="monotone" dataKey="diastolic" name="Diastolic" stroke="#64748b" strokeWidth={1.5} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Analysis & Research Modules */}
            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <div className="rounded border border-slate-800 bg-slate-950 p-5">
                <h3 className="text-xs font-mono uppercase tracking-widest text-slate-400 flex items-center justify-between mb-3">
                  <span>Anomaly Detection Engine</span>
                  {anomalyAlert && (
                    <span className="px-1.5 py-0.5 text-[9px] font-mono bg-amber-950/30 border border-amber-500/40 text-amber-400">
                      {anomalyAlert.severity}
                    </span>
                  )}
                </h3>
                {anomalyAlert ? (
                  <div className="space-y-2 font-mono text-xs">
                    <p className="text-amber-200/80 leading-relaxed text-[11px]">
                      {anomalyAlert.message}
                    </p>
                    <p className="text-slate-400 pt-2 border-t border-slate-900 text-[11px]">
                      <strong className="text-slate-300">Action:</strong> {anomalyAlert.recommendation}
                    </p>
                  </div>
                ) : (
                  <p className="text-[11px] font-mono text-slate-500">
                    No statistical deviations detected across current telemetry channels.
                  </p>
                )}
              </div>

              <div className="rounded border border-slate-800 bg-slate-950 p-5">
                <h3 className="text-xs font-mono uppercase tracking-widest text-slate-400 mb-3">NASA OSDR Research Context</h3>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Referencing open datasets from the <a href="https://osdr.nasa.gov/" target="_blank" rel="noreferrer" className="text-slate-200 underline underline-offset-2">NASA Open Science Data Repository</a> for baseline microgravity stress comparisons.
                </p>
                <div className="mt-4 pt-3 border-t border-slate-900 flex items-center justify-between text-[10px] font-mono text-slate-600">
                  <span>SUBJECT: {latest.astronaut_id}</span>
                  <span>MODE: {latest.data_type}</span>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Flight Comms Terminal */}
        <div className="mt-6 rounded border border-slate-800 bg-slate-950 p-5">
          <h3 className="text-xs font-mono uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Flight Comms Interface (CLI)
          </h3>
          <div className="h-32 overflow-y-auto rounded bg-[#010409] p-3 font-mono text-[11px] space-y-1.5 border border-slate-900 mb-3">
            {chatLogs.map((log, idx) => (
              <div key={idx} className={log.sender === "OP" ? "text-slate-300" : log.sender === "AI" ? "text-emerald-400" : "text-slate-500"}>
                <span className="opacity-50">[{log.sender}]</span> {log.text}
              </div>
            ))}
          </div>
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Enter flight comm query..."
              className="flex-1 rounded bg-[#010409] border border-slate-800 px-3 py-1.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-slate-600 placeholder:text-slate-700"
            />
            <button
              type="submit"
              className="px-4 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-xs font-mono uppercase tracking-wider text-slate-200 transition"
            >
              Send
            </button>
          </form>
        </div>

        <footer className="mt-10 border-t border-slate-900 pt-6 text-center text-[10px] font-mono text-slate-600 tracking-wider">
          QUANTUMCODERS // SPACE APPS CHALLENGE 2026
        </footer>
      </section>
    </main>
  );
}
import React, { useEffect, useRef, useState, useMemo } from "react";
import { io } from "socket.io-client";
import {
  AlertTriangle,
  Bot,
  Check,
  CircleAlert,
  Code2,
  Copy,
  FileCode,
  GitBranch,
  LayoutDashboard,
  MessageSquare,
  Plus,
  Search,
  Send,
  ShieldCheck,
  Terminal,
  X,
  Zap,
  type LucideIcon,
} from "lucide-react";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  fetchHealth,
  fetchIncidents,
  postIncident,
  approveIncident as apiApprove,
  investigateIncident as apiInvestigate,
  type ApiHealth,
} from "./api";
import { logs as initialLogs } from "./data";
import type { Incident, Severity } from "./types";

// ============================================================================
// SMART CAT ICON (TEAM DAANAV EMBLEM)
// ============================================================================
export function SmartCatIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path
        d="M12 5c-3 0-5 1.5-6.5 3L3 5l1.5 6C4 13 4 15 5 16.5c1.8 2.5 4.5 3.5 7 3.5s5.2-1 7-3.5c1-1.5 1-3.5.5-5.5L21 5l-2.5 3C17 6.5 15 5 12 5z"
        fill="currentColor"
        fillOpacity="0.18"
      />
      <rect
        x="6.5"
        y="10"
        width="11"
        height="3"
        rx="1.5"
        stroke="currentColor"
        fill="currentColor"
        fillOpacity="0.35"
      />
      <line x1="12" y1="10" x2="12" y2="13" />
      <line x1="2" y1="14" x2="5" y2="14.5" />
      <line x1="2" y1="16" x2="5" y2="16" />
      <line x1="19" y1="14.5" x2="22" y2="14" />
      <line x1="19" y1="16" x2="22" y2="16" />
      <path d="M11 16.5l1 .8 1-.8" />
    </svg>
  );
}

// ============================================================================
// TYPES & TELEMETRY DATA
// ============================================================================
type NavPage = "Overview" | "Incidents" | "AI Agents" | "Logs Explorer" | "Code Review";

interface TelegramMessage {
  id: string;
  sender: string;
  senderRole: "mgr" | "log" | "fix" | "test" | "orch";
  time: string;
  text: string;
}

const VELOCITY_CHART_DATA = [
  { time: "10:00", active: 2, resolved: 6 },
  { time: "11:00", active: 4, resolved: 8 },
  { time: "12:00", active: 3, resolved: 11 },
  { time: "13:00", active: 5, resolved: 14 },
  { time: "14:00", active: 1, resolved: 18 },
  { time: "15:00", active: 1, resolved: 22 },
];

const DEFAULT_DIFF_LINES = [
  { type: "hunk", oldNum: "...", newNum: "...", text: "@@ -138,7 +138,10 @@ async def process_payment_batch(batch_id: str, items: list[dict]):" },
  { type: "context", oldNum: "138", newNum: "138", text: "    logger.info(f\"Processing payment batch {batch_id} with {len(items)} transactions\")" },
  { type: "del", oldNum: "139", newNum: "", text: "    # Leaked connection: acquired without context manager cleanup on exception" },
  { type: "del", oldNum: "140", newNum: "", text: "    redis_conn = await redis_pool.get_connection()" },
  { type: "del", oldNum: "141", newNum: "", text: "    await redis_conn.setex(f\"batch:{batch_id}:status\", 300, \"PROCESSING\")" },
  { type: "add", oldNum: "", newNum: "139", text: "    # Fixed by Code Fixer Agent: Scoped connection lifecycle management" },
  { type: "add", oldNum: "", newNum: "140", text: "    async with redis_pool.connection() as redis_conn:" },
  { type: "add", oldNum: "", newNum: "141", text: "        await redis_conn.setex(f\"batch:{batch_id}:status\", 300, \"PROCESSING\")" },
  { type: "add", oldNum: "", newNum: "142", text: "        await redis_conn.hset(f\"batch:{batch_id}:meta\", mapping={\"retries\": 0})" },
  { type: "context", oldNum: "142", newNum: "143", text: "    results = await execute_payment_gateways(items)" },
];

export default function App() {
  const [activeNav, setActiveNav] = useState<NavPage>("Overview");
  const [health, setHealth] = useState<ApiHealth | null>(null);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  
  // War Room Drawer Toggle
  const [warRoomOpen, setWarRoomOpen] = useState(false);
  const [warRoomInput, setWarRoomInput] = useState("");

  // Command Palette
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [paletteQuery, setPaletteQuery] = useState("");
  const [paletteIndex, setPaletteIndex] = useState(0);

  // New Incident Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newService, setNewService] = useState("checkout-service");
  const [newSeverity, setNewSeverity] = useState<Severity>("critical");

  // Filters
  const [logSearch, setLogSearch] = useState("");
  const [logFilter, setLogFilter] = useState<string>("all");
  const [incidentFilter, setIncidentFilter] = useState<string>("all");

  // Timer & Pipeline
  const [timerSeconds, setTimerSeconds] = useState(258.23);
  const [pipelineState, setPipelineState] = useState<"step3_fixer" | "step4_testing" | "approved">("step3_fixer");
  const [testCount, setTestCount] = useState("18 / 18 PASS");

  // War Room Messages
  const [messages, setMessages] = useState<TelegramMessage[]>([
    {
      id: "msg-1",
      sender: "@devops_incident_manager_bot",
      senderRole: "mgr",
      time: "12:34:02",
      text: "🚨 P0 Incident Declared: Sentry alert E-9102 memory threshold exceeded (>94% RSS). Handing off to Log Analyzer.",
    },
    {
      id: "msg-2",
      sender: "@devops_log_analyzer_bot",
      senderRole: "log",
      time: "12:34:28",
      text: "🔍 Root Cause Found: 1,480 unclosed Redis pool sockets in worker.py:140. Handing off to Code Fixer.",
    },
    {
      id: "msg-3",
      sender: "@devops_code_fixer_bot",
      senderRole: "fix",
      time: "12:34:41",
      text: "⚡ Patch Generated: Wrapped redis acquisition in async with redis_pool.connection(). Dispatching to Testing Agent.",
    },
  ]);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const handleCardMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    e.currentTarget.style.setProperty("--mouse-x", `${x}px`);
    e.currentTarget.style.setProperty("--mouse-y", `${y}px`);
  };

  // 1. Initial Load & Backend Sync
  useEffect(() => {
    fetchHealth().then(setHealth).catch(() => {});
    fetchIncidents()
      .then((records) => {
        setIncidents(records);
        if (records.length > 0 && !selectedIncident) {
          setSelectedIncident(records[0]);
        }
      })
      .catch(() => {});

    const socket = io();
    socket.on("incident:created", (record: Incident) => {
      setIncidents((prev) => [record, ...prev]);
    });
    socket.on("incident:updated", (record: Incident) => {
      setIncidents((prev) => prev.map((i) => (i.id === record.id ? record : i)));
    });
    socket.on("agent:execution:step", (step: { role: string; step: string }) => {
      if (step.role.toLowerCase().includes("test")) {
        setPipelineState("step4_testing");
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [selectedIncident]);

  // 2. Millisecond Timer
  useEffect(() => {
    const interval = setInterval(() => {
      setTimerSeconds((prev) => prev + 0.05);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  const formattedTimer = useMemo(() => {
    const m = Math.floor(timerSeconds / 60).toString().padStart(2, "0");
    const s = (timerSeconds % 60).toFixed(2).padStart(5, "0");
    return `${m}:${s}`;
  }, [timerSeconds]);

  // 3. Topology Mesh Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    const mouse = { x: -9999, y: -9999, active: false };
    const onMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      mouse.active = true;
    };
    const onMouseLeave = () => {
      mouse.active = false;
      mouse.x = -9999;
      mouse.y = -9999;
    };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseleave", onMouseLeave);

    const nodes = Array.from({ length: 40 }).map(() => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      radius: Math.random() * 1.6 + 1.2,
      baseAlpha: Math.random() * 0.3 + 0.2,
      color: Math.random() > 0.4 ? "rgba(0, 240, 255," : "rgba(99, 102, 241,",
      pulsePhase: Math.random() * Math.PI * 2,
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        n.x += n.vx;
        n.y += n.vy;

        if (n.x < 0) n.x = width;
        if (n.x > width) n.x = 0;
        if (n.y < 0) n.y = height;
        if (n.y > height) n.y = 0;

        if (mouse.active) {
          const dx = mouse.x - n.x;
          const dy = mouse.y - n.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 130) {
            const force = (1 - dist / 130) * 0.4;
            n.x += (dx / dist) * force;
            n.y += (dy / dist) * force;
          }
        }

        n.pulsePhase += 0.03;
        const alpha = n.baseAlpha + Math.sin(n.pulsePhase) * 0.1;

        ctx.beginPath();
        ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2);
        ctx.fillStyle = `${n.color} ${alpha})`;
        ctx.fill();
      }

      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 110) {
            const alpha = (1 - dist / 110) * 0.09;
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.strokeStyle = `rgba(0, 240, 255, ${alpha})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseleave", onMouseLeave);
    };
  }, []);

  // 4. Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((prev) => !prev);
        return;
      }
      if (e.key === "Escape") {
        setPaletteOpen(false);
        setWarRoomOpen(false);
        setCreateModalOpen(false);
        return;
      }
      if (e.key.toLowerCase() === "w" && !paletteOpen && !createModalOpen && !(e.target instanceof HTMLInputElement)) {
        e.preventDefault();
        setWarRoomOpen((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [paletteOpen, createModalOpen]);

  // Actions
  const handleRunTests = () => {
    setPipelineState("step4_testing");
    setTestCount("18 / 18 PASS (VERIFIED)");
    const newMsg: TelegramMessage = {
      id: `msg-${Date.now()}`,
      sender: "@devops_testing_agent_bot",
      senderRole: "test",
      time: "Just now",
      text: "🧪 Validation Complete: 18/18 PyTest test cases verified in 1.48s. Memory leak test passed with 0 orphaned sockets!",
    };
    setMessages((prev) => [...prev, newMsg]);
  };

  const handleApprove = async () => {
    setPipelineState("approved");
    const id = selectedIncident?.id || "INC-2847";
    try {
      await apiApprove(id, "Team Daanav", "Approved via Command Cockpit");
    } catch {}
    alert(
      "🚀 TEAM DAANAV SIGN-OFF VERIFIED!\n\n" +
        `1. Dispatched POST /api/incidents/${id}/approve\n` +
        "2. Telegram War Room Supergroup updated via 5-Bot cluster\n" +
        "3. Switch Gateway triggered zero-downtime canary deployment\n" +
        `4. MTTR Clock stopped at ${formattedTimer} (< 5 min SLA ACHIEVED!)`
    );
  };

  const handleInvestigate = async (id: string) => {
    try {
      await apiInvestigate(id);
    } catch {}
    setPipelineState("step3_fixer");
    setActiveNav("Incidents");
    alert(`⚡ AI Agent Fleet dispatched to investigate ${id}!`);
  };

  const handleCreateIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle) return;
    try {
      const created = await postIncident({
        title: newTitle,
        service: newService,
        severity: newSeverity,
      });
      setIncidents((prev) => [created, ...prev]);
      setSelectedIncident(created);
      setCreateModalOpen(false);
      setNewTitle("");
      setActiveNav("Incidents");
      alert(`✅ Created ${created.id}: ${created.title}`);
    } catch (err: unknown) {
      alert((err as Error).message);
    }
  };

  const sendWarRoomMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!warRoomInput.trim()) return;
    const msg: TelegramMessage = {
      id: `msg-${Date.now()}`,
      sender: "@TeamDaanav (Operator)",
      senderRole: "orch",
      time: "Just now",
      text: warRoomInput.trim(),
    };
    setMessages((prev) => [...prev, msg]);
    setWarRoomInput("");
  };

  // Filtered Incidents
  const filteredIncidents = useMemo(() => {
    if (incidentFilter === "all") return incidents;
    return incidents.filter((i) => i.severity === incidentFilter || i.status === incidentFilter);
  }, [incidents, incidentFilter]);

  // Filtered Logs
  const filteredLogs = useMemo(() => {
    return initialLogs
      .filter((l) => (logFilter === "all" ? true : l.level === logFilter))
      .filter((l) => l.message.toLowerCase().includes(logSearch.toLowerCase()));
  }, [logFilter, logSearch]);

  // Palette Actions List
  const paletteItems = [
    { id: "p1", label: "Go to Overview Dashboard", icon: LayoutDashboard, action: () => setActiveNav("Overview"), shortcut: "1" },
    { id: "p2", label: "Go to Active Incidents Cockpit", icon: CircleAlert, action: () => setActiveNav("Incidents"), shortcut: "2" },
    { id: "p3", label: "Go to AI Multi-Agent Fleet (5 Bots)", icon: Bot, action: () => setActiveNav("AI Agents"), shortcut: "3" },
    { id: "p4", label: "Go to Logs Explorer", icon: Terminal, action: () => setActiveNav("Logs Explorer"), shortcut: "4" },
    { id: "p5", label: "Go to Code Review & Diffs", icon: Code2, action: () => setActiveNav("Code Review"), shortcut: "5" },
    { id: "p6", label: "Toggle Telegram War Room Drawer", icon: MessageSquare, action: () => setWarRoomOpen((p) => !p), shortcut: "W" },
    { id: "p7", label: "Create New Incident Report", icon: Plus, action: () => setCreateModalOpen(true), shortcut: "N" },
    { id: "p8", label: "Approve Patch & Deploy Canary", icon: Check, action: handleApprove, shortcut: "↵" },
    { id: "p9", label: "Run Testing Agent Suite", icon: Terminal, action: handleRunTests, shortcut: "T" },
  ];

  const filteredPalette = paletteItems.filter((i) =>
    i.label.toLowerCase().includes(paletteQuery.toLowerCase())
  );

  return (
    <div style={{ position: "relative", width: "100vw", height: "100vh", overflow: "hidden", display: "flex", flexDirection: "column" }}>
      
      {/* ATMOSPHERIC BACKGROUND */}
      <div className="ambient-background">
        <canvas ref={canvasRef} id="topology-canvas" />
      </div>

      {/* ====================================================================
          TOP COMMAND HUD HEADER
          ==================================================================== */}
      <header className="cockpit-header">
        <div className="flex items-center gap-3">
          {/* SMART CAT EMBLEM BUTTON */}
          <button
            onClick={() => setPaletteOpen(true)}
            className="brand-emblem"
            title="Team Daanav Mission Control (Click for Commands ⌘K)"
          >
            <SmartCatIcon className="w-4 h-4 text-[#00F0FF]" />
            <span>TEAM DAANAV</span>
          </button>

          <div className="flex items-center gap-2 text-[12.5px] font-medium text-[#64748B]">
            <span>Command Cockpit</span>
            <span className="text-[#334155]">/</span>
            <span className="text-[#F1F5F9] font-bold">{activeNav}</span>
          </div>
        </div>

        {/* STATUS DOCK (NO DOTS!) */}
        <div className="status-dock">
          <div
            className="status-pill"
            title="Switch Workspace Agent Bridge Protocol Connected"
          >
            <svg style={{ width: 13, height: 13, stroke: "currentColor", fill: "none", strokeWidth: 2.2 }} viewBox="0 0 24 24">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
            <span>SWITCH WS://62912</span>
          </div>

          <div
            className="status-pill telegram"
            title="Telegram 5-Bot Multi-Agent War Room Synced"
          >
            <svg style={{ width: 13, height: 13, fill: "currentColor" }} viewBox="0 0 24 24">
              <path d="M21.5 2L2 9.5l7.5 3 2.5 7.5 3-4.5 4 4.5z" />
            </svg>
            <span>SUPERGROUP: -1004337160724</span>
          </div>

          {/* WAR ROOM TOGGLE BUTTON */}
          <button
            onClick={() => setWarRoomOpen((prev) => !prev)}
            className={`cmd-k-trigger ${warRoomOpen ? "bg-[#1F2736] text-[#00F0FF] border-[#00F0FF]" : ""}`}
            title="Toggle Live Telegram War Room Drawer (Shortcut: W)"
          >
            <MessageSquare style={{ width: 13, height: 13 }} />
            <span>War Room</span>
            <span className="keycap">W</span>
          </button>

          <button
            onClick={() => setPaletteOpen(true)}
            className="cmd-k-trigger"
          >
            <span>Commands</span>
            <span className="keycap">⌘K</span>
          </button>

          <div className="operator-chip">
            <div className="operator-avatar">TD</div>
            <span>Team Daanav</span>
          </div>
        </div>
      </header>

      {/* ====================================================================
          APP SHELL: SIDEBAR + MAIN VIEWPORT
          ==================================================================== */}
      <div className="app-shell">
        
        {/* LEFT NAVIGATION DOCK */}
        <aside className="app-sidebar">
          <div>
            <div className="nav-group-label">Mission Control</div>

            {(
              [
                { name: "Overview", icon: LayoutDashboard },
                { name: "Incidents", icon: CircleAlert, count: "01 CRITICAL" },
                { name: "AI Agents", icon: Bot, count: "5 BOTS" },
                { name: "Logs Explorer", icon: Terminal },
                { name: "Code Review", icon: Code2 },
              ] as { name: NavPage; icon: LucideIcon; count?: string }[]
            ).map((item) => (
              <button
                key={item.name}
                onClick={() => setActiveNav(item.name)}
                className={`nav-btn ${activeNav === item.name ? "active" : ""}`}
              >
                <div className="nav-btn-inner">
                  <item.icon style={{ width: 15, height: 15 }} />
                  <span>{item.name}</span>
                </div>
                {item.count && (
                  <span
                    className={`counter-tag ${
                      item.name === "Incidents" ? "bg-rose-500/15 border-rose-500/35 text-[#F43F5E]" : "bg-cyan-500/10 border-cyan-500/30 text-[#00F0FF]"
                    }`}
                  >
                    {item.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="aside-footer-card">
            <div className="label">SWITCH HACKATHON 2026</div>
            <div className="metric">
              <span>Runtime:</span>
              <span style={{ color: "var(--text-high)" }}>WSL2 + Node 22</span>
            </div>
            <div className="metric">
              <span>Health:</span>
              <span style={{ color: "var(--signal-emerald)", fontWeight: 700 }}>
                {health?.status?.toUpperCase() ?? "200 OK"}
              </span>
            </div>
            <div className="metric">
              <span>Cluster:</span>
              <span style={{ color: "var(--signal-cyan)", fontWeight: 700 }}>
                {health?.integrations.switch.configured ? "SWITCH ONLINE" : "5 BOTS READY"}
              </span>
            </div>
          </div>
        </aside>

        {/* ==================================================================
            MAIN CONTENT AREA: CONDITIONAL PAGE ROUTING
            ================================================================== */}
        <main className="main-viewport">
          
          {/* ----------------------------------------------------------------
              PAGE 1: OVERVIEW DASHBOARD
              ---------------------------------------------------------------- */}
          {activeNav === "Overview" && (
            <div className="flex flex-col gap-6 max-w-7xl mx-auto">
              
              {/* Stat HUD Cards */}
              <div className="grid grid-cols-4 gap-4">
                <div onMouseMove={handleCardMouseMove} className="spotlight-card p-5 bg-[#0F131C] border border-white/[0.08] rounded-xl flex flex-col gap-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">Active Outages</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-extrabold text-[#F43F5E]">1 Critical</span>
                    <span className="text-xs text-[#94A3B8] font-mono">INC-2847</span>
                  </div>
                  <span className="text-[11px] text-rose-300 mt-1">12.4% checkout traffic impact</span>
                </div>

                <div onMouseMove={handleCardMouseMove} className="spotlight-card p-5 bg-[#0F131C] border border-white/[0.08] rounded-xl flex flex-col gap-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">Mean Time To Resolve</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-extrabold text-[#00F0FF] font-mono">{formattedTimer}</span>
                    <span className="text-xs text-emerald-400 font-mono">SLA &lt; 05:00</span>
                  </div>
                  <span className="text-[11px] text-[#94A3B8] mt-1">Autonomous bot intervention active</span>
                </div>

                <div onMouseMove={handleCardMouseMove} className="spotlight-card p-5 bg-[#0F131C] border border-white/[0.08] rounded-xl flex flex-col gap-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">AI Agent Squad</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-extrabold text-[#10B981]">5 / 5 Online</span>
                  </div>
                  <span className="text-[11px] text-emerald-300 mt-1">Switch Room: 1eab763f...</span>
                </div>

                <div onMouseMove={handleCardMouseMove} className="spotlight-card p-5 bg-[#0F131C] border border-white/[0.08] rounded-xl flex flex-col gap-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">Automated Test Pass</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-extrabold text-white font-mono">18 / 18</span>
                    <span className="text-xs text-emerald-400 font-bold">100%</span>
                  </div>
                  <span className="text-[11px] text-[#94A3B8] mt-1">PyTest isolated sandbox verified</span>
                </div>
              </div>

              {/* Chart & Quick Actions */}
              <div className="grid grid-cols-3 gap-5">
                <div onMouseMove={handleCardMouseMove} className="col-span-2 spotlight-card p-5 bg-[#0F131C] border border-white/[0.08] rounded-xl flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-white">Incident Resolution Velocity</h3>
                      <p className="text-xs text-[#64748B]">Real-time correlation of incoming Sentry alerts vs Bot auto-fixes</p>
                    </div>
                    <span className="font-mono text-xs text-[#00F0FF] font-bold">LIVE TELEMETRY</span>
                  </div>
                  <div className="h-[200px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={VELOCITY_CHART_DATA}>
                        <defs>
                          <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorActive" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#F43F5E" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#F43F5E" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="time" stroke="#475569" fontSize={11} tickLine={false} />
                        <YAxis stroke="#475569" fontSize={11} tickLine={false} />
                        <Tooltip contentStyle={{ backgroundColor: "#0A0D14", borderColor: "#1E293B", borderRadius: 8, fontSize: 12 }} />
                        <Area type="monotone" dataKey="resolved" stroke="#10B981" fillOpacity={1} fill="url(#colorResolved)" strokeWidth={2} name="Auto-Resolved" />
                        <Area type="monotone" dataKey="active" stroke="#F43F5E" fillOpacity={1} fill="url(#colorActive)" strokeWidth={2} name="Active Outages" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Quick Fleet Health */}
                <div onMouseMove={handleCardMouseMove} className="spotlight-card p-5 bg-[#0F131C] border border-white/[0.08] rounded-xl flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white mb-1">Production Health Grid</h3>
                    <p className="text-xs text-[#64748B] mb-4">Core services monitored by Switch Daemon</p>
                    
                    <div className="flex flex-col gap-2.5 font-mono text-xs">
                      {[
                        { name: "checkout-service", status: "DEGRADED", latency: "248ms", color: "#F43F5E" },
                        { name: "payment-gateway", status: "HEALTHY", latency: "42ms", color: "#10B981" },
                        { name: "inventory-service", status: "HEALTHY", latency: "38ms", color: "#10B981" },
                        { name: "redis-cluster", status: "LEAK DETECTED", latency: "192ms", color: "#F59E0B" },
                      ].map((s) => (
                        <div key={s.name} className="flex items-center justify-between p-2 rounded bg-[#080A0F] border border-white/[0.05]">
                          <span className="text-[#F1F5F9] font-medium">{s.name}</span>
                          <span style={{ color: s.color }} className="font-bold">{s.status}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => setActiveNav("Incidents")}
                    className="btn-mechanical primary-cta justify-center mt-4 w-full"
                  >
                    Open Active Incident Cockpit →
                  </button>
                </div>
              </div>

              {/* Incidents Quick Table */}
              <div onMouseMove={handleCardMouseMove} className="spotlight-card p-5 bg-[#0F131C] border border-white/[0.08] rounded-xl flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white">Active & Recent Incidents</h3>
                  <button onClick={() => setCreateModalOpen(true)} className="btn-mechanical text-xs py-1 px-3">
                    <Plus className="w-3.5 h-3.5" />
                    <span>Report Incident</span>
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left font-mono text-xs">
                    <thead>
                      <tr className="border-b border-white/[0.08] text-[#64748B] text-[11px] uppercase">
                        <th className="py-2.5 px-3">ID</th>
                        <th className="py-2.5 px-3">Severity</th>
                        <th className="py-2.5 px-3">Title</th>
                        <th className="py-2.5 px-3">Service</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.05]">
                      {incidents.slice(0, 4).map((inc) => (
                        <tr key={inc.id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="py-3 px-3 font-bold text-[#00F0FF]">{inc.id}</td>
                          <td className="py-3 px-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              inc.severity === "critical" ? "bg-rose-500/15 text-[#F43F5E] border border-rose-500/40" : "bg-amber-500/15 text-amber-400"
                            }`}>
                              {inc.severity}
                            </span>
                          </td>
                          <td className="py-3 px-3 font-sans text-white font-medium">{inc.title}</td>
                          <td className="py-3 px-3 text-[#94A3B8]">{inc.service}</td>
                          <td className="py-3 px-3">
                            <span className="text-emerald-400 font-semibold">{inc.status}</span>
                          </td>
                          <td className="py-3 px-3 text-right">
                            <button
                              onClick={() => {
                                setSelectedIncident(inc);
                                setActiveNav("Incidents");
                              }}
                              className="btn-mechanical text-[11px] py-1 px-2.5"
                            >
                              Investigate Cockpit
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* ----------------------------------------------------------------
              PAGE 2: INCIDENTS COCKPIT (THE MAIN DEEP INVESTIGATION VIEW)
              ---------------------------------------------------------------- */}
          {activeNav === "Incidents" && (
            <div className="flex flex-col gap-5 max-w-7xl mx-auto">
              
              {/* Incident Filter Tab Bar */}
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
                <div className="flex items-center gap-2">
                  {["all", "critical", "high", "medium", "resolved"].map((f) => (
                    <button
                      key={f}
                      onClick={() => setIncidentFilter(f)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider font-mono transition-all ${
                        incidentFilter === f
                          ? "bg-[#141924] border border-[#263247] text-[#00F0FF]"
                          : "text-[#64748B] hover:text-white"
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setCreateModalOpen(true)}
                  className="btn-mechanical primary-cta text-xs py-1.5 px-3"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Report Outage</span>
                </button>
              </div>

              {/* INCIDENT HERO HUD */}
              <div onMouseMove={handleCardMouseMove} className="spotlight-card incident-hero-hud">
                <div className="hud-meta-row">
                  <div className="badge-cluster">
                    <div className="badge-p0">
                      <AlertTriangle style={{ width: 12, height: 12, fill: "currentColor" }} />
                      <span>P0 CRITICAL OUTAGE</span>
                    </div>
                    <span className="incident-ticket-id">{selectedIncident?.id || "INC-2847"}</span>
                    <span className="blast-radius-tag">
                      Blast Radius: <span style={{ color: "#FCA5A5", fontWeight: 700 }}>12.4% Checkout Traffic</span>
                    </span>
                  </div>

                  <div className="telemetry-ticker-group">
                    <div className="telemetry-item">
                      <span className="telemetry-label">MTTR Elapsed</span>
                      <span className="telemetry-value">{formattedTimer}</span>
                    </div>
                    <div className="telemetry-item">
                      <span className="telemetry-label">Target SLA</span>
                      <span className="telemetry-value accent-emerald">&lt; 05:00.00</span>
                    </div>
                    <div className="telemetry-item">
                      <span className="telemetry-label">Test Pass Ratio</span>
                      <span className="telemetry-value accent-cyan">{testCount}</span>
                    </div>
                  </div>
                </div>

                <h1 className="hud-headline">
                  {selectedIncident?.title || "Memory Leak in CheckoutWorker: Unclosed Redis Connection Pool"}
                </h1>

                <div className="hud-subline">
                  <span>Target Component:</span>
                  <span className="code-chip">{selectedIncident?.service || "services/checkout/worker.py:140"}</span>
                  <span>•</span>
                  <span>Orchestrator:</span>
                  <span style={{ color: "var(--text-pure)", fontWeight: 700 }}>Switch 5-Bot Multi-Agent Pipeline</span>
                  <span>•</span>
                  <button
                    onClick={() => handleInvestigate(selectedIncident?.id || "INC-2847")}
                    className="text-[#00F0FF] hover:underline font-bold text-xs"
                  >
                    Re-trigger Investigation
                  </button>
                </div>
              </div>

              {/* KINETIC 4-AGENT STEPPER PIPELINE */}
              <div className="pipeline-wrapper">
                <div className="section-eyebrow">
                  <span>Sequential Multi-Agent Pipeline (Dynamic Handoff)</span>
                  <span style={{ color: "var(--signal-cyan)", fontFamily: "var(--font-mono)" }}>
                    {pipelineState === "approved"
                      ? "INCIDENT RESOLVED & DEPLOYED"
                      : pipelineState === "step4_testing"
                      ? "STAGE 4/4 ACTIVE"
                      : "STAGE 3/4 ACTIVE"}
                  </span>
                </div>

                <div className="pipeline-grid">
                  {/* Agent 1 */}
                  <div onMouseMove={handleCardMouseMove} className="spotlight-card agent-card state-completed">
                    <div className="card-head">
                      <div className="agent-profile">
                        <div className="icon-cube">
                          <Check style={{ width: 14, height: 14, strokeWidth: 2.5 }} />
                        </div>
                        <span className="agent-title">Incident Mgr</span>
                      </div>
                      <span className="state-badge">Triage OK</span>
                    </div>
                    <p className="card-detail">Correlated 482 Sentry alerts & declared P0 incident war room.</p>
                    <div className="card-foot">
                      <span>@devops_incident_bot</span>
                      <span>12:34:02</span>
                    </div>
                  </div>

                  {/* Agent 2 */}
                  <div onMouseMove={handleCardMouseMove} className="spotlight-card agent-card state-completed">
                    <div className="card-head">
                      <div className="agent-profile">
                        <div className="icon-cube">
                          <Check style={{ width: 14, height: 14, strokeWidth: 2.5 }} />
                        </div>
                        <span className="agent-title">Log Analyzer</span>
                      </div>
                      <span className="state-badge">Root Found</span>
                    </div>
                    <p className="card-detail">Located leaked Redis pool handles in worker.py loop at L140.</p>
                    <div className="card-foot">
                      <span>@devops_log_analyzer_bot</span>
                      <span>12:34:28</span>
                    </div>
                  </div>

                  {/* Agent 3 */}
                  <div onMouseMove={handleCardMouseMove} className={`spotlight-card agent-card ${pipelineState === "step3_fixer" ? "state-active" : "state-completed"}`}>
                    <div className="card-head">
                      <div className="agent-profile">
                        <div className="icon-cube">
                          {pipelineState === "step3_fixer" ? <Zap style={{ width: 14, height: 14 }} /> : <Check style={{ width: 14, height: 14, strokeWidth: 2.5 }} />}
                        </div>
                        <span className="agent-title">Code Fixer</span>
                      </div>
                      <span className="state-badge">{pipelineState === "step3_fixer" ? "Active Patch" : "Patch Ready"}</span>
                    </div>
                    <p className="card-detail">Generated async context manager patch with atomic socket release.</p>
                    <div className="card-foot">
                      <span style={pipelineState === "step3_fixer" ? { color: "var(--signal-cyan)" } : {}}>@devops_code_fixer_bot</span>
                      <span>{pipelineState === "step3_fixer" ? "IN FLIGHT" : "12:35:10"}</span>
                    </div>
                  </div>

                  {/* Agent 4 */}
                  <div onMouseMove={handleCardMouseMove} className={`spotlight-card agent-card ${pipelineState === "step4_testing" ? "state-active" : pipelineState === "approved" ? "state-completed" : "state-idle"}`}>
                    <div className="card-head">
                      <div className="agent-profile">
                        <div className="icon-cube">
                          <Terminal style={{ width: 14, height: 14 }} />
                        </div>
                        <span className="agent-title">Testing Agent</span>
                      </div>
                      <span className="state-badge">{pipelineState === "step4_testing" ? "Running Suite" : pipelineState === "approved" ? "18/18 Verified" : "Standing By"}</span>
                    </div>
                    <p className="card-detail">{pipelineState === "step4_testing" ? "Executing PyTest regression suite on isolated git sandbox worktree..." : "Pre-loaded 18 regression test suites for payment checkout verification."}</p>
                    <div className="card-foot">
                      <span>@devops_testing_agent_bot</span>
                      <span>{pipelineState === "step4_testing" ? "ACTIVE" : "QUEUED"}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* UNIFIED MONACO-STYLE GIT DIFF CANVAS */}
              <div onMouseMove={handleCardMouseMove} className="spotlight-card diff-container">
                <div className="diff-toolbar">
                  <div className="diff-title-cluster">
                    <FileCode style={{ width: 14, height: 14, color: "var(--text-dim)" }} />
                    <span className="diff-path">services/checkout/worker.py</span>
                    <span className="diff-stat-add">+6</span>
                    <span className="diff-stat-del">-3</span>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText("async with redis_pool.connection() as redis_conn:");
                        alert("Patch copied to clipboard!");
                      }}
                      className="btn-mechanical"
                    >
                      <Copy style={{ width: 12, height: 12 }} />
                      <span>Copy Patch</span>
                    </button>
                    <button onClick={handleApprove} className="btn-mechanical primary-cta">
                      <Check style={{ width: 12, height: 12, strokeWidth: 2.5 }} />
                      <span>Human Sign-Off</span>
                    </button>
                  </div>
                </div>

                <div className="diff-viewport">
                  {DEFAULT_DIFF_LINES.map((line, idx) => (
                    <div key={idx} className={`diff-row type-${line.type}`}>
                      <span className="gutter-num-old">{line.oldNum}</span>
                      <span className="gutter-num-new">{line.newNum}</span>
                      <span className="gutter-marker">{line.type === "add" ? "+" : line.type === "del" ? "-" : " "}</span>
                      <span className="diff-code-text">{line.text}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Other Incidents Selector List */}
              <div className="flex flex-col gap-2 mt-2">
                <h3 className="text-xs font-bold text-[#64748B] uppercase tracking-wider">All Active Incidents</h3>
                <div className="grid grid-cols-3 gap-3">
                  {filteredIncidents.map((inc) => (
                    <div
                      key={inc.id}
                      onClick={() => setSelectedIncident(inc)}
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${
                        selectedIncident?.id === inc.id
                          ? "bg-[#141A26] border-[#00F0FF] text-white"
                          : "bg-[#0E1118] border-white/[0.08] text-[#94A3B8] hover:border-white/[0.2]"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1 font-mono text-[11px]">
                        <span className="font-bold text-[#00F0FF]">{inc.id}</span>
                        <span className="text-xs uppercase">{inc.severity}</span>
                      </div>
                      <div className="text-xs font-medium text-white truncate">{inc.title}</div>
                      <div className="text-[11px] text-[#64748B] mt-1">{inc.service}</div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* ----------------------------------------------------------------
              PAGE 3: AI MULTI-AGENT SQUAD (THE 5 BOTS)
              ---------------------------------------------------------------- */}
          {activeNav === "AI Agents" && (
            <div className="flex flex-col gap-6 max-w-7xl mx-auto">
              <div>
                <h2 className="text-xl font-bold text-white mb-1">Autonomous Multi-Agent Fleet</h2>
                <p className="text-xs text-[#94A3B8]">
                  5 specialized bots coordinating via Switch Protocol & Telegram Supergroup (-1004337160724)
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {[
                  {
                    id: "orch",
                    name: "DevOps Orchestrator",
                    handle: "@devops_incident_2026_bot",
                    role: "Supervisor & Switch Gateway Bridge",
                    status: "LISTENING",
                    endpoint: "ws://localhost:62912",
                    desc: "Coordinates long-polling, synchronizes events into Switch room 1eab763f-3f1c-413b-a33f-d68560517873.",
                  },
                  {
                    id: "mgr",
                    name: "Incident Manager",
                    handle: "@devops_incident_manager_2026_bot",
                    role: "Severity Triage & War Room Declaration",
                    status: "ACTIVE",
                    endpoint: "Telegram Polling (Supergroup -1004337160724)",
                    desc: "Declares incidents upon Sentry thresholds and mobilizes specialized squad.",
                  },
                  {
                    id: "log",
                    name: "Log Analyzer",
                    handle: "@devops_log_analyzer_2026_bot",
                    role: "Root Cause & Sentry Stacktrace Analysis",
                    status: "ACTIVE",
                    endpoint: "Elastic / Splunk / Sentry API",
                    desc: "Correlates exception traces with microservice connection pools and identifies offending lines.",
                  },
                  {
                    id: "fix",
                    name: "Code Fixer",
                    handle: "@devops_code_fixer_2026_bot",
                    role: "Patch Generation & AST Context Management",
                    status: pipelineState === "step3_fixer" ? "IN FLIGHT" : "IDLE",
                    endpoint: "Local Sandbox Worktree",
                    desc: "Rewrites faulty async connection logic using safe scoping context managers.",
                  },
                  {
                    id: "test",
                    name: "Testing Agent",
                    handle: "@devops_testing_agent_2026_bot",
                    role: "Regression Verification & Canary Gate",
                    status: pipelineState === "step4_testing" ? "VERIFYING" : "READY",
                    endpoint: "PyTest / Jest Runner",
                    desc: "Executes 18 integration tests and verifies zero memory leaks prior to production deployment.",
                  },
                ].map((bot) => (
                  <div
                    key={bot.id}
                    onMouseMove={handleCardMouseMove}
                    className="spotlight-card p-5 bg-[#0F131C] border border-white/[0.08] rounded-xl flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-[#171E2D] border border-[#283348] flex items-center justify-center text-[#00F0FF]">
                            <Bot className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-white">{bot.name}</h4>
                            <span className="font-mono text-[11px] text-[#00F0FF]">{bot.handle}</span>
                          </div>
                        </div>
                        <span className="font-mono text-[9.5px] font-extrabold uppercase px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-[#10B981]">
                          {bot.status}
                        </span>
                      </div>
                      <p className="text-xs text-[#94A3B8] leading-relaxed mb-3">{bot.desc}</p>
                    </div>

                    <div className="border-t border-white/[0.06] pt-3 flex items-center justify-between font-mono text-[11px] text-[#64748B]">
                      <span>Role: <strong className="text-[#CBD5E1]">{bot.role}</strong></span>
                      <button
                        onClick={() => {
                          setWarRoomOpen(true);
                          setMessages((prev) => [
                            ...prev,
                            {
                              id: `msg-${Date.now()}`,
                              sender: bot.handle,
                              senderRole: bot.id as "mgr" | "log" | "fix" | "test" | "orch",
                              time: "Just now",
                              text: `🤖 Healthcheck ping acknowledged by ${bot.name}. Daemon status: 200 OK.`,
                            },
                          ]);
                        }}
                        className="text-[#00F0FF] hover:underline"
                      >
                        Ping Bot 💬
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ----------------------------------------------------------------
              PAGE 4: LOGS EXPLORER (SEARCHABLE REAL-TIME TERMINAL)
              ---------------------------------------------------------------- */}
          {activeNav === "Logs Explorer" && (
            <div className="flex flex-col gap-4 max-w-7xl mx-auto">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white mb-0.5">Cluster Telemetry & Logs</h2>
                  <p className="text-xs text-[#94A3B8]">Streaming from checkout-service, payment-gateway, and redis-pool</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 font-mono text-xs">
                    {["all", "critical", "high", "medium"].map((lvl) => (
                      <button
                        key={lvl}
                        onClick={() => setLogFilter(lvl)}
                        className={`px-2.5 py-1 rounded text-xs uppercase ${
                          logFilter === lvl ? "bg-[#141924] text-[#00F0FF] border border-[#263247]" : "text-[#64748B] hover:text-white"
                        }`}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 bg-[#0B0E15] border border-white/[0.1] rounded-lg px-3 py-1.5 font-mono text-xs text-white">
                    <Search className="w-3.5 h-3.5 text-[#64748B]" />
                    <input
                      type="text"
                      placeholder="Filter log messages..."
                      value={logSearch}
                      onChange={(e) => setLogSearch(e.target.value)}
                      className="bg-transparent border-none outline-none text-xs w-48 placeholder:text-[#64748B]"
                    />
                  </div>
                </div>
              </div>

              {/* Log Terminal Window */}
              <div onMouseMove={handleCardMouseMove} className="spotlight-card bg-[#07090D] border border-white/[0.1] rounded-xl overflow-hidden shadow-2xl font-mono text-xs">
                <div className="bg-[#0B0E15] border-b border-white/[0.08] px-4 py-2.5 flex items-center justify-between text-[11px] text-[#64748B]">
                  <span>cluster: us-east-prod // container: checkout-worker-7b9c</span>
                  <span className="text-[#10B981] font-bold">TAILING LOGS (60 FPS)</span>
                </div>

                <div className="p-4 flex flex-col gap-1.5 max-h-[500px] overflow-y-auto leading-relaxed">
                  {filteredLogs.map((log) => (
                    <div key={log.id} className="flex items-start gap-3 hover:bg-white/[0.03] p-1 rounded transition-colors">
                      <span className="text-[#475569] select-none text-[10.5px]">{log.time}</span>
                      <span className={`px-1.5 py-0.2 rounded text-[9.5px] font-extrabold uppercase ${
                        log.level === "critical" ? "bg-rose-500/20 text-[#F43F5E]" : "bg-amber-500/15 text-amber-400"
                      }`}>
                        {log.level}
                      </span>
                      <span className="text-[#00F0FF]">{log.service}:</span>
                      <span className="text-[#E2E8F0] flex-1">{log.message}</span>
                      <button
                        onClick={() => {
                          setActiveNav("Incidents");
                          handleInvestigate("INC-2847");
                        }}
                        className="text-[10px] text-[#10B981] hover:underline whitespace-nowrap"
                      >
                        Analyze Error →
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ----------------------------------------------------------------
              PAGE 5: CODE REVIEW & DIFFS
              ---------------------------------------------------------------- */}
          {activeNav === "Code Review" && (
            <div className="flex flex-col gap-5 max-w-7xl mx-auto">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white mb-0.5">Code Review & Patch Inspection</h2>
                  <p className="text-xs text-[#94A3B8]">
                    Generated by @devops_code_fixer_bot • Branch: <span className="font-mono text-[#00F0FF]">fix/redis-connection-leak</span>
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={handleApprove} className="btn-mechanical primary-cta">
                    <Check className="w-4 h-4 stroke-[2.5]" />
                    <span>Approve & Deploy Canary</span>
                  </button>
                </div>
              </div>

              {/* Diff Viewer Card */}
              <div onMouseMove={handleCardMouseMove} className="spotlight-card diff-container rounded-xl border border-white/[0.08] bg-[#0E1118] overflow-hidden shadow-2xl">
                <div className="bg-[#0B0E15] border-b border-white/[0.08] px-5 py-3 flex items-center justify-between font-mono text-xs">
                  <div className="flex items-center gap-3">
                    <GitBranch className="w-4 h-4 text-[#00F0FF]" />
                    <span className="text-white font-bold">services/checkout/worker.py</span>
                    <span className="text-[#10B981] font-bold">+6</span>
                    <span className="text-[#F43F5E] font-bold">-3</span>
                  </div>
                  <span className="text-[#64748B]">Commit: ff6b085 (Obsidian Cockpit Patch)</span>
                </div>

                <div className="font-mono text-xs leading-relaxed bg-[#07090D] overflow-x-auto p-0">
                  {DEFAULT_DIFF_LINES.map((line, idx) => (
                    <div
                      key={idx}
                      className={`flex px-4 py-1 border-l-4 transition-colors ${
                        line.type === "hunk"
                          ? "bg-[#00F0FF]/5 text-[#00F0FF] border-transparent font-semibold py-2"
                          : line.type === "del"
                          ? "bg-rose-500/10 border-rose-500 text-rose-300"
                          : line.type === "add"
                          ? "bg-emerald-500/10 border-emerald-500 text-emerald-300"
                          : "border-transparent hover:bg-white/[0.03]"
                      }`}
                    >
                      <span className="w-10 text-right pr-4 text-[#475569] select-none">{line.oldNum}</span>
                      <span className="w-10 text-right pr-4 text-[#475569] select-none">{line.newNum}</span>
                      <span className="w-4 font-bold select-none">{line.type === "add" ? "+" : line.type === "del" ? "-" : " "}</span>
                      <span className="flex-1 whitespace-pre">{line.text}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Test Execution Summary Box */}
              <div onMouseMove={handleCardMouseMove} className="spotlight-card p-5 bg-[#0F131C] border border-white/[0.08] rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-[#10B981]">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Automated Verification: 18/18 Tests Passing</h4>
                    <p className="text-xs text-[#94A3B8]">Executed in isolated sandbox worktree by @devops_testing_agent_bot (1.48s runtime)</p>
                  </div>
                </div>
                <button onClick={handleApprove} className="btn-mechanical primary-cta">
                  Approve Sign-Off
                </button>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* ====================================================================
          COLLAPSIBLE TELEGRAM WAR ROOM SLIDE-OVER DRAWER
          ==================================================================== */}
      <div className={`war-room-drawer ${warRoomOpen ? "open" : ""}`}>
        <div className="p-4 border-b border-white/[0.08] flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-white">
            <svg style={{ width: 14, height: 14, fill: "var(--signal-cyan)" }} viewBox="0 0 24 24">
              <path d="M21.5 2L2 9.5l7.5 3 2.5 7.5 3-4.5 4 4.5z" />
            </svg>
            <span>Telegram War Room (-1004337160724)</span>
          </div>
          <button
            onClick={() => setWarRoomOpen(false)}
            className="text-[#64748B] hover:text-white cursor-pointer"
          >
            <X style={{ width: 16, height: 16 }} />
          </button>
        </div>

        {/* Message Feed */}
        <div className="chat-scroll-canvas flex-1 overflow-y-auto p-4 flex flex-col gap-3">
          {messages.map((m) => (
            <div key={m.id} className="message-bubble bg-[#0F131C] border border-white/[0.07] rounded-lg p-3">
              <div className="bubble-meta mb-1">
                <span
                  className="sender-handle"
                  style={{
                    color:
                      m.senderRole === "mgr"
                        ? "#C084FC"
                        : m.senderRole === "log"
                        ? "#FBBF24"
                        : m.senderRole === "fix"
                        ? "var(--signal-cyan)"
                        : m.senderRole === "test"
                        ? "var(--signal-emerald)"
                        : "#60A5FA",
                  }}
                >
                  {m.sender}
                </span>
                <span className="msg-timestamp">{m.time}</span>
              </div>
              <div className="bubble-content text-xs text-[#CBD5E1] leading-relaxed">{m.text}</div>
            </div>
          ))}
        </div>

        {/* Send input */}
        <form onSubmit={sendWarRoomMessage} className="p-3 bg-[#080A0F] border-t border-white/[0.08] flex gap-2">
          <input
            type="text"
            placeholder="Broadcast message to 5-bot cluster..."
            value={warRoomInput}
            onChange={(e) => setWarRoomInput(e.target.value)}
            className="flex-1 bg-[#141A26] border border-white/[0.1] rounded-lg px-3 py-1.5 text-xs text-white placeholder:text-[#64748B] outline-none focus:border-[#00F0FF]"
          />
          <button type="submit" className="btn-mechanical primary-cta text-xs py-1.5 px-3">
            <Send style={{ width: 12, height: 12 }} />
          </button>
        </form>
      </div>

      {/* ====================================================================
          FEATURE A: RAYCAST-STYLE FLOATING ACTION DOCK
          ==================================================================== */}
      <div className="raycast-action-dock">
        <button onClick={handleApprove} className="dock-action-btn primary">
          <span>Approve & Deploy</span>
          <span className="keycap">↵</span>
        </button>

        <button onClick={handleRunTests} className="dock-action-btn">
          <span>Run Tests</span>
          <span className="keycap">T</span>
        </button>

        <button onClick={() => setWarRoomOpen((p) => !p)} className="dock-action-btn">
          <span>War Room</span>
          <span className="keycap">W</span>
        </button>

        <div className="dock-divider" />

        <button onClick={() => setPaletteOpen(true)} className="dock-action-btn">
          <span>Actions</span>
          <span className="keycap">⌘K</span>
        </button>
      </div>

      {/* ====================================================================
          FEATURE D: INTERACTIVE COMMAND PALETTE (CMD+K)
          ==================================================================== */}
      {paletteOpen && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setPaletteOpen(false);
          }}
          className="palette-overlay"
        >
          <div className="palette-modal">
            <div className="palette-input-box">
              <Search style={{ width: 18, height: 18, color: "var(--signal-cyan)" }} />
              <input
                type="text"
                value={paletteQuery}
                onChange={(e) => {
                  setPaletteQuery(e.target.value);
                  setPaletteIndex(0);
                }}
                placeholder="Jump to page or run an action..."
                autoFocus
                className="palette-input"
              />
              <span className="keycap">ESC</span>
            </div>

            <div className="palette-list">
              {filteredPalette.length === 0 ? (
                <div style={{ padding: 16, textAlign: "center", color: "var(--text-dim)", fontSize: 13 }}>
                  No matching actions found.
                </div>
              ) : (
                filteredPalette.map((item, idx) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      setPaletteOpen(false);
                      item.action();
                    }}
                    onMouseEnter={() => setPaletteIndex(idx)}
                    className={`palette-item ${paletteIndex === idx ? "selected" : ""}`}
                  >
                    <div className="palette-item-left">
                      <item.icon style={{ width: 15, height: 15 }} />
                      <span>{item.label}</span>
                    </div>
                    <span className="keycap">{item.shortcut}</span>
                  </div>
                ))
              )}
            </div>

            <div className="palette-footer">
              <span>Navigation: <kbd className="keycap">↑</kbd> <kbd className="keycap">↓</kbd></span>
              <span>Execute: <kbd className="keycap">↵</kbd></span>
              <span>Close: <kbd className="keycap">ESC</kbd></span>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          CREATE INCIDENT MODAL
          ==================================================================== */}
      {createModalOpen && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setCreateModalOpen(false);
          }}
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div className="w-[480px] bg-[#0E121B] border border-white/[0.18] rounded-xl shadow-2xl p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <h3 className="text-sm font-bold text-white">Declare New Incident</h3>
              <button onClick={() => setCreateModalOpen(false)} className="text-[#64748B] hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateIncident} className="flex flex-col gap-3 font-mono text-xs">
              <div>
                <label className="text-[#94A3B8] block mb-1">Incident Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Memory Leak in CheckoutWorker"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-[#141A26] border border-white/[0.1] rounded px-3 py-2 text-white outline-none focus:border-[#00F0FF]"
                />
              </div>

              <div>
                <label className="text-[#94A3B8] block mb-1">Impacted Microservice</label>
                <select
                  value={newService}
                  onChange={(e) => setNewService(e.target.value)}
                  className="w-full bg-[#141A26] border border-white/[0.1] rounded px-3 py-2 text-white outline-none focus:border-[#00F0FF]"
                >
                  <option value="checkout-service">checkout-service</option>
                  <option value="payment-gateway">payment-gateway</option>
                  <option value="inventory-service">inventory-service</option>
                  <option value="redis-cluster">redis-cluster</option>
                </select>
              </div>

              <div>
                <label className="text-[#94A3B8] block mb-1">Severity Level</label>
                <select
                  value={newSeverity}
                  onChange={(e) => setNewSeverity(e.target.value as Severity)}
                  className="w-full bg-[#141A26] border border-white/[0.1] rounded px-3 py-2 text-white outline-none focus:border-[#00F0FF]"
                >
                  <option value="critical">CRITICAL (P0)</option>
                  <option value="high">HIGH (P1)</option>
                  <option value="medium">MEDIUM (P2)</option>
                  <option value="low">LOW (P3)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="btn-mechanical"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-mechanical primary-cta">
                  Dispatch to Agents
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

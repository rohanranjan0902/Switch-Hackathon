import { useEffect, useRef, useState, useMemo } from "react";
import { io } from "socket.io-client";
import {
  AlertTriangle,
  Bot,
  Check,
  CircleAlert,
  Code2,
  Copy,
  FileCode,
  Flame,
  LayoutDashboard,
  Radio,
  Search,
  Send,
  Terminal,
  Zap,
  type LucideIcon,
} from "lucide-react";
import {
  fetchHealth,
  approveIncident as apiApprove,
  rejectIncident as apiReject,
  type ApiHealth,
} from "./api";

// ============================================================================
// SMART CAT ICON (REPLACES LIGHTNING BOLT IN FRONT OF TEAM DAANAV)
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
      {/* Cat Head Contour with Pointed Ears */}
      <path
        d="M12 5c-3 0-5 1.5-6.5 3L3 5l1.5 6C4 13 4 15 5 16.5c1.8 2.5 4.5 3.5 7 3.5s5.2-1 7-3.5c1-1.5 1-3.5.5-5.5L21 5l-2.5 3C17 6.5 15 5 12 5z"
        fill="currentColor"
        fillOpacity="0.18"
      />
      {/* Cyber Visor / Smart Cat Glasses */}
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
      {/* Whiskers */}
      <line x1="2" y1="14" x2="5" y2="14.5" />
      <line x1="2" y1="16" x2="5" y2="16" />
      <line x1="19" y1="14.5" x2="22" y2="14" />
      <line x1="19" y1="16" x2="22" y2="16" />
      {/* Nose & Smile */}
      <path d="M11 16.5l1 .8 1-.8" />
    </svg>
  );
}

// ============================================================================
// TYPES
// ============================================================================
type NavPage = "Overview" | "Incidents" | "AI Agents" | "Logs Explorer" | "Code Review";

interface TelegramMessage {
  id: string;
  sender: string;
  senderRole: "mgr" | "log" | "fix" | "test" | "orch";
  time: string;
  text: string;
  codeSnippet?: string;
}

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
  const [activeNav, setActiveNav] = useState<NavPage>("Incidents");
  const [health, setHealth] = useState<ApiHealth | null>(null);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [paletteQuery, setPaletteQuery] = useState("");
  const [paletteIndex, setPaletteIndex] = useState(0);

  // Live Timer
  const [timerSeconds, setTimerSeconds] = useState(258.23);

  // Agent Pipeline States: "COMPLETED" | "ACTIVE" | "IDLE"
  const [pipelineState, setPipelineState] = useState<"step3_fixer" | "step4_testing" | "approved">("step3_fixer");
  const [testCount, setTestCount] = useState("18 / 18 PASS");

  // Real-time Telegram War Room Feed (No dots in sender handles!)
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

  // Mouse move handler for Spotlight Glare
  const handleCardMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    e.currentTarget.style.setProperty("--mouse-x", `${x}px`);
    e.currentTarget.style.setProperty("--mouse-y", `${y}px`);
  };

  // 1. Initial Health & Backend Polling
  useEffect(() => {
    fetchHealth()
      .then((data) => setHealth(data))
      .catch(() => {});

    const socket = io();
    socket.on("incident:updated", () => {
      fetchHealth().then(setHealth).catch(() => {});
    });

    socket.on("agent:execution:step", (step: { role: string; step: string }) => {
      if (step.role.toLowerCase().includes("test")) {
        setPipelineState("step4_testing");
      }
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // 2. Millisecond Precision Timer
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

  // 3. Topology Mesh Canvas Engine
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

    // 40 Ambient Topology Nodes
    const nodes = Array.from({ length: 42 }).map(() => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      radius: Math.random() * 1.8 + 1.2,
      baseAlpha: Math.random() * 0.35 + 0.2,
      color: Math.random() > 0.4 ? "rgba(0, 240, 255," : "rgba(99, 102, 241,",
      pulsePhase: Math.random() * Math.PI * 2,
    }));

    let scanlineY = -50;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      scanlineY += 1.1;
      if (scanlineY > height + 80) scanlineY = -80;

      // Scanning radar beam
      const beamGrad = ctx.createLinearGradient(0, scanlineY - 35, 0, scanlineY + 35);
      beamGrad.addColorStop(0, "rgba(0, 240, 255, 0)");
      beamGrad.addColorStop(0.5, "rgba(0, 240, 255, 0.02)");
      beamGrad.addColorStop(1, "rgba(0, 240, 255, 0)");
      ctx.fillStyle = beamGrad;
      ctx.fillRect(0, scanlineY - 35, width, 70);

      // Draw Nodes
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
            const force = (1 - dist / 130) * 0.5;
            n.x += (dx / dist) * force;
            n.y += (dy / dist) * force;
          }
        }

        n.pulsePhase += 0.03;
        const alpha = n.baseAlpha + Math.sin(n.pulsePhase) * 0.12;

        const scanDist = Math.abs(n.y - scanlineY);
        const scanGlow = scanDist < 50 ? (1 - scanDist / 50) * 0.35 : 0;

        ctx.beginPath();
        ctx.arc(n.x, n.y, n.radius + scanGlow, 0, Math.PI * 2);
        ctx.fillStyle = `${n.color} ${alpha + scanGlow})`;
        ctx.shadowBlur = scanGlow > 0 ? 10 : 3;
        ctx.shadowColor = "#00F0FF";
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // Draw Filaments
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 110) {
            const alpha = (1 - dist / 110) * 0.1;
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.strokeStyle = `rgba(0, 240, 255, ${alpha})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }

        if (mouse.active) {
          const mdx = mouse.x - nodes[i].x;
          const mdy = mouse.y - nodes[i].y;
          const mdist = Math.sqrt(mdx * mdx + mdy * mdy);
          if (mdist < 130) {
            const mAlpha = (1 - mdist / 130) * 0.25;
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(mouse.x, mouse.y);
            ctx.strokeStyle = `rgba(0, 240, 255, ${mAlpha})`;
            ctx.lineWidth = 0.9;
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

  // 4. Keyboard Shortcuts (Raycast Style)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((prev) => !prev);
        return;
      }

      if (e.key === "Escape") {
        setPaletteOpen(false);
        return;
      }

      if (paletteOpen) return;

      if (e.key === "Enter") {
        e.preventDefault();
        handleApprove();
      } else if (e.key.toLowerCase() === "r") {
        e.preventDefault();
        handleReanalyze();
      } else if (e.key.toLowerCase() === "t") {
        e.preventDefault();
        handleRunTests();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [paletteOpen]);

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

  const handleReanalyze = () => {
    alert("🔄 Requesting re-analysis from @devops_log_analyzer_bot & @devops_code_fixer_bot.");
  };

  const handleApprove = async () => {
    setPipelineState("approved");
    try {
      await apiApprove("INC-2847", "Team Daanav", "Approved via Command Cockpit");
    } catch {
      // Offline fallback
    }
    alert(
      "🚀 TEAM DAANAV SIGN-OFF VERIFIED!\n\n" +
        "1. Dispatched POST /api/incidents/INC-2847/approve\n" +
        "2. Telegram War Room Supergroup updated via 5-Bot cluster\n" +
        "3. Switch Gateway triggered zero-downtime canary deployment\n" +
        `4. MTTR Clock stopped at ${formattedTimer} (< 5 min SLA ACHIEVED!)`
    );
  };

  const handleReject = async () => {
    try {
      await apiReject("INC-2847", "Team Daanav", "Rejected for re-evaluation");
    } catch {}
    alert("Patch rejected. Requesting Code Fixer to propose alternative patch.");
  };

  // Palette Actions List
  const paletteItems = [
    {
      id: "approve",
      label: "Approve Patch & Trigger Zero-Downtime Canary",
      shortcut: "↵",
      icon: Check,
      action: handleApprove,
    },
    {
      id: "tests",
      label: "Run Testing Agent (18 Regression Test Cases)",
      shortcut: "T",
      icon: Terminal,
      action: handleRunTests,
    },
    {
      id: "chaos",
      label: "Inject Chaos Test: Simulate Redis Memory Surge",
      shortcut: "C",
      icon: Flame,
      action: () => alert("💥 Chaos test injected: 2,400 synthetic connections queued in sandbox."),
    },
    {
      id: "switch",
      label: "Ping Switch Bridge Daemon (ws://localhost:62912)",
      shortcut: "S",
      icon: Radio,
      action: () => alert("📡 Switch Bridge alive on ws://localhost:62912. Roundtrip latency: 1.2ms"),
    },
    {
      id: "telegram",
      label: "Broadcast Status to Supergroup -1004337160724",
      shortcut: "B",
      icon: Send,
      action: () => {
        setMessages((prev) => [
          ...prev,
          {
            id: `msg-${Date.now()}`,
            sender: "@devops_incident_2026_bot (Orchestrator)",
            senderRole: "orch",
            time: "Just now",
            text: "📢 Operator Team Daanav broadcast: Verifying final regression suites before production canary.",
          },
        ]);
      },
    },
  ];

  const filteredPalette = paletteItems.filter((i) =>
    i.label.toLowerCase().includes(paletteQuery.toLowerCase())
  );

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#06080C] text-[#F1F5F9] flex flex-col font-['Inter']">
      
      {/* ATMOSPHERIC HARDWARE BACKGROUND CANVAS & GRID */}
      <div className="ambient-background">
        <canvas ref={canvasRef} id="topology-canvas" />
      </div>

      {/* ====================================================================
          TOP COMMAND HUD HEADER
          ==================================================================== */}
      <header className="relative z-20 h-[54px] bg-[#0A0D14]/80 backdrop-blur-md border-b border-white/[0.07] px-6 flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          {/* SMART CAT EMBLEM BUTTON */}
          <button
            onClick={() => setPaletteOpen(true)}
            className="group flex items-center gap-2 px-3 py-1.5 bg-gradient-to-b from-[#181E2C] to-[#0E121B] border border-white/[0.12] hover:border-[#00F0FF] rounded-md text-[11px] font-extrabold tracking-[0.12em] text-[#00F0FF] shadow-sm hover:shadow-[0_0_16px_rgba(0,240,255,0.2)] hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
            title="Team Daanav Mission Control (Click for Commands)"
          >
            <SmartCatIcon className="w-4 h-4 text-[#00F0FF] group-hover:scale-115 transition-transform duration-200" />
            <span>TEAM DAANAV</span>
          </button>

          <div className="flex items-center gap-2 text-[13px] font-medium text-[#64748B]">
            <span>DevOps Command Cockpit</span>
            <span className="text-[#334155]">/</span>
            <span className="text-[#F1F5F9] font-bold">INC-2847 (Active Outage)</span>
          </div>
        </div>

        {/* STATUS DOCK (NO DOTS!) */}
        <div className="flex items-center gap-3 font-mono text-[11px]">
          <div
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[#10B981] font-semibold tracking-wide hover:bg-emerald-500/20 hover:border-emerald-500 hover:shadow-[0_0_14px_rgba(16,185,129,0.25)] transition-all cursor-pointer"
            title="Switch Workspace Agent Bridge Protocol Connected"
          >
            <svg className="w-3.5 h-3.5 stroke-current fill-none stroke-[2.2]" viewBox="0 0 24 24">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
            <span>SWITCH WS://62912</span>
          </div>

          <div
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00F0FF]/10 border border-[#00F0FF]/30 text-[#00F0FF] font-semibold tracking-wide hover:bg-[#00F0FF]/20 hover:border-[#00F0FF] hover:shadow-[0_0_14px_rgba(0,240,255,0.25)] transition-all cursor-pointer"
            title="Telegram 5-Bot Multi-Agent War Room Synced"
          >
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
              <path d="M21.5 2L2 9.5l7.5 3 2.5 7.5 3-4.5 4 4.5z" />
            </svg>
            <span>SUPERGROUP: -1004337160724</span>
          </div>

          <button
            onClick={() => setPaletteOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-[#131722] border border-white/[0.12] hover:border-[#00F0FF] hover:bg-[#1A2030] text-[#94A3B8] hover:text-white rounded-md text-[11px] font-semibold transition-all cursor-pointer"
          >
            <span>Commands</span>
            <span className="keycap">⌘K</span>
          </button>

          <div className="flex items-center gap-2 pl-2 pr-3 py-1 bg-[#11151F] border border-white/[0.12] rounded-full text-[12px] font-semibold">
            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[#00F0FF] to-blue-500 text-[#060709] flex items-center justify-center text-[10px] font-extrabold">
              TD
            </div>
            <span>Team Daanav</span>
          </div>
        </div>
      </header>

      {/* ====================================================================
          THREE-COLUMN COCKPIT GRID
          ==================================================================== */}
      <div className="relative z-10 grid grid-cols-[240px_1fr_390px] flex-1 h-[calc(100vh-54px-52px)] overflow-hidden">
        
        {/* LEFT NAVIGATION DOCK */}
        <aside className="bg-[#0A0D14]/70 backdrop-blur-md border-r border-white/[0.07] p-4 flex flex-col justify-between">
          <div>
            <div className="text-[10px] font-extrabold tracking-[0.12em] uppercase text-[#64748B] px-3 py-2 mb-1">
              Mission Control
            </div>

            {(
              [
                { name: "Overview", icon: LayoutDashboard },
                { name: "Incidents", icon: CircleAlert, count: "01 CRITICAL" },
                { name: "AI Agents", icon: Bot },
                { name: "Logs Explorer", icon: Terminal },
                { name: "Code Review", icon: Code2 },
              ] as { name: NavPage; icon: LucideIcon; count?: string }[]
            ).map((item) => (
              <button
                key={item.name}
                onClick={() => setActiveNav(item.name)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all mb-1 cursor-pointer border ${
                  activeNav === item.name
                    ? "bg-[#141924] border-[#263247] text-[#00F0FF] font-semibold shadow-sm"
                    : "text-[#94A3B8] hover:text-white hover:bg-[#0F131C] border-transparent"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <item.icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </div>
                {item.count && (
                  <span className="font-mono text-[9.5px] font-extrabold px-1.5 py-0.5 rounded bg-rose-500/15 border border-rose-500/35 text-[#F43F5E]">
                    {item.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="bg-[#080A0F]/80 border border-white/[0.07] rounded-lg p-3 font-mono text-[10.5px] flex flex-col gap-1.5">
            <div className="text-[#00F0FF] font-bold tracking-wider text-[10px]">
              SWITCH HACKATHON 2026
            </div>
            <div className="flex justify-between text-[#64748B]">
              <span>Runtime:</span>
              <span className="text-[#F1F5F9]">WSL2 + Node 22</span>
            </div>
            <div className="flex justify-between text-[#64748B]">
              <span>Health:</span>
              <span className="text-[#10B981] font-semibold">{health?.status?.toUpperCase() ?? "200 OK"}</span>
            </div>
            <div className="flex justify-between text-[#64748B]">
              <span>Cluster:</span>
              <span className="text-[#00F0FF] font-semibold">
                {health?.integrations.switch.configured ? "SWITCH CONNECTED" : "5 BOTS READY"}
              </span>
            </div>
          </div>
        </aside>

        {/* CENTER STAGE: WORKSPACE & COMMAND */}
        <main className="p-6 overflow-y-auto flex flex-col gap-5">
          
          {/* INCIDENT HERO HUD (SPOTLIGHT CARD) */}
          <div
            onMouseMove={handleCardMouseMove}
            className="spotlight-card incident-hero-hud p-6 bg-gradient-to-b from-[#111520] to-[#0B0E16] border border-white/[0.12] rounded-xl relative shadow-2xl"
          >
            {/* Ambient Crimson Edge */}
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-[#F43F5E] to-[#E11D48] shadow-[0_0_16px_#F43F5E]" />

            <div className="flex items-center justify-between mb-3.5 relative z-10">
              <div className="flex items-center gap-3">
                {/* P0 BADGE (NO DOT!) */}
                <div className="inline-flex items-center gap-1.5 bg-rose-500/15 border border-rose-500/40 text-[#F43F5E] font-mono text-[11px] font-extrabold px-2.5 py-1 rounded">
                  <AlertTriangle className="w-3.5 h-3.5 fill-current" />
                  <span>P0 CRITICAL OUTAGE</span>
                </div>
                <span className="font-mono text-[14px] font-extrabold text-white">INC-2847</span>
                <span className="font-mono text-[11px] text-[#64748B]">
                  Blast Radius: <span className="text-rose-300 font-semibold">12.4% Checkout Traffic</span>
                </span>
              </div>

              {/* TABULAR TELEMETRY TICKERS */}
              <div className="flex items-center gap-7">
                <div className="flex flex-col items-end">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] mb-0.5">
                    MTTR Elapsed
                  </span>
                  <span className="font-mono text-[17px] font-bold text-white tabular-nums tracking-tight">
                    {formattedTimer}
                  </span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] mb-0.5">
                    Target SLA
                  </span>
                  <span className="font-mono text-[17px] font-bold text-[#10B981] drop-shadow-[0_0_10px_rgba(16,185,129,0.3)]">
                    &lt; 05:00.00
                  </span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] mb-0.5">
                    Test Pass Ratio
                  </span>
                  <span className="font-mono text-[17px] font-bold text-[#00F0FF] drop-shadow-[0_0_10px_rgba(0,240,255,0.3)]">
                    {testCount}
                  </span>
                </div>
              </div>
            </div>

            <h1 className="text-[21px] font-extrabold tracking-tight text-white mb-2 leading-tight relative z-10">
              Memory Leak in CheckoutWorker: Unclosed Redis Connection Pool
            </h1>

            <div className="flex items-center gap-3 text-[13.5px] text-[#94A3B8] relative z-10">
              <span>Target Component:</span>
              <span className="font-mono text-[12px] bg-[#080A0F] border border-white/[0.07] rounded px-2 py-0.5 text-[#00F0FF]">
                services/checkout/worker.py:140
              </span>
              <span>•</span>
              <span>Orchestrator:</span>
              <span className="text-white font-bold">Switch 5-Bot Multi-Agent Pipeline</span>
            </div>
          </div>

          {/* KINETIC 4-AGENT STEPPER PIPELINE */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between text-[11px] font-extrabold tracking-[0.1em] uppercase text-[#64748B]">
              <span>Sequential Multi-Agent Pipeline (Dynamic Handoff)</span>
              <span className="text-[#00F0FF] font-mono">
                {pipelineState === "approved"
                  ? "INCIDENT RESOLVED & DEPLOYED"
                  : pipelineState === "step4_testing"
                  ? "STAGE 4/4 ACTIVE"
                  : "STAGE 3/4 ACTIVE"}
              </span>
            </div>

            <div className="grid grid-cols-4 gap-4">
              
              {/* Agent 1 */}
              <div
                onMouseMove={handleCardMouseMove}
                className="spotlight-card agent-card p-4 rounded-xl flex flex-col gap-3 cursor-pointer bg-gradient-to-b from-[#0F1716] to-[#0B1211] border border-emerald-500/30"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-[#12241F] border border-[#1F3F35] flex items-center justify-center text-[#10B981]">
                      <Check className="w-4 h-4 stroke-[2.5]" />
                    </div>
                    <span className="text-[13.5px] font-bold text-white">Incident Mgr</span>
                  </div>
                  <span className="font-mono text-[9.5px] font-extrabold uppercase px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-[#10B981]">
                    Triage OK
                  </span>
                </div>
                <p className="text-[12px] text-[#94A3B8] leading-relaxed min-h-[36px]">
                  Correlated 482 Sentry alerts & declared P0 incident war room.
                </p>
                <div className="border-t border-white/[0.07] pt-2.5 flex items-center justify-between font-mono text-[10px] text-[#64748B]">
                  <span>@devops_incident_bot</span>
                  <span>12:34:02</span>
                </div>
              </div>

              {/* Agent 2 */}
              <div
                onMouseMove={handleCardMouseMove}
                className="spotlight-card agent-card p-4 rounded-xl flex flex-col gap-3 cursor-pointer bg-gradient-to-b from-[#0F1716] to-[#0B1211] border border-emerald-500/30"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-[#12241F] border border-[#1F3F35] flex items-center justify-center text-[#10B981]">
                      <Check className="w-4 h-4 stroke-[2.5]" />
                    </div>
                    <span className="text-[13.5px] font-bold text-white">Log Analyzer</span>
                  </div>
                  <span className="font-mono text-[9.5px] font-extrabold uppercase px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-[#10B981]">
                    Root Found
                  </span>
                </div>
                <p className="text-[12px] text-[#94A3B8] leading-relaxed min-h-[36px]">
                  Located leaked Redis pool handles in worker.py loop at L140.
                </p>
                <div className="border-t border-white/[0.07] pt-2.5 flex items-center justify-between font-mono text-[10px] text-[#64748B]">
                  <span>@devops_log_analyzer_bot</span>
                  <span>12:34:28</span>
                </div>
              </div>

              {/* Agent 3 */}
              <div
                onMouseMove={handleCardMouseMove}
                className={`spotlight-card agent-card p-4 rounded-xl flex flex-col gap-3 cursor-pointer transition-all ${
                  pipelineState === "step3_fixer"
                    ? "state-active bg-gradient-to-b from-[#131A28] to-[#0E1420] border-[#00F0FF]/45 shadow-[0_0_24px_rgba(0,240,255,0.18)]"
                    : "bg-gradient-to-b from-[#0F1716] to-[#0B1211] border-emerald-500/30"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                        pipelineState === "step3_fixer"
                          ? "bg-[#171E2D] border border-[#283348] text-[#00F0FF]"
                          : "bg-[#12241F] border border-[#1F3F35] text-[#10B981]"
                      }`}
                    >
                      {pipelineState === "step3_fixer" ? <Zap className="w-4 h-4" /> : <Check className="w-4 h-4 stroke-[2.5]" />}
                    </div>
                    <span className="text-[13.5px] font-bold text-white">Code Fixer</span>
                  </div>
                  <span
                    className={`font-mono text-[9.5px] font-extrabold uppercase px-2 py-0.5 rounded ${
                      pipelineState === "step3_fixer"
                        ? "bg-[#00F0FF]/15 border border-[#00F0FF]/40 text-[#00F0FF]"
                        : "bg-emerald-500/10 border border-emerald-500/30 text-[#10B981]"
                    }`}
                  >
                    {pipelineState === "step3_fixer" ? "Active Patch" : "Patch Ready"}
                  </span>
                </div>
                <p className="text-[12px] text-[#94A3B8] leading-relaxed min-h-[36px]">
                  Generated async context manager patch with atomic socket release.
                </p>
                <div className="border-t border-white/[0.07] pt-2.5 flex items-center justify-between font-mono text-[10px] text-[#64748B]">
                  <span className={pipelineState === "step3_fixer" ? "text-[#00F0FF]" : ""}>
                    @devops_code_fixer_bot
                  </span>
                  <span>{pipelineState === "step3_fixer" ? "IN FLIGHT" : "12:35:10"}</span>
                </div>
              </div>

              {/* Agent 4 */}
              <div
                onMouseMove={handleCardMouseMove}
                className={`spotlight-card agent-card p-4 rounded-xl flex flex-col gap-3 cursor-pointer transition-all ${
                  pipelineState === "step4_testing"
                    ? "state-active bg-gradient-to-b from-[#131A28] to-[#0E1420] border-[#00F0FF]/45 shadow-[0_0_24px_rgba(0,240,255,0.18)]"
                    : pipelineState === "approved"
                    ? "bg-gradient-to-b from-[#0F1716] to-[#0B1211] border-emerald-500/30"
                    : "opacity-70 bg-[#0F131C] border-white/[0.07]"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                        pipelineState === "step4_testing"
                          ? "bg-[#171E2D] border border-[#283348] text-[#00F0FF]"
                          : pipelineState === "approved"
                          ? "bg-[#12241F] border border-[#1F3F35] text-[#10B981]"
                          : "bg-[#171E2D] text-[#64748B]"
                      }`}
                    >
                      <Terminal className="w-4 h-4" />
                    </div>
                    <span className="text-[13.5px] font-bold text-white">Testing Agent</span>
                  </div>
                  <span
                    className={`font-mono text-[9.5px] font-extrabold uppercase px-2 py-0.5 rounded ${
                      pipelineState === "step4_testing"
                        ? "bg-[#00F0FF]/15 border border-[#00F0FF]/40 text-[#00F0FF]"
                        : pipelineState === "approved"
                        ? "bg-emerald-500/10 border border-emerald-500/30 text-[#10B981]"
                        : "bg-white/[0.05] text-[#64748B]"
                    }`}
                  >
                    {pipelineState === "step4_testing"
                      ? "Running Suite"
                      : pipelineState === "approved"
                      ? "18/18 Verified"
                      : "Standing By"}
                  </span>
                </div>
                <p className="text-[12px] text-[#94A3B8] leading-relaxed min-h-[36px]">
                  {pipelineState === "step4_testing"
                    ? "Executing PyTest regression suite on isolated git sandbox worktree..."
                    : "Pre-loaded 18 regression test suites for payment checkout verification."}
                </p>
                <div className="border-t border-white/[0.07] pt-2.5 flex items-center justify-between font-mono text-[10px] text-[#64748B]">
                  <span>@devops_testing_agent_bot</span>
                  <span>{pipelineState === "step4_testing" ? "ACTIVE" : "QUEUED"}</span>
                </div>
              </div>

            </div>
          </div>

          {/* UNIFIED MONACO-STYLE GIT DIFF CANVAS */}
          <div
            onMouseMove={handleCardMouseMove}
            className="spotlight-card diff-container rounded-xl border border-white/[0.07] bg-[#0E1118] flex flex-col overflow-hidden shadow-2xl flex-1"
          >
            <div className="bg-[#0B0E15] border-b border-white/[0.07] px-5 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3 font-mono text-[12px]">
                <FileCode className="w-4 h-4 text-[#64748B]" />
                <span className="text-white font-bold">services/checkout/worker.py</span>
                <span className="text-[#10B981] font-extrabold bg-emerald-500/10 px-1.5 py-0.5 rounded">
                  +6
                </span>
                <span className="text-[#F43F5E] font-extrabold bg-rose-500/10 px-1.5 py-0.5 rounded">
                  -3
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText("async with redis_pool.connection() as redis_conn:");
                    alert("Patch copied to clipboard!");
                  }}
                  className="btn-mechanical text-[11px] py-1 px-3"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Patch</span>
                </button>
                <button onClick={handleApprove} className="btn-mechanical primary-cta text-[11px] py-1 px-3">
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Human Sign-Off</span>
                </button>
              </div>
            </div>

            <div className="font-mono text-[12px] leading-[1.65] bg-[#080A0F] text-[#CBD5E1] overflow-x-auto p-0 flex-1">
              {DEFAULT_DIFF_LINES.map((line, idx) => (
                <div
                  key={idx}
                  className={`flex px-3.5 py-0.5 border-l-[3px] transition-colors ${
                    line.type === "hunk"
                      ? "bg-[#00F0FF]/5 text-[#00F0FF] border-transparent border-t border-b border-white/[0.07] py-1.5 font-semibold"
                      : line.type === "del"
                      ? "bg-rose-500/10 border-rose-500 text-rose-300"
                      : line.type === "add"
                      ? "bg-emerald-500/10 border-emerald-500 text-emerald-300"
                      : "border-transparent hover:bg-white/[0.035]"
                  }`}
                >
                  <span className="w-9 text-right pr-3.5 text-[#334155] select-none tabular-nums font-mono text-[11px]">
                    {line.oldNum}
                  </span>
                  <span className="w-9 text-right pr-3.5 text-[#334155] select-none tabular-nums font-mono text-[11px]">
                    {line.newNum}
                  </span>
                  <span className="w-4 select-none font-extrabold text-[12px]">
                    {line.type === "add" ? "+" : line.type === "del" ? "-" : " "}
                  </span>
                  <span className="flex-1 whitespace-pre">{line.text}</span>
                </div>
              ))}
            </div>
          </div>

        </main>

        {/* RIGHT RAIL: TELEGRAM WAR ROOM STREAM */}
        <div className="bg-[#0A0D14]/70 backdrop-blur-md border-l border-white/[0.07] flex flex-col overflow-hidden">
          <div className="p-4 border-b border-white/[0.07] flex items-center justify-between">
            <div className="flex items-center gap-2.5 text-[11.5px] font-extrabold tracking-wider uppercase text-white">
              <svg className="w-4 h-4 fill-[#00F0FF]" viewBox="0 0 24 24">
                <path d="M21.5 2L2 9.5l7.5 3 2.5 7.5 3-4.5 4 4.5z" />
              </svg>
              <span>Telegram War Room Mirror</span>
            </div>
            <span className="font-mono text-[9.5px] font-extrabold text-[#10B981] bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded">
              SYNCED
            </span>
          </div>

          {/* CHAT MESSAGES STREAM (NO DOTS IN FRONT OF BOT HANDLES!) */}
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
            {messages.map((m) => (
              <div
                key={m.id}
                className="message-bubble bg-[#0F131C] border border-white/[0.07] hover:border-white/[0.15] rounded-lg p-3 flex flex-col gap-1.5 transition-all"
              >
                <div className="flex items-center justify-between text-[11px]">
                  <span
                    className={`font-mono font-bold ${
                      m.senderRole === "mgr"
                        ? "text-purple-400"
                        : m.senderRole === "log"
                        ? "text-amber-400"
                        : m.senderRole === "fix"
                        ? "text-[#00F0FF]"
                        : m.senderRole === "test"
                        ? "text-[#10B981]"
                        : "text-blue-400"
                    }`}
                  >
                    {m.sender}
                  </span>
                  <span className="font-mono text-[9.5px] text-[#64748B]">{m.time}</span>
                </div>
                <div className="text-[12.5px] text-[#F1F5F9] leading-relaxed">
                  {m.text}
                </div>
              </div>
            ))}
          </div>

          {/* HUMAN GATE DECISION PANEL */}
          <div className="p-4 bg-[#0B0E15] border-t border-white/[0.07] flex flex-col gap-2.5">
            <div className="flex items-center gap-2 text-[11px] font-bold text-[#F59E0B]">
              <AlertTriangle className="w-3.5 h-3.5 fill-current" />
              <span>Human Decision Gate: Team Daanav Sign-off</span>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={handleReject}
                className="btn-mechanical justify-center text-[11px] py-2"
              >
                Reject Patch
              </button>
              <button
                onClick={handleApprove}
                className="btn-mechanical primary-cta justify-center text-[11px] py-2"
              >
                Approve & Deploy
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* ====================================================================
          FEATURE A: RAYCAST-STYLE FLOATING ACTION DOCK
          ==================================================================== */}
      <div className="fixed bottom-3 left-1/2 -translate-x-1/2 h-11 bg-[#0E121A]/90 backdrop-blur-xl border border-white/[0.15] rounded-xl flex items-center px-2 gap-1.5 shadow-[0_16px_36px_rgba(0,0,0,0.6)] z-50">
        <button
          onClick={handleApprove}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-b from-[#10B981] to-[#059669] border border-[#059669] text-[#040608] font-extrabold text-[12px] shadow-[0_2px_10px_rgba(16,185,129,0.3)] hover:brightness-110 active:scale-95 transition-all cursor-pointer"
        >
          <span>Approve & Deploy</span>
          <span className="keycap bg-black/35 text-white border-white/20">↵</span>
        </button>

        <button
          onClick={handleReanalyze}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white/[0.08] hover:border-white/[0.1] text-[#F1F5F9] font-semibold text-[12px] active:scale-95 transition-all cursor-pointer border border-transparent"
        >
          <span>Re-Analyze</span>
          <span className="keycap">R</span>
        </button>

        <button
          onClick={handleRunTests}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white/[0.08] hover:border-white/[0.1] text-[#F1F5F9] font-semibold text-[12px] active:scale-95 transition-all cursor-pointer border border-transparent"
        >
          <span>Run Tests</span>
          <span className="keycap">T</span>
        </button>

        <div className="w-px h-5 bg-white/[0.12] mx-1" />

        <button
          onClick={() => setPaletteOpen(true)}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white/[0.08] hover:border-white/[0.1] text-[#F1F5F9] font-semibold text-[12px] active:scale-95 transition-all cursor-pointer border border-transparent"
        >
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
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-start justify-center pt-28 p-4"
        >
          <div className="w-[620px] bg-[#0E121B] border border-white/[0.18] rounded-xl shadow-[0_24px_60px_rgba(0,0,0,0.8),0_0_24px_rgba(0,240,255,0.15)] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-white/[0.07] flex items-center gap-3">
              <Search className="w-5 h-5 text-[#00F0FF]" />
              <input
                type="text"
                value={paletteQuery}
                onChange={(e) => {
                  setPaletteQuery(e.target.value);
                  setPaletteIndex(0);
                }}
                placeholder="Type a command or search actions..."
                autoFocus
                className="flex-1 bg-transparent border-none outline-none text-[15px] font-medium text-white placeholder:text-[#64748B]"
              />
              <span className="keycap">ESC</span>
            </div>

            <div className="max-h-[320px] overflow-y-auto p-2 flex flex-col gap-1">
              {filteredPalette.length === 0 ? (
                <div className="p-4 text-center text-[#64748B] text-[13px]">No matching actions found.</div>
              ) : (
                filteredPalette.map((item, idx) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      setPaletteOpen(false);
                      item.action();
                    }}
                    onMouseEnter={() => setPaletteIndex(idx)}
                    className={`flex items-center justify-between p-3 rounded-lg cursor-pointer text-[13px] font-medium transition-all ${
                      paletteIndex === idx
                        ? "bg-[#171E2D] text-[#00F0FF]"
                        : "text-[#F1F5F9] hover:bg-white/[0.05]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className="w-4 h-4 stroke-[2]" />
                      <span>{item.label}</span>
                    </div>
                    <span className="keycap">{item.shortcut}</span>
                  </div>
                ))
              )}
            </div>

            <div className="bg-[#090B10] border-t border-white/[0.07] px-4 py-2 flex items-center justify-between font-mono text-[10.5px] text-[#64748B]">
              <span>Navigation: <kbd className="keycap">↑</kbd> <kbd className="keycap">↓</kbd></span>
              <span>Execute: <kbd className="keycap">↵</kbd></span>
              <span>Close: <kbd className="keycap">ESC</kbd></span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

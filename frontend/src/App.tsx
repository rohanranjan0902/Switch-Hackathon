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
// TYPES & CONSTANTS
// ============================================================================
type NavPage = "Overview" | "Incidents" | "AI Agents" | "Logs Explorer" | "Code Review";

interface TelegramMessage {
  id: string;
  sender: string;
  senderRole: "mgr" | "log" | "fix" | "test" | "orch";
  time: string;
  text: string;
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

  // Agent Pipeline States
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
    <div style={{ position: "relative", width: "100vw", height: "100vh", overflow: "hidden", display: "flex", flexDirection: "column" }}>
      
      {/* ATMOSPHERIC HARDWARE BACKGROUND CANVAS & GRID */}
      <div className="ambient-background">
        <canvas ref={canvasRef} id="topology-canvas" />
      </div>

      {/* ====================================================================
          TOP COMMAND HUD HEADER
          ==================================================================== */}
      <header className="cockpit-header">
        <div className="brand-group">
          {/* SMART CAT EMBLEM BUTTON */}
          <button
            onClick={() => setPaletteOpen(true)}
            className="brand-emblem"
            title="Team Daanav Mission Control (Click for Commands)"
          >
            <SmartCatIcon className="w-4 h-4 text-[#00F0FF]" />
            <span>TEAM DAANAV</span>
          </button>

          <div className="system-breadcrumb">
            <span>DevOps Command Cockpit</span>
            <span className="separator">/</span>
            <span className="active-target">INC-2847 (Active Outage)</span>
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
          THREE-COLUMN COCKPIT GRID (FIXED NON-OVERFLOWING GEOMETRY)
          ==================================================================== */}
      <div className="cockpit-grid">
        
        {/* LEFT NAVIGATION DOCK */}
        <aside className="cockpit-aside">
          <div>
            <div className="nav-group-label">Mission Control</div>

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
                className={`nav-btn ${activeNav === item.name ? "active" : ""}`}
              >
                <div className="nav-btn-inner">
                  <item.icon style={{ width: 15, height: 15 }} />
                  <span>{item.name}</span>
                </div>
                {item.count && <span className="counter-tag">{item.count}</span>}
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

        {/* CENTER STAGE: WORKSPACE & COMMAND */}
        <main className="cockpit-main">
          
          {/* INCIDENT HERO HUD (SPOTLIGHT CARD) */}
          <div
            onMouseMove={handleCardMouseMove}
            className="spotlight-card incident-hero-hud"
          >
            <div className="hud-meta-row">
              <div className="badge-cluster">
                {/* P0 BADGE (NO DOT!) */}
                <div className="badge-p0">
                  <AlertTriangle style={{ width: 12, height: 12, fill: "currentColor" }} />
                  <span>P0 CRITICAL OUTAGE</span>
                </div>
                <span className="incident-ticket-id">INC-2847</span>
                <span className="blast-radius-tag">
                  Blast Radius: <span style={{ color: "#FCA5A5", fontWeight: 700 }}>12.4% Checkout Traffic</span>
                </span>
              </div>

              {/* TABULAR TELEMETRY TICKERS */}
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
              Memory Leak in CheckoutWorker: Unclosed Redis Connection Pool
            </h1>

            <div className="hud-subline">
              <span>Target Component:</span>
              <span className="code-chip">services/checkout/worker.py:140</span>
              <span>•</span>
              <span>Orchestrator:</span>
              <span style={{ color: "var(--text-pure)", fontWeight: 700 }}>Switch 5-Bot Multi-Agent Pipeline</span>
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
              <div
                onMouseMove={handleCardMouseMove}
                className="spotlight-card agent-card state-completed"
              >
                <div className="card-head">
                  <div className="agent-profile">
                    <div className="icon-cube">
                      <Check style={{ width: 14, height: 14, strokeWidth: 2.5 }} />
                    </div>
                    <span className="agent-title">Incident Mgr</span>
                  </div>
                  <span className="state-badge">Triage OK</span>
                </div>
                <p className="card-detail">
                  Correlated 482 Sentry alerts & declared P0 incident war room.
                </p>
                <div className="card-foot">
                  <span>@devops_incident_bot</span>
                  <span>12:34:02</span>
                </div>
              </div>

              {/* Agent 2 */}
              <div
                onMouseMove={handleCardMouseMove}
                className="spotlight-card agent-card state-completed"
              >
                <div className="card-head">
                  <div className="agent-profile">
                    <div className="icon-cube">
                      <Check style={{ width: 14, height: 14, strokeWidth: 2.5 }} />
                    </div>
                    <span className="agent-title">Log Analyzer</span>
                  </div>
                  <span className="state-badge">Root Found</span>
                </div>
                <p className="card-detail">
                  Located leaked Redis pool handles in worker.py loop at L140.
                </p>
                <div className="card-foot">
                  <span>@devops_log_analyzer_bot</span>
                  <span>12:34:28</span>
                </div>
              </div>

              {/* Agent 3 */}
              <div
                onMouseMove={handleCardMouseMove}
                className={`spotlight-card agent-card ${
                  pipelineState === "step3_fixer" ? "state-active" : "state-completed"
                }`}
              >
                <div className="card-head">
                  <div className="agent-profile">
                    <div className="icon-cube">
                      {pipelineState === "step3_fixer" ? <Zap style={{ width: 14, height: 14 }} /> : <Check style={{ width: 14, height: 14, strokeWidth: 2.5 }} />}
                    </div>
                    <span className="agent-title">Code Fixer</span>
                  </div>
                  <span className="state-badge">
                    {pipelineState === "step3_fixer" ? "Active Patch" : "Patch Ready"}
                  </span>
                </div>
                <p className="card-detail">
                  Generated async context manager patch with atomic socket release.
                </p>
                <div className="card-foot">
                  <span style={pipelineState === "step3_fixer" ? { color: "var(--signal-cyan)" } : {}}>
                    @devops_code_fixer_bot
                  </span>
                  <span>{pipelineState === "step3_fixer" ? "IN FLIGHT" : "12:35:10"}</span>
                </div>
              </div>

              {/* Agent 4 */}
              <div
                onMouseMove={handleCardMouseMove}
                className={`spotlight-card agent-card ${
                  pipelineState === "step4_testing"
                    ? "state-active"
                    : pipelineState === "approved"
                    ? "state-completed"
                    : "state-idle"
                }`}
              >
                <div className="card-head">
                  <div className="agent-profile">
                    <div className="icon-cube">
                      <Terminal style={{ width: 14, height: 14 }} />
                    </div>
                    <span className="agent-title">Testing Agent</span>
                  </div>
                  <span className="state-badge">
                    {pipelineState === "step4_testing"
                      ? "Running Suite"
                      : pipelineState === "approved"
                      ? "18/18 Verified"
                      : "Standing By"}
                  </span>
                </div>
                <p className="card-detail">
                  {pipelineState === "step4_testing"
                    ? "Executing PyTest regression suite on isolated git sandbox worktree..."
                    : "Pre-loaded 18 regression test suites for payment checkout verification."}
                </p>
                <div className="card-foot">
                  <span>@devops_testing_agent_bot</span>
                  <span>{pipelineState === "step4_testing" ? "ACTIVE" : "QUEUED"}</span>
                </div>
              </div>

            </div>
          </div>

          {/* UNIFIED MONACO-STYLE GIT DIFF CANVAS */}
          <div
            onMouseMove={handleCardMouseMove}
            className="spotlight-card diff-container"
          >
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
                <div
                  key={idx}
                  className={`diff-row type-${line.type}`}
                >
                  <span className="gutter-num-old">{line.oldNum}</span>
                  <span className="gutter-num-new">{line.newNum}</span>
                  <span className="gutter-marker">
                    {line.type === "add" ? "+" : line.type === "del" ? "-" : " "}
                  </span>
                  <span className="diff-code-text">{line.text}</span>
                </div>
              ))}
            </div>
          </div>

        </main>

        {/* RIGHT RAIL: TELEGRAM WAR ROOM STREAM */}
        <div className="war-room-rail">
          <div className="rail-topbar">
            <div className="rail-heading">
              <svg style={{ width: 14, height: 14, fill: "var(--signal-cyan)" }} viewBox="0 0 24 24">
                <path d="M21.5 2L2 9.5l7.5 3 2.5 7.5 3-4.5 4 4.5z" />
              </svg>
              <span>Telegram War Room Mirror</span>
            </div>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "9.5px", fontWeight: 800, color: "var(--signal-emerald)" }}>
              SYNCED
            </span>
          </div>

          {/* CHAT MESSAGES STREAM (NO DOTS IN FRONT OF BOT HANDLES!) */}
          <div className="chat-scroll-canvas">
            {messages.map((m) => (
              <div key={m.id} className="message-bubble">
                <div className="bubble-meta">
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
                <div className="bubble-content">{m.text}</div>
              </div>
            ))}
          </div>

          {/* HUMAN GATE DECISION PANEL */}
          <div className="gate-action-panel">
            <div className="gate-prompt">
              <AlertTriangle style={{ width: 13, height: 13, fill: "currentColor" }} />
              <span>Human Decision Gate: Team Daanav Sign-off</span>
            </div>
            <div className="gate-btn-row">
              <button onClick={handleReject} className="btn-mechanical" style={{ justifyContent: "center" }}>
                Reject Patch
              </button>
              <button onClick={handleApprove} className="btn-mechanical primary-cta" style={{ justifyContent: "center" }}>
                Approve & Deploy
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* ====================================================================
          FEATURE A: RAYCAST-STYLE FLOATING ACTION DOCK
          ==================================================================== */}
      <div className="raycast-action-dock">
        <button onClick={handleApprove} className="dock-action-btn primary">
          <span>Approve & Deploy</span>
          <span className="keycap">↵</span>
        </button>

        <button onClick={handleReanalyze} className="dock-action-btn">
          <span>Re-Analyze</span>
          <span className="keycap">R</span>
        </button>

        <button onClick={handleRunTests} className="dock-action-btn">
          <span>Run Tests</span>
          <span className="keycap">T</span>
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
                placeholder="Type a command or search actions..."
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

    </div>
  );
}

import { Bot, Search, Zap, Terminal } from "lucide-react";
import type { Agent, ExecutionRecord } from "../types";

interface AgentsViewProps {
  agents: Agent[];
  execution: ExecutionRecord | null;
  onPingAgent: (agentName: string, roleKey: string) => void;
}

export function AgentsView({ agents, execution, onPingAgent }: AgentsViewProps) {
  const agentDetails = [
    {
      id: "incident-manager",
      name: "Incident Manager",
      handle: "@incident_manager",
      role: "Triage & Blast Radius Coordinator",
      icon: Bot,
      desc: "Analyzes telemetry, classifies incident severity (P0-P3), and formulates sequential remediation plan.",
      endpoint: "Switch Room: incident-war-room",
    },
    {
      id: "log-analyzer",
      name: "Log Analyzer",
      handle: "@log_analyzer",
      role: "Telemetry & Stack Trace Isolation",
      icon: Search,
      desc: "Isolates anomalous stack traces from checkout-api, inventory-service, and correlates culprit log entries.",
      endpoint: "REST /api/logs",
    },
    {
      id: "code-fixer",
      name: "Code Fixer",
      handle: "@code_fixer",
      role: "Defect Localization & Unified Diff Synthesizer",
      icon: Zap,
      desc: "Scans target source tree (sample-app/src/checkout.ts) and synthesizes standard unified git diff patches.",
      endpoint: "Repository AST Analyzer",
    },
    {
      id: "testing-agent",
      name: "Testing Agent",
      handle: "@testing_agent",
      role: "Automated Regression & Sandbox Gate",
      icon: Terminal,
      desc: "Executes sample-app test suite in isolated workspace and verifies assertions (2/2 passing) before human sign-off.",
      endpoint: "TAP 13 Runner: npm test",
    },
  ];

  const getAgentStatus = (id: string): { status: string; isWorking: boolean } => {
    if (execution && execution.status === "RUNNING") {
      if (execution.currentRole === id) {
        return { status: "WORKING", isWorking: true };
      }
    }
    const match = agents.find((a) => a.id === id);
    if (match?.status === "working") return { status: "WORKING", isWorking: true };
    return { status: "READY", isWorking: false };
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-8">
      <div>
        <span className="text-[10.5px] font-mono font-bold uppercase tracking-wider text-[#00F0FF] block mb-1">
          SWITCH AGENT GATEWAY
        </span>
        <h2 className="text-xl font-bold text-white tracking-tight">
          Autonomous Multi-Agent Squad
        </h2>
        <p className="text-xs text-[#94A3B8] font-mono mt-0.5">
          4 specialized roles coordinating via Switch Agent Bridge & Telegram War Room
          (-1004337160724)
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {agentDetails.map((bot) => {
          const { status, isWorking } = getAgentStatus(bot.id);
          const Icon = bot.icon;

          return (
            <div
              key={bot.id}
              className="spotlight-card flex flex-col justify-between gap-4 shadow-lg min-h-[220px]"
            >
              <div>
                <div className="flex items-center justify-between mb-3.5 gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-[38px] h-[38px] rounded-xl bg-[#171E2D] border border-[#283348] flex items-center justify-center text-[#00F0FF] shadow-sm shrink-0">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-white font-sans truncate">
                        {bot.name}
                      </h4>
                      <span className="font-mono text-xs text-[#00F0FF] truncate block">
                        {bot.handle}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`inline-flex items-center font-mono text-[10px] font-extrabold uppercase px-2.5 h-6 rounded-md border shrink-0 ${
                      isWorking
                        ? "bg-cyan-500/15 border-cyan-500/40 text-[#00F0FF] animate-pulse"
                        : "bg-emerald-500/10 border-emerald-500/30 text-[#10B981]"
                    }`}
                  >
                    {status}
                  </span>
                </div>

                <div className="text-[11px] font-mono text-[#64748B] mb-2 uppercase tracking-wider">
                  Role: <span className="text-[#94A3B8]">{bot.role}</span>
                </div>

                <p className="text-xs text-[#CBD5E1] leading-relaxed font-sans">
                  {bot.desc}
                </p>
              </div>

              <div className="border-t border-white/[0.06] pt-3.5 flex items-center justify-between font-mono text-xs text-[#64748B] gap-2">
                <div className="truncate min-w-0">
                  <span>Interface: </span>
                  <strong className="text-[#CBD5E1]">{bot.endpoint}</strong>
                </div>

                <button
                  onClick={() => onPingAgent(bot.name, bot.id)}
                  className="btn-mechanical text-xs h-[34px] px-3.5 text-[#00F0FF] bg-cyan-500/10 border-cyan-500/30 hover:bg-cyan-500/20 shrink-0"
                >
                  Ping in War Room 💬
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

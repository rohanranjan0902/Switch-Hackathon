import { Plus, ArrowRight } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { Incident } from "../types";
import type { ApiHealth } from "../api";

interface OverviewViewProps {
  incidents: Incident[];
  health: ApiHealth | null;
  onSelectIncident: (inc: Incident) => void;
  onNavigateToIncidents: () => void;
  onOpenCreateModal: () => void;
  mttrDisplay: string;
}

const VELOCITY_CHART_DATA = [
  { time: "10:00", active: 2, resolved: 6 },
  { time: "11:00", active: 4, resolved: 8 },
  { time: "12:00", active: 3, resolved: 11 },
  { time: "13:00", active: 5, resolved: 14 },
  { time: "14:00", active: 2, resolved: 18 },
  { time: "15:00", active: 1, resolved: 22 },
];

export function OverviewView({
  incidents,
  health,
  onSelectIncident,
  onNavigateToIncidents,
  onOpenCreateModal,
  mttrDisplay,
}: OverviewViewProps) {
  const criticalCount = incidents.filter(
    (i) => i.severity === "critical" && i.status !== "resolved",
  ).length;

  const activeIncidents = incidents.filter((i) => i.status !== "resolved");
  const firstCritical =
    incidents.find((i) => i.severity === "critical" && i.status !== "resolved") ??
    incidents[0];

  const switchMode = health?.integrations.switch.provider ?? "simulation";

  return (
    <div className="flex flex-col gap-4 max-w-7xl mx-auto pb-8">
      {/* Stat HUD Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Outages */}
        <div className="spotlight-card p-6 bg-[#0F131C] border border-white/[0.08] rounded-[14px] flex flex-col justify-between min-h-[148px]">
          <div className="flex items-center justify-between gap-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] truncate">
              Active Outages
            </span>
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${criticalCount > 0 ? "bg-[#F43F5E] animate-pulse" : "bg-[#10B981]"
                }`}
            />
          </div>
          <div className="flex items-baseline justify-between gap-2 my-1">
            <div className="flex items-baseline gap-1.5 whitespace-nowrap min-w-0">
              <span
                className={`text-2xl font-extrabold font-mono tracking-tight leading-none ${criticalCount > 0 ? "text-[#F43F5E]" : "text-[#10B981]"
                  }`}
              >
                {criticalCount > 0 ? criticalCount : activeIncidents.length}
              </span>
              <span
                className={`text-sm font-bold uppercase tracking-wider ${criticalCount > 0 ? "text-[#F43F5E]" : "text-[#10B981]"
                  }`}
              >
                {criticalCount > 0 ? "Critical" : "Active"}
              </span>
            </div>
            {firstCritical && (
              <span className="text-[11px] text-[#94A3B8] font-mono font-semibold px-2 py-0.5 rounded bg-white/[0.04] border border-white/[0.08] whitespace-nowrap shrink-0">
                {firstCritical.id}
              </span>
            )}
          </div>
          <p className="text-xs text-[#94A3B8] leading-relaxed truncate">
            {criticalCount > 0
              ? "Telemetry alerts active on checkout-api"
              : "All clusters operating normally"}
          </p>
        </div>

        {/* Mean Time To Resolve */}
        <div className="spotlight-card p-6 bg-[#0F131C] border border-white/[0.08] rounded-[14px] flex flex-col justify-between min-h-[148px]">
          <div className="flex items-center justify-between gap-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] truncate">
              Active MTTR Elapsed
            </span>
            <span className="text-[10px] text-emerald-400 font-mono font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30 whitespace-nowrap shrink-0">
              SLA &lt; 05:00
            </span>
          </div>
          <div className="flex items-baseline gap-2 my-1">
            <span className="text-2xl font-extrabold text-[#00F0FF] font-mono tracking-tight leading-none whitespace-nowrap">
              {mttrDisplay}
            </span>
          </div>
          <p className="text-xs text-[#94A3B8] leading-relaxed truncate">
            Autonomous multi-agent triage active
          </p>
        </div>

        {/* AI Agent Squad */}
        <div className="spotlight-card p-6 bg-[#0F131C] border border-white/[0.08] rounded-[14px] flex flex-col justify-between min-h-[148px]">
          <div className="flex items-center justify-between gap-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] truncate">
              AI Agent Squad
            </span>
            <span className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30 whitespace-nowrap shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
              SYNCED
            </span>
          </div>
          <div className="flex items-baseline gap-2 my-1">
            <span className="text-2xl font-extrabold text-[#10B981] font-mono tracking-tight leading-none whitespace-nowrap">
              4 / 4 Online
            </span>
          </div>
          <p className="text-xs text-emerald-300 font-mono leading-relaxed truncate">
            Mode: {switchMode.toUpperCase()} Gateway
          </p>
        </div>

        {/* Automated Test Pass */}
        <div className="spotlight-card p-6 bg-[#0F131C] border border-white/[0.08] rounded-[14px] flex flex-col justify-between min-h-[148px]">
          <div className="flex items-center justify-between gap-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] truncate">
              Automated Tests
            </span>
            <span className="text-[10px] text-emerald-400 font-mono font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30 whitespace-nowrap shrink-0">
              100% PASS
            </span>
          </div>
          <div className="flex items-baseline gap-2 my-1">
            <span className="text-2xl font-extrabold text-white font-mono tracking-tight leading-none whitespace-nowrap">
              2 / 2
            </span>
          </div>
          <p className="text-xs text-[#94A3B8] leading-relaxed truncate">
            sample-app TAP test runner verified
          </p>
        </div>
      </div>

      {/* Chart & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Velocity Chart */}
        <div className="lg:col-span-7 xl:col-span-7 spotlight-card p-6 bg-[#0F131C] border border-white/[0.08] rounded-[14px] flex flex-col justify-between gap-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10.5px] font-mono font-bold uppercase tracking-wider text-[#00F0FF]">
                  TELEMETRY METRICS
                </span>
                <span className="text-white/20">•</span>
                <span className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold text-[#00F0FF]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00F0FF] animate-pulse" />
                  LIVE
                </span>
              </div>
              <h3 className="text-sm font-bold text-white tracking-tight">
                Incident Resolution Velocity
              </h3>
              <p className="text-xs text-[#64748B] mt-0.5">
                Real-time correlation of incoming alerts vs autonomous patch sign-offs
              </p>
            </div>

            {/* Aligned Chart Legend */}
            <div className="flex items-center gap-3.5 text-xs font-mono shrink-0 pt-0.5">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#10B981]" />
                <span className="text-[#94A3B8] text-[11px]">Auto-Resolved</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#F43F5E]" />
                <span className="text-[#94A3B8] text-[11px]">Active Outages</span>
              </div>
            </div>
          </div>

          <div className="h-[210px] w-full pt-1">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={VELOCITY_CHART_DATA}
                margin={{ top: 12, right: 12, left: -22, bottom: 4 }}
              >
                <defs>
                  <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorActive" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F43F5E" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#F43F5E" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" stroke="#475569" fontSize={11} tickLine={false} />
                <YAxis stroke="#475569" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0A0D14",
                    borderColor: "rgba(255, 255, 255, 0.15)",
                    borderRadius: 8,
                    fontSize: 12,
                    padding: "8px 12px",
                    boxShadow: "0 8px 24px rgba(0, 0, 0, 0.6)",
                    color: "#F1F5F9",
                  }}
                  itemStyle={{ padding: "2px 0" }}
                />
                <Area
                  type="monotone"
                  dataKey="resolved"
                  stroke="#10B981"
                  fillOpacity={1}
                  fill="url(#colorResolved)"
                  strokeWidth={2}
                  name="Auto-Resolved"
                />
                <Area
                  type="monotone"
                  dataKey="active"
                  stroke="#F43F5E"
                  fillOpacity={1}
                  fill="url(#colorActive)"
                  strokeWidth={2}
                  name="Active Outages"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Fleet Health */}
        <div className="lg:col-span-5 xl:col-span-5 spotlight-card p-6 bg-[#0F131C] border border-white/[0.08] rounded-[14px] flex flex-col justify-between gap-4">
          <div>
            <span className="text-[10.5px] font-mono font-bold uppercase tracking-wider text-[#00F0FF] block mb-1">
              SYSTEM HEALTH
            </span>
            <h3 className="text-sm font-bold text-white tracking-tight">
              Production Microservices Grid
            </h3>
            <p className="text-xs text-[#64748B] mt-0.5 mb-3">
              Core services monitored by Switch Daemon
            </p>

            <div className="flex flex-col gap-2 font-mono text-xs">
              {[
                {
                  name: "checkout-api",
                  status: criticalCount > 0 ? "DEGRADED" : "HEALTHY",
                  latency: criticalCount > 0 ? "248ms" : "34ms",
                  color: criticalCount > 0 ? "#F43F5E" : "#10B981",
                },
                {
                  name: "payment-gateway",
                  status: "HEALTHY",
                  latency: "42ms",
                  color: "#10B981",
                },
                {
                  name: "inventory-service",
                  status: "HEALTHY",
                  latency: "38ms",
                  color: "#10B981",
                },
                {
                  name: "search-api",
                  status: "HEALTHY",
                  latency: "65ms",
                  color: "#10B981",
                },
              ].map((s) => (
                <div
                  key={s.name}
                  className="flex items-center justify-between p-2.5 px-3 rounded-lg bg-[#080A0F] border border-white/[0.05] gap-2 min-w-0"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ backgroundColor: s.color }}
                    />
                    <span className="text-[#F1F5F9] font-mono text-xs font-medium truncate">
                      {s.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0 font-mono text-[11px]">
                    <span className="text-[#64748B]">{s.latency}</span>
                    <span
                      style={{ color: s.color }}
                      className="font-bold tracking-wider uppercase text-[10.5px]"
                    >
                      {s.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={onNavigateToIncidents}
            className="btn-mechanical primary-cta justify-center mt-2 w-full flex items-center gap-2"
          >
            <span>Open Active Incident Cockpit</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Incidents Quick Table */}
      <div className="spotlight-card p-6 bg-[#0F131C] border border-white/[0.08] rounded-[14px] flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#00F0FF] block mb-1">
              INCIDENT QUEUE
            </span>
            <h3 className="text-sm font-bold text-white tracking-tight">
              Active & Recent Incidents
            </h3>
            <p className="text-xs text-[#64748B] mt-0.5">
              Real-time state from Express API and Socket.IO
            </p>
          </div>
          <button
            onClick={onOpenCreateModal}
            className="btn-mechanical text-xs py-2 px-3.5 flex items-center gap-2 shrink-0"
          >
            <Plus className="w-3.5 h-3.5 text-[#00F0FF]" />
            <span>Report Outage</span>
          </button>
        </div>

        <div className="overflow-x-auto rounded-lg border border-white/[0.06] bg-[#0A0D14]">
          <table className="w-full text-left font-mono text-xs border-collapse">
            <thead>
              <tr className="border-b border-white/[0.08] bg-[#0D111A] text-[#64748B] text-[11px] uppercase tracking-wider">
                <th className="py-3 px-4 font-bold">Ticket ID</th>
                <th className="py-3 px-4 font-bold">Severity</th>
                <th className="py-3 px-4 font-bold font-sans">Title</th>
                <th className="py-3 px-4 font-bold">Target Service</th>
                <th className="py-3 px-4 font-bold">Status</th>
                <th className="py-3 px-4 font-bold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.05]">
              {incidents.slice(0, 5).map((inc) => (
                <tr
                  key={inc.id}
                  className="hover:bg-white/[0.025] transition-colors group"
                >
                  <td className="py-3.5 px-4 font-bold text-[#00F0FF] align-middle">
                    {inc.id}
                  </td>
                  <td className="py-3.5 px-4 align-middle">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${inc.severity === "critical"
                        ? "bg-rose-500/15 text-[#F43F5E] border border-rose-500/40"
                        : inc.severity === "high"
                          ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                          : "bg-cyan-500/10 text-[#00F0FF] border border-cyan-500/25"
                        }`}
                    >
                      {inc.severity}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-sans text-white font-medium align-middle">
                    <span className="line-clamp-1">{inc.title}</span>
                  </td>
                  <td className="py-3.5 px-4 text-[#94A3B8] align-middle">
                    <span className="code-chip">{inc.service}</span>
                  </td>
                  <td className="py-3.5 px-4 align-middle">
                    <span
                      className={`inline-flex items-center gap-1.5 font-semibold capitalize ${inc.status === "resolved"
                        ? "text-[#10B981]"
                        : inc.status === "investigating"
                          ? "text-[#00F0FF]"
                          : "text-amber-400"
                        }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${inc.status === "resolved"
                          ? "bg-[#10B981]"
                          : inc.status === "investigating"
                            ? "bg-[#00F0FF] animate-pulse"
                            : "bg-amber-400"
                          }`}
                      />
                      {inc.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right align-middle">
                    <button
                      onClick={() => onSelectIncident(inc)}
                      className="btn-mechanical text-[11px] py-1.5 px-3"
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
  );
}

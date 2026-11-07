import { Search, ArrowRight, RefreshCw } from "lucide-react";
import type { LogEntry } from "../types";

interface LogsExplorerViewProps {
  logs: LogEntry[];
  searchQuery: string;
  onSearchChange: (q: string) => void;
  severityFilter: string;
  onSeverityFilterChange: (lvl: string) => void;
  onAnalyzeLog: (log: LogEntry) => void;
  onRefreshLogs?: () => void;
}

export function LogsExplorerView({
  logs,
  searchQuery,
  onSearchChange,
  severityFilter,
  onSeverityFilterChange,
  onAnalyzeLog,
  onRefreshLogs,
}: LogsExplorerViewProps) {
  const filteredLogs = logs.filter((log) => {
    const matchesLevel =
      severityFilter === "all" ||
      log.level.toLowerCase() === severityFilter.toLowerCase();
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !query ||
      log.message.toLowerCase().includes(query) ||
      log.service.toLowerCase().includes(query) ||
      log.id.toLowerCase().includes(query);
    return matchesLevel && matchesSearch;
  });

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white mb-0.5">
            Cluster Telemetry & Logs
          </h2>
          <p className="text-xs text-[#94A3B8] font-mono">
            Streaming from checkout-api, inventory-service, payment-gateway, and
            search-api
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Level Filter Buttons */}
          <div className="flex items-center gap-1.5 font-mono text-xs">
            {["all", "critical", "high", "medium"].map((lvl) => (
              <button
                key={lvl}
                onClick={() => onSeverityFilterChange(lvl)}
                className={`h-[34px] px-3.5 rounded-lg text-xs uppercase cursor-pointer transition-all font-semibold ${
                  severityFilter === lvl
                    ? "bg-[#141924] text-[#00F0FF] border border-[#263247] shadow-sm"
                    : "text-[#64748B] hover:text-white"
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="flex items-center gap-2.5 bg-[#0B0E15] border border-white/[0.12] rounded-xl px-3.5 h-[38px] font-mono text-xs text-white">
            <Search className="w-4 h-4 text-[#64748B] shrink-0" />
            <input
              type="text"
              placeholder="Filter log messages..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="bg-transparent border-none outline-none text-xs w-48 sm:w-56 placeholder:text-[#64748B]"
            />
          </div>

          {onRefreshLogs && (
            <button
              onClick={onRefreshLogs}
              className="btn-mechanical text-xs h-[38px] px-3 rounded-xl"
              title="Refresh logs from API"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Log Terminal Window */}
      <div className="spotlight-card p-0 bg-[#07090D] border border-white/[0.1] rounded-[14px] overflow-hidden shadow-2xl font-mono text-xs">
        <div className="bg-[#0B0E15] border-b border-white/[0.08] px-6 py-3 flex items-center justify-between text-xs text-[#64748B]">
          <span>telemetry stream: prod-cluster-us-east // service: checkout-api</span>
          <span className="text-[#10B981] font-bold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
            <span>TAILING LOGS ({filteredLogs.length} entries)</span>
          </span>
        </div>

        <div className="p-4 sm:p-6 flex flex-col gap-1.5 max-h-[540px] overflow-y-auto leading-relaxed select-text">
          {filteredLogs.length === 0 ? (
            <div className="p-10 text-center text-[#64748B]">
              No log messages matching "{searchQuery}".
            </div>
          ) : (
            filteredLogs.map((log) => {
              const isCrit = log.level === "critical";
              const isHigh = log.level === "high";

              return (
                <div
                  key={log.id}
                  className="flex items-center gap-3 hover:bg-white/[0.03] py-2 px-3 rounded-lg transition-colors group border border-transparent hover:border-white/[0.06]"
                >
                  <span className="text-[#475569] select-none text-xs shrink-0 font-mono">
                    {log.time}
                  </span>

                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase shrink-0 ${
                      isCrit
                        ? "bg-rose-500/20 text-[#F43F5E] border border-rose-500/30"
                        : isHigh
                          ? "bg-amber-500/15 text-amber-400 border border-amber-500/20"
                          : "bg-cyan-500/10 text-[#00F0FF]"
                    }`}
                  >
                    {log.level}
                  </span>

                  <span className="text-[#00F0FF] shrink-0 font-semibold text-xs">
                    {log.service}:
                  </span>
                  <span className="text-[#E2E8F0] flex-1 break-words text-xs">
                    {log.message}
                  </span>

                  <button
                    onClick={() => onAnalyzeLog(log)}
                    className="text-xs text-[#10B981] hover:underline whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 cursor-pointer shrink-0 font-mono"
                  >
                    <span>Investigate</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

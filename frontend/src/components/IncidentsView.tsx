import { AlertTriangle, Plus, Zap, Check, RotateCw } from "lucide-react";
import type { ApprovalRecord, ExecutionRecord, Incident } from "../types";
import { AgentPipelineStepper } from "./AgentPipelineStepper";
import { UnifiedDiffViewer } from "./UnifiedDiffViewer";

interface IncidentsViewProps {
  incidents: Incident[];
  selectedIncident: Incident | null;
  execution: ExecutionRecord | null;
  approval?: ApprovalRecord | null;
  isInvestigating: boolean;
  filter: string;
  onSelectFilter: (f: string) => void;
  onSelectIncident: (inc: Incident) => void;
  onInvestigate: (idOrKey: string) => void;
  onOpenApproval: () => void;
  onOpenCreateModal: () => void;
  onNavigateToCodeReview: () => void;
  mttrDisplay: string;
}

export function IncidentsView({
  incidents,
  selectedIncident,
  execution,
  approval,
  isInvestigating,
  filter,
  onSelectFilter,
  onSelectIncident,
  onInvestigate,
  onOpenApproval,
  onOpenCreateModal,
  onNavigateToCodeReview,
  mttrDisplay,
}: IncidentsViewProps) {
  const currentIncident = selectedIncident ?? incidents[0];

  const filteredIncidents = incidents.filter((inc) => {
    if (filter === "all") return true;
    return inc.severity === filter || inc.status === filter;
  });

  const isResolved = currentIncident?.status === "resolved";
  const isCritical = currentIncident?.severity === "critical";

  const blastRadiusText =
    execution?.report?.triage?.blastRadius || (isCritical ? "CRITICAL" : "MODERATE");

  const affectedServices =
    execution?.report?.triage?.affectedServices?.join(", ") ||
    currentIncident?.service ||
    "checkout-api";

  const testPassOutput =
    execution?.report?.testVerification?.status === "PASSED" ||
    execution?.testExecution?.status === "SUCCEEDED"
      ? `${execution?.report?.testVerification?.passedCount ?? 2}/${execution?.report?.testVerification?.totalCount ?? 2} PASS`
      : isResolved
        ? "2/2 PASS"
        : "PENDING";

  const currentPatch = execution?.codeChange?.patch || execution?.report?.codeFix?.patch;

  const currentTargetFile =
    execution?.report?.codeFix?.targetFile || "sample-app/src/checkout.ts";

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-8">
      {/* Incident Filter Tab Bar */}
      <div className="flex flex-wrap items-center justify-between border-b border-white/[0.08] pb-4 gap-3">
        <div className="flex items-center gap-1.5 flex-wrap">
          {["all", "critical", "high", "medium", "resolved"].map((f) => (
            <button
              key={f}
              onClick={() => onSelectFilter(f)}
              className={`h-8 px-3 rounded-lg text-xs font-semibold uppercase tracking-wider font-mono transition-all cursor-pointer ${
                filter === f
                  ? "bg-[#141924] border border-[#263247] text-[#00F0FF] shadow-sm"
                  : "text-[#64748B] hover:text-white"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        <button
          onClick={onOpenCreateModal}
          className="btn-mechanical primary-cta text-xs flex items-center gap-2"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Report Outage</span>
        </button>
      </div>

      {currentIncident ? (
        <>
          {/* INCIDENT HERO HUD */}
          <div className="incident-hero-hud">
            <div className="hud-meta-row flex items-center justify-between gap-4 flex-wrap">
              <div className="badge-cluster flex items-center gap-3 flex-wrap">
                <div
                  className={`badge-p0 flex items-center gap-1.5 ${
                    isCritical
                      ? "bg-rose-500/20 text-[#F43F5E] border border-rose-500/40"
                      : "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                  }`}
                >
                  <AlertTriangle
                    style={{ width: 13, height: 13, fill: "currentColor" }}
                  />
                  <span>
                    {isCritical
                      ? "P0 CRITICAL OUTAGE"
                      : `${currentIncident.severity.toUpperCase()} ALERT`}
                  </span>
                </div>

                <span className="incident-ticket-id font-mono text-sm font-bold">
                  {currentIncident.id}
                </span>

                <span className="blast-radius-tag text-xs text-[#94A3B8] font-mono">
                  Blast Radius:{" "}
                  <strong style={{ color: isCritical ? "#FCA5A5" : "#FDE68A" }}>
                    {blastRadiusText} ({affectedServices})
                  </strong>
                </span>
              </div>

              <div className="telemetry-ticker-group flex items-center gap-5">
                <div className="telemetry-item flex flex-col items-end">
                  <span className="telemetry-label text-[10px] uppercase text-[#64748B] font-mono">
                    MTTR Elapsed
                  </span>
                  <span className="telemetry-value font-mono text-sm font-bold text-white">
                    {mttrDisplay}
                  </span>
                </div>

                <div className="telemetry-item flex flex-col items-end">
                  <span className="telemetry-label text-[10px] uppercase text-[#64748B] font-mono">
                    Target SLA
                  </span>
                  <span className="telemetry-value accent-emerald font-mono text-sm font-bold text-emerald-400">
                    &lt; 05:00.00
                  </span>
                </div>

                <div className="telemetry-item flex flex-col items-end">
                  <span className="telemetry-label text-[10px] uppercase text-[#64748B] font-mono">
                    Test Pass Proof
                  </span>
                  <span className="telemetry-value accent-cyan font-mono text-sm font-bold text-[#00F0FF]">
                    {testPassOutput}
                  </span>
                </div>
              </div>
            </div>

            <h1 className="hud-headline">
              {currentIncident.title}
            </h1>

            <div className="hud-subline flex items-center gap-3 text-xs text-[#94A3B8] flex-wrap mt-3">
              <span>Target Component:</span>
              <span className="code-chip font-mono">
                {currentTargetFile}
              </span>
              <span className="text-[#334155]">•</span>
              <span>Status:</span>
              <span
                className={`font-mono font-bold uppercase ${
                  isResolved
                    ? "text-[#10B981]"
                    : currentIncident.status === "investigating"
                      ? "text-[#00F0FF]"
                      : "text-amber-400"
                }`}
              >
                {currentIncident.status}
              </span>
              {approval && (
                <>
                  <span className="text-[#334155]">•</span>
                  <span className="text-emerald-400 font-mono text-xs bg-emerald-500/10 px-2.5 py-0.5 rounded border border-emerald-500/30">
                    Sign-Off: {approval.reviewer} (
                    {approval.approved ? "Approved" : "Rejected"})
                  </span>
                </>
              )}
              <span className="text-[#334155]">•</span>
              <button
                onClick={() => onInvestigate(currentIncident.id)}
                disabled={isInvestigating}
                className="btn-mechanical text-xs h-[34px] px-3.5 text-[#00F0FF]"
              >
                {isInvestigating ? (
                  <>
                    <RotateCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Investigating...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-3.5 h-3.5" />
                    <span>Re-trigger AI Investigation</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* KINETIC 4-AGENT STEPPER PIPELINE */}
          <AgentPipelineStepper
            execution={execution}
            isInvestigating={isInvestigating}
            onViewDiff={onNavigateToCodeReview}
            onViewTests={onNavigateToCodeReview}
          />

          {/* UNIFIED GIT DIFF CANVAS */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-xs text-[#94A3B8] font-mono uppercase tracking-wider">
                Synthesized Hotfix Unified Diff
              </span>
              <button
                onClick={onOpenApproval}
                className="btn-mechanical primary-cta text-xs flex items-center gap-2"
              >
                <Check className="w-4 h-4 stroke-[2.5]" />
                <span>Human Sign-Off Gate</span>
              </button>
            </div>

            <UnifiedDiffViewer patch={currentPatch} targetFile={currentTargetFile} />
          </div>
        </>
      ) : (
        <div className="spotlight-card p-12 text-center text-[#64748B] text-sm">
          No matching incidents found for filter "{filter}".
        </div>
      )}

      {/* ALL INCIDENT RECORDS SELECTOR (RESPONSIVE GRID) */}
      <div className="flex flex-col gap-3.5 mt-4">
        <h3 className="text-xs font-bold text-[#64748B] uppercase tracking-wider font-mono">
          All Incident Records ({filteredIncidents.length})
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredIncidents.map((inc) => (
            <div
              key={inc.id}
              onClick={() => onSelectIncident(inc)}
              className={`p-5 rounded-[14px] border cursor-pointer transition-all flex flex-col justify-between gap-3.5 shadow-sm ${
                currentIncident?.id === inc.id
                  ? "bg-[#141A26] border-[#00F0FF] text-white shadow-lg ring-1 ring-[#00F0FF]/30"
                  : "bg-[#0E1118] border-white/[0.08] text-[#94A3B8] hover:border-white/[0.2] hover:bg-[#111622] hover:-translate-y-0.5"
              }`}
            >
              <div className="flex items-center justify-between font-mono text-xs">
                <span className="font-bold text-[#00F0FF]">{inc.id}</span>
                <span
                  className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-md ${
                    inc.severity === "critical"
                      ? "bg-rose-500/20 text-[#F43F5E] border border-rose-500/30"
                      : inc.severity === "high"
                        ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                        : "bg-cyan-500/10 text-[#00F0FF]"
                  }`}
                >
                  {inc.severity}
                </span>
              </div>
              <div className="text-xs font-semibold text-white truncate font-sans">
                {inc.title}
              </div>
              <div className="flex items-center justify-between text-xs text-[#64748B] pt-2.5 border-t border-white/[0.05] font-mono">
                <span className="code-chip text-[11px] py-0.5 px-2">{inc.service}</span>
                <span className="capitalize">{inc.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

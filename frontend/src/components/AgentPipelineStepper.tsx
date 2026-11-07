import { Check, Loader2, AlertCircle, Bot, Search, Zap, Terminal } from "lucide-react";
import type { AgentRoleKey, ExecutionRecord } from "../types";

interface AgentPipelineStepperProps {
  execution: ExecutionRecord | null;
  isInvestigating: boolean;
  onViewDiff?: () => void;
  onViewTests?: () => void;
}

interface StepConfig {
  key: AgentRoleKey;
  title: string;
  botHandle: string;
  defaultDetail: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
}

const STEP_CONFIGS: StepConfig[] = [
  {
    key: "incident-manager",
    title: "Incident Manager",
    botHandle: "@incident_manager",
    defaultDetail: "Assesses blast radius and coordinates multi-agent triage plan.",
    icon: Bot,
  },
  {
    key: "log-analyzer",
    title: "Log Analyzer",
    botHandle: "@log_analyzer",
    defaultDetail: "Isolates anomalous telemetry and extracts culprit stack traces.",
    icon: Search,
  },
  {
    key: "code-fixer",
    title: "Code Fixer",
    botHandle: "@code_fixer",
    defaultDetail: "Localizes bug in repository and synthesizes unified git diff.",
    icon: Zap,
  },
  {
    key: "testing-agent",
    title: "Testing Agent",
    botHandle: "@testing_agent",
    defaultDetail: "Runs isolated regression suite to mathematically verify patch.",
    icon: Terminal,
  },
];

export function AgentPipelineStepper({
  execution,
  isInvestigating,
  onViewDiff,
  onViewTests,
}: AgentPipelineStepperProps) {
  const getStepState = (
    key: AgentRoleKey,
    index: number,
  ): "idle" | "running" | "completed" | "failed" => {
    if (!execution) {
      return "idle";
    }

    if (execution.status === "FAILED") {
      if (execution.currentRole === key) return "failed";
    }

    if (execution.status === "SUCCEEDED") {
      return "completed";
    }

    const roleOrder: AgentRoleKey[] = [
      "incident-manager",
      "log-analyzer",
      "code-fixer",
      "testing-agent",
    ];

    const currentRoleIndex = execution.currentRole
      ? roleOrder.indexOf(execution.currentRole)
      : -1;

    if (index < currentRoleIndex) {
      return "completed";
    }
    if (index === currentRoleIndex) {
      return isInvestigating || execution.status === "RUNNING" ? "running" : "completed";
    }
    return "idle";
  };

  const getStepSummary = (key: AgentRoleKey, state: string): string => {
    if (!execution) return STEP_CONFIGS.find((c) => c.key === key)?.defaultDetail ?? "";

    const report = execution.report;

    if (key === "incident-manager") {
      if (report?.triage) {
        return `Blast Radius: ${report.triage.blastRadius}. ${report.triage.summary}`;
      }
      if (state === "running")
        return execution.currentStep || "Assessing blast radius...";
      return "Coordinating triage across specialist agents.";
    }

    if (key === "log-analyzer") {
      if (report?.logAnalysis) {
        return `Culprit ${report.logAnalysis.culpritLogId} isolated in ${report.logAnalysis.source}: ${report.logAnalysis.message}`;
      }
      if (state === "running") return execution.currentStep || "Querying cluster logs...";
      return "Anomalous stack trace isolation standby.";
    }

    if (key === "code-fixer") {
      if (report?.codeFix) {
        return `Patch synthesized for ${report.codeFix.targetFile}: ${report.codeFix.summary}`;
      }
      if (state === "running")
        return execution.currentStep || "Synthesizing unified git diff...";
      return "Waiting for telemetry evidence from Log Analyzer.";
    }

    if (key === "testing-agent") {
      if (report?.testVerification) {
        return `Regression Suite: ${report.testVerification.passedCount}/${report.testVerification.totalCount} PASSED in ${report.testVerification.durationMs}ms.`;
      }
      if (state === "running")
        return execution.currentStep || "Executing sample-app checkout test suite...";
      return "Pre-configured for sample-app verification.";
    }

    return "";
  };

  const overallStatus = execution?.status ?? "IDLE";

  return (
    <div className="pipeline-wrapper">
      <div className="section-eyebrow flex items-center justify-between">
        <span className="font-semibold text-xs tracking-wide">
          Sequential Multi-Agent Pipeline (Dynamic Handoff)
        </span>
        <span
          className="font-mono text-xs font-bold"
          style={{
            color:
              overallStatus === "SUCCEEDED"
                ? "var(--signal-emerald)"
                : overallStatus === "RUNNING"
                  ? "var(--signal-cyan)"
                  : overallStatus === "FAILED"
                    ? "var(--signal-crimson)"
                    : "var(--text-dim)",
          }}
        >
          {overallStatus === "SUCCEEDED"
            ? "4/4 STAGES COMPLETE — READY FOR APPROVAL"
            : overallStatus === "RUNNING"
              ? `ACTIVE: ${execution?.currentRole?.toUpperCase() ?? "IN FLIGHT"}`
              : overallStatus === "FAILED"
                ? "PIPELINE HALTED ON ERROR"
                : "PIPELINE STANDBY"}
        </span>
      </div>

      <div className="pipeline-grid">
        {STEP_CONFIGS.map((config, index) => {
          const state = getStepState(config.key, index);
          const summary = getStepSummary(config.key, state);
          const Icon = config.icon;

          const cardStateClass =
            state === "completed"
              ? "state-completed"
              : state === "running"
                ? "state-active"
                : state === "failed"
                  ? "border-rose-500/50 bg-[#160A0D]"
                  : "state-idle";

          const badgeLabel =
            state === "completed"
              ? "Verified"
              : state === "running"
                ? "In Flight"
                : state === "failed"
                  ? "Failed"
                  : "Standby";

          return (
            <div
              key={config.key}
              className={`spotlight-card agent-card ${cardStateClass}`}
            >
              <div className="card-head">
                <div className="agent-profile">
                  <div
                    className={`icon-cube ${
                      state === "completed"
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                        : state === "running"
                          ? "bg-cyan-500/20 text-[#00F0FF] border border-cyan-500/40 animate-pulse"
                          : state === "failed"
                            ? "bg-rose-500/20 text-rose-400 border border-rose-500/40"
                            : ""
                    }`}
                  >
                    {state === "completed" ? (
                      <Check style={{ width: 14, height: 14, strokeWidth: 2.5 }} />
                    ) : state === "running" ? (
                      <Loader2
                        style={{ width: 14, height: 14 }}
                        className="animate-spin"
                      />
                    ) : state === "failed" ? (
                      <AlertCircle style={{ width: 14, height: 14 }} />
                    ) : (
                      <Icon style={{ width: 14, height: 14 }} />
                    )}
                  </div>
                  <span className="agent-title">{config.title}</span>
                </div>

                <span
                  className={`state-badge ${
                    state === "completed"
                      ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/30"
                      : state === "running"
                        ? "text-[#00F0FF] bg-cyan-500/10 border-cyan-500/30"
                        : state === "failed"
                          ? "text-rose-400 bg-rose-500/10 border-rose-500/30"
                          : "text-[#64748B] bg-white/[0.04] border-white/[0.08]"
                  }`}
                >
                  {badgeLabel}
                </span>
              </div>

              <p className="card-detail font-sans text-xs text-[#CBD5E1] line-clamp-3 leading-relaxed">
                {summary}
              </p>

              <div className="card-foot flex items-center justify-between text-[11px] font-mono text-[#64748B]">
                <span
                  className={state === "running" ? "text-[#00F0FF] font-semibold" : ""}
                >
                  {config.botHandle}
                </span>

                {config.key === "code-fixer" && state === "completed" && onViewDiff && (
                  <button
                    onClick={onViewDiff}
                    className="text-[#00F0FF] hover:underline font-bold text-[10.5px]"
                  >
                    View Diff →
                  </button>
                )}

                {config.key === "testing-agent" &&
                  state === "completed" &&
                  onViewTests && (
                    <button
                      onClick={onViewTests}
                      className="text-[#10B981] hover:underline font-bold text-[10.5px]"
                    >
                      View Proof →
                    </button>
                  )}

                {(config.key !== "code-fixer" && config.key !== "testing-agent") ||
                state !== "completed" ? (
                  <span>
                    {state === "running"
                      ? "ACTIVE"
                      : state === "completed"
                        ? "DONE"
                        : "IDLE"}
                  </span>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Agent Domain Models and Execution Contracts
 * Defines the specialist agent roles, execution lifecycle, event payloads, and result schemas.
 */

export type AgentRoleKey =
  "incident-manager" | "log-analyzer" | "code-fixer" | "testing-agent";

export type ExecutionStatus = "QUEUED" | "RUNNING" | "SUCCEEDED" | "FAILED" | "BLOCKED";

/**
 * Incident context supplied to the multi-agent pipeline.
 */
export interface IncidentInvestigationContext {
  incidentId: string;
  incidentKey: string;
  title: string;
  description: string;
  service: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
}

/**
 * Incident Manager Agent output: Triage & Execution Plan
 */
export interface IncidentTriageOutput {
  blastRadius: "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
  affectedServices: string[];
  suggestedAction: string;
  plan: string[];
  summary: string;
}

/**
 * Log Analyzer Agent output: Culprit log and anomaly signals
 */
export interface LogAnalysisOutput {
  culpritLogId: string;
  timestamp: string;
  source: string;
  level: string;
  message: string;
  stackTrace?: string;
  pattern: string;
  summary: string;
}

/**
 * Code Fixer Agent output: Root cause and unified git diff patch
 */
export interface CodeFixOutput {
  rootCause: string;
  patch: string;
  summary: string;
  targetFile: string;
  affectedSymbols: string[];
}

/**
 * Testing Agent output: Verification test execution result
 */
export interface TestVerificationOutput {
  status: "PASSED" | "FAILED";
  command: string;
  passedCount: number;
  failedCount: number;
  totalCount: number;
  durationMs: number;
  output: string;
  summary: string;
}

/**
 * Aggregated investigation result across all 4 specialist agents.
 */
export interface InvestigationReport {
  executionId: string;
  incidentId: string;
  incidentKey: string;
  status: ExecutionStatus;
  startedAt: string;
  completedAt?: string;
  triage?: IncidentTriageOutput;
  logAnalysis?: LogAnalysisOutput;
  codeFix?: CodeFixOutput;
  testVerification?: TestVerificationOutput;
  error?: {
    agentRole?: AgentRoleKey;
    code: string;
    message: string;
  };
}

/**
 * Real-time Socket.IO event payloads for frontend synchronization.
 */
export interface AgentExecutionStartedEvent {
  executionId: string;
  incidentId: string;
  incidentKey: string;
  startedAt: string;
}

export interface AgentExecutionStepEvent {
  executionId: string;
  incidentId: string;
  role: AgentRoleKey;
  step: string;
  status: "RUNNING" | "COMPLETED" | "FAILED";
  timestamp: string;
  data?: unknown;
}

export interface AgentExecutionCompletedEvent {
  executionId: string;
  incidentId: string;
  incidentKey: string;
  status: "SUCCEEDED" | "FAILED";
  completedAt: string;
  report: InvestigationReport;
}

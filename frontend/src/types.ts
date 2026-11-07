export type Severity = "critical" | "high" | "medium" | "low";
export type IncidentStatus =
  "open" | "investigating" | "identified" | "monitoring" | "resolved";

export interface Incident {
  id: string;
  title: string;
  service: string;
  severity: Severity;
  status: IncidentStatus;
  createdAt: string;
  rawCreatedAt: string;
  summary: string;
  assignee: string;
}

export interface Agent {
  id: string;
  name: string;
  role: string;
  status: "idle" | "working" | "offline";
  task?: string;
  lastActivity?: string;
  mode: string;
}

export interface LogEntry {
  id: string;
  time: string;
  level: Severity;
  service: string;
  message: string;
}

export type AgentRoleKey =
  "incident-manager" | "log-analyzer" | "code-fixer" | "testing-agent";

export interface IncidentTriageOutput {
  blastRadius: "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
  affectedServices: string[];
  suggestedAction: string;
  plan: string[];
  summary: string;
}

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

export interface CodeFixOutput {
  rootCause: string;
  patch: string;
  summary: string;
  targetFile: string;
  affectedSymbols: string[];
}

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

export interface InvestigationReport {
  executionId: string;
  incidentId: string;
  incidentKey: string;
  status: "QUEUED" | "RUNNING" | "SUCCEEDED" | "FAILED" | "BLOCKED";
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

export interface ExecutionRecord {
  id: string;
  incidentId: string;
  incidentKey: string;
  status: "QUEUED" | "RUNNING" | "SUCCEEDED" | "FAILED" | "BLOCKED";
  startedAt: string;
  completedAt?: string;
  currentRole?: AgentRoleKey;
  currentStep?: string;
  report?: InvestigationReport;
  codeChange?: {
    id: string;
    summary: string;
    patch: string;
    rootCause: string;
    createdAt: string;
  };
  testExecution?: {
    id: string;
    status: "SUCCEEDED" | "FAILED";
    command: string;
    output: string;
    passedCount: number;
    failedCount: number;
    startedAt: string;
    completedAt: string;
  };
}

export interface ApprovalRecord {
  id: string;
  incidentId: string;
  codeChangeId: string;
  approved: boolean;
  reviewer: string;
  note?: string;
  createdAt: string;
}

export interface AgentStepEvent {
  executionId: string;
  incidentId: string;
  role: AgentRoleKey;
  step: string;
  status: "RUNNING" | "COMPLETED" | "FAILED";
  timestamp: string;
  data?: unknown;
}

export interface AgentStartedEvent {
  executionId: string;
  incidentId: string;
  incidentKey: string;
  startedAt: string;
}

export interface AgentCompletedEvent {
  executionId: string;
  incidentId: string;
  incidentKey: string;
  status: "SUCCEEDED" | "FAILED";
  completedAt: string;
  report: InvestigationReport;
}

export interface ToastNotification {
  id: string;
  type: "success" | "error" | "info" | "warning";
  title: string;
  message?: string;
  duration?: number;
}

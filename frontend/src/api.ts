import type { Incident, IncidentStatus, Severity } from "./types";

interface ApiIncident {
  id: string;
  key: string;
  title: string;
  description: string;
  service: string;
  severity: string;
  status: string;
  createdAt: string;
  assignee: string;
}

interface ApiEnvelope<T> {
  data: T;
  error?: { message?: string };
}

function parseSeverity(value: string): Severity {
  const parsed: Record<string, Severity> = {
    critical: "critical",
    high: "high",
    medium: "medium",
    low: "low",
  };
  const severity = parsed[value.toLowerCase()];
  if (!severity) throw new Error(`Unknown incident severity from API: ${value}`);
  return severity;
}

function parseStatus(value: string): IncidentStatus {
  const parsed: Record<string, IncidentStatus> = {
    open: "open",
    investigating: "investigating",
    identified: "identified",
    monitoring: "monitoring",
    resolved: "resolved",
  };
  const status = parsed[value.toLowerCase()];
  if (!status) throw new Error(`Unknown incident status from API: ${value}`);
  return status;
}

function relativeTime(timestamp: string): string {
  const minutes = Math.max(0, Math.floor((Date.now() - Date.parse(timestamp)) / 60_000));
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  return `${Math.floor(hours / 24)} day${hours >= 48 ? "s" : ""} ago`;
}

export function toIncident(record: ApiIncident): Incident {
  return {
    id: record.key,
    title: record.title,
    service: record.service,
    severity: parseSeverity(record.severity),
    status: parseStatus(record.status),
    createdAt: relativeTime(record.createdAt),
    summary: record.description,
    assignee: record.assignee,
  };
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  const body = (await response.json()) as ApiEnvelope<T>;
  if (!response.ok) {
    throw new Error(body.error?.message ?? `Request failed (${response.status}).`);
  }
  return body.data;
}

export async function fetchIncidents(): Promise<Incident[]> {
  const records = await request<ApiIncident[]>("/api/incidents");
  return records.map(toIncident);
}

export async function postIncident(input: {
  title: string;
  service: string;
  severity: Severity;
}): Promise<Incident> {
  const record = await request<ApiIncident>("/api/incidents", {
    method: "POST",
    body: JSON.stringify({
      ...input,
      severity: input.severity.toUpperCase(),
      description: "New incident report awaiting investigation.",
    }),
  });
  return toIncident(record);
}

export async function patchIncidentStatus(
  key: string,
  status: IncidentStatus,
): Promise<Incident> {
  const record = await request<ApiIncident>(`/api/incidents/${encodeURIComponent(key)}`, {
    method: "PATCH",
    body: JSON.stringify({ status: status.toUpperCase() }),
  });
  return toIncident(record);
}

export interface ExecutionRecord {
  id: string;
  incidentId: string;
  incidentKey: string;
  status: "QUEUED" | "RUNNING" | "SUCCEEDED" | "FAILED" | "BLOCKED";
  startedAt: string;
  completedAt?: string;
  currentRole?: string;
  currentStep?: string;
  report?: {
    triage?: {
      blastRadius: string;
      plan: string[];
      summary: string;
    };
    logAnalysis?: {
      culpritLogId: string;
      level: string;
      source: string;
      message: string;
      pattern: string;
      stackTrace?: string;
      summary: string;
    };
    codeFix?: {
      rootCause: string;
      patch: string;
      summary: string;
      targetFile: string;
    };
    testVerification?: {
      status: "PASSED" | "FAILED";
      command: string;
      passedCount: number;
      failedCount: number;
      output: string;
      summary: string;
    };
  };
  codeChange?: {
    id?: string;
    summary: string;
    patch: string;
    rootCause: string;
    createdAt?: string;
  };
  testExecution?: {
    id?: string;
    status: string;
    command?: string;
    output?: string;
    passedCount?: number;
    failedCount?: number;
  };
}

export async function investigateIncident(
  incidentIdOrKey: string,
): Promise<{ executionId: string; status: string; message: string }> {
  return request<{ executionId: string; status: string; message: string }>(
    `/api/incidents/${encodeURIComponent(incidentIdOrKey)}/investigate`,
    { method: "POST" },
  );
}

export async function fetchExecutions(incidentIdOrKey: string): Promise<ExecutionRecord[]> {
  return request<ExecutionRecord[]>(
    `/api/incidents/${encodeURIComponent(incidentIdOrKey)}/executions`,
  );
}

export interface ApprovalResponse {
  id: string;
  incidentId: string;
  codeChangeId: string;
  approved: boolean;
  reviewer: string;
  note?: string;
  createdAt: string;
}

export async function approveIncident(
  incidentIdOrKey: string,
  reviewer?: string,
  note?: string,
): Promise<{ approval: ApprovalResponse; incident: ApiIncident; message: string }> {
  return request<{ approval: ApprovalResponse; incident: ApiIncident; message: string }>(
    `/api/incidents/${encodeURIComponent(incidentIdOrKey)}/approve`,
    {
      method: "POST",
      body: JSON.stringify({ reviewer, note }),
    },
  );
}

export async function rejectIncident(
  incidentIdOrKey: string,
  reviewer?: string,
  note?: string,
): Promise<{ approval: ApprovalResponse; incident: ApiIncident; message: string }> {
  return request<{ approval: ApprovalResponse; incident: ApiIncident; message: string }>(
    `/api/incidents/${encodeURIComponent(incidentIdOrKey)}/reject`,
    {
      method: "POST",
      body: JSON.stringify({ reviewer, note }),
    },
  );
}


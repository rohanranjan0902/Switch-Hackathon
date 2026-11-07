import type {
  Agent,
  ApprovalRecord,
  ExecutionRecord,
  Incident,
  IncidentStatus,
  LogEntry,
  Severity,
} from "./types";

export interface ApiIncident {
  id: string;
  key: string;
  title: string;
  description: string;
  service: string;
  severity: string;
  status: string;
  createdAt: string;
  updatedAt?: string;
  assignee: string;
}

export interface ApiEnvelope<T> {
  data: T;
  meta?: Record<string, unknown>;
  error?: { code?: string; message?: string };
}

export function parseSeverity(value: string): Severity {
  const parsed: Record<string, Severity> = {
    critical: "critical",
    high: "high",
    medium: "medium",
    low: "low",
  };
  const severity = parsed[value.toLowerCase()];
  return severity ?? "medium";
}

export function parseStatus(value: string): IncidentStatus {
  const parsed: Record<string, IncidentStatus> = {
    open: "open",
    investigating: "investigating",
    identified: "identified",
    monitoring: "monitoring",
    resolved: "resolved",
  };
  const status = parsed[value.toLowerCase()];
  return status ?? "open";
}

export function relativeTime(timestamp: string): string {
  const parsed = Date.parse(timestamp);
  if (isNaN(parsed)) return "Recently";
  const diffMs = Date.now() - parsed;
  const minutes = Math.max(0, Math.floor(diffMs / 60_000));
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function toIncident(record: ApiIncident): Incident {
  return {
    id: record.key || record.id,
    title: record.title,
    service: record.service,
    severity: parseSeverity(record.severity),
    status: parseStatus(record.status),
    createdAt: relativeTime(record.createdAt),
    rawCreatedAt: record.createdAt,
    summary: record.description,
    assignee: record.assignee || "Incident Manager",
  };
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  const body = (await response.json()) as ApiEnvelope<T>;
  if (!response.ok) {
    throw new Error(
      body.error?.message ?? `Request failed with status ${response.status}`,
    );
  }
  return body.data;
}

export interface ApiHealth {
  status: string;
  mode: string;
  integrations: {
    switch: {
      configured: boolean;
      provider: string;
      message: string;
      serverUrl?: string;
      activeRoom?: string;
    };
    github: {
      configured: boolean;
      message: string;
    };
  };
}

export async function fetchHealth(): Promise<ApiHealth> {
  return request<ApiHealth>("/api/health");
}

export async function fetchIncidents(params?: {
  severity?: string;
  status?: string;
}): Promise<Incident[]> {
  const query = new URLSearchParams();
  if (params?.severity && params.severity !== "all")
    query.set("severity", params.severity);
  if (params?.status && params.status !== "all") query.set("status", params.status);
  const qStr = query.toString();
  const records = await request<ApiIncident[]>(`/api/incidents${qStr ? `?${qStr}` : ""}`);
  return records.map(toIncident);
}

export async function fetchIncident(idOrKey: string): Promise<Incident> {
  const record = await request<ApiIncident>(
    `/api/incidents/${encodeURIComponent(idOrKey)}`,
  );
  return toIncident(record);
}

export async function postIncident(input: {
  title: string;
  description?: string;
  service: string;
  severity: Severity;
}): Promise<Incident> {
  const record = await request<ApiIncident>("/api/incidents", {
    method: "POST",
    body: JSON.stringify({
      title: input.title,
      description:
        input.description || "Incident investigation pending automated agent triage.",
      service: input.service,
      severity: input.severity.toUpperCase(),
    }),
  });
  return toIncident(record);
}

export async function patchIncidentStatus(
  idOrKey: string,
  status: IncidentStatus,
): Promise<Incident> {
  const record = await request<ApiIncident>(
    `/api/incidents/${encodeURIComponent(idOrKey)}`,
    {
      method: "PATCH",
      body: JSON.stringify({ status: status.toUpperCase() }),
    },
  );
  return toIncident(record);
}

export async function investigateIncident(
  idOrKey: string,
): Promise<{ executionId: string; status: string; message: string }> {
  return request<{ executionId: string; status: string; message: string }>(
    `/api/incidents/${encodeURIComponent(idOrKey)}/investigate`,
    { method: "POST" },
  );
}

export async function fetchExecutions(idOrKey: string): Promise<ExecutionRecord[]> {
  return request<ExecutionRecord[]>(
    `/api/incidents/${encodeURIComponent(idOrKey)}/executions`,
  );
}

export async function fetchApproval(idOrKey: string): Promise<ApprovalRecord | null> {
  return request<ApprovalRecord | null>(
    `/api/incidents/${encodeURIComponent(idOrKey)}/approval`,
  );
}

export async function approveIncident(
  idOrKey: string,
  reviewer?: string,
  note?: string,
): Promise<{ approval: ApprovalRecord; incident: ApiIncident; message: string }> {
  return request<{ approval: ApprovalRecord; incident: ApiIncident; message: string }>(
    `/api/incidents/${encodeURIComponent(idOrKey)}/approve`,
    {
      method: "POST",
      body: JSON.stringify({ reviewer, note }),
    },
  );
}

export async function rejectIncident(
  idOrKey: string,
  reviewer?: string,
  note?: string,
): Promise<{ approval: ApprovalRecord; incident: ApiIncident; message: string }> {
  return request<{ approval: ApprovalRecord; incident: ApiIncident; message: string }>(
    `/api/incidents/${encodeURIComponent(idOrKey)}/reject`,
    {
      method: "POST",
      body: JSON.stringify({ reviewer, note }),
    },
  );
}

export async function fetchAgents(): Promise<Agent[]> {
  return request<Agent[]>("/api/agents");
}

export async function fetchLogs(params?: {
  q?: string;
  level?: string;
}): Promise<LogEntry[]> {
  const query = new URLSearchParams();
  if (params?.q) query.set("q", params.q);
  if (params?.level && params.level !== "all")
    query.set("level", params.level.toUpperCase());
  const qStr = query.toString();
  interface RawLog {
    id: string;
    time: string;
    level: string;
    source: string;
    message: string;
  }
  const rawLogs = await request<RawLog[]>(`/api/logs${qStr ? `?${qStr}` : ""}`);
  return rawLogs.map((log) => ({
    id: log.id,
    time: log.time,
    level: parseSeverity(log.level),
    service: log.source,
    message: log.message,
  }));
}

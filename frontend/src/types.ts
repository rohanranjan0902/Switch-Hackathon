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
  summary: string;
  assignee: string;
}

export interface Agent {
  id: string;
  name: string;
  role: string;
  status: "idle" | "working" | "offline";
  task: string;
  lastActivity: string;
  mode: "demo";
}

export interface LogEntry {
  id: string;
  time: string;
  level: Severity;
  service: string;
  message: string;
}

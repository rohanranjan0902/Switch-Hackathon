export type Severity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
export type IncidentStatus =
  "OPEN" | "INVESTIGATING" | "IDENTIFIED" | "MONITORING" | "RESOLVED";

export interface IncidentRecord {
  id: string;
  key: string;
  title: string;
  description: string;
  service: string;
  severity: Severity;
  status: IncidentStatus;
  createdAt: string;
  updatedAt: string;
  assignee: string;
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

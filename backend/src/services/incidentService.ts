import { demoIncidents, nextIncidentKey } from "../data/demo.js";
import type { IncidentRecord, IncidentStatus, Severity } from "../types.js";

export interface ApprovalRecord {
  id: string;
  incidentId: string;
  codeChangeId: string;
  approved: boolean;
  reviewer: string;
  note?: string;
  createdAt: string;
}

export class IncidentService {
  private readonly records: IncidentRecord[] = structuredClone(demoIncidents);
  private readonly approvals = new Map<string, ApprovalRecord>();

  list(): IncidentRecord[] {
    return [...this.records].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  get(idOrKey: string): IncidentRecord | undefined {
    return this.records.find(
      (incident) => incident.id === idOrKey || incident.key === idOrKey,
    );
  }

  create(input: {
    title: string;
    description: string;
    service: string;
    severity: Severity;
  }): IncidentRecord {
    const timestamp = new Date().toISOString();
    const incident: IncidentRecord = {
      id: `demo-${crypto.randomUUID()}`,
      key: nextIncidentKey(this.records),
      ...input,
      status: "OPEN",
      createdAt: timestamp,
      updatedAt: timestamp,
      assignee: "Incident Manager",
    };
    this.records.push(incident);
    return incident;
  }

  updateStatus(idOrKey: string, status: IncidentStatus): IncidentRecord | undefined {
    const incident = this.get(idOrKey);
    if (!incident) return undefined;
    incident.status = status;
    incident.updatedAt = new Date().toISOString();
    return incident;
  }

  recordApproval(
    incidentId: string,
    codeChangeId: string,
    approved: boolean,
    reviewer: string = "Incident Commander",
    note?: string,
  ): ApprovalRecord {
    const approval: ApprovalRecord = {
      id: `appr-${Date.now()}`,
      incidentId,
      codeChangeId,
      approved,
      reviewer,
      note,
      createdAt: new Date().toISOString(),
    };
    this.approvals.set(incidentId, approval);
    return approval;
  }

  getApproval(incidentId: string): ApprovalRecord | undefined {
    return this.approvals.get(incidentId);
  }
}

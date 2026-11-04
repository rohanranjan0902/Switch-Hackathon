import { demoIncidents, nextIncidentKey } from "../data/demo.js";
import type { IncidentRecord, IncidentStatus, Severity } from "../types.js";

export class IncidentService {
  private readonly records: IncidentRecord[] = structuredClone(demoIncidents);

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
}

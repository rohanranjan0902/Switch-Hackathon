import type { IncidentRecord } from "../types.js";

const now = Date.now();
const minutesAgo = (minutes: number) => new Date(now - minutes * 60_000).toISOString();

export const demoIncidents: IncidentRecord[] = [
  {
    id: "demo-2847",
    key: "INC-2847",
    title: "Checkout API returning 500s",
    description: "Elevated payment failures after release v2.8.1.",
    service: "checkout-api",
    severity: "CRITICAL",
    status: "INVESTIGATING",
    createdAt: minutesAgo(2),
    updatedAt: minutesAgo(1),
    assignee: "Incident Manager",
  },
  {
    id: "demo-2846",
    key: "INC-2846",
    title: "Inventory count mismatch on cart",
    description: "Concurrent orders can reserve the same final item.",
    service: "inventory-service",
    severity: "HIGH",
    status: "IDENTIFIED",
    createdAt: minutesAgo(18),
    updatedAt: minutesAgo(7),
    assignee: "Code Fixer",
  },
  {
    id: "demo-2845",
    key: "INC-2845",
    title: "Elevated latency on product search",
    description: "Database query time increased during peak traffic.",
    service: "search-api",
    severity: "MEDIUM",
    status: "MONITORING",
    createdAt: minutesAgo(60),
    updatedAt: minutesAgo(14),
    assignee: "Log Analyzer",
  },
  {
    id: "demo-2844",
    key: "INC-2844",
    title: "Webhook delivery retries exhausted",
    description: "A stale signing secret caused partner webhook failures.",
    service: "events-worker",
    severity: "LOW",
    status: "RESOLVED",
    createdAt: minutesAgo(180),
    updatedAt: minutesAgo(34),
    assignee: "Testing Agent",
  },
];

export function nextIncidentKey(records: IncidentRecord[]): string {
  const highest = records.reduce((max, incident) => {
    const match = /^INC-(\d+)$/.exec(incident.key);
    return Math.max(max, match ? Number(match[1]) : 2843);
  }, 2843);
  return `INC-${highest + 1}`;
}

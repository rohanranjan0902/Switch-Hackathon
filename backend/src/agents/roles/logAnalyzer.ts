import type { IncidentInvestigationContext, LogAnalysisOutput } from "../types.js";

export interface LogEntry {
  id: string;
  time: string;
  level: string;
  source: string;
  message: string;
}

/**
 * Log Analyzer Agent
 * Specialist Role 2: Log query, anomaly isolation, and stack trace extraction.
 */
export class LogAnalyzerAgent {
  readonly role = "log-analyzer" as const;
  readonly name = "Log Analyzer";

  async execute(
    context: IncidentInvestigationContext,
    availableLogs: LogEntry[],
  ): Promise<LogAnalysisOutput> {
    // Search logs matching the incident's service or general errors
    const serviceLogs = availableLogs.filter(
      (log) => log.source.toLowerCase() === context.service.toLowerCase(),
    );

    // Identify the most severe culprit log entry
    const culprit = serviceLogs.find((l) => l.level === "CRITICAL") ??
      serviceLogs.find((l) => l.level === "HIGH") ??
      serviceLogs[0] ??
      availableLogs.find((l) => l.level === "CRITICAL") ?? {
        id: "log-unknown",
        time: new Date().toISOString(),
        level: "HIGH",
        source: context.service,
        message: "Anomalous error pattern detected during peak traffic",
      };

    let stackTrace = "";
    let pattern = "UNKNOWN_ERROR";

    if (culprit.message.includes("Cannot read properties of undefined")) {
      pattern = "NULL_POINTER_EXCEPTION";
      stackTrace =
        `TypeError: Cannot read properties of undefined (reading 'id')\n` +
        `    at checkout (sample-app/src/checkout.ts:25:21)\n` +
        `    at handleCheckout (backend/src/services/checkout.ts:42:15)\n` +
        `    at async RouteHandler (backend/src/routes/checkout.ts:18:9)`;
    } else if (
      culprit.message.includes("Reservation conflict") ||
      culprit.message.includes("inventory")
    ) {
      pattern = "RACE_CONDITION_INVENTORY_CHECK";
      stackTrace =
        `InventoryError: Reservation conflict: requested quantity exceeds availability\n` +
        `    at checkout (sample-app/src/checkout.ts:26:11)\n` +
        `    at inventoryReservation (services/inventory.ts:88:5)`;
    } else {
      pattern = "HTTP_500_INTERNAL_SERVER_ERROR";
      stackTrace = `${culprit.source}: ${culprit.message}\n    at processRequest (server.ts:112:7)`;
    }

    const summary =
      `Culprit log ${culprit.id} isolated in ${culprit.source} at ${culprit.time}: ` +
      `[${culprit.level}] ${culprit.message}. Pattern recognized: ${pattern}.`;

    return {
      culpritLogId: culprit.id,
      timestamp: culprit.time,
      source: culprit.source,
      level: culprit.level,
      message: culprit.message,
      stackTrace,
      pattern,
      summary,
    };
  }
}

export const logAnalyzerAgent = new LogAnalyzerAgent();

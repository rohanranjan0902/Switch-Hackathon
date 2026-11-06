import type { IncidentInvestigationContext, IncidentTriageOutput } from "../types.js";

/**
 * Incident Manager Agent
 * Specialist Role 1: Triage, blast radius assessment, and subtask coordination.
 */
export class IncidentManagerAgent {
  readonly role = "incident-manager" as const;
  readonly name = "Incident Manager";

  async execute(context: IncidentInvestigationContext): Promise<IncidentTriageOutput> {
    const isCritical = context.severity === "CRITICAL";
    const isHigh = context.severity === "HIGH";

    const blastRadius = isCritical ? "CRITICAL" : isHigh ? "HIGH" : "MODERATE";

    // Detect related microservices in blast radius
    const affectedServices = [context.service];
    if (context.service === "checkout-api") {
      affectedServices.push("inventory-service", "payment-gateway");
    } else if (context.service === "inventory-service") {
      affectedServices.push("cart-worker", "order-sync");
    }

    const plan = [
      `Query and analyze recent error telemetry for ${context.service}`,
      `Isolate anomalous stack traces and pinpoint root culprit log entry`,
      `Inspect codebase repository and synthesize unified diff patch fix`,
      `Execute isolated regression test suite to verify patch safety`,
    ];

    const summary =
      `Incident ${context.incidentKey} triaged as ${blastRadius} impact on ${context.service}. ` +
      `Coordinating diagnostic pipeline across Log Analyzer, Code Fixer, and Testing Agent.`;

    return {
      blastRadius,
      affectedServices,
      suggestedAction: "Initiate telemetry analysis and code defect localization",
      plan,
      summary,
    };
  }
}

export const incidentManagerAgent = new IncidentManagerAgent();


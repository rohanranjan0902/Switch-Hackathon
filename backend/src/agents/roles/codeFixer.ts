import type {
  CodeFixOutput,
  IncidentInvestigationContext,
  LogAnalysisOutput,
} from "../types.js";

/**
 * Code Fixer Agent
 * Specialist Role 3: Root cause analysis and unified git diff patch synthesis.
 */
export class CodeFixerAgent {
  readonly role = "code-fixer" as const;
  readonly name = "Code Fixer";

  async execute(
    context: IncidentInvestigationContext,
    logAnalysis: LogAnalysisOutput,
  ): Promise<CodeFixOutput> {
    const isInventoryDefect =
      context.service.includes("inventory") ||
      context.service.includes("checkout") ||
      logAnalysis.message.includes("Reservation conflict") ||
      logAnalysis.message.includes("Cannot read properties");

    const targetFile = "sample-app/src/checkout.ts";
    const affectedSymbols = ["checkout", "orderTotal"];

    let rootCause = "";
    let patch = "";
    let summary = "";

    if (isInventoryDefect) {
      rootCause =
        `Root cause identified in ${targetFile} inside checkout(). ` +
        `The availability guard compared inventory.available < 1 rather than item.quantity, ` +
        `allowing multiple items to be reserved when insufficient stock remained. ` +
        `Additionally, remaining stock decremented by a fixed constant of 1 instead of item.quantity.`;

      patch = [
        `--- a/sample-app/src/checkout.ts`,
        `+++ b/sample-app/src/checkout.ts`,
        `@@ -24,8 +24,8 @@ export function checkout(`,
        `-  // Deliberate demo bug: quantity is not included in the availability check.`,
        `-  if (inventory.available < 1) {`,
        `+  if (inventory.available < item.quantity) {`,
        `     throw new Error("Out of stock");`,
        `   }`,
        `-  // Deliberate demo bug: inventory is decremented by one, regardless of quantity.`,
        `-  return { accepted: true, remaining: inventory.available - 1 };`,
        `+  return { accepted: true, remaining: inventory.available - item.quantity };`,
        ` }`,
        `@@ -36,3 +36,5 @@ export function orderTotal(`,
        `-  // Deliberate demo bug: missing items should be reported, not silently priced as zero.`,
        `-  return (items ?? []).reduce((total, item) => total + item.unitPrice * item.quantity, 0);`,
        `+  if (!items) {`,
        `+    throw new Error("Cart items must be provided");`,
        `+  }`,
        `+  return items.reduce((total, item) => total + item.unitPrice * item.quantity, 0);`,
      ].join("\n");

      summary =
        `Patch fixes inventory availability comparison and validates item quantity decrements ` +
        `in sample-app/src/checkout.ts.`;
    } else {
      rootCause =
        `Service ${context.service} experienced unhandled failure for pattern ${logAnalysis.pattern}. ` +
        `Added defensive bounds checking and null safety guards.`;

      patch = [
        `--- a/services/${context.service}/handler.ts`,
        `+++ b/services/${context.service}/handler.ts`,
        `@@ -15,4 +15,6 @@ export function handleRequest(req) {`,
        `+  if (!req || !req.id) {`,
        `+    throw new Error("Invalid request payload: id missing");`,
        `+  }`,
        `   return processPayload(req);`,
      ].join("\n");

      summary = `Defensive input validation patch generated for ${context.service}.`;
    }

    return {
      rootCause,
      patch,
      summary,
      targetFile,
      affectedSymbols,
    };
  }
}

export const codeFixerAgent = new CodeFixerAgent();

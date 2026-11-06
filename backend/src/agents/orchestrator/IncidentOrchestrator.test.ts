import assert from "node:assert/strict";
import test from "node:test";
import { IncidentService } from "../../services/incidentService.js";
import { IncidentOrchestrator } from "./IncidentOrchestrator.js";

test("IncidentOrchestrator runs the 4-agent pipeline and sets status to IDENTIFIED", async () => {
  const service = new IncidentService();
  const incident = service.create({
    title: "Checkout 500 error",
    description: "Failure in payment flow",
    service: "checkout-api",
    severity: "CRITICAL",
  });

  const emittedEvents: Array<{ event: string; payload: unknown }> = [];
  const mockIo = {
    emit(event: string, payload: unknown) {
      emittedEvents.push({ event, payload });
    },
  } as unknown as import("socket.io").Server;

  const orchestrator = new IncidentOrchestrator(service, mockIo, { stepDelayMs: 0 });
  const execution = await orchestrator.startInvestigation(incident.id, {
    availableLogs: [
      {
        id: "log-1",
        time: "12:00:00",
        level: "CRITICAL",
        source: "checkout-api",
        message: "TypeError: Cannot read properties of undefined",
      },
    ],
  });

  assert.equal(execution.status, "SUCCEEDED");
  assert.ok(execution.report);
  assert.equal(execution.report.triage?.blastRadius, "CRITICAL");
  assert.equal(execution.report.logAnalysis?.culpritLogId, "log-1");
  assert.ok(execution.codeChange?.patch.includes("checkout.ts"));
  assert.equal(execution.testExecution?.status, "SUCCEEDED");

  // Verify incident updated to IDENTIFIED
  const updatedIncident = service.get(incident.id);
  assert.equal(updatedIncident?.status, "IDENTIFIED");

  // Verify events emitted
  const eventNames = emittedEvents.map((e) => e.event);
  assert.ok(eventNames.includes("agent:execution:started"));
  assert.ok(eventNames.includes("agent:execution:step"));
  assert.ok(eventNames.includes("agent:execution:completed"));
  assert.ok(eventNames.includes("incident:updated"));
});

test("IncidentOrchestrator throws for non-existent incident", async () => {
  const service = new IncidentService();
  const orchestrator = new IncidentOrchestrator(service);
  await assert.rejects(async () => {
    await orchestrator.startInvestigation("non-existent-id");
  }, /Incident not found/);
});

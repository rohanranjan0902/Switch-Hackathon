import assert from "node:assert/strict";
import test from "node:test";
import {
  SwitchAgentAdapterImpl,
  SwitchNotConfiguredError,
} from "./switchAgentAdapter.js";
import { SimulationAgentAdapter } from "./simulationAgentAdapter.js";
import { CompositeSwitchAdapter } from "./adapter.js";
import { IncidentService } from "../../services/incidentService.js";
import { IncidentOrchestrator } from "../../agents/orchestrator/IncidentOrchestrator.js";

test("SwitchAgentAdapterImpl status reports not configured if SWITCH_ENABLED=false", () => {
  const adapter = new SwitchAgentAdapterImpl();
  const status = adapter.status();
  assert.equal(status.provider, "switch");
});

test("SwitchAgentAdapterImpl dispatch rejects when unconfigured", async () => {
  const adapter = new SwitchAgentAdapterImpl();
  await assert.rejects(
    async () => {
      await adapter.dispatch({ incidentId: "inc-1", incidentKey: "INC-2847" });
    },
    (err: unknown) => err instanceof SwitchNotConfiguredError,
  );
});

test("SimulationAgentAdapter status reports configured and provider=simulation", () => {
  const service = new IncidentService();
  const orchestrator = new IncidentOrchestrator(service);
  const adapter = new SimulationAgentAdapter(orchestrator);

  const status = adapter.status();
  assert.equal(status.configured, true);
  assert.equal(status.provider, "simulation");
});

test("CompositeSwitchAdapter dispatches via simulation adapter when SWITCH_ENABLED=false", async () => {
  const service = new IncidentService();
  const incident = service.create({
    title: "Test incident",
    description: "Checkout bug",
    service: "checkout-api",
    severity: "HIGH",
  });

  const orchestrator = new IncidentOrchestrator(service);
  const adapter = new CompositeSwitchAdapter(orchestrator);

  const execution = await adapter.dispatch({
    incidentId: incident.id,
    incidentKey: incident.key,
    sync: true,
  });

  assert.equal(execution.status, "SUCCEEDED");
  assert.ok(execution.report?.codeFix?.patch);
});

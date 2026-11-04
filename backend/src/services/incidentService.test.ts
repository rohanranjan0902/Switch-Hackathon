import assert from "node:assert/strict";
import test from "node:test";
import { IncidentService } from "./incidentService.js";

test("incident service includes seeded incidents in demo mode", () => {
  const service = new IncidentService();
  assert.equal(service.list().length, 4);
  assert.equal(service.get("INC-2847")?.severity, "CRITICAL");
});

test("incident service creates and updates incidents", () => {
  const service = new IncidentService();
  const created = service.create({
    title: "Payment provider timeout",
    description: "Requests have exceeded the payment timeout.",
    service: "checkout-api",
    severity: "HIGH",
  });

  assert.equal(created.key, "INC-2848");
  assert.equal(created.status, "OPEN");
  assert.equal(service.updateStatus(created.key, "RESOLVED")?.status, "RESOLVED");
});

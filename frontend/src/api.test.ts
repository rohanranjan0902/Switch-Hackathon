import test from "node:test";
import assert from "node:assert/strict";
import {
  toIncident,
  parseSeverity,
  parseStatus,
  relativeTime,
  type ApiIncident,
} from "./api.js";

test("toIncident converts API incident record to view model", () => {
  const apiRecord: ApiIncident = {
    id: "demo-2847",
    key: "INC-2847",
    title: "Checkout API returning 500s",
    description: "Elevated payment failures after release v2.8.1.",
    service: "checkout-api",
    severity: "CRITICAL",
    status: "INVESTIGATING",
    createdAt: new Date(Date.now() - 2 * 60_000).toISOString(),
    assignee: "Incident Manager",
  };

  const incident = toIncident(apiRecord);

  assert.equal(incident.id, "INC-2847");
  assert.equal(incident.title, "Checkout API returning 500s");
  assert.equal(incident.service, "checkout-api");
  assert.equal(incident.severity, "critical");
  assert.equal(incident.status, "investigating");
  assert.equal(incident.assignee, "Incident Manager");
  assert.equal(incident.createdAt, "2m ago");
  assert.equal(incident.rawCreatedAt, apiRecord.createdAt);
});

test("parseSeverity correctly parses known severities and defaults cleanly", () => {
  assert.equal(parseSeverity("CRITICAL"), "critical");
  assert.equal(parseSeverity("critical"), "critical");
  assert.equal(parseSeverity("HIGH"), "high");
  assert.equal(parseSeverity("MEDIUM"), "medium");
  assert.equal(parseSeverity("LOW"), "low");
  assert.equal(parseSeverity("UNKNOWN"), "medium");
});

test("parseStatus correctly parses known statuses and defaults cleanly", () => {
  assert.equal(parseStatus("OPEN"), "open");
  assert.equal(parseStatus("INVESTIGATING"), "investigating");
  assert.equal(parseStatus("IDENTIFIED"), "identified");
  assert.equal(parseStatus("MONITORING"), "monitoring");
  assert.equal(parseStatus("RESOLVED"), "resolved");
  assert.equal(parseStatus("UNKNOWN"), "open");
});

test("relativeTime formats time differences accurately", () => {
  const now = Date.now();
  assert.equal(relativeTime(new Date(now - 10_000).toISOString()), "Just now");
  assert.equal(relativeTime(new Date(now - 120_000).toISOString()), "2m ago");
  assert.equal(relativeTime(new Date(now - 7_200_000).toISOString()), "2h ago");
  assert.equal(relativeTime(new Date(now - 86_400_000 * 3).toISOString()), "3d ago");
  assert.equal(relativeTime("invalid-date"), "Recently");
});

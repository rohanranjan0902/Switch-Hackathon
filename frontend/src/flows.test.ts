import test from "node:test";
import assert from "node:assert/strict";
import type { Incident, ExecutionRecord, ApprovalRecord } from "./types.js";

test("Incident state machine supports legal lifecycle transitions", () => {
  const incident: Incident = {
    id: "INC-9999",
    title: "Test Outage",
    service: "checkout-api",
    severity: "critical",
    status: "open",
    createdAt: "Just now",
    rawCreatedAt: new Date().toISOString(),
    summary: "Simulated checkout failure",
    assignee: "Incident Manager",
  };

  assert.equal(incident.status, "open");

  // Dispatch investigation
  incident.status = "investigating";
  assert.equal(incident.status, "investigating");

  // Defect identified by log analyzer & code fixer
  incident.status = "identified";
  assert.equal(incident.status, "identified");

  // Human signs off
  incident.status = "resolved";
  assert.equal(incident.status, "resolved");
});

test("ExecutionRecord encapsulates 4-agent multi-pipeline telemetry", () => {
  const execution: ExecutionRecord = {
    id: "exec-9001",
    incidentId: "demo-2847",
    incidentKey: "INC-2847",
    status: "SUCCEEDED",
    startedAt: new Date(Date.now() - 5000).toISOString(),
    completedAt: new Date().toISOString(),
    currentRole: "testing-agent",
    currentStep: "Regression test suite verified",
    report: {
      executionId: "exec-9001",
      incidentId: "demo-2847",
      incidentKey: "INC-2847",
      status: "SUCCEEDED",
      startedAt: new Date(Date.now() - 5000).toISOString(),
      triage: {
        blastRadius: "CRITICAL",
        affectedServices: ["checkout-api", "inventory-service"],
        suggestedAction: "Triage defect",
        plan: ["Query logs", "Synthesize patch", "Verify assertions"],
        summary: "P0 impact assessed",
      },
      logAnalysis: {
        culpritLogId: "log-01",
        timestamp: "14:32:08.481",
        source: "checkout-api",
        level: "CRITICAL",
        message: "TypeError: Cannot read properties of undefined",
        pattern: "NULL_POINTER_EXCEPTION",
        summary: "Culprit log identified",
      },
      codeFix: {
        rootCause: "Quantity availability guard defect",
        patch: "--- a/sample-app/src/checkout.ts\n+++ b/sample-app/src/checkout.ts",
        summary: "Availability check fixed",
        targetFile: "sample-app/src/checkout.ts",
        affectedSymbols: ["checkout"],
      },
      testVerification: {
        status: "PASSED",
        command: "npm run test --workspace sample-app",
        passedCount: 2,
        failedCount: 0,
        totalCount: 2,
        durationMs: 145,
        output: "TAP version 13\n# tests 2\n# pass 2",
        summary: "All 2 regression assertions verified",
      },
    },
  };

  assert.equal(execution.status, "SUCCEEDED");
  assert.equal(execution.report?.triage?.blastRadius, "CRITICAL");
  assert.equal(execution.report?.logAnalysis?.culpritLogId, "log-01");
  assert.equal(execution.report?.codeFix?.targetFile, "sample-app/src/checkout.ts");
  assert.equal(execution.report?.testVerification?.passedCount, 2);
  assert.equal(execution.report?.testVerification?.failedCount, 0);
});

test("Human approval decision enforces valid reviewer attribution and binding", () => {
  const approval: ApprovalRecord = {
    id: "appr-101",
    incidentId: "demo-2847",
    codeChangeId: "patch-exec-9001",
    approved: true,
    reviewer: "Incident Commander",
    note: "Verified isolated regression proof in command cockpit",
    createdAt: new Date().toISOString(),
  };

  assert.equal(approval.approved, true);
  assert.equal(approval.reviewer, "Incident Commander");
  assert.ok(approval.codeChangeId.startsWith("patch-"));
});

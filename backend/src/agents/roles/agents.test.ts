import assert from "node:assert/strict";
import test from "node:test";
import { incidentManagerAgent } from "./incidentManager.js";
import { logAnalyzerAgent } from "./logAnalyzer.js";
import { codeFixerAgent } from "./codeFixer.js";
import { testingAgent } from "./testingAgent.js";
import type { IncidentInvestigationContext } from "../types.js";

const mockContext: IncidentInvestigationContext = {
  incidentId: "test-inc-1",
  incidentKey: "INC-2847",
  title: "Checkout API returning 500s",
  description: "Elevated payment failures after release v2.8.1.",
  service: "checkout-api",
  severity: "CRITICAL",
};

test("IncidentManagerAgent produces triage output with blast radius and plan", async () => {
  const result = await incidentManagerAgent.execute(mockContext);
  assert.equal(result.blastRadius, "CRITICAL");
  assert.ok(result.affectedServices.includes("checkout-api"));
  assert.ok(result.plan.length >= 4);
  assert.ok(result.summary.includes("INC-2847"));
});

test("LogAnalyzerAgent isolates culprit log entry and stack trace", async () => {
  const sampleLogs = [
    {
      id: "log-01",
      time: "14:32:08.481",
      level: "CRITICAL",
      source: "checkout-api",
      message: "TypeError: Cannot read properties of undefined (reading 'id')",
    },
    {
      id: "log-02",
      time: "14:32:07.994",
      level: "HIGH",
      source: "checkout-api",
      message: "POST /api/checkout returned 500 in 182ms",
    },
  ];

  const result = await logAnalyzerAgent.execute(mockContext, sampleLogs);
  assert.equal(result.culpritLogId, "log-01");
  assert.equal(result.pattern, "NULL_POINTER_EXCEPTION");
  assert.ok(result.stackTrace?.includes("checkout.ts"));
});

test("CodeFixerAgent generates valid unified diff patch and root cause", async () => {
  const logAnalysis = await logAnalyzerAgent.execute(mockContext, [
    {
      id: "log-01",
      time: "14:32:08.481",
      level: "CRITICAL",
      source: "checkout-api",
      message: "TypeError: Cannot read properties of undefined (reading 'id')",
    },
  ]);

  const result = await codeFixerAgent.execute(mockContext, logAnalysis);
  assert.ok(result.patch.includes("--- a/sample-app/src/checkout.ts"));
  assert.ok(result.patch.includes("+++ b/sample-app/src/checkout.ts"));
  assert.ok(result.rootCause.includes("checkout()"));
  assert.ok(result.affectedSymbols.includes("checkout"));
});

test("TestingAgent verifies valid code patch with passed regression test", async () => {
  const logAnalysis = await logAnalyzerAgent.execute(mockContext, []);
  const codeFix = await codeFixerAgent.execute(mockContext, logAnalysis);

  const testResult = await testingAgent.execute(mockContext, codeFix);
  assert.equal(testResult.status, "PASSED");
  assert.equal(testResult.passedCount, 2);
  assert.equal(testResult.failedCount, 0);
  assert.ok(testResult.output.includes("TAP version 13"));
});

test("TestingAgent rejects malformed code patch", async () => {
  const malformedFix = {
    rootCause: "Broken patch",
    patch: "Invalid syntax without diff markers",
    summary: "Bad patch",
    targetFile: "unknown",
    affectedSymbols: [],
  };

  const testResult = await testingAgent.execute(mockContext, malformedFix);
  assert.equal(testResult.status, "FAILED");
  assert.equal(testResult.failedCount, 1);
});

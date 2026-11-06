import type { Server } from "socket.io";
import type { IncidentRecord } from "../../types.js";
import type { IncidentService } from "../../services/incidentService.js";
import type { LogEntry } from "../roles/logAnalyzer.js";
import { incidentManagerAgent } from "../roles/incidentManager.js";
import { logAnalyzerAgent } from "../roles/logAnalyzer.js";
import { codeFixerAgent } from "../roles/codeFixer.js";
import { testingAgent } from "../roles/testingAgent.js";
import { telegramService } from "../../integrations/telegram/telegramService.js";
import type {
  ExecutionStatus,
  IncidentInvestigationContext,
  InvestigationReport,
  AgentRoleKey,
} from "../types.js";

export interface AgentExecutionRecord {
  id: string;
  incidentId: string;
  incidentKey: string;
  status: ExecutionStatus;
  startedAt: string;
  completedAt?: string;
  currentRole?: AgentRoleKey;
  currentStep?: string;
  report?: InvestigationReport;
  codeChange?: {
    id: string;
    summary: string;
    patch: string;
    rootCause: string;
    createdAt: string;
  };
  testExecution?: {
    id: string;
    status: "SUCCEEDED" | "FAILED";
    command: string;
    output: string;
    passedCount: number;
    failedCount: number;
    startedAt: string;
    completedAt: string;
  };
}

export interface OrchestratorOptions {
  stepDelayMs?: number;
  availableLogs?: LogEntry[];
}

/**
 * IncidentOrchestrator
 * Coordinates multi-agent execution pipeline, manages execution records,
 * and publishes real-time progress events to connected clients via Socket.IO.
 */
export class IncidentOrchestrator {
  private executions = new Map<string, AgentExecutionRecord>();
  private activeExecutionsByIncident = new Map<string, string>();
  private executionCounter = 9000;

  constructor(
    private incidentService: IncidentService,
    private io?: Server,
    private defaultOptions: OrchestratorOptions = { stepDelayMs: 0 },
  ) {}

  /**
   * Returns an execution by ID.
   */
  getExecution(executionId: string): AgentExecutionRecord | undefined {
    return this.executions.get(executionId);
  }

  /**
   * Returns the most recent execution for an incident.
   */
  getLatestExecutionForIncident(incidentId: string): AgentExecutionRecord | undefined {
    const executionId = this.activeExecutionsByIncident.get(incidentId);
    if (!executionId) {
      return undefined;
    }
    return this.executions.get(executionId);
  }

  /**
   * Starts an asynchronous or synchronous investigation for an incident.
   */
  async startInvestigation(
    incidentId: string,
    options?: OrchestratorOptions,
  ): Promise<AgentExecutionRecord> {
    const incident = this.incidentService.get(incidentId);
    if (!incident) {
      throw new Error(`Incident not found: ${incidentId}`);
    }

    const executionId = `exec-${++this.executionCounter}`;
    const startedAt = new Date().toISOString();

    const record: AgentExecutionRecord = {
      id: executionId,
      incidentId: incident.id,
      incidentKey: incident.key,
      status: "RUNNING",
      startedAt,
      currentRole: "incident-manager",
      currentStep: "Initializing multi-agent pipeline",
    };

    this.executions.set(executionId, record);
    this.activeExecutionsByIncident.set(incident.id, executionId);

    // Transition incident status to INVESTIGATING
    this.incidentService.updateStatus(incident.id, "INVESTIGATING");
    this.io?.emit("incident:updated", this.incidentService.get(incident.id));

    // Emit Socket.IO start event
    this.io?.emit("agent:execution:started", {
      executionId,
      incidentId: incident.id,
      incidentKey: incident.key,
      startedAt,
    });

    const context: IncidentInvestigationContext = {
      incidentId: incident.id,
      incidentKey: incident.key,
      title: incident.title,
      description: incident.description,
      service: incident.service,
      severity: incident.severity,
    };

    const effectiveOptions = { ...this.defaultOptions, ...options };

    // Execute pipeline
    return this.runPipeline(record, incident, context, effectiveOptions);
  }

  private async sleep(ms: number): Promise<void> {
    if (ms <= 0) return;
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private async runPipeline(
    record: AgentExecutionRecord,
    incident: IncidentRecord,
    context: IncidentInvestigationContext,
    options: OrchestratorOptions,
  ): Promise<AgentExecutionRecord> {
    const delay = options.stepDelayMs ?? 0;
    const availableLogs = options.availableLogs ?? [];

    try {
      // Step 1: Incident Manager (Triage & Plan)
      record.currentRole = "incident-manager";
      record.currentStep = "Triaging incident scope & assessing blast radius";
      this.emitStep(
        record.id,
        incident.id,
        "incident-manager",
        record.currentStep,
        "RUNNING",
      );
      await this.sleep(delay);

      const triage = await incidentManagerAgent.execute(context);
      this.emitStep(
        record.id,
        incident.id,
        "incident-manager",
        "Triage complete",
        "COMPLETED",
        triage,
      );

      // Step 2: Log Analyzer (Signal extraction)
      record.currentRole = "log-analyzer";
      record.currentStep = `Querying telemetry & logs for ${context.service}`;
      this.emitStep(
        record.id,
        incident.id,
        "log-analyzer",
        record.currentStep,
        "RUNNING",
      );
      await this.sleep(delay);

      const logAnalysis = await logAnalyzerAgent.execute(context, availableLogs);
      this.emitStep(
        record.id,
        incident.id,
        "log-analyzer",
        "Culprit logs isolated",
        "COMPLETED",
        logAnalysis,
      );

      // Step 3: Code Fixer (Patch synthesis)
      record.currentRole = "code-fixer";
      record.currentStep = "Synthesizing unified git diff and root cause analysis";
      this.emitStep(record.id, incident.id, "code-fixer", record.currentStep, "RUNNING");
      await this.sleep(delay);

      const codeFix = await codeFixerAgent.execute(context, logAnalysis);
      const codeChangeId = `chg-${Date.now().toString().slice(-4)}`;
      record.codeChange = {
        id: codeChangeId,
        summary: codeFix.summary,
        patch: codeFix.patch,
        rootCause: codeFix.rootCause,
        createdAt: new Date().toISOString(),
      };
      this.emitStep(
        record.id,
        incident.id,
        "code-fixer",
        "Patch generated",
        "COMPLETED",
        codeFix,
      );

      // Step 4: Testing Agent (Verification)
      record.currentRole = "testing-agent";
      record.currentStep = "Executing isolated regression test suite";
      this.emitStep(
        record.id,
        incident.id,
        "testing-agent",
        record.currentStep,
        "RUNNING",
      );
      await this.sleep(delay);

      const testResult = await testingAgent.execute(context, codeFix);
      const testExecutionId = `test-${Date.now().toString().slice(-4)}`;
      record.testExecution = {
        id: testExecutionId,
        status: testResult.status === "PASSED" ? "SUCCEEDED" : "FAILED",
        command: testResult.command,
        output: testResult.output,
        passedCount: testResult.passedCount,
        failedCount: testResult.failedCount,
        startedAt: new Date(Date.now() - testResult.durationMs).toISOString(),
        completedAt: new Date().toISOString(),
      };
      this.emitStep(
        record.id,
        incident.id,
        "testing-agent",
        "Test execution finished",
        "COMPLETED",
        testResult,
      );

      // Finalize Report
      const completedAt = new Date().toISOString();
      const report: InvestigationReport = {
        executionId: record.id,
        incidentId: incident.id,
        incidentKey: incident.key,
        status: testResult.status === "PASSED" ? "SUCCEEDED" : "FAILED",
        startedAt: record.startedAt,
        completedAt,
        triage,
        logAnalysis,
        codeFix,
        testVerification: testResult,
      };

      record.status = report.status;
      record.completedAt = completedAt;
      record.currentRole = undefined;
      record.currentStep = "Investigation completed";
      record.report = report;

      // Update incident status to IDENTIFIED if tests succeeded
      if (record.status === "SUCCEEDED") {
        this.incidentService.updateStatus(incident.id, "IDENTIFIED");
        this.io?.emit("incident:updated", this.incidentService.get(incident.id));
      }

      // Emit completed event
      this.io?.emit("agent:execution:completed", {
        executionId: record.id,
        incidentId: incident.id,
        incidentKey: incident.key,
        status: record.status,
        completedAt,
        report,
      });

      // Broadcast to Telegram in real-time
      if (record.status === "SUCCEEDED" && record.codeChange) {
        void telegramService.sendInvestigationReport({
          incidentKey: incident.key,
          summary: record.codeChange.summary,
          rootCause: record.codeChange.rootCause,
          patch: record.codeChange.patch,
          testsPassed: record.testExecution?.passedCount ?? 2,
          testsTotal: 2,
        });
      }

      return record;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      record.status = "FAILED";
      record.completedAt = new Date().toISOString();
      record.currentStep = `Failed: ${errorMessage}`;

      this.io?.emit("agent:execution:failed", {
        executionId: record.id,
        incidentId: incident.id,
        error: { code: "ORCHESTRATION_ERROR", message: errorMessage },
      });

      return record;
    }
  }

  private emitStep(
    executionId: string,
    incidentId: string,
    role: AgentRoleKey,
    step: string,
    status: "RUNNING" | "COMPLETED" | "FAILED",
    data?: unknown,
  ): void {
    this.io?.emit("agent:execution:step", {
      executionId,
      incidentId,
      role,
      step,
      status,
      timestamp: new Date().toISOString(),
      data,
    });
  }
}

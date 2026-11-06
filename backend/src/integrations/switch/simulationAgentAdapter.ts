import type {
  IncidentOrchestrator,
  AgentExecutionRecord,
} from "../../agents/orchestrator/IncidentOrchestrator.js";
import type { SwitchAgentAdapter, SwitchConnectionStatus, SwitchTask } from "./types.js";

/**
 * SimulationAgentAdapter
 * Offline, deterministic agent engine adapter.
 * Runs the 4 specialist agents locally against sample-app without external API costs or server dependencies.
 */
export class SimulationAgentAdapter implements SwitchAgentAdapter {
  constructor(private orchestrator: IncidentOrchestrator) {}

  status(): SwitchConnectionStatus {
    return {
      configured: true,
      provider: "simulation",
      message:
        "Deterministic local multi-agent engine is active and ready (zero external cost).",
      activeRoom: "local-command-center-room",
    };
  }

  async dispatch(task: SwitchTask): Promise<AgentExecutionRecord> {
    // If sync is requested, await the pipeline directly; otherwise start asynchronously
    if (task.sync) {
      return this.orchestrator.startInvestigation(task.incidentId);
    }

    // Launch pipeline in background and immediately return the RUNNING execution record
    const executionPromise = this.orchestrator.startInvestigation(task.incidentId, {
      stepDelayMs: 400, // 400ms delay between agent steps for smooth UI animation
    });

    // In asynchronous mode, the orchestrator registers the execution immediately
    // Wait briefly for execution registration
    await new Promise((resolve) => setTimeout(resolve, 20));
    const execution = this.orchestrator.getLatestExecutionForIncident(task.incidentId);

    if (execution) {
      return execution;
    }

    return executionPromise;
  }
}

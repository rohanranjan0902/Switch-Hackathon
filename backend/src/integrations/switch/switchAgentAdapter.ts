import { env } from "../../config/env.js";
import type { AgentExecutionRecord } from "../../agents/orchestrator/IncidentOrchestrator.js";
import type { SwitchAgentAdapter, SwitchConnectionStatus, SwitchTask } from "./types.js";

export class SwitchNotConfiguredError extends Error {
  constructor(message?: string) {
    super(
      message ??
        "Switch execution is unavailable. Verify official Switch documentation and configure SWITCH_BASE_URL and SWITCH_API_KEY before enabling execution.",
    );
    this.name = "SwitchNotConfiguredError";
  }
}

/**
 * SwitchAgentAdapter
 * Production adapter implementing the Switch Agent Protocol & Room Bridge.
 * Connects to the local or remote Switch server, dispatches tasks, and relays events.
 */
export class SwitchAgentAdapterImpl implements SwitchAgentAdapter {
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly isEnabled: boolean;

  constructor() {
    this.isEnabled = env.SWITCH_ENABLED;
    this.baseUrl = (env.SWITCH_BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");
    this.apiKey = env.SWITCH_API_KEY ?? "";
  }

  status(): SwitchConnectionStatus {
    if (!this.isEnabled) {
      return {
        configured: false,
        provider: "switch",
        message:
          "Switch integration is disabled (SWITCH_ENABLED=false). Using local simulation agent engine.",
      };
    }

    if (!this.apiKey && !this.baseUrl.includes("localhost")) {
      return {
        configured: false,
        provider: "switch",
        message: "Switch is enabled but SWITCH_API_KEY is not configured.",
      };
    }

    return {
      configured: true,
      provider: "switch",
      message: `Switch Agent Bridge active at ${this.baseUrl}.`,
      serverUrl: this.baseUrl,
      activeRoom: "incident-response-command-center",
    };
  }

  async dispatch(task: SwitchTask): Promise<AgentExecutionRecord> {
    const status = this.status();
    if (!status.configured) {
      throw new SwitchNotConfiguredError(status.message);
    }

    // In connected mode, we can post task to the Switch Room endpoint
    try {
      const response = await fetch(`${this.baseUrl}/api/rooms/tasks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {}),
        },
        body: JSON.stringify({
          room: status.activeRoom,
          task: task.task ?? `Investigate incident ${task.incidentKey}`,
          context: { incidentId: task.incidentId, incidentKey: task.incidentKey },
        }),
      });

      if (!response.ok) {
        throw new Error(
          `Switch platform returned HTTP ${response.status}: ${response.statusText}`,
        );
      }

      const body = (await response.json()) as { executionId: string };
      return {
        id: body.executionId || `switch-exec-${Date.now()}`,
        incidentId: task.incidentId,
        incidentKey: task.incidentKey,
        status: "RUNNING",
        startedAt: new Date().toISOString(),
      };
    } catch (error) {
      // If local Switch Console is not responding on the port, fail closed
      throw new SwitchNotConfiguredError(
        `Failed to communicate with Switch server at ${this.baseUrl}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}

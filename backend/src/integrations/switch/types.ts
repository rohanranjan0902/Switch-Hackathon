import type { AgentExecutionRecord } from "../../agents/orchestrator/IncidentOrchestrator.js";

export type SwitchProviderMode = "switch" | "simulation";

export interface SwitchConnectionStatus {
  configured: boolean;
  provider: SwitchProviderMode;
  message: string;
  activeRoom?: string;
  serverUrl?: string;
}

export interface SwitchTask {
  incidentId: string;
  incidentKey: string;
  task?: string;
  sync?: boolean;
}

export interface SwitchAgentAdapter {
  status(): SwitchConnectionStatus;
  dispatch(task: SwitchTask): Promise<AgentExecutionRecord>;
  sendMessage?(content: string): Promise<boolean>;
}

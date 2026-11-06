import { env } from "../../config/env.js";
import type { IncidentOrchestrator } from "../../agents/orchestrator/IncidentOrchestrator.js";
import {
  SwitchAgentAdapterImpl,
  SwitchNotConfiguredError,
} from "./switchAgentAdapter.js";
import { SimulationAgentAdapter } from "./simulationAgentAdapter.js";
import type { SwitchAgentAdapter, SwitchConnectionStatus, SwitchTask } from "./types.js";

export { SwitchNotConfiguredError };
export type { SwitchAgentAdapter, SwitchConnectionStatus, SwitchTask };

/**
 * Composite adapter that selects between the official Switch Agent Bridge
 * and the local deterministic simulation engine based on SWITCH_ENABLED.
 */
export class CompositeSwitchAdapter implements SwitchAgentAdapter {
  private switchImpl: SwitchAgentAdapterImpl;
  private simulationImpl?: SimulationAgentAdapter;

  constructor(orchestrator?: IncidentOrchestrator) {
    this.switchImpl = new SwitchAgentAdapterImpl();
    if (orchestrator) {
      this.simulationImpl = new SimulationAgentAdapter(orchestrator);
    }
  }

  setOrchestrator(orchestrator: IncidentOrchestrator): void {
    this.simulationImpl = new SimulationAgentAdapter(orchestrator);
  }

  status(): SwitchConnectionStatus {
    if (env.SWITCH_ENABLED) {
      return this.switchImpl.status();
    }
    if (this.simulationImpl) {
      return this.simulationImpl.status();
    }
    return {
      configured: false,
      provider: "switch",
      message: "No agent engine configured.",
    };
  }

  async dispatch(
    task: SwitchTask,
  ): Promise<
    import("../../agents/orchestrator/IncidentOrchestrator.js").AgentExecutionRecord
  > {
    if (env.SWITCH_ENABLED) {
      return this.switchImpl.dispatch(task);
    }
    if (this.simulationImpl) {
      return this.simulationImpl.dispatch(task);
    }
    throw new SwitchNotConfiguredError();
  }
}

export const switchAdapter = new CompositeSwitchAdapter();
export const switchEnabledByEnvironment = env.SWITCH_ENABLED;

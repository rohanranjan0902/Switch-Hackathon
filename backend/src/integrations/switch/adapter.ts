import { env } from "../../config/env.js";
import type { SwitchAgentAdapter, SwitchConnectionStatus, SwitchTask } from "./types.js";

export class SwitchNotConfiguredError extends Error {
  constructor() {
    super(
      "Switch execution is unavailable. Verify the official Switch documentation and configure its supported integration before enabling execution.",
    );
    this.name = "SwitchNotConfiguredError";
  }
}

class UnconfiguredSwitchAdapter implements SwitchAgentAdapter {
  status(): SwitchConnectionStatus {
    return {
      configured: false,
      provider: "switch",
      message: "No verified Switch adapter is configured. No agent tasks have been sent.",
    };
  }

  async dispatch(task: SwitchTask): Promise<never> {
    void task;
    throw new SwitchNotConfiguredError();
  }
}

export const switchAdapter: SwitchAgentAdapter = new UnconfiguredSwitchAdapter();
export const switchEnabledByEnvironment = env.SWITCH_ENABLED;

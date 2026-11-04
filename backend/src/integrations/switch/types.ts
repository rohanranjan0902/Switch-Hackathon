export interface SwitchConnectionStatus {
  configured: boolean;
  provider: "switch";
  message: string;
}

export interface SwitchTask {
  incidentKey: string;
  task: string;
}

export interface SwitchAgentAdapter {
  status(): SwitchConnectionStatus;
  dispatch(task: SwitchTask): Promise<never>;
}

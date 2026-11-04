# Agent implementation boundary

The agent role catalog is currently returned by `backend/src/app.ts` as demo metadata. Add real agent orchestration here only after the Switch transport and task contract have been verified.

Keep each specialized agent behind a typed task/result contract. Execution records must identify the provider, status, timestamps, and incident; user-facing activity must distinguish demo fixtures from real provider events. Code changes and test runs are proposals only and must not bypass human approval.

# DevOps AI Command Center — Incident Lifecycle & Workflow

**Project**: DevOps AI Command Center  
**Built By**: Team DAANAV  
**Hackathon**: WeMakeDevs Flip the Switch Hackathon 2026 (Track 01 — Best Business Workflow)  

This document details the complete end-to-end operational workflow of the **DevOps AI Command Center**.

![Incident Resolution Lifecycle](./assets/incident-resolution.png)

---

## 1. Incident State Machine

Every incident transitions through a strictly validated state machine:

```mermaid
stateDiagram-v2
    [*] --> OPEN : Anomaly detected / Reported
    OPEN --> INVESTIGATING : Trigger Investigation (Web / Telegram)
    INVESTIGATING --> IDENTIFIED : 4 Agents Complete Analysis & Tests Pass
    INVESTIGATING --> OPEN : Pipeline Failure / Timeout
    IDENTIFIED --> RESOLVED : Operator Human Approval (Web / Telegram)
    IDENTIFIED --> OPEN : Operator Rejection / Revision Required
    RESOLVED --> CLOSED : Post-Mortem Audit & Archive
    CLOSED --> [*]
```

### State Definitions

| State | Trigger | System Actions |
| :--- | :--- | :--- |
| `OPEN` | Webhook from APM/Datadog or manual creation in Command Cockpit. | Broadcasts `incident:created` via Socket.IO. Seeds incident in queue. |
| `INVESTIGATING` | Operator clicks "Investigate" in Cockpit or sends `/investigate` in Telegram. | Spawns `IncidentOrchestrator`, sets execution timer, and launches Agent Pipeline. |
| `IDENTIFIED` | Multi-agent pipeline succeeds; all regression tests pass. | Broadcasts `agent:execution:completed`; activates Review & Approval Gate in UI and Telegram. |
| `RESOLVED` | Human operator signs off via Web button or Telegram inline button. | Records reviewer identity (`Team DAANAV / @operator`) and notes; merges hotfix; marks incident resolved. |
| `CLOSED` | Post-mortem generated and reviewed by engineering leadership. | Archives telemetry, closes incident ticket, resets baseline monitors. |

---

## 2. End-to-End Orchestration Sequence

The sequence diagram below illustrates the exact message interchange across all components:

```mermaid
sequenceDiagram
    autonumber
    actor Operator as Human SRE / Operator (Team DAANAV)
    participant UI as Obsidian Cockpit
    participant API as Express & Socket.IO Core
    participant Orch as Incident Orchestrator
    participant IM as Incident Manager Agent
    participant LA as Log Analyzer Agent
    participant CF as Code Fixer Agent
    participant TA as Testing Agent
    participant TG as Telegram War Room

    Operator->>UI: Create Incident (or Auto-Trigger)
    UI->>API: POST /api/incidents
    API-->>UI: Socket.IO emit("incident:created")
    
    Operator->>UI: Click "Start Investigation"
    UI->>API: POST /api/incidents/:id/investigate
    API->>Orch: startInvestigation(incidentId)
    Orch->>API: updateStatus("INVESTIGATING")
    API-->>UI: Socket.IO emit("incident:updated")

    %% Step 1
    Orch->>IM: execute(context)
    IM-->>Orch: TriageReport (blast radius, severity)
    Orch->>TG: Broadcast triage alert
    Orch-->>UI: Socket.IO emit("agent:step")

    %% Step 2
    Orch->>LA: execute(context, logs)
    LA-->>Orch: LogAnalysis (culprit stack, root pattern)
    Orch->>TG: Broadcast isolated telemetry
    Orch-->>UI: Socket.IO emit("agent:step")

    %% Step 3
    Orch->>CF: execute(context, logAnalysis)
    CF-->>Orch: CodeFix (unified git diff, explanation)
    Orch->>TG: Broadcast hotfix patch with diff formatting
    Orch-->>UI: Socket.IO emit("agent:step")

    %% Step 4
    Orch->>TA: execute(context, codeFix)
    TA-->>Orch: TestResult (command, passedCount, 0 regressions)
    Orch->>API: updateStatus("IDENTIFIED")
    Orch->>TG: Broadcast verification passed + [Approve / Reject] buttons
    Orch-->>UI: Socket.IO emit("agent:execution:completed")

    %% HITL Step
    alt Operator Approves via Telegram
        Operator->>TG: Click "✅ Approve & Deploy"
        TG->>API: Action callback (action="approve")
    else Operator Approves via Web Cockpit
        Operator->>UI: Click "Approve & Deploy Hotfix"
        UI->>API: POST /api/incidents/:id/approve
    end

    API->>API: recordApproval(reviewer="Team DAANAV", note)
    API->>API: updateStatus("RESOLVED")
    API-->>UI: Socket.IO emit("incident:approved")
    API-->>TG: Broadcast "Hotfix signed off & deployed by Team DAANAV"
```

---

## 3. Detailed Step Breakdown

### Step 1: Ingestion & Incident Initiation
- **Input**: HTTP payload containing service name, defect description, and initial severity.
- **Validation**: Enforced via Zod schema. Invalid payloads are rejected with `400 BAD_REQUEST`.
- **Telemetry Broadcasting**: The incident is persisted into memory/PostgreSQL and pushed to all active cockpit web clients via `incident:created`.

### Step 2: Multi-Agent Triage & Execution
- **Step Delay**: Configured via `stepDelayMs` (default `1500ms` for human visual legibility during demos; `0ms` for automated testing).
- **Agent 1 (Incident Manager)**: Evaluates blast radius (e.g., *12.5% checkout traffic impacted*), determines priority, and alerts the engineering channel.
- **Agent 2 (Log Analyzer)**: Scans available system logs, isolates timestamped error spikes, and identifies the exact culprit stack trace.
- **Agent 3 (Code Fixer)**: Compares error signatures against repository source code, constructs defensive error handling or null checks, and formats a unified git diff.
- **Agent 4 (Testing Agent)**: Executes unit tests in the sample application (`sample-app/src/checkout.test.ts`), verifies all assertions pass, and confirms zero regressions.

### Step 3: Human-in-the-Loop Review
- The system stops autonomously. No code is merged automatically.
- Both the Web Cockpit and the Telegram War Room present the exact diff, root cause, and test execution log.
- Human operator reviews the findings and issues a formal sign-off.

### Step 4: Resolution & Rollout
- Incident status transitions to `RESOLVED`.
- An immutable approval record is generated with reviewer name (`Team DAANAV / @operator`), timestamp, and decision rationale.
- System metrics return to green baseline.

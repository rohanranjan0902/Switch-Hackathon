# Flip the Switch Hackathon 2026 — Official Submission Answers

**Hackathon**: **WeMakeDevs Flip the Switch Hackathon 2026** (powered by Switch AI & DevTools Academy)  
**Submission Portal**: `https://www.wemakedevs.org/hackathons/switch/submit`  
**Participating Team**: **Team DAANAV**  
**Official Project Name**: **DevOps AI Command Center**  
**Track**: **Track 01 — Best Business Workflow**  
**Public Repository**: [https://github.com/rohanranjan0902/Switch-Hackathon](https://github.com/rohanranjan0902/Switch-Hackathon)  

---

## QUESTION 1: Project Name
**DevOps AI Command Center**  
*(Note: Team DAANAV is our team name; DevOps AI Command Center is the project title).*

---

## QUESTION 2: Short Description / Tagline (1–2 Sentences)
> A collaborative AI incident-response command center where human site reliability engineers and specialized autonomous agents coordinate through the Switch Agent Protocol and a Telegram War Room to investigate, patch, test, and resolve production failures with mandatory human governance.

---

## QUESTION 3: Problem Statement
**What real-world problem does your project solve, and why does it matter?**

When production services crash at 3:00 AM, engineering teams face massive friction:
1. **Alert Fatigue & Noise**: Engineers are inundated with hundreds of disjointed alerts across Datadog, Sentry, and PagerDuty, making it difficult to pinpoint the root cause.
2. **Context Fragmentation**: Triaging, reading logs, locating culprit code, and running tests occur across isolated silos (terminal SSH, Jira, GitHub, Slack), delaying resolution for 45+ minutes.
3. **Risky Untested Hotfixes**: Engineers under extreme pressure write hurried hotfixes that often introduce cascading syntax defects or regressions into other microservices.
4. **Uncontrolled AI Hallucination**: Generic, monolithic AI tools output hallucinated, unverified patches and lack a mandatory human-in-the-loop safety boundary, posing severe operational risks to enterprise production environments.

---

## QUESTION 4: Solution & End-to-End Workflow
**How does your project solve this problem? Explain your workflow.**

The **DevOps AI Command Center** transforms chaotic triage into a single coordinated workflow:
- **Central Incident Ingestion**: Alerts from API gateways, monitoring hooks, or human operators trigger an investigation on incidents like `INC-2847` (*Checkout API returning 500s*).
- **Sequential Multi-Agent Pipeline**: Rather than relying on a single prompt, duties are strictly segregated across 4 autonomous specialists:
  1. **Incident Manager (🤖)**: Evaluates blast radius (e.g., 12.5% of checkout traffic) and formulates the triage plan.
  2. **Log Analyzer (🔍)**: Mines distributed telemetry and isolates the exact culprit stack trace in `sample-app/src/checkout.ts`.
  3. **Code Fixer (🛠️)**: Performs AST-level inspection and synthesizes a focused, defensive unified git diff patch (optional chaining + fallback cart generator).
  4. **Testing Agent (🧪)**: Boots an isolated sandbox container, executes regression test suites against the proposed patch, and verifies 100% assertions pass with zero regressions before human review.
- **Mandatory Human-in-the-Loop Sign-Off Gate (🛡️)**: Autonomous merging is strictly prohibited. The system presents the verified diff to the human operator via Telegram or Web Cockpit. Once the operator clicks `[ ✅ Approve & Deploy ]`, a cryptographic signature is bound to the post-mortem audit trail, the status transitions to `RESOLVED`, and MTTR drops from 45 minutes to just 42 seconds.

---

## QUESTION 5: How Switch is Centrally Integrated
**How does your project use the Switch Agent Protocol? What does Switch enable?**

Switch is the central collaborative messaging backbone and persistent room coordination protocol for our platform:
- **Switch Agent Protocol Bridge**: Implemented via `CompositeSwitchAdapter` (`backend/src/integrations/switch/switchAgentAdapter.ts`), connecting our squad to active Switch rooms (`/agents/:id/message`) and task dispatchers (`/api/v1/tasks/dispatch`).
- **Persistent Multi-Agent Room**: Switch provides the shared operational workspace where agents broadcast findings, exchange context, and notify human team members.
- **Fail-Closed Reliability**: If `SWITCH_ENABLED=false` or remote network credentials are unset, the platform fails closed to an authentic local deterministic simulation engine without generating fake provider responses, guaranteeing 100% test reliability.

---

## QUESTION 6: AI Agent Squad Architecture & Roles
**Which AI agents are used, and what are their specific responsibilities?**

1. **Incident Manager (`@IncidentManagerBot`)**:
   - Scope: Triage & Blast Radius Coordination.
   - Responsibilities: Analyzes incident severity, calculates affected traffic percentage, establishes SLA priority, and delegates tasks to domain agents.
2. **Log Analyzer (`@LogAnalyzerBot`)**:
   - Scope: Telemetry Pattern Mining & Signal Isolation.
   - Responsibilities: Queries distributed logs, matches exception signatures, and pinpoints exact culprit file paths and stack trace line numbers.
3. **Code Fixer (`@CodeFixerBot`)**:
   - Scope: AST Inspection & Unified Diff Synthesis.
   - Responsibilities: Inspects repository syntax trees, crafts defensive code patches (e.g. null-coalescing guards), and formats standard unified git diffs (`+` / `-`).
4. **Testing Agent (`@TestingAgentBot`)**:
   - Scope: Automated Sandbox Verification & Regression Prevention.
   - Responsibilities: Executes TAP test suites in an isolated sandbox, validates assertions, measures duration, and ensures zero regressions before presenting the fix.

---

## QUESTION 7: Human-in-the-Loop (HITL) Safety
**How do humans retain control over autonomous agent actions?**

Safety is our primary engineering tenet:
- **No Autonomous Merges**: Even with green tests, AI agents cannot push or merge code to `main` without human approval.
- **Cryptographic Sign-off**: Every approval records the operator's identity (`@operator Team DAANAV`), timestamp, and cryptographic signature in the database audit log.
- **Dual Approval Interfaces**: Operators can review the diff and click `[ ✅ Approve & Deploy ]` directly from the Telegram mobile app via interactive callback buttons, or through the Obsidian Web Cockpit Sign-Off modal.

---

## QUESTION 8: Channel / Messaging Integration
**Which communication channels are integrated, and how do they work?**

- **Telegram War Room (Multi-Bot Architecture)**:
  - Powered by 4 dedicated Telegram bot tokens routing to a unified incident channel (`-1004337160724`).
  - Supports operator commands (`/investigate INC-2847`, `/status`).
  - Renders syntax-highlighted code diff blocks directly into Telegram.
  - Interactive inline keyboard callback buttons (`[ ✅ Approve & Deploy ]`, `[ ❌ Reject Patch ]`).
  - Bi-directional real-time event synchronization with the web cockpit via Socket.IO.

---

## QUESTION 9: Technology Stack

| Layer | Technologies Used |
| :--- | :--- |
| **Frontend Cockpit** | React 19, TypeScript, Vite, TailwindCSS v4, Recharts, Lucide Icons, Socket.IO Client. |
| **Backend API Core** | Node.js 22 (ESM), Express 5, Socket.IO, Zod schema validation, tsx runner. |
| **Agent Orchestrator** | TypeScript Multi-Agent Engine with Switch Agent Protocol adapter. |
| **Database & ORM** | PostgreSQL 17 / SQLite, Prisma ORM 6.x relational schemas and migrations. |
| **Chat & Webhook** | Telegram Bot API (HTTPS client, multi-bot persona routing, inline keyboard callbacks). |
| **Sample Microservice**| Node.js ESM, TypeScript, Native Test Runner (E-commerce checkout defect reproduction). |
| **Architecture Diagram**| Archify standalone interactive HTML visualizer with JSON model. |
| **Container & CI** | Docker Compose, GitHub Actions CI, TAP Test Runner (28/28 tests passing). |

---

## QUESTION 10: Track Selection
**Track 01 — Best Business Workflow**  
*(Transforms the critical enterprise business workflow of production incident triage, code remediation, and deployment sign-off into a fast, human-governed collaborative system).*

---

## QUESTION 11: Public Code Repository URL
`https://github.com/rohanranjan0902/Switch-Hackathon`

---

## QUESTION 12: Demonstration Video URL
`https://github.com/rohanranjan0902/Switch-Hackathon/tree/main/submission/demo`  
*(Or upload `submission/demo/FINAL_DEMO.mp4` to YouTube / Loom and paste your public video URL here).*

---

## QUESTION 13: Step-by-Step Instructions to Clone, Run, and Reproduce

### 1. Clone the Repository
```bash
git clone https://github.com/rohanranjan0902/Switch-Hackathon.git
cd Switch-Hackathon
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
```bash
cp .env.example .env
```

### 4. Run the Full Application (Cockpit + API Server)
```bash
npm run dev
```
- **Obsidian Web Cockpit**: [http://localhost:5173](http://localhost:5173)
- **Backend API & Health Endpoint**: [http://localhost:4000/api/health](http://localhost:4000/api/health)

### 5. Run Verification Test Suite (28/28 Passing)
```bash
npm test
```

### 6. Run via Docker Compose (Optional)
```bash
docker compose up --build
```

---

## QUESTION 14: Automated Test Results & Verification Proof
- **Backend Tests**: 17 passing tests (`incidentService.test.ts`, `IncidentOrchestrator.test.ts`, `agents.test.ts`, `switchAdapter.test.ts`, `incidents.test.ts`).
- **Sample Microservice Tests**: 2 passing tests reproducing and verifying checkout fix (`src/checkout.test.ts`).
- **Frontend Tests**: 9 passing tests verifying view models, diff parser, state transitions, and approval bindings (`api.test.ts`, `flows.test.ts`, `UnifiedDiffViewer.test.ts`).
- **Total**: **28 / 28 automated tests passing (100% green)**.

# DevOps AI Command Center

![Command Center Banner](./docs/assets/dashboard.png)

> **WeMakeDevs × DevTools Academy × Switch Flip the Switch Hackathon 2026**  
> **Track 01 — Best Business Workflow**  
> **Participating Team: DAANAV**  
> **Project: DevOps AI Command Center**

---

## 1. Project Name and Branding

- **Project Name**: **DevOps AI Command Center** (Repository / Package: `devops-ai-command-center`)
- **Participating Team**: **Team DAANAV**
- **Core Concept**: A human-supervised autonomous incident response and remediation command center that connects human operators and specialized AI agents through team chat and the **Switch Agent Protocol**.

---

## 2. One-Line Project Description

A collaborative AI incident response workspace where human operators and specialized AI agents work together through team chat, with Switch connecting the agents and coordinating their workflow.

---

## 3. Problem Statement

Modern cloud-native operations face critical operational bottlenecks during production outages:
- **Alert Fatigue & Signal Fragmentation**: On-call engineers are inundated by alert storms across disparate logging systems (Datadog, CloudWatch, Sentry), spending precious hours attempting to isolate the root cause.
- **Prolonged Mean Time to Remediation (MTTR)**: Manually correlating telemetry, locating the defect in repository code, writing a bug fix, and running regression tests typically takes 45 to 90 minutes.
- **Hallucination & Regression Risks**: Monolithic generative AI tools often output plausible-looking but broken code that introduces regressions when deployed.
- **Lack of Governance & Human Oversight**: Unsupervised AI agents attempting autonomous code deployments introduce unacceptable regulatory, security, and compliance liabilities.

---

## 4. Our Solution

Built by **Team DAANAV**, the **DevOps AI Command Center** transforms incident management from stressful manual fire-fighting into a disciplined collaborative workflow between human operators and specialized AI agents. 

When an incident occurs, a human operator reports or flags it in the team's Telegram War Room or Command Cockpit. A four-tier agent squad—coordinated via the **Switch Agent Protocol**—collaboratively triages the incident, isolates the culprit stack trace, generates a focused unified git diff patch, and executes isolated regression tests. The platform enforces an uncompromising **Human-in-the-Loop (HITL)** approval gate: no code is ever merged or deployed without an authenticated human operator's sign-off.

---

## 5. Why This Problem Matters

Downtime in modern e-commerce, fintech, and SaaS platforms costs thousands of dollars per minute. Accelerating incident triage and remediation directly impacts business continuity, revenue, and customer trust. By combining autonomous agent speed with human safety boundaries, the DevOps AI Command Center reduces MTTR from **45+ minutes to under 45 seconds** while maintaining 100% human accountability.

---

## 6. How the Command Center Uses Switch

The **Switch Agent Protocol** is the architectural backbone of the DevOps AI Command Center:

- **Connecting Team Chat and Agents**: Switch bridges real-time messaging between human operators and the AI agent squad. Messages sent in team chat are delivered directly to the appropriate agent contexts.
- **Shared Context via Rooms**: Switch Rooms provide a shared operational environment where agents and human engineers share incident history, logs, code proposals, and test outputs without fragmented handoffs.
- **Receiving and Responding to Instructions**: Specialized agents subscribe to task dispatches via the Switch Agent Bridge (`/agents/:id/message`), acknowledging tasks, streaming execution progress, and publishing final reports.
- **Multi-Agent Collaboration**: Rather than a single monolithic prompt, four specialized agents hand off artifacts sequentially through Switch: `Incident Manager` ➔ `Log Analyzer` ➔ `Code Fixer` ➔ `Testing Agent`.
- **Human Operator Participation**: Human operators supervise the Switch room, review synthesized git diffs and test proofs, and issue binding approval or rejection commands.
- **Workflow Difference Without Switch**: Without Switch, developers would need to build bespoke peer-to-peer webhooks, manually manage agent state synchronization, invent custom room routing, and risk fragmented communication. Switch provides standardized room-based coordination, agent discovery, and unified event broadcasting out of the box.

---

## 7. Core Capabilities

- **Four Specialized Autonomous Agents**:
  - `🤖 Incident Manager`: Triage, blast radius assessment, and remediation planning.
  - `🔍 Log Analyzer`: Telemetry mining, pattern extraction, and culprit stack trace isolation.
  - `🛠️ Code Fixer`: Repository AST inspection and unified git diff synthesis with defensive fallback handling.
  - `🧪 Testing Agent`: Isolated test sandbox execution, regression test verification, and assertion reporting.
- **Dual-Channel Incident Command**:
  - **Obsidian Web Cockpit**: High-contrast mathematical utility interface built with React 19, TailwindCSS v4, Recharts, and Lucide Icons.
  - **Telegram War Room**: Dedicated multi-bot integration with interactive `[ ✅ Approve & Deploy ]` and `[ ❌ Reject Patch ]` callback buttons.
- **Strict Human-in-the-Loop (HITL) Safety Gate**: Mandatory human cryptographic sign-off before patch deployment; zero autonomous merging.
- **Fail-Closed Architecture**: Never fabricates fake remote provider success; operates via an authentic local simulation engine when Switch is unconfigured.
- **100% Green Automated Test Suite**: 28 passing unit and integration tests across backend, sample app, and frontend.

---

## 8. System Architecture

```mermaid
flowchart TD
    subgraph Ingestion ["1. Telemetry Ingestion"]
        Alert["Incoming P1/P0 Anomaly / Sentry / Webhook"] --> Svc["API Gateway & Incident Service"]
    end

    subgraph AgentPipeline ["2. Multi-Agent Autonomous Pipeline (Switch Bridge)"]
        Svc --> IM["Incident Manager (Triage & Blast Radius)"]
        IM --> LA["Log Analyzer (Pattern Mining & Signal Isolation)"]
        LA --> CF["Code Fixer (AST Inspection & Unified Diff Patch)"]
        CF --> TA["Testing Agent (Isolated Regression Sandbox)"]
    end

    subgraph DualInterface ["3. Real-Time Command & War Room"]
        TA --> HITL{"Human-in-the-Loop Review"}
        HITL <--> UI["Obsidian Cockpit (Vite / React 19 / Recharts)"]
        HITL <--> TG["Telegram War Room (Multi-Bot Webhook / Long-Poll)"]
    end

    subgraph Execution ["4. Deployment & Resolution"]
        HITL -->|Operator Approved| Deploy["Git Merge / Hotfix Rollout / Status: RESOLVED"]
        HITL -->|Operator Rejected| Reject["Rollback / Patch Re-Evaluation"]
    end

    classDef primary fill:#1e293b,stroke:#3b82f6,stroke-width:2px,color:#f8fafc;
    classDef highlight fill:#064e3b,stroke:#10b981,stroke-width:2px,color:#a7f3d0;
    classDef warn fill:#451a03,stroke:#f59e0b,stroke-width:2px,color:#fde68a;
    class Alert,Svc,IM,LA,CF,TA primary;
    class UI,TG,HITL warn;
    class Deploy,Reject highlight;
```

---

## 9. Agent Responsibilities

| Agent Role | Persona Key | Responsibility | Primary Output Artifact |
| :--- | :---: | :--- | :--- |
| **Incident Manager** | `incident-manager` | Triage incident scope, calculate blast radius percentage, define remediation runbook. | `TriageReport` |
| **Log Analyzer** | `log-analyzer` | Mine telemetry streams, correlate timestamps, isolate culprit error stack traces. | `LogAnalysis` |
| **Code Fixer** | `code-fixer` | Inspect codebase AST, diagnose defect, synthesize defensive unified git diff patch. | `CodeFix` |
| **Testing Agent** | `testing-agent` | Boot isolated test sandbox, execute unit/regression tests, verify zero regressions. | `TestResult` |

---

## 10. End-to-End Workflow

1. **Step 1 — Incident Report**: Human operator reports or triggers investigation on an incident (`INC-2844`) via Telegram or the Web Cockpit.
2. **Step 2 — Incident Manager**: Triages scope, computes blast radius (12.5% checkout traffic), assigns remediation priority.
3. **Step 3 — Investigation**: Log Analyzer queries logs and isolates the culprit `TypeError` in `sample-app/src/checkout.ts`.
4. **Step 4 — Code Fixer**: Synthesizes a defensive unified git diff patch guarding null/undefined objects.
5. **Step 5 — Testing Agent**: Runs regression test suite in isolated test sandbox; confirms 2/2 tests pass with 0 regressions.
6. **Step 6 — Human Sign-Off**: Presents verified patch and test proofs in Web Cockpit and Telegram War Room for human sign-off.
7. **Step 7 — Resolution**: Upon operator approval, status transitions to `RESOLVED`, approval record is stored, and metrics return to green.

---

## 11. Technology Stack

- **Frontend**: React 19, TypeScript, Vite, TailwindCSS v4, Recharts, Lucide Icons, Socket.IO Client.
- **Backend API**: Node.js 22 (ESM), Express 5, Socket.IO, Zod validation, tsx runner.
- **Agent Orchestration**: TypeScript Multi-Agent Engine with Switch Agent Protocol bridge.
- **Database & ORM**: PostgreSQL 17, Prisma ORM 6.x schema and migrations.
- **Chat Integration**: Telegram Bot API with multi-bot token routing and inline keyboard callbacks.
- **Infrastructure**: Docker Compose, GitHub Actions CI, TAP Test Runner.

---

## 12. Screenshots

| Visual Asset | Description | View |
| :--- | :--- | :---: |
| **Obsidian Cockpit** | High-contrast dashboard with active incidents, MTTR metrics, and Switch health. | [View Screenshot](./docs/assets/dashboard.png) |
| **Telegram War Room** | Multi-bot conversation with 4 agent personas and interactive approval buttons. | [View Screenshot](./docs/assets/telegram-war-room.png) |
| **Agent Collaboration** | Multi-agent orchestration sequence and shared Switch room architecture. | [View Screenshot](./docs/assets/agent-collaboration.png) |
| **Incident Resolution** | Complete incident post-mortem timeline and resolution certificate. | [View Screenshot](./docs/assets/incident-resolution.png) |

---

## 13. Demo Video

> **Video Link**: `[Official Hackathon Demo Video URL - To be inserted upon upload]`  
> **Storyboard & Cues**: See [`docs/DEMO_SCRIPT.md`](./docs/DEMO_SCRIPT.md) and [`submission/DEMO_SCRIPT.md`](./submission/DEMO_SCRIPT.md) for the exact 2m50s script.

---

## 14. Repository Structure

```text
devops-ai-command-center/
├── frontend/                  # React 19 + TypeScript + Vite + TailwindCSS v4 Cockpit
│   ├── src/
│   │   ├── components/        # Diff viewer, approval modal, cockpit widgets
│   │   ├── App.tsx            # Main dashboard shell & WebSocket hooks
│   │   └── data.ts            # Typed view models & fixtures
├── backend/                   # Express 5 + Socket.IO + Prisma + Agent Engine
│   ├── src/
│   │   ├── agents/            # Orchestrator & 4 agent roles
│   │   ├── integrations/      # Switch, Telegram, and GitHub adapters
│   │   ├── routes/            # REST API endpoints & Zod validation
│   │   └── services/          # Incident repository & state management
│   └── prisma/                # PostgreSQL schema & initial migration
├── sample-app/                # Faulty checkout microservice for demo reproduction
├── docs/                      # Complete technical documentation & visual assets
│   ├── ARCHITECTURE.md        # HLD/LLD & system boundaries
│   ├── WORKFLOW.md            # Incident lifecycle & state machine
│   ├── AGENT_ROLES.md         # Detailed agent specifications
│   ├── SETUP_GUIDE.md         # Deployment & configuration instructions
│   ├── TEST_REPORT.md         # 28-test verification report
│   ├── SUBMISSION_AUDIT.md    # Hackathon scoring audit
│   ├── NAMING_AUDIT.md        # Team vs Project identity verification audit
│   ├── DEMO_SCRIPT.md         # Presenter walkthrough script
│   └── assets/                # High-resolution visual diagrams
└── submission/                # Official hackathon submission deliverables
```

---

## 15. Prerequisites

- **Node.js**: `v22.0.0` or higher
- **npm**: `v10.0.0` or higher
- **Docker & Docker Compose**: Docker Engine 24+ (optional, for containerized run)
- **PostgreSQL**: PostgreSQL 17 (optional for demo in-memory mode; required for Prisma migrations)

---

## 16. Installation Instructions

```bash
# Clone the repository
git clone https://github.com/rohanranjan0902/Switch-Hackathon.git
cd Switch-Hackathon

# Install dependencies across all workspaces
npm install
```

---

## 17. Environment Variables

Create `.env` from `.env.example`:

```bash
cp .env.example .env
```

Key environment configurations:
```env
NODE_ENV=development
API_PORT=4000
FRONTEND_ORIGIN=http://localhost:5173
DATABASE_URL=postgresql://devops:devops@localhost:5432/devops_command_center?schema=public

# Switch Agent Protocol Integration
SWITCH_ENABLED=false
SWITCH_BASE_URL=http://localhost:3000
SWITCH_API_KEY=
SWITCH_AGENT_ID=
SWITCH_ROOM_ID=

# Telegram War Room Integration (Single or 4 separate bots)
TELEGRAM_BOT_TOKEN=
TELEGRAM_BOT_TOKEN_INCIDENT_MANAGER=
TELEGRAM_BOT_TOKEN_LOG_ANALYZER=
TELEGRAM_BOT_TOKEN_CODE_FIXER=
TELEGRAM_BOT_TOKEN_TESTING_AGENT=
TELEGRAM_CHAT_ID=
```

---

## 18. Local Development Setup

Run both backend and frontend concurrently:

```bash
npm run dev
```

- **Obsidian Web Cockpit**: [http://localhost:5173](http://localhost:5173)
- **Backend API & WebSocket Server**: [http://localhost:4000](http://localhost:4000)
- **API Health Check**: [http://localhost:4000/api/health](http://localhost:4000/api/health)

---

## 19. Switch Configuration

To connect the Command Center to a live Switch Agent cluster:
1. Set `SWITCH_ENABLED=true` in `.env`.
2. Configure `SWITCH_BASE_URL`, `SWITCH_API_KEY`, `SWITCH_AGENT_ID`, and `SWITCH_ROOM_ID`.
3. If `SWITCH_ENABLED=false`, the system automatically runs its high-fidelity deterministic simulation engine without external dependencies.

---

## 20. Telegram Integration

1. Create a bot using `@BotFather` on Telegram and copy the API token.
2. Add the bot to your Telegram incident group.
3. Set `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` in `.env`.
4. (Optional) Create 4 separate bots for each role and populate `TELEGRAM_BOT_TOKEN_*` for dedicated persona avatars.

---

## 21. Running the Application

### Containerized with Docker Compose:

```bash
docker compose up --build
```

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:4000`
- PostgreSQL: `localhost:5432`

---

## 22. Running Tests

Run the full automated test suite across all three monorepo packages:

```bash
npm test
```

Expected result:
```text
✔ @command-center/backend: 17 passed
✔ @command-center/sample-app: 2 passed
✔ @command-center/frontend: 9 passed
Total: 28 passing assertions (100% green, 0 failures)
```

---

## 23. Security Considerations

- **Secret Hygiene**: Zero API tokens or private keys are stored in source control. `.env` is strictly ignored in `.gitignore`.
- **Command Safety**: Testing agents execute predefined, fixed test commands against the sample app; arbitrary user-supplied shell strings are rejected.
- **Fail-Closed Boundary**: When external providers (Switch/GitHub) are disconnected, the system fails closed and never returns fake success.
- **Human Approval Enforcement**: No pull request or deployment operation can proceed without an authenticated human operator's sign-off.

---

## 24. Known Limitations

- **Prisma Runtime Persistence**: Prisma schema and initial migration exist; runtime service defaults to in-memory mode for zero-database evaluator convenience.
- **GitHub PR Merging**: The application intentionally does not auto-merge pull requests into production to maintain safety.
- **Switch Offline Mode**: When `SWITCH_ENABLED=false`, the platform clearly labels execution as local simulation.

---

## 25. Future Improvements

- Multi-tenant enterprise role-based access control (RBAC).
- Direct bi-directional Slack and Discord war room bridges.
- Real-time canary deployment metrics monitoring after patch deployment.
- Autonomous rollback triggers based on automated post-deployment health metrics.

---

## 26. Hackathon Track Information

- **Hackathon**: [WeMakeDevs Flip the Switch Hackathon](https://www.wemakedevs.org/hackathons/switch)
- **Track**: **TRACK 01 — BEST BUSINESS WORKFLOW**
- **Evaluation Alignment**: Designed to showcase human-AI collaboration, room-based agent coordination via Switch, and real-world business impact.

---

## 27. Team Information

- **Team Name**: **DAANAV**
- **Team Identity**: **Team DAANAV**
- **Team Focus**: Full-Stack Engineering, AI Systems Architecture, and DevOps

---

## 28. License and Acknowledgements

This project is licensed under the Apache-2.0 License. See [LICENSE](./LICENSE) and [`docs/licenses/`](./docs/licenses/) for third-party notices. Special thanks to the **WeMakeDevs**, **DevTools Academy**, and **Switch** teams for organizing the Flip the Switch Hackathon 2026.

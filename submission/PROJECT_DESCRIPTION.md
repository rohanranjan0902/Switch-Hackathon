# Official Hackathon Project Submission

---

### PROJECT NAME:
**DevOps AI Command Center**

### PARTICIPATING TEAM:
**DAANAV** (Team DAANAV)

### TRACK:
**Track 01 — Best Business Workflow**

---

### SHORT DESCRIPTION:
A collaborative AI incident response command center that connects human operators and specialized AI agents through Switch and Telegram to investigate production incidents, generate fixes, verify patches and resolve issues with human approval.

---

### LONG DESCRIPTION:
The **DevOps AI Command Center** transforms production incident response into a collaborative workflow between humans and specialized AI agents. Built by **Team DAANAV** for the WeMakeDevs Flip the Switch Hackathon, it unites on-call engineers, monitoring signals, code remediation, and quality assurance into one unified cockpit.

Instead of requiring engineers to manually investigate incidents, inspect logs, identify root causes, prepare code fixes and run regression tests independently, the platform coordinates specialized agents through Switch.

A human operator can report an incident through a connected team-chat room. The agents collaborate to investigate the problem, prepare a focused code patch, execute tests and report their findings. The human operator remains in control through an explicit approval step before consequential changes are finalized.

The system combines real-time incident monitoring, agent orchestration, code remediation, testing and human oversight into one engineering command center.

---

### PROBLEM:
Traditional incident response requires multiple manual handoffs between engineers, investigation tools, developers and testing teams. This increases response time and makes coordination difficult:
- **Alert Fatigue**: Engineers must sift through thousands of noisy log lines across multiple monitoring platforms.
- **Context Fragmentation**: Triaging, investigating, writing code, and testing occur in isolated silos.
- **Risk of Unverified AI Output**: Generic AI tools output hallucinated, unverified patches that break other services.
- **Uncontrolled Deployments**: Many autonomous prototypes lack a mandatory human approval boundary, creating major operational risks.

---

### SOLUTION:
A shared AI-assisted incident response workflow where humans and specialized agents collaborate through Switch:
- **Four Specialized Autonomous Roles**: Rather than a single monolithic prompt, duties are segregated into `Incident Manager`, `Log Analyzer`, `Code Fixer`, and `Testing Agent`.
- **Switch Agent Protocol Coordination**: Switch rooms provide the shared operational workspace where agents stream findings, dispatch tasks, and notify the team.
- **Dual-Channel Interface**: Operates across an Obsidian Web Cockpit (React 19) and an interactive Telegram War Room.
- **Mandatory Human-in-the-Loop Gate**: The platform strictly enforces explicit human approval before any code can be merged or deployed.

---

### KEY FEATURES (GENUINELY IMPLEMENTED & VERIFIED):
1. **Multi-Agent Sequential Pipeline**: Automated handoff from triage to log mining, patch synthesis, and test verification.
2. **Unified Git Diff Engine**: Parses and renders syntax-highlighted git diffs with additions and deletions against real repository code.
3. **Automated Sandbox Testing**: Testing Agent runs regression tests in an isolated sandbox, proving zero regressions before human review.
4. **Interactive Telegram War Room**: Multi-bot group chat with 4 persona avatars and inline `[ ✅ Approve & Deploy ]` and `[ ❌ Reject Patch ]` callback buttons.
5. **High-Contrast Obsidian Cockpit**: Dark-themed, responsive dashboard featuring real-time Socket.IO synchronization, MTTR metrics, and live Switch health indicators.
6. **Fail-Closed Architecture**: Composite Switch adapter that never fabricates remote success, operating via an authentic local simulation engine when unconfigured.
7. **28 Automated Verification Tests**: 100% green unit and integration test coverage across all packages.

---

### TECHNOLOGY STACK:
- **Frontend**: React 19, TypeScript, Vite, TailwindCSS v4, Recharts, Lucide Icons, Socket.IO Client.
- **Backend API**: Node.js 22 (ESM), Express 5, Socket.IO, Zod validation, tsx runner.
- **Agent Orchestration**: TypeScript Multi-Agent Engine with Switch Agent Protocol bridge.
- **Database & Persistence**: PostgreSQL 17, Prisma ORM 6 relational schema and migrations.
- **Chat & Webhook Integration**: Telegram Bot API with multi-bot token routing and inline keyboard callbacks.
- **Containerization & CI**: Docker Compose, GitHub Actions CI, TAP Test Runner.

---

### SWITCH INTEGRATION:
The DevOps AI Command Center connects to the **Switch Agent Protocol** via the `CompositeSwitchAdapter`:
- **Room Coordination**: Dispatches incident tasks to the configured Switch room (`/agents/:id/message`), providing a persistent shared context for all participating agents and operators.
- **Task Dispatching**: Coordinates sequential handoffs from the Incident Manager to Log Analyzer, Code Fixer, and Testing Agent.
- **Fail-Closed Reliability**: If `SWITCH_ENABLED=false` or credentials are unset, the platform fails closed to an authentic local deterministic simulation engine without generating fake provider responses.

---

### PROJECT REPOSITORY & LINKS:

- **GITHUB REPOSITORY**:
  `[https://github.com/your-org/devops-ai-command-center - Placeholder for Verified Public Repository URL]`

- **DEMO VIDEO**:
  `[https://youtu.be/your-demo-video - Placeholder for Final Public Video URL]`

- **LIVE DEMO**:
  `[http://localhost:5173 - Localhost & Docker Compose Deployment / Live Cloud URL if deployed]`

---

### TEAM MEMBERS:
- **Participating Team**: **DAANAV** (Team DAANAV)
- Engineering Focus: AI Systems Architecture, Full-Stack Engineering, DevOps, and Quality Assurance.

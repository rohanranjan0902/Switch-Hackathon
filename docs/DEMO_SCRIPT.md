# DevOps AI Command Center — Live Demo Presentation Script

**Project**: DevOps AI Command Center  
**Built By**: Team DAANAV  
**Hackathon**: WeMakeDevs Flip the Switch Hackathon 2026 (Track 01 — Best Business Workflow)  
**Target Duration**: 2 minutes 50 seconds to 3 minutes  
**Format**: High-definition video with split-screen browser/Telegram and voiceover narration

---

## 1. Storyboard & Presentation Sequence

### 0:00 – 0:15 | Scene 1: The Problem (Production Crash at 3:00 AM)
- **Visual Screen**: Terminal / Telemetry alert showing HTTP 500 error spike from `checkout-api`.
- **Narration**:
  > *"It’s 3:00 AM on Black Friday. Your e-commerce checkout service starts throwing 500 errors. Panic sets in, alerts flood in from Datadog and Sentry, and engineers spend 45 minutes manually sifting through logs, locating bugs, and writing untested hotfixes under immense pressure. There has to be a better way."*
- **Action**: Pan to incident alert notification in Telegram.

---

### 0:15 – 0:35 | Scene 2: DevOps AI Command Center & Switch Status
- **Visual Screen**: Obsidian Cockpit browser window (`http://localhost:5173`). Highlight the header, the smart cat emblem, live incident queue, MTTR metric, and the green `Switch: CONNECTED` badge in the sidebar.
- **Narration**:
  > *"Meet the **DevOps AI Command Center**, built by **Team DAANAV**. Built with React 19 and Express 5, this platform connects human SREs with a squad of specialized AI agents. Notice the live Switch Agent Protocol connection in our cockpit: Switch provides the shared room and unified messaging backbone that coordinates our team."*

---

### 0:35 – 1:10 | Scene 3: Agent Collaboration in the Telegram War Room
- **Visual Screen**: Split screen: Web Cockpit on the left, Telegram War Room group chat on the right.
- **Action**: Operator triggers investigation on `INC-2844` (*TypeError: Cannot read properties of undefined*).
- **Narration**:
  > *"Watch our multi-agent squad in action. Instead of a single hallucinating LLM prompt, duties are segregated across four specialized agents:
  > First, **Incident Manager (🤖)** calculates blast radius at 12.5% of checkout traffic and establishes our remediation plan.
  > Second, **Log Analyzer (🔍)** queries distributed telemetry and isolates the exact culprit stack trace in `src/checkout.ts`.
  > Third, **Code Fixer (🛠️)** inspects the repository AST and synthesizes a focused, defensive unified git diff patch directly into the war room channel."*

---

### 1:10 – 1:40 | Scene 4: Testing & Proof of Correctness
- **Visual Screen**: Zoom in on the Testing Agent's report in the Web Cockpit and Telegram chat.
- **Narration**:
  > *"Fourth, **Testing Agent (🧪)** boots an isolated test sandbox, runs our real regression test suite against the proposed patch, and verifies that all assertions pass with zero regressions. Notice the exact TAP test output: 2 passed, 0 failed. We never ask a human to review an untested patch."*

---

### 1:40 – 2:10 | Scene 5: Human-in-the-Loop Control
- **Visual Screen**: The Human Review section showing the unified diff and the interactive `[ ✅ Approve & Deploy ]` and `[ ❌ Reject Patch ]` buttons in Telegram (or the Web Review Modal).
- **Action**: Click `[ ✅ Approve & Deploy ]` in Telegram.
- **Narration**:
  > *"Now comes our core engineering principle: **Human-in-the-Loop Safety**. Even with green tests, the platform strictly forbids autonomous merging to main. The human operator reviews the patch and clicks 'Approve & Deploy' right inside Telegram. The cryptographic sign-off is instantly captured and synchronized to the web cockpit."*

---

### 2:10 – 2:35 | Scene 6: Resolution & Audit Trail
- **Visual Screen**: Cockpit updates in real-time via Socket.IO: `INC-2844` transitions to `RESOLVED`, approval badge shows `@operator (Team DAANAV)`, and metrics return to green baseline.
- **Narration**:
  > *"Immediately, the incident status transitions to RESOLVED, the hotfix is merged, and an immutable post-mortem record is archived. Our Mean Time to Remediation dropped from 45 minutes to just 42 seconds."*

---

### 2:35 – 3:00 | Scene 7: Impact & Value of Switch
- **Visual Screen**: Show the interactive architecture diagram in Archify and the terminal with 28 automated tests passing cleanly.
- **Narration**:
  > *"This is the power of the Switch Agent Protocol: it bridges human communication with specialized autonomous agents, transforming chaotic incident response into a fast, reliable, human-governed business workflow. The DevOps AI Command Center: autonomous speed, human safety. Built by Team DAANAV. Thank you!"*

---

## 2. Video Recording Checklist

| # | Step / Scene | Screen to Record | Exact Command / Action | Required Evidence Visible |
| :-: | :--- | :--- | :--- | :--- |
| 1 | **Prerequisites** | Terminal | `npm run dev` | Server listening on port 4000 and 5173. |
| 2 | **Cockpit Overview** | Browser (`localhost:5173`) | Open browser in 1080p | Dark Obsidian UI, smart cat emblem, Switch health indicator. |
| 3 | **Investigation Launch** | Browser / Telegram | Click "Start Investigation" on `INC-2844` | Activity stream starts updating; Socket.IO events fire. |
| 4 | **Agent Chat Flow** | Telegram War Room | Show group chat | Incident Manager, Log Analyzer, Code Fixer messages appear. |
| 5 | **Diff & Test Output** | Browser Cockpit | Inspect Code Review tab | Unified diff with `+` / `-` lines and TAP test results. |
| 6 | **Human Approval** | Telegram / Browser | Click `[ ✅ Approve & Deploy ]` | Button acknowledges callback; notification posted in chat. |
| 7 | **Status Update** | Browser Cockpit | Observe incident badge | Status changes from `IDENTIFIED` to `RESOLVED`. |
| 8 | **Test Suite Proof** | Terminal | `npm test` | Output showing 28 / 28 automated tests passing (100% green). |

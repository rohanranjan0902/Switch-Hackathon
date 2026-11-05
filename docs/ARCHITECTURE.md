# Architecture

## Interactive architecture diagram

- [Open the standalone Archify diagram](./devops-ai-command-center-architecture.html).
- [Edit the Archify diagram source](./devops-ai-command-center.architecture.json).

The diagram distinguishes the implemented demo foundation from planned integration
boundaries. It is generated with [Archify](https://github.com/tt-a1i/archify); do not
interpret planned or dashed connections as working integrations.
The bundled viewer's Archify license and attribution notices are in
[`licenses/archify/`](./licenses/archify/).

## System boundaries

```text
React dashboard (5173)
  ├─ REST requests ───────────────> Express API (4000)
  └─ Socket.IO client ────────────> Incident update events

Express API
  ├─ Incident service ────────────> In-memory demo records (starter)
  ├─ Prisma schema ───────────────> PostgreSQL (persistence wiring is next)
  ├─ Switch adapter boundary ─────> Disabled until official interface is verified
  └─ GitHub status boundary ──────> No API calls until integration is implemented
```

The frontend demo is intentionally useful without external credentials. Demo fixtures are explicit and remain separate from any reported real-world agent result. API endpoints that would cause external side effects fail closed rather than returning success-shaped fake responses.

## Project layout

- `frontend/src/App.tsx`: page shell, navigation, demo views, and local interactions.
- `frontend/src/data.ts`: named UI demo fixtures.
- `backend/src/app.ts`: REST route registration.
- `backend/src/routes/incidents.ts`: incident request validation and state changes.
- `backend/src/services/incidentService.ts`: current in-memory demo repository.
- `backend/src/integrations/switch/`: interface and unconfigured adapter; no undocumented methods.
- `backend/src/integrations/github/`: current connection status only.
- `backend/prisma/schema.prisma`: relational model foundation.
- `sample-app/src/`: intentionally faulty e-commerce example for incident demos.

## Event contract

The API broadcasts the updated incident record over Socket.IO:

- `incident:created` after `POST /api/incidents`
- `incident:updated` after `PATCH /api/incidents/:id`

Events originate only from API writes. Agent progress events should be added only when connected to actual executions, with an explicit execution ID, timestamp, and provider status.

## Human approval boundary

Agent proposals, test output, approval records, and GitHub PR operations are separate steps. A future implementation must persist the proposed code change and test result, record an authenticated user decision, and only then allow the GitHub integration to open a PR. This starter does not create or merge PRs, and it does not deploy.

## Persistence

Prisma models cover users, incidents, agents, executions, logs, code changes, tests, repositories, PRs, and approvals. The current REST sample data is in memory; PostgreSQL persistence, migrations, authentication, and authorization are follow-up work. Do not treat demo IDs or records as production data.

## High-level design (HLD)

### Goals and actors

- **Engineer / incident commander:** reports an incident, reviews findings, changes status, and approves or rejects a proposed change.
- **Dashboard:** displays incidents, logs, agent progress, test results, and pull request status.
- **API:** validates requests, owns incident state transitions, and publishes state changes.
- **AI agents via Switch:** target integration for triage, log analysis, code investigation, and testing. It is not connected in this foundation.
- **GitHub:** target integration for repository context and human-approved pull requests. It is not connected in this foundation.
- **PostgreSQL:** target durable store represented by the Prisma schema and initial migration. The current API still uses in-memory demo records.

### Logical component diagram

```text
┌───────────────────────────────┐
│ React + TypeScript dashboard  │
│ Overview / Incidents / Logs   │
│ Agents / Review / GitHub      │
└──────────────┬────────────────┘
               │ REST (commands, queries) + Socket.IO (updates)
┌──────────────▼────────────────┐
│ Express + Socket.IO API       │
│ Routes → validation → services│
│ Error handling / env config   │
└───────┬────────┬────────┬─────┘
        │        │        │
  incident    Switch    GitHub
   service    adapter   adapter
        │        │        │
        │        └── target external agent/repo systems
        │
  demo memory now
  PostgreSQL via Prisma target
```

### Intended incident workflow

1. A human creates an incident. The API validates the input, assigns an incident key, stores the record, and emits `incident:created`.
2. The human requests investigation. In the future, the API should create an execution record and dispatch work through the verified Switch adapter. Today this endpoint returns `503 SWITCH_NOT_CONFIGURED`.
3. The Incident Manager coordinates triage; Log Analyzer returns evidence; Code Fixer proposes a patch/root cause; Testing Agent validates the proposal. Each result should be persisted against the incident and execution.
4. The dashboard receives real execution status through Socket.IO and lets a human inspect the investigation timeline, proposed diff, and test results.
5. An authenticated human approves or rejects a specific code-change version. The decision must be persisted and auditable.
6. Only after approval may the GitHub integration create a branch/PR. The PR is never automatically merged or deployed.

Steps 2–6 describe the target workflow, not implemented behavior. The current demo supports incident create/list/get/status update, sample logs, API health, and incident Socket.IO events only.

### Deployment view

- **Local development:** Vite frontend on port `5173`, Express/Socket.IO API on `4000`; Vite proxies `/api` and `/socket.io` to the API.
- **Compose:** PostgreSQL on `5432`, API on `4000`, frontend preview on `5173`.
- **CI:** GitHub Actions installs workspaces, runs lint, build, and tests for pull requests and pushes to `main`.
- **External dependencies:** Switch and GitHub are disabled placeholders. Production hosting, authentication, a job queue, and observability are not part of this starter.

## Low-level design (LLD)

### Frontend modules

| Module                    | Responsibility                                                                |
| ------------------------- | ----------------------------------------------------------------------------- |
| `frontend/src/App.tsx`    | Navigation, dashboard pages, local UI state, forms, and incident detail modal |
| `frontend/src/api.ts`     | REST client, response parsing, and API DTO-to-view-model conversion           |
| `frontend/src/data.ts`    | Explicitly labelled local demo agents/logs/initial incident fixtures          |
| `frontend/src/types.ts`   | Frontend view-model types                                                     |
| `frontend/src/styles.css` | Dark responsive dashboard styling                                             |

On startup the app loads incidents through `GET /api/incidents` and subscribes to `incident:created` / `incident:updated`. It falls back to local fixtures if the API is unavailable. Incident create/status actions call the API; this fallback is UI demo behavior and is not durable.

### Backend request path

```text
HTTP request
  → CORS + JSON body parser
  → route handler
  → Zod body validation (writes)
  → IncidentService (currently in-memory)
  → REST response envelope
  → Socket.IO event after successful incident write
```

`backend/src/app.ts` registers routes and demo agent/log records. `backend/src/routes/incidents.ts` owns incident HTTP contracts and emits socket events only after a successful service mutation. `backend/src/middleware/errors.ts` maps validation errors to `400`, unknown paths to `404`, and unexpected errors to a logged `500`. `backend/src/server.ts` attaches Socket.IO to the same HTTP server.

### API contract

All success responses use `{ "data": ..., "meta": ... }`; errors use `{ "error": { "code": ..., "message": ... } }`.

| Route                                  | Current behavior                                           |
| -------------------------------------- | ---------------------------------------------------------- |
| `GET /api/health`                      | API mode and integration readiness                         |
| `GET /api/incidents?severity=&status=` | List/filter demo incident records                          |
| `POST /api/incidents`                  | Validate and add an in-memory demo incident                |
| `GET /api/incidents/:id`               | Find by internal ID or incident key                        |
| `PATCH /api/incidents/:id`             | Validate and update status                                 |
| `POST /api/incidents/:id/investigate`  | Fail closed with `503 SWITCH_NOT_CONFIGURED`               |
| `POST /api/incidents/:id/approve`      | `501`; authentication and persisted change not implemented |
| `POST /api/incidents/:id/reject`       | `501`; authentication and persisted change not implemented |
| `GET /api/agents[/:id]`                | Demo role catalog, not real execution state                |
| `GET /api/logs[/:id]`                  | Searchable sample application log fixtures                 |
| `GET /api/github/repositories`         | `503`; no GitHub API calls                                 |
| `GET /api/github/pull-requests`        | `503`; no GitHub API calls                                 |

### Socket.IO events

| Event              | Producer                              | Payload                 |
| ------------------ | ------------------------------------- | ----------------------- |
| `incident:created` | Successful `POST /api/incidents`      | Created incident record |
| `incident:updated` | Successful `PATCH /api/incidents/:id` | Updated incident record |

No agent activity events are emitted yet. When added, use persisted execution IDs and provider timestamps/status rather than synthesizing activity in the server.

### Data model relationships

```text
User 1 ── * Incident (optional reporter)
User 1 ── * Approval
Incident 1 ── * AgentExecution * ── 1 Agent
Incident 1 ── * Log
Incident 1 ── * CodeChange
Incident 1 ── * TestExecution
CodeChange 1 ── * TestExecution
Incident 1 ── * Approval * ── 1 CodeChange
GitHubRepository 1 ── * PullRequest
```

Prisma models and enums are defined in `backend/prisma/schema.prisma`. The committed initial PostgreSQL migration is under `backend/prisma/migrations/`. The schema is a foundation; runtime repositories currently do not use Prisma.

### Target service boundaries

Keep route handlers thin and move business rules into services. Suggested future responsibilities:

- **Incident service:** create, query, enforce legal status transitions, and maintain incident history.
- **Orchestrator:** create an execution plan and track agent dependencies/status. It should not contain provider-specific API details.
- **Agent services:** typed task/result handling for incident management, logs, code fixes, and tests.
- **Switch adapter:** translate internal task contracts to the exact documented Switch interface; normalize provider results and errors.
- **GitHub adapter:** read repository context and create branches/PRs only after checking a valid approval record.
- **Test runner:** run approved test commands in an isolated, resource-limited environment; never execute arbitrary user-supplied shell strings in the API process.
- **Persistence repositories:** replace in-memory service storage with Prisma-backed transactional operations.

No orchestrator, queue, real agent service, GitHub adapter, isolated test runner, or Prisma-backed repository exists yet. Add these behind interfaces and contract tests as each team member implements their area.

### Human approval and authorization rules

1. Bind approval to a specific `CodeChange` ID/version and incident.
2. Require an authenticated user and persist who decided, when, and any note.
3. Reject PR creation if approval is absent, rejected, or belongs to a different patch version.
4. Keep GitHub tokens server-side; never expose tokens in API responses or store them as plaintext database columns.
5. Do not automatically merge or deploy. Require repository permissions that are no broader than needed.

Authentication/authorization and these checks are future implementation requirements; the current approval endpoints deliberately return `501`.

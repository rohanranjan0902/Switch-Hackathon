# Architecture

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

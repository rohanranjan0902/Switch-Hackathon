# Four-Person Team Tasks and Next Steps

This plan is based on the current project architecture and the Archify diagram:
[interactive architecture](./devops-ai-command-center-architecture.html) ·
[editable Archify source](./devops-ai-command-center.architecture.json) ·
[HLD/LLD](./ARCHITECTURE.md).

The diagram distinguishes implemented demo behavior from planned integrations.
Treat Switch and GitHub as disconnected until their work below is implemented,
tested, and explicitly enabled. Keep the existing ownership in
[CONTRIBUTING.md](../CONTRIBUTING.md) as the source of truth for branches and
pull requests.

## Team ownership

| Owner    | Area                                | Main responsibility                                                                                    |
| -------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Person 1 | AI agents and Switch                | Verify the official Switch contract, then implement real agent dispatch and execution events.          |
| Person 2 | Backend and database                | Make the API durable with Prisma and implement the incident, execution, and approval contracts.        |
| Person 3 | Frontend and dashboard              | Connect dashboard workflows to API data and display real incident and execution states.                |
| Person 4 | Infrastructure, testing, and GitHub | Strengthen CI/test isolation and implement GitHub integration, respecting the human-approval boundary. |

Use the role labels above until the team adds names. One person should own each
change; ask other owners to review changes that touch their areas.

## Person 1 — AI agents and Switch

### Tasks

1. Obtain and review official Switch documentation from the platform owner or
   hackathon organizers. Record source links, version, authentication, dispatch,
   event/callback, retry, timeout, and rate-limit details in
   [SWITCH_INTEGRATION.md](./SWITCH_INTEGRATION.md).
2. Agree on the execution/task contract with Person 2 before changing shared
   backend or frontend types.
3. Implement the adapter in `backend/src/integrations/switch/` only against that
   verified contract. Validate configuration at startup and keep the integration
   disabled by default.
4. Implement orchestration for the incident manager, log analyzer, code fixer,
   and testing roles. Persist and publish only real provider execution states
   and results.
5. Add contract tests for successful dispatch, provider errors, timeout,
   disconnect, duplicate events, and malformed callbacks.

### Done when

- Official documentation and the supported contract are linked in the project
  docs.
- Tests cover provider behavior and failure cases without live credentials.
- Demo fixtures remain labeled as demo; no fake provider success is reported.
- Switch cannot be enabled with missing or invalid required configuration.

### Blocker rule

If the official contract cannot be obtained or verified, do not guess an
endpoint, SDK, or authentication scheme. Keep the adapter fail-closed and report
the documentation blocker to the team.

## Person 2 — Backend and database

### Tasks

1. Agree on and document the API/data contract for incidents, executions,
   proposed code changes, test results, and approval decisions. Coordinate with
   Persons 1 and 3 before changing shared types or `docs/API.md`.
2. Wire Prisma to the API services and replace in-memory incident storage with
   PostgreSQL-backed repositories. Preserve useful demo setup through explicit
   seeds or fixtures, not production-shaped fake records.
3. Add and test the API lifecycle for executions and proposed changes, including
   validation, ownership/authorization checks, and durable status updates.
4. Implement authenticated approval/rejection records tied to a specific
   proposed change. Reject requests that have no valid change or authorized
   reviewer.
5. Add service and route tests for persistence, validation, not-found cases,
   status transitions, and approval authorization.

### Done when

- Incident records survive API restarts when the database is configured.
- Migrations and setup instructions work from a clean development database.
- API responses and Socket.IO event payloads match the documented contract.
- No PR operation can happen before a persisted human decision for that
  specific proposed change.

## Person 3 — Frontend and dashboard

### Tasks

1. Coordinate API response and event shapes with Person 2; use the documented
   contract rather than duplicating backend assumptions.
2. Replace local-only incident actions with API-backed create, update, and
   detail workflows. Keep fallback fixtures clearly marked as demo data.
3. Add clear loading, empty, validation, offline, and API error states.
4. Add an incident activity view for actual persisted execution progress,
   proposed changes, test results, and approval status as those API endpoints
   become available.
5. Add accessible approval/rejection review UI only after Person 2's
   authorization and persistence contract is ready. Show the exact change and
   test result the reviewer is deciding on.
6. Add focused component or browser tests for core incident flows and error
   states.

### Done when

- UI data and actions come from the API for implemented features.
- Real provider state is not confused with demo fixtures or unavailable
  integrations.
- Important actions have visible success/error feedback and are keyboard
  accessible.
- Tests cover incident creation/update and the states supported by the API.

## Person 4 — Infrastructure, testing, and GitHub

### Tasks

1. Review and maintain CI so pull requests run the repository's tests, lint,
   formatting check, and build. Make failures actionable and keep checks
   repeatable.
2. Add isolated test execution for the intentionally faulty sample app and
   future agent-proposed code. Do not run untrusted proposed code with broad
   host or repository credentials.
3. Implement a GitHub adapter behind the existing integration boundary and
   feature flag. Start with read-only repository and pull-request status
   operations; document required permissions and configuration.
4. Coordinate with Person 2 on approval records and Person 1 on execution/test
   results before implementing any operation that creates a branch or pull
   request.
5. Add tests for GitHub API errors, permission failures, rate limits, and
   disabled/unconfigured behavior. Keep write operations disabled until the
   approval gate is enforced and reviewed.
6. Update Docker/local setup and CI documentation when configuration or
   services change.

### Done when

- CI checks the documented quality gates on every pull request.
- Test/agent code runs in an isolated environment with limited permissions.
- GitHub read operations are explicit, tested, and disabled without valid
  configuration.
- Any future PR-creation operation requires a persisted, authorized human
  approval and never merges or deploys automatically.

## What the team should do next

### First: agree on shared contracts

1. Person 2 proposes the incident, execution, code-change, test-result, and
   approval API/data shapes in `docs/API.md`.
2. Person 1 reviews execution and provider-event fields; Person 3 reviews
   dashboard needs; Person 4 reviews GitHub and test-isolation needs.
3. Merge a small contract/documentation PR before parallel implementation.
   Avoid simultaneous incompatible edits to `backend/src/types.ts`,
   `frontend/src/types.ts`, or `docs/API.md`.

### Then: work in parallel

- Person 1 verifies the official Switch contract and prepares adapter contract
  tests. Do not enable Switch while verification is pending.
- Person 2 wires database persistence and implements the approved API contracts.
- Person 3 improves the API-backed incident flow and visible loading/error
  states; build execution and approval screens against the agreed contract.
- Person 4 improves CI and test isolation, then implements GitHub read-only
  behavior. Defer GitHub writes until the approval gate is complete.

### Integration and release checklist

1. Open a focused pull request from the matching feature branch; do not push
   directly to `main`.
2. Request review from an owner whose area is affected. Resolve contract changes
   with all affected owners.
3. Verify with the repository quality checks: `npm test`, `npm run lint`,
   `npm run build`, and `npm run format:check`.
4. Test disabled and misconfigured integrations as well as successful local
   flows. Do not put credentials in commits, frontend code, logs, or fixtures.
5. Update [the architecture source](./devops-ai-command-center.architecture.json)
   and regenerate the Archify diagram when real component boundaries or flows
   change. Keep the diagram's labels accurate about what is implemented.
6. Merge only after review and passing CI. Keep Switch and GitHub write features
   disabled until their acceptance criteria and human-approval safeguards pass.

## Team-wide working agreements

- Keep each pull request small and within the listed ownership where possible.
- Agree on shared interfaces before cross-area implementation.
- Add tests and update docs in the same pull request as behavior changes.
- Keep demo data explicitly labeled; never present a planned integration as
  connected.
- Do not merge or deploy agent-generated changes automatically.

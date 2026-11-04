# Contributing

Thanks for helping build DevOps AI Command Center. Keep changes focused, typed, tested, and documented. Never commit credentials or present demo fixtures as real Switch/GitHub activity.

## Team ownership

| Owner    | Primary area                     | Owns                                                                                   |
| -------- | -------------------------------- | -------------------------------------------------------------------------------------- |
| Person 1 | AI agents & Switch               | `backend/src/agents/`, `backend/src/integrations/switch/`, agent execution events      |
| Person 2 | Backend & database               | `backend/src/routes/`, `backend/src/services/`, `backend/prisma/`                      |
| Person 3 | Frontend & dashboard             | `frontend/src/`, dashboard API/socket client                                           |
| Person 4 | Infrastructure, testing & GitHub | `infrastructure/`, `.github/`, `backend/src/integrations/github/`, test and CI tooling |

Coordinate changes to shared contracts in `backend/src/types.ts`, `frontend/src/types.ts`, and `docs/API.md` before implementing against them. Prefer a small contract PR when work crosses ownership boundaries.

## Branches and pull requests

Use the team branch prefixes:

- `feature/ai-agents`
- `feature/backend`
- `feature/frontend`
- `feature/devops`

For individual tasks, add a short suffix, such as `feature/backend/incident-history`. Use `fix/` for bug fixes and `docs/` for documentation-only changes. Branch from `main`, keep branches short-lived, and open a pull request before merging into `main`. Direct pushes to `main` are not part of the team workflow. Require at least one teammate review and passing CI before merge.

## Before opening a pull request

```bash
npm test
npm run lint
npm run build
```

Include the change summary, validation performed, screenshots for UI changes, and any environment/configuration changes. Do not merge or deploy code automatically from an agent-generated patch.

## Safety and integration rules

- Use `.env.example` for variable names only; never commit `.env` or real credentials.
- Keep Switch tasks disabled until an official supported interface is verified and documented.
- Label all local fixtures and simulated workflows as demo data.
- Require a human approval record before a proposed code change can create a GitHub pull request.
- Run code from the sample application and future test agents in isolated environments.

# Switch integration status

## Current status: not connected

Switch is intended to coordinate the specialized incident, log, code, and test agents. This repository contains only a typed adapter boundary and a fail-closed implementation. The API does **not** make a Switch request and does not invent a URL, SDK, authentication scheme, agent protocol, or room configuration.

The project brief requires checking official Switch documentation before implementation. At foundation setup time, the official public docs/API could not be verified with the available documentation sources. Hackathon project examples are not treated as an authoritative API contract. Keep `SWITCH_ENABLED=false`.

## Before implementing

1. Obtain the official documentation from the hackathon organizers/platform owner.
2. Verify supported transport, authentication, agent registration, task dispatch, callbacks/events, retries, and rate limits.
3. Record official source links and the exact supported version here.
4. Add contract tests using documented request/response shapes.
5. Implement `SwitchAgentAdapter` in `backend/src/integrations/switch/` and validate required configuration at startup.
6. Emit agent activity only from real provider events. Keep demo fixtures marked `mode: "demo"`.
7. Test timeouts, disconnects, duplicate callbacks, and provider errors before enabling the integration.

## Configuration placeholders

`.env.example` includes `SWITCH_ENABLED`, `SWITCH_BASE_URL`, and `SWITCH_API_KEY` as placeholders only. These names do not assert that Switch supports a base URL or API key. Replace or remove them to match the verified official configuration. Never put tokens in the database, frontend bundle, or committed files.

## Current behavior

- `GET /api/health` reports Switch as not configured.
- `GET /api/agents` returns the demo agent role catalog and labels it as demo.
- `POST /api/incidents/:id/investigate` returns `503 SWITCH_NOT_CONFIGURED`.
- No tasks are sent and no agent results are fabricated.

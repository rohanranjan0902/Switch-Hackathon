# API reference

Base URL: `http://localhost:4000/api`

Unless stated otherwise, successful responses use:

```json
{ "data": {}, "meta": { "mode": "demo" } }
```

Errors use:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed.",
    "details": []
  }
}
```

## Health and integrations

### `GET /health`

Returns API status, demo mode, and whether Switch/GitHub are configured. Readiness does not mean either provider is connected.

## Incidents

### `GET /incidents`

Returns sample incidents. Optional filters: `severity=CRITICAL|HIGH|MEDIUM|LOW` and `status=OPEN|INVESTIGATING|IDENTIFIED|MONITORING|RESOLVED`.

### `POST /incidents`

Creates an in-memory demo record; a server restart resets it.

```json
{
  "title": "Checkout API returning errors",
  "description": "Payment requests return HTTP 500 after release.",
  "service": "checkout-api",
  "severity": "HIGH"
}
```

Title is 5–160 characters, description 5–4000 characters, service 2–100 characters.

### `GET /incidents/:id`

Looks up either the demo record ID or incident key such as `INC-2847`.

### `PATCH /incidents/:id`

Updates the incident status (`OPEN`, `INVESTIGATING`, `IDENTIFIED`, `MONITORING`, or `RESOLVED`):

```json
{ "status": "IDENTIFIED" }
```

### `POST /incidents/:id/investigate`

Currently returns `503 SWITCH_NOT_CONFIGURED`. No work is dispatched. This changes only after the official Switch agent contract is verified and implemented.

### `POST /incidents/:id/approve` and `/reject`

Currently return `501 APPROVAL_FLOW_NOT_IMPLEMENTED`. Authenticated approval and a persisted code change are prerequisites; no PR is created by these starter endpoints.

## Agents and logs

- `GET /agents` and `GET /agents/:id` return a demo role catalog, not real agent execution state.
- `GET /logs?q=checkout&level=HIGH` filters sample application logs by free-text query and severity. `level` must be `CRITICAL`, `HIGH`, `MEDIUM`, or `LOW`; invalid or repeated query values return `400 VALIDATION_ERROR`.
- `GET /logs/:id` returns one sample log or `404 LOG_NOT_FOUND`.

## GitHub

`GET /github/repositories` and `GET /github/pull-requests` currently return `503 GITHUB_NOT_CONNECTED`. They make no GitHub API request, even if credentials are provided. Implement and review the integration before enabling it.

## Real-time events

Connect Socket.IO to the API origin. The server emits `incident:created` and `incident:updated`, each with the incident object in the same shape as the REST response's `data`. Events reflect writes to the in-memory demo repository.

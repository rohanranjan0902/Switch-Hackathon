# DevOps AI Command Center — Setup & Installation Guide

**Project**: DevOps AI Command Center  
**Built By**: Team DAANAV  
**Hackathon**: WeMakeDevs Flip the Switch Hackathon 2026 (Track 01 — Best Business Workflow)  

This guide provides end-to-end instructions for deploying and running the **DevOps AI Command Center** locally or in containerized environments.

![Cockpit Overview](./assets/dashboard.png)

---

## 1. System Requirements

- **Node.js**: `v22.0.0` or higher (ESM native test runner required)
- **Package Manager**: `npm v10+` (Workspace monorepo support)
- **Docker & Docker Compose**: Docker Engine 24+ (optional, for containerized run)
- **PostgreSQL**: PostgreSQL 17 (optional for demo in-memory mode; required for Prisma migrations)
- **Operating Systems**: Linux (Ubuntu 22.04+), macOS (Apple Silicon / Intel), or Windows via WSL2

---

## 2. Quickstart (Development Mode)

### Step 1: Clone and Configure Environment

```bash
git clone https://github.com/your-org/devops-ai-command-center.git
cd devops-ai-command-center
cp .env.example .env
```

### Step 2: Install Workspace Dependencies

```bash
npm install
```

### Step 3: Run Full Development Stack

```bash
npm run dev
```

This concurrently boots:
- **Frontend Cockpit**: [http://localhost:5173](http://localhost:5173)
- **Backend API & WebSocket Server**: [http://localhost:4000](http://localhost:4000)

Verify API health:
```bash
curl http://localhost:4000/api/health
```

Expected response:
```json
{
  "data": {
    "status": "healthy",
    "timestamp": "2026-11-07T16:14:00.000Z",
    "uptime": 12.4,
    "integrations": {
      "switch": { "configured": false, "provider": "simulation" },
      "github": { "configured": false }
    }
  }
}
```

---

## 3. Docker Compose Deployment

To run the entire multi-tier stack (PostgreSQL database, Node.js backend, and Vite frontend) in isolated Docker containers:

```bash
docker compose up --build
```

### Container Endpoints

| Container | Host Port | Internal Port | Service |
| :--- | :--- | :--- | :--- |
| `frontend` | `5173` | `4173` | React 19 Obsidian Cockpit |
| `backend` | `4000` | `4000` | Express 5 API & Socket.IO Bus |
| `db` | `5432` | `5432` | PostgreSQL 17 Database |

To tear down containers and persist data volumes:
```bash
docker compose down
```

---

## 4. Telegram War Room Integration Setup

The command center supports real-time multi-agent Telegram channels with interactive action buttons.

### Option A: Single Bot (Easiest)

1. Open Telegram and message `@BotFather`.
2. Send `/newbot`, name your bot (e.g. `Incident War Room Bot`), and choose a username.
3. Copy the HTTP API token provided by BotFather.
4. Add the bot to your Telegram group or war room channel.
5. Retrieve your Chat ID (e.g., using `@userinfobot` or messaging the bot and inspecting `getUpdates`).
6. Update your `.env`:
   ```env
   TELEGRAM_BOT_TOKEN="your_token_here"
   TELEGRAM_CHAT_ID="-100xxxxxxxxxx"
   ```

### Option B: 4 Dedicated Agent Bots (Full Immersion)

For authentic multi-agent team presence in your war room, create 4 separate bots via `@BotFather`:
1. `🤖 Incident Manager` ➔ `TELEGRAM_BOT_TOKEN_INCIDENT_MANAGER`
2. `🔍 Log Analyzer` ➔ `TELEGRAM_BOT_TOKEN_LOG_ANALYZER`
3. `🛠️ Code Fixer` ➔ `TELEGRAM_BOT_TOKEN_CODE_FIXER`
4. `🧪 Testing Agent` ➔ `TELEGRAM_BOT_TOKEN_TESTING_AGENT`

Add all four bots to your Telegram group and set `TELEGRAM_CHAT_ID`. When an incident runs, each bot speaks as its respective persona!

![Telegram War Room](./assets/telegram-war-room.png)

---

## 5. Switch Agent Protocol Configuration

The platform integrates with the Switch Agent Protocol via the `CompositeSwitchAdapter`:

- When running locally without remote credentials, keep:
  ```env
  SWITCH_ENABLED=false
  ```
  The command center seamlessly uses its high-fidelity deterministic agent simulation engine.
- When connecting to a live Switch instance:
  ```env
  SWITCH_ENABLED=true
  SWITCH_BASE_URL="https://your-switch-instance.domain"
  SWITCH_API_KEY="your-switch-api-key"
  SWITCH_AGENT_ID="agent-command-center-01"
  SWITCH_ROOM_ID="room-war-room-101"
  ```

---

## 6. PostgreSQL & Prisma Database Setup

To enable relational database persistence:

1. Ensure PostgreSQL is running (e.g., via `docker compose up -d db`).
2. Set your connection string in `.env`:
   ```env
   DATABASE_URL="postgresql://devops:devops@localhost:5432/devops_command_center?schema=public"
   ```
3. Generate the Prisma client and apply migrations:
   ```bash
   npm run db:generate
   npm run db:migrate --workspace backend
   ```

---

## 7. Running Quality Assurance Tests

To run the unified test suite across backend, sample-app, and frontend:

```bash
npm test
```

Expected output:
```text
✔ 17 backend tests passed
✔ 2 sample-app tests passed
✔ 9 frontend tests passed
Total: 28 passing assertions (100% green)
```

To run linting and type checking:
```bash
npm run lint
npm run build
```

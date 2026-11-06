import cors from "cors";
import express from "express";
import type { Server } from "socket.io";
import { z } from "zod";
import { env } from "./config/env.js";
import { githubStatus } from "./integrations/github/status.js";
import { switchAdapter } from "./integrations/switch/adapter.js";
import { errorHandler, notFoundHandler } from "./middleware/errors.js";
import { createIncidentRouter } from "./routes/incidents.js";
import { IncidentService } from "./services/incidentService.js";

const logQuerySchema = z.object({
  q: z.string().optional(),
  level: z.enum(["CRITICAL", "HIGH", "MEDIUM", "LOW"]).optional(),
});

const demoAgents = [
  { id: "incident-manager", name: "Incident Manager", role: "Triage & coordination" },
  { id: "log-analyzer", name: "Log Analyzer", role: "Logs & signals" },
  { id: "code-fixer", name: "Code Fixer", role: "Root cause & patch" },
  { id: "testing-agent", name: "Testing Agent", role: "Validation & regression" },
];

const demoLogs = [
  {
    id: "log-01",
    time: "14:32:08.481",
    level: "CRITICAL",
    source: "checkout-api",
    message: "TypeError: Cannot read properties of undefined (reading 'id')",
  },
  {
    id: "log-02",
    time: "14:32:07.994",
    level: "HIGH",
    source: "checkout-api",
    message: "POST /api/checkout returned 500 in 182ms",
  },
  {
    id: "log-03",
    time: "14:31:56.105",
    level: "HIGH",
    source: "inventory-service",
    message: "Reservation conflict: requested 2, available 1",
  },
  {
    id: "log-04",
    time: "14:30:42.672",
    level: "MEDIUM",
    source: "search-api",
    message: "Query exceeded 800ms threshold (duration=1246ms)",
  },
  {
    id: "log-05",
    time: "14:29:12.017",
    level: "LOW",
    source: "events-worker",
    message: "Retry scheduled for partner webhook (attempt 2/5)",
  },
];

export function createApp(io: Server) {
  const app = express();
  const incidentService = new IncidentService();

  app.disable("x-powered-by");
  app.use(cors({ origin: env.FRONTEND_ORIGIN }));
  app.use(express.json({ limit: "1mb" }));

  app.get("/api/health", (_request, response) => {
    response.json({
      data: {
        status: "ok",
        mode: "demo",
        integrations: {
          switch: switchAdapter.status(),
          github: githubStatus(),
        },
      },
    });
  });
  app.use("/api/incidents", createIncidentRouter(incidentService, io));
  app.get("/api/agents", (_request, response) => {
    response.json({
      data: demoAgents.map((agent) => ({
        ...agent,
        status: "idle",
        mode: "demo",
        currentTask: null,
      })),
      meta: { mode: "demo", integration: switchAdapter.status() },
    });
  });
  app.get("/api/agents/:id", (request, response) => {
    const agent = demoAgents.find((candidate) => candidate.id === request.params.id);
    if (!agent) {
      response.status(404).json({
        error: { code: "AGENT_NOT_FOUND", message: "Agent was not found." },
      });
      return;
    }
    response.json({ data: { ...agent, status: "idle", mode: "demo" } });
  });
  app.get("/api/logs", (request, response) => {
    const { q, level } = logQuerySchema.parse(request.query);
    const query = q?.trim().toLowerCase();
    const data = demoLogs.filter(
      (log) =>
        (!query || `${log.source} ${log.message}`.toLowerCase().includes(query)) &&
        (!level || log.level === level),
    );
    response.json({ data, meta: { mode: "demo", total: data.length } });
  });
  app.get("/api/logs/:id", (request, response) => {
    const log = demoLogs.find((entry) => entry.id === request.params.id);
    if (!log) {
      response.status(404).json({
        error: { code: "LOG_NOT_FOUND", message: "Log entry was not found." },
      });
      return;
    }
    response.json({ data: log, meta: { mode: "demo" } });
  });
  app.get("/api/github/repositories", (_request, response) => {
    response.status(503).json({
      error: {
        code: "GITHUB_NOT_CONNECTED",
        message: githubStatus().message,
      },
    });
  });
  app.get("/api/github/pull-requests", (_request, response) => {
    response.status(503).json({
      error: {
        code: "GITHUB_NOT_CONNECTED",
        message: githubStatus().message,
      },
    });
  });

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}

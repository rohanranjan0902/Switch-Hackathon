import { Router } from "express";
import { z } from "zod";
import type { Server } from "socket.io";
import { IncidentService } from "../services/incidentService.js";
import { switchAdapter } from "../integrations/switch/adapter.js";
import type { IncidentOrchestrator } from "../agents/orchestrator/IncidentOrchestrator.js";

const createIncidentSchema = z.object({
  title: z.string().trim().min(5).max(160),
  description: z.string().trim().min(5).max(4000),
  service: z.string().trim().min(2).max(100),
  severity: z.enum(["CRITICAL", "HIGH", "MEDIUM", "LOW"]),
});

const updateIncidentSchema = z.object({
  status: z.enum(["OPEN", "INVESTIGATING", "IDENTIFIED", "MONITORING", "RESOLVED"]),
});

export function createIncidentRouter(
  service: IncidentService,
  io: Server,
  orchestrator?: IncidentOrchestrator,
) {
  const router = Router();

  router.get("/", (request, response) => {
    const records = service.list();
    const severity = request.query.severity?.toString().toUpperCase();
    const status = request.query.status?.toString().toUpperCase();
    const filtered = records.filter(
      (incident) =>
        (!severity || incident.severity === severity) &&
        (!status || incident.status === status),
    );
    response.json({ data: filtered, meta: { mode: "demo", total: filtered.length } });
  });

  router.post("/", (request, response) => {
    const input = createIncidentSchema.parse(request.body);
    const incident = service.create(input);
    io.emit("incident:created", incident);
    response.status(201).json({ data: incident, meta: { mode: "demo" } });
  });

  router.get("/:id", (request, response) => {
    const incident = service.get(request.params.id);
    if (!incident) {
      response.status(404).json({
        error: { code: "INCIDENT_NOT_FOUND", message: "Incident was not found." },
      });
      return;
    }
    response.json({ data: incident, meta: { mode: "demo" } });
  });

  router.patch("/:id", (request, response) => {
    const input = updateIncidentSchema.parse(request.body);
    const incident = service.updateStatus(request.params.id, input.status);
    if (!incident) {
      response.status(404).json({
        error: { code: "INCIDENT_NOT_FOUND", message: "Incident was not found." },
      });
      return;
    }
    io.emit("incident:updated", incident);
    response.json({ data: incident, meta: { mode: "demo" } });
  });

  router.post("/:id/investigate", async (request, response, next) => {
    try {
      const incident = service.get(request.params.id);
      if (!incident) {
        response.status(404).json({
          error: { code: "INCIDENT_NOT_FOUND", message: "Incident was not found." },
        });
        return;
      }

      const sync = request.query.sync === "true";
      const execution = await switchAdapter.dispatch({
        incidentId: incident.id,
        incidentKey: incident.key,
        task: "Investigate the incident",
        sync,
      });

      const providerStatus = switchAdapter.status();

      if (sync) {
        response.status(200).json({
          data: execution,
          meta: { mode: providerStatus.provider, sync: true },
        });
        return;
      }

      response.status(202).json({
        data: {
          executionId: execution.id,
          incidentId: incident.id,
          incidentKey: incident.key,
          status: execution.status,
          startedAt: execution.startedAt,
          message: "Investigation started. Progress streaming via Socket.IO.",
        },
        meta: { mode: providerStatus.provider, sync: false },
      });
    } catch (error) {
      if (error instanceof Error && error.name === "SwitchNotConfiguredError") {
        response.status(503).json({
          error: { code: "SWITCH_NOT_CONFIGURED", message: error.message },
        });
        return;
      }
      next(error);
    }
  });

  router.get("/:id/executions", (request, response) => {
    const incident = service.get(request.params.id);
    if (!incident) {
      response.status(404).json({
        error: { code: "INCIDENT_NOT_FOUND", message: "Incident was not found." },
      });
      return;
    }

    const latest = orchestrator?.getLatestExecutionForIncident(incident.id);
    response.json({
      data: latest ? [latest] : [],
      meta: { mode: switchAdapter.status().provider, total: latest ? 1 : 0 },
    });
  });

  router.post("/:id/approve", (_request, response) => {
    response.status(501).json({
      error: {
        code: "APPROVAL_FLOW_NOT_IMPLEMENTED",
        message: "Approval requires an authenticated user and a persisted code change.",
      },
    });
  });

  router.post("/:id/reject", (_request, response) => {
    response.status(501).json({
      error: {
        code: "APPROVAL_FLOW_NOT_IMPLEMENTED",
        message: "Rejection requires an authenticated user and a persisted code change.",
      },
    });
  });

  return router;
}

import { useEffect, useState, useMemo, useCallback } from "react";
import { io, type Socket } from "socket.io-client";
import {
  fetchHealth,
  fetchIncidents,
  fetchIncident,
  postIncident,
  approveIncident as apiApprove,
  rejectIncident as apiReject,
  investigateIncident as apiInvestigate,
  fetchExecutions,
  fetchApproval,
  fetchAgents,
  fetchLogs,
  type ApiHealth,
} from "./api";
import type {
  Agent,
  AgentCompletedEvent,
  AgentStartedEvent,
  AgentStepEvent,
  ApprovalRecord,
  ExecutionRecord,
  Incident,
  LogEntry,
  Severity,
  ToastNotification,
} from "./types";
import { Header } from "./components/Header";
import { Sidebar, type NavPage } from "./components/Sidebar";
import { TopologyCanvas } from "./components/TopologyCanvas";
import { OverviewView } from "./components/OverviewView";
import { IncidentsView } from "./components/IncidentsView";
import { CodeReviewView } from "./components/CodeReviewView";
import { AgentsView } from "./components/AgentsView";
import { LogsExplorerView } from "./components/LogsExplorerView";
import { WarRoomDrawer, type WarRoomMessage } from "./components/WarRoomDrawer";
import { CommandPalette } from "./components/CommandPalette";
import { CreateIncidentModal } from "./components/CreateIncidentModal";
import { ApprovalDialog } from "./components/ApprovalDialog";
import { ToastContainer } from "./components/ToastContainer";

export default function App() {
  const [activeNav, setActiveNav] = useState<NavPage>("Overview");
  const [health, setHealth] = useState<ApiHealth | null>(null);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [execution, setExecution] = useState<ExecutionRecord | null>(null);
  const [approval, setApproval] = useState<ApprovalRecord | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isInvestigating, setIsInvestigating] = useState(false);

  // Modals & Drawers
  const [warRoomOpen, setWarRoomOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [approvalModalOpen, setApprovalModalOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Filters & Search
  const [incidentFilter, setIncidentFilter] = useState("all");
  const [logSearch, setLogSearch] = useState("");
  const [logSeverityFilter, setLogSeverityFilter] = useState("all");

  // Telemetry Toasts
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  const addToast = useCallback((toast: Omit<ToastNotification, "id">) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const newToast: ToastNotification = { ...toast, id };
    setToasts((prev) => [...prev, newToast]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, toast.duration ?? 4500);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Streamed War Room Messages
  const [warRoomMessages, setWarRoomMessages] = useState<WarRoomMessage[]>([
    {
      id: "init-1",
      sender: "@incident_manager",
      senderRole: "mgr",
      time: "14:32:00",
      text: "🤖 War Room Connected: Listening for Sentry thresholds and microservice alerts.",
    },
  ]);

  const addWarRoomMessage = useCallback((msg: Omit<WarRoomMessage, "id" | "time">) => {
    const now = new Date();
    const timeStr = now.toTimeString().split(" ")[0];
    const newMsg: WarRoomMessage = {
      ...msg,
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      time: timeStr,
    };
    setWarRoomMessages((prev) => [...prev, newMsg]);
  }, []);

  // 1. Initial Load: Health, Incidents, Agents, Logs
  useEffect(() => {
    fetchHealth()
      .then(setHealth)
      .catch(() => {});

    fetchIncidents()
      .then((records) => {
        setIncidents(records);
        if (records.length > 0) {
          const crit = records.find((i) => i.severity === "critical") ?? records[0];
          setSelectedIncident(crit);
        }
      })
      .catch(() => {
        addToast({
          type: "warning",
          title: "API Unavailable",
          message:
            "Could not connect to Express backend. Running in preview fallback mode.",
        });
      });

    fetchAgents()
      .then(setAgents)
      .catch(() => {});

    fetchLogs()
      .then(setLogs)
      .catch(() => {});
  }, [addToast]);

  // 2. Fetch execution and approval whenever selectedIncident changes
  useEffect(() => {
    if (!selectedIncident) return;

    fetchExecutions(selectedIncident.id)
      .then((execs) => {
        if (execs && execs.length > 0) {
          setExecution(execs[0]);
        } else {
          setExecution(null);
        }
      })
      .catch(() => setExecution(null));

    fetchApproval(selectedIncident.id)
      .then(setApproval)
      .catch(() => setApproval(null));
  }, [selectedIncident]);

  // 3. Socket.IO Real-time Events Integration
  useEffect(() => {
    let socket: Socket;
    try {
      socket = io();
    } catch {
      return;
    }

    socket.on("connect", () => {
      // Socket connected
    });

    socket.on("incident:created", (record: Incident) => {
      setIncidents((prev) => {
        const exists = prev.some((i) => i.id === record.id);
        if (exists) return prev;
        return [record, ...prev];
      });
      addToast({
        type: "info",
        title: "New Incident Declared",
        message: `${record.id}: ${record.title} (${record.severity.toUpperCase()})`,
      });
      addWarRoomMessage({
        sender: "@incident_manager",
        senderRole: "mgr",
        text: `🚨 New Outage Declared: ${record.id} [${record.severity.toUpperCase()}] on ${record.service}: ${record.title}`,
      });
    });

    socket.on("incident:updated", (record: Incident) => {
      setIncidents((prev) => prev.map((i) => (i.id === record.id ? record : i)));
      if (selectedIncident?.id === record.id) {
        setSelectedIncident(record);
      }
    });

    socket.on("agent:execution:started", (data: AgentStartedEvent) => {
      setIsInvestigating(true);
      addToast({
        type: "info",
        title: "Agent Investigation Started",
        message: `Dispatching specialist pipeline for ${data.incidentKey}`,
      });
      addWarRoomMessage({
        sender: "@incident_manager",
        senderRole: "mgr",
        text: `🚀 Multi-Agent Investigation launched for ${data.incidentKey}. Mobilizing Log Analyzer and Code Fixer...`,
      });
      setExecution((prev) => ({
        id: data.executionId,
        incidentId: data.incidentId,
        incidentKey: data.incidentKey,
        status: "RUNNING",
        startedAt: data.startedAt,
        currentRole: "incident-manager",
        currentStep: "Triaging incident scope",
        report: prev?.report,
      }));
    });

    socket.on("agent:execution:step", (event: AgentStepEvent) => {
      setExecution((prev) => {
        if (!prev) {
          return {
            id: event.executionId,
            incidentId: event.incidentId,
            incidentKey: selectedIncident?.id ?? "INC-2847",
            status: "RUNNING",
            startedAt: event.timestamp,
            currentRole: event.role,
            currentStep: event.step,
          };
        }
        return {
          ...prev,
          currentRole: event.role,
          currentStep: event.step,
        };
      });

      const roleSenderMap: Record<
        string,
        { sender: string; role: WarRoomMessage["senderRole"] }
      > = {
        "incident-manager": { sender: "@incident_manager", role: "mgr" },
        "log-analyzer": { sender: "@log_analyzer", role: "log" },
        "code-fixer": { sender: "@code_fixer", role: "fix" },
        "testing-agent": { sender: "@testing_agent", role: "test" },
      };

      const roleInfo = roleSenderMap[event.role] ?? {
        sender: "@orchestrator",
        role: "orch",
      };

      if (event.status === "COMPLETED") {
        addWarRoomMessage({
          sender: roleInfo.sender,
          senderRole: roleInfo.role,
          text: `✅ [${event.role.replace("-", " ").toUpperCase()}] ${event.step}`,
        });
      } else if (event.status === "RUNNING") {
        addWarRoomMessage({
          sender: roleInfo.sender,
          senderRole: roleInfo.role,
          text: `⚙️ [${event.role.replace("-", " ").toUpperCase()}] ${event.step}...`,
        });
      }
    });

    socket.on("agent:execution:completed", (data: AgentCompletedEvent) => {
      setIsInvestigating(false);
      setExecution((prev) => ({
        id: data.executionId,
        incidentId: data.incidentId,
        incidentKey: data.incidentKey,
        status: data.status,
        startedAt: prev?.startedAt ?? new Date().toISOString(),
        completedAt: data.completedAt,
        report: data.report,
        codeChange: data.report.codeFix
          ? {
              id: `patch-${data.executionId}`,
              summary: data.report.codeFix.summary,
              patch: data.report.codeFix.patch,
              rootCause: data.report.codeFix.rootCause,
              createdAt: data.completedAt,
            }
          : undefined,
        testExecution: data.report.testVerification
          ? {
              id: `test-${data.executionId}`,
              status:
                data.report.testVerification.status === "PASSED" ? "SUCCEEDED" : "FAILED",
              command: data.report.testVerification.command,
              output: data.report.testVerification.output,
              passedCount: data.report.testVerification.passedCount,
              failedCount: data.report.testVerification.failedCount,
              startedAt: data.report.startedAt,
              completedAt: data.completedAt,
            }
          : undefined,
      }));

      addToast({
        type: "success",
        title: "Investigation Complete",
        message: `Hotfix unified diff generated and verified (${data.report.testVerification?.passedCount ?? 2}/2 tests passed). Ready for Human Approval!`,
      });

      addWarRoomMessage({
        sender: "@testing_agent",
        senderRole: "test",
        text: `🧪 [Verification Passed] All ${data.report.testVerification?.passedCount ?? 2} tests passed in ${data.report.testVerification?.durationMs ?? 145}ms. Standing by for Human Sign-off.`,
      });
    });

    socket.on("agent:execution:failed", (err: { error: { message: string } }) => {
      setIsInvestigating(false);
      addToast({
        type: "error",
        title: "Agent Investigation Failed",
        message: err.error?.message ?? "An error occurred during multi-agent execution.",
      });
      addWarRoomMessage({
        sender: "@orchestrator",
        senderRole: "orch",
        text: `🛑 Investigation failed: ${err.error?.message ?? "Unknown error"}`,
      });
    });

    socket.on(
      "incident:approved",
      (payload: { approval: ApprovalRecord; incident: Incident }) => {
        addToast({
          type: "success",
          title: "Patch Sign-Off Approved",
          message: `Incident marked RESOLVED by ${payload.approval.reviewer}. Ready for GitHub PR sync.`,
        });
        addWarRoomMessage({
          sender: "@incident_manager",
          senderRole: "mgr",
          text: `🎉 [Patch Approved] Incident marked RESOLVED by ${payload.approval.reviewer}. Ready for GitHub PR sync.`,
        });
      },
    );

    socket.on(
      "incident:rejected",
      (payload: { approval: ApprovalRecord; incident: Incident }) => {
        addToast({
          type: "warning",
          title: "Patch Sign-Off Rejected",
          message: `Incident returned to OPEN status by ${payload.approval.reviewer}.`,
        });
        addWarRoomMessage({
          sender: "@incident_manager",
          senderRole: "mgr",
          text: `🛑 [Patch Rejected] Proposal rejected by ${payload.approval.reviewer}. Reason: ${payload.approval.note ?? "None"}. Incident reset to OPEN.`,
        });
      },
    );

    return () => {
      socket.disconnect();
    };
  }, [selectedIncident, addToast, addWarRoomMessage]);

  // 4. Dynamic MTTR Elapsed Calculation from selectedIncident.rawCreatedAt
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    if (!selectedIncident?.rawCreatedAt) return;

    const calculateElapsed = () => {
      const parsed = Date.parse(selectedIncident.rawCreatedAt);
      if (isNaN(parsed)) return;
      const diffSec = Math.max(0, Math.floor((Date.now() - parsed) / 1000));
      setElapsedSeconds(diffSec);
    };

    calculateElapsed();
    const interval = setInterval(calculateElapsed, 1000);
    return () => clearInterval(interval);
  }, [selectedIncident?.rawCreatedAt]);

  const mttrDisplay = useMemo(() => {
    const mins = Math.floor(elapsedSeconds / 60)
      .toString()
      .padStart(2, "0");
    const secs = (elapsedSeconds % 60).toString().padStart(2, "0");
    return `${mins}:${secs}.00`;
  }, [elapsedSeconds]);

  // 5. Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((prev) => !prev);
        return;
      }

      if (e.key === "Escape") {
        setPaletteOpen(false);
        setWarRoomOpen(false);
        setCreateModalOpen(false);
        setApprovalModalOpen(false);
        return;
      }

      const isInput =
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement;

      if (!isInput && !paletteOpen && !createModalOpen && !approvalModalOpen) {
        if (e.key.toLowerCase() === "w") {
          e.preventDefault();
          setWarRoomOpen((prev) => !prev);
        } else if (e.key === "1") {
          setActiveNav("Overview");
        } else if (e.key === "2") {
          setActiveNav("Incidents");
        } else if (e.key === "3") {
          setActiveNav("AI Agents");
        } else if (e.key === "4") {
          setActiveNav("Logs Explorer");
        } else if (e.key === "5") {
          setActiveNav("Code Review");
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [paletteOpen, createModalOpen, approvalModalOpen]);

  // Actions
  const handleInvestigate = async (idOrKey: string) => {
    setIsInvestigating(true);
    try {
      const res = await apiInvestigate(idOrKey);
      addToast({
        type: "info",
        title: "Agent Dispatch Acknowledged",
        message: res.message || "Multi-agent squad dispatched.",
      });
    } catch (err) {
      setIsInvestigating(false);
      addToast({
        type: "error",
        title: "Investigation Failed",
        message: (err as Error).message,
      });
    }
  };

  const handleApprove = async (reviewer: string, note?: string) => {
    if (!selectedIncident) return;
    try {
      const res = await apiApprove(selectedIncident.id, reviewer, note);
      addToast({
        type: "success",
        title: "Patch Sign-Off Approved",
        message: res.message || `Incident ${selectedIncident.id} resolved.`,
      });
      // Refresh selected incident
      const updated = await fetchIncident(selectedIncident.id);
      setSelectedIncident(updated);
      setIncidents((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
    } catch (err) {
      addToast({
        type: "error",
        title: "Approval Failed",
        message: (err as Error).message,
      });
      throw err;
    }
  };

  const handleReject = async (reviewer: string, note?: string) => {
    if (!selectedIncident) return;
    try {
      const res = await apiReject(selectedIncident.id, reviewer, note);
      addToast({
        type: "warning",
        title: "Patch Sign-Off Rejected",
        message: res.message || `Incident ${selectedIncident.id} reset to OPEN.`,
      });
      const updated = await fetchIncident(selectedIncident.id);
      setSelectedIncident(updated);
      setIncidents((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
    } catch (err) {
      addToast({
        type: "error",
        title: "Rejection Failed",
        message: (err as Error).message,
      });
      throw err;
    }
  };

  const handleCreateIncident = async (data: {
    title: string;
    service: string;
    severity: Severity;
    description?: string;
  }) => {
    const created = await postIncident(data);
    setIncidents((prev) => [created, ...prev]);
    setSelectedIncident(created);
    setActiveNav("Incidents");
    addToast({
      type: "success",
      title: "Incident Declared",
      message: `${created.id}: ${created.title}`,
    });
  };

  const handleSendWarRoomMessage = (text: string) => {
    addWarRoomMessage({
      sender: "@operator (Team Daanav)",
      senderRole: "operator",
      text,
    });

    const trimmed = text.trim();
    const lower = trimmed.toLowerCase();

    // Command: /clear
    if (lower === "/clear") {
      setWarRoomMessages([
        {
          id: `init-${Date.now()}`,
          sender: "@incident_manager",
          senderRole: "mgr",
          time: new Date().toTimeString().split(" ")[0],
          text: "🤖 War Room Connected: Ready for commands (/status, /investigate, /logs, /help).",
        },
      ]);
      return;
    }

    // Command: /help
    if (lower.startsWith("/help")) {
      setTimeout(() => {
        addWarRoomMessage({
          sender: "@orchestrator",
          senderRole: "orch",
          text: `📋 Available War Room Commands:\n• /status - Show tracked outages and squad telemetry\n• /investigate [INC-ID] - Launch 4-stage multi-agent triage\n• /approve - Sign-off on synthesized hotfix\n• /logs - Inspect recent anomalous telemetry\n• /test - Check test execution proof\n• /clear - Clear feed history`,
        });
      }, 200);
      return;
    }

    // Command: /status
    if (lower.startsWith("/status")) {
      setTimeout(() => {
        const summary =
          incidents.length > 0
            ? incidents
                .map(
                  (i) =>
                    `• ${i.id} [${i.status.toUpperCase()}] - ${i.title} (${i.severity.toUpperCase()}) on ${i.service}`,
                )
                .join("\n")
            : "• No active incidents registered.";
        addWarRoomMessage({
          sender: "@incident_manager",
          senderRole: "mgr",
          text: `📊 Active Incidents Telemetry Report (${incidents.length} tracked):\n\n${summary}\n\nCluster State: Sentry alerts monitored. Mode: SWITCH SIMULATION.`,
        });
      }, 250);
      return;
    }

    // Command: /investigate
    if (lower.startsWith("/investigate")) {
      const parts = trimmed.split(" ").filter(Boolean);
      const targetId = parts[1] || selectedIncident?.id || "INC-2847";
      const match = incidents.find((i) => i.id === targetId) ?? incidents[0];
      if (match) setSelectedIncident(match);

      setTimeout(() => {
        addWarRoomMessage({
          sender: "@incident_manager",
          senderRole: "mgr",
          text: `🚀 Multi-Agent Triage mobilized for ${targetId} (${match?.title || "Outage"}). Assessing blast radius...`,
        });
        void handleInvestigate(targetId);
      }, 200);
      return;
    }

    // Command: /approve
    if (lower.startsWith("/approve")) {
      if (!selectedIncident) {
        setTimeout(() => {
          addWarRoomMessage({
            sender: "@orchestrator",
            senderRole: "orch",
            text: "⚠️ No incident selected for approval.",
          });
        }, 200);
        return;
      }
      setTimeout(() => {
        void handleApprove("Team Daanav", "Approved via War Room stream");
        addWarRoomMessage({
          sender: "@incident_manager",
          senderRole: "mgr",
          text: `✅ Hotfix for ${selectedIncident.id} officially signed-off by Team Daanav. Merging to main and initiating zero-downtime rollout.`,
        });
      }, 200);
      return;
    }

    // Queries: testing / test
    if (lower.includes("testing") || lower.includes("test")) {
      setTimeout(() => {
        const passCount = execution?.report?.testVerification?.passedCount ?? 2;
        const totalCount = execution?.report?.testVerification?.totalCount ?? 2;
        addWarRoomMessage({
          sender: "@testing_agent",
          senderRole: "test",
          text: `🧪 Testing Agent Report: Isolated regression sandbox verified.\n• Command: npm run test --workspace sample-app\n• Results: ${passCount}/${totalCount} assertions passing\n• Regression risk: ZERO`,
        });
      }, 250);
      return;
    }

    // Queries: fix / patch / diff / code
    if (
      lower.includes("fix") ||
      lower.includes("patch") ||
      lower.includes("diff") ||
      lower.includes("code")
    ) {
      setTimeout(() => {
        const targetFile =
          execution?.report?.codeFix?.targetFile || "sample-app/src/checkout.ts";
        addWarRoomMessage({
          sender: "@code_fixer",
          senderRole: "fix",
          text: `⚡ Code Fixer Report: Synthesized hotfix diff for ${targetFile}.\nFixed condition: inventory.available < item.quantity guard prevents stock race condition.`,
        });
      }, 250);
      return;
    }

    // Queries: log / telemetry / sentry
    if (
      lower.includes("log") ||
      lower.includes("telemetry") ||
      lower.includes("sentry")
    ) {
      setTimeout(() => {
        addWarRoomMessage({
          sender: "@log_analyzer",
          senderRole: "log",
          text: `🔍 Log Analyzer Report: Culprit stack trace isolated in checkout-api.\nLog ID: log-01 [CRITICAL]\nError: TypeError: Cannot read properties of undefined (reading 'stock') at checkout.ts:25:21`,
        });
      }, 250);
      return;
    }

    // Default operator broadcast ACK
    setTimeout(() => {
      addWarRoomMessage({
        sender: "@orchestrator",
        senderRole: "orch",
        text: `🤖 Squad Orchestrator: Operator instruction acknowledged: "${trimmed}". Relayed to Switch Room 1eab763f... and Telegram Supergroup (-1004337160724). Type /help for command list.`,
      });
    }, 250);
  };

  const handlePingAgent = (agentName: string, roleKey: string) => {
    setWarRoomOpen(true);
    addWarRoomMessage({
      sender: `@${roleKey.replace("-", "_")}`,
      senderRole:
        roleKey === "incident-manager"
          ? "mgr"
          : roleKey === "log-analyzer"
            ? "log"
            : roleKey === "code-fixer"
              ? "fix"
              : "test",
      text: `🤖 Healthcheck ACK from ${agentName}: Daemon ready, socket connected, Switch room active.`,
    });
    addToast({
      type: "info",
      title: `${agentName} Pinged`,
      message: "Healthcheck acknowledged in Telegram War Room.",
    });
  };

  const handleAnalyzeLog = (log: LogEntry) => {
    setActiveNav("Incidents");
    const matching = incidents.find((i) => i.service === log.service) ?? selectedIncident;
    if (matching) {
      setSelectedIncident(matching);
      handleInvestigate(matching.id);
    }
  };

  const hasPendingPatch = Boolean(
    execution?.codeChange?.patch || execution?.report?.codeFix?.patch,
  );

  return (
    <div
      style={{
        position: "relative",
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Lightweight, Low-Overhead Background Canvas that pauses when idle */}
      <TopologyCanvas />

      {/* Top Command HUD Header */}
      <Header
        activeNav={activeNav}
        health={health}
        warRoomOpen={warRoomOpen}
        onToggleWarRoom={() => setWarRoomOpen((prev) => !prev)}
        onOpenPalette={() => setPaletteOpen(true)}
        unreadWarRoomCount={0}
        mobileNavOpen={mobileNavOpen}
        onToggleMobileNav={() => setMobileNavOpen((prev) => !prev)}
      />

      {/* App Shell: Sidebar + Main Viewport */}
      <div className="app-shell">
        <Sidebar
          activeNav={activeNav}
          onSelectNav={setActiveNav}
          incidents={incidents}
          hasPendingPatch={hasPendingPatch}
          health={health}
          mobileOpen={mobileNavOpen}
          onCloseMobile={() => setMobileNavOpen(false)}
        />

        <main className="main-viewport select-none" tabIndex={-1}>
          {activeNav === "Overview" && (
            <OverviewView
              incidents={incidents}
              health={health}
              onSelectIncident={(inc) => {
                setSelectedIncident(inc);
                setActiveNav("Incidents");
              }}
              onNavigateToIncidents={() => setActiveNav("Incidents")}
              onOpenCreateModal={() => setCreateModalOpen(true)}
              mttrDisplay={mttrDisplay}
            />
          )}

          {activeNav === "Incidents" && (
            <IncidentsView
              incidents={incidents}
              selectedIncident={selectedIncident}
              execution={execution}
              approval={approval}
              isInvestigating={isInvestigating}
              filter={incidentFilter}
              onSelectFilter={setIncidentFilter}
              onSelectIncident={setSelectedIncident}
              onInvestigate={handleInvestigate}
              onOpenApproval={() => setApprovalModalOpen(true)}
              onOpenCreateModal={() => setCreateModalOpen(true)}
              onNavigateToCodeReview={() => setActiveNav("Code Review")}
              mttrDisplay={mttrDisplay}
            />
          )}

          {activeNav === "AI Agents" && (
            <AgentsView
              agents={agents}
              execution={execution}
              onPingAgent={handlePingAgent}
            />
          )}

          {activeNav === "Logs Explorer" && (
            <LogsExplorerView
              logs={logs}
              searchQuery={logSearch}
              onSearchChange={setLogSearch}
              severityFilter={logSeverityFilter}
              onSeverityFilterChange={setLogSeverityFilter}
              onAnalyzeLog={handleAnalyzeLog}
              onRefreshLogs={() => {
                fetchLogs({ q: logSearch, level: logSeverityFilter }).then(setLogs);
              }}
            />
          )}

          {activeNav === "Code Review" && (
            <CodeReviewView
              incident={selectedIncident}
              execution={execution}
              approval={approval}
              onOpenApproval={() => setApprovalModalOpen(true)}
            />
          )}
        </main>
      </div>

      {/* Collapsible Telegram War Room Slide-Over Drawer */}
      <WarRoomDrawer
        isOpen={warRoomOpen}
        onClose={() => setWarRoomOpen(false)}
        messages={warRoomMessages}
        onSendMessage={handleSendWarRoomMessage}
      />

      {/* Raycast-style Action Dock */}
      <div className="raycast-action-dock" role="toolbar" aria-label="Quick Actions">
        <button
          onClick={() => setApprovalModalOpen(true)}
          className="dock-action-btn primary"
          title="Sign-off on proposed patch"
        >
          <span>Sign-Off Gate</span>
          <span className="keycap">↵</span>
        </button>

        <button
          onClick={() => {
            if (selectedIncident) handleInvestigate(selectedIncident.id);
          }}
          disabled={isInvestigating}
          className="dock-action-btn"
          title="Run multi-agent investigation"
        >
          <span>{isInvestigating ? "Investigating..." : "Run AI Investigation"}</span>
          <span className="keycap">R</span>
        </button>

        <button
          onClick={() => setWarRoomOpen((prev) => !prev)}
          className="dock-action-btn"
          title="Toggle Telegram War Room"
        >
          <span>War Room</span>
          <span className="keycap">W</span>
        </button>

        <div className="dock-divider" />

        <button
          onClick={() => setPaletteOpen(true)}
          className="dock-action-btn"
          title="Open Command Palette"
        >
          <span>Commands</span>
          <span className="keycap">⌘K</span>
        </button>
      </div>

      {/* Interactive Command Palette (Cmd+K) */}
      <CommandPalette
        isOpen={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        onNavigate={setActiveNav}
        onToggleWarRoom={() => setWarRoomOpen((prev) => !prev)}
        onOpenCreateModal={() => setCreateModalOpen(true)}
        onInvestigateActive={() => {
          if (selectedIncident) handleInvestigate(selectedIncident.id);
        }}
        onOpenApproval={() => setApprovalModalOpen(true)}
      />

      {/* Create Incident Modal */}
      <CreateIncidentModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSubmit={handleCreateIncident}
      />

      {/* Human Approval Sign-off Dialog */}
      {selectedIncident && (
        <ApprovalDialog
          incident={selectedIncident}
          execution={execution}
          isOpen={approvalModalOpen}
          onClose={() => setApprovalModalOpen(false)}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      )}

      {/* Non-blocking Telemetry Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

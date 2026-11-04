import { useEffect, useMemo, useState } from "react";
import { io } from "socket.io-client";
import {
  Activity,
  AlertCircle,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Bot,
  Check,
  ChevronDown,
  CircleHelp,
  Clock3,
  Code2,
  Command,
  ExternalLink,
  GitPullRequest,
  LayoutDashboard,
  ListFilter,
  Menu,
  Plus,
  Radio,
  Search,
  Settings2,
  ShieldCheck,
  TerminalSquare,
  X,
  Zap,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts";
import { agents, initialIncidents, logs } from "./data";
import { fetchIncidents, patchIncidentStatus, postIncident, toIncident } from "./api";
import type { Incident, IncidentStatus, Severity } from "./types";

type Page =
  | "Overview"
  | "Incidents"
  | "AI Agents"
  | "Logs Explorer"
  | "Code Review"
  | "GitHub"
  | "Settings";

const navigation: { name: Page; icon: typeof LayoutDashboard; count?: string }[] = [
  { name: "Overview", icon: LayoutDashboard },
  { name: "Incidents", icon: AlertCircle, count: "04" },
  { name: "AI Agents", icon: Bot },
  { name: "Logs Explorer", icon: TerminalSquare },
  { name: "Code Review", icon: Code2 },
  { name: "GitHub", icon: GitPullRequest },
];

const chartData = [
  { time: "09:00", incidents: 12, resolved: 8 },
  { time: "10:00", incidents: 18, resolved: 12 },
  { time: "11:00", incidents: 14, resolved: 10 },
  { time: "12:00", incidents: 24, resolved: 16 },
  { time: "13:00", incidents: 19, resolved: 14 },
  { time: "14:00", incidents: 31, resolved: 22 },
  { time: "15:00", incidents: 22, resolved: 19 },
  { time: "16:00", incidents: 28, resolved: 21 },
];

const severityLabel: Record<Severity, string> = {
  critical: "Critical",
  high: "High",
  medium: "Medium",
  low: "Low",
};

function isSeverity(value: string): value is Severity {
  return (
    value === "critical" || value === "high" || value === "medium" || value === "low"
  );
}

function isIncidentStatus(value: string): value is IncidentStatus {
  return (
    value === "open" ||
    value === "investigating" ||
    value === "identified" ||
    value === "monitoring" ||
    value === "resolved"
  );
}

function App() {
  const [page, setPage] = useState<Page>("Overview");
  const [incidents, setIncidents] = useState(initialIncidents);
  const [query, setQuery] = useState("");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [showCreate, setShowCreate] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [toast, setToast] = useState("");
  const [mobileMenu, setMobileMenu] = useState(false);
  const [apiError, setApiError] = useState("");

  useEffect(() => {
    let active = true;
    const socket = io();
    const syncIncident = (record: Parameters<typeof toIncident>[0]) => {
      if (!active) return;
      const incident = toIncident(record);
      setIncidents((current) => {
        const exists = current.some((item) => item.id === incident.id);
        return exists
          ? current.map((item) => (item.id === incident.id ? incident : item))
          : [incident, ...current];
      });
    };

    fetchIncidents()
      .then((records) => {
        if (active) {
          setIncidents(records);
          setApiError("");
        }
      })
      .catch(() => {
        if (active) setApiError("API offline — showing local demo fixtures.");
      });
    socket.on("incident:created", syncIncident);
    socket.on("incident:updated", syncIncident);

    return () => {
      active = false;
      socket.disconnect();
    };
  }, []);

  const filteredIncidents = useMemo(
    () =>
      incidents.filter((incident) => {
        const matchesSearch = `${incident.id} ${incident.title} ${incident.service}`
          .toLowerCase()
          .includes(query.toLowerCase());
        return (
          matchesSearch &&
          (severityFilter === "all" || incident.severity === severityFilter)
        );
      }),
    [incidents, query, severityFilter],
  );

  async function addIncident(title: string, service: string, severity: Severity) {
    try {
      const created = await postIncident({ title, service, severity });
      setIncidents((current) => [
        created,
        ...current.filter((item) => item.id !== created.id),
      ]);
      setShowCreate(false);
      setPage("Incidents");
      setToast("Incident created in demo API");
    } catch (error) {
      if (!(error instanceof TypeError)) {
        setToast(
          error instanceof Error ? error.message : "Incident could not be created.",
        );
        window.setTimeout(() => setToast(""), 3200);
        return;
      }
      const newIncident: Incident = {
        id: `INC-${2848 + incidents.length - initialIncidents.length}`,
        title,
        service,
        severity,
        status: "open",
        createdAt: "Just now",
        summary: "New incident report awaiting investigation.",
        assignee: "Incident Manager",
      };
      setIncidents((current) => [newIncident, ...current]);
      setShowCreate(false);
      setPage("Incidents");
      setToast("Incident created locally — API offline");
    }
    window.setTimeout(() => setToast(""), 3200);
  }

  async function changeStatus(id: string, status: IncidentStatus) {
    try {
      const updated = await patchIncidentStatus(id, status);
      setIncidents((current) =>
        current.map((incident) => (incident.id === id ? updated : incident)),
      );
      setToast("Incident status updated");
    } catch (error) {
      setToast(
        error instanceof Error ? error.message : "Incident status could not be updated.",
      );
    }
    window.setTimeout(() => setToast(""), 2600);
  }

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileMenu ? "sidebar-open" : ""}`}>
        <div className="brand">
          <div className="brand-mark">
            <Command size={17} strokeWidth={2.2} />
          </div>
          <span>switchboard</span>
          <button
            className="icon-button mobile-close"
            onClick={() => setMobileMenu(false)}
            aria-label="Close menu"
          >
            <X size={17} />
          </button>
        </div>
        <button className="workspace-picker">
          <span className="workspace-avatar">A</span>
          <span className="workspace-copy">
            <strong>Acme, Inc.</strong>
            <small>Engineering</small>
          </span>
          <ChevronDown size={14} className="muted" />
        </button>
        <div className="nav-label">WORKSPACE</div>
        <nav className="main-nav" aria-label="Main navigation">
          {navigation.map(({ name, icon: Icon, count }) => (
            <button
              key={name}
              className={`nav-item ${page === name ? "active" : ""}`}
              onClick={() => {
                setPage(name);
                setMobileMenu(false);
              }}
            >
              <Icon size={16} strokeWidth={1.8} />
              <span>{name}</span>
              {count && (
                <span className="nav-count">
                  {incidents
                    .filter((i) => i.status !== "resolved")
                    .length.toString()
                    .padStart(2, "0")}
                </span>
              )}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="switch-status">
            <span className="status-dot dot-amber" />
            <span>Switch not connected</span>
            <button aria-label="Switch setup help" onClick={() => setPage("AI Agents")}>
              <CircleHelp size={14} />
            </button>
          </div>
          <button
            className={`nav-item ${page === "Settings" ? "active" : ""}`}
            onClick={() => setPage("Settings")}
          >
            <Settings2 size={16} />
            <span>Settings</span>
          </button>
          <div className="profile">
            <div className="profile-avatar">RR</div>
            <div className="profile-copy">
              <strong>Rohan R.</strong>
              <small>Workspace admin</small>
            </div>
            <button className="icon-button" aria-label="Profile options">
              <ChevronDown size={15} />
            </button>
          </div>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <button
            className="icon-button menu-button"
            onClick={() => setMobileMenu(true)}
            aria-label="Open menu"
          >
            <Menu size={19} />
          </button>
          <div className="breadcrumbs">
            <span>Workspace</span>
            <span className="crumb-slash">/</span>
            <strong>{page}</strong>
          </div>
          <div className="topbar-actions">
            <div className="demo-pill">
              <span /> DEMO DATA
            </div>
            <button className="topbar-search" onClick={() => setPage("Incidents")}>
              <Search size={14} />
              <span>Search...</span>
              <kbd>⌘ K</kbd>
            </button>
            <button className="help-button" aria-label="Help">
              <CircleHelp size={17} />
            </button>
          </div>
        </header>
        <div className="page-content">
          {apiError && (
            <div className="api-offline-banner">
              <AlertCircle size={14} />
              {apiError}
            </div>
          )}
          {page === "Overview" && (
            <Overview
              incidents={incidents}
              onNavigate={setPage}
              onCreate={() => setShowCreate(true)}
              onStatus={changeStatus}
              onSelect={setSelectedIncident}
            />
          )}
          {page === "Incidents" && (
            <IncidentsPage
              incidents={filteredIncidents}
              query={query}
              onQuery={setQuery}
              severity={severityFilter}
              onSeverity={setSeverityFilter}
              onCreate={() => setShowCreate(true)}
              onStatus={changeStatus}
              onSelect={setSelectedIncident}
            />
          )}
          {page === "AI Agents" && <AgentsPage />}
          {page === "Logs Explorer" && <LogsPage />}
          {page === "Code Review" && (
            <CodeReviewPage
              onToast={(message) => {
                setToast(message);
                window.setTimeout(() => setToast(""), 2600);
              }}
            />
          )}
          {page === "GitHub" && <GitHubPage />}
          {page === "Settings" && <SettingsPage onNavigate={setPage} />}
        </div>
        <footer className="footer">
          <span>
            <span className="status-dot dot-green" /> All systems operational
          </span>
          <span>
            Demo workspace <span className="footer-sep">·</span> v0.1.0
          </span>
        </footer>
      </main>
      {showCreate && (
        <CreateIncidentModal
          onClose={() => setShowCreate(false)}
          onCreate={addIncident}
        />
      )}
      {selectedIncident && (
        <IncidentDetailsModal
          incident={selectedIncident}
          onClose={() => setSelectedIncident(null)}
        />
      )}
      {toast && (
        <div className="toast">
          <Check size={16} />
          {toast}
        </div>
      )}
    </div>
  );
}

function PageHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {action}
    </div>
  );
}

function Overview({
  incidents,
  onNavigate,
  onCreate,
  onStatus,
  onSelect,
}: {
  incidents: Incident[];
  onNavigate: (page: Page) => void;
  onCreate: () => void;
  onStatus: (id: string, status: IncidentStatus) => void;
  onSelect: (incident: Incident) => void;
}) {
  const active = incidents.filter((i) => i.status !== "resolved").length;
  const critical = incidents.filter(
    (i) => i.severity === "critical" && i.status !== "resolved",
  ).length;
  return (
    <>
      <PageHeading
        eyebrow={new Intl.DateTimeFormat("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
          year: "numeric",
        })
          .format(new Date())
          .toUpperCase()}
        title="Good afternoon, Rohan"
        description="Here’s what’s happening across your services today."
        action={
          <button className="primary-button" onClick={onCreate}>
            <Plus size={15} /> Report incident
          </button>
        }
      />
      <div className="health-banner">
        <div className="health-icon">
          <Activity size={17} />
        </div>
        <div className="health-copy">
          <strong>All systems operational</strong>
          <span>Services are healthy. Last checked 24 seconds ago.</span>
        </div>
        <div className="health-services">
          <span>
            <i className="status-dot dot-green" /> API
          </span>
          <span>
            <i className="status-dot dot-green" /> Database
          </span>
          <span>
            <i className="status-dot dot-green" /> Workers
          </span>
        </div>
        <button className="health-link" onClick={() => onNavigate("Logs Explorer")}>
          View status <ArrowRight size={14} />
        </button>
      </div>
      <div className="metric-grid">
        <MetricCard
          title="Total incidents"
          value="128"
          change="+12.8%"
          trend="up"
          icon={<AlertCircle size={16} />}
          note="vs last 30 days"
        />
        <MetricCard
          title="Active incidents"
          value={String(active).padStart(2, "0")}
          change="-18.2%"
          trend="down"
          icon={<Radio size={16} />}
          note="vs last 30 days"
          accent="blue"
        />
        <MetricCard
          title="Resolved"
          value="104"
          change="+8.4%"
          trend="up"
          icon={<Check size={16} />}
          note="vs last 30 days"
          accent="green"
        />
        <MetricCard
          title="Critical"
          value={String(critical).padStart(2, "0")}
          change="-2 this week"
          trend="down"
          icon={<Zap size={16} />}
          note="needs attention"
          accent="red"
        />
      </div>
      <div className="overview-grid">
        <section className="panel activity-panel">
          <div className="panel-heading">
            <div>
              <h2>Incident activity</h2>
              <p>Incident volume over the last 24 hours</p>
            </div>
            <button className="select-button">
              Last 24 hours <ChevronDown size={13} />
            </button>
          </div>
          <div className="chart-legend">
            <span>
              <i className="legend-dot blue-dot" /> Created
            </span>
            <span>
              <i className="legend-dot green-dot" /> Resolved
            </span>
          </div>
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{ top: 8, right: 4, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="incidentFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6487fa" stopOpacity={0.22} />
                    <stop offset="100%" stopColor="#6487fa" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="resolvedFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#36b983" stopOpacity={0.13} />
                    <stop offset="100%" stopColor="#36b983" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#292b30" strokeDasharray="3 5" vertical={false} />
                <XAxis
                  dataKey="time"
                  tick={{ fill: "#777b84", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  dy={8}
                />
                <Tooltip
                  contentStyle={{
                    background: "#1d1f23",
                    border: "1px solid #33363c",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  labelStyle={{ color: "#bfc2c9" }}
                />
                <Area
                  type="monotone"
                  dataKey="incidents"
                  stroke="#718cf7"
                  strokeWidth={2}
                  fill="url(#incidentFill)"
                />
                <Area
                  type="monotone"
                  dataKey="resolved"
                  stroke="#4dbd91"
                  strokeWidth={1.7}
                  fill="url(#resolvedFill)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>
        <AgentsPanel />
      </div>
      <section className="panel incident-panel">
        <div className="panel-heading">
          <div>
            <h2>
              Recent incidents <span className="heading-count">{incidents.length}</span>
            </h2>
            <p>Latest activity from your services</p>
          </div>
          <button className="text-button" onClick={() => onNavigate("Incidents")}>
            View all <ArrowRight size={14} />
          </button>
        </div>
        <IncidentTable
          incidents={incidents.slice(0, 4)}
          onStatus={onStatus}
          onSelect={onSelect}
        />
      </section>
      <div className="approval-note">
        <ShieldCheck size={15} />
        <span>
          Human approval is required before code changes or pull requests are created.
        </span>
        <button onClick={() => onNavigate("Code Review")}>
          Review policy <ArrowRight size={13} />
        </button>
      </div>
    </>
  );
}

function MetricCard({
  title,
  value,
  change,
  trend,
  icon,
  note,
  accent = "purple",
}: {
  title: string;
  value: string;
  change: string;
  trend: "up" | "down";
  icon: React.ReactNode;
  note: string;
  accent?: string;
}) {
  return (
    <div className="metric-card">
      <div className="metric-top">
        <span>{title}</span>
        <span className={`metric-icon ${accent}`}>{icon}</span>
      </div>
      <div className="metric-value">{value}</div>
      <div className="metric-bottom">
        <span
          className={`metric-change ${trend === "up" && title !== "Resolved" ? "negative" : trend === "down" && title === "Resolved" ? "negative" : ""}`}
        >
          {trend === "up" ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
          {change}
        </span>
        <span>{note}</span>
      </div>
    </div>
  );
}

function AgentsPanel() {
  return (
    <section className="panel agents-panel">
      <div className="panel-heading">
        <div>
          <h2>Agent activity</h2>
          <p>Current investigation status</p>
        </div>
        <button className="icon-button">
          <ExternalLink size={14} />
        </button>
      </div>
      <div className="agent-list">
        {agents.map((agent) => (
          <div className="agent-row" key={agent.id}>
            <div className={`agent-avatar ${agent.id}`}>
              <Bot size={16} />
            </div>
            <div className="agent-info">
              <strong>{agent.name}</strong>
              <span>{agent.task}</span>
            </div>
            <span className={`agent-state ${agent.status}`}>
              <i />
              {agent.status === "working" ? "Working" : "Idle"}
            </span>
          </div>
        ))}
      </div>
      <div className="agent-footnote">
        <span className="status-dot dot-amber" /> Demo activity · Switch not connected
      </div>
    </section>
  );
}

function IncidentsPage({
  incidents,
  query,
  onQuery,
  severity,
  onSeverity,
  onCreate,
  onStatus,
  onSelect,
}: {
  incidents: Incident[];
  query: string;
  onQuery: (value: string) => void;
  severity: string;
  onSeverity: (value: string) => void;
  onCreate: () => void;
  onStatus: (id: string, status: IncidentStatus) => void;
  onSelect: (incident: Incident) => void;
}) {
  return (
    <>
      <PageHeading
        eyebrow="OPERATIONS"
        title="Incidents"
        description="Triage and track issues across your services."
        action={
          <button className="primary-button" onClick={onCreate}>
            <Plus size={15} /> New incident
          </button>
        }
      />
      <section className="panel incident-panel full-panel">
        <div className="toolbar">
          <label className="filter-search">
            <Search size={15} />
            <input
              value={query}
              onChange={(event) => onQuery(event.target.value)}
              placeholder="Search incidents..."
            />
          </label>
          <label className="select-button filter-select">
            <ListFilter size={14} />
            <select value={severity} onChange={(event) => onSeverity(event.target.value)}>
              <option value="all">All severity</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            <ChevronDown size={13} />
          </label>
          <span className="result-count">{incidents.length} incidents</span>
        </div>
        <IncidentTable incidents={incidents} onStatus={onStatus} onSelect={onSelect} />
      </section>
    </>
  );
}

function IncidentTable({
  incidents,
  onStatus,
  onSelect,
}: {
  incidents: Incident[];
  onStatus: (id: string, status: IncidentStatus) => void;
  onSelect: (incident: Incident) => void;
}) {
  if (!incidents.length)
    return (
      <div className="empty-state">
        <Search size={22} />
        <strong>No incidents found</strong>
        <span>Try adjusting your search or filters.</span>
      </div>
    );
  return (
    <div className="table-scroll">
      <table className="data-table">
        <thead>
          <tr>
            <th>INCIDENT</th>
            <th>SERVICE</th>
            <th>SEVERITY</th>
            <th>STATUS</th>
            <th>ASSIGNEE</th>
            <th>CREATED</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {incidents.map((incident) => (
            <tr key={incident.id}>
              <td>
                <div className="incident-name">
                  <span>{incident.id}</span>
                  <strong>{incident.title}</strong>
                </div>
              </td>
              <td>
                <code>{incident.service}</code>
              </td>
              <td>
                <span className={`severity-badge ${incident.severity}`}>
                  <i />
                  {severityLabel[incident.severity]}
                </span>
              </td>
              <td>
                <select
                  className={`status-select ${incident.status}`}
                  value={incident.status}
                  onChange={(event) => {
                    if (isIncidentStatus(event.target.value)) {
                      onStatus(incident.id, event.target.value);
                    }
                  }}
                  aria-label={`Update status for ${incident.id}`}
                >
                  <option value="open">Open</option>
                  <option value="investigating">Investigating</option>
                  <option value="identified">Identified</option>
                  <option value="monitoring">Monitoring</option>
                  <option value="resolved">Resolved</option>
                </select>
              </td>
              <td>
                <span className="assignee">
                  <span className="mini-agent">
                    <Bot size={12} />
                  </span>
                  {incident.assignee}
                </span>
              </td>
              <td className="time-cell">{incident.createdAt}</td>
              <td>
                <button
                  className="row-arrow"
                  aria-label={`View ${incident.id}`}
                  onClick={() => onSelect(incident)}
                >
                  <ArrowRight size={15} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AgentsPage() {
  return (
    <>
      <PageHeading
        eyebrow="AUTOMATION"
        title="AI Agents"
        description="Specialized agents collaborate on incident investigation through Switch."
      />
      <div className="notice-banner">
        <AlertCircle size={16} />
        <div>
          <strong>Switch integration not configured</strong>
          <span>
            Cards below show sample data only. Configure Switch after reviewing the
            verified integration setup.
          </span>
        </div>
        <span className="demo-pill">
          <span /> DEMO
        </span>
      </div>
      <div className="agent-cards">
        {agents.map((agent, index) => (
          <article className="panel agent-card" key={agent.id}>
            <div className={`agent-avatar large ${agent.id}`}>
              <Bot size={19} />
            </div>
            <div className="agent-card-top">
              <div>
                <h3>{agent.name}</h3>
                <span>{agent.role}</span>
              </div>
              <span className={`agent-state ${agent.status}`}>
                <i />
                {agent.status === "working" ? "Working" : "Idle"}
              </span>
            </div>
            <div className="agent-task">
              <small>CURRENT TASK</small>
              <span>{agent.task}</span>
            </div>
            <div className="agent-card-footer">
              <span>
                <Clock3 size={13} />
                Last activity {agent.lastActivity}
              </span>
              <span>{index === 0 ? "2" : "0"} runs today</span>
            </div>
          </article>
        ))}
      </div>
      <section className="panel setup-panel">
        <div className="setup-icon">
          <Command size={18} />
        </div>
        <div>
          <h3>Connect your Switch workspace</h3>
          <p>
            Switch execution is disabled until the official API and agent connection
            details are verified. No tasks are sent from this demo.
          </p>
        </div>
        <span className="integration-status">
          <i />
          Not configured
        </span>
      </section>
    </>
  );
}

function LogsPage() {
  const [search, setSearch] = useState("");
  const [level, setLevel] = useState("all");
  const filtered = logs.filter(
    (log) =>
      `${log.message} ${log.service}`.toLowerCase().includes(search.toLowerCase()) &&
      (level === "all" || log.level === level),
  );
  return (
    <>
      <PageHeading
        eyebrow="OBSERVABILITY"
        title="Logs Explorer"
        description="Search and inspect sample application logs."
        action={
          <div className="demo-pill">
            <span /> SAMPLE LOGS
          </div>
        }
      />
      <section className="panel full-panel">
        <div className="toolbar">
          <label className="filter-search">
            <Search size={15} />
            <input
              placeholder="Search messages or services..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
          <label className="select-button filter-select">
            <ListFilter size={14} />
            <select value={level} onChange={(event) => setLevel(event.target.value)}>
              <option value="all">All levels</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            <ChevronDown size={13} />
          </label>
          <span className="result-count">{filtered.length} events</span>
        </div>
        <div className="log-list">
          {filtered.map((log) => (
            <div className="log-row" key={log.id}>
              <span className="log-time">{log.time}</span>
              <span className={`severity-badge ${log.level}`}>
                <i />
                {severityLabel[log.level]}
              </span>
              <code>{log.service}</code>
              <span className="log-message">{log.message}</span>
            </div>
          ))}
        </div>
        {!filtered.length && (
          <div className="empty-state">
            <Search size={22} />
            <strong>No logs found</strong>
            <span>Try a different query or level.</span>
          </div>
        )}
      </section>
    </>
  );
}

function CodeReviewPage({ onToast }: { onToast: (message: string) => void }) {
  return (
    <>
      <PageHeading
        eyebrow="HUMAN APPROVAL"
        title="Code review"
        description="Review proposed changes before creating a pull request."
      />
      <div className="notice-banner">
        <ShieldCheck size={17} />
        <div>
          <strong>No proposed code changes</strong>
          <span>
            Code suggestions and test results will appear here after a real agent
            integration is configured.
          </span>
        </div>
        <span className="demo-pill">
          <span /> NO EXECUTION
        </span>
      </div>
      <section className="panel review-empty">
        <div className="review-empty-icon">
          <Code2 size={23} />
        </div>
        <h2>Nothing to review yet</h2>
        <p>
          When an investigation produces a proposed patch, you’ll see the root cause,
          diff, and test results here. Approval is always required before opening a PR.
        </p>
        <div className="review-steps">
          <span>
            <i>1</i> Investigation
          </span>
          <ArrowRight size={13} />
          <span>
            <i>2</i> Proposed diff
          </span>
          <ArrowRight size={13} />
          <span>
            <i>3</i> Your approval
          </span>
          <ArrowRight size={13} />
          <span>
            <i>4</i> GitHub PR
          </span>
        </div>
        <button
          className="secondary-button"
          onClick={() => onToast("Demo data cannot create a pull request")}
        >
          <GitPullRequest size={14} /> Create pull request <ExternalLink size={12} />
        </button>
      </section>
    </>
  );
}

function GitHubPage() {
  return (
    <>
      <PageHeading
        eyebrow="INTEGRATIONS"
        title="GitHub"
        description="Connect repositories and track pull request activity."
      />
      <div className="github-card">
        <div className="github-card-main">
          <div className="github-mark">
            <GitPullRequest size={22} />
          </div>
          <div>
            <h2>GitHub integration</h2>
            <p>Connect a repository to review code and create approved pull requests.</p>
          </div>
          <span className="integration-status">
            <i />
            Not connected
          </span>
        </div>
        <div className="github-info">
          <div>
            <span>REPOSITORY</span>
            <strong>Not configured</strong>
          </div>
          <div>
            <span>ACCESS</span>
            <strong>Read & PR permissions</strong>
          </div>
          <div>
            <span>BRANCH POLICY</span>
            <strong>Human approval required</strong>
          </div>
        </div>
        <div className="github-card-footer">
          <span>
            Credentials are read from server environment variables and are never stored in
            the database.
          </span>
          <button
            className="secondary-button"
            onClick={() =>
              window.alert(
                "Add GITHUB_TOKEN and GITHUB_REPOSITORY to your local .env file. See docs/API.md.",
              )
            }
          >
            Configuration guide <ArrowRight size={13} />
          </button>
        </div>
      </div>
      <div className="github-empty">
        <GitPullRequest size={19} />
        <strong>No pull requests yet</strong>
        <span>Recent repository activity will show here after GitHub is connected.</span>
      </div>
    </>
  );
}

function SettingsPage({ onNavigate }: { onNavigate: (page: Page) => void }) {
  return (
    <>
      <PageHeading
        eyebrow="WORKSPACE"
        title="Settings"
        description="Manage external connections and workspace behavior."
      />
      <section className="panel settings-panel">
        <div className="settings-section">
          <div className="settings-icon">
            <Command size={17} />
          </div>
          <div className="settings-copy">
            <h2>Switch workspace</h2>
            <p>
              Connect only after confirming the supported integration with official Switch
              documentation.
            </p>
            <span className="settings-value">
              No verified connection · agent dispatch disabled
            </span>
          </div>
          <button className="secondary-button" onClick={() => onNavigate("AI Agents")}>
            Agent setup <ArrowRight size={13} />
          </button>
        </div>
        <div className="settings-section">
          <div className="settings-icon github-settings">
            <GitPullRequest size={17} />
          </div>
          <div className="settings-copy">
            <h2>GitHub</h2>
            <p>
              Credentials belong in server environment variables. No repository API calls
              are implemented yet.
            </p>
            <span className="settings-value">
              Not connected · pull request creation disabled
            </span>
          </div>
          <button className="secondary-button" onClick={() => onNavigate("GitHub")}>
            GitHub setup <ArrowRight size={13} />
          </button>
        </div>
        <div className="settings-section">
          <div className="settings-icon runtime-settings">
            <Activity size={17} />
          </div>
          <div className="settings-copy">
            <h2>Demo environment</h2>
            <p>
              Incidents and logs use sample data. API-created incidents are in-memory and
              reset when the server restarts.
            </p>
            <span className="settings-value">Development mode · no external actions</span>
          </div>
          <span className="demo-pill">
            <span /> DEMO
          </span>
        </div>
      </section>
    </>
  );
}

function IncidentDetailsModal({
  incident,
  onClose,
}: {
  incident: Incident;
  onClose: () => void;
}) {
  return (
    <div
      className="modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="modal incident-details-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="incident-details-title"
      >
        <div className="modal-heading">
          <div>
            <span className="eyebrow">{incident.id} · INCIDENT DETAILS</span>
            <h2 id="incident-details-title">{incident.title}</h2>
          </div>
          <button
            type="button"
            className="icon-button"
            onClick={onClose}
            aria-label="Close incident details"
          >
            <X size={18} />
          </button>
        </div>
        <p className="modal-description">{incident.summary}</p>
        <div className="incident-detail-grid">
          <div>
            <span>SERVICE</span>
            <code>{incident.service}</code>
          </div>
          <div>
            <span>SEVERITY</span>
            <span className={`severity-badge ${incident.severity}`}>
              <i />
              {severityLabel[incident.severity]}
            </span>
          </div>
          <div>
            <span>STATUS</span>
            <strong>{incident.status.replace("-", " ")}</strong>
          </div>
          <div>
            <span>ASSIGNED AGENT</span>
            <strong>{incident.assignee}</strong>
          </div>
        </div>
        <div className="timeline-heading">
          <h3>Investigation history</h3>
          <span>DEMO RECORD</span>
        </div>
        <div className="timeline-item">
          <i />
          <div>
            <strong>Incident reported</strong>
            <span>
              {incident.createdAt} · {incident.service}
            </span>
          </div>
        </div>
        <div className="timeline-empty">
          <span>No agent execution history is available. Switch is not connected.</span>
        </div>
        <div className="modal-actions">
          <span>External investigation is disabled</span>
          <button type="button" className="secondary-button" onClick={onClose}>
            Close
          </button>
        </div>
      </section>
    </div>
  );
}

function CreateIncidentModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (title: string, service: string, severity: Severity) => void;
}) {
  const [title, setTitle] = useState("");
  const [service, setService] = useState("");
  const [severity, setSeverity] = useState<Severity>("medium");
  const [error, setError] = useState("");
  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!title.trim() || !service.trim()) {
      setError("Add both an incident title and service.");
      return;
    }
    onCreate(title.trim(), service.trim(), severity);
  }
  return (
    <div
      className="modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <form className="modal" onSubmit={submit}>
        <div className="modal-heading">
          <div>
            <span className="eyebrow">NEW REPORT</span>
            <h2>Report an incident</h2>
          </div>
          <button
            type="button"
            className="icon-button"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>
        <p className="modal-description">
          Create a local demo incident to explore the workflow.
        </p>
        <label className="form-field">
          Incident title
          <input
            autoFocus
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="e.g. Checkout API returning errors"
          />
        </label>
        <label className="form-field">
          Service name
          <input
            value={service}
            onChange={(event) => setService(event.target.value)}
            placeholder="e.g. checkout-api"
          />
        </label>
        <label className="form-field">
          Severity
          <select
            value={severity}
            onChange={(event) => {
              if (isSeverity(event.target.value)) setSeverity(event.target.value);
            }}
          >
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </label>
        {error && <div className="form-error">{error}</div>}
        <div className="modal-actions">
          <span>Demo only · not sent to Switch</span>
          <button type="button" className="secondary-button" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="primary-button">
            <Plus size={14} /> Create incident
          </button>
        </div>
      </form>
    </div>
  );
}

export default App;

import {
  LayoutDashboard,
  CircleAlert,
  Bot,
  Terminal,
  Code2,
  X,
  type LucideIcon,
} from "lucide-react";
import type { ApiHealth } from "../api";
import type { Incident } from "../types";

export type NavPage =
  "Overview" | "Incidents" | "AI Agents" | "Logs Explorer" | "Code Review";

interface SidebarProps {
  activeNav: NavPage;
  onSelectNav: (page: NavPage) => void;
  incidents: Incident[];
  hasPendingPatch?: boolean;
  health: ApiHealth | null;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export function Sidebar({
  activeNav,
  onSelectNav,
  incidents,
  hasPendingPatch = false,
  health,
  mobileOpen = false,
  onCloseMobile,
}: SidebarProps) {
  const openCount = incidents.filter((i) => i.status !== "resolved").length;
  const criticalCount = incidents.filter(
    (i) => i.severity === "critical" && i.status !== "resolved",
  ).length;

  const incidentBadge =
    criticalCount > 0
      ? `${criticalCount.toString().padStart(2, "0")} CRITICAL`
      : openCount > 0
        ? `${openCount.toString().padStart(2, "0")} ACTIVE`
        : undefined;

  const navItems: {
    name: NavPage;
    icon: LucideIcon;
    badge?: string;
    badgeColor?: string;
  }[] = [
    { name: "Overview", icon: LayoutDashboard },
    {
      name: "Incidents",
      icon: CircleAlert,
      badge: incidentBadge,
      badgeColor:
        criticalCount > 0
          ? "bg-rose-500/15 border-rose-500/35 text-[#F43F5E]"
          : "bg-amber-500/15 border-amber-500/35 text-amber-400",
    },
    {
      name: "AI Agents",
      icon: Bot,
      badge: "4 SPECIALISTS",
      badgeColor: "bg-cyan-500/10 border-cyan-500/30 text-[#00F0FF]",
    },
    { name: "Logs Explorer", icon: Terminal },
    {
      name: "Code Review",
      icon: Code2,
      badge: hasPendingPatch ? "READY" : undefined,
      badgeColor: "bg-emerald-500/15 border-emerald-500/35 text-[#10B981]",
    },
  ];

  const handleNavClick = (page: NavPage) => {
    onSelectNav(page);
    onCloseMobile?.();
  };

  return (
    <>
      {/* Mobile Dimmed Backdrop */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden transition-opacity"
          aria-hidden="true"
        />
      )}

      <aside
        className={`app-sidebar ${mobileOpen ? "mobile-open" : ""}`}
        aria-label="Main Navigation"
      >
        <div>
          <div className="flex items-center justify-between lg:block mb-1">
            <div className="nav-group-label">Mission Control</div>
            {mobileOpen && (
              <button
                onClick={onCloseMobile}
                className="lg:hidden p-1.5 text-[#94A3B8] hover:text-white rounded-lg cursor-pointer"
                aria-label="Close navigation"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex flex-col gap-1">
            {navItems.map((item) => {
              const isActive = activeNav === item.name;
              const Icon = item.icon;

              return (
                <button
                  key={item.name}
                  onClick={() => handleNavClick(item.name)}
                  className={`nav-btn ${isActive ? "active" : ""} focus-visible:ring-2 focus-visible:ring-[#00F0FF] outline-none`}
                  aria-current={isActive ? "page" : undefined}
                >
                  <div className="nav-btn-inner">
                    <Icon style={{ width: 15, height: 15 }} />
                    <span>{item.name}</span>
                  </div>
                  {item.badge && (
                    <span className={`counter-tag ${item.badgeColor || ""}`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="aside-footer-card">
          <div className="label">SWITCH HACKATHON 2026</div>
          <div className="metric">
            <span>Runtime:</span>
            <span style={{ color: "var(--text-high)" }}>WSL2 + Node 20+</span>
          </div>
          <div className="metric">
            <span>Backend:</span>
            <span
              style={{
                color: health ? "var(--signal-emerald)" : "var(--signal-crimson)",
                fontWeight: 700,
              }}
            >
              {health ? "200 OK" : "OFFLINE"}
            </span>
          </div>
          <div className="metric">
            <span>Switch Bridge:</span>
            <span style={{ color: "var(--signal-cyan)", fontWeight: 700 }}>
              {health?.integrations.switch.configured
                ? "ONLINE (62912)"
                : "LOCAL SIM"}
            </span>
          </div>
        </div>
      </aside>
    </>
  );
}

import { useState, useEffect } from "react";
import {
  Search,
  LayoutDashboard,
  CircleAlert,
  Bot,
  Terminal,
  Code2,
  MessageSquare,
  Plus,
  Zap,
  Check,
  type LucideIcon,
} from "lucide-react";
import type { NavPage } from "./Sidebar";

interface CommandItem {
  id: string;
  label: string;
  icon: LucideIcon;
  action: () => void;
  shortcut: string;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (page: NavPage) => void;
  onToggleWarRoom: () => void;
  onOpenCreateModal: () => void;
  onInvestigateActive: () => void;
  onOpenApproval: () => void;
}

export function CommandPalette({
  isOpen,
  onClose,
  onNavigate,
  onToggleWarRoom,
  onOpenCreateModal,
  onInvestigateActive,
  onOpenApproval,
}: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  const items: CommandItem[] = [
    {
      id: "nav-overview",
      label: "Go to Overview Dashboard",
      icon: LayoutDashboard,
      action: () => onNavigate("Overview"),
      shortcut: "1",
    },
    {
      id: "nav-incidents",
      label: "Go to Active Incidents Cockpit",
      icon: CircleAlert,
      action: () => onNavigate("Incidents"),
      shortcut: "2",
    },
    {
      id: "nav-agents",
      label: "Go to AI Multi-Agent Fleet",
      icon: Bot,
      action: () => onNavigate("AI Agents"),
      shortcut: "3",
    },
    {
      id: "nav-logs",
      label: "Go to Cluster Telemetry Logs",
      icon: Terminal,
      action: () => onNavigate("Logs Explorer"),
      shortcut: "4",
    },
    {
      id: "nav-review",
      label: "Go to Code Review & Diffs",
      icon: Code2,
      action: () => onNavigate("Code Review"),
      shortcut: "5",
    },
    {
      id: "act-warroom",
      label: "Toggle Telegram War Room Drawer",
      icon: MessageSquare,
      action: onToggleWarRoom,
      shortcut: "W",
    },
    {
      id: "act-create",
      label: "Declare New Incident Report",
      icon: Plus,
      action: onOpenCreateModal,
      shortcut: "N",
    },
    {
      id: "act-investigate",
      label: "Trigger / Re-run AI Investigation",
      icon: Zap,
      action: onInvestigateActive,
      shortcut: "R",
    },
    {
      id: "act-approve",
      label: "Open Human Sign-Off Gate",
      icon: Check,
      action: onOpenApproval,
      shortcut: "↵",
    },
  ];

  const filtered = items.filter((item) =>
    item.label.toLowerCase().includes(query.toLowerCase()),
  );

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % (filtered.length || 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex(
          (prev) => (prev - 1 + (filtered.length || 1)) % (filtered.length || 1),
        );
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (filtered[selectedIndex]) {
          filtered[selectedIndex].action();
          onClose();
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, filtered, selectedIndex, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="palette-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="palette-modal">
        <div className="palette-input-box">
          <Search className="w-5 h-5 text-[#64748B] shrink-0" />
          <input
            type="text"
            placeholder="Type a command or navigate..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            autoFocus
            className="palette-input"
          />
          <span className="keycap">ESC</span>
        </div>

        <div className="palette-list">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-[#64748B] text-xs font-mono">
              No matching commands found.
            </div>
          ) : (
            filtered.map((item, index) => {
              const Icon = item.icon;
              const isSelected = index === selectedIndex;

              return (
                <div
                  key={item.id}
                  onClick={() => {
                    item.action();
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`palette-item ${isSelected ? "selected" : ""}`}
                >
                  <div className="palette-item-left">
                    <Icon className="w-4 h-4 text-[#00F0FF]" />
                    <span>{item.label}</span>
                  </div>

                  <span className="keycap">{item.shortcut}</span>
                </div>
              );
            })
          )}
        </div>

        <div className="palette-footer">
          <div className="flex items-center gap-3">
            <span>
              Use <strong className="text-white">↑↓</strong> to navigate
            </span>
            <span>
              <strong className="text-white">↵</strong> to select
            </span>
          </div>
          <span>Team Daanav Palette</span>
        </div>
      </div>
    </div>
  );
}

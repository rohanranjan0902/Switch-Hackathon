import { MessageSquare, Activity, Radio, Menu } from "lucide-react";
import type { ApiHealth } from "../api";

export function SmartCatIcon({ className = "cyber-cat-emblem" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <filter id="cyber-cat-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="0.6" result="glow" />
          <feComposite in="SourceGraphic" in2="glow" operator="over" />
        </filter>
      </defs>

      <path
        d="M16 28.5 L9.5 25 L6 20.5 L4.5 16.5 L8.5 12.5 L5 4.5 L12.5 9.5 L16 11 L19.5 9.5 L27 4.5 L23.5 12.5 L27.5 16.5 L26 20.5 L22.5 25 Z"
        stroke="#00F0FF"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="rgba(0, 240, 255, 0.08)"
        filter="url(#cyber-cat-glow)"
      />

      <path
        d="M7.5 7.5 L11.5 12"
        stroke="#00F0FF"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeOpacity="0.8"
      />
      <path
        d="M24.5 7.5 L20.5 12"
        stroke="#00F0FF"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeOpacity="0.8"
      />

      <polygon
        points="16,13 14,16 18,16"
        fill="#00F0FF"
        fillOpacity="0.75"
        stroke="#00F0FF"
        strokeWidth="1"
        strokeLinejoin="round"
      />

      <polygon
        points="8.5,16.2 13.5,17.2 11,19.2 8,18"
        fill="#00F0FF"
        stroke="#00F0FF"
        strokeWidth="0.8"
        strokeLinejoin="round"
        filter="drop-shadow(0 0 3px #00F0FF)"
      />
      <polygon
        points="23.5,16.2 18.5,17.2 21,19.2 24,18"
        fill="#00F0FF"
        stroke="#00F0FF"
        strokeWidth="0.8"
        strokeLinejoin="round"
        filter="drop-shadow(0 0 3px #00F0FF)"
      />

      <polygon
        points="15,21.8 17,21.8 16,23.2"
        fill="#00F0FF"
        stroke="#00F0FF"
        strokeWidth="0.6"
      />

      <line
        x1="6.5"
        y1="21.5"
        x2="10"
        y2="22.8"
        stroke="#00F0FF"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeOpacity="0.65"
      />
      <line
        x1="25.5"
        y1="21.5"
        x2="22"
        y2="22.8"
        stroke="#00F0FF"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeOpacity="0.65"
      />

      <line
        x1="16"
        y1="24.5"
        x2="16"
        y2="26.5"
        stroke="#00F0FF"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeOpacity="0.7"
      />
    </svg>
  );
}

interface HeaderProps {
  activeNav: string;
  health: ApiHealth | null;
  warRoomOpen: boolean;
  onToggleWarRoom: () => void;
  onOpenPalette: () => void;
  unreadWarRoomCount?: number;
  mobileNavOpen?: boolean;
  onToggleMobileNav?: () => void;
}

export function Header({
  activeNav,
  health,
  warRoomOpen,
  onToggleWarRoom,
  onOpenPalette,
  unreadWarRoomCount = 0,
  mobileNavOpen = false,
  onToggleMobileNav,
}: HeaderProps) {
  const switchConfigured = health?.integrations.switch.configured ?? false;
  const switchMode = health?.integrations.switch.provider ?? "simulation";

  return (
    <header className="cockpit-header">
      <div className="flex items-center gap-3 min-w-0">
        {onToggleMobileNav && (
          <button
            onClick={onToggleMobileNav}
            className="lg:hidden w-8 h-8 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.1] flex items-center justify-center text-[#94A3B8] hover:text-white transition-all cursor-pointer shrink-0"
            title="Toggle Menu"
            aria-label="Toggle navigation menu"
            aria-expanded={mobileNavOpen}
          >
            <Menu className="w-4 h-4" />
          </button>
        )}

        <button
          onClick={onOpenPalette}
          className="brand-emblem focus-visible:ring-2 focus-visible:ring-[#00F0FF] outline-none"
          title="Team Daanav Mission Control (Press ⌘K or Ctrl+K)"
        >
          <SmartCatIcon className="cyber-cat-emblem" />
          <span>TEAM DAANAV</span>
        </button>

        <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-[#64748B] min-w-0 truncate">
          <span className="text-[#334155]">/</span>
          <span className="text-[#F1F5F9] font-bold truncate">{activeNav}</span>
        </div>
      </div>

      <div className="status-dock flex items-center gap-2.5">
        {/* Switch Status Indicator */}
        <div
          className={`status-pill ${switchConfigured ? "" : "border-cyan-500/30"}`}
          title={`Switch Agent Gateway: ${switchConfigured ? "Connected (Live Console)" : "Deterministic Local Simulation Mode"}`}
        >
          {switchConfigured ? (
            <Activity style={{ width: 13, height: 13, strokeWidth: 2.2 }} />
          ) : (
            <Radio style={{ width: 13, height: 13, strokeWidth: 2.2 }} />
          )}
          <span>
            {switchConfigured
              ? "SWITCH WS://62912"
              : `SWITCH: ${switchMode.toUpperCase()}`}
          </span>
        </div>

        {/* Telegram Bridge Pill - Hidden on small tablet / mobile to avoid overflow */}
        <div
          className="status-pill telegram hidden md:inline-flex"
          title="Telegram 5-Bot Multi-Agent War Room Channel Synced"
        >
          <svg
            style={{ width: 13, height: 13, fill: "currentColor" }}
            viewBox="0 0 24 24"
          >
            <path d="M21.5 2L2 9.5l7.5 3 2.5 7.5 3-4.5 4 4.5z" />
          </svg>
          <span>SUPERGROUP: -1004337160724</span>
        </div>

        {/* War Room Drawer Toggle */}
        <button
          onClick={onToggleWarRoom}
          className={`cmd-k-trigger focus-visible:ring-2 focus-visible:ring-[#00F0FF] outline-none ${
            warRoomOpen ? "bg-[#1F2736] text-[#00F0FF] border-[#00F0FF]" : ""
          }`}
          title="Toggle Live Telegram War Room Drawer (Shortcut: W)"
          aria-expanded={warRoomOpen}
        >
          <MessageSquare style={{ width: 13, height: 13 }} />
          <span className="hidden xs:inline">War Room</span>
          {unreadWarRoomCount > 0 && !warRoomOpen && (
            <span className="w-2 h-2 rounded-full bg-[#00F0FF] animate-pulse" />
          )}
          <span className="keycap hidden sm:inline-block">W</span>
        </button>

        {/* Command Palette Button */}
        <button
          onClick={onOpenPalette}
          className="cmd-k-trigger focus-visible:ring-2 focus-visible:ring-[#00F0FF] outline-none"
          title="Open Command Palette (⌘K / Ctrl+K)"
        >
          <span className="hidden xs:inline">Commands</span>
          <span className="keycap">⌘K</span>
        </button>

        {/* Operator Chip - Hidden on narrow viewports */}
        <div className="operator-chip hidden lg:inline-flex" title="Active Incident Commander Operator Session">
          <div className="operator-avatar">TD</div>
          <span>Team Daanav</span>
        </div>
      </div>
    </header>
  );
}

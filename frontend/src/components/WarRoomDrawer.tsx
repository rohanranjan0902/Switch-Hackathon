import { useEffect, useRef, useState } from "react";
import {
  X,
  Send,
  Bot,
  Search,
  Zap,
  ShieldCheck,
  Radio,
  User,
  Sparkles,
  CornerDownLeft,
} from "lucide-react";

export interface WarRoomMessage {
  id: string;
  sender: string;
  senderRole: "mgr" | "log" | "fix" | "test" | "orch" | "operator";
  time: string;
  text: string;
}

interface WarRoomDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  messages: WarRoomMessage[];
  onSendMessage: (text: string) => void;
}

export function WarRoomDrawer({
  isOpen,
  onClose,
  messages,
  onSendMessage,
}: WarRoomDrawerProps) {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const bottomAnchorRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
      bottomAnchorRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;
    onSendMessage(trimmed);
    setInput("");
  };

  const handleQuickAction = (cmd: string) => {
    onSendMessage(cmd);
    setInput("");
  };

  const getRoleConfig = (role: WarRoomMessage["senderRole"]) => {
    switch (role) {
      case "mgr":
        return {
          color: "#C084FC",
          bgTint: "bg-purple-500/10 border-l-purple-500",
          badgeBg: "bg-purple-500/20 text-purple-200 border-purple-500/40",
          icon: Bot,
          label: "Incident Manager",
        };
      case "log":
        return {
          color: "#FBBF24",
          bgTint: "bg-amber-500/10 border-l-amber-500",
          badgeBg: "bg-amber-500/20 text-amber-200 border-amber-500/40",
          icon: Search,
          label: "Log Analyzer",
        };
      case "fix":
        return {
          color: "#00F0FF",
          bgTint: "bg-cyan-500/10 border-l-[#00F0FF]",
          badgeBg: "bg-cyan-500/20 text-cyan-200 border-cyan-500/40",
          icon: Zap,
          label: "Code Fixer",
        };
      case "test":
        return {
          color: "#10B981",
          bgTint: "bg-emerald-500/10 border-l-[#10B981]",
          badgeBg: "bg-emerald-500/20 text-emerald-200 border-emerald-500/40",
          icon: ShieldCheck,
          label: "Testing Agent",
        };
      case "orch":
        return {
          color: "#60A5FA",
          bgTint: "bg-blue-500/10 border-l-blue-400",
          badgeBg: "bg-blue-500/20 text-blue-200 border-blue-500/40",
          icon: Radio,
          label: "Squad Orchestrator",
        };
      default:
        return {
          color: "#38BDF8",
          bgTint: "bg-sky-500/10 border-l-sky-400",
          badgeBg: "bg-sky-500/20 text-sky-200 border-sky-500/40",
          icon: User,
          label: "Human Operator",
        };
    }
  };

  const cleanMessageText = (text: string) => {
    if (!text) return "";
    return text.replace(
      /^\[(?:INCIDENT MANAGER|LOG ANALYZER|CODE FIXER|TESTING AGENT|ORCHESTRATOR)\]\s*/i,
      "",
    );
  };

  const quickPrompts = [
    { label: "/status", cmd: "/status", hint: "Show squad status" },
    {
      label: "/investigate INC-2847",
      cmd: "/investigate INC-2847",
      hint: "Run multi-agent triage",
    },
    {
      label: "Ping Testing Agent",
      cmd: "@testing_agent status report requested",
      hint: "Check regression suite",
    },
    { label: "Fix Summary", cmd: "show patch diff summary", hint: "Review code fix" },
  ];

  return (
    <>
      {/* Dimmed Backdrop */}
      <div
        onClick={onClose}
        className={`war-room-backdrop fixed inset-0 z-[80] bg-black/65 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        aria-hidden="true"
      />

      {/* Slide-over Drawer */}
      <aside
        className={`war-room-drawer ${isOpen ? "open" : ""}`}
        aria-label="Telegram War Room Channel Drawer"
        aria-hidden={!isOpen}
      >
        {/* Top Header */}
        <div className="h-[60px] px-6 border-b border-white/[0.08] bg-[#0A0D15] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/15 border border-cyan-500/35 flex items-center justify-center text-[#00F0FF] shadow-sm shrink-0">
              <svg
                style={{ width: 16, height: 16, fill: "currentColor" }}
                viewBox="0 0 24 24"
              >
                <path d="M21.5 2L2 9.5l7.5 3 2.5 7.5 3-4.5 4 4.5z" />
              </svg>
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-xs uppercase tracking-wider text-white truncate">
                  Telegram War Room
                </h3>
                <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse shrink-0" />
              </div>

              <div className="flex items-center gap-2 mt-0.5">
                <span className="font-mono text-[10px] text-[#00F0FF] bg-cyan-500/10 px-1.5 py-0.2 rounded border border-cyan-500/30">
                  -1004337160724
                </span>
                <span className="text-[10.5px] text-[#94A3B8] font-mono">
                  5 Bots Synced
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <span className="keycap hidden sm:inline-block">ESC</span>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.1] flex items-center justify-center text-[#94A3B8] hover:text-white transition-all cursor-pointer"
              title="Close War Room Drawer"
              aria-label="Close War Room Drawer"
            >
              <X style={{ width: 16, height: 16 }} />
            </button>
          </div>
        </div>

        {/* Message Feed */}
        <div
          ref={scrollRef}
          className="chat-scroll-canvas flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col gap-3.5 select-text"
        >
          {messages.length === 0 ? (
            <div className="p-10 text-center text-[#64748B] text-xs flex flex-col items-center gap-3 my-auto">
              <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-[#475569]">
                <Bot className="w-6 h-6" />
              </div>
              <span className="font-semibold text-white">No war room messages yet</span>
              <span className="text-xs text-[#64748B] max-w-xs leading-relaxed">
                Type <code className="text-[#00F0FF]">/status</code> or click a quick
                prompt below to interact with the autonomous squad.
              </span>
            </div>
          ) : (
            messages.map((m) => {
              const roleInfo = getRoleConfig(m.senderRole);
              const RoleIcon = roleInfo.icon;
              const cleanedText = cleanMessageText(m.text);

              return (
                <div
                  key={m.id}
                  className={`message-bubble bg-[#0D111A] border border-white/[0.08] border-l-4 rounded-xl shadow-lg transition-all ${roleInfo.bgTint}`}
                >
                  <div className="bubble-meta mb-2.5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className="w-6 h-6 rounded-md flex items-center justify-center shrink-0 border border-white/[0.08]"
                        style={{
                          color: roleInfo.color,
                          backgroundColor: `${roleInfo.color}1c`,
                        }}
                      >
                        <RoleIcon className="w-3.5 h-3.5" />
                      </div>

                      <span
                        className="sender-handle font-mono text-xs font-bold truncate"
                        style={{ color: roleInfo.color }}
                      >
                        {m.sender}
                      </span>

                      <span
                        className={`text-[9.5px] font-mono px-1.5 py-0.5 rounded border font-semibold shrink-0 ${roleInfo.badgeBg}`}
                      >
                        {roleInfo.label}
                      </span>
                    </div>

                    <span className="msg-timestamp text-[10px] text-[#64748B] font-mono shrink-0">
                      {m.time}
                    </span>
                  </div>

                  <div className="bubble-content text-xs text-[#F1F5F9] leading-relaxed break-words font-mono whitespace-pre-wrap pl-8">
                    {cleanedText}
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomAnchorRef} />
        </div>

        {/* Quick action chips */}
        <div className="px-4 sm:px-6 py-2.5 bg-[#0A0D15] border-t border-white/[0.06] flex items-center gap-2 overflow-x-auto shrink-0">
          <div className="flex items-center gap-1.5 text-xs text-[#00F0FF] font-mono shrink-0 uppercase tracking-wider font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Quick:</span>
          </div>
          {quickPrompts.map((p) => (
            <button
              key={p.label}
              onClick={() => handleQuickAction(p.cmd)}
              title={p.hint}
              className="text-xs font-mono px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.09] border border-white/[0.08] hover:border-[#00F0FF]/40 text-[#94A3B8] hover:text-[#00F0FF] transition-all whitespace-nowrap cursor-pointer shrink-0 flex items-center gap-1.5"
            >
              <span>{p.label}</span>
              <CornerDownLeft className="w-3 h-3 opacity-60" />
            </button>
          ))}
        </div>

        {/* Send message form */}
        <form
          onSubmit={handleSubmit}
          className="p-4 sm:p-5 px-4 sm:px-6 bg-[#080A10] border-t border-white/[0.08] flex flex-col gap-2 shrink-0"
        >
          <div className="flex items-center gap-2.5">
            <input
              type="text"
              placeholder="Type /status, /investigate, or message the squad..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 bg-[#121622] border border-white/[0.12] focus:border-[#00F0FF] rounded-xl px-3.5 h-[42px] text-xs text-white placeholder:text-[#64748B] outline-none font-mono transition-colors focus:ring-1 focus:ring-[#00F0FF]"
            />
            <button
              type="submit"
              className="btn-mechanical primary-cta text-xs h-[42px] px-4 flex items-center gap-2 shrink-0 rounded-xl"
            >
              <Send style={{ width: 14, height: 14 }} />
              <span>Send</span>
            </button>
          </div>

          <div className="flex items-center justify-between text-[10.5px] text-[#475569] font-mono px-1">
            <span>Press Enter to broadcast instruction</span>
            <span>Channel: #incident-war-room</span>
          </div>
        </form>
      </aside>
    </>
  );
}

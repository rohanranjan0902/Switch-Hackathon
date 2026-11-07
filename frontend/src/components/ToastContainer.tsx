import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from "lucide-react";
import type { ToastNotification } from "../types";

interface ToastProps {
  toasts: ToastNotification[];
  onDismiss: (id: string) => void;
}

export function ToastContainer({ toasts, onDismiss }: ToastProps) {
  if (toasts.length === 0) return null;

  return (
    <div
      role="region"
      aria-label="System notifications"
      className="fixed bottom-16 sm:bottom-6 right-4 sm:right-6 z-[95] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none"
    >
      {toasts.map((toast) => {
        const isSuccess = toast.type === "success";
        const isError = toast.type === "error";
        const isWarning = toast.type === "warning";

        const borderColor = isSuccess
          ? "border-emerald-500/40 bg-[#0A1612]"
          : isError
            ? "border-rose-500/40 bg-[#160A0D]"
            : isWarning
              ? "border-amber-500/40 bg-[#17130A]"
              : "border-cyan-500/40 bg-[#0A1318]";

        const iconColor = isSuccess
          ? "text-emerald-400"
          : isError
            ? "text-rose-400"
            : isWarning
              ? "text-amber-400"
              : "text-cyan-400";

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border shadow-2xl backdrop-blur-md transition-all duration-200 animate-in fade-in slide-in-from-bottom-2 ${borderColor}`}
          >
            <div className={`mt-0.5 shrink-0 ${iconColor}`}>
              {isSuccess && <CheckCircle2 className="w-4 h-4" />}
              {isError && <AlertCircle className="w-4 h-4" />}
              {isWarning && <AlertTriangle className="w-4 h-4" />}
              {!isSuccess && !isError && !isWarning && <Info className="w-4 h-4" />}
            </div>

            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-white font-sans">
                {toast.title}
              </div>
              {toast.message && (
                <div className="text-[11px] text-[#94A3B8] font-mono mt-0.5 leading-snug break-words">
                  {toast.message}
                </div>
              )}
            </div>

            <button
              onClick={() => onDismiss(toast.id)}
              className="text-[#64748B] hover:text-white transition-colors p-0.5 -mr-1 -mt-1 cursor-pointer"
              aria-label="Dismiss notification"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

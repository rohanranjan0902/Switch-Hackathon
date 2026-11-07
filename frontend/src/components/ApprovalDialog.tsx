import { useState } from "react";
import { Check, X, ShieldAlert, ShieldCheck, FileCode } from "lucide-react";
import type { ExecutionRecord, Incident } from "../types";

interface ApprovalDialogProps {
  incident: Incident;
  execution: ExecutionRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onApprove: (reviewer: string, note?: string) => Promise<void>;
  onReject: (reviewer: string, note?: string) => Promise<void>;
}

export function ApprovalDialog({
  incident,
  execution,
  isOpen,
  onClose,
  onApprove,
  onReject,
}: ApprovalDialogProps) {
  const [reviewer, setReviewer] = useState("Incident Commander");
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const testPassed =
    execution?.testExecution?.status === "SUCCEEDED" ||
    execution?.report?.testVerification?.status === "PASSED";

  const passCount =
    execution?.testExecution?.passedCount ??
    execution?.report?.testVerification?.passedCount ??
    2;

  const totalCount =
    (execution?.testExecution?.passedCount ?? 2) +
    (execution?.testExecution?.failedCount ?? 0);

  const targetFile =
    execution?.report?.codeFix?.targetFile ?? "sample-app/src/checkout.ts";

  const handleAction = async (action: "approve" | "reject") => {
    setIsSubmitting(true);
    try {
      if (action === "approve") {
        await onApprove(
          reviewer.trim() || "Incident Commander",
          note.trim() || undefined,
        );
      } else {
        await onReject(
          reviewer.trim() || "Incident Commander",
          note.trim() || "Rejected by human reviewer",
        );
      }
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="approval-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose();
      }}
      className="fixed inset-0 z-[100] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
    >
      <div className="w-[520px] max-w-full bg-[#0D111A] border border-white/[0.15] rounded-[14px] shadow-2xl p-6 flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-3.5">
          <div className="flex items-center gap-3">
            <div className="w-[38px] h-[38px] rounded-xl bg-emerald-500/15 border border-emerald-500/35 flex items-center justify-center text-[#10B981] shadow-sm shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 id="approval-modal-title" className="text-base font-bold text-white">
                Human Sign-Off Gate
              </h3>
              <span className="text-xs font-mono text-[#00F0FF]">{incident.id}</span>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="w-8 h-8 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] flex items-center justify-center text-[#64748B] hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Verification Evidence Card */}
        <div className="flex flex-col gap-2.5 bg-[#080A0F] border border-white/[0.08] rounded-xl p-4 font-mono text-xs shadow-inner">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-white min-w-0">
              <FileCode className="w-4 h-4 text-[#00F0FF] shrink-0" />
              <span className="font-semibold truncate">{targetFile}</span>
            </div>
            <span
              className={`px-2 py-0.5 rounded-md text-[10px] font-bold shrink-0 ${
                testPassed
                  ? "bg-emerald-500/15 border border-emerald-500/30 text-[#10B981]"
                  : "bg-rose-500/15 border border-rose-500/30 text-rose-400"
              }`}
            >
              {testPassed ? `TESTS PASSED (${passCount}/${totalCount})` : "TESTS FAILED"}
            </span>
          </div>

          <p className="text-xs text-[#94A3B8] font-sans leading-relaxed">
            {execution?.codeChange?.summary ||
              execution?.report?.codeFix?.summary ||
              "Verified bug fix with isolated regression test assertions."}
          </p>
        </div>

        {/* Form fields */}
        <div className="flex flex-col gap-4 font-sans text-xs">
          <div>
            <label className="text-[#94A3B8] block mb-1.5 font-mono text-xs uppercase tracking-wider font-semibold">
              Authorized Reviewer
            </label>
            <input
              type="text"
              value={reviewer}
              onChange={(e) => setReviewer(e.target.value)}
              disabled={isSubmitting}
              className="w-full bg-[#141A26] border border-white/[0.12] rounded-xl px-4 h-[42px] text-white font-mono text-xs outline-none focus:border-[#00F0FF] focus:ring-1 focus:ring-[#00F0FF]"
              placeholder="e.g. Incident Commander"
            />
          </div>

          <div>
            <label className="text-[#94A3B8] block mb-1.5 font-mono text-xs uppercase tracking-wider font-semibold">
              Decision Note (Optional)
            </label>
            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              disabled={isSubmitting}
              placeholder="e.g. Patch reviewed; regression suite validated in isolated sandbox worktree."
              className="w-full bg-[#141A26] border border-white/[0.12] rounded-xl p-3 text-white font-mono text-xs outline-none focus:border-[#00F0FF] focus:ring-1 focus:ring-[#00F0FF] resize-none"
            />
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-between pt-3.5 border-t border-white/[0.08]">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="btn-mechanical text-xs h-[38px] px-4 rounded-xl"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => void handleAction("reject")}
              disabled={isSubmitting}
              className="px-4 h-[38px] rounded-xl border border-rose-500/40 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Reject Proposal</span>
            </button>

            <button
              type="button"
              onClick={() => void handleAction("approve")}
              disabled={isSubmitting}
              className="btn-mechanical primary-cta text-xs h-[38px] px-4.5 flex items-center gap-2 rounded-xl"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>{isSubmitting ? "Signing off..." : "Approve & Mark Resolved"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

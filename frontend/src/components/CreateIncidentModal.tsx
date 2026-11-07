import { useState } from "react";
import { X, Plus, AlertCircle } from "lucide-react";
import type { Severity } from "../types";

interface CreateIncidentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    service: string;
    severity: Severity;
    description?: string;
  }) => Promise<void>;
}

export function CreateIncidentModal({
  isOpen,
  onClose,
  onSubmit,
}: CreateIncidentModalProps) {
  const [title, setTitle] = useState("");
  const [service, setService] = useState("checkout-api");
  const [severity, setSeverity] = useState<Severity>("critical");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim().length < 5) {
      setError("Title must be at least 5 characters long.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        title: title.trim(),
        service,
        severity,
        description: description.trim() || undefined,
      });
      setTitle("");
      setDescription("");
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create incident");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-incident-title"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose();
      }}
      className="fixed inset-0 z-[100] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
    >
      <div className="w-[500px] max-w-full bg-[#0E121B] border border-white/[0.18] rounded-[14px] shadow-2xl p-6 flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-3.5">
          <h3
            id="create-incident-title"
            className="text-base font-bold text-white flex items-center gap-2.5"
          >
            <Plus className="w-4 h-4 text-[#00F0FF]" />
            <span>Declare New Incident Outage</span>
          </h3>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="w-8 h-8 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] flex items-center justify-center text-[#64748B] hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-mono">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 font-mono text-xs">
          <div>
            <label className="text-[#94A3B8] block mb-1.5 font-semibold text-xs">
              Incident Title *
            </label>
            <input
              type="text"
              required
              minLength={5}
              maxLength={160}
              placeholder="e.g. Checkout API returning 500s"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isSubmitting}
              className="w-full bg-[#141A26] border border-white/[0.12] rounded-xl px-4 h-[42px] text-white outline-none focus:border-[#00F0FF] focus:ring-1 focus:ring-[#00F0FF]"
            />
          </div>

          <div>
            <label className="text-[#94A3B8] block mb-1.5 font-semibold text-xs">
              Impacted Microservice
            </label>
            <select
              value={service}
              onChange={(e) => setService(e.target.value)}
              disabled={isSubmitting}
              className="w-full bg-[#141A26] border border-white/[0.12] rounded-xl px-4 h-[42px] text-white outline-none focus:border-[#00F0FF] focus:ring-1 focus:ring-[#00F0FF] cursor-pointer"
            >
              <option value="checkout-api">checkout-api</option>
              <option value="inventory-service">inventory-service</option>
              <option value="payment-gateway">payment-gateway</option>
              <option value="search-api">search-api</option>
              <option value="events-worker">events-worker</option>
            </select>
          </div>

          <div>
            <label className="text-[#94A3B8] block mb-1.5 font-semibold text-xs">
              Severity Level
            </label>
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value as Severity)}
              disabled={isSubmitting}
              className="w-full bg-[#141A26] border border-white/[0.12] rounded-xl px-4 h-[42px] text-white outline-none focus:border-[#00F0FF] focus:ring-1 focus:ring-[#00F0FF] cursor-pointer"
            >
              <option value="critical">CRITICAL (P0)</option>
              <option value="high">HIGH (P1)</option>
              <option value="medium">MEDIUM (P2)</option>
              <option value="low">LOW (P3)</option>
            </select>
          </div>

          <div>
            <label className="text-[#94A3B8] block mb-1.5 font-semibold text-xs">
              Detailed Description (Optional)
            </label>
            <textarea
              rows={3}
              placeholder="Provide symptoms, observed error rates, or suspected causes..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isSubmitting}
              className="w-full bg-[#141A26] border border-white/[0.12] rounded-xl p-3 text-white outline-none focus:border-[#00F0FF] focus:ring-1 focus:ring-[#00F0FF] resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-white/[0.08]">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="btn-mechanical text-xs h-[38px] px-4 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-mechanical primary-cta text-xs h-[38px] px-4.5 rounded-xl"
            >
              {isSubmitting ? "Dispatching..." : "Dispatch to Agents"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

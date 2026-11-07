import { useState } from "react";
import { FileCode, Copy, Check } from "lucide-react";
import { parseUnifiedDiff } from "../diffParser.js";

interface UnifiedDiffViewerProps {
  patch?: string;
  targetFile?: string;
  onCopySuccess?: () => void;
}

export function UnifiedDiffViewer({
  patch,
  targetFile,
  onCopySuccess,
}: UnifiedDiffViewerProps) {
  const [copied, setCopied] = useState(false);

  const fallbackDefault = [
    "--- a/sample-app/src/checkout.ts",
    "+++ b/sample-app/src/checkout.ts",
    "@@ -24,8 +24,8 @@ export function checkout(",
    "-  if (inventory.available < 1) {",
    "+  if (inventory.available < item.quantity) {",
    '     throw new Error("Out of stock");',
    "   }",
    "-  return { accepted: true, remaining: inventory.available - 1 };",
    "+  return { accepted: true, remaining: inventory.available - item.quantity };",
    " }",
    "@@ -36,3 +36,5 @@ export function orderTotal(",
    "-  return (items ?? []).reduce((total, item) => total + item.unitPrice * item.quantity, 0);",
    "+  if (!items) {",
    '+    throw new Error("Cart items must be provided");',
    "+  }",
    "+  return items.reduce((total, item) => total + item.unitPrice * item.quantity, 0);",
  ].join("\n");

  const effectivePatch = patch && patch.trim() ? patch : fallbackDefault;
  const { lines, additions, deletions, filePath } = parseUnifiedDiff(effectivePatch);
  const displayFile = targetFile || filePath;

  const handleCopy = () => {
    void navigator.clipboard.writeText(effectivePatch);
    setCopied(true);
    onCopySuccess?.();
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="diff-container">
      <div className="diff-toolbar">
        <div className="diff-title-cluster min-w-0">
          <FileCode className="w-4 h-4 text-[#00F0FF] shrink-0" />
          <span className="diff-path truncate">
            {displayFile}
          </span>
          <div className="flex items-center gap-1.5 ml-2 font-mono text-[11px] font-bold shrink-0">
            <span className="diff-stat-add">
              +{additions}
            </span>
            <span className="diff-stat-del">
              -{deletions}
            </span>
          </div>
        </div>

        <button
          onClick={handleCopy}
          className="btn-mechanical text-xs h-[32px] px-3 flex items-center gap-1.5 cursor-pointer rounded-lg"
          title="Copy raw unified diff patch"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400 font-semibold">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy Patch</span>
            </>
          )}
        </button>
      </div>

      <div className="diff-viewport select-text">
        {lines.length === 0 ? (
          <div className="p-8 text-center text-[#64748B]">
            No code changes proposed yet.
          </div>
        ) : (
          lines.map((line, idx) => {
            if (line.type === "header") {
              return (
                <div
                  key={idx}
                  className="diff-row text-[#64748B] border-b border-white/[0.04] bg-white/[0.02]"
                >
                  <span className="diff-code-text whitespace-pre">{line.text}</span>
                </div>
              );
            }

            if (line.type === "hunk") {
              return (
                <div key={idx} className="diff-row type-hunk">
                  <span className="gutter-num-old font-mono">{line.oldNum}</span>
                  <span className="gutter-num-new font-mono">{line.newNum}</span>
                  <span className="gutter-marker"> </span>
                  <span className="diff-code-text whitespace-pre">{line.text}</span>
                </div>
              );
            }

            const isAdd = line.type === "add";
            const isDel = line.type === "del";

            return (
              <div
                key={idx}
                className={`diff-row ${
                  isAdd ? "type-add" : isDel ? "type-del" : ""
                }`}
              >
                <span className="gutter-num-old">{line.oldNum}</span>
                <span className="gutter-num-new">{line.newNum}</span>
                <span
                  className={`gutter-marker ${
                    isAdd
                      ? "text-emerald-400"
                      : isDel
                        ? "text-rose-400"
                        : "text-transparent"
                  }`}
                >
                  {isAdd ? "+" : isDel ? "-" : " "}
                </span>
                <span className="diff-code-text whitespace-pre">{line.text}</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

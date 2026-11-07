export interface DiffLine {
  type: "header" | "hunk" | "add" | "del" | "context";
  oldNum: string;
  newNum: string;
  text: string;
}

export function parseUnifiedDiff(rawPatch: string): {
  lines: DiffLine[];
  additions: number;
  deletions: number;
  filePath: string;
} {
  if (!rawPatch || !rawPatch.trim()) {
    return { lines: [], additions: 0, deletions: 0, filePath: "No patch available" };
  }

  const rawLines = rawPatch.split("\n");
  const parsedLines: DiffLine[] = [];
  let additions = 0;
  let deletions = 0;
  let filePath = "patch.diff";

  let oldCounter = 0;
  let newCounter = 0;

  for (const line of rawLines) {
    if (line.startsWith("--- ") || line.startsWith("+++ ")) {
      if (line.startsWith("+++ b/")) {
        filePath = line.replace("+++ b/", "");
      }
      parsedLines.push({
        type: "header",
        oldNum: "",
        newNum: "",
        text: line,
      });
      continue;
    }

    if (line.startsWith("@@")) {
      const match = /@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/.exec(line);
      if (match) {
        oldCounter = parseInt(match[1], 10);
        newCounter = parseInt(match[2], 10);
      }
      parsedLines.push({
        type: "hunk",
        oldNum: "...",
        newNum: "...",
        text: line,
      });
      continue;
    }

    if (line.startsWith("+")) {
      additions++;
      parsedLines.push({
        type: "add",
        oldNum: "",
        newNum: String(newCounter++),
        text: line.slice(1),
      });
    } else if (line.startsWith("-")) {
      deletions++;
      parsedLines.push({
        type: "del",
        oldNum: String(oldCounter++),
        newNum: "",
        text: line.slice(1),
      });
    } else {
      const text = line.startsWith(" ") ? line.slice(1) : line;
      parsedLines.push({
        type: "context",
        oldNum: oldCounter ? String(oldCounter++) : "",
        newNum: newCounter ? String(newCounter++) : "",
        text,
      });
    }
  }

  return { lines: parsedLines, additions, deletions, filePath };
}

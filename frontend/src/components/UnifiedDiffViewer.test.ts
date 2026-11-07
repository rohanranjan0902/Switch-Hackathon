import test from "node:test";
import assert from "node:assert/strict";
import { parseUnifiedDiff } from "../diffParser.js";

test("parseUnifiedDiff parses sample-app checkout unified diff accurately", () => {
  const samplePatch = [
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

  const result = parseUnifiedDiff(samplePatch);

  assert.equal(result.filePath, "sample-app/src/checkout.ts");
  assert.equal(result.additions, 6);
  assert.equal(result.deletions, 3);
  assert.ok(result.lines.length > 10);

  const hunkLines = result.lines.filter((l) => l.type === "hunk");
  assert.equal(hunkLines.length, 2);

  const addLines = result.lines.filter((l) => l.type === "add");
  assert.equal(addLines.length, 6);

  const delLines = result.lines.filter((l) => l.type === "del");
  assert.equal(delLines.length, 3);
});

test("parseUnifiedDiff gracefully handles empty or invalid patches", () => {
  const emptyResult = parseUnifiedDiff("");
  assert.equal(emptyResult.additions, 0);
  assert.equal(emptyResult.deletions, 0);
  assert.equal(emptyResult.lines.length, 0);

  const whitespaceResult = parseUnifiedDiff("   \n\n  ");
  assert.equal(whitespaceResult.additions, 0);
  assert.equal(whitespaceResult.deletions, 0);
  assert.equal(whitespaceResult.lines.length, 0);
});

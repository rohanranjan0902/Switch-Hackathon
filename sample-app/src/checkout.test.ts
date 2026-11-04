import assert from "node:assert/strict";
import test from "node:test";
import { checkout, orderTotal } from "./checkout.js";

test("sample checkout reproduces the inventory under-count bug", () => {
  const result = checkout(
    { productId: "SKU-42", quantity: 3 },
    { productId: "SKU-42", available: 2 },
  );
  assert.deepEqual(result, { accepted: true, remaining: 1 });
});

test("sample checkout reproduces the missing-cart fallback bug", () => {
  assert.equal(orderTotal(undefined), 0);
});

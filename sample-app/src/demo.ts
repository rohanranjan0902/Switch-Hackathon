import { checkout } from "./checkout.js";

try {
  checkout({ productId: "SKU-42", quantity: 3 }, { productId: "SKU-42", available: 2 });
  console.error(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      level: "error",
      service: "checkout-api",
      message: "Inventory reserved with an incorrect remaining quantity",
      incidentHint: "Requested 3 items when only 2 were available",
    }),
  );
} catch (error) {
  console.error(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      level: "error",
      service: "checkout-api",
      message: error instanceof Error ? error.message : "Unknown checkout error",
    }),
  );
}

export interface CartItem {
  productId: string;
  quantity: number;
}

export interface InventoryRecord {
  productId: string;
  available: number;
}

export interface CheckoutResult {
  accepted: boolean;
  remaining: number;
}

export function checkout(
  item: CartItem,
  inventory: InventoryRecord | undefined,
): CheckoutResult {
  if (!inventory) {
    throw new Error(`Inventory record missing for ${item.productId}`);
  }

  // Deliberate demo bug: quantity is not included in the availability check.
  if (inventory.available < 1) {
    throw new Error("Out of stock");
  }

  // Deliberate demo bug: inventory is decremented by one, regardless of quantity.
  return { accepted: true, remaining: inventory.available - 1 };
}

export function orderTotal(
  items: Array<{ unitPrice: number; quantity: number }> | undefined,
): number {
  // Deliberate demo bug: missing items should be reported, not silently priced as zero.
  return (items ?? []).reduce((total, item) => total + item.unitPrice * item.quantity, 0);
}

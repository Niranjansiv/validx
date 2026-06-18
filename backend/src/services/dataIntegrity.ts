export interface IntegrityValidationResult {
  valid: boolean;
  errors: string[];
}

const VALID_PAYMENT_MODES = new Set([
  "cash",
  "card",
  "upi",
  "online",
  "bank transfer",
]);

// Tries a list of candidate column names (all already lowercased) and returns
// the first match found in the row, along with the matched key name.
function findField(
  row: Record<string, string>,
  candidates: string[],
): { key: string; value: string } | null {
  for (const c of candidates) {
    if (c in row) return { key: c, value: row[c] ?? "" };
  }
  return null;
}

export function validateDataIntegrity(
  row: Record<string, string>,
  duplicateIds?: Set<string>,
): IntegrityValidationResult {
  const errors: string[] = [];

  // ── Order ID ─────────────────────────────────────────────────
  const orderIdField = findField(row, [
    "order_id", "orderid", "order id", "id",
    "transaction_id", "transactionid", "txn_id", "txnid",
  ]);

  if (!orderIdField) {
    errors.push("Order ID column not found — expected one of: order_id, id, transaction_id");
  } else if (orderIdField.value.trim() === "") {
    errors.push(`Order ID (column "${orderIdField.key}") is empty`);
  } else if (duplicateIds?.has(orderIdField.value.trim())) {
    errors.push("Duplicate Order ID detected");
  }

  // ── Amount ───────────────────────────────────────────────────
  const amountField = findField(row, [
    "amount", "total", "price", "sum",
    "revenue", "value", "transaction_amount", "order_total",
  ]);

  if (amountField) {
    if (amountField.value.trim() === "") {
      errors.push(`Amount (column "${amountField.key}") is empty`);
    } else {
      const cleaned = amountField.value.replace(/[,$₹£€\s]/g, "");
      const n = Number(cleaned);
      if (isNaN(n) || !isFinite(n)) {
        errors.push(`Amount "${amountField.value}" is not a valid number`);
      }
    }
  }

  // ── Payment mode ─────────────────────────────────────────────
  const paymentField = findField(row, [
    "payment_mode", "paymentmode", "payment_type", "paymenttype",
    "mode", "payment_method", "payment method",
  ]);

  if (paymentField) {
    if (paymentField.value.trim() === "") {
      errors.push(`Payment mode (column "${paymentField.key}") is empty`);
    } else if (!VALID_PAYMENT_MODES.has(paymentField.value.trim().toLowerCase())) {
      errors.push(
        `Payment mode "${paymentField.value}" is not valid — accepted values: Cash, Card, UPI, Online, Bank Transfer`,
      );
    }
  }

  // ── Customer name ─────────────────────────────────────────────
  const nameField = findField(row, [
    "customer_name", "customername", "customer", "name",
    "full_name", "fullname", "client_name", "buyer_name",
  ]);

  if (nameField) {
    if (nameField.value.trim() === "") {
      errors.push("Customer name is empty");
    } else if (/\d/.test(nameField.value)) {
      errors.push("Customer name contains invalid characters");
    }
  }

  // ── Quantity ──────────────────────────────────────────────────
  const qtyField = findField(row, [
    "quantity", "qty", "count", "units", "item_count", "number_of_items",
  ]);

  if (qtyField) {
    const qtyTrimmed = qtyField.value.trim();
    if (qtyTrimmed !== "") {
      const n = Number(qtyTrimmed);
      if (isNaN(n) || !isFinite(n)) {
        errors.push("Quantity must be numeric");
      } else if (n < 0) {
        errors.push("Quantity cannot be negative");
      } else if (n === 0) {
        errors.push("Quantity must be a positive number");
      }
    }
  }

  // ── Product price ─────────────────────────────────────────────
  const priceField = findField(row, [
    "unit_price", "unitprice", "product_price", "productprice",
    "item_price", "selling_price", "cost_per_unit",
  ]);

  if (priceField) {
    const priceTrimmed = priceField.value.trim();
    if (priceTrimmed !== "") {
      const cleaned = priceTrimmed.replace(/[,$₹£€\s]/g, "");
      const n = Number(cleaned);
      if (isNaN(n) || !isFinite(n)) {
        errors.push("Price must be a valid number");
      } else if (n < 0) {
        errors.push("Price cannot be negative");
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

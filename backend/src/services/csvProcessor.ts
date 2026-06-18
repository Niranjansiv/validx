import fs from "fs";
import Papa from "papaparse";
import { validatePhone } from "./phoneValidator";
import { validateDate, validateTime, DateSchema } from "./dateValidator";
import { validateDataIntegrity } from "./dataIntegrity";

export type Region = "in" | "sg" | "us" | "global";

export interface ProcessOptions {
  targetRegion: Region;
  dateSchema: DateSchema;
  chunkSize: number;
}

export interface RowResult {
  rowNumber: number;
  data: Record<string, string>;
  validation_status: "Valid" | "Invalid";
  errors: string[];
}

export interface ProcessResult {
  totalRows: number;
  cleanedRows: RowResult[];
  invalidRows: RowResult[];
  fullReport: RowResult[];
}

// Candidates for each logical field — all lowercase, matching transformHeader output
const FIELD_CANDIDATES = {
  phone: [
    "phone", "phone_number", "phonenumber", "mobile",
    "mobile_number", "contact", "contact_number",
  ],
  date: [
    "date", "transaction_date", "transactiondate", "created_at",
    "createdat", "order_date", "orderdate", "purchase_date",
  ],
  time: [
    "time", "transaction_time", "transactiontime", "order_time",
    "created_time", "purchase_time",
  ],
  country: ["country", "country_code", "countrycode", "nation"],
  orderId: [
    "order_id", "orderid", "order id", "id",
    "transaction_id", "transactionid", "txn_id", "txnid",
  ],
};

function detectColumn(headers: string[], candidates: string[]): string | null {
  for (const c of candidates) {
    if (headers.includes(c)) return c;
  }
  return null;
}

export async function processCSV(
  filePath: string,
  options: ProcessOptions,
): Promise<ProcessResult> {
  const { targetRegion, dateSchema } = options;

  const raw = fs.readFileSync(filePath, "utf-8");

  const parsed = Papa.parse<Record<string, string>>(raw, {
    header: true,
    skipEmptyLines: true,
    // Normalize headers: trim whitespace, lowercase, replace spaces with _
    transformHeader: (h) => h.trim().toLowerCase().replace(/\s+/g, "_"),
  });

  const headers = parsed.meta.fields ?? [];
  const phoneCol   = detectColumn(headers, FIELD_CANDIDATES.phone);
  const dateCol    = detectColumn(headers, FIELD_CANDIDATES.date);
  const timeCol    = detectColumn(headers, FIELD_CANDIDATES.time);
  const countryCol = detectColumn(headers, FIELD_CANDIDATES.country);
  const orderIdCol = detectColumn(headers, FIELD_CANDIDATES.orderId);

  // ── Auto-trim all values ──────────────────────────────────────
  // Strip leading/trailing whitespace from every cell before validation
  // so that " Rahul " is treated the same as "Rahul".
  const rows = parsed.data.map((rawRow) =>
    Object.fromEntries(
      Object.entries(rawRow).map(([k, v]) => [k, (v ?? "").trim()])
    ) as Record<string, string>
  );

  // ── First pass: collect duplicate order IDs ───────────────────
  const idCount = new Map<string, number>();
  if (orderIdCol) {
    for (const row of rows) {
      const id = row[orderIdCol] ?? "";
      if (id !== "") idCount.set(id, (idCount.get(id) ?? 0) + 1);
    }
  }
  const duplicateIds = new Set<string>(
    [...idCount.entries()]
      .filter(([, count]) => count > 1)
      .map(([id]) => id)
  );

  // ── Main validation loop ──────────────────────────────────────
  const fullReport: RowResult[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const errors: string[] = [];

    // ── Phone validation ──────────────────────────────────────
    if (phoneCol !== null) {
      const countryHint =
        targetRegion === "global" && countryCol ? row[countryCol] : undefined;
      const result = validatePhone(row[phoneCol] ?? "", targetRegion, countryHint);
      if (!result.valid) errors.push(result.error);
    }

    // ── Date validation ───────────────────────────────────────
    if (dateCol !== null) {
      const result = validateDate(row[dateCol] ?? "", dateSchema);
      if (!result.valid) errors.push(result.error);
    }

    // ── Time validation ───────────────────────────────────────
    if (timeCol !== null) {
      const result = validateTime(row[timeCol] ?? "");
      if (!result.valid) errors.push(result.error);
    }

    // ── Data integrity ────────────────────────────────────────
    const integrity = validateDataIntegrity(row, duplicateIds);
    if (!integrity.valid) {
      errors.push(...integrity.errors);
    }

    fullReport.push({
      rowNumber: i + 1,
      data: row,
      validation_status: errors.length === 0 ? "Valid" : "Invalid",
      errors,
    });
  }

  // Remove the temporary uploaded file
  fs.unlink(filePath, () => {});

  return {
    totalRows: rows.length,
    cleanedRows: fullReport.filter((r) => r.validation_status === "Valid"),
    invalidRows: fullReport.filter((r) => r.validation_status === "Invalid"),
    fullReport,
  };
}

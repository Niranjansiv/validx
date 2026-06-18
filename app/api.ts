const BASE_URL = "http://localhost:5000";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface UploadSettings {
  targetRegion: string;
  dateSchema: string;
  chunkSize: number;
}

export interface RowResult {
  rowNumber: number;
  data: Record<string, string>;
  validation_status: "Valid" | "Invalid";
  errors: string[];
}

export interface UploadResult {
  sessionId: string;
  filename: string;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  accuracy: number;
  fullReport: RowResult[];
}

export interface HistorySession {
  id: string;
  filename: string;
  upload_date: string;
  total_rows: number | null;
  valid_rows: number | null;
  invalid_rows: number | null;
  error_count: number | null;
  status: string | null;
  chunk_size: number | null;
  target_region: string | null;
  date_schema: string | null;
}

// ── Module-level store ────────────────────────────────────────────────────────
// File objects cannot be serialised into sessionStorage, so we keep them here.
// This object survives client-side navigation within the same tab.
export const pendingUpload: {
  file: File | null;
  settings: UploadSettings | null;
  promise: Promise<UploadResult> | null;
} = { file: null, settings: null, promise: null };

// ── API functions ─────────────────────────────────────────────────────────────

export async function uploadFile(
  file: File,
  settings: UploadSettings,
): Promise<UploadResult> {
  const body = new FormData();
  body.append("file", file);
  body.append("targetRegion", settings.targetRegion);
  body.append("dateSchema", settings.dateSchema);
  body.append("chunkSize", String(settings.chunkSize));

  const res = await fetch(`${BASE_URL}/api/upload`, { method: "POST", body });

  if (!res.ok) {
    const payload = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(payload.error ?? "Upload failed");
  }

  return res.json() as Promise<UploadResult>;
}

export async function getHistory(): Promise<HistorySession[]> {
  const res = await fetch(`${BASE_URL}/api/history`);
  if (!res.ok) throw new Error("Failed to fetch history");
  return res.json() as Promise<HistorySession[]>;
}

// Download helpers — open a new tab so the browser handles the file download
export function downloadCleaned(sessionId: string): void {
  window.open(`${BASE_URL}/api/download/cleaned/${sessionId}`, "_blank");
}

export function downloadInvalid(sessionId: string): void {
  window.open(`${BASE_URL}/api/download/invalid/${sessionId}`, "_blank");
}

export function downloadReport(sessionId: string): void {
  window.open(`${BASE_URL}/api/download/report/${sessionId}`, "_blank");
}

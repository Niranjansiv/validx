import { Router, Request, Response } from "express";
import { PrismaClient, UploadSession } from "@prisma/client";
import Papa from "papaparse";

const router = Router();
const prisma = new PrismaClient();

// ── Helpers ───────────────────────────────────────────────────────────────────

async function getSession(id: string, res: Response): Promise<UploadSession | null> {
  const session = await prisma.uploadSession.findUnique({ where: { id } });
  if (!session) {
    res.status(404).json({ error: "Session not found." });
    return null;
  }
  return session;
}

/**
 * Parse optional chunk query params.
 * ?chunk=N  → return chunk N (0-based) using the session's chunk_size.
 * No params → return all rows.
 */
function chunkParams(
  query: Request["query"],
  session: UploadSession,
): { skip: number; take: number } | null {
  const raw = query.chunk;
  if (raw === undefined) return null;
  const chunkIndex = Number(Array.isArray(raw) ? raw[0] : raw);
  if (isNaN(chunkIndex)) return null;
  const size = session.chunk_size ?? 1000;
  return { skip: chunkIndex * size, take: size };
}

function sendCSV(res: Response, filename: string, rows: Record<string, unknown>[]) {
  const csv = rows.length > 0 ? Papa.unparse(rows) : "";
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.send(csv);
}

function safeErrors(raw: string | null): string {
  try {
    const arr: string[] = JSON.parse(raw ?? "[]");
    return arr.join("; ");
  } catch {
    return raw ?? "";
  }
}

function baseName(filename: string): string {
  return filename.replace(/\.[^.]+$/, "");
}

// ── Routes ────────────────────────────────────────────────────────────────────

// GET /api/download/cleaned/:sessionId
// Returns only Valid rows as a CSV.
// Optional: ?chunk=N   →  Nth chunk using session.chunk_size
router.get("/cleaned/:sessionId", async (req: Request, res: Response) => {
  try {
    const session = await getSession(req.params["sessionId"] as string, res);
    if (!session) return;

    const pagination = chunkParams(req.query, session);

    const records = await prisma.validationResult.findMany({
      where:   { session_id: session.id, validation_status: "Valid" },
      orderBy: { row_number: "asc" },
      ...(pagination ?? {}),
    });

    const rows = records.map((r) => r.row_data as Record<string, string>);
    sendCSV(res, `${baseName(session.filename)}_cleaned.csv`, rows);
  } catch (err) {
    console.error("Download cleaned error:", err);
    res.status(500).json({ error: "Failed to generate cleaned CSV." });
  }
});

// GET /api/download/invalid/:sessionId
// Returns only Invalid rows with their errors appended as a column.
// Optional: ?chunk=N
router.get("/invalid/:sessionId", async (req: Request, res: Response) => {
  try {
    const session = await getSession(req.params["sessionId"] as string, res);
    if (!session) return;

    const pagination = chunkParams(req.query, session);

    const records = await prisma.validationResult.findMany({
      where:   { session_id: session.id, validation_status: "Invalid" },
      orderBy: { row_number: "asc" },
      ...(pagination ?? {}),
    });

    const rows = records.map((r) => ({
      ...(r.row_data as Record<string, string>),
      validation_errors: safeErrors(r.errors),
    }));

    sendCSV(res, `${baseName(session.filename)}_invalid.csv`, rows);
  } catch (err) {
    console.error("Download invalid error:", err);
    res.status(500).json({ error: "Failed to generate invalid CSV." });
  }
});

// GET /api/download/report/:sessionId
// Returns all rows with row_number, validation_status, and errors columns.
// Optional: ?chunk=N
router.get("/report/:sessionId", async (req: Request, res: Response) => {
  try {
    const session = await getSession(req.params["sessionId"] as string, res);
    if (!session) return;

    const pagination = chunkParams(req.query, session);

    const records = await prisma.validationResult.findMany({
      where:   { session_id: session.id },
      orderBy: { row_number: "asc" },
      ...(pagination ?? {}),
    });

    const rows = records.map((r) => ({
      row_number:        r.row_number,
      ...(r.row_data as Record<string, string>),
      validation_status: r.validation_status,
      validation_errors: safeErrors(r.errors),
    }));

    sendCSV(res, `${baseName(session.filename)}_report.csv`, rows);
  } catch (err) {
    console.error("Download report error:", err);
    res.status(500).json({ error: "Failed to generate report CSV." });
  }
});

export default router;

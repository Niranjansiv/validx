import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { upload } from "../middleware/multer";
import { processCSV, ProcessOptions, Region } from "../services/csvProcessor";
import { DateSchema } from "../services/dateValidator";

const router = Router();
const prisma = new PrismaClient();

// Rows per batch when writing ValidationResult records to Supabase
const DB_BATCH_SIZE = 500;

// POST /api/upload
router.post("/", upload.single("file"), async (req: Request, res: Response) => {
  if (!req.file) {
    res.status(400).json({ error: "No file uploaded." });
    return;
  }

  const {
    targetRegion = "in",
    dateSchema    = "iso",
    chunkSize     = "1000",
  } = req.body as {
    targetRegion?: Region;
    dateSchema?: DateSchema;
    chunkSize?: string;
  };

  let sessionId: string | null = null;

  try {
    const options: ProcessOptions = {
      targetRegion,
      dateSchema,
      chunkSize: Math.max(1, Number(chunkSize) || 1000),
    };

    // ── 1. Parse & validate the CSV ──────────────────────────
    const result = await processCSV(req.file.path, options);

    // ── 2. Create UploadSession record ───────────────────────
    const session = await prisma.uploadSession.create({
      data: {
        filename:      req.file.originalname,
        status:        "PROCESSING",
        total_rows:    result.totalRows,
        valid_rows:    result.cleanedRows.length,
        invalid_rows:  result.invalidRows.length,
        error_count:   result.invalidRows.length,
        chunk_size:    options.chunkSize,
        target_region: targetRegion,
        date_schema:   dateSchema,
      },
    });

    sessionId = session.id;

    // ── 3. Batch-insert ValidationResult rows ─────────────────
    for (let i = 0; i < result.fullReport.length; i += DB_BATCH_SIZE) {
      await prisma.validationResult.createMany({
        data: result.fullReport.slice(i, i + DB_BATCH_SIZE).map((row) => ({
          session_id:        session.id,
          row_number:        row.rowNumber,
          row_data:          row.data,
          validation_status: row.validation_status,
          errors:            JSON.stringify(row.errors),
        })),
      });
    }

    // ── 4. Mark session as COMPLETED ─────────────────────────
    await prisma.uploadSession.update({
      where: { id: session.id },
      data:  { status: "COMPLETED" },
    });

    // ── 5. Return summary + full report ──────────────────────
    const accuracy =
      result.totalRows > 0
        ? Math.round((result.cleanedRows.length / result.totalRows) * 10000) / 100
        : 0;

    res.json({
      sessionId:   session.id,
      filename:    req.file.originalname,
      totalRows:   result.totalRows,
      validRows:   result.cleanedRows.length,
      invalidRows: result.invalidRows.length,
      accuracy,
      fullReport:  result.fullReport,
    });
  } catch (err) {
    console.error("Upload error:", err);

    // Mark session FAILED if it was created before the error
    if (sessionId) {
      await prisma.uploadSession
        .update({ where: { id: sessionId }, data: { status: "FAILED" } })
        .catch(() => {});
    }

    res.status(500).json({ error: "Failed to process file." });
  }
});

export default router;

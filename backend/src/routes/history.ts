import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const router = Router();
const prisma = new PrismaClient();

// GET /api/history — all upload sessions, newest first
router.get("/", async (_req: Request, res: Response) => {
  try {
    const sessions = await prisma.uploadSession.findMany({
      orderBy: { upload_date: "desc" },
    });
    res.json(sessions);
  } catch (err) {
    console.error("History fetch error:", err);
    res.status(500).json({ error: "Failed to fetch history." });
  }
});

// GET /api/history/:id — single session + its validation results
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const session = await prisma.uploadSession.findUnique({
      where:   { id: req.params["id"] as string },
      include: { results: { orderBy: { row_number: "asc" } } },
    });
    if (!session) {
      res.status(404).json({ error: "Session not found." });
      return;
    }
    res.json(session);
  } catch (err) {
    console.error("History detail error:", err);
    res.status(500).json({ error: "Failed to fetch session." });
  }
});

// DELETE /api/history/:id — delete session and its results
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    await prisma.validationResult.deleteMany({
      where: { session_id: req.params["id"] as string },
    });
    await prisma.uploadSession.delete({ where: { id: req.params["id"] as string } });
    res.json({ message: "Session deleted." });
  } catch (err) {
    console.error("History delete error:", err);
    res.status(500).json({ error: "Failed to delete session." });
  }
});

export default router;

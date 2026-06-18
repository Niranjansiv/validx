import { Router, Request, Response } from "express";
import { validatePhone } from "../services/phoneValidator";
import { validateDate }  from "../services/dateValidator";
import { validateDataIntegrity } from "../services/dataIntegrity";

const router = Router();

// POST /api/validate/phone
// Body: { phone: string, region: "in"|"sg"|"us"|"global", country?: string }
router.post("/phone", (req: Request, res: Response) => {
  const { phone, region, country } = req.body;
  if (!phone || !region) {
    res.status(400).json({ error: "phone and region are required." });
    return;
  }
  const result = validatePhone(phone, region, country);
  res.json({ phone, region, ...result });
});

// POST /api/validate/date
// Body: { date: string, schema: "iso"|"us"|"eu" }
router.post("/date", (req: Request, res: Response) => {
  const { date, schema } = req.body;
  if (!date || !schema) {
    res.status(400).json({ error: "date and schema are required." });
    return;
  }
  const result = validateDate(date, schema);
  res.json({ date, schema, ...result });
});

// POST /api/validate/integrity
// Body: { row: Record<string, string> }
router.post("/integrity", (req: Request, res: Response) => {
  const { row } = req.body;
  if (!row || typeof row !== "object" || Array.isArray(row)) {
    res.status(400).json({ error: "row must be a flat object (one CSV row)." });
    return;
  }
  const result = validateDataIntegrity(row);
  res.json(result);
});

export default router;

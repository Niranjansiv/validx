import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import uploadRouter   from "./routes/upload";
import validateRouter from "./routes/validate";
import historyRouter  from "./routes/history";
import downloadRouter from "./routes/download";

dotenv.config();

const app = express();
const PORT = process.env.PORT ?? 5000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/upload",   uploadRouter);
app.use("/api/validate", validateRouter);
app.use("/api/history",  historyRouter);
app.use("/api/download", downloadRouter);

app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`ValidX backend running on http://localhost:${PORT}`);
});

export default app;

import express from "express";
import "express-async-errors";
import cors from "cors";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { env } from "./config/env.js";
import { apiRouter } from "./routes/index.js";
import { pool, testDbConnection } from "./config/db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

if (!fs.existsSync(env.uploadDir)) {
  fs.mkdirSync(env.uploadDir, { recursive: true });
}

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "4mb" }));

app.use(env.uploadPublicPath, express.static(env.uploadDir));

app.get("/health", (_req, res) => res.json({ ok: true }));

app.get("/health/db", async (_req, res) => {
  try {
    const c = await pool.getConnection();
    try {
      await c.ping();
    } finally {
      c.release();
    }
    res.json({ ok: true, database: env.db.database });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    res.status(503).json({ ok: false, error: msg });
  }
});

app.use("/api", apiRouter);

app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  const msg = err instanceof Error ? err.message : "Internal server error";
  if (env.nodeEnv === "development") {
    return res.status(500).json({ error: msg });
  }
  res.status(500).json({ error: "Internal server error" });
});

async function main() {
  try {
    await testDbConnection();
    console.log(`MySQL connected: ${env.db.database} @ ${env.db.host}:${env.db.port} as ${env.db.user}`);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("\n[FATAL] Cannot connect to MySQL. Check backend/.env (DB_HOST, DB_USER, DB_PASSWORD, DB_NAME) and that the server is running.");
    console.error(`        ${msg}\n`);
    process.exit(1);
  }

  app.listen(env.port, "0.0.0.0", () => {
    console.log(`Smart Timetable API on http://127.0.0.1:${env.port}  (health: /health  db: /health/db)`);
  });
}

main();

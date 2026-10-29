import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import cors from "cors";
import { initDatabase, closeDatabase, getPool, DB_NAME } from "./db.js";
import cvRouter from "./cv.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = Number(process.env.PORT || 3100);
const host = process.env.HOST || "0.0.0.0";
const corsOrigins = String(process.env.CORS_ORIGIN || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.disable("x-powered-by");
app.use(cors(corsOrigins.length ? { origin: corsOrigins } : {}));
app.use(express.json({ limit: "4mb" }));

app.get("/api/health", async (req, res, next) => {
  try {
    await getPool().query("SELECT 1");
    res.json({ ok: true, database: DB_NAME });
  } catch (error) {
    next(error);
  }
});

app.use("/api", cvRouter);
app.use("/api", (req, res) => res.status(404).json({ message: "Ruta no encontrada" }));

const distDir = process.env.FRONTEND_DIST
  ? path.resolve(process.env.FRONTEND_DIST)
  : path.resolve(here, "../frontend/dist");

if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
  app.use((req, res, next) => {
    if (req.method !== "GET" || req.path.startsWith("/api")) return next();
    res.sendFile(path.join(distDir, "index.html"));
  });
}

app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  console.error(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`, error);
  res.status(500).json({ message: "Ocurrió un error en el servidor" });
});

await initDatabase();
const server = app.listen(port, host, () => {
  console.log(`Creador de CV escuchando en http://localhost:${port}`);
  console.log(`Base de datos MySQL: ${DB_NAME}`);
});

const shutdown = async () => {
  server.close(async () => {
    await closeDatabase();
    process.exit(0);
  });
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import mysql from "mysql2/promise";

const here = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(here, ".env") });

const dbName = process.env.DB_NAME || "creador_cv";
if (!/^[A-Za-z0-9_]+$/.test(dbName)) {
  throw new Error("DB_NAME solo admite letras, números y guion bajo");
}

const connectionConfig = {
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  charset: "utf8mb4",
};

export const DB_NAME = dbName;

let pool = null;

export const getPool = () => {
  if (!pool) throw new Error("La base de datos todavía no está inicializada");
  return pool;
};

const SCHEMA = `
CREATE TABLE IF NOT EXISTS cvs (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(120) NOT NULL,
  full_name VARCHAR(160) NOT NULL,
  headline VARCHAR(160) NULL,
  email VARCHAR(190) NULL,
  phone VARCHAR(60) NULL,
  location VARCHAR(160) NULL,
  portfolio_url VARCHAR(255) NULL,
  summary TEXT NULL,
  photo MEDIUMTEXT NULL,
  language ENUM('es', 'en') NOT NULL DEFAULT 'es',
  theme VARCHAR(20) NOT NULL DEFAULT 'esmeralda',
  experience JSON NULL,
  education JSON NULL,
  skills JSON NULL,
  languages JSON NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY ix_cvs_updated (updated_at),
  KEY ix_cvs_name (full_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`;

export async function initDatabase() {
  const connection = await mysql.createConnection(connectionConfig);
  await connection.query(
    `CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
  );
  await connection.end();

  pool = mysql.createPool({
    ...connectionConfig,
    database: dbName,
    waitForConnections: true,
    connectionLimit: 5,
    queueLimit: 0,
  });
  await pool.query(SCHEMA);
  const [themeColumns] = await pool.query("SHOW COLUMNS FROM cvs LIKE 'theme'");
  if (!themeColumns.length) {
    await pool.query(
      "ALTER TABLE cvs ADD COLUMN theme VARCHAR(20) NOT NULL DEFAULT 'esmeralda' AFTER language",
    );
  }
  return pool;
}

export async function closeDatabase() {
  if (!pool) return;
  await pool.end();
  pool = null;
}

/**
 * Run schema or seed SQL against MySQL (multiple statements enabled).
 * Usage: npm run db:schema | npm run db:seed
 */
import fs from "fs";
import path from "path";
import mysql from "mysql2/promise";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../../.env") });

const mode = process.argv[2];
if (mode !== "schema" && mode !== "seed") {
  console.error("Usage: tsx src/scripts/runSql.ts schema|seed");
  process.exit(1);
}

const file = mode === "schema" ? "sql/schema.sql" : "sql/seed.sql";
const full = path.join(__dirname, "../../", file);
const sql = fs.readFileSync(full, "utf8");

const host = process.env.DB_HOST || "127.0.0.1";
const port = Number(process.env.DB_PORT) || 3306;
const user = process.env.DB_USER || "root";
const password = process.env.DB_PASSWORD ?? "";
const database = process.env.DB_NAME || "smart_timetable";

let conn;
try {
  conn = await mysql.createConnection({
    host,
    port,
    user,
    password,
    database,
    multipleStatements: true,
  });
} catch (e: unknown) {
  const err = e as { code?: string; errno?: number; message?: string };
  if (err.code === "ER_ACCESS_DENIED_ERROR" || err.errno === 1045) {
    console.error("\nMySQL access denied — credentials in backend/.env do not match your server.\n");
    console.error("  Check: DB_USER, DB_PASSWORD (and DB_HOST / DB_PORT if not default).");
    console.error(`  Trying: user="${user}" host="${host}" port=${port} database="${database}"`);
    if (password === "your_mysql_password" || password === "") {
      console.error("\n  Tip: .env.example uses placeholder your_mysql_password — replace it with your real MySQL password.");
      console.error("  If root has no password (common on some local installs), set: DB_PASSWORD=\n");
    } else {
      console.error("\n  Tip: Reset the MySQL password or create a user with GRANT on your DB, then update .env.\n");
    }
  } else {
    console.error(err.message || e);
  }
  process.exit(1);
}

try {
  await conn.query(sql);
} finally {
  await conn.end();
}
console.log(`Executed ${file} OK`);

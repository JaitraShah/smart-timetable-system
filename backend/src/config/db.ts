import mysql from "mysql2/promise";
import { env } from "./env.js";

export const pool = mysql.createPool({
  host: env.db.host,
  port: env.db.port,
  user: env.db.user,
  password: env.db.password,
  database: env.db.database,
  waitForConnections: true,
  connectionLimit: 10,
});

/** Verify credentials and that the database exists before accepting traffic. */
export async function testDbConnection(): Promise<void> {
  const c = await pool.getConnection();
  try {
    await c.ping();
    await c.query("SELECT 1");
  } finally {
    c.release();
  }
}

export type Row = mysql.RowDataPacket;
export type Result = mysql.ResultSetHeader;

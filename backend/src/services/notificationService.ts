import type { Pool } from "mysql2/promise";

export async function notifyUser(
  pool: Pool,
  userId: number,
  title: string,
  body: string
): Promise<void> {
  await pool.query(
    `INSERT INTO notifications (user_id, title, body, is_read) VALUES (?, ?, ?, 0)`,
    [userId, title, body]
  );
}

export async function notifyAdmins(pool: Pool, title: string, body: string): Promise<void> {
  const [rows] = await pool.query(
    `SELECT u.id FROM users u JOIN roles r ON r.id = u.role_id WHERE r.name = 'admin'`
  );
  for (const r of rows as { id: number }[]) await notifyUser(pool, r.id, title, body);
}

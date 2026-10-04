import type { Pool } from "mysql2/promise";

export async function logActivity(
  pool: Pool,
  userId: number | null,
  action: string,
  entityType?: string,
  entityId?: number,
  details?: string
): Promise<void> {
  await pool.query(
    `INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details) VALUES (?,?,?,?,?)`,
    [userId, action, entityType ?? null, entityId ?? null, details ?? null]
  );
}

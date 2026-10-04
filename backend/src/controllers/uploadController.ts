import type { Response } from "express";
import fs from "fs";
import path from "path";
import multer from "multer";
import type { ResultSetHeader } from "mysql2";
import { env } from "../config/env.js";
import { pool } from "../config/db.js";
import type { AuthedRequest } from "../middleware/auth.js";
import { logActivity } from "../services/activityLog.js";

if (!fs.existsSync(env.uploadDir)) {
  fs.mkdirSync(env.uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, env.uploadDir),
  filename: (_req, file, cb) => {
    const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
    cb(null, `${Date.now()}_${safe}`);
  },
});

export const uploadMiddleware = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 },
});

export async function uploadFile(req: AuthedRequest, res: Response) {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });
  const f = req.file;
  if (!f) return res.status(400).json({ error: "No file" });
  const [ins] = (await pool.query(
    `INSERT INTO uploaded_files (uploaded_by, original_name, stored_name, mime_type, size_bytes) VALUES (?,?,?,?,?)`,
    [req.user.id, f.originalname, f.filename, f.mimetype, f.size]
  )) as [ResultSetHeader, unknown];
  await logActivity(pool, req.user.id, "file_uploaded", "uploaded_file", ins.insertId, f.originalname);
  res.status(201).json({
    id: ins.insertId,
    url: `${env.uploadPublicPath}/${f.filename}`,
    originalName: f.originalname,
  });
}

export async function listUploads(_req: AuthedRequest, res: Response) {
  const [rows] = await pool.query(
    `SELECT f.*, u.full_name AS uploader FROM uploaded_files f
     JOIN users u ON u.id = f.uploaded_by ORDER BY f.created_at DESC`
  );
  res.json(rows);
}

export function downloadPath(storedName: string): string {
  return path.join(env.uploadDir, path.basename(storedName));
}

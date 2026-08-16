import { Router } from "express";
import { getDb } from "../lib/db";
import { requireAuth } from "../lib/auth";
import type { AuthUser } from "../lib/auth";

const router = Router();

function formatSticker(row: any) {
  return {
    id: row.id as number,
    title: row.title as string,
    description: row.description ?? null,
    budget: row.budget as number,
    imageUrl: row.image_url ?? null,
    createdAt: row.created_at as string,
    expiresAt: row.expires_at as string,
    status: row.status as string,
    createdBy: row.created_by as number,
    authorLogin: row.author_login ?? null,
  };
}

// GET /stickers
router.get("/stickers", requireAuth, (req, res) => {
  const db = getDb();
  const page = Math.max(1, parseInt((req.query.page as string) ?? "1", 10) || 1);
  const limit = 20;
  const offset = (page - 1) * limit;

  const rows = db
    .prepare(
      `SELECT s.*, u.login as author_login
       FROM stickers s
       LEFT JOIN users u ON u.id = s.created_by
       WHERE s.status = 'active' AND s.expires_at > datetime('now')
       ORDER BY s.created_at DESC
       LIMIT ? OFFSET ?`
    )
    .all(limit, offset) as any[];

  res.json(rows.map(formatSticker));
});

// POST /stickers
router.post("/stickers", requireAuth, (req, res) => {
  const user: AuthUser = (req as any).user;
  const body = req.body ?? {};
  const { title, budget, expiresAt, contactEmail, description, imageUrl } = body;

  if (!title?.trim()) { res.status(400).json({ error: "Укажите название" }); return; }
  if (!budget) { res.status(400).json({ error: "Укажите бюджет" }); return; }
  if (!expiresAt) { res.status(400).json({ error: "Укажите дату окончания" }); return; }

  const db = getDb();
  const result = db
    .prepare(
      "INSERT INTO stickers (title, description, budget, image_url, contact_email, created_by, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
    )
    .run(
      title.trim(),
      description ?? null,
      Number(budget),
      imageUrl ?? null,
      contactEmail?.trim() || user.email,
      user.id,
      expiresAt
    );

  const id = result.lastInsertRowid as number;
  db.prepare(
    "INSERT INTO activity_log (type, description, user_id, ref_id) VALUES (?, ?, ?, ?)"
  ).run("sticker_created", "Новый стикер в клубе", user.id, id);

  const row = db
    .prepare("SELECT s.*, ? as author_login FROM stickers s WHERE s.id = ?")
    .get(user.login, id) as any;
  res.status(201).json(formatSticker(row));
});

// POST /stickers/:id/close
router.post("/stickers/:id/close", requireAuth, (req, res) => {
  const user: AuthUser = (req as any).user;
  const db = getDb();
  const id = Number(req.params.id);

  const sticker = db.prepare("SELECT * FROM stickers WHERE id = ?").get(id) as any;
  if (!sticker) { res.status(404).json({ error: "Стикер не найден" }); return; }
  if (sticker.created_by !== user.id && user.role !== "admin") {
    res.status(403).json({ error: "Нет прав" }); return;
  }

  const comment = req.body?.comment ?? null;
  db.prepare("UPDATE stickers SET status = 'closed', close_comment = ? WHERE id = ?").run(comment, id);
  res.json({ success: true });
});

// POST /stickers/:id/respond
router.post("/stickers/:id/respond", requireAuth, (req, res) => {
  const user: AuthUser = (req as any).user;
  const db = getDb();
  const id = Number(req.params.id);
  const comment = req.body?.comment?.trim() ?? "";
  if (!comment) { res.status(400).json({ error: "Укажите комментарий" }); return; }

  const sticker = db
    .prepare("SELECT * FROM stickers WHERE id = ? AND status = 'active'")
    .get(id) as any;
  if (!sticker) { res.status(404).json({ error: "Стикер не найден" }); return; }

  db.prepare(
    "INSERT INTO sticker_responses (sticker_id, user_id, comment, image_url) VALUES (?, ?, ?, ?)"
  ).run(id, user.id, comment, req.body?.imageUrl ?? null);

  res.status(201).json({ success: true });
});

export default router;

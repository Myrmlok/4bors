import { Router } from "express";
import { getDb } from "../lib/db";
import { requireAuth, requireAdmin } from "../lib/auth";
import type { AuthUser } from "../lib/auth";

const router = Router();

function formatNews(row: any) {
  return {
    id: row.id as number,
    title: row.title as string,
    content: row.content as string,
    imageUrl: row.image_url ?? null,
    isPinned: Boolean(row.is_pinned),
    createdAt: row.created_at as string,
  };
}

// GET /news
router.get("/news", requireAuth, (req, res) => {
  const user: AuthUser = (req as any).user;
  if (user.role === "collector") { res.json([]); return; }

  const db = getDb();
  const page = Math.max(1, parseInt((req.query.page as string) ?? "1", 10) || 1);
  const limit = 20;
  const offset = (page - 1) * limit;

  const rows = db
    .prepare("SELECT * FROM news ORDER BY is_pinned DESC, created_at DESC LIMIT ? OFFSET ?")
    .all(limit, offset) as any[];
  res.json(rows.map(formatNews));
});

// POST /news
router.post("/news", requireAdmin, (req, res) => {
  const user: AuthUser = (req as any).user;
  const { title, content, imageUrl, isPinned = false } = req.body ?? {};
  if (!title?.trim() || !content?.trim()) {
    res.status(400).json({ error: "Заполните поля" }); return;
  }

  const db = getDb();
  const result = db
    .prepare("INSERT INTO news (title, content, image_url, is_pinned, created_by) VALUES (?, ?, ?, ?, ?)")
    .run(title.trim(), content.trim(), imageUrl ?? null, isPinned ? 1 : 0, user.id);

  const id = result.lastInsertRowid as number;
  const row = db.prepare("SELECT * FROM news WHERE id = ?").get(id) as any;
  res.status(201).json(formatNews(row));
});

// PATCH /news/:id
router.patch("/news/:id", requireAdmin, (req, res) => {
  const db = getDb();
  const id = Number(req.params.id);
  const body = req.body ?? {};

  const sets: string[] = [];
  const params: any[] = [];
  if (body.title !== undefined) { sets.push("title = ?"); params.push(body.title); }
  if (body.content !== undefined) { sets.push("content = ?"); params.push(body.content); }
  if (body.imageUrl !== undefined) { sets.push("image_url = ?"); params.push(body.imageUrl); }
  if (body.isPinned !== undefined) { sets.push("is_pinned = ?"); params.push(body.isPinned ? 1 : 0); }

  if (sets.length) {
    db.prepare(`UPDATE news SET ${sets.join(", ")} WHERE id = ?`).run(...params, id);
  }

  const row = db.prepare("SELECT * FROM news WHERE id = ?").get(id) as any;
  if (!row) { res.status(404).json({ error: "Новость не найдена" }); return; }
  res.json(formatNews(row));
});

// DELETE /news/:id
router.delete("/news/:id", requireAdmin, (req, res) => {
  getDb().prepare("DELETE FROM news WHERE id = ?").run(Number(req.params.id));
  res.status(204).send();
});

export default router;

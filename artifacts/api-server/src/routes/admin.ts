import { Router } from "express";
import crypto from "node:crypto";
import { getDb } from "../lib/db";
import { requireAdmin, formatUser } from "../lib/auth";
import type { AuthUser } from "../lib/auth";

const router = Router();

function formatInviteLink(row: any) {
  return {
    id: row.id as number,
    token: row.token as string,
    role: row.role as string,
    usedAt: row.used_at ?? null,
    createdAt: row.created_at as string,
  };
}

function formatLotAdmin(row: any) {
  return {
    id: row.id as number,
    title: row.title as string,
    description: row.description ?? null,
    imageUrl: row.image_url ?? null,
    sectionType: row.section_type as string,
    groupId: row.group_id as number,
    themeId: row.theme_id as number,
    status: row.status as string,
    format: row.format as string,
    price: row.price != null ? (row.price as number) : null,
    marketValue: row.market_value != null ? (row.market_value as number) : null,
    bidMin: row.bid_min != null ? (row.bid_min as number) : null,
    bidMax: row.bid_max != null ? (row.bid_max as number) : null,
    expiresAt: row.expires_at ?? null,
    createdAt: row.created_at as string,
    createdBy: row.created_by as number,
    bidsCount: (row.bids_count as number) ?? 0,
    isRestored: row.is_restored ?? null,
    hasBell: row.has_bell ?? null,
    hasDefects: row.has_defects ?? null,
    weight: row.weight ?? null,
  };
}

// GET /admin/users
router.get("/admin/users", requireAdmin, (_req, res) => {
  const db = getDb();
  const rows = db.prepare("SELECT * FROM users ORDER BY created_at DESC").all() as any[];
  res.json(rows.map(formatUser));
});

// PATCH /admin/users/:id
router.patch("/admin/users/:id", requireAdmin, (req, res) => {
  const db = getDb();
  const id = Number(req.params.id);
  const body = req.body ?? {};

  const sets: string[] = [];
  const params: any[] = [];
  if (body.role !== undefined) { sets.push("role = ?"); params.push(body.role); }
  if (body.isBanned !== undefined) {
    sets.push("is_banned = ?");
    params.push(body.isBanned ? 1 : 0);
    sets.push("ban_reason = ?");
    params.push(body.isBanned ? (body.banReason ?? null) : null);
  }
  if (body.login !== undefined) { sets.push("login = ?"); params.push(body.login); }

  if (sets.length) {
    db.prepare(`UPDATE users SET ${sets.join(", ")} WHERE id = ?`).run(...params, id);
  }

  const row = db.prepare("SELECT * FROM users WHERE id = ?").get(id) as any;
  if (!row) { res.status(404).json({ error: "Пользователь не найден" }); return; }
  res.json(formatUser(row));
});

// GET /admin/lots — all lots regardless of status, with optional status filter & pagination
router.get("/admin/lots", requireAdmin, (req, res) => {
  const db = getDb();
  const { status, page = "1" } = req.query as Record<string, string>;
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limit = 50;
  const offset = (pageNum - 1) * limit;

  const where: string[] = ["1=1"];
  const params: any[] = [];
  if (status) { where.push("l.status = ?"); params.push(status); }
  const whereStr = where.join(" AND ");

  const total = (db.prepare(`SELECT COUNT(*) as cnt FROM lots l WHERE ${whereStr}`).get(...params) as any).cnt;
  const rows = db
    .prepare(
      `SELECT l.*, COUNT(b.id) as bids_count FROM lots l
       LEFT JOIN bids b ON b.lot_id = l.id
       WHERE ${whereStr} GROUP BY l.id ORDER BY l.created_at DESC LIMIT ? OFFSET ?`
    )
    .all(...params, limit, offset) as any[];

  res.json({ lots: rows.map(formatLotAdmin), total: total as number });
});

// GET /admin/invite-links
router.get("/admin/invite-links", requireAdmin, (_req, res) => {
  const db = getDb();
  const rows = db.prepare("SELECT * FROM invite_links ORDER BY created_at DESC").all() as any[];
  res.json(rows.map(formatInviteLink));
});

// POST /admin/invite-links
router.post("/admin/invite-links", requireAdmin, (req, res) => {
  const user: AuthUser = (req as any).user;
  const { role } = req.body ?? {};
  if (!["dealer", "collector"].includes(role)) {
    res.status(400).json({ error: "Укажите роль: dealer или collector" }); return;
  }

  const db = getDb();
  const token = crypto.randomBytes(32).toString("hex");
  const result = db
    .prepare("INSERT INTO invite_links (token, role, created_by) VALUES (?, ?, ?)")
    .run(token, role, user.id);

  const id = result.lastInsertRowid as number;
  const link = db.prepare("SELECT * FROM invite_links WHERE id = ?").get(id) as any;
  res.status(201).json(formatInviteLink(link));
});

export default router;

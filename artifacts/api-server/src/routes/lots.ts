import { Router } from "express";
import { getDb } from "../lib/db";
import { requireAuth } from "../lib/auth";
import type { AuthUser } from "../lib/auth";

const router = Router();

function formatLot(row: any) {
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

// GET /lots
router.get("/lots", requireAuth, (req, res) => {
  const user: AuthUser = (req as any).user;
  const db = getDb();

  const { groupId, sectionType, themeId, sortBy = "newest", page = "1" } = req.query as Record<string, string>;
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limit = 20;
  const offset = (pageNum - 1) * limit;

  const where: string[] = ["l.status = 'active'"];
  const params: any[] = [];

  if (user.role === "collector") where.push("l.section_type = 'auction'");
  if (groupId) { where.push("l.group_id = ?"); params.push(Number(groupId)); }
  if (sectionType) { where.push("l.section_type = ?"); params.push(sectionType); }
  if (themeId) { where.push("l.theme_id = ?"); params.push(Number(themeId)); }

  const whereStr = where.join(" AND ");
  const orderMap: Record<string, string> = {
    newest: "l.created_at DESC",
    oldest: "l.created_at ASC",
    price_asc: "l.price ASC",
    price_desc: "l.price DESC",
    expiry: "l.expires_at ASC",
  };
  const order = orderMap[sortBy] ?? "l.created_at DESC";

  const total = (db.prepare(`SELECT COUNT(*) as cnt FROM lots l WHERE ${whereStr}`).get(...params) as any).cnt;

  const rows = db
    .prepare(
      `SELECT l.*, COUNT(b.id) as bids_count FROM lots l
       LEFT JOIN bids b ON b.lot_id = l.id
       WHERE ${whereStr} GROUP BY l.id ORDER BY ${order} LIMIT ? OFFSET ?`
    )
    .all(...params, limit, offset) as any[];

  res.json({ lots: rows.map(formatLot), total: total as number });
});

// POST /lots
router.post("/lots", requireAuth, (req, res) => {
  const user: AuthUser = (req as any).user;
  const body = req.body ?? {};
  const { sectionType, title, format = "fixed", marketValue, groupId, themeId, expiresAt,
          description, imageUrl, isRestored, hasBell, hasDefects, weight, price } = body;

  if (user.role === "collector" && sectionType !== "auction") {
    res.status(403).json({ error: "Коллекционеры могут создавать лоты только в разделе аукционов" });
    return;
  }
  if (user.role === "dealer" && sectionType === "auction") {
    res.status(403).json({ error: "Дилеры не могут создавать лоты в разделе аукционов" });
    return;
  }
  if (!title?.trim()) {
    res.status(400).json({ error: "Укажите название" });
    return;
  }

  const mv = marketValue ? Number(marketValue) : 0;
  let bidMin: number | null = null;
  let bidMax: number | null = null;
  if (format === "range" && mv > 0) {
    bidMin = mv;
    bidMax = Math.round(mv * 1.3);
  }

  const db = getDb();
  const result = db
    .prepare(
      `INSERT INTO lots (title, description, image_url, section_type, group_id, theme_id, format,
        price, market_value, bid_min, bid_max, expires_at, created_by, is_restored, has_bell, has_defects, weight)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      title.trim(),
      description ?? null,
      imageUrl ?? null,
      sectionType,
      Number(groupId),
      Number(themeId),
      format,
      price != null ? Number(price) : null,
      mv || null,
      bidMin,
      bidMax,
      expiresAt ?? null,
      user.id,
      isRestored ?? null,
      hasBell ?? null,
      hasDefects ?? null,
      weight ?? null
    );

  const id = result.lastInsertRowid as number;
  db.prepare(
    "INSERT INTO activity_log (type, description, user_id, ref_id) VALUES (?, ?, ?, ?)"
  ).run("lot_created", "Новый лот в разделе", user.id, id);

  const row = db.prepare("SELECT l.*, 0 as bids_count FROM lots l WHERE l.id = ?").get(id) as any;
  res.status(201).json(formatLot(row));
});

// GET /lots/:id
router.get("/lots/:id", requireAuth, (req, res) => {
  const db = getDb();
  const row = db
    .prepare(
      "SELECT l.*, COUNT(b.id) as bids_count FROM lots l LEFT JOIN bids b ON b.lot_id = l.id WHERE l.id = ? GROUP BY l.id"
    )
    .get(Number(req.params.id)) as any;
  if (!row) {
    res.status(404).json({ error: "Лот не найден" });
    return;
  }
  res.json(formatLot(row));
});

// PATCH /lots/:id
router.patch("/lots/:id", requireAuth, (req, res) => {
  const user: AuthUser = (req as any).user;
  const db = getDb();
  const id = Number(req.params.id);

  const lot = db.prepare("SELECT * FROM lots WHERE id = ?").get(id) as any;
  if (!lot) { res.status(404).json({ error: "Лот не найден" }); return; }
  if (lot.created_by !== user.id && user.role !== "admin") {
    res.status(403).json({ error: "Нет прав" }); return;
  }

  const body = req.body ?? {};
  const sets: string[] = [];
  const params: any[] = [];
  if (body.title !== undefined) { sets.push("title = ?"); params.push(body.title); }
  if (body.status !== undefined) { sets.push("status = ?"); params.push(body.status); }
  if (body.description !== undefined) { sets.push("description = ?"); params.push(body.description); }
  if (body.expiresAt !== undefined) { sets.push("expires_at = ?"); params.push(body.expiresAt); }

  if (sets.length) {
    db.prepare(`UPDATE lots SET ${sets.join(", ")} WHERE id = ?`).run(...params, id);
  }

  const updated = db.prepare("SELECT l.*, 0 as bids_count FROM lots l WHERE l.id = ?").get(id) as any;
  res.json(formatLot(updated));
});

// DELETE /lots/:id
router.delete("/lots/:id", requireAuth, (req, res) => {
  const user: AuthUser = (req as any).user;
  const db = getDb();
  const id = Number(req.params.id);

  const lot = db.prepare("SELECT * FROM lots WHERE id = ?").get(id) as any;
  if (!lot) { res.status(404).json({ error: "Лот не найден" }); return; }
  if (lot.created_by !== user.id && user.role !== "admin") {
    res.status(403).json({ error: "Нет прав" }); return;
  }

  db.exec("BEGIN");
  try {
    db.prepare("DELETE FROM bids WHERE lot_id = ?").run(id);
    db.prepare("DELETE FROM cart_items WHERE lot_id = ?").run(id);
    db.prepare("DELETE FROM lots WHERE id = ?").run(id);
    db.exec("COMMIT");
  } catch (e) {
    db.exec("ROLLBACK");
    throw e;
  }
  res.status(204).send();
});

// POST /lots/:id/purchase
router.post("/lots/:id/purchase", requireAuth, (req, res) => {
  const user: AuthUser = (req as any).user;
  const db = getDb();
  const id = Number(req.params.id);

  const lot = db
    .prepare("SELECT * FROM lots WHERE id = ? AND status = 'active' AND format = 'fixed'")
    .get(id) as any;
  if (!lot) { res.status(404).json({ error: "Лот не найден или недоступен" }); return; }
  if (lot.created_by === user.id) {
    res.status(400).json({ error: "Нельзя приобрести собственный лот" });
    return;
  }

  db.prepare("UPDATE lots SET status = 'sold' WHERE id = ?").run(id);
  db.prepare(
    "INSERT INTO orders (buyer_id, seller_id, lot_id, amount, buyer_info) VALUES (?, ?, ?, ?, ?)"
  ).run(user.id, lot.created_by, id, lot.price, req.body?.buyerInfo ?? "");
  db.prepare(
    "INSERT INTO activity_log (type, description, user_id, ref_id) VALUES (?, ?, ?, ?)"
  ).run("lot_sold", "Продан лот", user.id, id);

  res.json({ success: true });
});

export default router;

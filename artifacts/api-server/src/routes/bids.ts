import { Router } from "express";
import { getDb } from "../lib/db";
import { requireAuth, requireAdmin } from "../lib/auth";
import type { AuthUser } from "../lib/auth";

const router = Router();

function formatBid(row: any) {
  return {
    id: row.id as number,
    lotId: row.lot_id as number,
    userId: row.user_id as number,
    amount: row.amount as number,
    isBlitz: Boolean(row.is_blitz),
    createdAt: row.created_at as string,
  };
}

// GET /lots/:id/bids  (admin only)
router.get("/lots/:id/bids", requireAdmin, (req, res) => {
  const db = getDb();
  const rows = db
    .prepare("SELECT * FROM bids WHERE lot_id = ? ORDER BY created_at DESC")
    .all(Number(req.params.id)) as any[];
  res.json(rows.map(formatBid));
});

// POST /lots/:id/bids
router.post("/lots/:id/bids", requireAuth, (req, res) => {
  const user: AuthUser = (req as any).user;
  if (user.role === "collector") {
    res.status(403).json({ error: "Коллекционеры не могут делать ставки" });
    return;
  }

  const db = getDb();
  const lotId = Number(req.params.id);
  const amount = Number(req.body?.amount ?? 0);
  if (!amount) { res.status(400).json({ error: "Укажите сумму ставки" }); return; }

  const lot = db.prepare("SELECT * FROM lots WHERE id = ? AND status = 'active'").get(lotId) as any;
  if (!lot) { res.status(404).json({ error: "Лот не найден или недоступен" }); return; }

  if (!["auction", "exclusive"].includes(lot.section_type) || lot.format !== "range") {
    res.status(400).json({ error: "Ставки доступны только в аукционном формате" });
    return;
  }

  if (lot.expires_at && new Date(lot.expires_at + " UTC").getTime() <= Date.now()) {
    db.prepare("UPDATE lots SET status = 'expired' WHERE id = ?").run(lotId);
    res.status(400).json({ error: "Время приёма ставок истекло" });
    return;
  }

  if (lot.bid_min && amount < lot.bid_min) {
    res.status(400).json({ error: `Ставка ниже минимума (${lot.bid_min} ₽)` }); return;
  }
  if (lot.bid_max && amount > lot.bid_max) {
    res.status(400).json({ error: `Ставка выше максимума (${lot.bid_max} ₽)` }); return;
  }

  const existing = db.prepare("SELECT id FROM bids WHERE lot_id = ? AND user_id = ?").get(lotId, user.id);
  if (existing) { res.status(400).json({ error: "Вы уже сделали ставку на этот лот" }); return; }

  const isBlitz = lot.bid_max && amount >= lot.bid_max ? 1 : 0;

  const result = db
    .prepare("INSERT INTO bids (lot_id, user_id, amount, is_blitz) VALUES (?, ?, ?, ?)")
    .run(lotId, user.id, amount, isBlitz);
  const bidId = result.lastInsertRowid as number;

  if (isBlitz) {
    db.prepare("UPDATE lots SET status = 'blitzed' WHERE id = ?").run(lotId);
    db.prepare(
      "INSERT INTO activity_log (type, description, user_id, ref_id) VALUES (?, ?, ?, ?)"
    ).run("blitz", "БЛИЦ в аукционе", user.id, lotId);
  }

  db.prepare(
    "INSERT INTO activity_log (type, description, user_id, ref_id) VALUES (?, ?, ?, ?)"
  ).run("bid_placed", "Новая ставка в аукционе", user.id, lotId);

  const bid = db.prepare("SELECT * FROM bids WHERE id = ?").get(bidId) as any;
  res.status(201).json(formatBid(bid));
});

export default router;

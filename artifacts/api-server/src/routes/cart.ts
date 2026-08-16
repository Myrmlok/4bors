import { Router } from "express";
import { getDb } from "../lib/db";
import { requireAuth } from "../lib/auth";
import type { AuthUser } from "../lib/auth";

const router = Router();

// GET /cart
router.get("/cart", requireAuth, (req, res) => {
  const user: AuthUser = (req as any).user;
  const db = getDb();

  const rows = db
    .prepare(
      `SELECT c.id, c.lot_id, l.title, l.price, l.image_url
       FROM cart_items c
       JOIN lots l ON l.id = c.lot_id
       WHERE c.user_id = ? AND l.status = 'active'`
    )
    .all(user.id) as any[];

  let total = 0;
  const items = rows.map((r) => {
    total += r.price as number;
    return {
      id: r.id as number,
      lotId: r.lot_id as number,
      title: r.title as string,
      price: r.price as number,
      imageUrl: r.image_url ?? null,
    };
  });

  res.json({ items, total });
});

// POST /cart/items
router.post("/cart/items", requireAuth, (req, res) => {
  const user: AuthUser = (req as any).user;
  const lotId = Number(req.body?.lotId ?? 0);
  if (!lotId) { res.status(400).json({ error: "Укажите лот" }); return; }

  const db = getDb();
  const lot = db
    .prepare("SELECT * FROM lots WHERE id = ? AND status = 'active' AND format = 'fixed'")
    .get(lotId);
  if (!lot) { res.status(400).json({ error: "Лот недоступен" }); return; }

  db.prepare("INSERT OR IGNORE INTO cart_items (user_id, lot_id) VALUES (?, ?)").run(user.id, lotId);
  res.status(201).json({ success: true });
});

// DELETE /cart/items/:id
router.delete("/cart/items/:id", requireAuth, (req, res) => {
  const user: AuthUser = (req as any).user;
  getDb().prepare("DELETE FROM cart_items WHERE id = ? AND user_id = ?").run(Number(req.params.id), user.id);
  res.status(204).send();
});

// POST /cart/checkout
router.post("/cart/checkout", requireAuth, (req, res) => {
  const user: AuthUser = (req as any).user;
  const db = getDb();

  const items = db
    .prepare(
      `SELECT c.id as cart_id, l.id as lot_id, l.title, l.price, l.created_by
       FROM cart_items c
       JOIN lots l ON l.id = c.lot_id
       WHERE c.user_id = ? AND l.status = 'active'`
    )
    .all(user.id) as any[];

  if (!items.length) { res.status(400).json({ error: "Корзина пуста" }); return; }

  const buyerInfo = req.body?.buyerInfo ?? "";
  let orderId: number | null = null;

  for (const item of items) {
    db.prepare("UPDATE lots SET status = 'sold' WHERE id = ?").run(item.lot_id);
    const result = db
      .prepare("INSERT INTO orders (buyer_id, seller_id, lot_id, amount, buyer_info) VALUES (?, ?, ?, ?, ?)")
      .run(user.id, item.created_by, item.lot_id, item.price, buyerInfo);
    if (!orderId) orderId = result.lastInsertRowid as number;
  }

  db.prepare("DELETE FROM cart_items WHERE user_id = ?").run(user.id);
  res.json({ success: true, orderId: orderId as number });
});

export default router;

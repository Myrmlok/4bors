import { Router } from "express";
import { getDb } from "../lib/db";
import { requireAuth } from "../lib/auth";
import type { AuthUser } from "../lib/auth";

const router = Router();

// GET /users/me/bids — current user's bid history
router.get("/users/me/bids", requireAuth, (req, res) => {
  const user: AuthUser = (req as any).user;
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT b.id, b.lot_id, b.amount, b.is_blitz, b.created_at,
              l.title as lot_title, l.status as lot_status
       FROM bids b
       JOIN lots l ON l.id = b.lot_id
       WHERE b.user_id = ?
       ORDER BY b.created_at DESC`
    )
    .all(user.id) as any[];

  res.json(
    rows.map((r) => ({
      id: r.id as number,
      lotId: r.lot_id as number,
      lotTitle: r.lot_title as string,
      lotStatus: r.lot_status as string,
      amount: r.amount as number,
      isBlitz: Boolean(r.is_blitz),
      createdAt: r.created_at as string,
    }))
  );
});

// GET /users/me/orders — current user's purchase history
router.get("/users/me/orders", requireAuth, (req, res) => {
  const user: AuthUser = (req as any).user;
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT o.id, o.lot_id, o.amount, o.created_at,
              l.title as lot_title, l.image_url
       FROM orders o
       JOIN lots l ON l.id = o.lot_id
       WHERE o.buyer_id = ?
       ORDER BY o.created_at DESC`
    )
    .all(user.id) as any[];

  res.json(
    rows.map((r) => ({
      id: r.id as number,
      lotId: r.lot_id as number,
      lotTitle: r.lot_title as string,
      imageUrl: r.image_url ?? null,
      amount: r.amount as number,
      createdAt: r.created_at as string,
    }))
  );
});

export default router;

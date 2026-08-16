import { Router } from "express";
import { getDb } from "../lib/db";
import { requireAuth, requireAdmin, getAuthUser, timeAgo } from "../lib/auth";

const router = Router();

// GET /activity
router.get("/activity", requireAuth, (_req, res) => {
  const db = getDb();
  const rows = db
    .prepare("SELECT * FROM activity_log ORDER BY created_at DESC LIMIT 20")
    .all() as any[];

  res.json(
    rows.map((r) => ({
      id: r.id as number,
      type: r.type as string,
      description: r.description as string,
      createdAt: r.created_at as string,
      timeAgo: timeAgo(r.created_at),
    }))
  );
});

// GET /stats/online
router.get("/stats/online", (req, res) => {
  getAuthUser(req); // soft — updates last_seen if authenticated
  const db = getDb();
  const count = (
    db
      .prepare("SELECT COUNT(*) as cnt FROM online_sessions WHERE last_seen > datetime('now', '-5 minutes')")
      .get() as any
  ).cnt;
  res.json({ count: count as number });
});

// GET /stats/dashboard
router.get("/stats/dashboard", requireAdmin, (_req, res) => {
  const db = getDb();
  const totalUsers = (db.prepare("SELECT COUNT(*) as cnt FROM users").get() as any).cnt;
  const activeLots = (db.prepare("SELECT COUNT(*) as cnt FROM lots WHERE status = 'active'").get() as any).cnt;
  const activeStickers = (db.prepare("SELECT COUNT(*) as cnt FROM stickers WHERE status = 'active'").get() as any).cnt;
  const totalThemes = (db.prepare("SELECT COUNT(*) as cnt FROM themes WHERE is_active = 1").get() as any).cnt;

  res.json({
    totalUsers: totalUsers as number,
    activeLots: activeLots as number,
    activeStickers: activeStickers as number,
    totalThemes: totalThemes as number,
  });
});

export default router;

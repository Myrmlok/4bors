import { Router } from "express";
import { getDb } from "../lib/db";
import { requireAuth } from "../lib/auth";

const router = Router();

function formatTheme(row: any) {
  return {
    id: row.id as number,
    name: row.name as string,
    slug: row.slug as string,
    imageUrl: row.image_url ?? null,
    order: row.sort_order as number,
    isActive: Boolean(row.is_active),
  };
}

// GET /themes
router.get("/themes", requireAuth, (_req, res) => {
  const db = getDb();
  const rows = db.prepare("SELECT * FROM themes ORDER BY sort_order").all() as any[];
  res.json(rows.map(formatTheme));
});

// GET /themes/:id
router.get("/themes/:id", requireAuth, (req, res) => {
  const db = getDb();
  const row = db.prepare("SELECT * FROM themes WHERE id = ?").get(Number(req.params.id)) as any;
  if (!row) {
    res.status(404).json({ error: "Тематика не найдена" });
    return;
  }
  res.json(formatTheme(row));
});

// GET /themes/:themeId/groups
router.get("/themes/:themeId/groups", requireAuth, (req, res) => {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT g.*, COUNT(l.id) as lots_count
       FROM groups g
       LEFT JOIN lots l ON l.group_id = g.id AND l.status = 'active'
       WHERE g.theme_id = ?
       GROUP BY g.id
       ORDER BY g.sort_order`
    )
    .all(Number(req.params.themeId)) as any[];

  res.json(
    rows.map((r) => ({
      id: r.id as number,
      themeId: r.theme_id as number,
      name: r.name as string,
      order: r.sort_order as number,
      lotsCount: r.lots_count as number,
    }))
  );
});

export default router;

import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";
import { getDb } from "./db";

const JWT_SECRET = process.env.JWT_SECRET ?? "4bor_club_jwt_secret_2024_very_long_and_secure_key";
const JWT_EXPIRY = 60 * 60 * 24 * 30; // 30 days in seconds

export interface AuthUser {
  id: number;
  login: string;
  email: string;
  role: string;
  is_banned: number;
  ban_reason: string | null;
  created_at: string;
}

export function createToken(payload: { userId: number; role: string }): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY });
}

export function verifyToken(token: string): { userId: number; role: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: number; role: string };
  } catch {
    return null;
  }
}

export function getAuthUser(req: Request): AuthUser | null {
  const auth = req.headers.authorization ?? "";
  if (!auth.startsWith("Bearer ")) return null;
  const token = auth.slice(7);
  const payload = verifyToken(token);
  if (!payload) return null;

  const db = getDb();
  const user = db
    .prepare("SELECT id, login, email, role, is_banned, ban_reason, created_at FROM users WHERE id = ?")
    .get(payload.userId) as AuthUser | undefined;
  if (!user) return null;

  // Update last seen
  db.prepare("INSERT OR REPLACE INTO online_sessions (user_id, last_seen) VALUES (?, datetime('now'))").run(user.id);

  return user;
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const user = getAuthUser(req);
  if (!user) {
    res.status(401).json({ error: "Не авторизован" });
    return;
  }
  if (user.is_banned) {
    res.status(403).json({ error: "Аккаунт заблокирован", reason: user.ban_reason });
    return;
  }
  (req as any).user = user;
  next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  requireAuth(req, res, () => {
    const user: AuthUser = (req as any).user;
    if (user.role !== "admin") {
      res.status(403).json({ error: "Недостаточно прав" });
      return;
    }
    next();
  });
}

export function formatUser(user: AuthUser) {
  return {
    id: user.id,
    login: user.login,
    email: user.email,
    role: user.role,
    isBanned: Boolean(user.is_banned),
    banReason: user.ban_reason ?? null,
    createdAt: user.created_at,
  };
}

export function timeAgo(datetime: string): string {
  const diff = Math.floor((Date.now() - new Date(datetime + " UTC").getTime()) / 1000);
  if (diff < 60) return "только что";
  if (diff < 3600) return `${Math.floor(diff / 60)} мин. назад`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} ч. назад`;
  return `${Math.floor(diff / 86400)} дн. назад`;
}

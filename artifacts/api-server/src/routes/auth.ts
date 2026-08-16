import { Router } from "express";
import bcrypt from "bcryptjs";
import { getDb } from "../lib/db";
import { requireAuth, getAuthUser, createToken, formatUser } from "../lib/auth";
import type { AuthUser } from "../lib/auth";

const router = Router();

// POST /auth/login
router.post("/auth/login", (req, res) => {
  const { login, password } = req.body ?? {};
  if (!login?.trim() || !password) {
    res.status(400).json({ error: "Введите логин и пароль" });
    return;
  }

  const db = getDb();
  const user = db
    .prepare("SELECT * FROM users WHERE login = ? OR email = ?")
    .get(login.trim(), login.trim()) as any;

  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    res.status(401).json({ error: "Неверный логин или пароль" });
    return;
  }
  if (user.is_banned) {
    res.status(403).json({ error: "Аккаунт заблокирован: " + user.ban_reason });
    return;
  }

  const token = createToken({ userId: user.id, role: user.role });
  res.json({ token, user: formatUser(user) });
});

// POST /auth/logout
router.post("/auth/logout", (req, res) => {
  const user = getAuthUser(req);
  if (user) {
    getDb().prepare("DELETE FROM online_sessions WHERE user_id = ?").run(user.id);
  }
  res.json({ success: true });
});

// GET /auth/me
router.get("/auth/me", requireAuth, (req, res) => {
  res.json(formatUser((req as any).user as AuthUser));
});

// GET /auth/invite/:token
router.get("/auth/invite/:token", (req, res) => {
  const db = getDb();
  const link = db.prepare("SELECT * FROM invite_links WHERE token = ?").get(req.params.token) as any;
  if (!link) {
    res.status(404).json({ error: "Ссылка не найдена" });
    return;
  }
  res.json({ role: link.role, token: link.token, usedAt: link.used_at ?? null });
});

// POST /auth/register
router.post("/auth/register", (req, res) => {
  const { token, email, password, login } = req.body ?? {};
  if (!token?.trim() || !email?.trim() || !password) {
    res.status(400).json({ error: "Заполните все поля" });
    return;
  }
  if (password.length < 6) {
    res.status(400).json({ error: "Пароль минимум 6 символов" });
    return;
  }
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRe.test(email.trim())) {
    res.status(400).json({ error: "Некорректный email" });
    return;
  }

  const db = getDb();
  const invite = db
    .prepare("SELECT * FROM invite_links WHERE token = ? AND used_at IS NULL")
    .get(token.trim()) as any;
  if (!invite) {
    res.status(400).json({ error: "Ссылка недействительна или уже использована" });
    return;
  }

  const effectiveLogin = login?.trim() || "user_" + Math.random().toString(36).slice(2, 10);

  const exists = db
    .prepare("SELECT id FROM users WHERE email = ? OR login = ?")
    .get(email.trim(), effectiveLogin);
  if (exists) {
    res.status(400).json({ error: "Email или логин уже зарегистрированы" });
    return;
  }

  const hash = bcrypt.hashSync(password, 10);
  const result = db
    .prepare("INSERT INTO users (login, email, password_hash, role) VALUES (?, ?, ?, ?)")
    .run(effectiveLogin, email.trim(), hash, invite.role);
  const userId = result.lastInsertRowid as number;

  db.prepare("UPDATE invite_links SET used_by = ?, used_at = datetime('now') WHERE token = ?").run(
    userId,
    token.trim()
  );
  db.prepare(
    "INSERT INTO activity_log (type, description, user_id) VALUES (?, ?, ?)"
  ).run("user_joined", "Новый участник в Клубе", userId);

  const newUser = db.prepare("SELECT * FROM users WHERE id = ?").get(userId) as any;
  const jwtToken = createToken({ userId, role: invite.role });
  res.status(201).json({ token: jwtToken, user: formatUser(newUser) });
});

export default router;

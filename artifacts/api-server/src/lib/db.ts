import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import fs from "node:fs";
import bcrypt from "bcryptjs";

const DATA_DIR = path.resolve(process.cwd(), "data");
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const DB_PATH = process.env.DB_PATH ?? path.join(DATA_DIR, "4bor.db");

let _db: DatabaseSync | null = null;

export function getDb(): DatabaseSync {
  if (!_db) {
    _db = new DatabaseSync(DB_PATH);
    _db.exec("PRAGMA journal_mode = WAL");
    _db.exec("PRAGMA foreign_keys = ON");
    initSchema(_db);
  }
  return _db;
}

function initSchema(db: DatabaseSync): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      login TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'collector',
      is_banned INTEGER NOT NULL DEFAULT 0,
      ban_reason TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS invite_links (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      token TEXT NOT NULL UNIQUE,
      role TEXT NOT NULL,
      created_by INTEGER,
      used_by INTEGER,
      used_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS themes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      image_url TEXT,
      sort_order INTEGER NOT NULL DEFAULT 0,
      is_active INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS groups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      theme_id INTEGER NOT NULL REFERENCES themes(id),
      name TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS lots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      image_url TEXT,
      section_type TEXT NOT NULL,
      group_id INTEGER NOT NULL,
      theme_id INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      format TEXT NOT NULL DEFAULT 'fixed',
      price INTEGER,
      market_value INTEGER,
      bid_min INTEGER,
      bid_max INTEGER,
      expires_at TEXT,
      created_by INTEGER NOT NULL,
      is_restored TEXT,
      has_bell TEXT,
      has_defects TEXT,
      weight TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS bids (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lot_id INTEGER NOT NULL REFERENCES lots(id),
      user_id INTEGER NOT NULL REFERENCES users(id),
      amount INTEGER NOT NULL,
      is_blitz INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS stickers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      budget INTEGER NOT NULL,
      image_url TEXT,
      contact_email TEXT,
      created_by INTEGER NOT NULL REFERENCES users(id),
      expires_at TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      close_comment TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS sticker_responses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sticker_id INTEGER NOT NULL REFERENCES stickers(id),
      user_id INTEGER NOT NULL REFERENCES users(id),
      comment TEXT NOT NULL,
      image_url TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS news (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      image_url TEXT,
      is_pinned INTEGER NOT NULL DEFAULT 0,
      created_by INTEGER,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS activity_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      description TEXT NOT NULL,
      user_id INTEGER,
      ref_id INTEGER,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS cart_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      lot_id INTEGER NOT NULL UNIQUE,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      buyer_id INTEGER NOT NULL,
      seller_id INTEGER,
      lot_id INTEGER NOT NULL,
      amount INTEGER NOT NULL,
      buyer_info TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS online_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL UNIQUE,
      last_seen TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  seedDefaults(db);
}

function seedDefaults(db: DatabaseSync): void {
  const adminExists = db.prepare("SELECT id FROM users WHERE role = 'admin' LIMIT 1").get();
  if (!adminExists) {
    const hash = bcrypt.hashSync("admin123", 10);
    db.prepare(
      "INSERT OR IGNORE INTO users (login, email, password_hash, role) VALUES (?, ?, ?, ?)"
    ).run("admin", "admin@4bor.ru", hash, "admin");

    const adminRow = db.prepare("SELECT id FROM users WHERE login = 'admin'").get() as any;
    if (adminRow) {
      db.prepare(
        "INSERT INTO activity_log (type, description, user_id) VALUES (?, ?, ?)"
      ).run("user_joined", "Администратор зарегистрирован", adminRow.id);
    }
  }

  const themesExist = db.prepare("SELECT id FROM themes LIMIT 1").get();
  if (!themesExist) {
    const themes = [
      { name: "Средневековые монеты", slug: "medieval-coins", sort_order: 1 },
      { name: "Уделы", slug: "udely", sort_order: 2 },
      { name: "Металлопластика", slug: "metaloplastika", sort_order: 3 },
      { name: "Российская империя", slug: "russian-empire", sort_order: 4 },
      { name: "Восток", slug: "vostok", sort_order: 5 },
    ];
    const insertTheme = db.prepare(
      "INSERT INTO themes (name, slug, sort_order, is_active) VALUES (?, ?, ?, 1)"
    );
    const insertGroup = db.prepare(
      "INSERT INTO groups (theme_id, name, sort_order) VALUES (?, ?, ?)"
    );

    for (const theme of themes) {
      const result = insertTheme.run(theme.name, theme.slug, theme.sort_order);
      const themeId = result.lastInsertRowid as number;
      for (let i = 1; i <= 4; i++) {
        insertGroup.run(themeId, `Группа 0${i}`, i);
      }
    }

    const adminRow = db.prepare("SELECT id FROM users WHERE login = 'admin'").get() as any;
    const adminId = adminRow?.id ?? 1;

    // Seed a small working catalog so the first club session is useful.
    // Images are local, reusable club assets and keep the demo independent
    // from third-party image services.
    const groupRows = db
      .prepare("SELECT id, theme_id, sort_order FROM groups ORDER BY theme_id, sort_order")
      .all() as Array<{ id: number; theme_id: number; sort_order: number }>;
    const themeRows = db
      .prepare("SELECT id, slug FROM themes ORDER BY sort_order")
      .all() as Array<{ id: number; slug: string }>;
    const groupFor = (themeId: number, sortOrder: number) =>
      groupRows.find((group) => group.theme_id === themeId && group.sort_order === sortOrder)?.id ?? 1;
    const themeFor = (slug: string) =>
      themeRows.find((theme) => theme.slug === slug)?.id ?? themeRows[0]?.id ?? 1;

    const insertLot = db.prepare(
      `INSERT INTO lots (
        title, description, image_url, section_type, group_id, theme_id, status, format,
        price, market_value, bid_min, bid_max, expires_at, created_by,
        is_restored, has_bell, has_defects, weight
      ) VALUES (?, ?, ?, ?, ?, ?, 'active', ?, ?, ?, ?, ?, datetime('now', ?), ?, ?, ?, ?, ?)`
    );
    const seededLots = [
      {
        title: "Дирхем Саманидов. Нишапур, X век",
        description: "Серебряный дирхем с читаемой легендой и выразительной патиной. Лот сопровождается подробной атрибуцией.",
        image: "/images/news-1.jpg",
        section: "auction",
        theme: "medieval-coins",
        group: 1,
        format: "range",
        price: null,
        market: 48000,
        min: 48000,
        max: 62400,
        days: "+6 days",
        restored: "Нет",
        bell: "Да",
        defects: "Нет",
        weight: "2.8",
      },
      {
        title: "Денга Великого княжества Московского",
        description: "Редкий тип с хорошо читаемым знаком монетного двора. Тихий аукцион для участников Клуба.",
        image: "/images/theme-medieval.jpg",
        section: "auction",
        theme: "medieval-coins",
        group: 2,
        format: "range",
        price: null,
        market: 32000,
        min: 32000,
        max: 41600,
        days: "+4 days",
        restored: "Не знаю",
        bell: "Да",
        defects: "Нет",
        weight: "0.7",
      },
      {
        title: "Чешский грош Вацлава II",
        description: "Коллекционный экземпляр с мягкой серебряной патиной. Крупный формат, приятная детализация поля.",
        image: "/images/news-2.jpg",
        section: "auction",
        theme: "udely",
        group: 1,
        format: "range",
        price: null,
        market: 27500,
        min: 27500,
        max: 35750,
        days: "+8 days",
        restored: "Нет",
        bell: "Да",
        defects: "Незначительные потёртости",
        weight: "3.1",
      },
      {
        title: "Подборка удельных монет. 4 экземпляра",
        description: "Подборка для начинающей коллекции: разные типы, аккуратная сортировка и единая атрибуция.",
        image: "/images/theme-udels.jpg",
        section: "exclusive",
        theme: "udely",
        group: 3,
        format: "fixed",
        price: 18500,
        market: 22000,
        min: null,
        max: null,
        days: "+10 days",
        restored: "Нет",
        bell: "Не знаю",
        defects: "Нет",
        weight: "8.4",
      },
      {
        title: "Эксклюзивный талер Священной Римской империи",
        description: "Редкая позиция из частной коллекции дилера. Формат диапазона: одна ставка от участника.",
        image: "/images/theme-empire.jpg",
        section: "exclusive",
        theme: "russian-empire",
        group: 2,
        format: "range",
        price: null,
        market: 90000,
        min: 90000,
        max: 135000,
        days: "+9 days",
        restored: "Нет",
        bell: "Да",
        defects: "Нет",
        weight: "28.2",
      },
      {
        title: "Ликвидация: серебряный полтинник 1924 года",
        description: "Фиксированная цена на время ликвидационной подборки. Позиция исчезает из каталога после покупки.",
        image: "/images/news-3.jpg",
        section: "liquidation",
        theme: "russian-empire",
        group: 4,
        format: "fixed",
        price: 12000,
        market: 15000,
        min: null,
        max: null,
        days: "+14 days",
        restored: "Нет",
        bell: "Да",
        defects: "Незначительные царапины",
        weight: "10",
      },
      {
        title: "Бронзовый крест с эмалью",
        description: "Предмет металлопластики с камерной патиной и следами бытования. Редкий силуэт.",
        image: "/images/theme-metal.jpg",
        section: "auction",
        theme: "metaloplastika",
        group: 2,
        format: "range",
        price: null,
        market: 41000,
        min: 41000,
        max: 53300,
        days: "+7 days",
        restored: "Нет",
        bell: "Не знаю",
        defects: "Нет",
        weight: "14.6",
      },
      {
        title: "Серебряный танка. Северная Индия",
        description: "Выразительная восточная монета с лаконичным оформлением и хорошей центровкой.",
        image: "/images/theme-east.jpg",
        section: "auction",
        theme: "vostok",
        group: 1,
        format: "range",
        price: null,
        market: 36500,
        min: 36500,
        max: 47450,
        days: "+5 days",
        restored: "Нет",
        bell: "Да",
        defects: "Нет",
        weight: "4.2",
      },
    ];

    for (const lot of seededLots) {
      insertLot.run(
        lot.title,
        lot.description,
        lot.image,
        lot.section,
        groupFor(themeFor(lot.theme), lot.group),
        themeFor(lot.theme),
        lot.format,
        lot.price,
        lot.market,
        lot.min,
        lot.max,
        lot.days,
        adminId,
        lot.restored,
        lot.bell,
        lot.defects,
        lot.weight,
      );
    }

    // Seed news
    const newsItems = [
      ["Новый раздел «Металлопластика» в каталоге Клуба", "Открыт новый раздел для торговли предметами металлопластики."],
      ["Итоги аукциона №12 по средневековым монетам", "Подведены итоги очередного закрытого аукциона клуба."],
      ["Поступление эксклюзивной подборки удельных монет", "В раздел «Эксклюзивы» добавлена редкая подборка."],
      ["График работы Клуба в праздничные дни", "Режим работы в праздники изменён."],
    ];
    const insertNews = db.prepare(
      "INSERT OR IGNORE INTO news (title, content, created_by) VALUES (?, ?, ?)"
    );
    for (const [title, content] of newsItems) {
      insertNews.run(title, content, adminId);
    }

    // Seed stickers
    const stickerItems = [
      ["Скуплю монеты Золотой Орды, деньги чеканки Улуг-Мухаммада", 500000],
      ["Куплю дирхемы Аббасидского халифата VIII–X в. в хорошем состоянии", 300000],
      ["Разыскиваю редкие динары Ильхана XIII–XIV вв.", 200000],
      ["Ищу ранние серебряные монеты Маликова", 150000],
    ];
    const insertSticker = db.prepare(
      "INSERT OR IGNORE INTO stickers (title, budget, contact_email, created_by, expires_at) VALUES (?, ?, ?, ?, datetime('now', '+30 days'))"
    );
    for (const [title, budget] of stickerItems) {
      insertSticker.run(title, budget, "admin@4bor.ru", adminId);
    }

    // Seed activity
    const activityItems = [
      ["lot_created", "Новый лот в разделе «Средневековые монеты»"],
      ["auction_closed", "Завершён аукцион «Дирхем. Саманиды»"],
      ["exclusive_added", "Пополнение в разделе «Эксклюзивы»"],
      ["user_joined", "Новый участник в Клубе"],
      ["support_message", "Сообщение в поддержку"],
    ];
    const insertActivity = db.prepare(
      "INSERT INTO activity_log (type, description) VALUES (?, ?)"
    );
    for (const [type, desc] of activityItems) {
      insertActivity.run(type, desc);
    }
  }
}

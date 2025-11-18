import express from "express";
import cors from "cors";
import path from "path";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import multer from "multer";
import dotenv from "dotenv";
// Simple JSON storage (no native modules)
import { status } from "minecraft-server-util";
import fs from "fs";

// Force .env to override any pre-existing envs to avoid mismatched creds
dotenv.config({ override: true });
// Additionally parse .env directly so LiteBans creds always come from file when present
let envParsed = {};
try {
  const envPath = path.join(process.cwd(), ".env");
  console.log("Using .env at", envPath);
  if (fs.existsSync(envPath)) {
    envParsed = dotenv.parse(fs.readFileSync(envPath));
  }
} catch {}

const app = express();
const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || "change-this-secret";
const LITEBANS_DB_HOST = envParsed.LITEBANS_DB_HOST ?? process.env.LITEBANS_DB_HOST;
const LITEBANS_DB_PORT = Number(envParsed.LITEBANS_DB_PORT ?? process.env.LITEBANS_DB_PORT ?? 3306);
const LITEBANS_DB_USER = envParsed.LITEBANS_DB_USER ?? process.env.LITEBANS_DB_USER;
const LITEBANS_DB_PASS = envParsed.LITEBANS_DB_PASS ?? process.env.LITEBANS_DB_PASS;
const LITEBANS_DB_NAME = envParsed.LITEBANS_DB_NAME ?? process.env.LITEBANS_DB_NAME ?? "litebans";
const LITEBANS_TABLE_PREFIX = envParsed.LITEBANS_TABLE_PREFIX ?? process.env.LITEBANS_TABLE_PREFIX ?? "litebans_";
let LB_PREFIX = LITEBANS_TABLE_PREFIX; // will be auto-detected at runtime
const LITEBANS_DB_SSL = String(process.env.LITEBANS_DB_SSL || "false").toLowerCase() === "true";

// CORS: devda barcha manbalarni ruxsat beramiz (localhost va LAN IP)
app.use(cors());
app.use(express.json());

// Serve uploaded images from public/uploads
const publicDir = path.join(process.cwd(), "public");
const uploadsDir = path.join(publicDir, "uploads");
if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir);
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);
app.use("/uploads", express.static(uploadsDir));

const dataFile = path.join(process.cwd(), "server", "data.json");
function readDB() {
  if (!fs.existsSync(dataFile)) {
    fs.writeFileSync(dataFile, JSON.stringify({
      admins: [],
      entries: [],
      players_seen: [],
      proofs: [],
      seq: 1,
    }, null, 2));
  }
  const db = JSON.parse(fs.readFileSync(dataFile, "utf-8"));
  if (!Array.isArray(db.proofs)) db.proofs = [];
  return db;
}
function writeDB(db) {
  fs.writeFileSync(dataFile, JSON.stringify(db, null, 2));
}

// Optional LiteBans DB pool
const useLitebans = Boolean(LITEBANS_DB_HOST && LITEBANS_DB_USER);
let lbPool = null;
if (useLitebans) {
  // Switch to MariaDB driver and provide a small mysql2-compat wrapper
  const mariadb = await import("mariadb");
  const _pool = mariadb.createPool({
    host: LITEBANS_DB_HOST,
    port: LITEBANS_DB_PORT,
    user: LITEBANS_DB_USER,
    password: LITEBANS_DB_PASS,
    database: LITEBANS_DB_NAME,
    connectionLimit: 10,
    ssl: LITEBANS_DB_SSL ? { rejectUnauthorized: false } : undefined,
  });
console.log("LiteBans DB config", {
  host: LITEBANS_DB_HOST,
  port: LITEBANS_DB_PORT,
  user: LITEBANS_DB_USER,
  database: LITEBANS_DB_NAME,
  ssl: LITEBANS_DB_SSL,
});
if (envParsed && (envParsed.LITEBANS_DB_USER || envParsed.LITEBANS_DB_NAME)) {
  console.log("LiteBans .env parsed", {
    user: envParsed.LITEBANS_DB_USER,
    database: envParsed.LITEBANS_DB_NAME,
  });
}
  lbPool = {
    async query(sql, params = []) {
      let conn;
      try {
        conn = await _pool.getConnection();
        const rows = await conn.query(sql, params);
        // emulate mysql2 shape: return [rows]
        return [Array.isArray(rows) ? rows : [rows]];
      } finally {
        if (conn) conn.release();
      }
    },
    async execute(sql, params = []) {
      // MariaDB driver supports query for DML too; keep shape compatible
      return this.query(sql, params);
    },
    async end() { return _pool.end(); }
  };
  console.log("LiteBans DB mode enabled: reading punishments from database (MariaDB)");
  // Auto-detect table prefix faqat envda prefix berilmaganida
  const SHOULD_DETECT_PREFIX = !envParsed.LITEBANS_TABLE_PREFIX && !process.env.LITEBANS_TABLE_PREFIX;
  if (SHOULD_DETECT_PREFIX) {
    try {
      const [rows] = await lbPool.query(
        "SELECT table_name FROM information_schema.tables WHERE table_schema = DATABASE()"
      );
      const names = rows.map(r => String(r.table_name || r.TABLE_NAME));
      const candidates = names.filter(n => /mutes$/.test(n) || /bans$/.test(n));
      const pick = (candidates.find(n => /mutes$/.test(n)) || candidates[0] || "");
      if (pick) {
        const prefix = pick.replace(/(mutes|bans)$/i, "");
        if (prefix) {
          LB_PREFIX = prefix;
          console.log(`Detected LiteBans table prefix: '${LB_PREFIX}'`);
        }
      }
    } catch {}
  }
}

async function queryLitebans(sql, params = []) {
  if (!lbPool) throw new Error("LiteBans DB not configured");
  const [rows] = await lbPool.execute(sql, params);
  return rows;
}

// Detect a usable actor column name for a given punishment table
async function detectActorColumn(tableBase) {
  const table = `${LB_PREFIX}${tableBase}`;
  const [rows] = await lbPool.query(
    "SELECT COLUMN_NAME FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = ?",
    [table]
  );
  const cols = rows.map(r => String(r.COLUMN_NAME || r.column_name));
  const candidates = [
    `${tableBase === 'kicks' ? 'kicked_by_name' : tableBase === 'bans' ? 'banned_by_name' : 'muted_by_name'}`,
    'actor_name',
    'executor_name',
    'staff'
  ];
  return candidates.find(c => cols.includes(c)) || null;
}

// Detect UUID-based actor column for fallback (e.g., banned_by, actor, executor)
async function detectActorUuidColumn(tableBase) {
  const table = `${LB_PREFIX}${tableBase}`;
  const [rows] = await lbPool.query(
    "SELECT COLUMN_NAME FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = ?",
    [table]
  );
  const cols = rows.map(r => String(r.COLUMN_NAME || r.column_name));
  const candidates = [
    // common UUID columns first
    `${tableBase === 'kicks' ? 'kicked_by_uuid' : tableBase === 'bans' ? 'banned_by_uuid' : 'muted_by_uuid'}`,
    // sometimes UUID is stored in the non-_uuid field name
    `${tableBase === 'kicks' ? 'kicked_by' : tableBase === 'bans' ? 'banned_by' : 'muted_by'}`,
    'actor',
    'executor',
    'actor_uuid',
    'executor_uuid',
    'staff_uuid'
  ];
  return candidates.find(c => cols.includes(c)) || null;
}

// Resolve issuer/staff name by entry id for auth checks
async function resolveIssuerById(type, id) {
  if (useLitebans) {
    try {
      const table = type === 'ban' ? 'bans' : type === 'mute' ? 'mutes' : 'kicks';
      const actorCol = await detectActorColumn(table);
      if (!actorCol) return null;
      const rows = await queryLitebans(
        `SELECT ${actorCol} AS issuer_name FROM ${LB_PREFIX}${table} WHERE id = ? LIMIT 1`,
        [id]
      );
      if (rows && rows[0]) return rows[0].issuer_name || null;
      return null;
    } catch {
      return null;
    }
  }
  // Fallback JSON mode
  try {
    const db = readDB();
    const entry = db.entries.find(e => e.id === Number(id) && e.type === type);
    return entry && entry.issuer ? String(entry.issuer) : null;
  } catch {
    return null;
  }
}

// Map LiteBans rows to public Entry format
function mapRow(type, row) {
  // time is in ms (LiteBans uses epoch ms). If seconds are detected, multiply.
  let createdAt;
  const t = Number(row.time ?? row.created ?? Date.now());
  createdAt = new Date(t > 10_000_000_000 ? t : t * 1000).toISOString();
  const issuer = row.banned_by_name || row.muted_by_name || row.kicked_by_name || row.actor_name || row.executor_name || row.staff || null;
  const player = row.name || row.player || row.uuid || "unknown";

  // expiry/duration (for bans & mutes)
  const rawUntil = Number(row.until ?? row.expires ?? 0);
  const untilMs = rawUntil > 0 ? (rawUntil > 10_000_000_000 ? rawUntil : rawUntil * 1000) : 0;
  const expiresAt = untilMs > 0 ? new Date(untilMs).toISOString() : null;
  const startMs = t > 10_000_000_000 ? t : t * 1000;
  const durSec = expiresAt ? Math.max(0, Math.floor((untilMs - startMs) / 1000)) : null;
  const human = (() => {
    if (!expiresAt) return null;
    let s = durSec || 0;
    const d = Math.floor(s / 86400); s -= d * 86400;
    const h = Math.floor(s / 3600); s -= h * 3600;
    const m = Math.floor(s / 60); s -= m * 60;
    const parts = [];
    if (d) parts.push(`${d} kun`);
    if (h) parts.push(`${h} soat`);
    if (m) parts.push(`${m} daqiqa`);
    if (s) parts.push(`${s} sekund`);
    return parts.length ? parts.join(" ") : "<1 sekund";
  })();
  return {
    id: Number(row.id ?? row.punishment_id ?? 0),
    type,
    player: String(player),
    reason: String(row.reason || "No reason"),
    image_url: null,
    created_at: createdAt,
    issuer: issuer ? String(issuer) : undefined,
    expires_at: expiresAt,
    duration: human,
    active: (row.active !== undefined && row.active !== null) ? Boolean(row.active) : undefined,
  };
}

// Attach stored proofs (images) to outgoing entries
function mergeProofs(type, entries) {
  try {
    const db = readDB();
    if (!Array.isArray(db.proofs)) return entries;
    const map = new Map(db.proofs.map(p => [String(p.key), p]));
    return entries.map(e => {
      const key = `${type}:${e.id}`;
      const p = map.get(key);
      if (p && !e.image_url) {
        return { ...e, image_url: p.image_url };
      }
      return e;
    });
  } catch {
    return entries;
  }
}

// Soft purge: hide all entries created before stored cutoff
function filterAfter(entries) {
  try {
    const db = readDB();
    const cutoff = Number(db.purge_after || 0);
    if (!cutoff) return entries;
    return entries.filter(e => {
      const t = Date.parse(e.created_at);
      return Number.isFinite(t) ? t > cutoff : true;
    });
  } catch {
    return entries;
  }
}

async function getBansList() {
  if (!useLitebans) {
    db = readDB();
    const list = db.entries.filter(e => e.type === 'ban').sort((a,b) => a.created_at < b.created_at ? 1 : -1);
    return filterAfter(list);
  }
  // Prefer minimal, widely-compatible column set first (no 'name' column required)
  try {
    const actorCol = await detectActorColumn('bans');
    const actorUuidCol = await detectActorUuidColumn('bans');
    const actorExpr = actorCol
      ? `b.${actorCol}`
      : (actorUuidCol
          ? `COALESCE((SELECT h.name FROM ${LB_PREFIX}history h WHERE h.uuid = b.${actorUuidCol} ORDER BY h.date DESC LIMIT 1),
                     (SELECT p.name FROM ${LB_PREFIX}players p WHERE p.uuid = b.${actorUuidCol} ORDER BY p.date DESC LIMIT 1))`
          : `NULL`);
    const rows = await queryLitebans(
      `SELECT b.id,
              b.uuid,
              (SELECT h.name FROM ${LB_PREFIX}history h WHERE h.uuid = b.uuid ORDER BY h.date DESC LIMIT 1) AS name,
              b.reason,
              ${actorExpr} AS actor_name,
              b.time,
              b.until,
              b.active
       FROM ${LB_PREFIX}bans b
       ORDER BY b.time DESC LIMIT 200`
    );
    return filterAfter(mergeProofs('ban', rows.map(r => mapRow('ban', r))));
  } catch (e) {
    try {
      // Fallback: different actor column naming
      const rows = await queryLitebans(
        `SELECT id, uuid, reason, actor_name, time, until, active FROM ${LB_PREFIX}bans ORDER BY time DESC LIMIT 200`
      );
      return filterAfter(mergeProofs('ban', rows.map(r => mapRow('ban', r))));
    } catch (e2) {
      // Optional: try to resolve player names via history table if present
      try {
        // Fallback 2: some schemas have no name column, join with players to resolve name
        const rows = await queryLitebans(
          `SELECT b.id, b.uuid, p.name AS name, b.reason, b.banned_by_name, b.time, b.until, b.active
           FROM ${LB_PREFIX}bans b
           LEFT JOIN ${LB_PREFIX}players p ON p.uuid = b.uuid
           ORDER BY b.time DESC LIMIT 200`
        );
        return filterAfter(mergeProofs('ban', rows.map(r => mapRow('ban', r))));
      } catch (e3) {
        // Fallback 3: no prefix in schema
        const rows = await queryLitebans(
          `SELECT b.id, b.uuid, p.name AS name, b.reason, b.banned_by_name, b.time, b.until, b.active
           FROM bans b
           LEFT JOIN players p ON p.uuid = b.uuid
           ORDER BY b.time DESC LIMIT 200`
        );
        return filterAfter(mergeProofs('ban', rows.map(r => mapRow('ban', r))));
      }
    }
  }
}

async function getMutesList() {
  if (!useLitebans) {
    db = readDB();
    const list = db.entries.filter(e => e.type === 'mute').sort((a,b) => a.created_at < b.created_at ? 1 : -1);
    return filterAfter(list);
  }
  try {
    // Show recent mutes regardless of active (no 'name' column required)
    const actorCol = await detectActorColumn('mutes');
    const actorUuidCol = await detectActorUuidColumn('mutes');
    const actorExpr = actorCol
      ? `m.${actorCol}`
      : (actorUuidCol
          ? `COALESCE((SELECT h.name FROM ${LB_PREFIX}history h WHERE h.uuid = m.${actorUuidCol} ORDER BY h.date DESC LIMIT 1),
                     (SELECT p.name FROM ${LB_PREFIX}players p WHERE p.uuid = m.${actorUuidCol} ORDER BY p.date DESC LIMIT 1))`
          : `NULL`);
    const rows = await queryLitebans(
      `SELECT m.id,
              m.uuid,
              (SELECT h.name FROM ${LB_PREFIX}history h WHERE h.uuid = m.uuid ORDER BY h.date DESC LIMIT 1) AS name,
              m.reason,
              ${actorExpr} AS actor_name,
              m.time,
              m.until,
              m.active
       FROM ${LB_PREFIX}mutes m
       ORDER BY m.time DESC LIMIT 200`
    );
    return filterAfter(mergeProofs('mute', rows.map(r => mapRow('mute', r))));
  } catch (e) {
    try {
      const rows = await queryLitebans(
        `SELECT id, uuid, reason, actor_name, time, until, active FROM ${LB_PREFIX}mutes ORDER BY time DESC LIMIT 200`
      );
      return filterAfter(mergeProofs('mute', rows.map(r => mapRow('mute', r))));
    } catch (e2) {
      // Optional: try to resolve names via players table if present
      try {
        const rows = await queryLitebans(
          `SELECT m.id, m.uuid, p.name AS name, m.reason, m.muted_by_name, m.time, m.until, m.active
           FROM ${LB_PREFIX}mutes m
           LEFT JOIN ${LB_PREFIX}players p ON p.uuid = m.uuid
           ORDER BY m.time DESC LIMIT 200`
        );
        return filterAfter(mergeProofs('mute', rows.map(r => mapRow('mute', r))));
      } catch (e3) {
        // Fallback 3: no prefix in schema
        const rows = await queryLitebans(
          `SELECT m.id, m.uuid, p.name AS name, m.reason, m.muted_by_name, m.time, m.until, m.active
           FROM mutes m
           LEFT JOIN players p ON p.uuid = m.uuid
           ORDER BY m.time DESC LIMIT 200`
        );
        return filterAfter(mergeProofs('mute', rows.map(r => mapRow('mute', r))));
      }
    }
  }
}

async function getKicksList() {
  if (!useLitebans) {
    db = readDB();
    const list = db.entries.filter(e => e.type === 'kick').sort((a,b) => a.created_at < b.created_at ? 1 : -1);
    return filterAfter(list);
  }
  try {
    const actorCol = await detectActorColumn('kicks');
    const actorUuidCol = await detectActorUuidColumn('kicks');
    const actorExpr = actorCol
      ? `k.${actorCol}`
      : (actorUuidCol
          ? `COALESCE((SELECT h.name FROM ${LB_PREFIX}history h WHERE h.uuid = k.${actorUuidCol} ORDER BY h.date DESC LIMIT 1),
                     (SELECT p.name FROM ${LB_PREFIX}players p WHERE p.uuid = k.${actorUuidCol} ORDER BY p.date DESC LIMIT 1))`
          : `NULL`);
    const rows = await queryLitebans(
      `SELECT k.id,
              k.uuid,
              (SELECT h.name FROM ${LB_PREFIX}history h WHERE h.uuid = k.uuid ORDER BY h.date DESC LIMIT 1) AS name,
              k.reason,
              ${actorExpr} AS actor_name,
              k.time
       FROM ${LB_PREFIX}kicks k
       ORDER BY k.time DESC LIMIT 200`
    );
    return filterAfter(mergeProofs('kick', rows.map(r => mapRow('kick', r))));
  } catch (e) {
    try {
      const rows = await queryLitebans(
        `SELECT id, uuid, reason, actor_name, time FROM ${LB_PREFIX}kicks ORDER BY time DESC LIMIT 200`
      );
      return filterAfter(mergeProofs('kick', rows.map(r => mapRow('kick', r))));
    } catch (e2) {
      try {
        // Fallback 2: schema without name column in kicks; join with players
        const rows = await queryLitebans(
          `SELECT k.id, k.uuid, p.name AS name, k.reason, k.kicked_by_name, k.time
           FROM ${LB_PREFIX}kicks k
           LEFT JOIN ${LB_PREFIX}players p ON p.uuid = k.uuid
           ORDER BY k.time DESC LIMIT 200`
        );
        return filterAfter(mergeProofs('kick', rows.map(r => mapRow('kick', r))));
      } catch (e3) {
        // Fallback 3: no prefix in schema
        const rows = await queryLitebans(
          `SELECT k.id, k.uuid, p.name AS name, k.reason, k.kicked_by_name, k.time
           FROM kicks k
           LEFT JOIN players p ON p.uuid = k.uuid
           ORDER BY k.time DESC LIMIT 200`
        );
        return filterAfter(mergeProofs('kick', rows.map(r => mapRow('kick', r))));
      }
    }
  }
}

// Seed admin if none exists
const defaultAdminUser = process.env.ADMIN_USER || "admin";
const defaultAdminPass = process.env.ADMIN_PASS || "admin123"; // CHANGE THIS IN PROD
let db = readDB();
if (db.admins.length === 0) {
  const hash = bcrypt.hashSync(defaultAdminPass, 10);
  db.admins.push({ id: 1, username: defaultAdminUser, role: "admin", password_hash: hash });
  db.seq = 2;
  writeDB(db);
  console.log(`Seeded default admin: ${defaultAdminUser}`);
}

// Ensure helper/moderator accounts from .env
function ensureAccount(username, role, plain) {
  if (!username) return;
  db = readDB();
  let user = db.admins.find(a => a.username === username);
  if (!user) {
    const id = db.seq++;
    const hash = plain ? bcrypt.hashSync(plain, 10) : bcrypt.hashSync("change-me", 10);
    user = { id, username, role, password_hash: hash };
    db.admins.push(user);
    writeDB(db);
    console.log(`Seeded ${role}: ${username}`);
    return;
  }
  // Sync role
  if (role && user.role !== role) {
    user.role = role;
  }
  // Sync password if provided and different
  if (plain && !bcrypt.compareSync(plain, user.password_hash)) {
    user.password_hash = bcrypt.hashSync(plain, 10);
    console.log(`Updated password for ${role}: ${username}`);
  }
  writeDB(db);
}

const helperUser = process.env.HELPER_USER;
const helperPass = process.env.HELPER_PASS;
const moderUser = process.env.MODER_USER;
const moderPass = process.env.MODER_PASS;
ensureAccount(helperUser, "helper", helperPass);
ensureAccount(moderUser, "moderator", moderPass);

// Auth helpers
function authMiddleware(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Unauthorized" });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (e) {
    return res.status(401).json({ error: "Invalid token" });
  }
}

// Multer setup for images
const storage = multer.diskStorage({
  destination: function (_req, _file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (_req, file, cb) {
    const ts = Date.now();
    const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
    cb(null, `${ts}_${safe}`);
  },
});
const upload = multer({ storage });

// Routes
app.post("/api/auth/login", (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: "Missing credentials" });
  db = readDB();
  const admin = db.admins.find(a => a.username === username);
  if (!admin) return res.status(401).json({ error: "Invalid credentials" });
  const ok = bcrypt.compareSync(password, admin.password_hash);
  if (!ok) return res.status(401).json({ error: "Invalid credentials" });
  const role = admin.role || "admin";
  const token = jwt.sign({ sub: admin.id, username: admin.username, role }, JWT_SECRET, { expiresIn: "2h" });
  res.json({ token, role, username: admin.username });
});

// Role guard
function requireRole(...roles) {
  return (req, res, next) => {
    const userRole = (req.user && req.user.role) || "admin";
    if (!roles.includes(userRole)) {
      return res.status(403).json({ error: "Forbidden" });
    }
    next();
  };
}

// Create ban/mute (admin)
app.post("/api/admin/ban", authMiddleware, requireRole("moderator", "admin"), upload.single("image"), async (req, res) => {
  const { player, reason } = req.body || {};
  if (!player || !reason) return res.status(400).json({ error: "player and reason required" });
  const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;
  const now = Date.now();
  try {
    if (useLitebans && lbPool) {
      // Try to resolve player's UUID from players table for better integrity
      let uuid = null;
      try {
      const [prow] = await lbPool.execute(`SELECT uuid FROM ${LB_PREFIX}players WHERE name = ? ORDER BY date DESC LIMIT 1`, [player]);
        uuid = Array.isArray(prow) && prow[0] && prow[0].uuid ? prow[0].uuid : null;
      } catch {}
      const sql = `INSERT INTO ${LB_PREFIX}bans (uuid, name, reason, banned_by_name, time, until, active) VALUES (?, ?, ?, ?, ?, 0, 1)`;
      const params = [uuid, player, reason, req.user.username, now];
      const [result] = await lbPool.execute(sql, params);
      const id = result?.insertId || now;
      return res.status(201).json({ id });
    }
    const createdAt = new Date(now).toISOString();
    db = readDB();
    const id = db.seq++;
    db.entries.push({ id, type: "ban", player, reason, image_url: imageUrl, created_at: createdAt, issuer: req.user.username });
    writeDB(db);
    res.status(201).json({ id });
  } catch (e) {
    res.status(500).json({ error: "Failed to insert ban into DB", details: String(e) });
  }
});

app.post("/api/admin/mute", authMiddleware, requireRole("helper", "moderator", "admin"), upload.single("image"), async (req, res) => {
  const { player, reason } = req.body || {};
  if (!player || !reason) return res.status(400).json({ error: "player and reason required" });
  const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;
  const now = Date.now();
  try {
    if (useLitebans && lbPool) {
      let uuid = null;
      try {
      const [prow] = await lbPool.execute(`SELECT uuid FROM ${LB_PREFIX}players WHERE name = ? ORDER BY date DESC LIMIT 1`, [player]);
        uuid = Array.isArray(prow) && prow[0] && prow[0].uuid ? prow[0].uuid : null;
      } catch {}
      const sql = `INSERT INTO ${LB_PREFIX}mutes (uuid, name, reason, muted_by_name, time, until, active) VALUES (?, ?, ?, ?, ?, 0, 1)`;
      const params = [uuid, player, reason, req.user.username, now];
      const [result] = await lbPool.execute(sql, params);
      const id = result?.insertId || now;
      return res.status(201).json({ id });
    }
    const createdAt = new Date(now).toISOString();
    db = readDB();
    const id = db.seq++;
    db.entries.push({ id, type: "mute", player, reason, image_url: imageUrl, created_at: createdAt, issuer: req.user.username });
    writeDB(db);
    res.status(201).json({ id });
  } catch (e) {
    res.status(500).json({ error: "Failed to insert mute into DB", details: String(e) });
  }
});

// Create kick (moderator/admin)
app.post("/api/admin/kick", authMiddleware, requireRole("moderator", "admin"), upload.single("image"), async (req, res) => {
  const { player, reason } = req.body || {};
  if (!player || !reason) return res.status(400).json({ error: "player and reason required" });
  const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;
  const now = Date.now();
  try {
    if (useLitebans && lbPool) {
      let uuid = null;
      try {
      const [prow] = await lbPool.execute(`SELECT uuid FROM ${LB_PREFIX}players WHERE name = ? ORDER BY date DESC LIMIT 1`, [player]);
        uuid = Array.isArray(prow) && prow[0] && prow[0].uuid ? prow[0].uuid : null;
      } catch {}
      const sql = `INSERT INTO ${LB_PREFIX}kicks (uuid, name, reason, kicked_by_name, time) VALUES (?, ?, ?, ?, ?)`;
      const params = [uuid, player, reason, req.user.username, now];
      const [result] = await lbPool.execute(sql, params);
      const id = result?.insertId || now;
      return res.status(201).json({ id });
    }
    const createdAt = new Date(now).toISOString();
    db = readDB();
    const id = db.seq++;
    db.entries.push({ id, type: "kick", player, reason, image_url: imageUrl, created_at: createdAt, issuer: req.user.username });
    writeDB(db);
    res.status(201).json({ id });
  } catch (e) {
    res.status(500).json({ error: "Failed to insert kick into DB", details: String(e) });
  }
});

// Add/replace proof image for a punishment entry
app.post("/api/admin/proof/:type/:id", authMiddleware, requireRole("helper", "moderator", "admin"), upload.single("image"), async (req, res) => {
  const type = String(req.params.type || '').toLowerCase();
  const id = Number(req.params.id);
  if (!['ban','mute','kick'].includes(type)) return res.status(400).json({ error: "Invalid type" });
  if (!id) return res.status(400).json({ error: "Invalid id" });
  if (!req.file) return res.status(400).json({ error: "Image file required" });

  // Authorization per role requirements:
  // - admin: may attach to any entry
  // - moderator: may attach to ban, mute, kick
  // - helper: may attach only to mute
  const role = (req.user && req.user.role) || 'admin';
  const username = (req.user && req.user.username) || '';
  if (role === 'helper' && type !== 'mute') {
    return res.status(403).json({ error: 'Helper foydalanuvchilar faqat mute uchun dalil qo‘sha oladi.' });
  }

  const imageUrl = `/uploads/${req.file.filename}`;
  const key = `${type}:${id}`;
  try {
    const db = readDB();
    const idx = Array.isArray(db.proofs) ? db.proofs.findIndex(p => String(p.key) === key) : -1;
    const record = { key, image_url: imageUrl, added_by: username, added_at: new Date().toISOString() };
    if (idx >= 0) db.proofs[idx] = record; else db.proofs.push(record);
    writeDB(db);
    return res.status(201).json({ ok: true, image_url: imageUrl });
  } catch (e) {
    return res.status(500).json({ error: "Failed to save proof", details: String(e) });
  }
});

app.delete("/api/admin/entry/:id", authMiddleware, requireRole("admin"), (req, res) => {
  if (useLitebans) {
    return res.status(501).json({ error: "Deletion from LiteBans DB is disabled from panel. Use in-game commands." });
  }
  const id = Number(req.params.id);
  db = readDB();
  const before = db.entries.length;
  db.entries = db.entries.filter(e => e.id !== id);
  writeDB(db);
  res.json({ deleted: before - db.entries.length });
});

// Public lists
app.get("/api/public/bans", async (_req, res) => {
  try {
    const rows = await getBansList();
    res.json(rows);
  } catch (e) {
    console.error("/api/public/bans error:", e);
    res.status(500).json({ error: "Failed to load bans", details: String(e) });
  }
});
app.get("/api/public/mutes", async (_req, res) => {
  try {
    const rows = await getMutesList();
    res.json(rows);
  } catch (e) {
    console.error("/api/public/mutes error:", e);
    res.status(500).json({ error: "Failed to load mutes", details: String(e) });
  }
});

app.get("/api/public/kicks", async (_req, res) => {
  try {
    const rows = await getKicksList();
    res.json(rows);
  } catch (e) {
    console.error("/api/public/kicks error:", e);
    res.status(500).json({ error: "Failed to load kicks", details: String(e) });
  }
});

// Debug: list LiteBans tables (temporarily enabled for troubleshooting)
app.get("/api/debug/litebans/tables", async (_req, res) => {
  try {
    if (!useLitebans || !lbPool) return res.json({ useLitebans, tables: [] });
    const [rows] = await lbPool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = DATABASE() ORDER BY table_name");
    const names = rows.map(r => r.table_name || r.TABLE_NAME);
    res.json({ prefix: LB_PREFIX, tables: names });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// Debug: probe simple selects against mutes/bans/kicks using current prefix
app.get("/api/debug/litebans/probe", async (_req, res) => {
  try {
    if (!useLitebans || !lbPool) return res.json({ useLitebans, ok: false, reason: "litebans disabled" });
    const out = { prefix: LB_PREFIX };
    const [m] = await lbPool.query(`SELECT COUNT(*) AS c FROM ${LB_PREFIX}mutes`);
    const [b] = await lbPool.query(`SELECT COUNT(*) AS c FROM ${LB_PREFIX}bans`);
    const [k] = await lbPool.query(`SELECT COUNT(*) AS c FROM ${LB_PREFIX}kicks`);
    out.mutes = m?.[0]?.c != null ? Number(m[0].c) : null;
    out.bans = b?.[0]?.c != null ? Number(b[0].c) : null;
    out.kicks = k?.[0]?.c != null ? Number(k[0].c) : null;
    res.json(out);
  } catch (e) {
    res.status(500).json({ error: String(e), prefix: LB_PREFIX });
  }
});

// Webhook removed; direct DB mode is recommended.

// Minecraft server status for bytemc.uz
app.get("/api/server/status", async (_req, res) => {
  try {
    const host = process.env.MC_HOST || "bytemc.uz";
    const port = Number(process.env.MC_PORT || 25565);
    const result = await status(host, port, { timeout: 5000 });
    const onlinePlayers = result.players.online;
    const maxPlayers = result.players.max;
    const sampleNames = (result.players.sample || []).map(p => p.name);

    // Track players seen (approximate unique since we rely on sample)
    db = readDB();
    const now = new Date().toISOString();
    for (const name of sampleNames) {
      if (!db.players_seen.find(p => p.player === name)) {
        db.players_seen.push({ id: db.seq++, player: name, first_seen: now });
      }
    }
    writeDB(db);
    const totalSeen = db.players_seen.length;

    res.json({ host, port, onlinePlayers, maxPlayers, samplePlayers: sampleNames, totalSeen });
  } catch (e) {
    res.status(500).json({ error: "Unable to fetch server status", details: String(e) });
  }
});

app.get("/api/stats", async (_req, res) => {
  try {
    if (useLitebans) {
      const [bansRow] = await queryLitebans(`SELECT COUNT(*) AS c FROM ${LB_PREFIX}bans WHERE active = 1`);
      const [mutesRow] = await queryLitebans(`SELECT COUNT(*) AS c FROM ${LB_PREFIX}mutes WHERE active = 1`);
      const [kicksRow] = await queryLitebans(`SELECT COUNT(*) AS c FROM ${LB_PREFIX}kicks`);
      db = readDB();
      const totalSeen = db.players_seen.length;
      return res.json({ bans: Number(bansRow.c), mutes: Number(mutesRow.c), kicks: Number(kicksRow.c), totalSeen });
    }
    db = readDB();
    const bans = db.entries.filter(e => e.type === 'ban').length;
    const mutes = db.entries.filter(e => e.type === 'mute').length;
    const kicks = db.entries.filter(e => e.type === 'kick').length;
    const totalSeen = db.players_seen.length;
    res.json({ bans, mutes, kicks, totalSeen });
  } catch (e) {
    res.status(500).json({ error: "Failed to load stats", details: String(e) });
  }
});

// Start server with simple auto port-increment if in use
function startServer(port) {
  const server = app.listen(port, () => {
    console.log(`Backend listening on http://localhost:${port}`);
  });
  server.on('error', (err) => {
    if (err && err.code === 'EADDRINUSE' && port < (Number(process.env.PORT) || 4000) + 10) {
      const next = port + 1;
      console.warn(`Port ${port} in use, trying ${next}...`);
      setTimeout(() => startServer(next), 250);
    } else {
      console.error(err);
      process.exit(1);
    }
  });
}

startServer(Number(process.env.PORT) || 4000);
/* ===== 간단 로그인 + 진도 저장 API =====
   어르신이 쓰기 쉽게 '이름 + 숫자 4자리'로 로그인합니다. (비밀번호 수준의 보안은 아닙니다)
   데이터는 data/users.json 파일에 저장됩니다. 나중에 DB로 바꾸려면 load/save 두 함수만 바꾸면 됩니다.

   POST /api/login     { name, pin }   → { token, name, progress, created }
   GET  /api/progress  (Authorization: Bearer 토큰) → { progress }
   PUT  /api/progress  { progress }  (Authorization) → { ok: true }
   POST /api/logout    (Authorization) → { ok: true } */

import { Router } from "express";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

export const progressRouter = Router();

const here = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(here, "..", "data");
const DB_FILE = path.join(DATA_DIR, "users.json");

// ----- 파일 저장소 -----
function load() {
  try { return JSON.parse(fs.readFileSync(DB_FILE, "utf8")); }
  catch { return { users: {}, tokens: {} }; }
}
function save(db) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf8");
}

// ----- 도우미 -----
const normName = s => String(s || "").trim().replace(/\s+/g, " ").slice(0, 20);
const hashPin = (pin, salt) => crypto.scryptSync(String(pin), salt, 32).toString("hex");
const userKey = name => name.toLowerCase();

function auth(req, res, next) {
  const token = (req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  const db = load();
  const key = token && db.tokens[token];
  if (!key || !db.users[key]) return res.status(401).json({ error: "다시 로그인해 주세요." });
  req.db = db;
  req.userKey = key;
  req.token = token;
  next();
}

// ----- 로그인 (없으면 새로 만들어 줌) -----
progressRouter.post("/login", (req, res) => {
  const name = normName(req.body?.name);
  const pin = String(req.body?.pin || "");
  if (name.length < 1) return res.status(400).json({ error: "이름을 적어주세요." });
  if (!/^\d{4}$/.test(pin)) return res.status(400).json({ error: "숫자 4자리를 눌러주세요." });

  const db = load();
  const key = userKey(name);
  let user = db.users[key];
  let created = false;

  if (!user) {
    const salt = crypto.randomBytes(8).toString("hex");
    user = { name, salt, pinHash: hashPin(pin, salt), progress: {}, createdAt: new Date().toISOString() };
    db.users[key] = user;
    created = true;
  } else if (user.pinHash !== hashPin(pin, user.salt)) {
    return res.status(401).json({ error: "숫자 4자리가 달라요. 다시 확인해 주세요." });
  }

  const token = crypto.randomBytes(24).toString("hex");
  db.tokens[token] = key;
  user.lastLoginAt = new Date().toISOString();
  save(db);
  res.json({ token, name: user.name, progress: user.progress, created });
});

progressRouter.post("/logout", auth, (req, res) => {
  delete req.db.tokens[req.token];
  save(req.db);
  res.json({ ok: true });
});

progressRouter.get("/progress", auth, (req, res) => {
  res.json({ name: req.db.users[req.userKey].name, progress: req.db.users[req.userKey].progress || {} });
});

progressRouter.put("/progress", auth, (req, res) => {
  const incoming = req.body?.progress;
  if (!incoming || typeof incoming !== "object") return res.status(400).json({ error: "잘못된 요청" });
  // 강좌별 { step, done, quizScore } 만 저장
  const clean = {};
  for (const [id, p] of Object.entries(incoming)) {
    if (typeof id !== "string" || id.length > 50 || !p || typeof p !== "object") continue;
    clean[id] = {
      step: Number.isInteger(p.step) ? p.step : 0,
      done: !!p.done,
      quizScore: p.quizScore && Number.isInteger(p.quizScore.score) && Number.isInteger(p.quizScore.total)
        ? { score: p.quizScore.score, total: p.quizScore.total } : null
    };
  }
  req.db.users[req.userKey].progress = clean;
  req.db.users[req.userKey].updatedAt = new Date().toISOString();
  save(req.db);
  res.json({ ok: true });
});

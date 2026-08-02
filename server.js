// ============================================================
//  PCStats Rates Site — backend
//  Отдельный сайт (не связан с существующим players.html-бэкендом):
//    - курсы валют по серверам (обновляются кнопкой "Обновить с телефона"
//      в PCStats.lua), с меткой времени последнего обновления
//    - ники игроков по серверу (кто сейчас играет)
// ============================================================

const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(express.json({ limit: "256kb" }));

// ── настройки ──
const PORT = process.env.PORT || 3000;
// секрет, который должен присылать скрипт в заголовке X-Report-Key —
// смени на свой перед деплоем (и подставь то же значение в PCStats.lua)
const SECRET = process.env.RATES_SECRET || "change-me-secret";
// через сколько мс считаем игрока "оффлайн" и не показываем в списке
// (скрипт должен присылать пинг регулярно, пока игрок в сети)
const PLAYER_TTL_MS = 20 * 60 * 1000; // 20 минут

// DATA_DIR можно переопределить переменной окружения — например, указать
// путь примонтированного постоянного диска (Persistent Disk/Volume) на
// хостинге. Без этого на бесплатных тарифах (Render free, и т.п.)
// файловая система эфемерная: при каждом переразвёртывании/перезапуске
// контейнера всё, что лежит в обычной папке проекта, стирается —
// именно поэтому rates.json/players.json время от времени "обнуляются".
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, "data");
const RATES_FILE = path.join(DATA_DIR, "rates.json");
const PLAYERS_FILE = path.join(DATA_DIR, "players.json");

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

function loadJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return {};
  }
}
function saveJson(file, obj) {
  fs.writeFileSync(file, JSON.stringify(obj, null, 2), "utf8");
}

let rates = loadJson(RATES_FILE);     // { serverName: { az, btc, eur, vc, asc, updatedAt } }
let players = loadJson(PLAYERS_FILE); // { key: { nick, server, lastSeen } }

function checkSecret(req, res) {
  const got = req.get("X-Report-Key") || (req.body && req.body.secret);
  if (!SECRET || got !== SECRET) {
    res.status(401).json({ ok: false, error: "bad_secret" });
    return false;
  }
  return true;
}

function num(v) {
  // убираем обычные/неразрывные пробелы-разделители тысяч (например
  // "12 458 830"), чтобы Number() не разваливался в 0 — та же защита,
  // что теперь есть на стороне скрипта, но на всякий случай и здесь тоже
  const cleaned = String(v ?? "").replace(/[\s\u00A0]/g, "").replace(",", ".");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : 0;
}

// необязательные поля персонажа для карточки (Персонаж/Бой на сайте) —
// приходят только если игрок включил cfg.shareStats в скрипте; если
// поля нет в присланном JSON, в объект игрока оно не попадает вообще
// (а не пишется как 0/пустая строка), чтобы фронтенд мог отличить
// "не поделился статами" от "статы нулевые"
const PROFILE_STRING_FIELDS = [
  "job", "org", "position", "status", "accountNumber", "phone", "bankCard",
  "citizenship", "family", "gender", "hotel", "hotelRoom", "trailer",
  "lawfulness", "warnings", "addiction", "health", "wanted",
  "authDate", "accountState", "x3Payday", "x4Payday",
];
const PROFILE_NUMBER_FIELDS = [
  "level", "respect", "cashSas", "cashVcs", "bank", "euro", "btc", "azCoins", "moneyDay",
  "protection", "regen", "damage", "luck", "maxHp", "maxArmor",
  "stunChance", "bleedChance", "dodgeChance", "reflectDamage", "blockDamage",
  "fireRate", "recoil", "fruitStun",
];

function extractProfileFields(b) {
  const profile = {};
  for (const k of PROFILE_STRING_FIELDS) {
    if (b[k] !== undefined && b[k] !== null && String(b[k]).trim() !== "") {
      profile[k] = String(b[k]).trim().slice(0, 64);
    }
  }
  for (const k of PROFILE_NUMBER_FIELDS) {
    if (b[k] !== undefined && b[k] !== null && b[k] !== "") {
      profile[k] = num(b[k]);
    }
  }
  return profile;
}

// ============================================================
//  API: курсы валют
// ============================================================

// POST { server, az, btc, eur, vc, asc }  (header X-Report-Key: <secret>)
app.post("/api/rates", (req, res) => {
  if (!checkSecret(req, res)) return;
  const b = req.body || {};
  const server = String(b.server || "").trim();
  if (!server) return res.status(400).json({ ok: false, error: "no_server" });

  rates[server] = {
    az: num(b.az),
    btc: num(b.btc),
    eur: num(b.eur),
    vc: num(b.vc),
    asc: num(b.asc),
    updatedAt: Date.now(),
  };
  saveJson(RATES_FILE, rates);
  res.json({ ok: true });
});

// GET /api/rates -> { servers: [ { server, az, btc, eur, vc, asc, updatedAt }, ... ] }
app.get("/api/rates", (req, res) => {
  const list = Object.keys(rates)
    .sort((a, b) => a.localeCompare(b))
    .map((server) => ({ server, ...rates[server] }));
  res.json({ ok: true, servers: list });
});

// GET /api/rates/plain?server=Tucson -> "ok=1;az=..;btc=..;eur=..;vc=..;asc=..;updatedAt=.."
// Простой текстовый формат (не JSON) специально для игрового скрипта —
// в MoonLoader/Lua нет готового JSON-парсера, а писать его ради пяти чисел
// избыточно. Используется кнопкой "Обновить курсы с сайта" в PCStats.lua.
app.get("/api/rates/plain", (req, res) => {
  const server = String(req.query.server || "").trim();
  const r = server ? rates[server] : null;
  res.type("text/plain");
  if (!r) {
    res.send("ok=0");
    return;
  }
  res.send(
    `ok=1;az=${r.az};btc=${r.btc};eur=${r.eur};vc=${r.vc};asc=${r.asc};updatedAt=${r.updatedAt}`
  );
});

// ============================================================
//  API: ники игроков по серверу
// ============================================================

// POST { ownerKey, nick, server, [level, job, org, position, status,
//        respect, health, wanted, cashSas, cashVcs, bank, euro, btc,
//        azCoins] }  (header X-Report-Key: <secret>)
// ownerKey — тот же персистентный идентификатор, что уже используется
// скриптом для players.html-бэкенда (cfg.ownerKey), чтобы не плодить
// дубликаты при переустановке ника.
// Статы персонажа необязательны (скрипт шлёт их, только если игрок
// включил cfg.shareStats) и полностью перезаписываются на каждый пинг —
// если в текущем пинге статов нет (игрок выключил опцию), старые статы
// удаляются из записи, а не остаются "залипшими" на сайте.
app.post("/api/players", (req, res) => {
  if (!checkSecret(req, res)) return;
  const b = req.body || {};
  const nick = String(b.nick || "").trim();
  const server = String(b.server || "").trim();
  if (!nick || !server) return res.status(400).json({ ok: false, error: "missing_fields" });
  const key = String(b.ownerKey || "").trim() || `${nick}|${server}`;

  const profile = extractProfileFields(b);
  players[key] = { nick, server, lastSeen: Date.now(), ...profile };
  saveJson(PLAYERS_FILE, players);
  res.json({ ok: true });
});

// DELETE { ownerKey }  — например, при выходе/выключении опции
app.delete("/api/players", (req, res) => {
  if (!checkSecret(req, res)) return;
  const key = String((req.body && req.body.ownerKey) || "").trim();
  if (!key || !players[key]) return res.json({ ok: true });
  delete players[key];
  saveJson(PLAYERS_FILE, players);
  res.json({ ok: true });
});

// GET /api/players?server=Tucson -> { ok, players: [ { nick, server, lastSeen }, ... ] }
// без ?server отдаёт всех "живых" игроков по всем серверам
app.get("/api/players", (req, res) => {
  const filterServer = req.query.server ? String(req.query.server) : null;
  const now = Date.now();
  const list = Object.values(players)
    .filter((p) => now - p.lastSeen <= PLAYER_TTL_MS)
    .filter((p) => !filterServer || p.server === filterServer)
    .sort((a, b) => b.lastSeen - a.lastSeen);
  res.json({ ok: true, players: list });
});

// ============================================================
//  статика (index.html — курсы, players.html — ники)
// ============================================================
app.use(express.static(path.join(__dirname, "public")));

app.listen(PORT, () => {
  console.log(`PCStats rates site listening on port ${PORT}`);
});

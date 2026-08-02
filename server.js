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
const https = require("https");

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

// ============================================================
//  бэкап курсов в файл на GitHub (data/rates.json в отдельном репо)
// ------------------------------------------------------------
//  Зачем: на Railway (и почти любом бесплатном хостинге) файловая
//  система эфемерная — data/rates.json стирается при каждом
//  редеплое/рестарте контейнера. Если в этот момент никто давно не
//  жал "Обновить с телефона" в скрипте, курсы теряются и функция
//  "обновить курс с сайта" отдаёт пустоту.
//  GitHub-репозиторий — бесплатное постоянное хранилище: каждое
//  обновление курсов коммитится туда, а при старте сервер, если
//  локальный rates.json пуст, подтягивает последнее сохранённое
//  состояние обратно оттуда. Скрипт (PCStats.lua) как ходил, так и
//  ходит только на /api/rates и /api/rates/plain — про GitHub он
//  ничего не знает, токен туда не попадает.
//
//  Настройка (переменные окружения на Railway):
//    GITHUB_TOKEN      — fine-grained personal access token с доступом
//                         только к одному репо, права Contents: Read and write
//    GITHUB_REPO       — "owner/repo", например "vvb-lua/pcstats-data"
//    GITHUB_BRANCH     — ветка, по умолчанию "main"
//    GITHUB_RATES_PATH — путь к файлу в репо, по умолчанию "data/rates.json"
//  Если GITHUB_TOKEN/GITHUB_REPO не заданы — бэкап просто не работает,
//  сайт продолжает работать как раньше (без гарантии от рестартов).
// ============================================================
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || "";
const GITHUB_REPO = process.env.GITHUB_REPO || "";
const GITHUB_BRANCH = process.env.GITHUB_BRANCH || "main";
const GITHUB_RATES_PATH = process.env.GITHUB_RATES_PATH || "data/rates.json";
const GITHUB_ENABLED = !!(GITHUB_TOKEN && GITHUB_REPO);

function githubRequest(method, apiPath, bodyObj) {
  return new Promise((resolve) => {
    const data = bodyObj ? JSON.stringify(bodyObj) : null;
    const req = https.request(
      {
        hostname: "api.github.com",
        path: `/repos/${GITHUB_REPO}${apiPath}`,
        method,
        headers: {
          "User-Agent": "pcstats-rates-site",
          "Authorization": `Bearer ${GITHUB_TOKEN}`,
          "Accept": "application/vnd.github+json",
          ...(data ? { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(data) } : {}),
        },
      },
      (res) => {
        let chunks = "";
        res.on("data", (c) => (chunks += c));
        res.on("end", () => {
          let parsed = null;
          try { parsed = JSON.parse(chunks); } catch { /* пусто/не JSON — оставляем null */ }
          resolve({ status: res.statusCode, body: parsed });
        });
      }
    );
    req.on("error", (e) => { console.error("githubRequest error:", e.message); resolve(null); });
    if (data) req.write(data);
    req.end();
  });
}

// текущий sha файла на GitHub — нужен API, чтобы обновить (а не создать
// дубликат) файл; сбрасывается в null, если GitHub говорит, что sha
// устарел (409) — тогда следующий вызов подтянет актуальный
let githubRatesSha = null;

async function githubGetRates() {
  if (!GITHUB_ENABLED) return null;
  const res = await githubRequest("GET", `/contents/${GITHUB_RATES_PATH}?ref=${GITHUB_BRANCH}`);
  if (!res || res.status !== 200 || !res.body || !res.body.content) return null;
  try {
    const raw = Buffer.from(res.body.content, "base64").toString("utf8");
    return { data: JSON.parse(raw), sha: res.body.sha };
  } catch (e) {
    console.error("githubGetRates parse failed:", e.message);
    return null;
  }
}

// пишет rates.json в GitHub-репо (коммит). Вызывается в фоне, не
// блокирует ответ игровому скрипту.
async function githubSaveRates(obj) {
  if (!GITHUB_ENABLED) return;
  try {
    if (!githubRatesSha) {
      const cur = await githubGetRates();
      if (cur) githubRatesSha = cur.sha;
    }
    const content = Buffer.from(JSON.stringify(obj, null, 2), "utf8").toString("base64");
    const res = await githubRequest("PUT", `/contents/${GITHUB_RATES_PATH}`, {
      message: "update rates.json",
      content,
      branch: GITHUB_BRANCH,
      ...(githubRatesSha ? { sha: githubRatesSha } : {}),
    });
    if (res && res.body && res.body.content && res.body.content.sha) {
      githubRatesSha = res.body.content.sha;
    } else if (res && (res.status === 409 || res.status === 422)) {
      githubRatesSha = null; // sha устарел/не совпал — перечитаем в следующий раз
    } else if (!res || res.status >= 400) {
      console.error("githubSaveRates failed, status:", res && res.status, res && res.body);
    }
  } catch (e) {
    console.error("githubSaveRates failed:", e.message);
  }
}

// при старте: если локальный rates.json пуст (например, только что
// был рестарт контейнера и эфемерный диск стёрся) — подтягиваем
// последнее сохранённое состояние из GitHub
(async () => {
  if (GITHUB_ENABLED && Object.keys(rates).length === 0) {
    const cur = await githubGetRates();
    if (cur && cur.data) {
      rates = cur.data;
      githubRatesSha = cur.sha;
      saveJson(RATES_FILE, rates);
      console.log("rates.json восстановлен из GitHub после рестарта");
    }
  }
})();

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
  githubSaveRates(rates); // в фоне, не ждём — ответ игроку не задерживаем
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

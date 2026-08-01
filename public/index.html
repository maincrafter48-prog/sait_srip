<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Игроки по серверам — PCStats</title>
<style>
  :root{
    --bg:#0f1115; --card:#171a21; --border:#262b36;
    --text:#e7e9ee; --dim:#8a90a0; --accent:#3aa0ff; --green:#3ecf8e; --gold:#e0b94a; --red:#ff5c5c;
  }
  *{box-sizing:border-box}
  body{
    margin:0; font-family:'Segoe UI',Roboto,Arial,sans-serif;
    background:radial-gradient(1200px 600px at 20% -10%, #17203a 0%, var(--bg) 60%);
    color:var(--text); min-height:100vh;
  }

  /* ---------- топбар + выдвижное меню ---------- */
  .topbar{position:sticky; top:0; z-index:30; display:flex; align-items:center; gap:12px; padding:14px 16px; background:rgba(15,17,21,.92); backdrop-filter:blur(6px); border-bottom:1px solid var(--border)}
  .hbtn{background:var(--card); border:1px solid var(--border); color:var(--text); font-size:18px; width:38px; height:38px; border-radius:8px; cursor:pointer; line-height:1}
  .hbtn:hover{border-color:var(--accent)}
  .brand{font-weight:700; font-size:15px}
  .drawerOverlay{position:fixed; inset:0; background:rgba(6,8,12,.55); display:none; z-index:40}
  .drawerOverlay.open{display:block}
  .drawer{position:fixed; top:0; left:0; bottom:0; width:250px; max-width:80vw; background:var(--card); border-right:1px solid var(--border); z-index:50; transform:translateX(-100%); transition:transform .2s ease; display:flex; flex-direction:column; padding:14px 0}
  .drawer.open{transform:translateX(0)}
  .drawerHead{padding:8px 18px 14px; color:var(--dim); font-size:12px; text-transform:uppercase; letter-spacing:.05em; border-bottom:1px solid var(--border); margin-bottom:8px}
  .dlink{display:flex; align-items:center; gap:10px; padding:11px 18px; color:var(--text); text-decoration:none; font-size:14.5px}
  .dlink:hover{background:#1c2029}
  .dlink.active{color:var(--accent); font-weight:600}

  .wrap{max-width:960px; margin:0 auto; padding:24px 16px 60px}
  header{margin-bottom:20px}
  h1{font-size:22px; margin:0; font-weight:600}
  .toolbar{display:flex; gap:10px; align-items:center; margin-bottom:14px; flex-wrap:wrap}
  select, input[type=text]{
    background:var(--card); border:1px solid var(--border); color:var(--text);
    padding:8px 12px; border-radius:8px; font-size:14px; min-width:180px;
  }
  .meta{color:var(--dim); font-size:13px}
  .grid{display:grid; grid-template-columns:repeat(auto-fill, minmax(220px,1fr)); gap:10px}
  .card{background:var(--card); border:1px solid var(--border); border-radius:10px; padding:12px; cursor:pointer; transition:border-color .15s}
  .card:hover{border-color:var(--accent)}
  .nick{font-weight:600}
  .srv{color:var(--dim); font-size:12px; margin-top:2px}
  .seen{color:var(--green); font-size:11px; margin-top:6px}
  .empty{padding:40px; text-align:center; color:var(--dim)}

  /* ---------- аналитика ---------- */
  .analytics{background:var(--card); border:1px solid var(--border); border-radius:12px; padding:16px 18px; margin-bottom:20px}
  .analytics h2{font-size:14.5px; margin:0 0 4px}
  .analytics .sub{color:var(--dim); font-size:12px; margin:0 0 14px}
  .statsRow{display:flex; gap:12px; flex-wrap:wrap; margin-bottom:14px}
  .statPill{background:#1c2029; border:1px solid var(--border); border-radius:8px; padding:8px 14px}
  .statPill .n{color:var(--gold); font-size:18px; font-weight:700}
  .statPill .l{color:var(--dim); font-size:11px}
  #chartWrap svg text{font-family:'Segoe UI',Roboto,Arial,sans-serif}

  /* ---------- modal ---------- */
  .overlay{
    position:fixed; inset:0; background:rgba(6,8,12,.6); display:none;
    align-items:center; justify-content:center; padding:16px; z-index:60;
  }
  .overlay.open{display:flex}
  .modal{
    width:100%; max-width:460px; background:var(--card); border:1px solid var(--border);
    border-radius:14px; padding:0; max-height:86vh; display:flex; flex-direction:column; overflow:hidden;
  }
  .modalHead{padding:16px 18px 10px; border-bottom:1px solid var(--border)}
  .modalNick{font-size:17px; font-weight:700}
  .modalSrv{color:var(--dim); font-size:12px; margin-top:2px}
  .modalClose{
    position:absolute; top:12px; right:14px; background:none; border:none; color:var(--dim);
    font-size:20px; cursor:pointer; line-height:1;
  }
  .modalClose:hover{color:var(--text)}
  .tabs{display:flex; border-bottom:1px solid var(--border); overflow-x:auto}
  .tabBtn{
    flex:1; background:none; border:none; color:var(--dim); padding:10px 8px; font-size:12.5px;
    cursor:pointer; border-bottom:2px solid transparent; white-space:nowrap;
  }
  .tabBtn.active{color:var(--text); border-bottom-color:var(--accent)}
  .tabBody{padding:14px 18px 18px; overflow-y:auto; display:none}
  .tabBody.active{display:block}
  .statRow{display:flex; justify-content:space-between; gap:12px; padding:7px 0; font-size:13.5px; border-bottom:1px solid var(--border)}
  .statRow:last-child{border-bottom:none}
  .statLabel{color:var(--dim)}
  .statVal{font-weight:600; color:var(--gold); text-align:right}
  .noStats{color:var(--dim); font-size:13px; text-align:center; padding:16px 0}

  /* ---------- responsive ---------- */
  @media (max-width: 640px){
    h1{font-size:18px}
    .toolbar{gap:8px}
    select, input[type=text]{min-width:0; flex:1 1 140px; font-size:13px; padding:9px 10px}
    .grid{grid-template-columns:repeat(auto-fill, minmax(150px,1fr))}
  }
</style>
</head>
<body>

<div class="topbar">
  <button class="hbtn" id="hbtn" aria-label="Меню">☰</button>
  <div class="brand">PC Stats</div>
</div>
<div class="drawerOverlay" id="drawerOverlay"></div>
<nav class="drawer" id="drawer">
  <div class="drawerHead">Меню</div>
  <a href="/" class="dlink">🏠 Главная</a>
  <a href="/rates.html" class="dlink">💱 Курс валют</a>
  <a href="/players.html" class="dlink active">🧑‍🤝‍🧑 Игроки</a>
</nav>

<div class="wrap">
  <header>
    <h1>🧑‍🤝‍🧑 Игроки по серверам</h1>
  </header>

  <div class="analytics">
    <h2>Аналитика</h2>
    <div class="sub">Сколько игроков сейчас запустили скрипт, по серверам</div>
    <div class="statsRow" id="statsRow"></div>
    <div id="chartWrap"></div>
  </div>

  <div class="toolbar">
    <select id="serverFilter"><option value="">Все серверы</option></select>
    <input type="text" id="search" placeholder="Поиск ника…">
    <span class="meta" id="count"></span>
  </div>

  <div class="grid" id="grid"></div>
  <div class="empty" id="emptyMsg" style="display:none">Пока никого нет — список появится, когда скрипт начнёт присылать ников.</div>
</div>

<!-- ============ ПРОФИЛЬ ИГРОКА ============ -->
<div class="overlay" id="overlay">
  <div class="modal">
    <div class="modalHead" style="position:relative">
      <button class="modalClose" id="modalClose">✕</button>
      <div class="modalNick" id="mNick">—</div>
      <div class="modalSrv" id="mSrv">—</div>
    </div>
    <div class="tabs" id="tabs"></div>
    <div id="tabBodies"></div>
  </div>
</div>

<script>
// полный список серверов Arizona RP (из ARZ_WIKI_RATES в PCStats.lua)
const ARIZONA_SERVERS = [
  "Brainburg","Bumble Bee","Casa Grande","Chandler","Christmas","Drake","Faraway",
  "Gilbert","Glendale","Holiday","Kingman","Love","Mesa","Mirage","Mobile 1",
  "Mobile 2","Mobile 3","Page","Payson","Phoenix","Prescott","Queen Creek",
  "Red Rock","Saint Rose","Scottdale","Sedona","Show Low","Space","Sun City",
  "Surprise","Tucson","Vice City","Wednesday","Winslow","Yava","Yuma"
];

// поля карточки игрока, сгруппированные по вкладкам — соответствуют
// всем полям, которые скрипт реально собирает в /stats (см. parseStats
// и appendProfileFields в PCStats.lua)
const PROFILE_TABS = [
  { id:"char", label:"Персонаж", fields:[
      ["level","Уровень"], ["job","Работа"], ["org","Организация"], ["position","Должность"],
      ["status","Статус"], ["respect","Респект"], ["accountNumber","Номер аккаунта"],
      ["phone","Телефон"], ["citizenship","Гражданство"], ["family","Семья"], ["gender","Пол"],
      ["bankCard","Банковская карта"], ["accountState","Состояние аккаунта"], ["authDate","Дата регистрации"],
  ]},
  { id:"finance", label:"Финансы", fields:[
      ["cashSas","Наличные SA$"], ["cashVcs","Наличные VC$"], ["bank","Банк"],
      ["euro","Евро"], ["btc","BTC"], ["azCoins","AZ-Coins"], ["moneyDay","На депозите"],
      ["x3Payday","PayDay x3"], ["x4Payday","PayDay x4"],
  ]},
  { id:"combat", label:"Бой", fields:[
      ["health","Здоровье"], ["wanted","Розыск"], ["protection","Защита"], ["regen","Регенерация"],
      ["damage","Урон"], ["luck","Удача"], ["maxHp","Макс. HP"], ["maxArmor","Макс. брони"],
      ["stunChance","Шанс оглушения"], ["bleedChance","Шанс кровотечения"], ["dodgeChance","Шанс уклонения"],
      ["reflectDamage","Отражение урона"], ["blockDamage","Блокировка урона"],
      ["fireRate","Скорострельность"], ["recoil","Отдача"], ["fruitStun","Оглушение плодом"],
  ]},
  { id:"other", label:"Прочее", fields:[
      ["hotel","Отель"], ["hotelRoom","Комната"], ["trailer","Трейлер"],
      ["lawfulness","Законопослушность"], ["warnings","Предупреждения"], ["addiction","Зависимость"],
  ]},
];

const STORAGE_KEY = "pcstats_selected_server";

let allPlayers = [];

function fmtAgo(ts){
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return "в сети только что";
  const m = Math.floor(s/60);
  return "в сети " + m + " мин назад";
}
function fmtVal(v){ return (v === undefined || v === null || v === "") ? null : v; }
function esc(s){ return String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }

function initServerSelect(){
  const sel = document.getElementById("serverFilter");
  sel.innerHTML = '<option value="">Все серверы</option>' +
    ARIZONA_SERVERS.map(s => `<option value="${s}">${s}</option>`).join("");
  // восстанавливаем ранее выбранный сервер вместо сброса на "Все серверы"
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved && ARIZONA_SERVERS.includes(saved)) {
    sel.value = saved;
  }
}

function render(){
  const serverQ = document.getElementById("serverFilter").value.trim().toLowerCase();
  const nickQ = document.getElementById("search").value.trim().toLowerCase();

  const rows = allPlayers.filter(p =>
    (!serverQ || String(p.server||"").trim().toLowerCase() === serverQ) &&
    (!nickQ || p.nick.toLowerCase().includes(nickQ))
  );

  document.getElementById("count").textContent = rows.length + " игрок(ов) онлайн";
  document.getElementById("emptyMsg").style.display = allPlayers.length ? "none" : "block";

  document.getElementById("grid").innerHTML = rows.map((p) => `
    <div class="card" data-idx="${allPlayers.indexOf(p)}">
      <div class="nick">${esc(p.nick)}</div>
      <div class="srv">${esc(p.server)}</div>
      <div class="seen">${fmtAgo(p.lastSeen)}</div>
    </div>
  `).join("");

  document.querySelectorAll(".card").forEach(el => {
    el.addEventListener("click", () => openProfile(allPlayers[el.dataset.idx]));
  });

  renderAnalytics();
}

/* ---------- аналитика: сколько игроков и на каких серверах ---------- */
function renderAnalytics(){
  const counts = {};
  allPlayers.forEach(p => { counts[p.server] = (counts[p.server] || 0) + 1; });
  const entries = Object.entries(counts).sort((a,b) => b[1]-a[1]);

  document.getElementById("statsRow").innerHTML = `
    <div class="statPill"><div class="n">${allPlayers.length}</div><div class="l">игроков онлайн</div></div>
    <div class="statPill"><div class="n">${entries.length}</div><div class="l">активных серверов</div></div>
  `;

  const wrap = document.getElementById("chartWrap");
  if (entries.length === 0){
    wrap.innerHTML = '<div class="empty" style="padding:20px 0">Пока нет данных для графика</div>';
    return;
  }

  const barH = 22, gap = 8, leftW = 110, rightPad = 34, width = 640;
  const max = entries[0][1];
  const height = entries.length * (barH + gap);

  let svg = `<svg viewBox="0 0 ${width} ${height}" width="100%" height="${height}" style="overflow:visible">`;
  entries.forEach(([server, count], i) => {
    const y = i * (barH + gap);
    const barMaxW = width - leftW - rightPad;
    const barW = Math.max(4, (count / max) * barMaxW);
    svg += `<text x="0" y="${y + barH*0.7}" fill="#e7e9ee" font-size="12">${esc(server)}</text>`;
    svg += `<rect x="${leftW}" y="${y}" width="${barW}" height="${barH}" rx="5" fill="#3aa0ff" opacity="0.85"/>`;
    svg += `<text x="${leftW + barW + 8}" y="${y + barH*0.7}" fill="#e0b94a" font-size="12" font-weight="700">${count}</text>`;
  });
  svg += `</svg>`;
  wrap.innerHTML = svg;
}

/* ---------- профиль игрока (карточка со всеми полями) ---------- */
function hasAnyStats(p){
  const base = new Set(["nick","server","lastSeen"]);
  return Object.keys(p).some(k => !base.has(k) && p[k] !== undefined && p[k] !== null && p[k] !== "");
}

function statRow(label, val){
  return `<div class="statRow"><span class="statLabel">${esc(label)}</span><span class="statVal">${esc(val)}</span></div>`;
}

function openProfile(p){
  document.getElementById("mNick").textContent = p.nick;
  document.getElementById("mSrv").textContent = p.server;

  const tabsEl = document.getElementById("tabs");
  const bodiesEl = document.getElementById("tabBodies");

  if (!hasAnyStats(p)){
    tabsEl.innerHTML = "";
    bodiesEl.innerHTML = '<div class="tabBody active"><div class="noStats">Игрок не поделился статистикой персонажа</div></div>';
    document.getElementById("overlay").classList.add("open");
    return;
  }

  tabsEl.innerHTML = PROFILE_TABS.map((t, i) =>
    `<button class="tabBtn ${i===0?"active":""}" data-tab="${t.id}">${esc(t.label)}</button>`
  ).join("");

  bodiesEl.innerHTML = PROFILE_TABS.map((t, i) => {
    const rows = t.fields
      .map(([key, label]) => [label, fmtVal(p[key])])
      .filter(([, v]) => v !== null)
      .map(([label, v]) => statRow(label, v))
      .join("");
    return `<div class="tabBody ${i===0?"active":""}" data-tab="${t.id}">${rows || '<div class="noStats">Нет данных по этому разделу</div>'}</div>`;
  }).join("");

  tabsEl.querySelectorAll(".tabBtn").forEach(btn => {
    btn.addEventListener("click", () => {
      tabsEl.querySelectorAll(".tabBtn").forEach(b => b.classList.remove("active"));
      bodiesEl.querySelectorAll(".tabBody").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      bodiesEl.querySelector(`.tabBody[data-tab="${btn.dataset.tab}"]`).classList.add("active");
    });
  });

  document.getElementById("overlay").classList.add("open");
}

document.getElementById("modalClose").addEventListener("click", () => {
  document.getElementById("overlay").classList.remove("open");
});
document.getElementById("overlay").addEventListener("click", e => {
  if (e.target.id === "overlay") document.getElementById("overlay").classList.remove("open");
});

async function load(){
  try{
    const res = await fetch("/api/players");
    const data = await res.json();
    allPlayers = data.players || [];
    render();
  }catch(e){
    console.error(e);
  }
}

initServerSelect();
document.getElementById("search").addEventListener("input", render);
document.getElementById("serverFilter").addEventListener("change", e => {
  localStorage.setItem(STORAGE_KEY, e.target.value);
  render();
});
load();
setInterval(load, 20000); // авто-обновление раз в 20 сек

/* ---------- выдвижное меню ---------- */
(function(){
  const btn = document.getElementById("hbtn");
  const drawer = document.getElementById("drawer");
  const overlay = document.getElementById("drawerOverlay");
  function open(){ drawer.classList.add("open"); overlay.classList.add("open"); }
  function close(){ drawer.classList.remove("open"); overlay.classList.remove("open"); }
  btn.addEventListener("click", open);
  overlay.addEventListener("click", close);
  document.querySelectorAll(".dlink").forEach(a => a.addEventListener("click", close));
})();
</script>
</body>
</html>

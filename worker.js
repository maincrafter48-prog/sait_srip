// PC Stats — минимальный бэкенд на Cloudflare Workers + KV.
//
// Что делает:
//  GET /report?token=...&server=...&nick=...&cash=...&...   — скрипт шлёт сюда статы
//  GET /rates?token=...&server=...&az=...&btc=...&...       — скрипт шлёт сюда курс валют
//  GET /data?token=...                                       — сайт читает отсюда JSON
//
// Данные хранятся по приватному token (его придумывает сам игрок и вписывает
// и в настройках скрипта, и в ссылке на сайт) — без токена ни прочитать,
// ни записать ничего нельзя. Никакого списка "все игроки" тут нет: это
// личный дашборд одного человека, не публичный реестр.
//
// ── Как развернуть (бесплатно, 5 минут) ──────────────────────────────
// 1. Зарегистрируйся на https://dash.cloudflare.com (бесплатный план).
// 2. Workers & Pages → Create → Create Worker → вставь этот файл целиком
//    вместо заготовки → Deploy.
// 3. В настройках воркера: Settings → Variables → KV Namespace Bindings →
//    Add binding: Variable name = PCSTATS_KV, создай новый namespace с
//    любым именем (например "pcstats") → Save.
// 4. Скопируй адрес воркера (вида https://pcstats.ТВОЙ-НИК.workers.dev)
//    и вставь его в site/index.html (переменная API_BASE) и в настройки
//    Lua-скрипта (поле "Адрес сайта").
// 5. Придумай любой длинный случайный токен (например сгенерируй на
//    https://www.uuidgenerator.net) и впиши его И в настройки скрипта,
//    И в ссылку на сайт (index.html#token=ТВОЙ_ТОКЕН). Держи его в
//    секрете — это единственная защита твоих данных.

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    const cors = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,OPTIONS",
    };
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: cors });
    }

    if (path === "/report" && request.method === "GET") {
      const token = url.searchParams.get("token");
      if (!token) return json({ error: "no token" }, 400, cors);
      const data = {
        server: url.searchParams.get("server") || "",
        nick:   url.searchParams.get("nick") || "",
        level:  url.searchParams.get("level") || "",
        job:    url.searchParams.get("job") || "",
        org:    url.searchParams.get("org") || "",
        status: url.searchParams.get("status") || "",
        family: url.searchParams.get("family") || "",
        cash:   num(url.searchParams.get("cash")),
        bank:   num(url.searchParams.get("bank")),
        dep:    num(url.searchParams.get("dep")),
        acc:    num(url.searchParams.get("acc")),
        az:     num(url.searchParams.get("az")),
        btc:    num(url.searchParams.get("btc")),
        eur:    num(url.searchParams.get("eur")),
        vc:     num(url.searchParams.get("vc")),
        asc:    num(url.searchParams.get("asc")),
        grand:  num(url.searchParams.get("grand")),
        updated: Date.now(),
      };
      await env.PCSTATS_KV.put("player:" + token, JSON.stringify(data));
      return json({ ok: true }, 200, cors);
    }

    if (path === "/rates" && request.method === "GET") {
      const token = url.searchParams.get("token");
      if (!token) return json({ error: "no token" }, 400, cors);
      const data = {
        server: url.searchParams.get("server") || "",
        az:     num(url.searchParams.get("az")),
        btc:    num(url.searchParams.get("btc")),
        eur:    num(url.searchParams.get("eur")),
        vc:     num(url.searchParams.get("vc")),
        vcSell: num(url.searchParams.get("vcSell")),
        asc:    num(url.searchParams.get("asc")),
        updated: Date.now(),
      };
      await env.PCSTATS_KV.put("rates:" + token, JSON.stringify(data));
      return json({ ok: true }, 200, cors);
    }

    if (path === "/data" && request.method === "GET") {
      const token = url.searchParams.get("token");
      if (!token) return json({ error: "no token" }, 400, cors);
      const player = await env.PCSTATS_KV.get("player:" + token);
      const rates  = await env.PCSTATS_KV.get("rates:" + token);
      return json({
        player: player ? JSON.parse(player) : null,
        rates:  rates ? JSON.parse(rates) : null,
      }, 200, cors);
    }

    return json({ error: "not found" }, 404, cors);
  },
};

function num(v) {
  const n = parseFloat(v);
  return isNaN(n) ? 0 : n;
}

function json(obj, status, headers) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json", ...headers },
  });
}

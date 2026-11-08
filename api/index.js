// Clean headline page for capital.bg: titles, dates and links only.
const FEEDS = [
  "https://www.capital.bg/rss/",
  "https://www.capital.bg/rss/?rubrid=0",
  "https://news.google.com/rss/search?q=site:capital.bg&hl=bg&gl=BG&ceid=BG:bg",
];

const decode = (s) =>
  s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
   .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(n))
   .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)))
   .replace(/&quot;/g, '"').replace(/&apos;|&#39;/g, "'")
   .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&")
   .replace(/<[^>]+>/g, "").trim();

const esc = (s) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const tag = (block, name) => {
  const m = block.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`, "i"));
  return m ? decode(m[1]) : "";
};

function parse(xml, fromGoogle) {
  const items = [];
  for (const m of xml.matchAll(/<item[\s>][\s\S]*?<\/item>/gi)) {
    let title = tag(m[0], "title");
    const link = tag(m[0], "link");
    const date = tag(m[0], "pubDate");
    if (fromGoogle) title = title.replace(/\s+-\s+[^-]+$/, "");
    if (title && /^https?:\/\//.test(link)) items.push({ title, link, date });
  }
  return items;
}

async function getItems() {
  for (const url of FEEDS) {
    try {
      const r = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0 (headline-reader)" },
        signal: AbortSignal.timeout(8000),
      });
      if (!r.ok) continue;
      const items = parse(await r.text(), url.includes("news.google"));
      if (items.length) return items.slice(0, 40);
    } catch (_) {}
  }
  return [];
}

function when(d) {
  const t = new Date(d);
  if (isNaN(t)) return "";
  return t.toLocaleString("bg-BG", {
    timeZone: "Europe/Sofia", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit",
  });
}

module.exports = async (req, res) => {
  const items = await getItems();
  const list = items.length
    ? items.map((i) => `
      <li><a href="${esc(i.link)}">
        <span class="t">${esc(i.title)}</span>
        <span class="d">${esc(when(i.date))}</span>
      </a></li>`).join("")
    : `<li class="empty">Няма заредени новини в момента. Опитайте пак след малко.</li>`;

  const updated = new Date().toLocaleTimeString("bg-BG", { timeZone: "Europe/Sofia", hour: "2-digit", minute: "2-digit" });

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "s-maxage=600, stale-while-revalidate=1800");
  res.end(`<!doctype html>
<html lang="bg"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="referrer" content="no-referrer">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="Новини">
<title>Новини</title>
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='20' fill='%231a1a1a'/><text x='50' y='70' font-size='60' text-anchor='middle' fill='white' font-family='Georgia'>Н</text></svg>">
<style>
  :root { --bg:#faf8f4; --fg:#1a1a1a; --muted:#6b6660; --line:#e4dfd7; --accent:#9b2c1f; }
  @media (prefers-color-scheme: dark) { :root { --bg:#141312; --fg:#f1ede6; --muted:#9a948b; --line:#2b2926; --accent:#e07a68; } }
  * { box-sizing:border-box; }
  body { margin:0; background:var(--bg); color:var(--fg); font-family:Georgia, "Times New Roman", serif; }
  header { padding:28px 18px 14px; border-bottom:2px solid var(--fg); max-width:760px; margin:0 auto; }
  h1 { margin:0; font-size:34px; letter-spacing:-0.5px; }
  .sub { color:var(--muted); font-family:-apple-system, system-ui, sans-serif; font-size:15px; margin-top:6px; }
  ul { list-style:none; margin:0 auto; padding:0 18px 40px; max-width:760px; }
  li { border-bottom:1px solid var(--line); }
  a { display:block; padding:18px 0; color:inherit; text-decoration:none; }
  a:active .t { color:var(--accent); }
  .t { display:block; font-size:22px; line-height:1.3; }
  .d { display:block; margin-top:6px; color:var(--muted); font-family:-apple-system, system-ui, sans-serif; font-size:15px; }
  .empty { padding:30px 0; font-size:20px; color:var(--muted); }
</style>
</head><body>
<header><h1>Новини</h1><div class="sub">Капитал · обновено в ${updated}</div></header>
<ul>${list}</ul>
</body></html>`);
};

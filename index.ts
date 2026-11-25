// Freestyle Tounsi — AI rhyme helper (Supabase Edge Function "rhyme")
// GET  -> {ok:true}            (the site uses this to know the helper is on)
// POST {sound, words[]} -> {words:[{w,g}]}
// Needs the secret ANTHROPIC_API_KEY. Optional secret MODEL.

const ALLOWED = [
  "https://freestyle.living-the.life",
  "https://ebrahimsouissi.github.io",
];
const PER_HOUR = 20; // requests per visitor per hour (per running instance)
const hits = new Map<string, number[]>();

Deno.serve(async (req) => {
  const origin = req.headers.get("origin") ?? "";
  const cors = {
    "Access-Control-Allow-Origin": ALLOWED.includes(origin) ? origin : ALLOWED[0],
    "Access-Control-Allow-Headers": "apikey, authorization, content-type, x-client-info",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Vary": "Origin",
  };
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method === "GET") return json({ ok: true });
  if (req.method !== "POST") return json({ error: "method" }, 405);
  if (origin && !ALLOWED.includes(origin)) return json({ error: "origin" }, 403);

  // simple rate limit
  const ip = (req.headers.get("x-forwarded-for") ?? "?").split(",")[0].trim();
  const now = Date.now();
  const list = (hits.get(ip) ?? []).filter((t) => now - t < 3600_000);
  if (list.length >= PER_HOUR) return json({ error: "429 too many requests" }, 429);
  list.push(now);
  hits.set(ip, list);

  let body: { sound?: unknown; words?: unknown };
  try { body = await req.json(); } catch { return json({ error: "bad json" }, 400); }
  const sound = String(body.sound ?? "").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 8);
  const words = (Array.isArray(body.words) ? body.words : [])
    .map(String).filter((w) => /^[A-Za-z0-9]{2,20}$/.test(w)).slice(0, 15);
  if (!sound || !words.length) return json({ error: "missing sound or words" }, 400);

  const key = Deno.env.get("ANTHROPIC_API_KEY");
  if (!key) return json({ error: "server not configured" }, 500);

  const prompt =
    `You help a Tunisian freestyle rap training game.\n` +
    `These words end in the sound "-${sound}": ${words.join(", ")}.\n` +
    `Suggest up to 8 OTHER common, real Tunisian Darija words that rhyme with them (same ending sound), ` +
    `written in Tunisian Arabizi (Latin letters; use 3, 7, 9, 5 for Arabic sounds), as people really write them online.\n` +
    `Rules: one word each, 2 to 20 characters, letters and digits only, not in the list above, ` +
    `no insults, no vulgar, sexual, hateful or religious-mockery words.\n` +
    `For each, give a short French meaning (max 30 characters).\n` +
    `Reply with ONLY a JSON array, nothing else: [{"w":"word","g":"sens en français"}]`;

  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({
      model: Deno.env.get("MODEL") ?? "claude-haiku-5-5",
      max_tokens: 400,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!r.ok) return json({ error: "ai " + r.status }, 502);

  const data = await r.json();
  const text = (data.content ?? []).map((c: { text?: string }) => c.text ?? "").join("");
  const m = text.match(/\[[\s\S]*\]/);
  let out: { w?: unknown; g?: unknown }[] = [];
  try { out = JSON.parse(m ? m[0] : "[]"); } catch { out = []; }
  const seen = new Set(words.map((w) => w.toLowerCase()));
  const clean = out
    .map((x) => ({ w: String(x?.w ?? "").trim(), g: String(x?.g ?? "").trim().slice(0, 40) }))
    .filter((x) => /^[A-Za-z0-9]{2,20}$/.test(x.w) && /[A-Za-z]/.test(x.w) && !seen.has(x.w.toLowerCase()))
    .slice(0, 8);
  return json({ words: clean });
});

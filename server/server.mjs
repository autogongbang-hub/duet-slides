// Duet Slides server: serves the app, the giving page and the OBS overlay,
// talks to PayPal (Orders v2 + webhooks) and pushes live totals over SSE.
// No dependencies. Node 20+. Secrets come from ../.env and are never logged.
import http from "node:http";
import { readFile, writeFile, mkdir, rename } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import { join, dirname, extname, normalize, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID, timingSafeEqual } from "node:crypto";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
loadEnv(join(ROOT, ".env"));
const ENV = process.env;
const AI = await import("./ai.mjs"); // after loadEnv: reads CLAUDE_* from the environment
const PORT = +ENV.PORT || 8787;
const HOST = ENV.HOST || (ENV.RENDER === "true" ? "0.0.0.0" : "127.0.0.1"); // Render routes to all interfaces; locally stay private
const PP_BASE = ENV.PAYPAL_ENV === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";
const DATA = join(ROOT, "data", "store.json");
const CURRENCY = "USD";
const MAX_SPLIT = 10000; // per purpose, per gift

function loadEnv(file) {
  if (!existsSync(file)) return;
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}
const hasPayPal = () => !!(ENV.PAYPAL_CLIENT_ID && ENV.PAYPAL_CLIENT_SECRET);

// ---------- store (one JSON file; swap for a KV store when deployed) ----------
const DEFAULT_CAMPAIGN = {
  id: "missions-2026",
  title: "Guatemala mission trip",
  title2: "Viaje misionero a Guatemala",
  lang2: "es",
  host: "Demo Bilingual Church",
  purposes: [
    { id: "travel", name: "Team travel", name2: "Viaje del equipo", goal: 2000 },
    { id: "clinic", name: "Medical clinic", name2: "Clínica médica", goal: 800 },
    { id: "kids", name: "Kids program", name2: "Programa para niños", goal: 200 },
  ],
};
let store = { campaign: DEFAULT_CAMPAIGN, pending: {}, gifts: [] };
async function loadStore() {
  try { store = Object.assign(store, JSON.parse(await readFile(DATA, "utf8"))); } catch {}
}
let saving = Promise.resolve();
function saveStore() {
  saving = saving.then(async () => {
    await mkdir(dirname(DATA), { recursive: true });
    const tmp = DATA + ".tmp";
    await writeFile(tmp, JSON.stringify(store, null, 1));
    await rename(tmp, DATA);
  }).catch(e => console.error("store save failed:", e.message));
  return saving;
}
function totals() {
  const by = Object.fromEntries(store.campaign.purposes.map(p => [p.id, 0]));
  let sum = 0, count = 0;
  for (const g of store.gifts) {
    if (g.campaign !== store.campaign.id) continue;
    count++;
    for (const s of g.splits) { if (s.purpose in by) { by[s.purpose] += s.amount; sum += s.amount; } }
  }
  const goal = store.campaign.purposes.reduce((a, p) => a + (+p.goal || 0), 0);
  return { by: roundAll(by), sum: r2(sum), goal, count };
}
const r2 = n => Math.round(n * 100) / 100;
const roundAll = o => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, r2(v)]));
function publicState() {
  const recent = store.gifts.filter(g => g.campaign === store.campaign.id).slice(-5).map(publicGift);
  return { campaign: store.campaign, totals: totals(), recent, currency: CURRENCY };
}
const publicGift = g => ({ id: g.id, at: g.at, name: g.showName ? g.firstName || "A friend" : "A friend", amount: g.amount, splits: g.splits });

// ---------- live updates (SSE) ----------
const clients = new Set();
function broadcast(type, data) {
  const msg = `event: ${type}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const res of clients) res.write(msg);
}
setInterval(() => { for (const res of clients) res.write(": ping\n\n"); }, 25000).unref();

// ---------- PayPal ----------
let tokenCache = { value: "", exp: 0 };
async function ppToken() {
  if (tokenCache.value && Date.now() < tokenCache.exp) return tokenCache.value;
  const auth = Buffer.from(`${ENV.PAYPAL_CLIENT_ID}:${ENV.PAYPAL_CLIENT_SECRET}`).toString("base64");
  const r = await fetch(PP_BASE + "/v1/oauth2/token", {
    method: "POST", headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: "grant_type=client_credentials",
  });
  const j = await r.json();
  if (!r.ok) throw httpErr(502, "PayPal auth failed: " + (j.error || r.status));
  tokenCache = { value: j.access_token, exp: Date.now() + (j.expires_in - 60) * 1000 };
  return tokenCache.value;
}
async function pp(path, body, method = "POST", extra = {}) {
  const r = await fetch(PP_BASE + path, {
    method, headers: { Authorization: `Bearer ${await ppToken()}`, "Content-Type": "application/json", ...extra },
    body: body ? JSON.stringify(body) : undefined,
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw httpErr(r.status === 422 ? 422 : 502, `PayPal ${path}: ${j.name || r.status} ${j.message || ""}`.trim(), j);
  return j;
}
function httpErr(status, message, detail) { const e = new Error(message); e.status = status; e.detail = detail; return e; }

function cleanSplits(raw) {
  const ids = new Set(store.campaign.purposes.map(p => p.id));
  const splits = [];
  for (const s of Array.isArray(raw) ? raw : []) {
    const amount = r2(+s?.amount);
    if (!ids.has(s?.purpose) || !(amount >= 1) || amount > MAX_SPLIT) continue;
    if (splits.some(x => x.purpose === s.purpose)) continue;
    splits.push({ purpose: s.purpose, amount });
  }
  if (!splits.length) throw httpErr(400, "Choose at least one purpose with $1 or more.");
  return splits;
}

async function createOrder(body) {
  const splits = cleanSplits(body.splits);
  const c = store.campaign, total = r2(splits.reduce((a, s) => a + s.amount, 0));
  const name = id => c.purposes.find(p => p.id === id).name;
  const order = await pp("/v2/checkout/orders", {
    intent: "CAPTURE",
    purchase_units: [{
      reference_id: c.id,
      description: `${c.title} (${c.host})`.slice(0, 127),
      custom_id: c.id,
      amount: { currency_code: CURRENCY, value: total.toFixed(2), breakdown: { item_total: { currency_code: CURRENCY, value: total.toFixed(2) } } },
      items: splits.map(s => ({ name: name(s.purpose).slice(0, 127), sku: s.purpose, quantity: "1", /* category DONATION needs a PayPal-approved account (PERMISSION_DENIED_FOR_DONATION_ITEMS) */
        unit_amount: { currency_code: CURRENCY, value: s.amount.toFixed(2) } })),
    }],
    payment_source: { paypal: { experience_context: { shipping_preference: "NO_SHIPPING", user_action: "PAY_NOW", brand_name: c.host.slice(0, 127) } } },
  }, "POST", { "PayPal-Request-Id": randomUUID() });
  store.pending[order.id] = { campaign: c.id, splits, total, showName: !!body.showName, at: Date.now() };
  prunePending();
  await saveStore();
  return { id: order.id };
}
function prunePending() {
  const old = Date.now() - 3 * 864e5;
  for (const [k, v] of Object.entries(store.pending)) if (v.at < old) delete store.pending[k];
}

// one place that turns a completed capture into a gift (capture response and webhook both land here)
async function recordCapture({ orderId, captureId, amount, payerFirst }) {
  if (store.gifts.some(g => g.id === captureId)) return null; // already counted
  const p = store.pending[orderId];
  if (!p) { console.warn("capture for unknown order", orderId); return null; }
  if (Math.abs(r2(+amount) - p.total) > 0.009) console.warn("capture amount differs from order", orderId);
  const gift = { id: captureId, order: orderId, campaign: p.campaign, splits: p.splits, amount: r2(+amount),
    firstName: String(payerFirst || "").slice(0, 30), showName: p.showName, at: Date.now() };
  store.gifts.push(gift);
  delete store.pending[orderId];
  await saveStore();
  broadcast("gift", { gift: publicGift(gift), totals: totals() });
  return gift;
}

async function captureOrder(orderId) {
  if (!/^[A-Z0-9]{10,40}$/.test(orderId)) throw httpErr(400, "bad order id");
  if (!store.pending[orderId]) {
    const done = store.gifts.find(g => g.order === orderId);
    if (done) return { status: "COMPLETED", gift: publicGift(done) };
    throw httpErr(404, "unknown order");
  }
  const j = await pp(`/v2/checkout/orders/${orderId}/capture`, {}, "POST", { "PayPal-Request-Id": "cap-" + orderId });
  const cap = j.purchase_units?.[0]?.payments?.captures?.[0];
  if (j.status !== "COMPLETED" || !cap || cap.status !== "COMPLETED") return { status: cap?.status || j.status };
  const gift = await recordCapture({ orderId, captureId: cap.id, amount: cap.amount.value, payerFirst: j.payer?.name?.given_name });
  return { status: "COMPLETED", gift: gift ? publicGift(gift) : null };
}

async function handleWebhook(req, raw) {
  if (!ENV.PAYPAL_WEBHOOK_ID) throw httpErr(503, "webhook id not set");
  const h = k => req.headers[k];
  const event = JSON.parse(raw);
  const v = await pp("/v1/notifications/verify-webhook-signature", {
    auth_algo: h("paypal-auth-algo"), cert_url: h("paypal-cert-url"), transmission_id: h("paypal-transmission-id"),
    transmission_sig: h("paypal-transmission-sig"), transmission_time: h("paypal-transmission-time"),
    webhook_id: ENV.PAYPAL_WEBHOOK_ID, webhook_event: event,
  });
  if (v.verification_status !== "SUCCESS") throw httpErr(400, "webhook signature not verified");
  if (event.event_type === "PAYMENT.CAPTURE.COMPLETED") {
    const cap = event.resource;
    const g = await recordCapture({ orderId: cap?.supplementary_data?.related_ids?.order_id, captureId: cap?.id, amount: cap?.amount?.value });
    console.log(`webhook verified: ${event.event_type} -> ${g ? "new gift recorded" : "already counted or unknown order"}`);
  } else console.log(`webhook verified: ${event.event_type} (ignored)`);
  broadcast("webhook", { type: event.event_type, at: Date.now() });
}

// ---------- campaign editing (admin token) ----------
function checkAdmin(req) {
  const want = ENV.ADMIN_TOKEN || "";
  const got = (req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  const a = Buffer.from(got), b = Buffer.from(want);
  if (!want || a.length !== b.length || !timingSafeEqual(a, b)) throw httpErr(401, "admin token required");
}
function cleanCampaign(c) {
  const str = (v, n) => String(v ?? "").trim().slice(0, n);
  const purposes = (Array.isArray(c?.purposes) ? c.purposes : []).slice(0, 6).map((p, i) => ({
    id: str(p.id, 24).toLowerCase().replace(/[^a-z0-9-]/g, "") || "p" + (i + 1),
    name: str(p.name, 60), name2: str(p.name2, 60), goal: Math.max(0, Math.min(1e6, Math.round(+p.goal || 0))),
  })).filter(p => p.name);
  if (!str(c?.title, 80) || !purposes.length) throw httpErr(400, "title and at least one purpose are required");
  return { id: str(c.id, 40) || "c-" + Date.now().toString(36), title: str(c.title, 80), title2: str(c.title2, 80),
    lang2: str(c.lang2, 5), host: str(c.host, 80) || "Our church", purposes };
}

// ---------- AI (drafts only; people approve) ----------
// A public demo must not let strangers burn the AI quota: per-IP and per-day caps.
const AI_DAILY = +ENV.AI_DAILY_LIMIT || 300, AI_PER_IP = +ENV.AI_PER_IP_10MIN || 20;
const aiUse = { day: "", n: 0, ip: new Map() };
function aiGate(req) {
  if (!AI.hasAI()) throw httpErr(503, "AI is not set up on this server");
  const day = new Date().toISOString().slice(0, 10);
  if (aiUse.day !== day) { aiUse.day = day; aiUse.n = 0; }
  const ip = String(req.headers["x-forwarded-for"] || req.socket.remoteAddress || "").split(",")[0].trim();
  const now = Date.now(), hits = (aiUse.ip.get(ip) || []).filter(t => now - t < 600000);
  if (aiUse.n >= AI_DAILY || hits.length >= AI_PER_IP) throw httpErr(429, "AI limit reached for now, try again later");
  hits.push(now); aiUse.ip.set(ip, hits); aiUse.n++;
  if (aiUse.ip.size > 5000) aiUse.ip.clear();
}
const agentTools = {
  state: () => ({ campaign: store.campaign, totals: totals(), currency: CURRENCY }),
  paypal: async () => {
    if (!hasPayPal()) return { ok: false, error: "PayPal keys are not set on this server" };
    try { await ppToken(); return { ok: true, env: ENV.PAYPAL_ENV || "sandbox", currency: CURRENCY, checkout: "PayPal Orders v2, split by purpose", webhook: !!ENV.PAYPAL_WEBHOOK_ID }; }
    catch (e) { return { ok: false, error: e.message }; }
  },
  validate: c => {
    const purposes = (Array.isArray(c.purposes) ? c.purposes : []).map((p, i) => ({ ...p,
      id: String(p.name || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 20) || "p" + (i + 1) }));
    const errs = [];
    if (!purposes.length || purposes.length > 6) errs.push("use 1 to 6 purposes");
    purposes.forEach(p => { if (!(+p.goal > 0)) errs.push(`goal for "${p.name}" must be a positive whole number`);
      if (String(p.name || "").length > 40) errs.push(`purpose name "${p.name}" is too long`); });
    const ids = purposes.map(p => p.id); ids.forEach((id, i) => { if (ids.indexOf(id) !== i) purposes[i].id = id + "-" + (i + 1); });
    if (errs.length) throw httpErr(400, errs.join("; "));
    return cleanCampaign({ ...c, host: c.host || store.campaign.host, id: "", purposes });
  },
};

// ---------- http ----------
const MIME = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8", ".json": "application/json; charset=utf-8", ".svg": "image/svg+xml", ".png": "image/png",
  ".webp": "image/webp", ".ico": "image/x-icon", ".txt": "text/plain; charset=utf-8" };
const STATIC = [["/give/", join(ROOT, "web", "give")], ["/overlay/", join(ROOT, "web", "overlay")], ["/screen/", join(ROOT, "web", "screen")], ["/host/", join(ROOT, "web", "host")],
  ["/vendor/", join(ROOT, "web", "vendor")], ["/", join(ROOT, "app")]];

async function serveStatic(req, res, url) {
  for (const [prefix, dir] of STATIC) {
    if (!url.pathname.startsWith(prefix) && url.pathname + "/" !== prefix) continue;
    if (url.pathname + "/" === prefix) { res.writeHead(301, { Location: prefix + url.search }); return res.end(); }
    let rel; try { rel = decodeURIComponent(url.pathname.slice(prefix.length)) || "index.html"; } catch { return send(res, 400, { error: "bad path" }); }
    if (rel.endsWith("/")) rel += "index.html";
    const file = normalize(join(dir, rel));
    if (!file.startsWith(dir + sep) && file !== dir) break;
    try {
      const buf = await readFile(file);
      res.writeHead(200, { "Content-Type": MIME[extname(file)] || "application/octet-stream", "Cache-Control": "no-cache" });
      return res.end(buf);
    } catch { break; }
  }
  send(res, 404, { error: "not found" });
}
function send(res, status, obj) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
  res.end(JSON.stringify(obj));
}
function readBody(req, limit = 1e6) {
  return new Promise((ok, bad) => {
    let n = 0; const parts = [];
    req.on("data", c => { n += c.length; if (n > limit) { bad(httpErr(413, "too large")); req.destroy(); } else parts.push(c); });
    req.on("end", () => ok(Buffer.concat(parts).toString("utf8")));
    req.on("error", bad);
  });
}
const json = async req => { const t = await readBody(req); try { return t ? JSON.parse(t) : {}; } catch { throw httpErr(400, "bad json"); } };

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://x");
  const p = url.pathname, m = req.method;
  try {
    if (p === "/api/config" && m === "GET")
      return send(res, 200, { paypal: hasPayPal(), clientId: ENV.PAYPAL_CLIENT_ID || "", currency: CURRENCY, env: ENV.PAYPAL_ENV || "sandbox",
        publicUrl: (ENV.PUBLIC_URL || ENV.RENDER_EXTERNAL_URL || "").replace(/\/+$/, ""), ai: AI.hasAI(), demoResetMinutes: DEMO_RESET_MIN }); // PUBLIC_URL: the address phones can reach (QR)
    if (p === "/api/state" && m === "GET") return send(res, 200, publicState());
    if (p === "/api/events" && m === "GET") {
      res.writeHead(200, { "Content-Type": "text/event-stream", "Cache-Control": "no-store, no-transform", Connection: "keep-alive", "X-Accel-Buffering": "no" });
      res.write(`retry: 3000\n:${" ".repeat(2048)}\n\n`); // pad past proxy buffers
      res.write(`event: state\ndata: ${JSON.stringify(publicState())}\n\n`);
      clients.add(res); req.on("close", () => clients.delete(res)); return;
    }
    if (p === "/api/orders" && m === "POST") {
      if (!hasPayPal()) throw httpErr(503, "PayPal keys are not set on the server");
      return send(res, 201, await createOrder(await json(req)));
    }
    const cap = p.match(/^\/api\/orders\/([A-Z0-9]+)\/capture$/);
    if (cap && m === "POST") return send(res, 200, await captureOrder(cap[1]));
    if (p === "/api/paypal/webhook" && m === "POST") { await handleWebhook(req, await readBody(req)); return send(res, 200, { ok: true }); }
    if (p === "/api/campaign" && m === "PUT") {
      checkAdmin(req);
      const body = await json(req); if (!body.host) body.host = store.campaign.host; // keep the church name unless it is changed
      store.campaign = cleanCampaign(body); store.changedAt = Date.now(); await saveStore();
      broadcast("state", publicState()); return send(res, 200, publicState());
    }
    if (p === "/api/ai/translate" && m === "POST") {
      const b = await json(req); aiGate(req);
      return send(res, 200, { lines: await AI.translateLines(b), model: "claude" });
    }
    if (p === "/api/ai/campaign" && m === "POST") {
      const b = await json(req); aiGate(req);
      return send(res, 200, await AI.runCampaignAgent({ brief: b.brief, lang2: b.lang2, tools: agentTools }));
    }
    if (p.startsWith("/api/")) return send(res, 404, { error: "not found" });
    if (m !== "GET" && m !== "HEAD") return send(res, 405, { error: "method not allowed" });
    return await serveStatic(req, res, url);
  } catch (e) {
    const status = e.status || 500;
    if (status >= 500) console.error(m, p, e.message);
    send(res, status, { error: status >= 500 && !e.status ? "server error" : e.message });
  }
});

await loadStore();

// ---------- public demo: go back to the sample campaign ----------
// Judges get the admin token, so anyone can change the demo campaign. With DEMO_RESET_MINUTES set,
// the sample campaign comes back that many minutes after the last change. Gifts are kept.
const DEMO_RESET_MIN = +ENV.DEMO_RESET_MINUTES || 0;
function demoReset() {
  if (!DEMO_RESET_MIN || store.campaign.id === DEFAULT_CAMPAIGN.id) return;
  if (Date.now() - (store.changedAt || 0) < DEMO_RESET_MIN * 60000) return;
  store.campaign = DEFAULT_CAMPAIGN; store.changedAt = 0; saveStore();
  broadcast("state", publicState());
  console.log("demo: back to the sample campaign");
}
if (DEMO_RESET_MIN) { demoReset(); setInterval(demoReset, 60000).unref(); }
server.listen(PORT, HOST, () => {
  console.log(`Duet Slides on http://${HOST}:${PORT}/  (giving /give/, overlay /overlay/)`);
  console.log(`AI drafts: ${AI.hasAI() ? "on" : "off (CLAUDE_API_KEY missing)"}`);
  console.log(`PayPal keys: ${hasPayPal() ? "set" : "missing (giving is disabled)"} · env ${ENV.PAYPAL_ENV || "sandbox"} · webhook id ${ENV.PAYPAL_WEBHOOK_ID ? "set" : "missing"}`);
});

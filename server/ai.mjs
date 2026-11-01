// AI helpers for Duet Slides: (1) draft the second-language line of each slide,
// (2) a small campaign agent that drafts a bilingual giving campaign with tools.
// Claude (Sonnet) through the official Anthropic SDK. The key lives in .env as
// CLAUDE_API_KEY (its own name, so it never changes how other tools on this machine bill)
// and is never logged.
// Nothing the AI writes goes live by itself: the operator reviews every line and
// approves the campaign before it reaches the giving page, the overlay or the screen.
import Anthropic from "@anthropic-ai/sdk";

const ENV = process.env;
const MODEL = () => ENV.CLAUDE_MODEL || "claude-sonnet-5-5";
export const hasAI = () => !!ENV.CLAUDE_API_KEY;

let client = null;
function claude() {
  if (!hasAI()) throw aiErr(503, "AI is not set up on the server (CLAUDE_API_KEY)");
  if (!client) client = new Anthropic({ apiKey: ENV.CLAUDE_API_KEY, baseURL: ENV.CLAUDE_BASE_URL || undefined, timeout: 60000, maxRetries: 2 });
  return client;
}

const LANGS = { en: "English", es: "Spanish", ko: "Korean", zh: "Simplified Chinese", ja: "Japanese", pt: "Portuguese", fr: "French", vi: "Vietnamese", tl: "Tagalog" };
export const langName = c => LANGS[c] || "";

function aiErr(status, message) { const e = new Error(message); e.status = status; return e; }

// One request. A safety decline is re-run server-side on Anthropic's recommended fallback model.
async function ask(params) {
  let r;
  try {
    r = await claude().beta.messages.create({ model: MODEL(), betas: ["server-side-fallback-2026-07-01"], fallbacks: "default", ...params });
  } catch (e) {
    if (e instanceof Anthropic.AuthenticationError) throw aiErr(502, "AI key was rejected");
    if (e instanceof Anthropic.RateLimitError) throw aiErr(429, "AI rate limit reached, try again in a minute");
    if (e instanceof Anthropic.BadRequestError) throw aiErr(502, "AI request was not accepted");
    if (e instanceof Anthropic.APIConnectionError) throw aiErr(502, "Could not reach the AI service");
    if (e instanceof Anthropic.APIError) throw aiErr(502, "AI error " + (e.status || ""));
    throw e;
  }
  if (r.stop_reason === "refusal") throw aiErr(422, "The AI declined this text");
  if (r.stop_reason === "max_tokens") throw aiErr(502, "AI answer was cut off, try fewer slides");
  return r;
}
const textOf = r => r.content.filter(b => b.type === "text").map(b => b.text).join("");

// ---------- 1) second-language line ----------
const TRANSLATE_SYS = `You translate text for slides projected during a live church service.
Rules:
- Write your own fresh translation. Never quote a published translation of a song or a Bible version.
- Keep the meaning; do not add, explain or drop anything. No notes, no quotation marks around the result.
- Keep the same number of lines inside each item (lines are separated by "\\n"), so each line sits under its source line.
- Short, natural and easy to read aloud. Songs: keep it singable and keep the register (reverent, not casual).
- Names of God, people and places use the usual form in the target language.
- Return exactly one translation per input item, in the same order.`;

export async function translateLines({ items, to, from, kind }) {
  const target = langName(to); if (!target) throw aiErr(400, "unsupported target language");
  const list = (Array.isArray(items) ? items : []).map(s => String(s ?? "").slice(0, 600));
  if (!list.length || list.length > 80) throw aiErr(400, "send 1 to 80 items");
  const src = from && langName(from) ? langName(from) : "the source language (detect it)";
  const r = await ask({
    max_tokens: 8000,
    system: TRANSLATE_SYS,
    output_config: { effort: "low", format: { type: "json_schema", schema: {
      type: "object", properties: { lines: { type: "array", items: { type: "string" } } }, required: ["lines"], additionalProperties: false } } },
    messages: [{ role: "user", content: `Translate from ${src} into ${target}. Content type: ${kind === "bible" ? "Bible verse" : kind === "notice" ? "church announcement" : "worship song lyrics"}.
Items (JSON array):
${JSON.stringify(list)}` }],
  });
  let out; try { out = JSON.parse(textOf(r)).lines; } catch { throw aiErr(502, "AI answer was not valid JSON"); }
  if (!Array.isArray(out) || out.length !== list.length) throw aiErr(502, `AI returned ${out?.length ?? 0} items for ${list.length}`);
  return out.map((t, i) => {
    let s = String(t ?? "").replace(/\r\n?/g, "\n").trim();
    const want = list[i].split("\n").length, got = s.split("\n").length;
    if (want === 1 && got > 1) s = s.replace(/\s*\n\s*/g, " "); // keep one-line items on one line
    return s.slice(0, 900);
  });
}

// ---------- 2) campaign agent ----------
const AGENT_SYS = `You are the giving assistant inside Duet Slides, a bilingual slide and giving tool for churches.
The operator describes a fundraising need. Your job: draft one giving campaign that the operator will review before anything goes live.
Work in this order:
1. Call get_giving_state to see the current campaign and what has been given so far.
2. Call check_paypal to confirm donations can be received.
3. Call propose_campaign once with your draft. If it returns errors, fix them and call it again.
Campaign rules:
- 1 to 4 purposes (at most 6), each with a whole-dollar goal. If the operator gives a total but no split, split it sensibly and say so.
- Titles and purpose names are short (purpose names under 28 characters), plain and warm. No emoji, no hype, no guilt.
- Fill the second-language fields (title2, name2) in the congregation's second language with your own translation.
- Use only facts the operator gave. Never invent church names, people, numbers or deadlines. Leave host empty unless the operator named the church.
After the proposal is accepted, reply to the operator in plain text (no Markdown, no lists, no bold), 2-4 short sentences: what you drafted, any assumption you made, and that nothing is live until they approve.`;

const EMPTY = { type: "object", properties: {}, required: [], additionalProperties: false };
const TOOLS = [
  { name: "get_giving_state", description: "Current campaign (title, purposes, goals) and totals raised so far.", strict: true, input_schema: EMPTY },
  { name: "check_paypal", description: "Checks that the PayPal account on this server can accept donations (sandbox or live) and returns the currency.", strict: true, input_schema: EMPTY },
  { name: "propose_campaign", description: "Submit the drafted campaign for the operator to review. Returns ok, or a list of errors to fix and resubmit.", strict: true,
    input_schema: { type: "object", additionalProperties: false, required: ["title", "title2", "lang2", "host", "purposes"], properties: {
      title: { type: "string", description: "Campaign title in the main language" },
      title2: { type: "string", description: "Campaign title in the second language" },
      lang2: { type: "string", description: "Second language code, e.g. es, ko, zh" },
      host: { type: "string", description: "Church or host name, only if the operator gave one; otherwise empty" },
      purposes: { type: "array", items: { type: "object", additionalProperties: false, required: ["name", "name2", "goal"], properties: {
        name: { type: "string" }, name2: { type: "string" }, goal: { type: "integer", description: "Goal in whole dollars" } } } },
    } } },
];

// tools: { state(), paypal(), validate(campaign) -> campaign | throws }
export async function runCampaignAgent({ brief, lang2, tools, maxSteps = 6 }) {
  const want = String(brief || "").trim().slice(0, 2000);
  if (want.length < 8) throw aiErr(400, "describe the need in a sentence or two");
  const hint = langName(lang2) ? `\nThe congregation's second language: ${langName(lang2)} (${lang2}).` : "";
  const messages = [{ role: "user", content: want + hint }];
  const steps = []; let proposal = null;
  for (let i = 0; i < maxSteps; i++) {
    const r = await ask({ max_tokens: 4000, system: AGENT_SYS, tools: TOOLS, output_config: { effort: "medium" }, messages });
    messages.push({ role: "assistant", content: r.content }); // keep the whole turn (thinking blocks included)
    const calls = r.content.filter(b => b.type === "tool_use");
    if (!calls.length) {
      if (!proposal) { messages.push({ role: "user", content: "Please call propose_campaign with your draft now." }); continue; }
      return { proposal, message: textOf(r).trim(), steps };
    }
    const results = [];
    for (const c of calls) {
      let res;
      try {
        if (c.name === "get_giving_state") res = tools.state();
        else if (c.name === "check_paypal") res = await tools.paypal();
        else if (c.name === "propose_campaign") { proposal = tools.validate(c.input || {}); res = { ok: true, note: "Saved as a draft. The operator will review it." }; }
        else res = { ok: false, errors: ["unknown tool"] };
      } catch (e) { res = { ok: false, errors: [e.message] }; }
      const ok = res.ok !== false;
      steps.push({ tool: c.name, ok });
      results.push({ type: "tool_result", tool_use_id: c.id, content: JSON.stringify(res), ...(ok ? {} : { is_error: true }) });
    }
    messages.push({ role: "user", content: results }); // all results of one turn in one message
  }
  if (proposal) return { proposal, message: "Draft ready. Review it below.", steps };
  throw aiErr(502, "The assistant did not finish a draft. Try rephrasing the request.");
}

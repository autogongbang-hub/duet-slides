/* Duet Slides: AI draft for the second-language line (English edition only).
   Adds a bar to the "Foreign-language line" window. The AI fills the boxes as a draft;
   nothing changes on screen until the operator reads the lines and presses Apply.
   Uses globals from index.html: STATE, L2, renderL2, toast, escHtml. */
(function () {
  "use strict";
  const LANGS = [["es", "Spanish"], ["ko", "Korean"], ["zh", "Chinese"], ["pt", "Portuguese"], ["fr", "French"], ["vi", "Vietnamese"], ["tl", "Tagalog"], ["ja", "Japanese"], ["en", "English"]];
  const drafted = new Set(); // slide indexes the AI filled and nobody has touched yet
  let busy = false, aiOn = null;

  const $ = id => document.getElementById(id);
  const css = `
  .ai-l2{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin:0 0 10px;padding:8px 10px;border:1px solid var(--line,#d0d7e2);border-radius:8px}
  .ai-l2 b{font-weight:600}
  .ai-l2 select{min-height:34px;border-radius:6px;padding:0 6px}
  .ai-l2 .btn{min-height:34px}
  .ai-l2 .ai-note{flex-basis:100%;font-size:12px;opacity:.75;margin:0}
  .l2-row.ai-draft .l2-in{outline:2px dashed #2f6fed;outline-offset:-2px}
  .l2-row.ai-draft .l2-n::after{content:"AI draft";display:block;font-size:10px;color:#2f6fed;margin-top:2px}`;

  function defaultLang() {
    try { const d = STATE.settings && STATE.settings.dualLang; if (d && d !== "en") return d; } catch (e) {}
    return "es";
  }
  function mount() {
    const rows = $("l2Rows"); if (!rows || $("aiL2")) return;
    const st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);
    const bar = document.createElement("div"); bar.className = "ai-l2"; bar.id = "aiL2"; bar.setAttribute("translate", "no");
    bar.innerHTML = `<b>✨ AI draft</b><label>into <select id="aiL2Lang">${LANGS.map(([c, n]) => `<option value="${c}">${n}</option>`).join("")}</select></label>
      <button class="btn sm primary" id="aiL2Fill" type="button">Fill empty slides</button>
      <button class="btn sm ghost" id="aiL2Redo" type="button">Redo all</button>
      <p class="ai-note" id="aiL2Note">A starting point, not a final text. Read every line before you press Apply.</p>`;
    rows.parentNode.insertBefore(bar, $("l2How") || rows);
    $("aiL2Fill").addEventListener("click", () => run(false));
    $("aiL2Redo").addEventListener("click", () => run(true));
    rows.addEventListener("input", e => { const ta = e.target.closest("[data-l2sj]"); if (!ta) return;
      drafted.delete(+ta.getAttribute("data-l2sj")); ta.closest(".l2-row").classList.remove("ai-draft"); });
    paintState();
  }
  function paintState() {
    const on = aiOn !== false;
    ["aiL2Fill", "aiL2Redo"].forEach(id => { const b = $(id); if (b) { b.disabled = !on || busy; } });
    const n = $("aiL2Note"); if (n && aiOn === false) n.textContent = "AI is off on this server (no key). You can still paste your own translation.";
  }
  function mark() {
    document.querySelectorAll("#l2Rows [data-l2sj]").forEach(ta => {
      ta.closest(".l2-row").classList.toggle("ai-draft", drafted.has(+ta.getAttribute("data-l2sj"))); });
  }
  async function run(all) {
    if (busy) return;
    const song = STATE.songs[L2.si]; if (!song) return;
    const to = $("aiL2Lang").value;
    const want = []; // [sj, text]
    (song.slides || []).forEach((sl, sj) => { const t = (sl.text || "").trim(); if (!t) return;
      const cur = String(L2.vals.get(sj) || "").trim(); if (all || !cur) want.push([sj, t]); });
    if (!want.length) { toast("Every slide already has a line. Use Redo all to replace them."); return; }
    const uniq = [...new Set(want.map(w => w[1]))];
    busy = true; paintState(); const btn = $(all ? "aiL2Redo" : "aiL2Fill"), label = btn.textContent; btn.textContent = "Drafting…";
    try {
      const r = await fetch("/api/ai/translate", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: uniq, to, kind: "song" }) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || "HTTP " + r.status);
      const map = new Map(uniq.map((t, i) => [t, j.lines[i] || ""]));
      want.forEach(([sj, t]) => { const v = map.get(t); if (v) { L2.vals.set(sj, v); drafted.add(sj); } });
      L2.how = `AI drafted ${want.length} slide${want.length > 1 ? "s" : ""}. Dashed boxes are drafts: read and fix them, then press Apply.`;
      L2.ok = false; renderL2();
    } catch (e) { toast("AI draft failed: " + e.message, 4200); }
    finally { busy = false; btn.textContent = label; paintState(); }
  }

  // re-mark drafts whenever the window redraws its rows
  const orig = window.renderL2;
  if (typeof orig === "function") window.renderL2 = function () { const out = orig.apply(this, arguments); mark(); return out; };
  // a new song in the window starts with no drafts and the operator's language
  const origOpen = window.openL2;
  if (typeof origOpen === "function") window.openL2 = function () {
    drafted.clear(); mount(); const s = $("aiL2Lang"); if (s) s.value = defaultLang();
    // the shared tip says "no automatic translation"; this edition has the AI draft (runs after the UI dictionary)
    const tip = document.querySelector("#l2Modal .l2-tip");
    if (tip) tip.innerHTML = tip.innerHTML.replace(/Please paste a translation you prepared yourself \(no automatic translation\)\.?/, "Paste your own translation, or press <b>✨ AI draft</b> and check every line.");
    return origOpen.apply(this, arguments); };

  fetch("/api/config").then(r => r.json()).then(c => { aiOn = !!c.ai; paintState(); }).catch(() => { aiOn = false; paintState(); });
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount); else mount();
})();

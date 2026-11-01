(function() {
  "use strict";
  if (window.ColorPick) return;
  const SETS = {
    text: [["#ffffff", "흰색"], ["#ffe680", "연노랑"], ["#ffc94d", "금색"], ["#ff9f43", "주황"], ["#9fd3ff", "하늘"], ["#000000", "검정"]],
    bg: [["#000000", "검정"], ["#2a2d34", "짙은 회색"], ["#14213d", "남색"], ["#3b1f3f", "짙은 자주"], ["#3a2a1e", "짙은 갈색"], ["#ffffff", "흰색"]],
    chroma: [["#00ff00", "초록"], ["#0000ff", "파랑"], ["#ff00ff", "마젠타"]]
  };
  const NAMES = {};
  Object.keys(SETS).forEach((k) => SETS[k].forEach(([h, n]) => {
    if (!NAMES[h]) NAMES[h] = n;
  }));
  const STR = {
    more: "색 더보기",
    auto: "자동",
    cur: "지금",
    curTitle: "눌러서 색 더보기",
    cancel: "취소",
    apply: "적용",
    alpha: "진하기",
    alphaHint: "0% 투명 · 100% 불투명",
    alphaPct: "진하기 %",
    recent: "최근 색",
    recentNone: "적용한 색이 여기 남아요",
    prev: "현재",
    next: "예정",
    backPrev: "현재 색으로 되돌리기",
    low: "읽기 어려울 수 있어요",
    sv: "채도와 밝기",
    svText: "채도 {s}%, 밝기 {v}%",
    hue: "색상",
    mode: "입력 방식",
    hexIn: "색상 코드 (HEX)",
    r: "빨강 (R)",
    g: "초록 (G)",
    b: "파랑 (B)"
  };
  const LOW = 3;
  const RKEY = "chanyang-jamak:cp-recent";
  const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
  const h2 = (n) => clamp(Math.round(n), 0, 255).toString(16).padStart(2, "0");
  function parse(v) {
    let h = String(v == null ? "" : v).trim().replace(/^#/, "");
    if (!/^[0-9a-fA-F]+$/.test(h)) return null;
    if (h.length === 3) h = h.split("").map((c) => c + c).join("") + "ff";
    else if (h.length === 4) h = h.split("").map((c) => c + c).join("");
    else if (h.length === 6) h += "ff";
    else if (h.length !== 8) return null;
    return { hex: "#" + h.slice(0, 6).toLowerCase(), a: parseInt(h.slice(6, 8), 16) / 255 };
  }
  const withA = (hex, a) => a >= 0.999 ? hex : hex + h2(a * 255);
  const rgb = (hex) => {
    const n = parseInt(String(hex).slice(1, 7), 16) || 0;
    return [n >> 16 & 255, n >> 8 & 255, n & 255];
  };
  const hexOf = (r, g, b) => "#" + h2(r) + h2(g) + h2(b);
  const css = (hex, a) => a >= 0.999 ? hex : "rgba(" + rgb(hex).join(",") + "," + (+a).toFixed(3) + ")";
  function toHsv(hex) {
    const [r, g, b] = rgb(hex).map((x) => x / 255), mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
    let h = 0;
    if (d) {
      if (mx === r) h = (g - b) / d % 6;
      else if (mx === g) h = (b - r) / d + 2;
      else h = (r - g) / d + 4;
      h *= 60;
      if (h < 0) h += 360;
    }
    return { h, s: mx ? d / mx : 0, v: mx };
  }
  function fromHsv(h, s, v) {
    h = (h % 360 + 360) % 360;
    const c = v * s, x = c * (1 - Math.abs(h / 60 % 2 - 1)), m = v - c;
    const t = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
    return hexOf((t[0] + m) * 255, (t[1] + m) * 255, (t[2] + m) * 255);
  }
  function lum(hex) {
    const w = [0.2126, 0.7152, 0.0722];
    return rgb(hex).reduce((s, c, i) => {
      c /= 255;
      return s + w[i] * (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
    }, 0);
  }
  function ratio(a, b) {
    const x = lum(a), y = lum(b);
    return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
  }
  function mix(top, a, under) {
    const t = rgb(top), u = rgb(under);
    return hexOf(t[0] * a + u[0] * (1 - a), t[1] * a + u[1] * (1 - a), t[2] * a + u[2] * (1 - a));
  }
  const inkOn = (hex) => lum(hex) > 0.36 ? "#000000" : "#ffffff";
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const BGHEX = { black: "#000000", navy: "#0a1836", grad: "#0a0f1a", gray: "#14181d", white: "#f4f4f4" };
  const bgBase = (S) => S.bg === "chroma" ? null : /^#[0-9a-f]{6}$/i.test(S.bg || "") ? String(S.bg).toLowerCase() : BGHEX[S.bg] || "#000000";
  const bgLight = (S) => S.bg === "white" || /^#[0-9a-f]{6}$/i.test(S.bg || "") && ratio("#111111", S.bg) > ratio("#ffffff", S.bg);
  function stageBg(S) {
    if (!S) return null;
    const base = bgBase(S);
    if (!S.textBox) return base;
    if ((S.boxFill || "solid") !== "solid") return null;
    const raw = S.boxColor || "auto";
    const p = raw === "auto" ? { hex: bgLight(S) ? "#ffffff" : "#000000", a: 1 } : parse(raw) || { hex: "#000000", a: 1 };
    const op = typeof S.boxOpacity === "number" && isFinite(S.boxOpacity) ? clamp(S.boxOpacity, 0, 100) / 100 : 0.55, a = op * p.a;
    if (!base) return a >= 0.9 ? p.hex : null;
    return mix(p.hex, a, base);
  }
  function textRatio(S, v, autoHex) {
    const bg = stageBg(S);
    if (!bg) return null;
    const p = !v || v === "auto" ? autoHex ? parse(autoHex) : null : parse(v);
    if (!p) return null;
    return ratio(p.a < 0.999 ? mix(p.hex, p.a, bg) : p.hex, bg);
  }
  function nameOf(v) {
    if (!v || v === "auto") return STR.auto;
    const p = parse(v);
    if (!p) return String(v);
    const n = NAMES[p.hex] || p.hex.toUpperCase();
    return p.a < 0.999 ? n + " · " + STR.alpha + " " + Math.round(p.a * 100) + "%" : n;
  }
  function recentAll() {
    try {
      const j = JSON.parse(localStorage.getItem(RKEY) || "{}");
      return j && typeof j === "object" && !Array.isArray(j) ? j : {};
    } catch (e) {
      return {};
    }
  }
  function recentGet(set) {
    const a = recentAll()[set];
    return Array.isArray(a) ? a.filter((x) => typeof x === "string" && parse(x)).slice(0, 4) : [];
  }
  function recentAdd(set, v) {
    try {
      const j = recentAll(), a = (Array.isArray(j[set]) ? j[set] : []).filter((x) => x !== v);
      a.unshift(v);
      j[set] = a.slice(0, 4);
      localStorage.setItem(RKEY, JSON.stringify(j));
    } catch (e) {
    }
  }
  const CSS = `
:where(.cp-row,.cp-pop,.cp-scrim){--cp-bg:#151b23;--cp-bg2:#0d1117;--cp-line:#2a333f;--cp-line2:#44505f;--cp-text:#e8edf3;--cp-muted:#93a1b3;--cp-accent:#6ea8ff;--cp-accent-hi:#8fbcff;--cp-accent-ink:#0b1220;--cp-warn:#f0b34a;--cp-shadow:0 22px 60px -14px rgba(0,0,0,.7);--cp-ring-l:rgba(255,255,255,.62);--cp-ring-d:rgba(0,0,0,.62);--cp-z:1000;--cp-font:system-ui,sans-serif}
.cp-row{display:flex;flex-wrap:wrap;align-items:center;gap:2px;min-width:0;max-width:100%}
.cp-row [hidden],.cp-pop [hidden],.cp-pop[hidden],.cp-scrim[hidden]{display:none!important}
:where(.cp-row,.cp-pop) button{font:inherit;color:inherit;background:none;border:0;margin:0;padding:0;cursor:pointer;-webkit-tap-highlight-color:transparent}
.cp-row :focus-visible,.cp-pop :focus-visible{outline:2px solid var(--cp-accent-hi);outline-offset:2px}
.cp-sw,.cp-cur{position:relative;flex:none;width:40px;height:40px;display:inline-grid;place-items:center;border-radius:10px}
.cp-sw i{display:block;width:30px;height:30px;border-radius:50%;background:var(--c);box-shadow:inset 0 0 0 1px var(--cp-ring-l),0 0 0 1px var(--cp-ring-d);transition:transform .12s}
.cp-sw:hover i{transform:scale(1.08)}
.cp-sw[aria-pressed="true"] i{box-shadow:inset 0 0 0 1px var(--cp-ring-l),0 0 0 1px var(--cp-ring-d),0 0 0 3px var(--cp-bg),0 0 0 5px var(--cp-accent)}
.cp-sw[aria-pressed="true"]::after{content:"";position:absolute;left:50%;top:50%;width:11px;height:6px;margin:-5px 0 0 -6px;border:solid var(--ck,#000);border-width:0 0 2.5px 2.5px;transform:rotate(-45deg);pointer-events:none}
.cp-cur i{display:block;width:32px;height:32px;border-radius:8px;background:linear-gradient(var(--c),var(--c)),repeating-conic-gradient(#9aa3ad 0 25%,#e6e9ee 0 50%) 0 0/10px 10px;box-shadow:inset 0 0 0 1px var(--cp-ring-l),0 0 0 1px var(--cp-ring-d)}
.cp-cur.is-auto i{background:linear-gradient(135deg,#ffffff 0 50%,#0d1424 50% 100%)}
.cp-cur::after{content:"";position:absolute;right:1px;bottom:1px;width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;border-top:5px solid var(--cp-muted);transform:rotate(-45deg)}
.cp-div{flex:none;width:1px;height:24px;margin:0 4px;background:var(--cp-line)}
.cp-autob{flex:none;height:40px;margin-right:2px;padding:0 10px 0 7px;display:inline-flex;align-items:center;gap:6px;border-radius:999px;border:1px solid var(--cp-line);font-size:13px;font-weight:700;white-space:nowrap}
.cp-autob i{display:block;width:20px;height:20px;border-radius:50%;background:linear-gradient(135deg,#ffffff 0 50%,#0d1424 50% 100%);box-shadow:0 0 0 1px var(--cp-ring-d),inset 0 0 0 1px var(--cp-ring-l)}
.cp-autob:hover{border-color:var(--cp-line2)}
.cp-autob[aria-pressed="true"]{border-color:var(--cp-accent);box-shadow:inset 0 0 0 1px var(--cp-accent);color:var(--cp-accent-hi)}
.cp-more{flex:none;height:40px;padding:0 12px;display:inline-flex;align-items:center;gap:6px;border-radius:10px;border:1px dashed var(--cp-line2);font-size:13px;font-weight:700;white-space:nowrap}
.cp-more::before{content:"";width:14px;height:14px;border-radius:50%;background:conic-gradient(#f33,#fd3,#3f6,#3cf,#36f,#c3f,#f33)}
.cp-more:hover{border-color:var(--cp-accent);border-style:solid}
.cp-warn{flex-basis:100%;display:flex;align-items:center;gap:6px;font-size:12px;font-weight:700;color:var(--cp-warn);line-height:1.35}
.cp-warn::before{content:"!";flex:none;display:inline-grid;place-items:center;width:15px;height:15px;border-radius:50%;background:var(--cp-warn);color:#1a1300;font-size:11px;font-weight:900}
.cp-scrim{position:fixed;inset:0;z-index:calc(var(--cp-z) - 1);background:rgba(0,0,0,.55)}
.cp-pop{position:fixed;left:0;top:0;z-index:var(--cp-z);box-sizing:border-box;width:308px;max-width:calc(100vw - 16px);max-height:calc(100vh - 16px);overflow:auto;overscroll-behavior:contain;padding:12px;border-radius:14px;background:var(--cp-bg);color:var(--cp-text);border:1px solid var(--cp-line);box-shadow:var(--cp-shadow);font:500 13px/1.4 var(--cp-font);text-align:left;display:grid;gap:10px;word-break:keep-all}
.cp-pop *,.cp-pop *::before,.cp-pop *::after{box-sizing:border-box}
.cp-pop.cp-center{left:50%;top:50%;transform:translate(-50%,-50%);width:min(340px,calc(100vw - 32px));max-height:calc(100vh - 32px)}
.cp-hd{display:grid;gap:3px}
.cp-t{font-size:14px;font-weight:800}
.cp-where{display:flex;gap:5px;align-items:flex-start;font-size:12px;font-weight:600;color:var(--cp-muted);line-height:1.35}
.cp-where i{font-style:normal;flex:none}
.cp-full{display:grid;gap:10px}
.cp-sv{position:relative;height:150px;border-radius:10px;cursor:crosshair;touch-action:none;background:linear-gradient(to top,#000,rgba(0,0,0,0)),linear-gradient(to right,#fff,var(--hue,#f00));box-shadow:inset 0 0 0 1px rgba(0,0,0,.35)}
.cp-th{position:absolute;left:0;top:0;width:20px;height:20px;margin:-10px 0 0 -10px;border-radius:50%;border:2px solid #fff;box-shadow:0 0 0 1px rgba(0,0,0,.7),inset 0 0 0 1px rgba(0,0,0,.5);pointer-events:none}
.cp-pop input.cp-rng{-webkit-appearance:none;appearance:none;display:block;width:100%;height:40px;min-width:0;margin:0;padding:0;border:0;background:transparent;cursor:pointer}
.cp-pop input.cp-rng::-webkit-slider-runnable-track{height:14px;border-radius:7px;background:var(--trk);box-shadow:inset 0 0 0 1px rgba(0,0,0,.35)}
.cp-pop input.cp-rng::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;width:22px;height:22px;margin-top:-4px;border-radius:50%;background:#fff;border:0;box-shadow:0 0 0 1px rgba(0,0,0,.7),0 1px 4px rgba(0,0,0,.6)}
.cp-pop input.cp-rng::-moz-range-track{height:14px;border-radius:7px;background:var(--trk)}
.cp-pop input.cp-rng::-moz-range-thumb{width:22px;height:22px;border-radius:50%;background:#fff;border:0;box-shadow:0 0 0 1px rgba(0,0,0,.7)}
.cp-pop input.cp-rng:focus-visible{outline:2px solid var(--cp-accent-hi);outline-offset:0}
.cp-hue .cp-rng{--trk:linear-gradient(to right,#f00,#ff0,#0f0,#0ff,#00f,#f0f,#f00)}
.cp-al{display:grid;gap:2px}
.cp-alh{display:flex;justify-content:space-between;align-items:baseline;gap:8px}
.cp-lb{font-size:12px;font-weight:800;color:var(--cp-muted)}
.cp-alh small{font-size:11.5px;color:var(--cp-muted)}
.cp-alr{display:flex;align-items:center;gap:8px}
.cp-alr input.cp-rng{flex:1;min-width:0;--trk:linear-gradient(to right,rgba(0,0,0,0),var(--cpc,#fff)),repeating-conic-gradient(#8a929c 0 25%,#d5d9df 0 50%) 0 0/10px 10px}
.cp-pop input.cp-num,.cp-pop input.cp-hex,.cp-pop .cp-rgb input{height:40px;min-width:0;border-radius:8px;border:1px solid var(--cp-line);background:var(--cp-bg2);color:var(--cp-text);font:700 14px/1 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;padding:0 8px}
.cp-pop input:focus{outline:none;border-color:var(--cp-accent)}
.cp-pop input.bad{border-color:#e05252;color:#ff9d9d}
.cp-num{width:62px;text-align:right}
.cp-in{display:flex;align-items:center;gap:6px}
.cp-in input.cp-hex,.cp-in .cp-rgb input{height:46px}
.cp-mode{flex:none;display:inline-flex;padding:2px;gap:2px;border-radius:10px;border:1px solid var(--cp-line);background:var(--cp-bg2)}
.cp-mode button{height:40px;min-width:44px;padding:0 6px;border-radius:8px;font-size:12px;font-weight:800;color:var(--cp-muted)}
.cp-mode button[aria-pressed="true"]{background:var(--cp-accent);color:var(--cp-accent-ink)}
.cp-hex{flex:1;width:0;text-transform:uppercase}
.cp-rgb{flex:1;min-width:0;display:flex;gap:4px}
.cp-rgb label{flex:1;min-width:0;display:flex;align-items:center;gap:3px;font-size:11px;font-weight:800;color:var(--cp-muted)}
.cp-rgb input{width:100%;padding:0 4px;text-align:right}
.cp-rec{display:flex;align-items:center;gap:4px;flex-wrap:wrap;min-height:40px}
.cp-rec .cp-lb{margin-right:4px}
.cp-recn{font-size:12px;color:var(--cp-muted)}
.cp-cmp{display:grid;grid-template-columns:1fr 1fr;height:46px;border-radius:10px;overflow:hidden;box-shadow:0 0 0 1px var(--cp-line)}
.cp-cmp>*{position:relative;display:flex;align-items:flex-end;padding:4px 8px;font-size:11px;font-weight:800;color:var(--ink,#fff);background:linear-gradient(var(--c),var(--c)),repeating-conic-gradient(#8a929c 0 25%,#d5d9df 0 50%) 0 0/10px 10px}
.cp-cmp>.cp-new{justify-content:flex-end}
.cp-old:hover::after{content:"↺";position:absolute;right:8px;top:4px;font-size:14px}
.cp-act{display:flex;justify-content:flex-end;gap:8px}
.cp-act button{height:40px;padding:0 18px;border-radius:10px;font-size:14px;font-weight:800}
.cp-act .cp-cancel{border:1px solid var(--cp-line2)}
.cp-act .cp-cancel:hover{border-color:var(--cp-text)}
.cp-act .cp-ok{background:var(--cp-accent);color:var(--cp-accent-ink)}
.cp-act .cp-ok:hover{filter:brightness(1.08)}
.cp-more{margin-left:2px}
@media (prefers-reduced-motion:reduce){.cp-sw i{transition:none}}
`;
  function injectCss() {
    if (document.getElementById("cp-css")) return;
    const st = document.createElement("style");
    st.id = "cp-css";
    st.textContent = CSS;
    const h = document.head || document.documentElement;
    h.insertBefore(st, h.firstChild);
  }
  function row(host, o) {
    injectCss();
    const el = document.createElement("div");
    el.className = "cp-row";
    el.setAttribute("role", "group");
    el.setAttribute("aria-label", o.label);
    const recs = o.recs || SETS[o.set] || SETS.text;
    if (o.recs) o.recs.forEach(([v, n]) => {
      if (!NAMES[v]) NAMES[v] = n;
    });
    let h = '<button type="button" class="cp-cur" data-cp="cur" aria-haspopup="dialog"><i aria-hidden="true"></i></button><span class="cp-div" aria-hidden="true"></span>';
    if (o.auto) h += '<button type="button" class="cp-autob" data-cp="auto" aria-pressed="false" title="' + esc(o.auto.title || STR.auto) + '"><i aria-hidden="true"></i><span>' + STR.auto + "</span></button>";
    h += recs.map(([v, n]) => '<button type="button" class="cp-sw" data-cp="sw" data-v="' + v + '" aria-pressed="false" title="' + esc(n) + '" aria-label="' + esc(n) + '" style="--c:' + v + ";--ck:" + inkOn(v) + '"><i aria-hidden="true"></i></button>').join("");
    h += '<button type="button" class="cp-more" data-cp="more" aria-haspopup="dialog">' + STR.more + "</button>";
    if (o.warnInline) h += '<span class="cp-warn" role="status" hidden>' + STR.low + "</span>";
    el.innerHTML = h;
    if (host) host.replaceChildren(el);
    el.addEventListener("click", (e) => {
      const b = e.target.closest("[data-cp]");
      if (!b || !el.contains(b)) return;
      const k = b.dataset.cp;
      if (k === "sw") {
        o.commit(b.dataset.v, void 0, "swatch");
        update();
      } else if (k === "auto") {
        o.commit("auto", void 0, "auto");
        update();
      } else if (o.onMore) o.onMore(b);
      else open(b, o, "more");
    });
    el.addEventListener("keydown", (e) => rowKeys(e, el));
    function update() {
      const raw = o.get(), isAuto = !raw || raw === "auto", p = isAuto ? null : parse(raw);
      const rh = isAuto ? o.resolve && (parse(o.resolve()) || {}).hex || "#ffffff" : p ? p.hex : "#000000";
      let a = p ? p.a : 1;
      if (o.alpha === "ext" && o.getExt) a *= clamp(+o.getExt() || 0, 0, 100) / 100;
      const cur = el.querySelector(".cp-cur"), nm = nameOf(isAuto ? "auto" : raw);
      cur.style.setProperty("--c", css(rh, a));
      cur.classList.toggle("is-auto", isAuto);
      cur.setAttribute("aria-label", o.label + ", " + STR.cur + " " + nm);
      cur.title = STR.cur + ": " + nm + " · " + STR.curTitle;
      el.querySelectorAll('.cp-sw[data-cp="sw"]').forEach((b) => b.setAttribute("aria-pressed", String(!!p && p.a >= 0.999 && p.hex === b.dataset.v)));
      const ab = el.querySelector(".cp-autob");
      if (ab) ab.setAttribute("aria-pressed", String(isAuto));
      const w = el.querySelector(".cp-warn");
      if (w) {
        let r = null;
        try {
          r = o.contrastFor ? o.contrastFor(raw || "auto") : null;
        } catch (x) {
          r = null;
        }
        w.hidden = !(r != null && r < LOW);
      }
    }
    update();
    return { el, o, update };
  }
  function rowKeys(e, el) {
    if (e.ctrlKey || e.metaKey || e.altKey || e.key === "Tab" || e.key === "Escape") return;
    const bs = [...el.querySelectorAll("button")].filter((b) => !b.disabled && b.getClientRects().length), i = bs.indexOf(document.activeElement);
    let j = -1;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") j = Math.min(bs.length - 1, i + 1);
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") j = Math.max(0, i - 1);
    else if (e.key === "Home") j = 0;
    else if (e.key === "End") j = bs.length - 1;
    if (j >= 0 && bs[j]) {
      e.preventDefault();
      bs[j].focus();
    }
    e.stopPropagation();
  }
  const P = { on: false, el: null, scrim: null, r: null, o: null, anchor: null, opener: null, mode: "", st: null, orig: null, touched: false, showA: false, inMode: "hex", drag: false, swallow: 0, qrow: null };
  function build() {
    if (P.el) return;
    injectCss();
    const el = document.createElement("div");
    el.className = "cp-pop";
    el.id = "cpPop";
    el.hidden = true;
    el.setAttribute("role", "dialog");
    el.setAttribute("aria-modal", "true");
    el.setAttribute("aria-labelledby", "cpTitle cpWhere");
    el.innerHTML = '<div class="cp-hd"><b class="cp-t" id="cpTitle"></b><span class="cp-where"><i aria-hidden="true">📍</i><span class="cp-wt" id="cpWhere"></span></span></div><div class="cp-quick"></div><div class="cp-full"><div class="cp-sv" tabindex="0" role="slider" aria-label="' + STR.sv + '" aria-valuemin="0" aria-valuemax="100"><i class="cp-th"></i></div><div class="cp-hue"><input class="cp-rng" type="range" min="0" max="359" step="1" aria-label="' + STR.hue + '"></div><div class="cp-al"><div class="cp-alh"><span class="cp-lb">' + STR.alpha + "</span><small>" + STR.alphaHint + '</small></div><div class="cp-alr"><input class="cp-rng" type="range" min="0" max="100" step="1" aria-label="' + STR.alpha + '"><input class="cp-num" type="number" min="0" max="100" step="1" inputmode="numeric" aria-label="' + STR.alphaPct + '"><span aria-hidden="true">%</span></div></div><div class="cp-in"><span class="cp-mode" role="group" aria-label="' + STR.mode + '"><button type="button" data-m="hex" aria-pressed="true">HEX</button><button type="button" data-m="rgb" aria-pressed="false">RGB</button></span><input class="cp-hex" type="text" spellcheck="false" autocomplete="off" maxlength="9" aria-label="' + STR.hexIn + '"><span class="cp-rgb" hidden><label><span aria-hidden="true">R</span><input type="number" min="0" max="255" step="1" inputmode="numeric" aria-label="' + STR.r + '"></label><label><span aria-hidden="true">G</span><input type="number" min="0" max="255" step="1" inputmode="numeric" aria-label="' + STR.g + '"></label><label><span aria-hidden="true">B</span><input type="number" min="0" max="255" step="1" inputmode="numeric" aria-label="' + STR.b + '"></label></span></div><div class="cp-rec"><span class="cp-lb">' + STR.recent + '</span><span class="cp-recs"></span></div><div class="cp-cmp"><button type="button" class="cp-old" title="' + STR.backPrev + '" aria-label="' + STR.backPrev + '"><span>' + STR.prev + '</span></button><span class="cp-new"><span>' + STR.next + '</span></span></div><p class="cp-warn" role="status" hidden>' + STR.low + '</p><div class="cp-act"><button type="button" class="cp-cancel">' + STR.cancel + '</button><button type="button" class="cp-ok">' + STR.apply + "</button></div></div>";
    const sc = document.createElement("div");
    sc.className = "cp-scrim";
    sc.hidden = true;
    document.body.append(sc, el);
    const q = (s) => el.querySelector(s);
    P.el = el;
    P.scrim = sc;
    P.r = {
      title: q(".cp-t"),
      where: q(".cp-wt"),
      quick: q(".cp-quick"),
      full: q(".cp-full"),
      sv: q(".cp-sv"),
      th: q(".cp-th"),
      hue: q(".cp-hue input"),
      al: q(".cp-al"),
      alR: q(".cp-alr .cp-rng"),
      alN: q(".cp-alr .cp-num"),
      hex: q(".cp-hex"),
      rgbBox: q(".cp-rgb"),
      rgbIn: [...el.querySelectorAll(".cp-rgb input")],
      modeB: [...el.querySelectorAll(".cp-mode button")],
      recs: q(".cp-recs"),
      old: q(".cp-old"),
      nw: q(".cp-new"),
      warn: q(".cp-full .cp-warn"),
      cancel: q(".cp-cancel"),
      ok: q(".cp-ok")
    };
    bindPop();
  }
  function setHsv(h, s, v, src) {
    P.st.h = h;
    P.st.s = s;
    P.st.v = v;
    P.st.hex = fromHsv(h, s, v);
    changed(src);
  }
  function setHexVal(hex, src) {
    const hsv = toHsv(hex);
    P.st.hex = hex;
    if (hsv.s > 1e-3 && hsv.v > 1e-3) P.st.h = hsv.h;
    P.st.s = hsv.s;
    P.st.v = hsv.v;
    changed(src);
  }
  function curVal() {
    const st = P.st, al = P.o.alpha;
    if (al === "ext") return { v: st.hex, ext: Math.round(st.a * 100) };
    if (al === "hex") return { v: withA(st.hex, st.a) };
    return { v: st.hex };
  }
  function paint(skip) {
    const r = P.r, st = P.st;
    r.sv.style.setProperty("--hue", "hsl(" + Math.round(st.h) + ",100%,50%)");
    r.th.style.left = (st.s * 100).toFixed(2) + "%";
    r.th.style.top = ((1 - st.v) * 100).toFixed(2) + "%";
    r.th.style.background = st.hex;
    r.sv.setAttribute("aria-valuenow", String(Math.round(st.s * 100)));
    r.sv.setAttribute("aria-valuetext", STR.svText.replace("{s}", Math.round(st.s * 100)).replace("{v}", Math.round(st.v * 100)));
    if (skip !== r.hue) r.hue.value = String(Math.round(st.h) % 360);
    r.al.hidden = !P.showA;
    r.alR.style.setProperty("--cpc", st.hex);
    if (skip !== r.alR) r.alR.value = String(Math.round(st.a * 100));
    if (skip !== r.alN) r.alN.value = String(Math.round(st.a * 100));
    if (skip !== r.hex) {
      r.hex.value = (P.o.alpha === "hex" && st.a < 0.999 ? withA(st.hex, st.a) : st.hex).toUpperCase();
      r.hex.classList.remove("bad");
    }
    const c = rgb(st.hex);
    r.rgbIn.forEach((x, i) => {
      if (skip !== x) {
        x.value = String(c[i]);
        x.classList.remove("bad");
      }
    });
    r.nw.style.setProperty("--c", css(st.hex, st.a));
    r.nw.style.setProperty("--ink", inkOn(st.a < 0.5 ? "#c8ccd2" : st.hex));
    const cv = curVal();
    let rt = null;
    try {
      rt = P.o.contrastFor ? P.o.contrastFor(cv.v, cv.ext) : null;
    } catch (x) {
      rt = null;
    }
    r.warn.hidden = !(rt != null && rt < LOW);
  }
  function changed(src) {
    P.touched = true;
    paint(src);
    const cv = curVal();
    try {
      if (P.o.preview) P.o.preview(cv.v, cv.ext);
    } catch (e) {
      console.error(e);
    }
  }
  function paintRecent() {
    const r = P.r, list = recentGet(P.o.set);
    r.recs.innerHTML = list.length ? list.map((v) => {
      const p = parse(v), n = nameOf(v);
      return '<button type="button" class="cp-sw" data-rv="' + esc(v) + '" title="' + esc(n) + '" aria-label="' + esc(STR.recent + " " + n) + '" style="--c:' + css(p.hex, p.a) + '"><i aria-hidden="true"></i></button>';
    }).join("") : '<span class="cp-recn">' + STR.recentNone + "</span>";
  }
  function setMode(m) {
    P.inMode = m === "rgb" ? "rgb" : "hex";
    P.r.modeB.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.m === P.inMode)));
    P.r.hex.hidden = P.inMode !== "hex";
    P.r.rgbBox.hidden = P.inMode !== "rgb";
  }
  function anchorRect() {
    const a = P.anchor;
    if (a && typeof a.getBoundingClientRect === "function" && (!a.nodeType || a.isConnected)) {
      const r = a.getBoundingClientRect();
      if (r.width || r.height) return r;
    }
    if (a && a.rect) return a.rect;
    const w = document.documentElement.clientWidth || innerWidth;
    return { left: w / 2 - 1, right: w / 2 + 1, top: innerHeight / 3, bottom: innerHeight / 3, width: 2, height: 0 };
  }
  function place() {
    if (!P.on) return;
    const el = P.el, vw = document.documentElement.clientWidth || innerWidth, vh = innerHeight, m = 8, g = 6;
    const center = vw < 600;
    el.classList.toggle("cp-center", center);
    P.scrim.hidden = !center;
    if (center) {
      el.style.left = "";
      el.style.top = "";
      el.style.maxHeight = "";
      el.dataset.side = "center";
      return;
    }
    el.style.left = "0px";
    el.style.top = "0px";
    el.style.maxHeight = "";
    const r = anchorRect(), W = el.offsetWidth;
    let H = el.offsetHeight;
    if (H > vh - 2 * m) {
      H = vh - 2 * m;
      el.style.maxHeight = H + "px";
    }
    let left = r.left, top, side;
    if (H <= vh - r.bottom - g - m) {
      side = "below";
      top = r.bottom + g;
    } else if (H <= r.top - g - m) {
      side = "above";
      top = r.top - g - H;
    } else {
      top = r.top + r.height / 2 - H / 2;
      if (W <= vw - r.right - g - m) {
        side = "right";
        left = r.right + g;
      } else if (W <= r.left - g - m) {
        side = "left";
        left = r.left - g - W;
      } else side = "over";
    }
    left = clamp(left, m, Math.max(m, vw - W - m));
    top = clamp(top, m, Math.max(m, vh - H - m));
    el.style.left = Math.round(left) + "px";
    el.style.top = Math.round(top) + "px";
    el.dataset.side = side;
  }
  function focusables() {
    return [...P.el.querySelectorAll('button,input,[tabindex="0"]')].filter((x) => !x.disabled && x.getClientRects().length);
  }
  function open(anchor, o, mode) {
    if (P.on) cancel(true);
    build();
    P.o = o;
    P.anchor = anchor || null;
    P.opener = anchor && anchor.nodeType === 1 ? anchor : o.opener || null;
    P.on = true;
    P.touched = false;
    P.drag = false;
    P.mode = mode === "quick" ? "quick" : "more";
    const raw = o.get(), p = raw && raw !== "auto" ? parse(raw) : null;
    const base = p ? p.hex : o.resolve && (parse(o.resolve()) || {}).hex || "#ffffff";
    let a = 1;
    if (o.alpha === "ext") a = clamp((o.getExt ? +o.getExt() : 100) / 100 * (p ? p.a : 1), 0, 1);
    else if (o.alpha === "hex") a = p ? p.a : 1;
    a = Math.round(a * 100) / 100;
    const hsv = toHsv(base);
    P.st = { h: hsv.h, s: hsv.s, v: hsv.v, a, hex: base };
    P.orig = { raw: raw || "auto", hex: base, a, st: Object.assign({}, P.st), showA: o.alpha === "ext" || o.alpha === "hex" && a < 0.999 };
    P.showA = P.orig.showA;
    const r = P.r;
    r.title.textContent = o.title || o.label;
    const wt = o.where ? String(o.where() || "") : "";
    r.where.textContent = wt;
    r.where.parentElement.hidden = !wt;
    r.old.style.setProperty("--c", css(base, a));
    r.old.style.setProperty("--ink", inkOn(a < 0.5 ? "#c8ccd2" : base));
    r.old.title = STR.backPrev + " · " + nameOf(P.orig.raw);
    setMode(P.inMode);
    renderMode();
    P.el.hidden = false;
    paint(null);
    place();
    const f = P.mode === "quick" ? P.qrow.el.querySelector('[aria-pressed="true"]') || P.qrow.el.querySelector(".cp-sw") || P.qrow.el.querySelector("button") : r.sv;
    if (f) f.focus({ preventScroll: true });
  }
  function renderMode() {
    const r = P.r, quick = P.mode === "quick";
    r.full.hidden = quick;
    r.quick.hidden = !quick;
    if (quick) {
      const o = P.o;
      P.qrow = row(r.quick, Object.assign({}, o, {
        warnInline: o.warnInline !== false && o.set === "text",
        commit: (v, ext, how) => {
          const op = P.opener;
          finish();
          o.commit(v, ext, how);
          refocus(op);
        },
        onMore: () => {
          P.mode = "more";
          renderMode();
          paint(null);
          place();
          r.sv.focus({ preventScroll: true });
        }
      }));
    } else {
      r.quick.replaceChildren();
      P.qrow = null;
      paintRecent();
    }
  }
  function finish() {
    if (!P.on) return false;
    const o = P.o, t = P.touched;
    P.on = false;
    P.drag = false;
    P.el.hidden = true;
    P.scrim.hidden = true;
    P.r.quick.replaceChildren();
    P.qrow = null;
    if (t && o.unpreview) {
      try {
        o.unpreview();
      } catch (e) {
        console.error(e);
      }
    }
    return t;
  }
  function refocus(op) {
    if (op && op.isConnected && op.getClientRects().length) {
      try {
        op.focus({ preventScroll: true });
      } catch (e) {
      }
    }
  }
  function cancel(noFocus) {
    if (!P.on) return;
    const op = P.opener;
    finish();
    if (!noFocus) refocus(op);
  }
  function apply() {
    if (!P.on) return;
    if (!validFields()) return;
    const o = P.o, cv = curVal(), op = P.opener, t = finish();
    if (t) {
      o.commit(cv.v, cv.ext, "more");
      recentAdd(o.set, cv.v);
    }
    refocus(op);
  }
  function validFields() {
    const r = P.r;
    if (P.inMode === "hex" && r.hex.classList.contains("bad")) {
      r.hex.focus();
      return false;
    }
    if (P.inMode === "rgb" && r.rgbIn.some((x) => x.classList.contains("bad"))) {
      r.rgbIn.find((x) => x.classList.contains("bad")).focus();
      return false;
    }
    return true;
  }
  function bindPop() {
    const el = P.el, r = P.r;
    const svAt = (e) => {
      const b = r.sv.getBoundingClientRect();
      setHsv(P.st.h, clamp((e.clientX - b.left) / b.width, 0, 1), 1 - clamp((e.clientY - b.top) / b.height, 0, 1), null);
    };
    r.sv.addEventListener("pointerdown", (e) => {
      if (e.button !== 0) return;
      e.preventDefault();
      r.sv.focus({ preventScroll: true });
      try {
        r.sv.setPointerCapture(e.pointerId);
      } catch (x) {
      }
      P.drag = true;
      svAt(e);
    });
    r.sv.addEventListener("pointermove", (e) => {
      if (P.drag) svAt(e);
    });
    const up = (e) => {
      P.drag = false;
      try {
        r.sv.releasePointerCapture(e.pointerId);
      } catch (x) {
      }
    };
    r.sv.addEventListener("pointerup", up);
    r.sv.addEventListener("pointercancel", up);
    r.sv.addEventListener("keydown", (e) => {
      const d = e.shiftKey ? 0.1 : 0.01;
      let s = P.st.s, v = P.st.v;
      if (e.key === "ArrowLeft") s -= d;
      else if (e.key === "ArrowRight") s += d;
      else if (e.key === "ArrowUp") v += d;
      else if (e.key === "ArrowDown") v -= d;
      else return;
      e.preventDefault();
      setHsv(P.st.h, clamp(Math.round(s * 100) / 100, 0, 1), clamp(Math.round(v * 100) / 100, 0, 1), null);
    });
    const shiftStep = (inp, max) => inp.addEventListener("keydown", (e) => {
      if (!e.shiftKey) return;
      const d = e.key === "ArrowRight" || e.key === "ArrowUp" ? 10 : e.key === "ArrowLeft" || e.key === "ArrowDown" ? -10 : 0;
      if (!d) return;
      e.preventDefault();
      inp.value = String(clamp(+inp.value + d, 0, max));
      inp.dispatchEvent(new Event("input", { bubbles: true }));
    });
    shiftStep(r.hue, 359);
    shiftStep(r.alR, 100);
    r.hue.addEventListener("input", () => setHsv(+r.hue.value, P.st.s, P.st.v, r.hue));
    const setA = (v, src) => {
      P.st.a = clamp(Math.round(v) / 100, 0, 1);
      changed(src);
    };
    r.alR.addEventListener("input", () => setA(+r.alR.value, r.alR));
    r.alN.addEventListener("input", () => {
      const t = r.alN.value.trim(), n = +t;
      const ok = t !== "" && isFinite(n) && n >= 0 && n <= 100;
      r.alN.classList.toggle("bad", !ok && t !== "");
      if (ok) setA(n, r.alN);
    });
    r.alN.addEventListener("blur", () => {
      r.alN.classList.remove("bad");
      paint(null);
    });
    r.modeB.forEach((b) => b.addEventListener("click", () => {
      setMode(b.dataset.m);
      paint(null);
    }));
    r.hex.addEventListener("input", () => {
      const t = r.hex.value.trim(), p = parse(t);
      r.hex.classList.toggle("bad", !p && t !== "");
      if (!p) return;
      if (/^#?(?:[0-9a-f]{4}|[0-9a-f]{8})$/i.test(t) && P.o.alpha !== "none") {
        P.st.a = Math.round(p.a * 100) / 100;
        P.showA = true;
      }
      setHexVal(p.hex, r.hex);
    });
    r.hex.addEventListener("blur", () => {
      if (!r.hex.classList.contains("bad")) paint(null);
    });
    r.rgbIn.forEach((x) => {
      x.addEventListener("input", () => {
        const vs = r.rgbIn.map((y) => y.value.trim()), ok = vs.map((t) => t !== "" && /^\d+$/.test(t) && +t <= 255);
        r.rgbIn.forEach((y, i) => y.classList.toggle("bad", !ok[i] && vs[i] !== ""));
        if (ok.every(Boolean)) setHexVal(hexOf(+vs[0], +vs[1], +vs[2]), x);
      });
      x.addEventListener("blur", () => {
        if (!r.rgbIn.some((y) => y.classList.contains("bad"))) paint(null);
      });
    });
    r.recs.addEventListener("click", (e) => {
      const b = e.target.closest("[data-rv]");
      if (!b) return;
      const p = parse(b.dataset.rv);
      if (!p) return;
      if (P.o.alpha === "hex") {
        P.st.a = Math.round(p.a * 100) / 100;
        if (p.a < 0.999) P.showA = true;
      }
      setHexVal(p.hex, null);
    });
    r.old.addEventListener("click", () => {
      const o = P.orig;
      P.st = Object.assign({}, o.st);
      P.showA = o.showA;
      paint(null);
      if (P.touched) {
        P.touched = false;
        try {
          if (P.o.unpreview) P.o.unpreview();
        } catch (e) {
          console.error(e);
        }
      }
    });
    r.cancel.addEventListener("click", () => cancel());
    r.ok.addEventListener("click", apply);
    el.addEventListener("keydown", (e) => {
      if (e.key === "Tab") {
        const f = focusables();
        if (f.length) {
          const i = f.indexOf(document.activeElement), n = f.length;
          e.preventDefault();
          f[(i < 0 ? 0 : i + (e.shiftKey ? -1 : 1) + n) % n].focus();
        }
      } else if (e.key === "Enter" && !e.isComposing && !e.altKey && !e.ctrlKey && !e.metaKey) {
        const t = e.target;
        if (P.mode === "more" && !(t && t.tagName === "BUTTON")) {
          e.preventDefault();
          apply();
        }
      }
      e.stopPropagation();
    });
    ["keyup", "keypress"].forEach((t) => el.addEventListener(t, (e) => e.stopPropagation()));
  }
  window.addEventListener("keydown", (e) => {
    if (!P.on || e.key !== "Escape") return;
    e.preventDefault();
    e.stopPropagation();
    cancel();
  }, true);
  window.addEventListener("pointerdown", (e) => {
    if (!P.on || P.el && P.el.contains(e.target)) return;
    e.preventDefault();
    e.stopPropagation();
    P.swallow = Date.now();
    cancel();
  }, true);
  window.addEventListener("click", (e) => {
    if (!P.swallow) return;
    const late = Date.now() - P.swallow > 1e3;
    P.swallow = 0;
    if (late) return;
    e.preventDefault();
    e.stopPropagation();
  }, true);
  window.addEventListener("resize", () => {
    if (P.on) place();
  });
  window.addEventListener("scroll", (e) => {
    if (P.on && !(P.el && P.el.contains(e.target))) place();
  }, true);
  window.ColorPick = {
    ver: "1.9.0-b5",
    SETS,
    STR,
    LOW,
    row,
    open: (anchor, o) => open(anchor, o, "more"),
    openQuick: (anchor, o) => open(anchor, o, "quick"),
    close: () => cancel(),
    isOpen: () => P.on,
    setStrings: (o) => {
      Object.assign(STR, o || {});
    },
    parse,
    withA,
    nameOf,
    ratio,
    mix,
    stageBg,
    textRatio,
    toHsv,
    fromHsv,
    _state: () => P.on ? { mode: P.mode, side: P.el.dataset.side, touched: P.touched, st: Object.assign({}, P.st), showA: P.showA, val: curVal(), where: P.r.where.textContent } : null
  };
})();

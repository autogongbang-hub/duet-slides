(function() {
  "use strict";
  if (window.WTheme) return;
  const VER = "1.15.4-b16";
  const f1 = (v) => (Math.round(v * 10) / 10).toString();
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const str = (v, n) => typeof v === "string" ? v.slice(0, n) : "";
  function rng(seed) {
    let s = seed % 2147483647;
    if (s <= 0) s += 2147483646;
    return () => (s = s * 16807 % 2147483647) / 2147483647;
  }
  function jong(s) {
    const c = String(s).trim().slice(-1), n = c.charCodeAt(0);
    if (n >= 44032 && n <= 55203) return (n - 44032) % 28;
    return { 0: 21, 1: 8, 3: 16, 6: 1, 7: 8, 8: 8 }[c] || 0;
  }
  const ieyo = (s) => s + (jong(s) ? "이에요" : "예요");
  const eun = (s) => s + (jong(s) ? "은" : "는");
  const roP = (s) => {
    const j = jong(s);
    return j && j !== 8 ? "으로" : "로";
  };
  const eul = (s) => jong(s) ? "을" : "를";
  const lsGet = (k) => {
    try {
      return localStorage.getItem(k);
    } catch (e) {
      return null;
    }
  };
  const lsSet = (k, v) => {
    try {
      localStorage.setItem(k, v);
      return true;
    } catch (e) {
      return false;
    }
  };
  const jget = (k) => {
    try {
      return JSON.parse(lsGet(k));
    } catch (e) {
      return null;
    }
  };
  const HOST = window.ChanyangHost && typeof window.ChanyangHost === "object" ? window.ChanyangHost : null;
  const NS = HOST && typeof HOST.ns === "string" ? HOST.ns.replace(/[^\w-]/g, "").slice(0, 80) : "";
  let KP = "chanyang-jamak:" + (NS ? NS + ":" : "");
  const BASE = (() => {
    try {
      const s = document.currentScript && document.currentScript.src;
      return s ? new URL(".", s).href : "";
    } catch (e) {
      return "";
    }
  })();
  const DOWK = ["주일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"];
  const dn = (y, m, d) => Date.UTC(y, m - 1, d) / 864e5;
  const P = (s) => {
    const a = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || "");
    return a ? { y: +a[1], m: +a[2], d: +a[3], n: dn(+a[1], +a[2], +a[3]) } : null;
  };
  const dow = (n) => new Date(n * 864e5).getUTCDay();
  const fromN = (n) => {
    const t = new Date(n * 864e5);
    return { y: t.getUTCFullYear(), m: t.getUTCMonth() + 1, d: t.getUTCDate(), n };
  };
  const isoOf = (o) => `${o.y}-${String(o.m).padStart(2, "0")}-${String(o.d).padStart(2, "0")}`;
  const today = () => {
    const t = /* @__PURE__ */ new Date();
    return isoOf({ y: t.getFullYear(), m: t.getMonth() + 1, d: t.getDate() });
  };
  function easter(y) {
    const a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451), mo = Math.floor((h + l - 7 * m + 114) / 31), da = (h + l - 7 * m + 114) % 31 + 1;
    return dn(y, mo, da);
  }
  function advent1(y) {
    const c = dn(y, 12, 25), w = dow(c);
    return c - (w === 0 ? 7 : w) - 21;
  }
  function thanksDay(y) {
    const f = dn(y, 11, 1);
    return f + (7 - dow(f)) % 7 + 14;
  }
  const ORD = ["", "첫째", "둘째", "셋째", "넷째", "다섯째", "여섯째"];
  function ordK(n) {
    const A = ["", "첫째", "둘째", "셋째", "넷째", "다섯째", "여섯째", "일곱째", "여덟째", "아홉째"], U = ["", "한째", "두째", "셋째", "넷째", "다섯째", "여섯째", "일곱째", "여덟째", "아홉째"];
    if (n < 10) return A[n];
    const t = Math.floor(n / 10), u = n % 10;
    const T = ["", "열", "스물"][t] || "";
    if (!u) return t === 2 ? "스무째" : T + "째";
    return T + U[u];
  }
  const dateL = (s) => {
    const o = P(s);
    return o ? `${o.m}월 ${o.d}일 ${DOWK[dow(o.n)]}` : "";
  };
  const dateY = (s) => {
    const o = P(s);
    return o ? `${o.y}년 ${o.m}월 ${o.d}일 ${DOWK[dow(o.n)]}` : "";
  };
  const dateS = (s) => {
    const o = P(s);
    return o ? `${o.m}월 ${o.d}일` : "";
  };
  const EV_KEY = () => KP + "theme-events";
  function normEvent(x) {
    if (!x || typeof x !== "object") return null;
    const name = str(x.name, 30).trim();
    if (!name || !P(x.date)) return null;
    return { id: typeof x.id === "string" && /^[\w-]{1,40}$/.test(x.id) ? x.id : "e" + Math.random().toString(36).slice(2, 9), name, date: x.date, yearly: x.yearly !== false };
  }
  function events() {
    const a = jget(EV_KEY());
    return (a && Array.isArray(a.list) ? a.list : []).map(normEvent).filter(Boolean).slice(0, 60);
  }
  function saveEvents(list) {
    return lsSet(EV_KEY(), JSON.stringify({ v: 1, list: (list || []).map(normEvent).filter(Boolean).slice(0, 60) }));
  }
  const evOn = (e, s) => e.date === s || e.yearly && e.date.slice(5) === String(s).slice(5);
  function recs(s) {
    const o = P(s);
    if (!o) return [];
    const { y, n } = o, w = dow(n), out = [];
    events().forEach((e) => {
      if (evOn(e, s)) out.push({ id: "event", ev: e.id, head: e.name, what: `「${e.name}」 날`, why: "교회 행사에 넣어 둔 날" });
    });
    if (n === thanksDay(y)) out.push({ id: "thanks", head: "추수감사주일", what: "추수감사주일", why: "11월 셋째 주일" });
    const a1 = advent1(y);
    if (n >= a1 && n <= dn(y, 12, 23)) {
      const k = Math.min(4, Math.floor((n - a1) / 7) + 1);
      out.push({ id: "advent", v: k, head: w === 0 ? `대림절 ${ORD[k]} 주일` : "대림절", what: w === 0 ? `대림절 ${ORD[k]} 주일` : `대림절 ${ORD[k]} 주간`, why: "성탄 전 넷째 주일부터 4주" });
    }
    if (n === dn(y, 12, 24)) out.push({ id: "christmas", head: "성탄 전야", what: "성탄 전야", why: "12월 24일" });
    if (n === dn(y, 12, 25)) out.push({ id: "christmas", head: "성탄절", what: "성탄절", why: "12월 25일" });
    if (w === 0 && n > dn(y, 12, 25) && n < dn(y, 12, 31)) out.push({ id: "christmas", head: "성탄 후 첫 주일", what: "성탄 후 첫 주일", why: "성탄절 다음 주일" });
    if (n === dn(y, 12, 31)) out.push({ id: "newyear", head: `${y}-${y + 1}`, what: "송구영신예배 날", why: "12월 31일 밤" });
    const E = easter(y);
    if (n === E) out.push({ id: "easter", head: "부활주일", what: "부활주일", why: `${y}년 부활절` });
    else if (n >= E - 46 && n < E) {
      let h = "사순절";
      if (n === E - 46) h = "재의 수요일";
      else if (n === E - 7) h = "종려주일";
      else if (n === E - 2) h = "성금요일";
      else if (n > E - 7) h = "고난주간";
      else if (w === 0) h = `사순절 ${ORD[(n - (E - 42)) / 7 + 1]} 주일`;
      out.push({ id: "lent", head: h, what: h === "사순절" ? "사순절 기간" : h, why: "재의 수요일부터 부활절 전날까지" });
    }
    return out;
  }
  const advWeek = (s) => {
    const r = recs(s).find((x) => x.id === "advent");
    return r ? r.v : 1;
  };
  function autoDay(s) {
    const o = P(s);
    if (!o || dow(o.n) !== 0) return "";
    const pe = easter(o.y) + 49, a1 = advent1(o.y);
    if (o.n >= pe + 7 && o.n < a1) return `성령강림절 후 ${ordK((o.n - pe) / 7)} 주일`;
    return "";
  }
  function nextN(id) {
    const t = P(today()), list = [];
    for (const y of [t.y, t.y + 1]) {
      const E = easter(y);
      ({ thanks: [thanksDay(y)], advent: [advent1(y)], christmas: [dn(y, 12, 24)], newyear: [dn(y, 12, 31)], lent: [E - 46], easter: [E] }[id] || []).forEach((n) => {
        if (n >= t.n) list.push(n);
      });
    }
    return list.length ? Math.min(...list) : Infinity;
  }
  function nextOf(id) {
    const n = nextN(id);
    if (!isFinite(n)) return "";
    const t = P(today()), o = fromN(n);
    return (o.y === t.y ? "올해 " : `${o.y}년 `) + `${o.m}월 ${o.d}일 ${DOWK[dow(o.n)]}`;
  }
  const PRE = '"Pretendard Variable", Pretendard, sans-serif', MYE = '"Nanum Myeongjo", serif';
  const SUN_BG = { rad: [0.7, 0.62, 0.5, 0.3, "#24428cb3"], lin: [[0, "#0a1430"], [1, "#14295c"]] };
  const THEMES = {
    sunday: Object.assign({
      n: "주일 기본",
      s: "기본",
      tab: "week",
      hf: PRE,
      dark: 1,
      ink: "#ffffff",
      sub: "#c9d6f2",
      ac: "#e8c47c",
      pill: "#e8c47c",
      pillInk: "#0e1a36",
      deep: "#0e1a36",
      m: { a: "#e8c47c" },
      pm: { a: null },
      pac: null,
      pdeep: null,
      sw: "#14295c"
    }, SUN_BG),
    thanks: {
      n: "추수감사주일",
      s: "추수감사",
      tab: "season",
      hf: PRE,
      dark: 1,
      rad: [0.62, 0.6, 0.5, 0.36, "#c8641f8c"],
      lin: [[0, "#3a1606"], [1, "#86391a"]],
      ink: "#fff7ea",
      sub: "#f2d6b3",
      ac: "#f7c662",
      pill: "#f7c662",
      pillInk: "#4a1f0b",
      deep: "#4a1f0b",
      m: { st: "#e9b955", gr: "#f5cd6c", rb: "#d9662b", rb2: "#b84f1c", lf: "#8a9a3e", gl: "#ffb84d" },
      pm: { st: "#b8862b", gr: "#cf9a36", rb: "#b4552d", rb2: "#8f3f1c", lf: "#7a8a3a", gl: "#f2c35b" },
      pac: "#b4552d",
      pdeep: "#5a2a10",
      sw: "#86391a"
    },
    advent: {
      n: "대림절",
      s: "대림절",
      tab: "season",
      hf: PRE,
      dark: 1,
      vars: 4,
      rad: [0.6, 0.58, 0.5, 0.36, "#6e43a880"],
      lin: [[0, "#1a0d2c"], [1, "#3c2160"]],
      ink: "#ffffff",
      sub: "#ddd0f0",
      ac: "#f3d27e",
      pill: "#f3d27e",
      pillInk: "#2a1640",
      deep: "#2a1640",
      m: { p: "#8f63c9", k: "#e586b0", g1: "#2f7a43", g2: "#4f9e5e", w: "#2a1a1a", f: "#ffcf5c", fi: "#fff3c4", gl: "#ffc95c", b: "#e2554f" },
      pm: { p: "#7b4fa6", k: "#d46a9a", g1: "#2f6b3a", g2: "#5a9a5e", w: "#3a2a2a", f: "#e8a531", fi: "#ffe7a3", gl: "#f2c35b", b: "#c0392b" },
      pac: "#6a3f96",
      pdeep: "#2a1640",
      sw: "#3c2160"
    },
    christmas: {
      n: "성탄절",
      s: "성탄절",
      tab: "season",
      hf: MYE,
      dark: 1,
      rad: [0.55, 0.55, 0.5, 0.28, "#c23a4580"],
      lin: [[0, "#420917"], [1, "#7a1627"]],
      ink: "#fffaf2",
      sub: "#f5d6d2",
      ac: "#f4cf72",
      pill: "#f4cf72",
      pillInk: "#4a0a15",
      deep: "#4a0a15",
      m: { s: "#f4cf72", s2: "#fff1c9", c: "#ffffff", t: "#ffffff", gl: "#ffd76e" },
      pm: { s: "#c9a24b", s2: "#e6c873", c: "#fff7e0", t: "#b3202e", gl: "#e8c45a" },
      pac: "#a3192b",
      pdeep: "#5a0d19",
      sw: "#7a1627"
    },
    newyear: {
      n: "송구영신",
      s: "송구영신",
      tab: "season",
      hf: PRE,
      dark: 1,
      rad: [0.8, 0.5, 0.5, 1.04, "#e8893fa6"],
      lin: [[0, "#060a20"], [0.58, "#121b46"], [1, "#2a2659"]],
      ink: "#ffffff",
      sub: "#cdd3f0",
      ac: "#ffbb6b",
      pill: "#ffbb6b",
      pillInk: "#0f1638",
      deep: "#0f1638",
      m: { s: "#ffa24d", s2: "#ffe0a8", r: "#ffcb7a", h: "#ffffff", gl: "#ff9f43" },
      pm: { s: "#e8833a", s2: "#ffd59a", r: "#e8a33a", h: "#1f2a55", gl: "#f2a65a" },
      pac: "#1f2a55",
      pdeep: "#121b46",
      sw: "#121b46"
    },
    lent: {
      n: "사순절",
      s: "사순절",
      tab: "season",
      hf: MYE,
      dark: 0,
      rad: [0.6, 0.6, 0.5, 0.18, "#ffffffb3"],
      lin: [[0, "#f3ede4"], [1, "#dbcdbb"]],
      ink: "#2e1a3d",
      sub: "#5f4e63",
      ac: "#5a2c7a",
      pill: "#4b2366",
      pillInk: "#ffffff",
      deep: "#3a1d52",
      dac: "#dcc2f2",
      m: { x: "#4b2366", t: "#6b5a4e", r: "#b0882e" },
      dm: { x: "#efe3fb", t: "#cbb8a8", r: "#e2c26a" },
      pm: { x: "#4b2366", t: "#6b5a4e", r: "#c9a24b" },
      pac: "#4b2366",
      pdeep: "#3a1d52",
      sw: "#dbcdbb"
    },
    easter: {
      n: "부활절",
      s: "부활절",
      tab: "season",
      hf: MYE,
      dark: 0,
      rad: [0.6, 0.56, 0.5, 0.2, "#fff2c4"],
      lin: [[0, "#fffaf1"], [1, "#f6d8b8"]],
      ink: "#22301e",
      sub: "#56614c",
      ac: "#9a6714",
      pill: "#3f6e45",
      pillInk: "#ffffff",
      deep: "#2f4a33",
      dac: "#f2d27a",
      m: { r: "#e6b84f", gl: "#ffd76e", m: "#8db486", m2: "#6f9a68", o: "#3b3a34", l: "#ffe39a", st: "#cfc7b8", st2: "#9c9384", gr: "#5e8c58", fl: "#ffffff", fc: "#e6b84f" },
      pm: { r: "#d4a640", gl: "#f2cf6a", m: "#8db486", m2: "#6f9a68", o: "#3b3a34", l: "#f6d77a", st: "#cfc7b8", st2: "#9c9384", gr: "#5e8c58", fl: "#f3e9c8", fc: "#d4a640" },
      pac: "#3f6e45",
      pdeep: "#2f4a33",
      sw: "#f6d8b8"
    },
    event: Object.assign({
      n: "교회 행사",
      s: "행사",
      tab: "event",
      hf: PRE,
      dark: 1,
      ink: "#ffffff",
      sub: "#c9d6f2",
      ac: "#e8c47c",
      pill: "#e8c47c",
      pillInk: "#0e1a36",
      deep: "#0e1a36",
      m: { a: "#e8c47c" },
      pm: { a: null },
      pac: null,
      pdeep: null,
      sw: "#14295c"
    }, SUN_BG)
  };
  const ORDER = ["sunday", "thanks", "advent", "christmas", "newyear", "lent", "easter", "event"];
  const SEASON = ["thanks", "advent", "christmas", "newyear", "lent", "easter"];
  const WHEN = { sunday: "매주", thanks: "11월 셋째 주일", advent: "성탄 전 넷째 주일부터 4주", christmas: "성탄 전야 · 성탄절 · 성탄 후 첫 주일", newyear: "12월 31일 밤", lent: "재의 수요일부터 부활절 전날까지", easter: "부활주일", event: "교회가 정한 날" };
  const THEME_CAT = { thanks: "thanks", advent: "candle", christmas: "christmas", newyear: "newyear", lent: "lent", easter: "easter" };
  function star4(cx, cy, R, r, rot, fill, op) {
    let p = "";
    for (let i = 0; i < 8; i++) {
      const a = (rot + i * 45) * Math.PI / 180, q = i % 2 ? r : R;
      p += f1(cx + Math.sin(a) * q) + "," + f1(cy - Math.cos(a) * q) + " ";
    }
    return `<polygon points="${p.trim()}" fill="${fill}"${op != null ? ` opacity="${op}"` : ""}/>`;
  }
  function glow(cx, cy, r, col, k) {
    k = k || 1;
    return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${col}" opacity="${(0.07 * k).toFixed(2)}"/><circle cx="${cx}" cy="${cy}" r="${f1(r * 0.66)}" fill="${col}" opacity="${(0.1 * k).toFixed(2)}"/><circle cx="${cx}" cy="${cy}" r="${f1(r * 0.38)}" fill="${col}" opacity="${(0.16 * k).toFixed(2)}"/>`;
  }
  const MOT = {
    sunday(c) {
      return `<g fill="none" stroke="${c.a}" stroke-linecap="round"><circle cx="200" cy="200" r="182" stroke-width="2" opacity=".2"/><circle cx="200" cy="200" r="146" stroke-width="2.5" opacity=".38"/><circle cx="200" cy="200" r="110" stroke-width="3" opacity=".7"/><path d="M200 120v160M152 176h96" stroke-width="15"/><path d="M110 300q22-14 45 0t45 0 45 0 45 0" stroke-width="3" opacity=".55"/><path d="M128 326q18-11 36 0t36 0 36 0 36 0" stroke-width="2.5" opacity=".35"/></g>`;
    },
    event(c) {
      let lv = "", st = "";
      [-1, 1].forEach((sd) => {
        let d = "";
        for (let k = 0; k <= 11; k++) {
          const th = (28 + k * 11.5) * Math.PI / 180, x = 200 + sd * Math.sin(th) * 152, y = 214 + Math.cos(th) * 152;
          d += (k ? "L" : "M") + f1(x) + " " + f1(y);
          if (k === 0) continue;
          const ang = Math.atan2(-Math.sin(th), sd * Math.cos(th)) * 180 / Math.PI;
          [-1, 1].forEach((io) => {
            const ox = x + io * Math.cos(th) * 11 * sd, oy = y - io * Math.sin(th) * 11;
            lv += `<ellipse cx="${f1(ox)}" cy="${f1(oy)}" rx="17" ry="6.5" transform="rotate(${f1(ang + io * 32 * sd)} ${f1(ox)} ${f1(oy)})"/>`;
          });
        }
        st += `<path d="${d}"/>`;
      });
      return `<g><g fill="none" stroke="${c.a}" stroke-width="3" opacity=".8">${st}</g><g fill="${c.a}" opacity=".9">${lv}</g><path d="M200 128v150M154 186h92" stroke="${c.a}" stroke-width="15" stroke-linecap="round"/>${star4(200, 60, 26, 5, 0, c.a)}</g>`;
    },
    advent(c, v) {
      const base = 318, r = rng(11), cand = [{ x: 116, t: 204, k: c.p }, { x: 284, t: 188, k: c.p }, { x: 174, t: 168, k: c.k }, { x: 226, t: 150, k: c.p }];
      let back = "", front = "", gl = "", fl = "", cd = "";
      for (let i = 0; i < 84; i++) {
        const t = i / 84 * Math.PI * 2 + i % 2 * 0.04, sn = Math.sin(t), cs = Math.cos(t), rw = i % 2 ? 150 : 172, x = 200 + rw * cs, y = base + (i % 2 ? 26 : 36) * sn;
        const ang = Math.atan2(30 * cs, -160 * sn) * 180 / Math.PI + (r() - 0.5) * 70, col = r() > 0.45 ? c.g1 : c.g2;
        const e = `<ellipse cx="${f1(x)}" cy="${f1(y)}" rx="27" ry="10.5" transform="rotate(${f1(ang)} ${f1(x)} ${f1(y)})" fill="${col}"/>`;
        if (sn < 0) back += e;
        else front += e;
      }
      let ber = "";
      [0.5, 1.35, 2.2, 2.9].forEach((t) => {
        const x = 200 + 160 * Math.cos(t), y = base + 30 * Math.sin(t) + 4;
        ber += `<circle cx="${f1(x - 6)}" cy="${f1(y)}" r="5" fill="${c.b}"/><circle cx="${f1(x + 5)}" cy="${f1(y + 3)}" r="5" fill="${c.b}"/><circle cx="${f1(x)}" cy="${f1(y - 6)}" r="5" fill="${c.b}"/>`;
      });
      cand.forEach((q, i) => {
        cd += `<rect x="${q.x - 16}" y="${q.t}" width="32" height="${base - q.t + 8}" rx="5" fill="${q.k}"/><rect x="${q.x - 10}" y="${q.t + 9}" width="6" height="${base - q.t - 18}" rx="3" fill="#ffffff" opacity=".22"/><path d="M${q.x} ${q.t}v-11" stroke="${c.w}" stroke-width="3" stroke-linecap="round"/>`;
        if (i < v) {
          gl += glow(q.x, q.t - 30, 52, c.gl, 1.2);
          fl += `<path d="M${q.x} ${q.t - 58}C${q.x + 14} ${q.t - 40} ${q.x + 13} ${q.t - 21} ${q.x} ${q.t - 11}C${q.x - 13} ${q.t - 21} ${q.x - 14} ${q.t - 40} ${q.x} ${q.t - 58}Z" fill="${c.f}"/><path d="M${q.x} ${q.t - 41}C${q.x + 6} ${q.t - 31} ${q.x + 6} ${q.t - 22} ${q.x} ${q.t - 16}C${q.x - 6} ${q.t - 22} ${q.x - 6} ${q.t - 31} ${q.x} ${q.t - 41}Z" fill="${c.fi}"/>`;
        }
      });
      return `<g>${gl}${back}${cd}${front}${ber}${fl}</g>`;
    },
    christmas(c) {
      return `<g>${glow(200, 166, 168, c.gl, 1.3)}<path d="M195 186L200 398L205 186Z" fill="${c.s}" opacity=".5"/>${star4(200, 166, 164, 15, 0, c.s)}${star4(200, 166, 86, 11, 45, c.s2)}<circle cx="200" cy="166" r="11" fill="${c.c}"/>${star4(70, 86, 24, 4.5, 0, c.t, 0.9)}${star4(334, 62, 17, 3.5, 0, c.t, 0.8)}${star4(352, 262, 13, 3, 0, c.t, 0.7)}${star4(46, 262, 11, 2.5, 0, c.t, 0.6)}${star4(300, 340, 9, 2, 0, c.t, 0.5)}</g>`;
    },
    newyear(c) {
      let rays = "";
      for (let i = -4; i <= 4; i++) {
        const a = i * 19 * Math.PI / 180;
        rays += `<path d="M${f1(200 + Math.sin(a) * 124)} ${f1(250 - Math.cos(a) * 124)}L${f1(200 + Math.sin(a) * (i % 2 ? 166 : 182))} ${f1(250 - Math.cos(a) * (i % 2 ? 166 : 182))}"/>`;
      }
      return `<g>${glow(200, 248, 176, c.gl, 1.2)}<g stroke="${c.r}" stroke-width="7" stroke-linecap="round" opacity=".9">${rays}</g><path d="M102 250A98 98 0 0 1 298 250Z" fill="${c.s}"/><path d="M138 250A62 62 0 0 1 262 250Z" fill="${c.s2}" opacity=".55"/><path d="M22 250H378" stroke="${c.h}" stroke-width="5" stroke-linecap="round"/><g stroke="${c.s}" stroke-width="7" stroke-linecap="round"><path d="M136 278H264" opacity=".75"/><path d="M158 302H242" opacity=".55"/><path d="M176 326H224" opacity=".38"/><path d="M190 350H210" opacity=".24"/></g></g>`;
    },
    lent(c) {
      let rays = "";
      for (let i = 0; i < 24; i++) {
        const a = i * 15 * Math.PI / 180;
        rays += `<path d="M${f1(200 + Math.sin(a) * 72)} ${f1(126 - Math.cos(a) * 72)}L${f1(200 + Math.sin(a) * 196)} ${f1(126 - Math.cos(a) * 196)}"/>`;
      }
      const ring = (ph) => {
        let d = "";
        for (let a = 0; a <= 360; a += 5) {
          const t = a * Math.PI / 180, rr = 50 + 5 * Math.sin(t * 6 + ph);
          d += (a ? "L" : "M") + f1(200 + Math.cos(t) * rr) + " " + f1(126 + Math.sin(t) * rr * 0.9);
        }
        return d + "Z";
      };
      let sp = "";
      for (let k = 0; k < 15; k++) {
        const t = (k * 24 + 7) * Math.PI / 180, tw = k % 2 ? 0.28 : -0.28;
        sp += `<path d="M${f1(200 + Math.cos(t) * 50)} ${f1(126 + Math.sin(t) * 45)}L${f1(200 + Math.cos(t + tw) * 66)} ${f1(126 + Math.sin(t + tw) * 59)}"/>`;
      }
      return `<g><g stroke="${c.r}" stroke-width="3" opacity=".55" stroke-linecap="round">${rays}</g><path d="M200 30V382M134 126H266" stroke="${c.x}" stroke-width="18"/><g fill="none" stroke="${c.t}" stroke-width="4.5" stroke-linejoin="round" stroke-linecap="round"><path d="${ring(0)}"/><path d="${ring(2.2)}" opacity=".8"/>${sp}</g></g>`;
    },
    easter(c) {
      let rays = "";
      for (let i = -6; i <= 6; i++) {
        const a = i * 13 * Math.PI / 180, L = i % 2 ? 196 : 228;
        rays += `<path d="M${f1(220 + Math.sin(a) * 88)} ${f1(300 - Math.cos(a) * 88)}L${f1(220 + Math.sin(a) * L)} ${f1(300 - Math.cos(a) * L)}"/>`;
      }
      return `<g>${glow(220, 290, 196, c.gl, 1.4)}<g stroke="${c.r}" stroke-width="6" stroke-linecap="round" opacity=".75">${rays}</g>
<path d="M8 374C64 248 336 234 392 374Z" fill="${c.m}"/><path d="M8 374C64 248 336 234 392 374" fill="none" stroke="${c.m2}" stroke-width="4"/>
<path d="M176 374V308A44 44 0 0 1 264 308V374Z" fill="${c.o}"/><path d="M191 374V313A29 29 0 0 1 249 313V374Z" fill="${c.l}" opacity=".42"/>
<circle cx="314" cy="336" r="36" fill="${c.st}"/><path d="M340 312A36 36 0 0 1 300 369A40 40 0 0 0 340 312Z" fill="${c.st2}" opacity=".55"/><path d="M302 316l9 9-3 10M322 344l7 5" stroke="${c.st2}" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
<g stroke="${c.gr}" stroke-width="3.5" stroke-linecap="round"><path d="M60 352l-6-16M64 350v-19M68 352l6-15"/><path d="M136 334l-5-14M140 332v-17M144 334l5-13"/><path d="M360 362l-5-14M364 360v-16M368 362l5-13"/></g>
<g fill="${c.fl}"><circle cx="96" cy="326" r="6.5"/><circle cx="105" cy="317" r="6.5"/><circle cx="114" cy="326" r="6.5"/><circle cx="105" cy="335" r="6.5"/></g><circle cx="105" cy="326" r="4" fill="${c.fc}"/></g>`;
    },
    thanks(c) {
      const A = [-38, -25, -12, 0, 12, 25, 38];
      let s = "", g = "";
      A.forEach((deg) => {
        const a = deg * Math.PI / 180, sx = Math.sin(a), cy0 = Math.cos(a), hx = 200 + sx * 118, hy = 258 - cy0 * 118, bx = 200 - deg * 1.4;
        s += `<path d="M${f1(bx)} 382Q200 304 200 262Q${f1(200 + sx * 40)} ${f1(258 - cy0 * 40)} ${f1(hx)} ${f1(hy)}"/>`;
        for (let j = 0; j < 6; j++) {
          const px = hx + sx * j * 15, py = hy - cy0 * j * 15;
          [-1, 1].forEach((sd) => {
            const ox = px + cy0 * sd * 7.5, oy = py + sx * sd * 7.5;
            g += `<ellipse cx="${f1(ox)}" cy="${f1(oy)}" rx="6.5" ry="12.5" transform="rotate(${deg + sd * 26} ${f1(ox)} ${f1(oy)})"/>`;
          });
        }
        const tx = hx + sx * 92, ty = hy - cy0 * 92;
        g += `<ellipse cx="${f1(tx)}" cy="${f1(ty)}" rx="6" ry="12" transform="rotate(${deg} ${f1(tx)} ${f1(ty)})"/>`;
        s += `<path d="M${f1(tx + sx * 8)} ${f1(ty - cy0 * 8)}L${f1(tx + sx * 44)} ${f1(ty - cy0 * 44)}" stroke-width="2"/>`;
      });
      return `<g>${glow(200, 200, 186, c.gl, 1)}<path d="M196 382C150 360 112 330 90 286C134 298 170 328 196 382Z" fill="${c.lf}"/><path d="M204 382C250 360 288 330 310 286C266 298 230 328 204 382Z" fill="${c.lf}"/><g fill="none" stroke="${c.st}" stroke-width="4" stroke-linecap="round">${s}</g><g fill="${c.gr}">${g}</g><path d="M200 268C174 238 156 288 200 268C246 238 262 288 200 268Z" fill="${c.rb}"/><path d="M200 268l-18 36M200 268l15 38" stroke="${c.rb}" stroke-width="6.5" stroke-linecap="round"/><rect x="189" y="257" width="22" height="22" rx="6" fill="${c.rb2}"/></g>`;
    }
  };
  function dots(seed, n, col, r0, r1, y0, y1, o0, o1) {
    const r = rng(seed);
    let s = "";
    for (let i = 0; i < n; i++) s += `<circle cx="${f1(r() * 1920)}" cy="${f1(y0 + r() * (y1 - y0))}" r="${f1(r0 + r() * (r1 - r0))}" fill="${col}" opacity="${(o0 + r() * (o1 - o0)).toFixed(2)}"/>`;
    return s;
  }
  function waves(col) {
    let s = "";
    for (let i = 0; i < 6; i++) {
      const y = 800 + i * 42;
      s += `<path d="M-20 ${y}C300 ${y - 38} 640 ${y + 38} 960 ${y}S1620 ${y - 38} 1940 ${y}" fill="none" stroke="${col}" stroke-width="2.5" opacity="${(0.06 + i * 0.03).toFixed(2)}"/>`;
    }
    return s;
  }
  function fan(cx, cy, col, op) {
    let s = "";
    for (let i = 0; i < 14; i++) {
      const a0 = (-65 + i * 10) * Math.PI / 180, a1 = a0 + 4.2 * Math.PI / 180, R = 1600;
      s += `<path d="M${cx} ${cy}L${f1(cx + Math.sin(a0) * R)} ${f1(cy + Math.cos(a0) * R)}L${f1(cx + Math.sin(a1) * R)} ${f1(cy + Math.cos(a1) * R)}Z" fill="${col}" opacity="${op}"/>`;
    }
    return s;
  }
  function grains(seed, n, col) {
    const r = rng(seed);
    let s = "";
    for (let i = 0; i < n; i++) {
      const x = r() * 1920, y = r() * 1080;
      s += `<ellipse cx="${f1(x)}" cy="${f1(y)}" rx="4" ry="9" transform="rotate(${Math.round(r() * 180)} ${f1(x)} ${f1(y)})" fill="${col}" opacity="${(0.08 + r() * 0.14).toFixed(2)}"/>`;
    }
    return s;
  }
  const PAT = {
    sunday: () => waves("#e8c47c"),
    event: () => waves("#e8c47c") + dots(4, 40, "#e8c47c", 1.5, 3.5, 0, 700, 0.1, 0.35),
    thanks: () => grains(8, 70, "#f6c45e"),
    advent: () => dots(21, 80, "#ffffff", 1.4, 3.8, 0, 1080, 0.08, 0.45),
    christmas: () => dots(5, 130, "#ffffff", 1.8, 5.5, 0, 1080, 0.1, 0.55) + '<path d="M0 990C320 930 640 968 960 992S1600 948 1920 984V1080H0Z" fill="#ffffff" opacity=".08"/><path d="M0 1032C400 1000 800 1040 1200 1020S1700 1000 1920 1030V1080H0Z" fill="#ffffff" opacity=".07"/>',
    newyear: () => dots(9, 90, "#ffffff", 1.2, 3.2, 0, 600, 0.15, 0.7),
    lent: () => fan(960, -120, "#ffffff", 0.15) + dots(3, 260, "#5a4636", 1, 2.4, 0, 1080, 0.04, 0.12),
    easter: () => fan(960, -120, "#ffffff", 0.24) + '<path d="M0 1000C360 940 700 980 980 1000S1600 950 1920 990V1080H0Z" fill="#8db486" opacity=".22"/>'
  };
  const SVGS = /* @__PURE__ */ new Map();
  const svgCached = (k, fn) => {
    if (!SVGS.has(k)) SVGS.set(k, fn());
    return SVGS.get(k);
  };
  const svgUrl = (s) => "data:image/svg+xml;charset=utf-8," + encodeURIComponent(s);
  const motifUrl = (id, v, pal, pk) => svgCached("m" + id + v + pk, () => svgUrl(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="-100 -100 600 600" width="600" height="600">${MOT[id](pal, v)}</svg>`));
  const patUrl = (id) => svgCached("p" + id, () => svgUrl(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080" width="1920" height="1080">${(PAT[id] || (() => ""))()}</svg>`));
  const motifSvg = (id, v, pal) => `<svg viewBox="0 0 400 400" aria-hidden="true" focusable="false" style="display:block;width:100%;height:100%;overflow:visible">${MOT[id](pal, v)}</svg>`;
  const STK = window.WT_STOCK && Array.isArray(window.WT_STOCK.list) ? window.WT_STOCK : { cats: [], list: [] };
  const CATS = (STK.cats || []).filter((c) => c && c.k).map((c) => ({ k: String(c.k), ko: String(c.ko || c.k) }));
  const PHOTOS = STK.list.filter((p) => p && /^[xp]\d{1,12}$/.test(p.k) && /^[\w.-]+$/.test(p.f)).map((p) => ({ k: p.k, f: p.f, c: p.c, s: p.s === "Pixabay" ? "Pixabay" : "Pexels", n: str(p.n, 80), t: Array.isArray(p.t) ? p.t.slice(0, 3).map((x) => str(x, 20)) : [] }));
  const PHK = new Map(PHOTOS.map((p) => [p.k, p]));
  const stockSrc = (k, small) => {
    const p = PHK.get(k);
    return p ? BASE + "stock/" + (small ? "thumb" : "1920") + "/" + encodeURIComponent(p.f) + ".webp" : "";
  };
  const credit = (p) => p ? `사진: ${p.n ? p.n + " · " : ""}${p.s}` : "";
  const catKo = (k) => (CATS.find((c) => c.k === k) || {}).ko || "";
  const firstOf = (cat) => (PHOTOS.find((p) => p.c === cat) || PHOTOS[0] || {}).k || null;
  let PROBE = null;
  function probe() {
    if (PROBE) return PROBE;
    PROBE = new Promise((res) => {
      if (!PHOTOS.length) {
        res(false);
        return;
      }
      const im = new Image();
      let t = setTimeout(() => res(false), 8e3);
      im.onload = () => {
        clearTimeout(t);
        res(true);
      };
      im.onerror = () => {
        clearTimeout(t);
        res(false);
      };
      im.src = stockSrc(PHOTOS[0].k, true);
    });
    return PROBE;
  }
  const OWN_RE = /^img_[a-z0-9]{6,24}$/;
  const OWN = /* @__PURE__ */ new Map();
  function ownGet(id) {
    if (!id || !OWN_RE.test(id)) return { done: true, url: null };
    let r = OWN.get(id);
    if (r) return r;
    r = { done: false, url: null };
    OWN.set(id, r);
    const W = window.Tpl;
    if (!W || typeof W.imgLoad !== "function") {
      r.done = true;
      return r;
    }
    r.p = W.imgLoad([id]).then(() => {
      r.url = W.imgUrl(id) || null;
      r.done = true;
      redrawSoon();
    }, () => {
      r.done = true;
      redrawSoon();
    });
    return r;
  }
  const OWN_KEY = () => KP + "theme-own";
  function ownList() {
    const a = jget(OWN_KEY());
    return (Array.isArray(a) ? a : []).filter((x) => typeof x === "string" && OWN_RE.test(x)).slice(0, 12);
  }
  function ownSave(list) {
    return lsSet(OWN_KEY(), JSON.stringify((list || []).filter((x) => OWN_RE.test(x)).slice(0, 12)));
  }
  let CHURCH_FN = null;
  function church() {
    if (CHURCH_FN) {
      try {
        const c = CHURCH_FN() || {};
        return { name: str(c.name, 60), logo: typeof c.logo === "string" && /^data:image\/(png|jpeg|gif|webp|svg\+xml);/.test(c.logo) ? c.logo : "" };
      } catch (e) {
      }
    }
    const me = jget(KP + "me") || {}, st = jget(KP + "style"), s = st && st.set ? st.set : {};
    const logo = s.logoSrc === "image" && typeof s.logoImage === "string" && /^data:image\/(png|jpeg|gif|webp|svg\+xml);/.test(s.logoImage) ? s.logoImage : "";
    return { name: str(me.church, 60), logo };
  }
  const ID_OK = (id) => ORDER.includes(id);
  function norm(x) {
    if (!x || typeof x !== "object" || !ID_OK(x.id)) return null;
    const o = {
      v: 1,
      id: x.id,
      look: x.look === "photo" ? "photo" : "draw",
      stock: typeof x.stock === "string" && /^[xp]\d{1,12}$/.test(x.stock) ? x.stock : null,
      own: typeof x.own === "string" && OWN_RE.test(x.own) ? x.own : null,
      dim: Math.round(clamp(typeof x.dim === "number" && isFinite(x.dim) ? x.dim : 45, 0, 80)),
      head: typeof x.head === "string" ? x.head.slice(0, 40) : null,
      sub: str(x.sub, 40),
      logo: x.logo !== false
    };
    if (x.id === "advent") o.wk = Math.round(clamp(+x.wk || 1, 1, 4));
    if (x.id === "event" && typeof x.ev === "string" && /^[\w-]{1,40}$/.test(x.ev)) o.ev = x.ev;
    if (o.look === "photo" && !o.stock && !o.own) o.look = "draw";
    return o;
  }
  function contiVals(state, title) {
    const st = state && typeof state === "object" ? state : {}, wo = st.wo && typeof st.wo === "object" ? st.wo : null;
    const out = { svc: str(wo && wo.name, 60).trim() || str(title, 60).trim(), date: wo && P(wo.date) ? wo.date : "", ser: "", pr: "", wo: !!wo };
    if (wo && Array.isArray(wo.slots)) {
      const sl = wo.slots.find((x) => x && x.type === "sermon" && !x.out);
      if (sl) {
        const songs = (Array.isArray(st.songs) ? st.songs : []).filter((s) => s && s.slot === sl.sid);
        const t = songs.map((s) => (Array.isArray(s.slides) ? s.slides : []).map((y) => str(y && y.text, 400)).find((y) => y.trim()) || "").find(Boolean) || "";
        const ln = t.split("\n").map((x) => x.trim()).filter(Boolean);
        if (ln.length) {
          out.ser = ln[0].slice(0, 80);
          out.pr = ln.slice(1).join(" ").slice(0, 60);
        } else if (sl.vals && typeof sl.vals === "object") {
          out.ser = str(sl.vals.stitle, 80).trim();
          out.pr = str(sl.vals.preacher, 60).trim();
        }
      }
    }
    return out;
  }
  function autoHead(id, date, wk, ev) {
    const o = P(date);
    if (id === "advent") return o && dow(o.n) === 0 ? `대림절 ${ORD[wk || 1]} 주일` : "대림절";
    if (o) {
      const r = recs(date).find((x) => x.id === id && (id !== "event" || !ev || x.ev === ev));
      if (r) return r.head;
    }
    if (id === "event") {
      const e = events().find((x) => x.id === ev) || events()[0];
      return e ? e.name : "교회 행사";
    }
    if (id === "newyear") return o ? `${o.y}-${o.y + 1}` : "송구영신";
    return { sunday: "", christmas: "성탄절", lent: "사순절", easter: "부활주일", thanks: "추수감사주일" }[id] || "";
  }
  function pickedOrRec(state) {
    const th = norm(state && state.theme);
    if (th) return { th, set: true };
    const cv = contiVals(state), r = recs(cv.date)[0];
    return { th: norm({ id: r ? r.id : "sunday", wk: r && r.v ? r.v : 1, ev: r && r.ev ? r.ev : null }), set: false };
  }
  function photoOf(th, small) {
    if (!th || th.look !== "photo") return null;
    if (th.own) {
      const r = ownGet(th.own);
      return { src1920: r.url || "", thumb: r.url || "", credit: "우리 교회 사진", own: true, ready: r.done, ok: !!r.url };
    }
    const p = PHK.get(th.stock);
    if (!p) return null;
    return { src1920: stockSrc(th.stock, false), thumb: stockSrc(th.stock, true), credit: credit(p), key: p.k, ready: true, ok: true };
  }
  function resolve(state) {
    const { th, set } = pickedOrRec(state), D = THEMES[th.id], cv = contiVals(state);
    const ph = photoOf(th), photo = th.look === "photo" && ph;
    const head = th.head != null ? th.head : autoHead(th.id, cv.date, th.wk, th.ev);
    return {
      id: th.id,
      name: D.n,
      look: photo ? "photo" : "draw",
      set,
      colors: { bg: D.lin[D.lin.length - 1][1], fg: photo ? "#ffffff" : D.ink, accent: photo ? D.dac || D.ac : D.ac, print: { accent: D.pac, deep: D.pdeep } },
      photo: ph ? { src1920: ph.src1920, thumb: ph.thumb, credit: ph.credit } : null,
      dim: th.dim,
      head,
      headAuto: th.head == null,
      sub: th.sub,
      logo: th.logo,
      wk: th.wk || 1,
      ev: th.ev || null
    };
  }
  function model(state, opts) {
    const o = opts || {}, { th } = pickedOrRec(state), cv = contiVals(state, o.title);
    return {
      v: 1,
      id: th.id,
      look: th.look,
      stock: th.stock,
      own: th.own,
      dim: th.dim,
      head: th.head != null ? th.head : autoHead(th.id, cv.date, th.wk, th.ev),
      sub: th.sub,
      logo: th.logo,
      wk: th.wk || 1,
      svc: cv.svc,
      date: cv.date,
      ser: cv.ser,
      pr: cv.pr
    };
  }
  function normModel(x) {
    if (!x || typeof x !== "object" || !ID_OK(x.id)) return null;
    const th = norm(Object.assign({}, x, { head: null }));
    if (!th) return null;
    return {
      v: 1,
      id: th.id,
      look: th.look,
      stock: th.stock,
      own: th.own,
      dim: th.dim,
      head: str(x.head, 40),
      sub: th.sub,
      logo: th.logo,
      wk: th.wk || Math.round(clamp(+x.wk || 1, 1, 4)),
      svc: str(x.svc, 60),
      date: P(x.date) ? x.date : "",
      ser: str(x.ser, 80),
      pr: str(x.pr, 60)
    };
  }
  const label = (id, head) => {
    const D = THEMES[id];
    if (!D) return "";
    if (!head) return D.n;
    if (head.includes(D.s.slice(0, 2))) return head;
    return `${D.n} · ${head}`;
  };
  const IM = /* @__PURE__ */ new Map();
  function imgGet(src) {
    if (!src) return null;
    let r = IM.get(src);
    if (r) return r;
    const img = new Image();
    r = { img, done: false, ok: false };
    r.p = new Promise((res) => {
      img.onload = () => {
        r.done = true;
        r.ok = true;
        res();
        redrawSoon();
      };
      img.onerror = () => {
        r.done = true;
        r.ok = false;
        res();
        redrawSoon();
      };
    });
    img.decoding = "async";
    img.src = src;
    IM.set(src, r);
    if (IM.size > 400) {
      const k = IM.keys().next().value;
      IM.delete(k);
    }
    return r;
  }
  function hexA(h) {
    const s = String(h || "#000").replace("#", "");
    const n = parseInt(s.slice(0, 6), 16) || 0;
    const a = s.length >= 8 ? parseInt(s.slice(6, 8), 16) / 255 : 1;
    return [n >> 16 & 255, n >> 8 & 255, n & 255, a];
  }
  const rgba = (h, k) => {
    const c = hexA(h);
    return `rgba(${c[0]},${c[1]},${c[2]},${(c[3] * (k == null ? 1 : k)).toFixed(3)})`;
  };
  function cover(ctx, img, x, y, w, h) {
    const iw = img.naturalWidth || img.width, ih = img.naturalHeight || img.height;
    if (!iw || !ih) return;
    const k = Math.max(w / iw, h / ih), dw = iw * k, dh = ih * k;
    ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
  }
  function rrect(ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
  const FONTS = document.fonts || null;
  function fontStr(wt, px, fam) {
    return `${wt} ${Math.max(1, px).toFixed(2)}px ${fam}`;
  }
  function setF(ctx, wt, px, fam, ls) {
    ctx.font = fontStr(wt, px, fam);
    if ("letterSpacing" in ctx) ctx.letterSpacing = ls ? (ls * px).toFixed(2) + "px" : "0px";
  }
  function needFont(ctx, text, pend) {
    if (!FONTS || !text) return;
    const f = ctx.font;
    try {
      if (!FONTS.check(f, text)) pend.push(FONTS.load(f, text).catch(() => null));
    } catch (e) {
    }
  }
  const mw = (ctx, s) => ctx.measureText(s).width;
  function wrapPara(ctx, text, maxW) {
    const words = text.split(/ +/).filter(Boolean), out = [];
    let cur = "";
    const longWord = (w) => {
      let part = "";
      for (const ch of w) {
        if (part && mw(ctx, part + ch) > maxW) {
          out.push(part);
          part = ch;
        } else part += ch;
      }
      return part;
    };
    for (const w of words) {
      const t = cur ? cur + " " + w : w;
      if (mw(ctx, t) <= maxW) {
        cur = t;
        continue;
      }
      if (cur) out.push(cur);
      cur = mw(ctx, w) <= maxW ? w : longWord(w);
    }
    if (cur) out.push(cur);
    return out.length ? out : [""];
  }
  const wrap = (ctx, text, maxW) => String(text).split("\n").map((x) => x.trim()).filter((x, i, a) => x || a.length === 1).flatMap((p) => wrapPara(ctx, p, maxW));
  function balanced(ctx, text, maxW) {
    const base = wrap(ctx, text, maxW), n = base.length;
    if (n < 2 || n > 6) return base;
    const wMax = String(text).split(/\s+/).filter(Boolean).reduce((m, w) => Math.max(m, mw(ctx, w)), 0);
    let lo = Math.min(maxW, wMax), hi = maxW, best = base;
    for (let i = 0; i < 14; i++) {
      const mid = (lo + hi) / 2, L = wrap(ctx, text, mid);
      if (L.length <= n) {
        hi = mid;
        best = L;
      } else lo = mid;
    }
    return best;
  }
  function ellip(ctx, s, maxW) {
    if (mw(ctx, s) <= maxW) return s;
    let t = s;
    while (t.length > 1 && mw(ctx, t + "…") > maxW) t = t.slice(0, -1);
    return t + "…";
  }
  function fit(ctx, text, o, pend) {
    let s = o.size, L = [""];
    for (let g = 0; g < 40; g++) {
      setF(ctx, o.wt, s, o.fam, o.ls);
      L = o.bal ? balanced(ctx, text, o.maxW) : wrap(ctx, text, o.maxW);
      const tall = o.maxH && L.length * s * o.lh > o.maxH + 0.5, wide = L.some((l) => mw(ctx, l) > o.maxW + 0.5);
      if (!tall && !wide || s <= o.min) break;
      s = Math.max(o.min, s * 0.93);
    }
    if (o.maxH) {
      const k = Math.max(1, Math.floor((o.maxH + 0.5) / (s * o.lh)));
      if (L.length > k) {
        L = L.slice(0, k);
        L[k - 1] = ellip(ctx, L[k - 1] + "…", o.maxW);
      }
    }
    if (o.lines1 && L.length > 1) L = [ellip(ctx, L.join(" "), o.maxW)];
    needFont(ctx, text, pend);
    return { s, L, h: L.length * s * o.lh };
  }
  function lines(ctx, R, o, x, y, w, color, sh) {
    setF(ctx, o.wt, R.s, o.fam, o.ls);
    ctx.fillStyle = color;
    ctx.textBaseline = "middle";
    ctx.textAlign = o.align === "left" ? "left" : "center";
    if (sh) {
      ctx.shadowColor = "rgba(0,0,0,.4)";
      ctx.shadowBlur = sh.b;
      ctx.shadowOffsetY = sh.y;
    }
    const lh = R.s * o.lh;
    R.L.forEach((l, i) => ctx.fillText(l, o.align === "left" ? x : x + w / 2, y + i * lh + lh / 2 + R.s * 0.04));
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
  }
  const SIZES = { wait: [1920, 1080], title: [1920, 1080], yt: [1280, 720], jubo: [1600, 800] };
  const KIND_OK = (k) => k === "wait" || k === "title" || k === "yt";
  function drawTo(ctx, W, H, m, kind, o) {
    o = o || {};
    const pend = o.pend || [];
    const D = THEMES[m.id] || THEMES.sunday, k = Math.min(W / 1920, H / 1080), sw = 1920 * k, shh = 1080 * k, sx = (W - sw) / 2, sy = (H - shh) / 2, u = k;
    ctx.save();
    ctx.clearRect(0, 0, W, H);
    let photo = false, ph = null;
    if (m.look === "photo") {
      if (m.own) {
        const r = ownGet(m.own);
        if (!r.done) pend.push(r.p || Promise.resolve());
        ph = r.url ? imgGet(r.url) : null;
        if (r.done && !r.url) ph = { done: true, ok: false };
      } else {
        const src = stockSrc(m.stock, !!o.small);
        ph = src ? imgGet(src) : { done: true, ok: false };
      }
      photo = !(ph && ph.done && !ph.ok);
    }
    if (photo) {
      ctx.fillStyle = "#0b0d12";
      ctx.fillRect(0, 0, W, H);
      if (ph && ph.ok) cover(ctx, ph.img, 0, 0, W, H);
      else if (ph && ph.p) pend.push(ph.p);
      ctx.fillStyle = `rgba(0,0,0,${(clamp(m.dim, 0, 80) / 100).toFixed(2)})`;
      ctx.fillRect(0, 0, W, H);
      let g;
      if (kind === "yt") {
        g = ctx.createLinearGradient(0, 0, W * 0.72, 0);
        g.addColorStop(0, "rgba(0,0,0,.62)");
        g.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W * 0.72, H);
      } else {
        g = ctx.createLinearGradient(0, H, 0, H * 0.45);
        g.addColorStop(0, "rgba(0,0,0,.65)");
        g.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = g;
        ctx.fillRect(0, H * 0.45, W, H * 0.55);
      }
    } else {
      const lg = ctx.createLinearGradient(0, 0, 0, H);
      D.lin.forEach((s) => lg.addColorStop(s[0], s[1]));
      ctx.fillStyle = lg;
      ctx.fillRect(0, 0, W, H);
      const R = D.rad, rx = R[0] * W, ry = R[1] * H, cx = R[2] * W, cy = R[3] * H;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(rx, ry);
      const rg = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
      rg.addColorStop(0, rgba(R[4]));
      rg.addColorStop(0.72, rgba(R[4], 0));
      ctx.fillStyle = rg;
      ctx.fillRect(-cx / rx, -cy / ry, W / rx, H / ry);
      ctx.restore();
      const pt = imgGet(patUrl(m.id));
      if (pt.ok) cover(ctx, pt.img, 0, 0, W, H);
      else if (!pt.done) pend.push(pt.p);
      const box = kind === "wait" ? [0.38, 0.04, 0.24] : kind === "title" ? [0.43, 0.08, 0.14] : [0.57, m.id === "easter" ? 0.13 : 0.06, 0.48];
      const mo = imgGet(motifUrl(m.id, m.wk || 1, D.m, "s"));
      if (mo.ok) {
        const sz = box[2] * sw;
        ctx.drawImage(mo.img, sx + box[0] * sw - sz * 0.25, sy + box[1] * shh - sz * 0.25, sz * 1.5, sz * 1.5);
      } else if (!mo.done) pend.push(mo.p);
    }
    const ink = photo ? "#ffffff" : D.ink, sub = photo ? "rgba(255,255,255,.85)" : D.sub, ac = photo ? D.dac || D.ac : D.ac;
    const sh = photo || D.dark ? { b: 20 * u, y: 3 * u } : null;
    const C = church(), svc = m.svc || "", head = m.head || "";
    const foot = (showName, left) => {
      const fs = (kind === "yt" ? 40 : 36) * u, Ls = (kind === "yt" ? 68 : 60) * u, name = showName ? C.name : "";
      let lg = null, lw = 0;
      if (m.logo && C.logo) {
        lg = imgGet(C.logo);
        if (lg.ok) {
          const nw = lg.img.naturalWidth || 1, nh = lg.img.naturalHeight || 1;
          lw = Math.min(Ls * nw / nh, Ls * 4);
        } else {
          if (!lg.done) pend.push(lg.p);
          lg = null;
        }
      }
      if (!lw && !name) return;
      setF(ctx, 700, fs, PRE, 0);
      needFont(ctx, name, pend);
      const tw = name ? mw(ctx, name) : 0, gap = lw && name ? 16 * u : 0, tot = lw + gap + tw, hh = Math.max(lw ? Ls : 0, fs * 1.2);
      const cyF = sy + shh * (1 - 0.055) - hh / 2, x0 = left ? sx + 0.06 * sw : sx + (sw - tot) / 2;
      if (lg) ctx.drawImage(lg.img, x0, cyF - Ls / 2, lw, Ls);
      if (name) {
        ctx.fillStyle = sub;
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        if (sh) {
          ctx.shadowColor = "rgba(0,0,0,.4)";
          ctx.shadowBlur = sh.b;
          ctx.shadowOffsetY = sh.y;
        }
        ctx.fillText(name, x0 + lw + gap, cyF + fs * 0.04);
        ctx.shadowColor = "transparent";
        ctx.shadowBlur = 0;
        ctx.shadowOffsetY = 0;
      }
    };
    const X0 = sx + 0.07 * sw, BW = 0.86 * sw;
    if (kind === "wait") {
      const H1 = head || C.name || svc || D.n, line = [H1 === svc ? "" : svc, dateL(m.date)].filter(Boolean).join(" · ");
      let y = sy + 0.49 * shh;
      const gap = 16 * u;
      const oh = { wt: 800, fam: D.hf, size: 100 * u, min: 54 * u, lh: 1.18, maxW: BW, maxH: 240 * u, ls: -0.015, bal: true };
      const r1 = fit(ctx, H1, oh, pend);
      lines(ctx, r1, oh, X0, y, BW, ink, sh);
      y += r1.h + gap;
      if (m.sub) {
        const os = { wt: 800, fam: PRE, size: 46 * u, min: 30 * u, lh: 1.2, maxW: BW, maxH: 120 * u };
        const r2 = fit(ctx, m.sub, os, pend);
        lines(ctx, r2, os, X0, y, BW, ac, sh);
        y += r2.h + gap;
      }
      if (line) {
        const ol = { wt: 600, fam: PRE, size: 44 * u, min: 30 * u, lh: 1.2, maxW: BW, maxH: 110 * u };
        const r3 = fit(ctx, line, ol, pend);
        lines(ctx, r3, ol, X0, y, BW, sub, sh);
      }
      foot(!!head, false);
    } else if (kind === "title") {
      let y = sy + 0.38 * shh;
      const gap = 20 * u;
      if (head) {
        const ok = { wt: 800, fam: D.hf, size: 54 * u, min: 32 * u, lh: 1.2, maxW: BW, maxH: 140 * u, ls: 0.02 };
        const r = fit(ctx, head, ok, pend);
        lines(ctx, r, ok, X0, y, BW, ac, sh);
        y += r.h + gap;
      }
      const ov = { wt: 900, fam: PRE, size: 140 * u, min: 70 * u, lh: 1.16, maxW: BW, maxH: 168 * u, ls: -0.025, bal: true };
      const rs = fit(ctx, svc || "예배", ov, pend);
      lines(ctx, rs, ov, X0, y, BW, ink, sh);
      y += rs.h + gap;
      ctx.fillStyle = ac;
      rrect(ctx, sx + sw / 2 - 60 * u, y, 120 * u, 6 * u, 3 * u);
      ctx.fill();
      y += 6 * u + gap;
      const dl = dateL(m.date);
      if (dl) {
        const od = { wt: 600, fam: PRE, size: 50 * u, min: 30 * u, lh: 1.2, maxW: BW, maxH: 70 * u };
        const r = fit(ctx, dl, od, pend);
        lines(ctx, r, od, X0, y, BW, sub, sh);
        y += r.h + gap;
      }
      if (m.sub) {
        const os = { wt: 800, fam: PRE, size: 46 * u, min: 30 * u, lh: 1.2, maxW: BW, maxH: 120 * u };
        const r = fit(ctx, m.sub, os, pend);
        lines(ctx, r, os, X0, y, BW, ac, sh);
      }
      foot(true, false);
    } else {
      const x0 = sx + 0.06 * sw, bw = 0.52 * sw, y0 = sy + 0.1 * shh, y1 = sy + 0.8 * shh;
      const pt = head || svc || D.n;
      setF(ctx, 800, 50 * u, D.hf, 0);
      needFont(ctx, pt, pend);
      const pTxt = ellip(ctx, pt, bw - 56 * u), pw = mw(ctx, pTxt) + 56 * u, phh = 50 * u * 1.2 + 20 * u;
      ctx.fillStyle = D.pill;
      rrect(ctx, x0, y0, pw, phh, 14 * u);
      ctx.fill();
      ctx.fillStyle = D.pillInk;
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(pTxt, x0 + 28 * u, y0 + phh / 2 + 2 * u);
      let rowB = y0 + phh;
      if (m.sub) {
        setF(ctx, 800, 46 * u, PRE, 0);
        needFont(ctx, m.sub, pend);
        const sw2 = mw(ctx, m.sub);
        let tx = x0 + pw + 20 * u, ty = y0 + phh / 2;
        if (tx + sw2 > x0 + bw) {
          tx = x0;
          ty = rowB + 12 * u + 46 * u * 0.6;
          rowB = rowB + 12 * u + 46 * u * 1.2;
        }
        ctx.fillStyle = ac;
        if (sh) {
          ctx.shadowColor = "rgba(0,0,0,.4)";
          ctx.shadowBlur = sh.b;
          ctx.shadowOffsetY = sh.y;
        }
        ctx.fillText(ellip(ctx, m.sub, x0 + bw - tx), tx, ty + 2 * u);
        ctx.shadowColor = "transparent";
        ctx.shadowBlur = 0;
        ctx.shadowOffsetY = 0;
      }
      const lt = [head ? svc : "", dateS(m.date), m.pr].filter(Boolean).join(" · "), lH = 48 * u * 1.2;
      if (lt) {
        const ol = { wt: 700, fam: PRE, size: 48 * u, min: 30 * u, lh: 1.2, maxW: bw, align: "left", lines1: true };
        const r = fit(ctx, lt, ol, pend);
        lines(ctx, r, ol, x0, y1 - lH, bw, sub, sh);
      }
      const ys = rowB + 24 * u, maxH = y1 - lH - 24 * u - ys;
      if (m.ser) {
        const os = { wt: 900, fam: PRE, size: 156 * u, min: 76 * u, lh: 1.14, maxW: bw, maxH, ls: -0.03, bal: true, align: "left" };
        const r = fit(ctx, m.ser, os, pend);
        lines(ctx, r, os, x0, ys, bw, ink, sh);
      } else if (!o.final) {
        const fs = 156 * u * 0.6;
        setF(ctx, 800, fs, PRE, 0);
        needFont(ctx, "설교 제목", pend);
        const tw = mw(ctx, "설교 제목"), bwid = tw + 40 * u + 12 * u, bh = fs * 1.14 + 12 * u;
        ctx.save();
        ctx.globalAlpha = 0.55;
        ctx.strokeStyle = ink;
        ctx.lineWidth = 6 * u;
        ctx.setLineDash([18 * u, 12 * u]);
        rrect(ctx, x0 + 3 * u, ys + 3 * u, bwid - 6 * u, bh - 6 * u, 20 * u);
        ctx.stroke();
        ctx.fillStyle = ink;
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillText("설교 제목", x0 + 26 * u, ys + bh / 2 + 2 * u);
        ctx.restore();
      }
      foot(true, true);
    }
    ctx.restore();
    return pend;
  }
  const LIVE = /* @__PURE__ */ new Set();
  let RO = null;
  try {
    RO = new ResizeObserver((es) => es.forEach((e) => drawHost(e.target)));
  } catch (e) {
    RO = null;
  }
  let RAF = 0;
  function redrawSoon() {
    if (RAF) return;
    RAF = (window.requestAnimationFrame || setTimeout)(() => {
      RAF = 0;
      LIVE.forEach((el) => {
        if (!el.isConnected) {
          LIVE.delete(el);
          if (RO) RO.unobserve(el);
          return;
        }
        drawHost(el, true);
      });
    });
  }
  if (FONTS) {
    try {
      FONTS.addEventListener("loadingdone", redrawSoon);
      FONTS.ready.then(redrawSoon);
    } catch (e) {
    }
  }
  const CSS = ".wt-cv{position:absolute;left:0;top:0;width:100%;height:100%;display:block;pointer-events:none}.wt-jb{position:absolute;inset:0;display:grid;place-items:center;overflow:visible}.wt-jb>img{display:block;width:100%;height:100%;object-fit:cover}.wt-jb>svg{display:block;width:100%;height:100%;overflow:visible}";
  function injectCss() {
    if (document.getElementById("wt-css")) return;
    const s = document.createElement("style");
    s.id = "wt-css";
    s.textContent = CSS;
    (document.head || document.documentElement).appendChild(s);
  }
  const sigOf = (m, kind) => JSON.stringify([m, kind, church().name]);
  function drawHost(el, force) {
    const st = el.__wt;
    if (!st || st.kind === "jubo") return;
    const w = el.clientWidth, h = el.clientHeight;
    if (!w || !h) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2), W = Math.min(3840, Math.round(w * dpr)), H = Math.min(2160, Math.round(h * dpr));
    const cv = st.cv, ctx = cv.getContext("2d");
    if (!ctx) return;
    const sig = sigOf(st.m, st.kind) + W + "x" + H;
    if (!force && st.sig === sig) return;
    if (cv.width !== W) cv.width = W;
    if (cv.height !== H) cv.height = H;
    const pend = drawTo(ctx, W, H, st.m, st.kind, { small: W <= 560 });
    st.sig = pend.length ? "" : sig;
    if (pend.length && (st.tries = (st.tries || 0) + 1) < 6) Promise.all(pend).then(() => {
      if (el.__wt === st) drawHost(el, true);
    });
  }
  function paint(el, state, kind, opts) {
    return paintModel(el, opts && opts.model || model(state, opts), kind, opts);
  }
  function paintModel(el, m, kind, opts) {
    if (!el) return null;
    injectCss();
    m = normModel(m) || model(null);
    if (kind === "jubo") return paintJubo(el, m, opts || {});
    if (!KIND_OK(kind)) kind = "wait";
    if (getComputedStyle(el).position === "static") el.style.position = "relative";
    let st = el.__wt;
    if (!st || st.kind === "jubo" || !st.cv.isConnected || st.cv.parentNode !== el) {
      unpaint(el);
      const cv = document.createElement("canvas");
      cv.className = "wt-cv";
      cv.setAttribute("aria-hidden", "true");
      el.insertBefore(cv, el.firstChild);
      st = el.__wt = { cv, m, kind };
      LIVE.add(el);
      if (RO) RO.observe(el);
    }
    st.m = m;
    st.kind = kind;
    st.tries = 0;
    el.dataset.wtId = m.id;
    el.dataset.wtLook = m.look;
    el.dataset.wtPhoto = m.look === "photo" ? m.own || m.stock || "" : "";
    el.dataset.wtHead = m.head || "";
    el.dataset.wtKind = kind;
    drawHost(el, false);
    return el;
  }
  function unpaint(el) {
    if (!el) return;
    const st = el.__wt;
    if (st) {
      if (st.cv && st.cv.parentNode === el) st.cv.remove();
      if (st.jb && st.jb.parentNode === el) st.jb.remove();
    }
    el.__wt = null;
    LIVE.delete(el);
    if (RO) try {
      RO.unobserve(el);
    } catch (e) {
    }
    ["wtId", "wtLook", "wtPhoto", "wtHead", "wtKind"].forEach((k) => {
      delete el.dataset[k];
    });
  }
  function paintJubo(el, m, opts) {
    if (getComputedStyle(el).position === "static") el.style.position = "relative";
    let st = el.__wt;
    if (!st || st.kind !== "jubo") {
      unpaint(el);
      const jb2 = document.createElement("div");
      jb2.className = "wt-jb";
      el.append(jb2);
      st = el.__wt = { jb: jb2, kind: "jubo", m };
    }
    st.m = m;
    const D = THEMES[m.id], jb = st.jb;
    el.dataset.wtId = m.id;
    el.dataset.wtLook = m.look;
    el.dataset.wtPhoto = m.look === "photo" ? m.own || m.stock || "" : "";
    el.dataset.wtKind = "jubo";
    const art = () => {
      let pal = opts.dark ? D.dm || D.m : D.pm;
      if (pal.a === null) pal = { a: opts.accent || D.pac || "#2b56c6" };
      jb.innerHTML = motifSvg(m.id, m.wk || 1, pal);
    };
    if (m.look === "photo") {
      const src = m.own ? null : stockSrc(m.stock, false);
      const put = (u) => {
        const im = document.createElement("img");
        im.alt = "";
        im.decoding = "async";
        im.src = u;
        im.onerror = () => {
          if (el.__wt === st) art();
        };
        jb.replaceChildren(im);
      };
      if (src) put(src);
      else {
        const r = ownGet(m.own);
        if (r.url) put(r.url);
        else if (r.done) art();
        else {
          jb.replaceChildren();
          r.p.then(() => {
            if (el.__wt === st) {
              if (r.url) put(r.url);
              else art();
            }
          });
        }
      }
    } else art();
    return el;
  }
  async function canvas(m, kind, W, H) {
    m = normModel(m) || model(null);
    if (!KIND_OK(kind)) kind = "wait";
    const sz = SIZES[kind];
    W = W || sz[0];
    H = H || sz[1];
    const cv = document.createElement("canvas");
    cv.width = W;
    cv.height = H;
    const ctx = cv.getContext("2d");
    for (let i = 0; i < 6; i++) {
      const pend = drawTo(ctx, W, H, m, kind, { final: true });
      if (!pend.length) break;
      await Promise.race([Promise.all(pend), new Promise((r) => setTimeout(r, 6e3))]);
    }
    return cv;
  }
  function png(state, kind, opts) {
    const m = opts && opts.model || model(state, opts);
    return canvas(m, kind).then((cv) => new Promise((res, rej) => {
      try {
        cv.toBlob((b) => b ? res(b) : rej(new Error("png")), "image/png");
      } catch (e) {
        rej(e);
      }
    }));
  }
  window.WTheme = {
    VER,
    THEMES,
    ORDER,
    SEASON,
    WHEN,
    THEME_CAT,
    SIZES,
    init(o) {
      if (o && typeof o.kp === "string") KP = o.kp;
    },
    get kp() {
      return KP;
    },
    resolve,
    model,
    normModel,
    norm,
    pick: pickedOrRec,
    paint,
    paintModel,
    unpaint,
    png,
    canvas,
    drawTo,
    recs,
    advWeek,
    autoHead,
    autoDay,
    nextOf,
    nextN,
    label,
    contiVals,
    events,
    saveEvents,
    normEvent,
    photos: () => PHOTOS.slice(),
    cats: () => CATS.slice(),
    photo: (k) => PHK.get(k) || null,
    stockSrc,
    credit,
    catKo,
    firstOf,
    probe,
    ownGet,
    ownList,
    ownSave,
    OWN_RE,
    church,
    setChurch(fn) {
      CHURCH_FN = typeof fn === "function" ? fn : null;
      redrawSoon();
    },
    redraw: redrawSoon,
    dateL,
    dateY,
    dateS,
    today,
    P,
    dow,
    DOWK,
    ORD,
    ieyo,
    eun,
    roP,
    eul,
    jong
  };
  if (window.Tpl && typeof window.Tpl.on === "function") window.Tpl.on((why) => {
    if (why === "img") redrawSoon();
  });
})();

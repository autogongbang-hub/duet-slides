(function() {
  "use strict";
  if (window.WorshipOrder) return;
  const VER = "1.15.4-b16";
  const KINDS = [["sun", "주일예배"], ["wed", "수요예배"], ["fri", "금요철야"], ["dawn", "새벽예배"], ["rally", "찬양집회"], ["etc", "기타"]];
  const KNAME = Object.fromEntries(KINDS);
  const TYPES = {
    praise: { n: "찬양", ic: "note" },
    bible: { n: "성경", ic: "book" },
    sermon: { n: "설교 제목", ic: "mic" },
    notice: { n: "광고", ic: "mega" },
    cover: { n: "예배 표지", ic: "image" },
    text: { n: "글자", ic: "type" }
  };
  const TYPE_KEYS = Object.keys(TYPES);
  const FIELD = {
    hymn: { l: "찬송가 번호 또는 곡", s: "찬송가 번호", ph: "번호, 예: 21" },
    resp: { l: "교독문 번호", s: "교독문 번호", ph: "번호, 예: 12" },
    prayer: { l: "기도자 이름", s: "기도자", ph: "예: 김하늘 집사" },
    passage: { l: "본문", s: "본문", ph: "예: 요한복음 3:16" },
    stitle: { l: "설교 제목", s: "설교 제목", ph: "예: 빛을 향해 걷는 길" },
    preacher: { l: "설교자", s: "설교자", ph: "예: 김은혜 목사" },
    songs: { l: "곡 여러 개", s: "곡", ph: "쉼표로 나눠요, 예: 새벽의 노래" },
    song: { l: "곡", s: "곡", ph: "예: 새벽의 노래" },
    words: { l: "이번 주 글자", s: "글자", ph: "화면에 나올 글자" },
    notice: { l: "이번 주 문구", s: "문구", ph: "예: 다음 주 일정" }
  };
  const TYPE_FIELDS = { praise: ["song"], bible: ["passage"], sermon: ["stitle", "preacher"], notice: ["notice"], cover: ["words"], text: ["words"] };
  const PRESETS = [
    ["pre", "예배 전 화면", "cover", "fixed", { auto: true }],
    
    ["prep", "준비 찬양", "praise", "weekly", { fields: ["songs"] }],
    ["call", "예배로 부름", "text", "fixed", { text: "예배로 부름" }],
    ["hymn", "찬송", "praise", "weekly", { fields: ["hymn"] }],
    ["resp", "교독문", "text", "weekly", { fields: ["resp"], paste: true }],
    ["creed", "신앙고백", "text", "fixed", { paste: true }],
    ["prayer", "대표기도", "text", "weekly", { fields: ["prayer"] }],
    ["read", "성경 봉독", "bible", "weekly", { fields: ["passage"] }],
    ["choir", "성가대", "text", "fixed", { text: "성가대 찬양" }],
    ["praise", "찬양", "praise", "weekly", { fields: ["songs"] }],
    ["sermon", "설교", "sermon", "weekly", { fields: ["stitle", "preacher"] }],
    ["offer", "헌금", "text", "fixed", { text: "헌금" }],
    ["notice", "광고", "notice", "fixed", { text: "교회 소식" }],
    ["bless", "축도", "text", "fixed", { text: "축도" }],
    ["post", "예배 후 화면", "cover", "fixed", { auto: true, text: "함께 예배드려 감사해요" }]
  ].map(([k, n, type, mode, o]) => ({ k, n, type, mode, fields: o.fields || [], text: o.text || "", paste: !!o.paste, auto: !!o.auto }));
  const PRE = Object.fromEntries(PRESETS.map((p) => [p.k, p]));
  const SHOW = ["both", "jubo", "screen"];
  const PRE_WHO = { prep: "찬양팀", call: "인도자", hymn: "다같이", resp: "다같이", creed: "다같이", read: "인도자", choir: "찬양대", notice: "인도자" };
  const PRE_STAND = /* @__PURE__ */ new Set(["call", "hymn", "creed", "bless"]);
  const showOf = (k) => k === "pre" || k === "post" || k === "prep" ? "screen" : "both";
  const EN_DICT = [
    [["예배로부름", "예배의부름", "부름"], "Call to Worship"],
    [["예배의말씀", "예배기원", "기원"], "Invocation"],
    [["경배의찬송"], "Hymn of Praise"],
    [["경배와찬양"], "Worship and Praise"],
    [["경배와찬양인도"], "Master of Ceremonies"],
    [["입례송", "찬송", "찬송가"], "Hymn"],
    [["찬양", "회중찬양"], "Praise"],
    [["성시교독", "교독문", "교독"], "Responsive Reading"],
    [["사도신경", "신앙고백사도신경"], "The Apostles' Creed"],
    [["신앙고백"], "Confession of Faith"],
    [["참회의기도", "참회기도"], "Confession of Sins"],
    [["용서의확신", "사죄의선언"], "Assurance of Pardon"],
    [["평화의인사"], "Sharing of the Peace"],
    [["응답송"], "Choral Response"],
    [["기도", "회중기도"], "Prayer"],
    [["대표기도"], "Prayer of the People"],
    [["합심기도", "통성기도"], "United Prayer"],
    [["조명을위한기도"], "Prayer for Illumination"],
    [["주기도문"], "The Lord's Prayer"],
    [["성경봉독", "말씀봉독", "성경읽기", "봉독"], "Scripture Reading"],
    [["찬양대찬양", "성가대찬양", "찬양대", "성가대"], "Anthem"],
    [["설교"], "Sermon"],
    [["말씀선포", "말씀"], "Message"],
    [["결단의찬송"], "Hymn of Determination"],
    [["봉헌", "헌금"], "Offering"],
    [["봉헌및찬송"], "Offering & Hymn"],
    [["헌금송", "봉헌송"], "Offertory Song"],
    [["봉헌기도", "헌금기도"], "Offering Prayer"],
    [["봉헌목회기도"], "Offering · Pastoral Prayer"],
    [["송영"], "Doxology"],
    [["성도의교제", "나눔"], "Sharing of Life"],
    [["교회소식", "광고"], "Announcements"],
    [["새가족환영"], "Welcoming Newcomers"],
    [["성찬", "성찬식"], "Holy Communion"],
    [["유아세례"], "Infant Baptism"],
    [["축도"], "Benediction"],
    [["전주"], "Prelude"],
    [["후주", "찬양대후주"], "Postlude"],
    [["인도"], "Presider"],
    [["금주의암송말씀", "암송말씀"], "Memory Verse"],
    [["봉사자", "섬기는이"], "Service Staff"],
    [["교회일정"], "Church Schedule"],
    [["특송", "특별찬양"], "Special Music"]
  ];
  const EN_MAP = /* @__PURE__ */ new Map();
  EN_DICT.forEach(([ks, en]) => ks.forEach((k) => EN_MAP.set(k, en)));
  const EN_KEYS = [...EN_MAP.keys()].sort((a, b) => b.length - a.length);
  const enKey = (s) => String(s || "").replace(/[\s·・.,()（）\[\]]/g, "");
  function enTitle(name) {
    const k = enKey(name);
    if (!k) return "";
    if (EN_MAP.has(k)) return EN_MAP.get(k);
    const hit = EN_KEYS.find((x) => x.length >= 2 && k.endsWith(x));
    return hit ? EN_MAP.get(hit) : "";
  }
  const rid = (p) => (p || "") + Math.random().toString(36).slice(2, 9);
  const str = (v, max) => typeof v === "string" ? v.slice(0, max) : "";
  const ID_RE = /^[\w-]{1,40}$/;
  const FKEY_RE = /^(?:hymn|resp|prayer|passage|stitle|preacher|songs|song|words|notice|u\d{1,6})$/;
  const TPL_RE = /^[\w-]{1,40}$/;
  const TPL_KIND = { praise: "worship", bible: "bible", sermon: "sermon", notice: "notice", cover: "cover" };
  const TPL_TYPES = Object.keys(TPL_KIND);
  function newCard(k, over) {
    const p = PRE[k] || PRE.call;
    const o = over || {};
    const c = Object.assign({ id: rid("c"), k: p.k, name: p.n, type: p.type, mode: p.mode, text: p.text, fields: p.fields.slice(), flab: {}, paste: p.paste, auto: p.auto }, o);
    if (!("en" in o)) c.en = enTitle(c.name);
    if (!("who" in o)) c.who = PRE_WHO[c.k] || "";
    if (!("stand" in o)) c.stand = PRE_STAND.has(c.k);
    if (!("show" in o)) c.show = showOf(c.k);
    return c;
  }
  const cloneCard = (c) => Object.assign(JSON.parse(JSON.stringify(c)), { id: rid("c") });
  function defaultFields(c) {
    const p = PRE[c.k];
    return p && p.type === c.type && p.fields.length ? p.fields.slice() : TYPE_FIELDS[c.type].slice();
  }
  const fieldLabel = (c, f) => FIELD[f] ? FIELD[f].l : c && c.flab && c.flab[f] || "이번 주 내용";
  const fieldShort = (c, f) => FIELD[f] ? FIELD[f].s : c && c.flab && c.flab[f] || "이번 주 내용";
  const fieldPh = (c, f) => FIELD[f] ? FIELD[f].ph : fieldShort(c, f) + " 적기";
  const isCustom = (f) => !FIELD[f];
  function addCustomField(c, label) {
    const l = String(label || "").trim().slice(0, 16) || "이번 주 내용";
    let n = 1;
    while (c.fields.includes("u" + n) || c.flab && c.flab["u" + n]) n++;
    const k = "u" + n;
    c.flab = Object.assign({}, c.flab, { [k]: l });
    c.fields = c.fields.concat(k);
    return k;
  }
  function normCard(x) {
    if (!x || typeof x !== "object") return null;
    const type = TYPES[x.type] ? x.type : "text";
    const flab = {};
    if (x.flab && typeof x.flab === "object") Object.keys(x.flab).forEach((k) => {
      if (/^u\d{1,6}$/.test(k) && typeof x.flab[k] === "string" && x.flab[k].trim()) flab[k] = x.flab[k].trim().slice(0, 16);
    });
    const fields = (Array.isArray(x.fields) ? x.fields : []).filter((f) => typeof f === "string" && FKEY_RE.test(f) && (FIELD[f] || flab[f])).slice(0, 6);
    const c = {
      id: typeof x.id === "string" && ID_RE.test(x.id) ? x.id : rid("c"),
      k: typeof x.k === "string" && /^[a-z]{1,12}$/.test(x.k) ? x.k : "own",
      name: str(x.name, 24).trim() || "순서",
      type,
      mode: x.mode === "weekly" ? "weekly" : "fixed",
      text: str(x.text, 4e3),
      fields: [...new Set(fields)],
      flab,
      paste: !!x.paste,
      auto: !!x.auto
    };
    if (c.mode === "weekly" && !c.fields.length) c.fields = defaultFields(c);
    c.en = typeof x.en === "string" ? x.en.replace(/\s+/g, " ").trim().slice(0, 40) : enTitle(c.name);
    c.who = typeof x.who === "string" ? x.who.replace(/\s+/g, " ").trim().slice(0, 24) : PRE_WHO[c.k] || "";
    c.stand = typeof x.stand === "boolean" ? x.stand : PRE_STAND.has(c.k);
    c.show = SHOW.includes(x.show) ? x.show : showOf(c.k);
    if (typeof x.tpl === "string" && TPL_RE.test(x.tpl) && TPL_TYPES.includes(type)) c.tpl = x.tpl;
    return c;
  }
  function normOrder(x) {
    if (!x || typeof x !== "object") return null;
    const kind = KNAME[x.kind] ? x.kind : "etc";
    const o = {
      id: typeof x.id === "string" && ID_RE.test(x.id) ? x.id : rid("o"),
      kind,
      name: str(x.name, 24).trim() || (KNAME[kind] || "예배"),
      example: !!x.example,
      base: !!x.base,
      last: typeof x.last === "string" && /^\d{4}-\d{2}-\d{2}$/.test(x.last) ? x.last : null,
      cards: (Array.isArray(x.cards) ? x.cards : []).slice(0, 60).map(normCard).filter(Boolean)
    };
    if (kind === "sun") o.part = Math.max(1, Math.min(9, Math.round(+x.part) || 1));
    if (kind === "etc") o.kindName = str(x.kindName, 16).trim() || "기타";
    if (x.use && typeof x.use === "object") o.use = { jubo: x.use.jubo !== false, yt: x.use.yt === true };
    return o;
  }
  const C = (k, o) => newCard(k, o);
  const EX = {
    sun1: () => [C("pre"), C("prep"), C("hymn"), C("resp"), C("creed"), C("prayer"), C("read"), C("choir"), C("sermon"), C("praise"), C("offer"), C("notice"), C("bless")],
    sun2: () => [C("pre"), C("prep"), C("call"), C("hymn"), C("resp"), C("creed"), C("prayer"), C("read"), C("choir"), C("sermon"), C("praise"), C("offer"), C("notice"), C("bless")],
    wed: () => [C("pre"), C("praise", { name: "여는 찬양" }), C("hymn"), C("prayer"), C("read"), C("sermon"), C("notice"), C("bless")],
    fri: () => [C("pre"), C("praise", { name: "여는 찬양" }), C("prayer"), C("read"), C("sermon"), C("praise", { name: "기도회 찬양" }), C("bless")],
    dawn: () => [C("pre"), C("hymn"), C("read"), C("sermon"), C("bless")],
    rally: () => [C("pre"), C("praise", { name: "여는 찬양" }), C("praise", { name: "경배와 찬양" }), C("read"), C("sermon"), C("praise", { name: "결단 찬양" }), C("post")]
  };
  const EXAMPLES = [
    ["sun1", "sun", 1, "주일예배 1부"],
    ["sun2", "sun", 2, "주일예배 2부"],
    ["wed", "wed", 0, "수요예배"],
    ["fri", "fri", 0, "금요철야"],
    ["dawn", "dawn", 0, "새벽예배"],
    ["rally", "rally", 0, "찬양집회"]
  ];
  function example(key) {
    const e = EXAMPLES.find((x) => x[0] === key) || EXAMPLES[0];
    const o = { id: "x-" + e[0], kind: e[1], name: e[3], example: true, base: e[0] === "sun1", last: null, cards: EX[e[0]]() };
    if (e[1] === "sun") o.part = e[2];
    return o;
  }
  const examples = () => EXAMPLES.map((e) => example(e[0]));
  const ls = {
    get(k) {
      try {
        return localStorage.getItem(k);
      } catch (e) {
        return null;
      }
    },
    set(k, v) {
      try {
        localStorage.setItem(k, v);
        return true;
      } catch (e) {
        return false;
      }
    },
    del(k) {
      try {
        localStorage.removeItem(k);
      } catch (e) {
      }
    }
  };
  function loadOrders(kp) {
    try {
      const j = JSON.parse(ls.get(kp + "orders"));
      if (j && Array.isArray(j.list)) return j.list.map(normOrder).filter(Boolean);
    } catch (e) {
    }
    return null;
  }
  function saveOrders(kp, list) {
    return ls.set(kp + "orders", JSON.stringify({ v: 1, list: list.map(normOrder).filter(Boolean) }));
  }
  function ordersOrSeed(kp) {
    let l = loadOrders(kp);
    if (!l) {
      l = examples();
      saveOrders(kp, l);
    }
    return l;
  }
  function markUsed(kp, oid, date) {
    const l = loadOrders(kp);
    if (!l) return;
    const o = l.find((x) => x.id === oid);
    if (!o || !/^\d{4}-\d{2}-\d{2}$/.test(date || "")) return;
    if (!o.last || o.last < date) {
      o.last = date;
      saveOrders(kp, l);
    }
  }
  const freeUsed = (kp) => !!ls.get(kp + "wo-free");
  const mineOf = (l) => (l || []).filter((o) => o && !o.example);
  const freePick = (kp) => ls.get(kp + "orders-pick") || "";
  const freePickSet = (kp, oid) => ls.set(kp + "orders-pick", String(oid || ""));
  function freeCanSave(kp, oid) {
    const mine = mineOf(loadOrders(kp));
    if (!mine.some((o) => o.id !== oid)) return true;
    const pk = freePick(kp);
    return !!pk && pk === oid && mine.some((o) => o.id === oid);
  }
  const freeMark = (kp) => ls.set(kp + "wo-free", (/* @__PURE__ */ new Date()).toISOString());
  function pendingSet(kp, recipe2) {
    return ls.set(kp + "wo-pending", JSON.stringify({ at: Date.now(), recipe: recipe2 }));
  }
  function pendingTake(kp) {
    let j = null;
    try {
      j = JSON.parse(ls.get(kp + "wo-pending"));
    } catch (e) {
      j = null;
    }
    ls.del(kp + "wo-pending");
    if (!j || !j.recipe || !(Date.now() - (+j.at || 0) < 30 * 6e4)) return null;
    return normRecipe(j.recipe);
  }
  const DOW = ["주일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"];
  const pad = (n) => String(n).padStart(2, "0");
  const toISO = (d) => d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
  function parseISO(v) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v || "");
    if (!m) return null;
    const d = new Date(+m[1], +m[2] - 1, +m[3]);
    return isNaN(d) || d.getMonth() !== +m[2] - 1 ? null : d;
  }
  function dateLabel(v) {
    const d = parseISO(v);
    return d ? d.getMonth() + 1 + "월 " + d.getDate() + "일 " + DOW[d.getDay()] : "";
  }
  function defaultDate(kind, now) {
    const d = now ? new Date(now) : /* @__PURE__ */ new Date();
    d.setHours(12, 0, 0, 0);
    const want = { sun: 0, wed: 3, fri: 5 }[kind];
    if (want != null) d.setDate(d.getDate() + (want - d.getDay() + 7) % 7);
    else if (kind === "dawn") d.setDate(d.getDate() + 1);
    return toISO(d);
  }
  const kindLabel = (o) => o.kind === "sun" ? "주일예배 · " + (o.part || 1) + "부" : o.kind === "etc" ? o.kindName || "기타" : KNAME[o.kind];
  const weeklyCount = (o) => (o && o.cards ? o.cards : []).reduce((n, c) => n + (c.mode === "weekly" ? c.fields.length : 0), 0);
  const recipeTitle = (r) => (r.name || "예배") + (dateLabel(r.date) ? " · " + dateLabel(r.date) : "");
  const mdLabel = (v) => {
    const d = parseISO(v);
    return d ? d.getMonth() + 1 + "월 " + d.getDate() + "일" : "";
  };
  function nextDate(kind, iso) {
    const d = parseISO(iso);
    if (!d) return defaultDate(kind);
    d.setHours(12, 0, 0, 0);
    const want = { sun: 0, wed: 3, fri: 5 }[kind];
    if (want != null) d.setDate(d.getDate() + ((want - d.getDay() + 7) % 7 || 7));
    else d.setDate(d.getDate() + (kind === "dawn" ? 1 : 7));
    return toISO(d);
  }
  function metaWo(wo) {
    if (!wo || typeof wo !== "object") return null;
    const m = { name: str(wo.name, 40), date: str(wo.date, 10) };
    if (typeof wo.oid === "string" && ID_RE.test(wo.oid)) m.oid = wo.oid;
    if (KNAME[wo.kind]) m.kind = wo.kind;
    return m;
  }
  const jparse = (k) => {
    try {
      return JSON.parse(ls.get(k));
    } catch (e) {
      return null;
    }
  };
  function contiIndex(kp) {
    const out = [], metas = jparse(kp + "docs"), cur = jparse(kp + "cur");
    const curId = cur && typeof cur.id === "string" && cur.scope !== "church" ? cur.id : "";
    (Array.isArray(metas) ? metas : []).slice(0, 200).forEach((m) => {
      if (!m || typeof m.id !== "string" || !m.wo || typeof m.wo !== "object" || !parseISO(m.wo.date)) return;
      let oid = typeof m.wo.oid === "string" ? m.wo.oid : "", kind = KNAME[m.wo.kind] ? m.wo.kind : "";
      if (!oid) {
        const d = jparse(kp + "docs:" + m.id), w2 = d && d.state && d.state.wo;
        if (w2 && typeof w2.oid === "string") {
          oid = w2.oid;
          if (KNAME[w2.kind]) kind = w2.kind;
        }
      }
      out.push({ id: m.id, meta: m, title: str(m.title, 120), savedAt: str(m.savedAt, 40), name: str(m.wo.name, 40), date: m.wo.date, oid, kind, cur: m.id === curId, now: false });
    });
    const v2 = jparse(kp + "v2"), w = v2 && v2.wo;
    if (w && typeof w === "object" && parseISO(w.date)) {
      const oid = typeof w.oid === "string" ? w.oid : "", c = out.find((x) => x.cur);
      if (!c || c.date !== w.date || c.oid !== oid) out.push({ id: "", meta: null, title: recipeTitle({ name: str(w.name, 40), date: w.date }), savedAt: "", name: str(w.name, 40), date: w.date, oid, kind: KNAME[w.kind] ? w.kind : "", cur: false, now: true });
    }
    return out;
  }
  const partOf = (name) => {
    const m = /(\d)\s*부/.exec(String(name || ""));
    return m ? +m[1] : 0;
  };
  const nameFor = (o, part) => o.kind === "sun" && part && part !== (o.part || 1) ? "주일예배 " + part + "부" : o.name;
  function ofOrder(e, o, part) {
    if (e.oid) {
      if (e.oid !== o.id) return false;
      if (e.kind && o.kind && e.kind !== o.kind) return false;
    } else if (e.name !== nameFor(o, part)) return false;
    if (o.kind === "sun") {
      const p = partOf(e.name), want = part || o.part || 1;
      if (p && p !== want) return false;
    }
    return true;
  }
  function orderById(kp, oid) {
    if (!oid) return null;
    const o = (loadOrders(kp) || []).find((x) => x.id === oid);
    if (o) return o;
    const e = EXAMPLES.find((x) => "x-" + x[0] === oid);
    return e ? example(e[0]) : null;
  }
  const bool = (v) => v ? 1 : 0;
  function existingIn(idx, o, date, opt) {
    opt = opt || {};
    const hit = idx.filter((e) => e.date === date && (opt.now || !e.now) && (o ? ofOrder(e, o, opt.part) : e.oid === opt.oid));
    hit.sort((a, b) => bool(b.cur) - bool(a.cur) || bool(b.now) - bool(a.now) || String(b.savedAt).localeCompare(String(a.savedAt)));
    return hit[0] || null;
  }
  const entryOut = (e) => e.now ? { id: "", now: true, title: e.title, wo: Object.assign({ name: e.name, date: e.date }, e.oid ? { oid: e.oid } : {}) } : Object.assign({}, e.meta, { wo: Object.assign({}, e.meta.wo, e.oid ? { oid: e.oid } : {}), cur: e.cur });
  function existing(kp, oid, date, opt) {
    if (typeof kp !== "string" || !oid || !parseISO(date)) return null;
    const e = existingIn(contiIndex(kp), orderById(kp, oid), date, Object.assign({}, opt, { oid }));
    return e ? entryOut(e) : null;
  }
  function nextIn(idx, o, part) {
    const d0 = defaultDate(o.kind), last = idx.filter((e) => ofOrder(e, o, part)).reduce((m, e) => e.date > m ? e.date : m, "");
    return last && last >= d0 ? { date: nextDate(o.kind, last), last } : { date: d0, last: "" };
  }
  function nextFor(kp, oid, opt) {
    if (typeof kp !== "string") return defaultDate("sun");
    const idx = contiIndex(kp), o = orderById(kp, oid) || { id: String(oid || ""), kind: (idx.find((e) => e.oid === oid) || {}).kind || "sun", name: "" };
    return nextIn(idx, o, opt && opt.part).date;
  }
  function recipe(o, opt) {
    opt = opt || {};
    const vals = opt.vals || {};
    const slots = (o.cards || []).map((c) => {
      const v = {};
      (c.mode === "weekly" ? c.fields : []).forEach((f) => {
        const x = vals[c.id] && vals[c.id][f];
        if (typeof x === "string" && x.trim()) v[f] = x.trim().slice(0, 200);
      });
      const sl = {
        sid: rid("s"),
        cid: c.id,
        k: c.k,
        name: c.name,
        type: c.type,
        mode: c.mode,
        fields: c.fields.slice(),
        flab: Object.assign({}, c.flab),
        text: c.text,
        paste: c.paste,
        auto: c.auto,
        vals: v,
        en: c.en,
        who: c.who,
        stand: c.stand,
        show: c.show
      };
      if (c.tpl) sl.tpl = c.tpl;
      return sl;
    });
    return { v: 1, oid: o.id, oname: o.name, ex: !!o.example, kind: o.kind, name: str(opt.name, 40).trim() || o.name, date: parseISO(opt.date) ? opt.date : defaultDate(o.kind), slots };
  }
  function normSlot(x) {
    const c = normCard(x);
    if (!c) return null;
    const vals = {};
    if (x.vals && typeof x.vals === "object") Object.keys(x.vals).forEach((f) => {
      if (f === "_text" ? typeof x.vals[f] === "string" : c.fields.includes(f) && typeof x.vals[f] === "string") {
        const v = x.vals[f].slice(0, f === "_text" ? 4e3 : 200);
        if (v.trim()) vals[f] = v;
      }
    });
    const s = Object.assign(c, { sid: typeof x.sid === "string" && ID_RE.test(x.sid) ? x.sid : rid("s"), cid: typeof x.cid === "string" && ID_RE.test(x.cid) ? x.cid : "", vals });
    if (x.re === true) s.re = true;
    return s;
  }
  function normRecipe(r) {
    if (!r || typeof r !== "object" || !Array.isArray(r.slots)) return null;
    const out = {
      v: 1,
      oid: typeof r.oid === "string" && ID_RE.test(r.oid) ? r.oid : "",
      oname: str(r.oname, 24),
      ex: !!r.ex,
      kind: KNAME[r.kind] ? r.kind : "etc",
      name: str(r.name, 40).trim() || "예배",
      date: parseISO(r.date) ? r.date : defaultDate(r.kind),
      slots: r.slots.slice(0, 60).map(normSlot).filter(Boolean)
    };
    const jb = normJubo(r.jubo);
    if (jb) out.jubo = jb;
    if (Number.isFinite(+r.empty)) out.empty = Math.max(0, Math.floor(+r.empty));
    return out;
  }
  const jstr = (v, n) => typeof v === "string" ? v.slice(0, n) : "";
  function normJubo(x) {
    if (!x || typeof x !== "object" || Array.isArray(x)) return null;
    const lw = (o) => o.lw === true ? { lw: true } : {};
    const arr = (a, n, f) => (Array.isArray(a) ? a : []).slice(0, n).map((o) => o && typeof o === "object" ? f(o) : null).filter(Boolean);
    const j = { v: 1, at: Number.isFinite(+x.at) && +x.at > 0 ? Math.floor(+x.at) : 0 };
    if (typeof x.sid === "string" && ID_RE.test(x.sid)) j.sid = x.sid;
    j.vol = jstr(x.vol, 30).trim();
    j.day = jstr(x.day, 40).trim();
    j.news = arr(x.news, 40, (n) => Object.assign({ h: jstr(n.h, 60), b: jstr(n.b, 400) }, lw(n)));
    j.serve = arr(x.serve, 30, (r) => ({ r: jstr(r.r, 20), a: jstr(r.a, 60), b: jstr(r.b, 60) }));
    j.pray = arr(x.pray, 40, (p) => Object.assign({ t: jstr(p.t, 200) }, lw(p)));
    j.offer = arr(x.offer, 30, (r) => ({ h: jstr(r.h, 20), b: jstr(r.b, 600) }));
    j.free = {};
    if (x.free && typeof x.free === "object") Object.keys(x.free).slice(0, 12).forEach((k) => {
      const f = x.free[k];
      if (ID_RE.test(k) && f && typeof f === "object") j.free[k] = Object.assign({ t: jstr(f.t, 4e3) }, lw(f));
    });
    if (parseISO(x.from)) j.from = x.from;
    if (x.lk && typeof x.lk === "object" && !Array.isArray(x.lk)) {
      const lk = {};
      Object.keys(x.lk).slice(0, 24).forEach((k) => {
        if (/^(?:news|p:[\w-]{1,40})$/.test(k) && typeof x.lk[k] === "string") lk[k] = x.lk[k].slice(0, 80);
      });
      if (Object.keys(lk).length) j.lk = lk;
    }
    return j;
  }
  const juboLw = (j) => !j ? 0 : j.news.filter((n) => n.lw).length + j.pray.filter((p) => p.lw).length + Object.values(j.free).filter((f) => f.lw).length;
  const volNext = (v) => String(v || "").replace(/(\d+)(\D*)$/, (m, n, s) => String(+n + 1).padStart(n.length, "0") + s);
  function slotPlain(sl, wo, jubo) {
    if (!sl || sl.type === "praise" || sl.type === "bible") return null;
    if (jubo && sl.type === "notice") {
      const ns = linkNewsSlot(wo), t = newsTexts(jubo);
      if (ns && ns.sid === sl.sid && t.length) return [{ title: "", text: t.join("\n\n") }];
    }
    const vals = sl.vals || {}, v = (f) => String(vals[f] || "").trim(), own = (sl.fields || []).filter(isCustom).map(v).filter(Boolean), text = String(sl.text || "");
    const one = (title, t) => [{ title: title || "", text: t || "" }];
    if (sl.type === "cover") {
      const dl = dateLabel(wo && wo.date), nm = wo && wo.name || "";
      if (sl.auto) return one("", text.trim() ? text.trim() + "\n" + nm : nm + (dl ? "\n" + dl : ""));
      return one("", sl.mode === "weekly" ? sl.fields.map(v).filter(Boolean).join("\n") : text || sl.name);
    }
    if (sl.type === "sermon") return one("", sl.mode === "weekly" ? [v("stitle"), v("preacher")].concat(own).filter(Boolean).join("\n") : text);
    if (sl.type === "notice") return one("", sl.mode === "weekly" ? [v("notice"), v("words")].concat(own).filter(Boolean).join("\n") : text || sl.name);
    if (sl.mode === "weekly") {
      const r = v("resp");
      if (sl.paste) return one(r ? sl.name + " " + r.replace(/번$/, "") + "번" : "", v("_text"));
      const w = v("words"), parts = [v("prayer"), v("hymn"), v("song"), v("songs"), v("passage"), v("stitle"), v("preacher"), v("notice")].concat(own).filter(Boolean);
      if (w) return one("", [w].concat(parts).join("\n"));
      return one("", parts.length ? [sl.name].concat(parts).join("\n") : "");
    }
    if (text.trim()) return one("", text);
    return one("", sl.paste ? "" : sl.name);
  }
  const splitPlain = (t) => String(t || "").replace(/\r\n?/g, "\n").split(/\n[ \t]*\n+/).map((x) => x.split("\n").map((l) => l.replace(/\s+$/, "")).filter((l) => l.trim()).join("\n")).filter(Boolean).slice(0, 200);
  function juboStylesRaw(kp) {
    try {
      const j = JSON.parse(ls.get(kp + "jubo-style"));
      return j && Array.isArray(j.list) ? j.list.filter((s) => s && typeof s === "object" && typeof s.id === "string" && Array.isArray(s.zones)) : [];
    } catch (e) {
      return [];
    }
  }
  function juboStylePick(list, oid, sid) {
    if (!list || !list.length) return null;
    return sid && list.find((s) => s.id === sid) || oid && list.find((s) => s.zones.some((z) => z && z.t === "order" && z.o && z.o.oid === oid)) || list.find((s) => s.base) || list[0];
  }
  function juboLast(kp, oid, date) {
    if (!oid) return null;
    const out = [], take = (st, at) => {
      if (st && st.wo && st.wo.oid === oid && st.jubo && typeof st.wo.date === "string" && (!date || st.wo.date < date)) out.push({ date: st.wo.date, at, jubo: normJubo(st.jubo) });
    };
    let metas = [];
    try {
      metas = JSON.parse(ls.get(kp + "docs")) || [];
    } catch (e) {
      metas = [];
    }
    (Array.isArray(metas) ? metas : []).slice(0, 80).forEach((m) => {
      if (!m || typeof m.id !== "string") return;
      let d = null;
      try {
        d = JSON.parse(ls.get(kp + "docs:" + m.id));
      } catch (e) {
        d = null;
      }
      if (d && d.state) take(d.state, Date.parse(d.savedAt) || 0);
    });
    let v2 = null;
    try {
      v2 = JSON.parse(ls.get(kp + "v2"));
    } catch (e) {
      v2 = null;
    }
    take(v2, Date.now());
    out.sort((a, b) => a.date < b.date ? 1 : a.date > b.date ? -1 : b.at - a.at);
    return out[0] && out[0].jubo ? out[0] : null;
  }
  function juboFromLast(last, zones) {
    const L = last && last.jubo;
    if (!L) return null;
    const j = {
      v: 1,
      at: 0,
      vol: volNext(L.vol),
      day: "",
      news: L.news.filter((n) => (n.h + n.b).trim()).map((n) => ({ h: n.h, b: n.b, lw: true })),
      serve: L.serve.map((r) => ({ r: r.r, a: r.b, b: "" })),
      pray: L.pray.filter((p) => p.t.trim()).map((p) => ({ t: p.t, lw: true })),
      offer: [],
      free: {},
      from: last.date
    };
    (zones || []).forEach((z) => {
      if (z && z.t === "free" && z.o && z.o.weekly && L.free[z.id] && L.free[z.id].t.trim()) j.free[z.id] = { t: L.free[z.id].t, lw: true };
    });
    return j;
  }
  const LINK_ROLES = {
    pray: ["대표기도", "기도", "대표기도자", "기도자", "회중기도"],
    offerPray: ["헌금기도", "봉헌기도", "헌금기도자", "봉헌기도자"],
    preach: ["설교", "설교자", "말씀", "말씀선포", "설교말씀"]
  };
  const lkWeekly = (s, f) => !!s && s.mode === "weekly" && Array.isArray(s.fields) && s.fields.includes(f);
  const lkOffer = (s) => s.k === "offer" || /헌금|봉헌/.test(enKey(s.name));
  const LINKS = [
    { id: "news", on: true, kind: "news", ko: "교회 소식", isSlot: (s) => !!s && s.type === "notice" && s.show !== "jubo" },
    { id: "offerPray", on: true, kind: "serve", field: "prayer", isSlot: (s) => lkWeekly(s, "prayer") && lkOffer(s), base: (s) => s.k === "offer" },
    { id: "pray", on: true, kind: "serve", field: "prayer", isSlot: (s) => lkWeekly(s, "prayer") && !lkOffer(s) && (s.k === "prayer" || /기도/.test(enKey(s.name))), base: (s) => s.k === "prayer" },
    { id: "preach", on: true, kind: "serve", field: "preacher", isSlot: (s) => lkWeekly(s, "preacher"), base: (s) => s.type === "sermon" }
  ];
  const LINK_BY = Object.fromEntries(LINKS.map((L) => [L.id, L]));
  function linkOn(state, id) {
    const L = LINK_BY[id];
    return !!(L && L.on);
  }
  const roleKey = (s) => enKey(s);
  function linkNewsSlot(wo) {
    const L = LINK_BY.news;
    return L.on && wo && Array.isArray(wo.slots) ? wo.slots.find(L.isSlot) || null : null;
  }
  function linkPairs(slots, serve) {
    const out = [], usedR = /* @__PURE__ */ new Set(), usedS = /* @__PURE__ */ new Set(), rk = (Array.isArray(serve) ? serve : []).map((r) => roleKey(r && r.r));
    LINKS.filter((L) => L.on && L.kind === "serve").forEach((L) => {
      const cs = (Array.isArray(slots) ? slots : []).filter((s) => s && !usedS.has(s) && L.isSlot(s)), grp = LINK_ROLES[L.id];
      cs.forEach((s) => {
        const nk = roleKey(s.name), free = (i) => i >= 0 && !usedR.has(i);
        let idx = rk.map((k, i) => k && k === nk ? i : -1).filter(free);
        if (!idx.length && cs.length === 1 && (grp.includes(nk) || L.base(s))) idx = rk.map((k, i) => grp.includes(k) ? i : -1).filter(free);
        if (idx.length !== 1) return;
        usedR.add(idx[0]);
        usedS.add(s);
        out.push({ id: L.id, key: "p:" + (s.sid || s.id || L.id), field: L.field, slot: s, ri: idx[0] });
      });
    });
    return out;
  }
  const lkNorm = (t) => String(t || "").replace(/\r\n?/g, "\n").split("\n").map((l) => l.replace(/\s+$/, "")).filter((l) => l.trim()).join("\n");
  function newsText(n) {
    return n ? lkNorm((n.h || "") + "\n" + (n.b || "")) : "";
  }
  function newsTexts(j) {
    return (j && Array.isArray(j.news) ? j.news : []).map(newsText).filter(Boolean);
  }
  function newsFrom(texts, old) {
    const pool = (old || []).slice();
    const hit = texts.map((t) => {
      const i = pool.findIndex((n) => newsText(n) === t);
      return i >= 0 ? pool.splice(i, 1)[0] : null;
    });
    return hit.map((n, i) => {
      if (n) return n;
      const t = texts[i], tp = pool.shift(), ls2 = t.split("\n");
      if (tp && !String(tp.h || "").trim() || ls2[0].length > 60) return { h: "", b: t.slice(0, 400) };
      return { h: ls2[0], b: ls2.slice(1).join("\n").slice(0, 400) };
    });
  }
  function lkHash(a) {
    const s = JSON.stringify(a);
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619) >>> 0;
    }
    return ("0000000" + h.toString(16)).slice(-8);
  }
  const lkSame = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);
  const slotSongsOf = (st, sl) => sl.out ? Array.isArray(sl.hold) ? sl.hold : [] : (Array.isArray(st.songs) ? st.songs : []).filter((x) => x && x.slot === sl.sid);
  const slotTexts = (st, sl) => slotSongsOf(st, sl).flatMap((so) => (Array.isArray(so.slides) ? so.slides : []).map((x) => lkNorm(x && x.text))).filter(Boolean);
  function slotParts(sl, wo, jubo) {
    const p = slotPlain(sl, wo, jubo);
    return p ? p.map((x) => ({ title: x.title || "", texts: splitPlain(x.text) })) : null;
  }
  function slotPut(st, sl, parts, uid) {
    uid = typeof uid === "function" ? uid : () => rid("");
    const old = slotSongsOf(st, sl), oldS = old.flatMap((so) => Array.isArray(so.slides) ? so.slides : []), used = /* @__PURE__ */ new Set();
    let off = 0;
    const songs = (parts || []).map((p, pi) => {
      const slides = p.texts.map((t) => {
        const o = oldS.find((x) => !used.has(x) && lkNorm(x.text) === t);
        if (o) used.add(o);
        return o || null;
      });
      slides.forEach((s, i) => {
        if (s) return;
        const o = oldS[off + i];
        if (o && !used.has(o)) {
          used.add(o);
          const n = Object.assign({}, o, { text: p.texts[i], label: "" });
          delete n.text2;
          slides[i] = n;
        } else slides[i] = { id: uid(), text: p.texts[i], label: "" };
      });
      off += p.texts.length;
      const b = old[pi] || { id: uid(), title: "", ccli: "", draft: "" };
      return Object.assign({}, b, { title: p.title || "", draft: "", slides, slot: sl.sid });
    });
    if (sl.out) {
      sl.hold = songs;
      return;
    }
    if (!Array.isArray(st.songs)) st.songs = [];
    const order = st.wo.slots.map((x) => x.sid), me = order.indexOf(sl.sid), rank = (x) => x && x.slot ? order.indexOf(x.slot) : -1;
    const i0 = st.songs.findIndex((x) => x && x.slot === sl.sid);
    st.songs = st.songs.filter((x) => !(x && x.slot === sl.sid));
    let at = i0 >= 0 ? Math.min(i0, st.songs.length) : st.songs.findIndex((x) => rank(x) > me);
    if (at < 0) {
      let last = -1;
      st.songs.forEach((x, i) => {
        const k = rank(x);
        if (k >= 0 && k < me) last = i;
      });
      at = last >= 0 ? last + 1 : st.songs.length;
    }
    st.songs.splice(at, 0, ...songs);
  }
  function slotParse(st, sl) {
    if (!sl || sl.mode !== "weekly" || sl.out || sl.show === "jubo" || slotSongsOf(st, sl).length !== 1) return false;
    const sT = slotTexts(st, sl), want = (slotParts(sl, st.wo, null) || []).flatMap((p) => p.texts);
    if (sT.length !== 1 || lkSame(sT, want)) return false;
    const v = (f) => String((sl.vals || {})[f] || "").trim(), lines = sT[0].split("\n").map((x) => x.trim());
    if (sl.fields.some((f) => !["prayer", "stitle", "preacher"].includes(f) && v(f))) return false;
    const set = (f, x) => {
      sl.vals = Object.assign({}, sl.vals);
      if (x) sl.vals[f] = x.slice(0, 200);
      else delete sl.vals[f];
      return true;
    };
    if (sl.type === "text" && sl.fields.includes("prayer")) {
      if (lines.length >= 2 && roleKey(lines[0]) === roleKey(sl.name)) {
        const x = lines.slice(1).join(" ").trim();
        if (x !== v("prayer")) return set("prayer", x);
      }
      return false;
    }
    if (sl.type === "sermon" && sl.fields.includes("preacher")) {
      const t = v("stitle"), pr = v("preacher"), hasT = sl.fields.includes("stitle");
      if (lines.length === 2) {
        if (lines[0] === t && lines[1] !== pr) return set("preacher", lines[1]);
        if (hasT && lines[1] === pr && lines[0] !== t) return set("stitle", lines[0]);
      } else if (lines.length === 1 && hasT && !pr && lines[0] !== t) return set("stitle", lines[0]);
    }
    return false;
  }
  function linkSync(st, opt) {
    opt = opt || {};
    const res = { jubo: false, slots: [], vals: false };
    if (!st || !st.wo || !Array.isArray(st.wo.slots) || !st.jubo || typeof st.jubo !== "object") return res;
    const J = st.jubo, prefer = opt.prefer === "jubo" ? "jubo" : "conti", canC = opt.conti !== false, now = Date.now();
    if (!Array.isArray(st.songs)) st.songs = [];
    if (!Array.isArray(J.news)) J.news = [];
    if (!Array.isArray(J.serve)) J.serve = [];
    const lk = J.lk && typeof J.lk === "object" ? J.lk : {};
    const dirOf = (c, j, L, cEmpty) => L == null ? cEmpty ? "jubo" : "conti" : c !== L && j === L ? "conti" : j !== L && c === L ? "jubo" : prefer;
    const ns = linkOn(st, "news") ? linkNewsSlot(st.wo) : null;
    if (ns && slotSongsOf(st, ns).length) {
      const jT = newsTexts(J), sT = slotTexts(st, ns), fT = (slotParts(ns, st.wo, null) || []).flatMap((p) => p.texts);
      const cT = lkSame(sT, jT) ? jT : lkSame(sT, fT) ? [] : sT;
      const hc = lkHash(cT), hj = lkHash(jT);
      if (hc === hj) lk.news = hj;
      else {
        const d = dirOf(hc, hj, lk.news, !cT.length);
        if (d === "conti") {
          J.news = newsFrom(cT, J.news);
          lk.news = hc;
          J.at = now;
          res.jubo = true;
        } else if (canC) {
          slotPut(st, ns, [{ title: "", texts: jT.length ? jT : fT }], opt.uid);
          lk.news = hj;
          res.slots.push(ns.name);
        }
      }
    }
    linkPairs(st.wo.slots, J.serve).forEach((p) => {
      if (!linkOn(st, p.id)) return;
      const sl = p.slot, row = J.serve[p.ri], f = p.field;
      if (opt.parse && slotParse(st, sl)) res.vals = true;
      const c = String((sl.vals || {})[f] || "").trim(), j = String(row.a || "").trim();
      if (c === j) {
        lk[p.key] = c;
        return;
      }
      const d = dirOf(c, j, lk[p.key], !c);
      if (d === "conti") {
        row.a = c;
        lk[p.key] = c;
        J.at = now;
        res.jubo = true;
      } else if (canC) {
        sl.vals = Object.assign({}, sl.vals);
        if (j) sl.vals[f] = j.slice(0, 200);
        else delete sl.vals[f];
        lk[p.key] = j;
        res.vals = true;
        if (sl.show !== "jubo") {
          const parts = slotParts(sl, st.wo, J);
          if (parts) {
            slotPut(st, sl, parts, opt.uid);
            res.slots.push(sl.name);
          }
        }
      }
    });
    if (Object.keys(lk).length) J.lk = lk;
    return res;
  }
  const circ = (x, y, r) => "M" + (x - r) + " " + y + "a" + r + " " + r + " 0 1 0 " + 2 * r + " 0a" + r + " " + r + " 0 1 0 " + -2 * r + " 0";
  const ICONS = {
    note: ["M9 18V5l12-2v13", circ(6, 18, 3), circ(18, 16, 3)],
    book: ["M12 7v14", "M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"],
    mic: ["M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z", "M19 10v2a7 7 0 0 1-14 0v-2", "M12 19v3"],
    mega: ["m3 11 18-5v12L3 14v-3z", "M11.6 16.8a3 3 0 1 1-5.8-1.6"],
    image: ["M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z", circ(9, 9, 2), "m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"],
    type: ["M4 7V4h16v3", "M9 20h6", "M12 4v16"],
    calendar: ["M8 2v4", "M16 2v4", "M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z", "M3 10h18"],
    plus: ["M5 12h14", "M12 5v14"],
    check: ["M20 6 9 17l-5-5"],
    lock: ["M5 11h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2z", "M7 11V7a5 5 0 0 1 10 0v4"],
    info: [circ(12, 12, 10), "M12 16v-4", "M12 8h.01"],
    braces: ["M8 3H7a2 2 0 0 0-2 2v5a2 2 0 0 1-2 2 2 2 0 0 1 2 2v5c0 1.1.9 2 2 2h1", "M16 21h1a2 2 0 0 0 2-2v-5c0-1.1.9-2 2-2a2 2 0 0 1-2-2V5a2 2 0 0 0-2-2h-1"],
    x: ["M18 6 6 18", "m6 6 12 12"],
    file: ["M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z", "M14 2v4a2 2 0 0 0 2 2h4", "M16 13H8", "M16 17H8"],
    pencil: ["M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z", "m15 5 4 4"],
    minus: ["M5 12h14"],
    order: ["M10 12h11", "M10 18h11", "M10 6h11", "M4 10h2", "M4 6h1v4", "M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"],
    grip: [circ(9, 12, 1), circ(9, 5, 1), circ(9, 19, 1), circ(15, 12, 1), circ(15, 5, 1), circ(15, 19, 1)],
    up: ["m5 12 7-7 7 7", "M12 19V5"],
    down: ["M12 5v14", "m19 12-7 7-7-7"],
    trash: ["M3 6h18", "M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6", "M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"],
    copy: ["M10 8h10a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2V10a2 2 0 0 1 2-2z", "M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"],
    dots: [circ(12, 12, 1), circ(19, 12, 1), circ(5, 12, 1)],
    save: ["M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z", "M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7", "M7 3v4a1 1 0 0 0 1 1h7"],
    left: ["m15 18-6-6 6-6"],
    users: ["M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2", circ(9, 7, 4), "M22 21v-2a4 4 0 0 0-3-3.87", "M16 3.13a4 4 0 0 1 0 7.75"],
    refresh: ["M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8", "M21 3v5h-5", "M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16", "M8 16H3v5"]
  };
  const NS = "http://www.w3.org/2000/svg";
  function icon(name, cls) {
    const s = document.createElementNS(NS, "svg");
    s.setAttribute("viewBox", "0 0 24 24");
    s.setAttribute("aria-hidden", "true");
    s.setAttribute("focusable", "false");
    s.setAttribute("class", "wo-ic" + (cls ? " " + cls : ""));
    (ICONS[name] || ICONS.type).forEach((d) => {
      const p = document.createElementNS(NS, "path");
      p.setAttribute("d", d);
      s.appendChild(p);
    });
    return s;
  }
  const typeIcon = (t, cls) => icon((TYPES[t] || TYPES.text).ic, cls);
  const CSS = `
:where(.wo-ov,.wo-scope){--wo-bg:#151b23;--wo-bg2:#0d1117;--wo-line:#2a333f;--wo-line2:#3d4958;--wo-text:#e8edf3;--wo-muted:#93a1b3;--wo-dim:#6b7887;--wo-accent:#6ea8ff;--wo-accent-hi:#8fbcff;--wo-tint:#6ea8ff1f;--wo-ring:#6ea8ff8c;--wo-ink:#0b1220;--wo-y:#ffe066;--wo-y-bg:#ffe0661f;--wo-y-ink:#ffe9a3;--wo-lk:#1c232d;--wo-scrim:rgba(0,0,0,.6);--wo-shadow:0 30px 80px -20px rgba(0,0,0,.75);--wo-font:system-ui,sans-serif;--wo-z:90}
.wo-ic{width:1em;height:1em;flex:none;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}

.wo-ov.wo-ov{position:fixed;inset:0;z-index:var(--wo-z);display:grid;place-items:center;padding:16px;background:var(--wo-scrim);font-family:var(--wo-font);color:var(--wo-text);-webkit-backdrop-filter:blur(3px);backdrop-filter:blur(3px)}
.wo-ov[hidden],.wo-ov [hidden]{display:none!important}
.wo-ov *,.wo-ov *::before,.wo-ov *::after{box-sizing:border-box}
.wo-box{position:relative;display:flex;flex-direction:column;width:min(780px,100%);max-height:calc(100vh - 32px);max-height:calc(100dvh - 32px);border-radius:18px;background:var(--wo-bg);border:1px solid var(--wo-line2);box-shadow:var(--wo-shadow);overflow:hidden;text-align:left;word-break:keep-all;overflow-wrap:break-word;line-height:1.5}
.wo-hd{display:flex;align-items:flex-start;gap:12px;padding:18px 20px 14px;border-bottom:1px solid var(--wo-line)}
.wo-hd>div{flex:1 1 auto;min-width:0}
.wo-t{margin:0;font-size:20px;font-weight:900;letter-spacing:-.02em;line-height:1.3}
.wo-lead{margin:4px 0 0;font-size:14px;font-weight:600;color:var(--wo-muted)}
.wo-xb{flex:none;width:40px;height:40px;display:grid;place-items:center;border-radius:10px;border:1px solid var(--wo-line);background:none;color:var(--wo-muted);font-size:20px;cursor:pointer}
.wo-xb:hover{color:var(--wo-text);border-color:var(--wo-line2)}
.wo-bd{flex:1 1 auto;overflow:auto;overscroll-behavior:contain;padding:16px 20px 20px;display:grid;gap:14px;align-content:start;min-height:0}
.wo-bd>*{min-width:0}
.wo-ft{display:flex;flex-wrap:wrap;align-items:center;gap:8px;padding:12px 20px 14px;border-top:1px solid var(--wo-line);background:var(--wo-bg)}
.wo-ft .wo-sp{flex:1 1 auto}
.wo-b{display:inline-flex;align-items:center;justify-content:center;gap:7px;min-height:40px;padding:0 14px;border-radius:10px;border:1px solid var(--wo-line2);background:none;color:var(--wo-text);font:700 14px/1.2 var(--wo-font);white-space:nowrap;cursor:pointer}
.wo-b:hover{border-color:var(--wo-accent)}
.wo-b .wo-ic{width:16px;height:16px}
.wo-b.pri{background:var(--wo-accent);border-color:var(--wo-accent);color:var(--wo-ink)}
.wo-b.pri:hover{filter:brightness(1.08)}
.wo-b:disabled{opacity:.45;cursor:not-allowed}
.wo-b.sm{min-height:34px;padding:0 11px;font-size:13px;border-radius:9px}
.wo-ov :focus-visible{outline:2px solid var(--wo-accent-hi);outline-offset:2px}
.wo-sub{margin:0;font-size:14px;font-weight:500;color:var(--wo-muted)}
.wo-guide,.wo-note{display:flex;gap:8px;align-items:flex-start;margin:0;padding:10px 12px;border-radius:10px;background:var(--wo-bg2);border:1px solid var(--wo-line);font-size:13px;font-weight:600;color:var(--wo-muted);line-height:1.45}
.wo-guide .wo-ic,.wo-note .wo-ic{width:15px;height:15px;margin-top:2px;color:var(--wo-accent-hi)}
.wo-guide a,.wo-lnk{color:var(--wo-accent-hi);font-weight:800;text-decoration:underline;text-underline-offset:3px;cursor:pointer;background:none;border:0;padding:0;font:inherit;font-weight:800}
.wo-guide>span{flex:1 1 auto}
.wo-note b{color:var(--wo-text)}
.wo-note.lk{background:var(--wo-lk)}
.wo-step{display:grid;gap:12px;padding:16px;border:1px solid var(--wo-line);border-radius:14px;background:var(--wo-bg);min-width:0}
.wo-sh{display:flex;flex-wrap:wrap;align-items:center;gap:6px 10px}
.wo-sh h3{margin:0;font-size:16px;font-weight:900;letter-spacing:-.01em}
.wo-sh h3 small{font-size:13px;font-weight:700;color:var(--wo-dim)}
.wo-n{width:24px;height:24px;border-radius:50%;background:var(--wo-accent);color:var(--wo-ink);font-size:12.5px;font-weight:900;display:grid;place-items:center;flex:none}
.wo-sh .wo-aside{margin-left:auto;font-size:13px;font-weight:700;color:var(--wo-dim)}
.wo-two{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
.wo-big{display:grid;align-content:start;justify-items:start;gap:8px;min-height:120px;padding:16px;border-radius:14px;border:1px solid var(--wo-line2);background:var(--wo-bg2);color:var(--wo-text);text-align:left;font:inherit;cursor:pointer}
.wo-big:hover,.wo-big[aria-pressed="true"]{border-color:var(--wo-accent);background:var(--wo-tint)}
.wo-big b{font-size:17px;font-weight:900}
.wo-big span{font-size:13.5px;font-weight:600;color:var(--wo-muted)}
.wo-big .wo-pl{width:34px;height:34px;border-radius:10px;display:grid;place-items:center;background:var(--wo-tint);color:var(--wo-accent-hi)}
.wo-big .wo-pl .wo-ic{width:18px;height:18px}
.wo-kinds{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:8px}
.wo-k{position:relative;display:grid;align-content:start;gap:4px;min-height:78px;padding:11px 32px 11px 12px;border-radius:12px;border:1px solid var(--wo-line2);background:var(--wo-bg2);cursor:pointer;min-width:0}
.wo-k:hover{border-color:var(--wo-accent)}
.wo-k input{position:absolute;opacity:0;width:1px;height:1px;margin:0}
.wo-k:has(input:checked){border-color:var(--wo-accent);background:var(--wo-tint);box-shadow:inset 0 0 0 1px var(--wo-accent)}
.wo-k:has(input:focus-visible){outline:2px solid var(--wo-accent-hi);outline-offset:2px}
.wo-k.lkd{opacity:.62;cursor:not-allowed}
.wo-kt{display:flex;align-items:center;gap:7px;min-width:0;font-size:15px;font-weight:800;color:var(--wo-text)}
.wo-kt .wo-ic{width:15px;height:15px;color:var(--wo-accent-hi)}
.wo-kt span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0}
.wo-ks{font-size:12.5px;font-weight:600;color:var(--wo-dim)}
.wo-tag{display:inline-flex;align-items:center;justify-self:start;height:20px;padding:0 7px;border-radius:6px;border:1px solid var(--wo-line2);font-size:11.5px;font-weight:800;color:var(--wo-muted);white-space:nowrap}
.wo-ck{position:absolute;right:9px;top:12px;width:18px;height:18px;border-radius:50%;border:1.5px solid var(--wo-line2);display:grid;place-items:center;color:var(--wo-ink)}
.wo-ck .wo-ic{width:11px;height:11px;stroke-width:3;opacity:0}
.wo-k:has(input:checked) .wo-ck{background:var(--wo-accent);border-color:var(--wo-accent)}
.wo-k:has(input:checked) .wo-ck .wo-ic{opacity:1}
.wo-k.lkd .wo-ck{border:0;color:var(--wo-muted)}
.wo-k.lkd .wo-ck .wo-ic{opacity:1;width:14px;height:14px;stroke-width:2}
.wo-row{display:flex;flex-wrap:wrap;align-items:flex-end;gap:10px 14px}
.wo-f{display:grid;gap:5px;min-width:0}
.wo-f>span{font-size:13px;font-weight:800;color:var(--wo-muted)}
.wo-in{display:block;width:100%;min-width:0;height:42px;padding:0 12px;border-radius:10px;border:1px solid var(--wo-line2);background:var(--wo-bg2);color:var(--wo-text);font:500 15px var(--wo-font);color-scheme:inherit}
.wo-in:focus{outline:2px solid var(--wo-accent-hi);outline-offset:1px}
.wo-in::placeholder{color:var(--wo-dim)}
.wo-f.nm{flex:1 1 220px}
.wo-f.dt{flex:0 1 180px;border-top:0} 
.wo-f.pt{flex:0 0 84px}
.wo-dl{align-self:center;padding-top:22px;font-size:14px;font-weight:800;color:var(--wo-text);white-space:nowrap}
.wo-pv{margin:0;padding:4px;list-style:none;display:grid;gap:2px;border:1px solid var(--wo-line);border-radius:12px;background:var(--wo-bg2)}
.wo-pv li{display:grid;grid-template-columns:22px 24px minmax(0,1fr) auto;align-items:center;gap:8px;min-height:38px;padding:0 8px;border-radius:8px;font-size:14px;font-weight:700}
.wo-pv li+li{border-top:1px solid var(--wo-line)}
.wo-pv li.vs{grid-template-columns:22px 24px minmax(0,1fr) auto auto}
.wo-pv .num{font-size:12.5px;font-weight:800;color:var(--wo-dim);text-align:center;font-variant-numeric:tabular-nums}
.wo-pv .wo-ic{width:15px;height:15px;color:var(--wo-muted);justify-self:center}
.wo-pv .nm{min-width:0;display:flex;flex-wrap:wrap;align-items:baseline;gap:2px 8px}
.wo-pv .nm small{font-size:12px;font-weight:600;color:var(--wo-dim)}
.wo-md{display:inline-flex;align-items:center;height:22px;padding:0 7px;border-radius:6px;border:1px solid var(--wo-line2);font-size:11.5px;font-weight:800;color:var(--wo-muted);white-space:nowrap}
.wo-md.wk{border-color:var(--wo-ring);background:var(--wo-tint);color:var(--wo-accent-hi)}
.wo-prog-t{font-size:13.5px;font-weight:800;color:var(--wo-text);font-variant-numeric:tabular-nums}
.wo-short{margin:0;font-size:13.5px;font-weight:600;color:var(--wo-muted)}
.wo-short b{color:var(--wo-text)}
.wo-cname{min-width:0;font-size:14px;font-weight:700;color:var(--wo-muted)}
.wo-fl{margin:0;padding:0;list-style:none;display:grid;gap:12px}
.wo-fl>li{display:grid;grid-template-columns:22px minmax(0,1fr);gap:0 8px;align-items:start}
.wo-fl .num{padding-top:2px;font-size:12.5px;font-weight:800;color:var(--wo-dim);text-align:center}
.wo-flh{display:flex;align-items:center;gap:7px;font-size:14.5px;font-weight:800;min-width:0}
.wo-flh .wo-ic{width:15px;height:15px;color:var(--wo-muted)}
.wo-ffs{grid-column:2;display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:8px;margin-top:6px;min-width:0}
.wo-ff{display:grid;gap:4px;min-width:0;padding-left:10px;border-left:3px solid var(--wo-y)}
.wo-ff.ok{border-left-color:var(--wo-accent)}
.wo-ff label{display:flex;align-items:center;gap:6px;font-size:12.5px;font-weight:800;color:var(--wo-muted)}
.wo-ff label em{margin-left:auto;font-style:normal;font-size:11.5px;font-weight:800;color:#1a1300;background:var(--wo-y);height:18px;padding:0 6px;border-radius:5px;display:inline-flex;align-items:center}
.wo-ff.ok label em{display:none}
.wo-ff .wo-in{height:38px;font-size:14px}
.wo-fl .wo-note{grid-column:2;margin-top:6px}
.wo-sr{position:absolute!important;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;border:0}
.wo-err{margin:0;font-size:13px;font-weight:700;color:var(--wo-y-ink)}

.wo-vis{display:inline-flex;align-items:center;height:22px;padding:0 7px;border-radius:6px;font-size:11.5px;font-weight:800;white-space:nowrap;border:1px solid var(--wo-line2);color:var(--wo-muted)}
.wo-vis.jubo{border-color:#e0a80080;background:#e0a8001a;color:var(--wo-y-ink)}
.wo-vis.screen{border-color:#3fb98a80;background:#3fb98a1a;color:var(--wo-g-ink,#7fdcb5)}

.wo-has{display:grid;gap:10px;padding:14px;border-radius:12px;border:1px solid var(--wo-ring);background:var(--wo-tint)}
.wo-has p{margin:0;font-size:15px;font-weight:700;color:var(--wo-text)}
.wo-has p b{font-weight:900}
.wo-hasb{display:flex;flex-wrap:wrap;align-items:center;gap:8px}
.wo-nx{flex-wrap:wrap}
.wo-nx>span:not(.wo-sr){flex:1 1 220px}
.wo-dt{min-width:0;border:1px solid var(--wo-line);border-radius:12px;background:var(--wo-bg2)}
.wo-dt>summary{display:flex;flex-wrap:wrap;align-items:center;gap:4px 8px;min-height:44px;padding:9px 34px 9px 12px;position:relative;list-style:none;cursor:pointer;border-radius:12px;font-size:14px;font-weight:700;color:var(--wo-muted)}
.wo-dt>summary::-webkit-details-marker{display:none}
.wo-dt>summary::after{content:"";position:absolute;right:14px;top:50%;width:7px;height:7px;margin-top:-6px;border-right:2px solid var(--wo-dim);border-bottom:2px solid var(--wo-dim);transform:rotate(45deg);transition:transform .15s}
.wo-dt[open]>summary::after{margin-top:-2px;transform:rotate(225deg)}
.wo-dt>summary:hover{background:var(--wo-tint)}
.wo-dt>summary b{color:var(--wo-text);font-weight:800}
.wo-dt>summary small{font-size:12.5px;font-weight:700;color:var(--wo-dim)}
.wo-dt>summary .wo-aside{margin-left:auto;font-size:12.5px;font-weight:700;color:var(--wo-dim)}
.wo-dta{margin-left:auto;font-size:13px;font-weight:800;color:var(--wo-accent-hi)}
.wo-dtb{display:grid;gap:12px;padding:4px 12px 14px;min-width:0}
.wo-dtb>*{min-width:0}
.wo-pvn{min-width:0;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--wo-dim);font-weight:600}
.wo-fine{margin:0;font-size:12.5px;font-weight:600;color:var(--wo-dim)}
.wo-lkn{grid-column:2;margin:6px 0 0;font-size:12.5px;font-weight:600;color:var(--wo-dim)}
@media (max-width:600px){
  .wo-ov.wo-ov{padding:0;place-items:stretch}
  .wo-box{width:100%;max-height:none;height:100vh;height:100dvh;border-radius:0;border:0}
  .wo-hd,.wo-bd,.wo-ft{padding-left:16px;padding-right:16px}
  .wo-two{grid-template-columns:minmax(0,1fr)}
  .wo-big{min-height:0}
  .wo-kinds{grid-template-columns:repeat(2,minmax(0,1fr))}
  .wo-f.dt{flex:1 1 150px}
  .wo-dl{padding-top:0;flex-basis:100%}
  .wo-ft .wo-b{flex:1 1 auto}
  .wo-ft .wo-sp{display:none}
}`;
  function injectCss() {
    if (document.getElementById("wo-css")) return;
    const st = document.createElement("style");
    st.id = "wo-css";
    st.textContent = CSS;
    const h = document.head || document.documentElement;
    h.insertBefore(st, h.firstChild);
  }
  const mk = (tag, cls, text) => {
    const el = document.createElement(tag);
    if (cls) el.className = cls;
    if (text != null) el.textContent = text;
    return el;
  };
  const noTr = (el) => {
    el.setAttribute("translate", "no");
    return el;
  };
  function lastJong(s) {
    const c = String(s).trim().slice(-1), n = c.charCodeAt(0);
    if (n >= 44032 && n <= 55203) return (n - 44032) % 28;
    return { 0: 21, 1: 8, 3: 16, 6: 1, 7: 8, 8: 8 }[c] || 0;
  }
  const eul = (s) => lastJong(s) ? "을" : "를";
  const ro = (s) => {
    const j = lastJong(s);
    return j && j !== 8 ? "으로" : "로";
  };
  const eun = (s) => lastJong(s) ? "은" : "는";
  const hostKp = () => {
    const h = window.ChanyangHost, ns = h && typeof h === "object" && typeof h.ns === "string" ? h.ns.replace(/[^\w-]/g, "").slice(0, 80) : "";
    return "chanyang-jamak:" + (ns ? ns + ":" : "");
  };
  const NC = { el: null, opt: null, orders: [], pool: [], oid: null, part: 1, date: "", dateTouched: false, dateGiven: false, name: "", nameTouched: false, etcName: "", etcSrc: null, vals: {}, path: "", ret: null, onKey: null, jb: null, lkAuto: {}, idx: [], has: null, nx: null };
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  function build() {
    injectCss();
    const ov = mk("div", "wo-ov hidden");
    ov.hidden = true;
    ov.id = "woNc";
    ov.dataset.wo = "nc";
    const box = mk("div", "wo-box");
    box.setAttribute("role", "dialog");
    box.setAttribute("aria-modal", "true");
    box.setAttribute("aria-labelledby", "woNcT");
    box.setAttribute("aria-describedby", "woNcD");
    box.innerHTML = '<div class="wo-hd"><div><h2 class="wo-t" id="woNcT">새 콘티 만들기</h2><p class="wo-lead" id="woNcD">예배와 날짜만 고르면 돼요. 나머지는 만든 뒤에 채워요.</p></div><button class="wo-xb" type="button" id="woNcX" aria-label="닫기">×</button></div><div class="wo-bd" id="woNcBd"><p class="wo-note lk" id="woFreeNote" hidden></p><section class="wo-step" aria-labelledby="woS1T"><div class="wo-sh"><h3 id="woS1T">어떤 예배인가요?</h3></div><div id="woTwo" hidden><p class="wo-sub" style="margin-bottom:10px">아직 만들어 둔 예배 순서가 없어요. 두 가지 중 하나로 시작해요.</p><div class="wo-two" role="group" aria-label="시작 방법"><button class="wo-big" type="button" id="woTwoEx" aria-pressed="false"><span class="wo-pl" data-ic="file"></span><b>예시 순서로 만들기</b><span>주일·수요·금요·새벽·찬양집회 예시 중에서 골라요.</span></button><button class="wo-big" type="button" id="woTwoBlank"><span class="wo-pl" data-ic="plus"></span><b>빈 콘티(지금처럼)</b><span>순서 없이 편집기에서 곡과 본문을 바로 넣어요.</span></button></div></div><div id="woPick" style="display:grid;gap:12px"><p class="wo-note" id="woExNote" hidden><span data-ic="info"></span><span>예시 순서예요. 하나를 골라 콘티를 만들고, 마음에 들면 대시보드의 예배 순서에서 우리 교회 것으로 저장해 매주 써요.</span></p><div class="wo-kinds" role="radiogroup" aria-labelledby="woS1T" id="woKinds"></div><div class="wo-row" id="woEtc" hidden><label class="wo-f nm"><span>어떤 순서로 시작할까요?</span><select class="wo-in" id="woEtcSrc"></select></label></div><div class="wo-row"><label class="wo-f dt"><span>날짜</span><input class="wo-in" type="date" id="woDate"></label><span class="wo-dl" id="woDateL" aria-live="polite"></span><label class="wo-f pt" id="woPartW"><span>부</span><input class="wo-in" type="number" id="woPart" min="1" max="9" value="1" inputmode="numeric"></label></div><p class="wo-err" id="woDateErr" role="alert" hidden>날짜를 골라 주세요</p><p class="wo-note" id="woPartNote" hidden><span></span></p><div class="wo-has" id="woHas" role="status" hidden><p id="woHasT"></p><div class="wo-hasb"><button class="wo-b pri" type="button" id="woResume"></button><button class="wo-b sm" type="button" id="woNew"></button></div></div><p class="wo-note wo-nx" id="woNx" hidden><span data-ic="info"></span><span id="woNxT"></span><button class="wo-lnk" type="button" id="woNxGo"></button></p></div></section><div id="woRest" style="display:grid;gap:10px"><details class="wo-dt" id="woNameD"><summary><span class="wo-cname" id="woCname"></span><span class="wo-dta">이름 바꾸기</span></summary><div class="wo-dtb"><label class="wo-f nm"><span>예배 이름</span><input class="wo-in" type="text" id="woName" maxlength="40" autocomplete="off" translate="no" placeholder="예배 이름"></label><p class="wo-fine">콘티 이름은 예배 이름과 날짜로 정해요</p></div></details><details class="wo-dt" id="woPvD"><summary id="woSum"></summary><div class="wo-dtb"><ol class="wo-pv" id="woPv" aria-label="들어갈 예배 순서"></ol><p class="wo-note" id="woFixNote" hidden><span></span></p><p class="wo-fine" id="woGuide">순서는 예배 순서에서 한 번 만들어 두고 매주 골라요. <button class="wo-lnk" type="button" id="woToOrder">예배 순서 보기</button></p></div></details><details class="wo-dt" id="woMore"><summary><b>지금 몇 칸 채우기</b><small>(선택)</small><span class="wo-aside wo-prog-t" id="woProgT" aria-live="polite"></span></summary><div class="wo-dtb"><p class="wo-short">번호나 이름 같은 짧은 칸이에요. 비워 두면 편집기에서 노란 자리로 남아요.</p><ul class="wo-fl" id="woFields"></ul></div></details></div></div><div class="wo-ft"><button class="wo-b" type="button" id="woBlank"></button><span class="wo-sp"></span><span class="wo-fine" id="woFreeFine" hidden>무료는 이 컴퓨터에만 남아요</span><button class="wo-b" type="button" id="woCancel">취소</button><button class="wo-b pri" type="button" id="woGo"></button></div>';
    ov.appendChild(box);
    $$("[data-ic]", box).forEach((s) => {
      const i = icon(s.dataset.ic);
      if (s.classList.contains("wo-pl")) {
        s.removeAttribute("data-ic");
        s.append(i);
      } else s.replaceWith(i);
    });
    ov.addEventListener("click", (e) => {
      if (e.target === ov) close();
    });
    $("#woNcX", box).addEventListener("click", () => close());
    $("#woCancel", box).addEventListener("click", () => close());
    $("#woToOrder", box).addEventListener("click", () => {
      const f = NC.opt && NC.opt.onOrders;
      close(false);
      if (f) f();
    });
    $("#woTwoEx", box).addEventListener("click", () => {
      NC.path = "ex";
      draw();
      const f = $('input[name="woOrd"]:checked', box);
      if (f) f.focus();
    });
    $("#woTwoBlank", box).addEventListener("click", blank);
    $("#woBlank", box).addEventListener("click", blank);
    $("#woKinds", box).addEventListener("change", (e) => {
      if (e.target.name !== "woOrd") return;
      pick(e.target.value);
    });
    $("#woKinds", box).addEventListener("click", (e) => {
      const l = e.target.closest(".wo-k.lkd");
      if (!l) return;
      e.preventDefault();
      locked(l.dataset.why || "order");
    });
    $("#woEtcSrc", box).addEventListener("change", (e) => {
      NC.etcSrc = e.target.value;
      if (!NC.dateTouched) {
        NC.dateGiven = false;
        NC.date = defDate();
        $("#woDate", box).value = NC.date;
      }
      upd();
    });
    $("#woName", box).addEventListener("input", (e) => {
      NC.name = e.target.value;
      NC.nameTouched = !!e.target.value.trim();
      updName();
    });
    $("#woDate", box).addEventListener("input", (e) => {
      NC.date = e.target.value;
      NC.dateTouched = true;
      NC.dateGiven = false;
      $("#woDateErr", box).hidden = true;
      upd();
    });
    $("#woPart", box).addEventListener("input", (e) => {
      const n = Math.max(1, Math.min(9, parseInt(e.target.value, 10) || 1));
      NC.part = n;
      const m = NC.pool.find((o) => o.kind === "sun" && o.part === n && !isLocked(o));
      if (m && m.id !== NC.oid) {
        NC.oid = m.id;
        $$('input[name="woOrd"]', box).forEach((r) => {
          r.checked = r.value === m.id;
        });
      }
      if (!NC.dateTouched && !NC.dateGiven) {
        NC.date = defDate();
        $("#woDate", box).value = NC.date;
      }
      upd();
    });
    $("#woGo", box).addEventListener("click", () => create());
    $("#woNew", box).addEventListener("click", () => create());
    $("#woResume", box).addEventListener("click", () => resume(NC.has));
    $("#woNxGo", box).addEventListener("click", () => resume(NC.nx && NC.nx.e));
    ov.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        close();
        return;
      }
      if (e.key === "Tab") trapTab(e, box);
      e.stopPropagation();
    });
    ["keyup", "keypress"].forEach((t) => ov.addEventListener(t, (e) => e.stopPropagation()));
    document.body.appendChild(ov);
    NC.el = ov;
    return ov;
  }
  function tabbables(box) {
    return $$('button,input,select,textarea,summary,a[href],[tabindex]:not([tabindex="-1"])', box).filter((el) => {
      if (el.disabled || el.tabIndex < 0) return false;
      const host = el.type === "radio" ? el.closest("label") || el : el;
      if (!host.getClientRects().length) return false;
      if (el.type === "radio" && !el.checked && box.querySelector('input[type="radio"][name="' + el.name + '"]:checked')) return false;
      return true;
    });
  }
  function trapTab(e, box) {
    const f = tabbables(box);
    if (!f.length) return;
    const i = f.indexOf(document.activeElement);
    if (e.shiftKey && i <= 0) {
      e.preventDefault();
      f[f.length - 1].focus();
    } else if (!e.shiftKey && (i === f.length - 1 || i < 0)) {
      e.preventDefault();
      f[0].focus();
    }
  }
  const plan = () => NC.opt && NC.opt.plan === "free" ? "free" : "pro";
  function isLocked() {
    return false;
  }
  function locked(why) {
    const msg = "이 예배 순서로 만드는 건 프로에서 돼요. 무료는 예시 순서로 만들어 봐요";
    if (NC.opt && NC.opt.onLocked) NC.opt.onLocked(why, msg);
    else if (NC.opt && NC.opt.toast) NC.opt.toast(msg);
  }
  function open(opt) {
    NC.opt = Object.assign({}, opt || {});
    if (typeof NC.opt.kp !== "string") NC.opt.kp = hostKp();
    if (!NC.el) build();
    const all = (NC.opt.orders == null ? ordersOrSeed(NC.opt.kp) : typeof NC.opt.orders === "function" ? NC.opt.orders() : NC.opt.orders) || [];
    NC.orders = all.map(normOrder).filter(Boolean);
    NC.pool = NC.orders.length ? NC.orders : examples();
    NC.path = NC.orders.length ? "" : NC.opt.start === "ex" ? "ex" : "";
    NC.vals = {};
    NC.name = "";
    NC.nameTouched = false;
    NC.date = "";
    NC.dateTouched = false;
    NC.dateGiven = false;
    NC.etcName = "";
    NC.part = 1;
    NC.oid = null;
    NC.etcSrc = null;
    NC.jb = null;
    NC.lkAuto = {};
    NC.has = null;
    NC.nx = null;
    NC.idx = contiIndex(NC.opt.kp);
    NC.ret = NC.opt.ret || document.activeElement;
    const box = $(".wo-box", NC.el);
    $("#woGo", box).replaceChildren(icon("pencil"), document.createTextNode("만들기"));
    $("#woResume", box).replaceChildren(icon("pencil"), document.createTextNode("이어서 준비"));
    $("#woNew", box).replaceChildren(icon("plus"), document.createTextNode("새로 만들기"));
    $("#woBlank", box).replaceChildren(icon("plus"), document.createTextNode("빈 콘티(지금처럼)"));
    $("#woToOrder", box).hidden = !NC.opt.onOrders;
    ["woNameD", "woPvD", "woMore"].forEach((id) => {
      $("#" + id, box).open = false;
    });
    if (NC.opt.overlayClass) NC.el.classList.add(...String(NC.opt.overlayClass).split(/\s+/).filter(Boolean));
    const pre = NC.opt.oid ? NC.pool.find((o) => o.id === NC.opt.oid) : null;
    if (pre) {
      NC.oid = pre.id;
      NC.part = pre.kind === "sun" ? pre.part || 1 : 1;
    }
    const pp = Math.round(+NC.opt.part);
    if (pp >= 1 && pp <= 9 && (!pre || pre.kind === "sun")) {
      NC.part = pp;
      const m = NC.pool.find((o) => o.kind === "sun" && o.part === pp);
      if (m && (!pre || pre.part !== pp)) NC.oid = m.id;
    }
    fixDefault();
    if (parseISO(NC.opt.date)) {
      NC.date = NC.opt.date;
      NC.dateGiven = true;
      NC.nx = null;
    }
    draw();
    NC.el.hidden = false;
    NC.el.classList.remove("hidden");
    document.documentElement.classList.add("wo-open");
    $("#woNcBd", box).scrollTop = 0;
    setTimeout(() => {
      const f = NC.has && $("#woResume", box) || $('input[name="woOrd"]:checked', box) || $("#woTwoEx", box) || $("#woGo", box);
      if (f && f.getClientRects().length) f.focus({ preventScroll: true });
      else $("#woNcX", box).focus();
    }, 20);
    return NC.el;
  }
  function close(restore) {
    if (!NC.el || NC.el.hidden) return;
    NC.el.hidden = true;
    NC.el.classList.add("hidden");
    document.documentElement.classList.remove("wo-open");
    const r = NC.ret;
    const cb = NC.opt && NC.opt.onClose;
    if (restore !== false && r && r.focus && document.contains(r)) {
      try {
        r.focus({ preventScroll: true });
      } catch (e) {
      }
    }
    if (cb) cb();
  }
  const isOpen = () => !!(NC.el && !NC.el.hidden);
  const find = (id) => NC.pool.find((o) => o.id === id) || null;
  function current() {
    return NC.oid === "etc" ? find(NC.etcSrc) || NC.pool[0] : find(NC.oid);
  }
  function svc() {
    if (NC.nameTouched && NC.name.trim()) return NC.name.trim().slice(0, 40);
    if (NC.oid === "etc") return "기타 예배";
    const o = find(NC.oid);
    if (!o) return "";
    if (o.kind === "sun") return o.part === NC.part ? o.name : "주일예배 " + NC.part + "부";
    return o.name;
  }
  function defDate() {
    const o = current();
    NC.nx = null;
    if (!o) return defaultDate("sun");
    if (NC.oid === "etc") return defaultDate(o.kind);
    const part = o.kind === "sun" ? NC.part : 0, n = nextIn(NC.idx, o, part);
    if (n.last) NC.nx = { last: n.last, e: existingIn(NC.idx, o, n.last, { now: true, part }) };
    return n.date;
  }
  function fixDefault() {
    const pool = NC.pool;
    if (!NC.oid || NC.oid !== "etc" && (!find(NC.oid) || isLocked(find(NC.oid)))) {
      const d = pool.find((o) => o.base && !isLocked(o)) || pool.find((o) => !isLocked(o)) || pool[0];
      if (d) {
        NC.oid = d.id;
        if (d.kind === "sun") NC.part = d.part;
      }
    }
    if (!NC.etcSrc || !find(NC.etcSrc)) {
      const s = pool.find((o) => !isLocked(o)) || pool[0];
      NC.etcSrc = s ? s.id : null;
    }
    if (!NC.dateTouched) NC.date = defDate();
  }
  function blank() {
    const f = NC.opt && NC.opt.onBlank;
    close(false);
    if (f) f();
    else if (NC.opt && NC.opt.host !== "edit") location.href = "/edit?new=blank";
  }
  function draw() {
    const box = $(".wo-box", NC.el);
    const empty = !NC.orders.length;
    const showPick = !empty || NC.path === "ex";
    $("#woTwo", box).hidden = !empty;
    $("#woTwoEx", box).setAttribute("aria-pressed", String(NC.path === "ex"));
    $("#woPick", box).hidden = !showPick;
    $("#woRest", box).hidden = !showPick;
    $("#woExNote", box).hidden = !empty;
    $("#woGo", box).hidden = !showPick;
    $("#woFreeFine", box).hidden = plan() !== "free" || !showPick;
    const fn = $("#woFreeNote", box);
    fn.hidden = true;
    if (!showPick) return;
    const tiles = NC.pool.map((o) => {
      const lk = isLocked(o);
      const l = mk("label", "wo-k" + (lk ? " lkd" : ""));
      if (lk) l.dataset.why = "order";
      const r = mk("input");
      r.type = "radio";
      r.name = "woOrd";
      r.value = o.id;
      r.checked = NC.oid === o.id;
      r.disabled = lk;
      const t = mk("span", "wo-kt");
      t.append(icon("calendar"), noTr(mk("span", "", o.name)));
      l.append(r, t, mk("span", "wo-ks", "순서 " + o.cards.length + "개 · 칸 " + weeklyCount(o) + "개"));
      if (o.example) l.append(mk("span", "wo-tag", "예시"));
      if (lk) l.append(mk("span", "wo-sr", "프로에서 돼요"));
      const ck = mk("span", "wo-ck");
      ck.setAttribute("aria-hidden", "true");
      ck.append(icon(lk ? "lock" : "check"));
      l.append(ck);
      return l;
    });
    const le = mk("label", "wo-k");
    const re = mk("input");
    re.type = "radio";
    re.name = "woOrd";
    re.value = "etc";
    re.checked = NC.oid === "etc";
    const te = mk("span", "wo-kt");
    te.append(icon("plus"), mk("span", "", "기타"));
    le.append(re, te, mk("span", "wo-ks", "이름을 적고 가까운 순서로 시작해요"));
    const cke = mk("span", "wo-ck");
    cke.setAttribute("aria-hidden", "true");
    cke.append(icon("check"));
    le.append(cke);
    $("#woKinds", box).replaceChildren(...tiles, le);
    $("#woEtcSrc", box).replaceChildren(...NC.pool.filter((o) => !isLocked(o)).map((o) => {
      const op = mk("option", "", o.name);
      op.value = o.id;
      op.selected = o.id === NC.etcSrc;
      return noTr(op);
    }));
    $("#woPart", box).value = NC.part;
    $("#woDate", box).value = NC.date;
    upd();
  }
  function pick(id) {
    NC.oid = id;
    if (id === "etc") $("#woNameD", NC.el).open = true;
    const o = find(id);
    if (o && o.kind === "sun") NC.part = o.part;
    if (!NC.dateTouched) {
      NC.dateGiven = false;
      NC.date = defDate();
      $("#woDate", NC.el).value = NC.date;
    }
    $("#woPart", NC.el).value = NC.part;
    upd();
  }
  function updName() {
    const box = $(".wo-box", NC.el);
    const s = svc();
    const inp = $("#woName", box);
    if (!NC.nameTouched && document.activeElement !== inp) inp.value = s;
    $("#woCname", box).replaceChildren(document.createTextNode("콘티 이름: "), noTr(mk("b", "", s + (dateLabel(NC.date) ? " · " + dateLabel(NC.date) : ""))));
  }
  const sayName = (iso, name, tail) => [document.createTextNode(mdLabel(iso) + " "), noTr(mk("b", "", name)), document.createTextNode(eun(name) + " " + tail)];
  function upd() {
    const box = $(".wo-box", NC.el);
    const o = current();
    const isEtc = NC.oid === "etc";
    const sun = !isEtc && o && o.kind === "sun";
    $("#woEtc", box).hidden = !isEtc;
    $("#woPartW", box).hidden = !sun;
    const dl = dateLabel(NC.date);
    $("#woDateL", box).textContent = dl || "날짜를 골라요";
    const pn = $("#woPartNote", box);
    if (sun && o.part !== NC.part) {
      pn.hidden = false;
      pn.replaceChildren(icon("info"), mk("span", "", "주일예배 " + NC.part + "부 순서가 따로 없어서 「" + o.name + "」 순서로 만들어요. " + NC.part + "부 순서가 다르면 예배 순서에서 복사해 따로 만들어 두면 돼요."));
    } else pn.hidden = true;
    jbEnsure();
    NC.has = !isEtc && o && dl ? existingIn(NC.idx, o, NC.date, { now: true, part: sun ? NC.part : 0 }) : null;
    $("#woHas", box).hidden = !NC.has;
    if (NC.has) $("#woHasT", box).replaceChildren(...sayName(NC.date, NC.has.name || svc(), "이미 만들었어요"));
    const showPick = !!NC.orders.length || NC.path === "ex";
    $("#woGo", box).hidden = !showPick || !!NC.has;
    const nx = !NC.dateTouched && !NC.dateGiven && !NC.has && !isEtc && NC.nx && NC.nx.e && NC.nx.last !== NC.date ? NC.nx : null;
    $("#woNx", box).hidden = !nx;
    if (nx) {
      $("#woNxT", box).replaceChildren(...sayName(nx.last, nx.e.name || svc(), "이미 만들어서 " + (o.kind === "dawn" ? "다음 날로" : "다음 주로") + " 골랐어요"));
      $("#woNxGo", box).textContent = mdLabel(nx.last) + " 이어서 준비";
    }
    updName();
    const cards = o ? o.cards : [];
    $("#woSum", box).replaceChildren(mk("b", "", "순서 " + cards.length + "개"), noTr(mk("span", "wo-pvn", cards.map((c) => c.name).join(" · "))));
    $("#woPv", box).replaceChildren(...cards.map((c, i) => {
      const li = mk("li");
      const nm = mk("span", "nm");
      nm.append(noTr(mk("span", "", c.name)));
      nm.append(bitsEl(c));
      const md = mk("span", "wo-md" + (c.mode === "weekly" ? " wk" : ""), c.mode === "weekly" ? "매주 수정" : "고정");
      li.append(mk("span", "num", String(i + 1)), typeIcon(c.type), nm);
      if (c.show === "jubo" || c.show === "screen") {
        li.classList.add("vs");
        li.append(mk("span", "wo-vis " + c.show, c.show === "jubo" ? "주보" : "화면"));
      }
      li.append(md);
      return li;
    }));
    drawFields();
  }
  const fk = (c, f) => c.id + ":" + f;
  function bitsEl(c, tag) {
    const sm = mk(tag || "small");
    sm.append(document.createElement("wbr"));
    const parts = [[TYPES[c.type].n, false]];
    if (c.mode === "weekly") c.fields.forEach((f) => {
      if (fieldShort(c, f) !== TYPES[c.type].n) parts.push([fieldShort(c, f), isCustom(f)]);
    });
    else if (c.auto) parts.push(["{예배 이름} · {날짜} 자동", false]);
    else if (c.paste && !c.text.trim()) parts.push(["교회가 붙여넣는 칸", false]);
    parts.forEach(([t, own], i) => {
      if (i) sm.append(document.createTextNode(" · "));
      const sp = mk("span", "", t);
      if (own) noTr(sp);
      sm.append(sp);
    });
    return sm;
  }
  function drawFields() {
    const box = $(".wo-box", NC.el);
    const o = current();
    if (!o) return;
    const items = [], links = jbLinks();
    o.cards.forEach((c, i) => {
      if (c.mode !== "weekly" || !c.fields.length) return;
      const li = mk("li");
      li.append(mk("span", "num", String(i + 1)));
      const hd = mk("div", "wo-flh");
      hd.append(typeIcon(c.type), noTr(mk("b", "", c.name)));
      li.append(hd);
      const fs = mk("div", "wo-ffs");
      c.fields.forEach((f) => {
        const v = NC.vals[fk(c, f)] || "";
        const w = mk("div", "wo-ff" + (v.trim() ? " ok" : ""));
        const id = "woF-" + c.id + "-" + f;
        const lb = mk("label");
        lb.htmlFor = id;
        const ls_ = mk("span", "", fieldShort(c, f));
        if (isCustom(f)) noTr(ls_);
        lb.append(document.createElement("wbr"), ls_, mk("em", "", "빈 칸"));
        const inp = mk("input", "wo-in");
        inp.type = "text";
        inp.id = id;
        inp.value = v;
        inp.maxLength = f === "songs" ? 200 : 80;
        inp.autocomplete = "off";
        inp.placeholder = fieldPh(c, f);
        inp.dataset.k = fk(c, f);
        inp.setAttribute("translate", "no");
        inp.addEventListener("input", () => {
          NC.vals[fk(c, f)] = inp.value;
          w.classList.toggle("ok", !!inp.value.trim());
          prog();
          jbLinkFrom(c, f, inp.value);
        });
        w.append(lb, inp);
        fs.append(w);
      });
      li.append(fs);
      links.filter((p) => p.slot === c).forEach((p) => {
        const r = String((NC.jb.data.serve[p.ri] || {}).r || "").trim();
        if (r) li.append(mk("p", "wo-lkn", "주보 섬기는 이 「" + r + "」에도 들어가요"));
      });
      if (c.paste) {
        const n = mk("p", "wo-note");
        n.append(icon("info"), mk("span", "", "본문은 교회가 붙여넣어요. 찬양자막이 넣어 드리지 않아요."));
        li.append(n);
      }
      items.push(li);
    });
    $("#woFields", box).replaceChildren(...items);
    $("#woMore", box).hidden = !items.length;
    const empties = o.cards.filter((c) => c.mode === "fixed" && c.paste && !c.text.trim());
    const fx = $("#woFixNote", box);
    if (empties.length) {
      fx.hidden = false;
      fx.replaceChildren(icon("info"), mk("span", "", "「" + empties.map((c) => c.name).join("」, 「") + "」 본문이 아직 비어 있어요. 예배 순서에서 한 번 붙여넣어 두면 매주 그대로 들어가요. 이번에는 편집기에서 노란 칸으로 보여요."));
    } else fx.hidden = true;
    prog();
  }
  const JB_ROLES = ["대표기도", "안내", "헌금 위원", "식당 봉사"];
  const jbBlank = () => ({ v: 1, at: 0, vol: "", day: "", news: [], serve: [], pray: [], offer: [], free: {} });
  function jbEnsure() {
    const kp = NC.opt && typeof NC.opt.kp === "string" ? NC.opt.kp : null, o = current();
    const st = kp && o ? juboStylePick(juboStylesRaw(kp), o.id) : null;
    const zs = st ? st.zones.filter((z) => z && typeof z.t === "string") : [];
    const types = new Set(zs.map((z) => z.t));
    if (!st || !(["news", "serve", "pray", "offer", "cover"].some((t) => types.has(t)) || zs.some((z) => z.t === "free" && z.o && z.o.weekly))) {
      NC.jb = null;
      return;
    }
    const key = o.id + "|" + NC.date + "|" + st.id;
    if (NC.jb && NC.jb.key === key) return;
    const ro2 = (zs.find((z) => z.t === "serve") || {}).o, roles = ro2 && Array.isArray(ro2.roles) && ro2.roles.length ? ro2.roles.slice(0, 20).map((r) => String(r).slice(0, 20)) : JB_ROLES;
    const last = parseISO(NC.date) ? juboLast(kp, o.id, NC.date) : null;
    const d = last && juboFromLast(last, zs) || jbBlank();
    if (!d.serve.length) d.serve = roles.map((r) => ({ r, a: "", b: "" }));
    NC.jb = { sid: st.id, key, oid: o.id, data: d, last };
    jbLinkLoad();
  }
  function jbLinks() {
    const o = current(), J = NC.jb;
    return o && J && J.data ? linkPairs(o.cards, J.data.serve) : [];
  }
  const jbField = (c, f) => NC.el && NC.el.querySelector("#woF-" + c.id + "-" + f);
  function jbSetField(c, f, v) {
    NC.vals[fk(c, f)] = v;
    const i = jbField(c, f);
    if (i) {
      i.value = v;
      const w = i.closest(".wo-ff");
      if (w) w.classList.toggle("ok", !!v.trim());
    }
    prog();
  }
  function jbLinkFrom(c, f, v) {
    delete NC.lkAuto[fk(c, f)];
    const J = NC.jb, p = jbLinks().find((x) => x.slot === c && x.field === f);
    if (!p) return;
    J.data.serve[p.ri].a = v.slice(0, 60);
  }
  function jbLinkLoad() {
    jbLinks().forEach((p) => {
      const k = fk(p.slot, p.field), row = NC.jb.data.serve[p.ri], rv = String(row.a || "").trim(), fv = String(NC.vals[k] || "").trim(), auto = !!fv && NC.lkAuto[k] === fv;
      if (rv && (!fv || auto)) {
        jbSetField(p.slot, p.field, rv);
        NC.lkAuto[k] = rv;
      } else if (!rv && auto) {
        jbSetField(p.slot, p.field, "");
        delete NC.lkAuto[k];
      } else if (fv) row.a = fv.slice(0, 60);
    });
  }
  function jbLinkSettle() {
    jbLinks().forEach((p) => {
      const row = NC.jb.data.serve[p.ri], rv = String(row.a || "").trim(), fv = String(NC.vals[fk(p.slot, p.field)] || "").trim();
      if (fv !== rv) {
        if (fv) row.a = fv.slice(0, 60);
        else NC.vals[fk(p.slot, p.field)] = rv;
      }
    });
  }
  function jbCollect() {
    const J = NC.jb;
    if (!J || !J.data) return null;
    const D = J.data;
    const j = {
      v: 1,
      at: Date.now(),
      sid: J.sid,
      vol: D.vol,
      day: D.day,
      news: D.news.filter((n) => (n.h + n.b).trim()),
      serve: D.serve.filter((r) => (r.r + r.a + r.b).trim()),
      pray: D.pray.filter((p) => String(p.t || "").trim()),
      offer: [],
      free: {}
    };
    Object.keys(D.free).forEach((k) => {
      if (String(D.free[k].t || "").trim()) j.free[k] = D.free[k];
    });
    if (J.last) j.from = J.last.date;
    return normJubo(j);
  }
  function totals() {
    const o = current();
    let total = 0, filled = 0;
    if (o) o.cards.forEach((c) => {
      if (c.mode !== "weekly") return;
      c.fields.forEach((f) => {
        total++;
        if ((NC.vals[fk(c, f)] || "").trim()) filled++;
      });
    });
    return { total, filled };
  }
  function prog() {
    const { total, filled } = totals();
    $("#woProgT", $(".wo-box", NC.el)).textContent = total + "칸 중 " + filled + "칸 채움";
  }
  function create() {
    const box = $(".wo-box", NC.el);
    const o = current();
    if (!o) return;
    if (NC.oid !== "etc" && isLocked(o)) {
      locked("order");
      return;
    }
    if (!dateLabel(NC.date)) {
      const er = $("#woDateErr", box);
      er.hidden = false;
      $("#woDate", box).focus();
      return;
    }
    jbEnsure();
    if (NC.jb) jbLinkSettle();
    const vals = {};
    Object.keys(NC.vals).forEach((k) => {
      const [cid, f] = k.split(":");
      if (!NC.vals[k].trim()) return;
      (vals[cid] = vals[cid] || {})[f] = NC.vals[k];
    });
    const base = NC.oid === "etc" ? Object.assign({}, o, { kind: "etc", kindName: "기타" }) : o;
    const r = recipe(base, { name: svc(), date: NC.date, vals });
    if (NC.oid === "etc") r.oid = o.id;
    const jb = jbCollect();
    if (jb) r.jubo = jb;
    const t = totals();
    r.empty = Math.max(0, t.total - t.filled);
    const cb = NC.opt && NC.opt.onCreate, host = NC.opt && NC.opt.host, kp = NC.opt && NC.opt.kp;
    close(false);
    if (cb) cb(r);
    else if (host !== "edit" && pendingSet(kp, r)) location.href = "/edit?new=wo";
  }
  function resume(e) {
    if (!e) return;
    const out = entryOut(e), cb = NC.opt && NC.opt.onResume, host = NC.opt && NC.opt.host;
    close(false);
    if (cb) cb(out);
    else if (host !== "edit") location.href = "/edit" + (out.now || out.cur ? "" : "?doc=" + encodeURIComponent(out.id));
  }
  window.WorshipOrder = {
    version: VER,
    KINDS,
    KNAME,
    TYPES,
    TYPE_KEYS,
    FIELD,
    TYPE_FIELDS,
    PRESETS,
    PRE,
    EXAMPLES,
    newCard,
    cloneCard,
    defaultFields,
    addCustomField,
    fieldLabel,
    fieldShort,
    fieldPh,
    isCustom,
    normCard,
    normOrder,
    normSlot,
    normRecipe,
    example,
    examples,
    TPL_KIND,
    TPL_TYPES,
    loadOrders,
    saveOrders,
    ordersOrSeed,
    markUsed,
    freeUsed,
    freeMark,
    freeCanSave,
    freePick,
    freePickSet,
    pendingSet,
    pendingTake,
    dateLabel,
    defaultDate,
    toISO,
    parseISO,
    kindLabel,
    weeklyCount,
    recipe,
    recipeTitle,
    icon,
    typeIcon,
    injectCss,
    eul,
    ro,
    
    SHOW,
    EN_DICT,
    enTitle,
    normJubo,
    juboLw,
    volNext,
    slotPlain,
    splitPlain,
    juboStylesRaw,
    juboStylePick,
    juboLast,
    juboFromLast,
    
    LINKS,
    LINK_ROLES,
    linkSync,
    linkPairs,
    linkNewsSlot,
    linkOn,
    roleKey,
    newsText,
    newsTexts,
    slotParts,
    slotPut,
    
    open,
    openNewConti: open,
    closeNewConti: close,
    isOpen,
    existing,
    nextFor,
    nextDate,
    metaWo,
    mdLabel
  };
  injectCss();
})();

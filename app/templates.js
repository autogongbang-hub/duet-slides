(function() {
  "use strict";
  if (window.Tpl) return;
  const VER = "1.15.4-b16";
  const mk = (tag, cls, text) => {
    const el = document.createElement(tag);
    if (cls) el.className = cls;
    if (text != null) el.textContent = text;
    return el;
  };
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const rid = (p) => (p || "x") + Math.random().toString(36).slice(2, 9);
  const HEX6 = /^#[0-9a-f]{6}$/i;
  const rgba = (hex, a) => {
    const h = String(hex || "#000000").replace("#", "");
    const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h.slice(0, 6), 16) || 0;
    return "rgba(" + (n >> 16 & 255) + "," + (n >> 8 & 255) + "," + (n & 255) + "," + clamp(+a || 0, 0, 100) / 100 + ")";
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
  const str = (v, max) => typeof v === "string" ? v.slice(0, max) : "";
  const num = (v, a, b, d) => typeof v === "number" && isFinite(v) ? clamp(v, a, b) : d;
  const deep = (o) => JSON.parse(JSON.stringify(o));
  const NAVY = "#0e1a36", NAVY_D = "#0b1530", BAND = "#13285a", GLOW = "#1d3366", GOLD = "#d8b26a", GOLD_L = "#ecd39b", SKY = "#c9d6f2";
  const COLORS = { NAVY, NAVY_D, BAND, GLOW, GOLD, GOLD_L, SKY };
  const FONTS = [
    { v: "pretendard", label: "프리텐다드 (기본)", css: '"Pretendard Variable",Pretendard,sans-serif' },
    { v: "noto", label: "본고딕 (Noto)", css: '"Noto Sans KR",sans-serif' },
    { v: "nanumg", label: "나눔고딕", css: '"Nanum Gothic",sans-serif' },
    { v: "gothica1", label: "고딕 A1", css: '"Gothic A1",sans-serif' },
    { v: "nanumm", label: "나눔명조 (명조체)", css: '"Nanum Myeongjo",serif' },
    { v: "blackhan", label: "검은고딕 (임팩트)", css: '"Black Han Sans",sans-serif' },
    { v: "dohyeon", label: "도현", css: '"Do Hyeon",sans-serif' },
    { v: "jua", label: "주아 (둥근)", css: '"Jua",sans-serif' }
  ];
  const fontOk = (v) => FONTS.some((f) => f.v === v);
  const fontCss = (v) => (FONTS.find((f) => f.v === v) || FONTS[0]).css;
  const WNAME = { 100: "아주 가늘게", 200: "더 가늘게", 300: "가늘게", 400: "보통", 500: "중간", 600: "조금 굵게", 700: "굵게", 800: "더 굵게", 900: "아주 굵게" };
  const KINDS = [["worship", "찬양"], ["bible", "성경"], ["sermon", "설교 제목"], ["notice", "광고"], ["cover", "예배 표지"]];
  const KNAME = Object.fromEntries(KINDS);
  const EDIT_KINDS = ["worship", "bible", "sermon", "notice", "cover"];
  const FIELDS = [["verse_ref", "성경구절"], ["body", "본문"], ["verse_no", "절 번호"], ["song_title", "곡 제목"], ["section", "곡 구간"], ["lyrics", "가사"], ["sermon_title", "설교 제목"], ["preacher", "설교자"], ["notice_title", "광고 제목"], ["notice_body", "광고 내용"], ["service_name", "예배 이름"], ["date", "날짜"]];
  const FNAME = Object.fromEntries(FIELDS);
  const FIELD_GROUPS = [["성경", ["verse_ref", "body", "verse_no"]], ["찬양", ["song_title", "section", "lyrics"]], ["설교", ["sermon_title", "preacher"]], ["광고", ["notice_title", "notice_body"]], ["예배", ["service_name", "date"]]];
  const FHINT = {
    verse_ref: "편집기의 「본문 찾기」로 넣은 구절이에요. 표기 규칙대로 표시돼요.",
    body: "그 구절의 말씀이에요. 이중자막을 켜면 서브 언어가 아래 줄에 와요.",
    verse_no: "지금 장표의 절 번호예요.",
    song_title: "콘티에 넣은 곡 이름이에요.",
    section: "1절, 후렴, 브릿지처럼 지금 장표가 속한 곡의 구간 이름이에요. 성경의 절이 아니에요.",
    lyrics: "지금 장표의 가사예요.",
    sermon_title: "콘티의 설교 칸에 적은 제목이에요.",
    preacher: "콘티의 설교 칸에 적은 설교자예요.",
    notice_title: "광고 장표의 첫 줄이에요.",
    notice_body: "광고 장표의 나머지 줄이에요. 광고 제목 칸이 없는 템플릿이면 모든 줄이 여기에 와요.",
    service_name: "콘티의 예배 종류에서 자동으로 채워요.",
    date: "콘티 날짜예요. 표기 규칙대로 표시돼요."
  };
  const FLOW = (f) => f === "body" || f === "lyrics";
  const REF_KEYS = ["full_colon", "short_colon", "full_kor", "short_kor"];
  const SEP_KEYS = ["~", "-"];
  const LANG_KEYS = ["full", "short"];
  const VN_KEYS = ["sup", "in", "off"];
  const DATE_KEYS = ["ymd", "md_dow", "dot"];
  const VN_NAME = { sup: "작게 위에", in: "앞에", off: "안 보임" };
  const VN_SHORT = { sup: "작게", in: "앞에", off: "안 보임" };
  const FMT_DEF = { ref: "full_colon", sep: "~", lang: "full", vn: "sup", date: "md_dow" };
  const FMT_OK = { ref: REF_KEYS, sep: SEP_KEYS, lang: LANG_KEYS, vn: VN_KEYS, date: DATE_KEYS };
  const FMT = Object.assign({}, FMT_DEF);
  const BOOK = { ko: "새벽서", ks: "새", en: "Daybreak", es: "Db" };
  const BOOK_EX = { ko: "요한복음", ks: "요", en: "John", es: "Jn" };
  const DAY = { y: 2026, m: 10, d: 4, dow: "주일" };
  const vrange = (vs, sep) => vs.length > 1 ? vs[0] + (sep || FMT.sep) + vs[vs.length - 1] : String(vs[0] == null ? "" : vs[0]);
  function fmtRef(bk, ch, vs, key, sep) {
    const k = REF_KEYS.includes(key) ? key : FMT.ref;
    const name = k.indexOf("short") === 0 ? bk.ks || bk.ko : bk.ko;
    if (!vs || !vs.length) return name + " " + ch + (/kor$/.test(k) ? "장" : "");
    return name + " " + (/kor$/.test(k) ? ch + "장 " + vrange(vs, sep) + "절" : ch + ":" + vrange(vs, sep));
  }
  const fmtRefL2 = (bk, ch, vs, key) => {
    const n = (key || FMT.lang) === "short" ? bk.es || bk.en : bk.en;
    if (!n) return "";
    return n + " " + ch + (vs && vs.length ? ":" + vrange(vs, "-") : "");
  };
  function fmtDate(D, key) {
    D = D || DAY;
    const k = DATE_KEYS.includes(key) ? key : FMT.date;
    if (k === "ymd") return D.y + "년 " + D.m + "월 " + D.d + "일";
    if (k === "dot") return D.y + ". " + D.m + ". " + D.d + ".";
    return D.m + "월 " + D.d + "일 " + D.dow;
  }
  const exRef = (key) => fmtRef(BOOK_EX, 3, [16], key);
  const hasOwnFmt = (b) => b.type === "field" && !!b.fmt && (b.field === "verse_ref" && REF_KEYS.includes(b.fmt) || b.field === "date" && DATE_KEYS.includes(b.fmt));
  const PH_DEF = [["p1", "주일 1부 예배"], ["p2", "주일 2부 예배"], ["p3", "수요예배"], ["p4", "금요철야예배"], ["p5", "새벽예배"], ["p6", "광고"], ["p7", "오늘의 말씀"]].map(([id, t]) => ({ id, t }));
  let PH = deep(PH_DEF), phSeq = 7;
  const phById = (id) => PH.find((p) => p.id === id) || null;
  const TBG = { on: false, color: NAVY, alpha: 85, radius: 12 };
  const OWN_KEYS = ["font", "size", "weight", "color", "fx"];
  let BID = null;
  const boxId = () => BID ? BID.p + "-" + ++BID.n : rid("x");
  function T(o) {
    const b = Object.assign({ type: "text", text: "", src: null, font: "pretendard", size: 56, weight: 700, color: "#ffffff", align: "center", valign: "mid", fx: "shadow" }, o);
    delete b.inherit;
    b.id = boxId();
    b.bg = Object.assign({}, TBG, o.bg || {});
    b.own = {};
    if (!o.inherit) {
      OWN_KEYS.forEach((k) => {
        if (o[k] != null) b.own[k] = true;
      });
      b.own.bar = true;
      if (o.dual && o.dual.size != null) b.own.l2size = true;
    }
    return b;
  }
  function F(field, o) {
    const b = T(Object.assign({ type: "field" }, o));
    b.field = field;
    b.fmt = o.fmt || null;
    b.dual = Object.assign({ on: FLOW(field), size: field === "verse_ref" ? 72 : 62, color: SKY }, o.dual || {});
    b.over = Object.assign({ shrink: true, min: o.inherit ? 24 : Math.round((o.size || 56) * 0.72), split: true }, o.over || {});
    b.accent = Object.assign({ on: false, color: GOLD_L }, o.accent || {});
    if (!o.inherit) b.own.l2color = true;
    return b;
  }
  const P = (o) => Object.assign({ type: "panel", color: NAVY, alpha: 90, radius: 0, fill: "solid", dir: "up" }, o, { id: boxId() });
  const I = (o) => Object.assign({ type: "image", src: null, fit: "contain", alpha: 100 }, o, { id: boxId() });
  const BUILT = [
    ["w1", "worship", "가운데 큰 글씨", 0, () => [
      F("lyrics", { x: 120, y: 300, w: 1680, h: 480, size: 88, weight: 800, over: { min: 60 }, dual: { size: 60, color: SKY } })
    ]],
    ["w2", "worship", "방송 하단 띠", 0, () => [
      P({ x: 0, y: 740, w: 1920, h: 340, color: BAND, alpha: 92, fill: "gradient", dir: "up" }),
      F("song_title", { x: 120, y: 800, w: 900, h: 46, size: 30, weight: 700, color: GOLD, align: "left", fx: "none", over: { min: 20, split: false } }),
      F("lyrics", { x: 120, y: 852, w: 1680, h: 186, size: 56, weight: 700, align: "left", valign: "top", over: { min: 40 }, dual: { color: SKY } })
    ]],
    ["b1", "bible", "구절 띠", 0, () => [
      P({ x: 0, y: 690, w: 1920, h: 390, color: BAND, alpha: 92, fill: "gradient", dir: "up" }),
      F("verse_ref", { x: 120, y: 676, w: 330, h: 64, size: 32, weight: 800, color: NAVY, fx: "none", bg: { on: true, color: GOLD, alpha: 100, radius: 10 }, over: { min: 20, split: false } }),
      F("body", { x: 120, y: 762, w: 1680, h: 270, size: 52, weight: 600, align: "left", valign: "top", accent: { on: true, color: GOLD_L }, dual: { size: 64 }, over: { min: 40 } })
    ]],
    ["b2", "bible", "절 번호 막대", 0, () => [
      P({ x: 0, y: 620, w: 1920, h: 460, color: BAND, alpha: 92, fill: "gradient", dir: "up" }),
      P({ x: 120, y: 700, w: 10, h: 300, color: GOLD, alpha: 100, radius: 5 }),
      F("verse_no", { x: 160, y: 690, w: 190, h: 120, size: 96, weight: 900, color: GOLD, align: "left", fx: "none", over: { min: 40, split: false } }),
      F("verse_ref", { x: 164, y: 816, w: 190, h: 80, size: 26, weight: 600, color: "#aebbd4", align: "left", valign: "top", fx: "none", over: { min: 18, split: false } }),
      F("body", { x: 380, y: 700, w: 1420, h: 300, size: 52, weight: 600, align: "left", valign: "top", dual: { size: 64 }, over: { min: 40 } })
    ]],
    ["b3", "bible", "본문 안내 카드", 0, () => [
      P({ x: 520, y: 280, w: 880, h: 520, color: "#10204a", alpha: 94, radius: 28 }),
      T({ x: 560, y: 390, w: 800, h: 80, text: "오늘의 말씀", src: "p7", size: 44, weight: 600, color: GOLD_L, fx: "none" }),
      P({ x: 900, y: 500, w: 120, h: 4, color: GOLD, alpha: 100, radius: 2 }),
      F("verse_ref", { x: 560, y: 540, w: 800, h: 130, size: 88, weight: 800, fx: "none", over: { min: 40, split: false } })
    ]],
    ["b4", "bible", "전체 화면", 0, () => [
      P({ x: 0, y: 0, w: 1920, h: 1080, color: "#0a1329", alpha: 100 }),
      P({ x: 0, y: 0, w: 1920, h: 620, color: GLOW, alpha: 70, fill: "gradient", dir: "down" }),
      F("verse_ref", { x: 140, y: 110, w: 900, h: 70, size: 40, weight: 700, color: GOLD, align: "left", fx: "none", dual: { on: true }, over: { min: 24, split: false } }),
      P({ x: 140, y: 196, w: 90, h: 5, color: GOLD, alpha: 100, radius: 3 }),
      F("body", { x: 140, y: 250, w: 1640, h: 720, size: 68, weight: 600, align: "left", valign: "top", fx: "none", dual: { size: 62 }, over: { min: 44 } })
    ]],
    ["s1", "sermon", "아래 두 단 띠", 0, () => [
      P({ x: 0, y: 830, w: 1920, h: 130, color: NAVY, alpha: 94 }),
      P({ x: 0, y: 960, w: 1920, h: 64, color: GOLD, alpha: 100 }),
      F("sermon_title", { x: 140, y: 842, w: 1640, h: 106, size: 60, weight: 800, align: "left", fx: "none", over: { min: 36, split: false } }),
      F("verse_ref", { x: 140, y: 964, w: 900, h: 56, size: 32, weight: 800, color: NAVY, align: "left", fx: "none", fmt: "full_kor", over: { min: 20, split: false } }),
      F("preacher", { x: 1080, y: 964, w: 700, h: 56, size: 30, weight: 700, color: NAVY, align: "right", fx: "none", over: { min: 20, split: false } })
    ]],
    ["s2", "sermon", "왼쪽 위 작은 배지", 1, () => [
      P({ x: 56, y: 52, w: 600, h: 124, color: NAVY, alpha: 86, radius: 14 }),
      P({ x: 56, y: 52, w: 8, h: 124, color: GOLD, alpha: 100, radius: 4 }),
      F("sermon_title", { x: 92, y: 66, w: 540, h: 54, size: 36, weight: 800, align: "left", fx: "none", over: { min: 22, split: false } }),
      F("verse_ref", { x: 92, y: 120, w: 540, h: 42, size: 26, weight: 600, color: GOLD_L, align: "left", fx: "none", over: { min: 18, split: false } })
    ]],
    ["n1", "notice", "제목과 본문", 0, () => [
      P({ x: 0, y: 0, w: 1920, h: 1080, color: "#0b1430", alpha: 100 }),
      T({ x: 160, y: 220, w: 400, h: 60, text: "광고", src: "p6", size: 34, weight: 700, color: GOLD, align: "left", fx: "none" }),
      F("notice_title", { x: 160, y: 296, w: 1600, h: 130, size: 80, weight: 800, align: "left", fx: "none", over: { min: 44, split: false } }),
      P({ x: 160, y: 460, w: 100, h: 5, color: GOLD, alpha: 100, radius: 3 }),
      F("notice_body", { x: 160, y: 510, w: 1500, h: 320, size: 46, weight: 500, color: "#d3dbea", align: "left", valign: "top", fx: "none", over: { min: 28, split: false } })
    ]],
    ["n2", "notice", "아래 알림 띠", 0, () => [
      P({ x: 0, y: 880, w: 1920, h: 140, color: NAVY, alpha: 94 }),
      T({ x: 120, y: 918, w: 150, h: 64, text: "광고", src: "p6", size: 32, weight: 800, color: NAVY, fx: "none", bg: { on: true, color: GOLD, alpha: 100, radius: 10 } }),
      F("notice_body", { x: 300, y: 900, w: 1500, h: 100, size: 46, weight: 700, align: "left", fx: "none", over: { min: 26, split: false } })
    ]],
    ["c1", "cover", "가운데 표지", 0, () => [
      P({ x: 0, y: 0, w: 1920, h: 1080, color: "#0b1430", alpha: 100 }),
      P({ x: 0, y: 0, w: 1920, h: 640, color: GLOW, alpha: 60, fill: "gradient", dir: "down" }),
      F("service_name", { x: 160, y: 390, w: 1600, h: 150, size: 110, weight: 800, fx: "none", over: { min: 60, split: false } }),
      P({ x: 900, y: 572, w: 120, h: 5, color: GOLD, alpha: 100, radius: 3 }),
      F("date", { x: 160, y: 606, w: 1600, h: 70, size: 44, weight: 600, color: GOLD_L, fx: "none", over: { min: 24, split: false } })
    ]],
    ["c2", "cover", "왼쪽 정렬 표지", 0, () => [
      P({ x: 0, y: 0, w: 1920, h: 1080, color: "#0a1226", alpha: 100 }),
      P({ x: 150, y: 380, w: 10, h: 300, color: GOLD, alpha: 100, radius: 5 }),
      F("date", { x: 200, y: 386, w: 1e3, h: 60, size: 40, weight: 600, color: GOLD_L, align: "left", fx: "none", over: { min: 24, split: false } }),
      F("service_name", { x: 200, y: 456, w: 1560, h: 160, size: 120, weight: 900, align: "left", fx: "none", over: { min: 60, split: false } }),
      I({ x: 1600, y: 880, w: 220, h: 120 })
    ]]
  ];
  const BUILT_IDS = BUILT.map((b) => b[0]);
  function builtin(id) {
    const e = BUILT.find((b) => b[0] === id);
    if (!e) return null;
    BID = { p: e[0], n: 0 };
    try {
      return { id: e[0], kind: e[1], name: e[2], fixed: !!e[3], from: "start", boxes: e[4]() };
    } finally {
      BID = null;
    }
  }
  const builtins = () => BUILT_IDS.map(builtin);
  const WH = "#ffffff", BK = "#000000", INK = "#15171c", CREAM = "#f4f1ea";
  const SOFT = { fx: "soft" }, NO = { fx: "none" };
  const FB = { on: true, mode: "fit", color: BK, alpha: 100, radius: 0 };
  const LYR = (o, field) => F(field || "lyrics", Object.assign({ x: 200, y: 790, w: 1520, h: 214, size: 54, weight: 700, color: WH, valign: "bot", lh: 1.5, over: { min: 36 }, dual: { size: 62, color: SKY } }, SOFT, o));
  const FRAMES = {
    worship: [
      
      ["wa", "하단 가운데 · 바탕 없음", () => [LYR({})]],
      
      ["wb", "넓은 자간", () => [LYR({ size: 46, weight: 600, ls: 0.06 })]],
      
      ["wc", "줄마다 검은 상자", () => [LYR({ size: 48, weight: 800, lh: 1.42, bg: FB, fx: "none" })]],
      
      ["wd", "아래 검은 띠", () => [
        P({ x: 0, y: 912, w: 1920, h: 168, color: BK, alpha: 100 }),
        LYR({ y: 922, h: 148, size: 40, weight: 600, ls: 0.06, lh: 1.45, valign: "mid", fx: "none", dual: { size: 62, color: SKY } })
      ]],
      
      ["we", "옅은 막대", () => [
        P({ x: 0, y: 846, w: 1920, h: 176, color: BK, alpha: 28 }),
        LYR({ y: 852, h: 164, size: 48, weight: 600, valign: "mid" })
      ]]
    ],
    bible: [
      
      ["ba", "단색 상자와 장절 탭", () => [
        P({ x: 72, y: 836, w: 1776, h: 184, color: INK, alpha: 88, radius: 6 }),
        F("verse_ref", Object.assign({ x: 72, y: 788, w: 340, h: 48, size: 26, weight: 700, color: INK, bg: { on: true, color: GOLD, alpha: 100, radius: 4 }, over: { min: 18, split: false } }, NO)),
        F("body", Object.assign({ x: 112, y: 848, w: 1696, h: 160, size: 40, weight: 500, color: WH, align: "left", lh: 1.5, dual: { size: 65 }, over: { min: 28 } }, NO))
      ]],
      
      ["bb", "왼쪽 아래 · 바탕 없음", () => [
        F("body", Object.assign({ x: 110, y: 780, w: 1500, h: 230, size: 42, weight: 600, color: WH, align: "left", valign: "bot", lh: 1.5, lead: { f: "verse_ref", s: 0.62 }, dual: { size: 65 }, over: { min: 28 } }, SOFT))
      ]],
      
      ["bc", "가사와 같은 틀", () => [LYR({ x: 260, w: 1400, h: 230, y: 774, size: 46, weight: 600, lead: { f: "verse_ref", s: 0.6 }, dual: { size: 65 } }, "body")]]
    ],
    sermon: [
      
      ["sd", "설교 상자 (국내 · 해외 섞음)", () => [
        P({ x: 72, y: 836, w: 1776, h: 184, color: INK, alpha: 88, radius: 6 }),
        T(Object.assign({ x: 72, y: 788, w: 150, h: 48, text: "설교", size: 26, weight: 700, color: INK, bg: { on: true, color: GOLD, alpha: 100, radius: 4 } }, NO)),
        F("sermon_title", Object.assign({ x: 112, y: 848, w: 1220, h: 160, size: 50, weight: 700, color: WH, align: "left", lh: 1.3, tail: { f: "sermon_title2", s: 0.6 }, over: { min: 30, split: false } }, NO)),
        F("verse_ref", Object.assign({ x: 1360, y: 864, w: 448, h: 56, size: 30, weight: 600, color: GOLD_L, align: "right", over: { min: 18, split: false } }, NO)),
        F("preacher", Object.assign({ x: 1360, y: 924, w: 448, h: 56, size: 30, weight: 600, color: WH, align: "right", over: { min: 18, split: false } }, NO))
      ]],
      
      ["sa", "가사와 같은 틀", () => [
        F("sermon_title", Object.assign({ x: 200, y: 870, w: 1520, h: 110, size: 54, weight: 700, color: WH, valign: "bot", lh: 1.3, tail: { f: "sermon_title2", s: 0.6 }, over: { min: 32, split: false } }, SOFT)),
        F("verse_ref", Object.assign({ x: 200, y: 976, w: 1520, h: 40, size: 26, weight: 600, color: WH, ls: 0.04, over: { min: 18, split: false } }, SOFT))
      ]],
      
      ["sb", "밝은 막대와 꼬리표", () => [
        P({ x: 60, y: 880, w: 1360, h: 136, color: CREAM, alpha: 100, radius: 10 }),
        P({ x: 1420, y: 880, w: 380, h: 136, color: INK, alpha: 100, radius: 10 }),
        F("sermon_title", Object.assign({ x: 100, y: 892, w: 1290, h: 112, size: 46, weight: 700, color: INK, align: "left", over: { min: 28, split: false } }, NO)),
        F("verse_ref", Object.assign({ x: 1440, y: 892, w: 340, h: 112, size: 28, weight: 600, color: WH, over: { min: 18, split: false } }, NO))
      ]],
      
      ["sc", "단색 상자와 탭", () => [
        P({ x: 72, y: 880, w: 1776, h: 140, color: INK, alpha: 88, radius: 6 }),
        F("verse_ref", Object.assign({ x: 72, y: 832, w: 400, h: 48, size: 26, weight: 700, color: INK, bg: { on: true, color: GOLD, alpha: 100, radius: 4 }, over: { min: 18, split: false } }, NO)),
        F("sermon_title", Object.assign({ x: 112, y: 892, w: 1696, h: 116, size: 50, weight: 700, color: WH, align: "left", over: { min: 30, split: false } }, NO))
      ]]
    ],
    notice: [
      
      ["na", "얇은 막대", () => [
        P({ x: 96, y: 900, w: 1100, h: 110, color: INK, alpha: 80, radius: 4 }),
        F("notice_body", Object.assign({ x: 136, y: 906, w: 1040, h: 98, size: 30, weight: 700, color: WH, align: "left", ls: 0.04, lh: 1.45, over: { min: 20, split: false } }, NO))
      ]],
      
      ["nb", "단색 상자와 탭", () => [
        P({ x: 72, y: 880, w: 1776, h: 140, color: INK, alpha: 88, radius: 6 }),
        T(Object.assign({ x: 72, y: 832, w: 150, h: 48, text: "광고", src: "p6", size: 26, weight: 700, color: INK, bg: { on: true, color: GOLD, alpha: 100, radius: 4 } }, NO)),
        F("notice_body", Object.assign({ x: 112, y: 892, w: 1696, h: 116, size: 42, weight: 600, color: WH, align: "left", lh: 1.45, over: { min: 26, split: false } }, NO))
      ]],
      
      ["nc", "가사와 같은 틀", () => [LYR({ size: 48, weight: 600, dual: { on: false } }, "notice_body")]]
    ]
  };
  const FRAME_KIND = { cover: "worship", "": "worship" };
  const FRAME_FIELD = { cover: "service_name" };
  const FRAME_IDS = Object.keys(FRAMES).reduce((o, k) => (o[k] = FRAMES[k].map((f) => f[0]), o), {});
  function frameOf(kind, id, key) {
    const k = FRAMES[kind] ? kind : FRAME_KIND[kind] || "worship", e = FRAMES[k].find((f) => f[0] === id);
    if (!e) return null;
    BID = { p: id + "-" + (kind || "x"), n: 0 };
    let boxes;
    try {
      boxes = e[2]();
    } finally {
      BID = null;
    }
    if (FRAME_FIELD[kind]) boxes.forEach((b) => {
      if (b.field === "lyrics") b.field = FRAME_FIELD[kind];
    });
    if (key) boxes.forEach((b) => {
      if (b.fx === "soft" || b.fx === "shadow") b.fx = "tight";
    });
    return { id: "frame_" + id, kind: kind || "worship", name: e[1], boxes, frame: id };
  }
  const frames = (kind) => (FRAMES[kind] || []).map((f) => ({ id: f[0], name: f[1] }));
  const BASE_NAME = "기본(공통 그대로)";
  const USE_GEO = { center: { y: 97, h: 886, padX: 115, va: "mid" }, top: { y: 65, h: 238, padX: 192, va: "top" }, bottom: { y: 756, h: 238, padX: 192, va: "bot" } };
  function baseBox(type, o, C) {
    const g = USE_GEO[C.posV] || USE_GEO.center;
    const b = Object.assign({ type, text: "", src: null, font: C.font, size: C.size, weight: C.weight, color: "#ffffff", align: C.alignH || "center", valign: g.va, fx: C.fx, x: 0, y: g.y, w: 1920, h: g.h, padX: g.padX, own: {}, bg: Object.assign({}, TBG) }, o);
    if (type === "field") {
      b.fmt = null;
      b.dual = { on: FLOW(b.field), size: C.l2size, color: SKY };
      b.over = { shrink: true, min: 24, split: true };
      b.accent = { on: false, color: GOLD_L };
    }
    return b;
  }
  const BASE_BOXES = {
    worship: (C) => [baseBox("field", { id: "bw", field: "lyrics" }, C)],
    bible: (C) => [baseBox("field", { id: "bb", field: "body", lead: { f: "verse_ref", s: 0.6 } }, C)],
    sermon: (C) => [baseBox("field", { id: "bs", field: "sermon_title", tail: { f: "preacher", s: 0.6 } }, C)],
    notice: (C) => [baseBox("field", { id: "bn", field: "notice_title", tail: { f: "notice_body", s: 0.6 } }, C)],
    cover: (C) => [baseBox("field", { id: "bc", field: "service_name", tail: { f: "date", s: 0.55 } }, C)]
  };
  const isBase = (id) => typeof id === "string" && /^base_(worship|bible|sermon|notice|cover)$/.test(id);
  const baseTpl = (kind) => ({ id: "base_" + kind, kind, name: BASE_NAME, base: true, boxes: [] });
  const ID_RE = /^[\w-]{1,40}$/;
  const IMG_RE = /^img_[a-z0-9]{6,24}$/;
  const col = (v, d) => HEX6.test(v || "") ? String(v).toLowerCase() : d;
  function normBox(x) {
    if (!x || typeof x !== "object") return null;
    const type = ["text", "field", "panel", "image"].includes(x.type) ? x.type : null;
    if (!type) return null;
    const b = {
      id: typeof x.id === "string" && ID_RE.test(x.id) ? x.id : rid("x"),
      type,
      x: Math.round(num(x.x, -1920, 3840, 0)),
      y: Math.round(num(x.y, -1080, 2160, 0)),
      w: Math.round(num(x.w, 4, 3840, 400)),
      h: Math.round(num(x.h, 4, 2160, 120))
    };
    if (type === "panel") {
      return Object.assign(b, { color: col(x.color, NAVY), alpha: Math.round(num(x.alpha, 0, 100, 90)), radius: Math.round(num(x.radius, 0, 540, 0)), fill: x.fill === "gradient" ? "gradient" : "solid", dir: ["up", "down", "left", "right"].includes(x.dir) ? x.dir : "up" });
    }
    if (type === "image") {
      return Object.assign(b, { src: typeof x.src === "string" && IMG_RE.test(x.src) ? x.src : null, fit: x.fit === "cover" ? "cover" : "contain", alpha: Math.round(num(x.alpha, 0, 100, 100)) });
    }
    Object.assign(b, {
      font: fontOk(x.font) ? x.font : "pretendard",
      size: Math.round(num(x.size, 8, 480, 56)),
      weight: clamp(Math.round(num(x.weight, 100, 900, 700) / 100) * 100, 100, 900),
      color: col(x.color, "#ffffff"),
      align: ["left", "center", "right"].includes(x.align) ? x.align : "center",
      valign: ["top", "mid", "bot"].includes(x.valign) ? x.valign : "mid",
      fx: ["none", "shadow", "outline"].includes(x.fx) ? x.fx : "shadow",
      bg: { on: !!(x.bg && x.bg.on), color: col(x.bg && x.bg.color, NAVY), alpha: Math.round(num(x.bg && x.bg.alpha, 0, 100, 85)), radius: Math.round(num(x.bg && x.bg.radius, 0, 200, 12)) },
      own: {}
    });
    ["font", "size", "weight", "color", "fx", "bar", "l2size", "l2color"].forEach((k) => {
      if (x.own && x.own[k] === true) b.own[k] = true;
    });
    if (typeof x.padX === "number" && isFinite(x.padX)) b.padX = clamp(Math.round(x.padX), 0, 400);
    ["lead", "tail"].forEach((k) => {
      const v = x[k];
      if (!v || typeof v !== "object") return;
      const s = Math.round(num(v.s, 0.2, 1, 0.6) * 100) / 100;
      if (FNAME[v.f]) b[k] = { f: v.f, s };
      else if (typeof v.t === "string" && v.t.trim()) b[k] = { t: str(v.t, 200), s };
    });
    if (type === "text") {
      b.text = str(x.text, 2e3);
      b.src = typeof x.src === "string" && /^p\d{1,6}$/.test(x.src) ? x.src : null;
      return b;
    }
    const field = FNAME[x.field] ? x.field : null;
    if (!field) return null;
    b.field = field;
    b.fmt = field === "verse_ref" && REF_KEYS.includes(x.fmt) || field === "date" && DATE_KEYS.includes(x.fmt) ? x.fmt : null;
    const d = x.dual || {}, ov = x.over || {}, ac = x.accent || {};
    b.dual = { on: !!d.on, size: Math.round(num(d.size, 30, 120, 62)), color: col(d.color, SKY) };
    b.over = { shrink: ov.shrink !== false, min: Math.round(num(ov.min, 8, 480, 40)), split: ov.split !== false };
    b.accent = { on: !!ac.on, color: col(ac.color, GOLD_L) };
    return b;
  }
  const NOTICE_PH = { "광고 제목을 적어요": "notice_title", "여기에 광고 내용을 적어요.\n날짜와 장소를 같이 적으면 보기 좋아요.": "notice_body", "광고 내용을 한 줄로 적어요": "notice_body" };
  function noticeField(b) {
    const f = b.type === "text" && !b.src && NOTICE_PH[b.text];
    if (!f) return b;
    const o = Object.assign({}, b, { type: "field", field: f, fmt: null, dual: { on: false, size: 62, color: SKY }, over: { shrink: true, min: Math.max(16, Math.round(b.size * 0.6)), split: false }, accent: { on: false, color: GOLD_L } });
    delete o.text;
    delete o.src;
    return o;
  }
  function normTpl(x) {
    if (!x || typeof x !== "object") return null;
    const kind = KNAME[x.kind] ? x.kind : null;
    if (!kind) return null;
    if (typeof x.id !== "string" || !ID_RE.test(x.id) || isBase(x.id)) return null;
    const t = { id: x.id, kind, name: str(x.name, 40).trim() || "이름 없는 템플릿", boxes: (Array.isArray(x.boxes) ? x.boxes : []).slice(0, 60).map(normBox).filter(Boolean) };
    if (kind === "notice") t.boxes = t.boxes.map(noticeField);
    if (x.fixed) t.fixed = true;
    t.from = ["start", "copy", "made"].includes(x.from) ? x.from : BUILT_IDS.includes(x.id) ? "start" : "made";
    if (typeof x.at === "number" && isFinite(x.at)) t.at = x.at;
    return t;
  }
  function normFmt(o) {
    const out = Object.assign({}, FMT_DEF);
    if (o && typeof o === "object") Object.keys(FMT_OK).forEach((k) => {
      if (FMT_OK[k].includes(o[k])) out[k] = o[k];
    });
    return out;
  }
  function normPh(a) {
    if (!Array.isArray(a)) return deep(PH_DEF);
    const seen = /* @__PURE__ */ new Set();
    return a.slice(0, 60).filter((p) => p && typeof p.id === "string" && /^p\d{1,6}$/.test(p.id) && typeof p.t === "string" && p.t.trim() && !seen.has(p.id) && seen.add(p.id)).map((p) => ({ id: p.id, t: p.t.trim().slice(0, 80) }));
  }
  let KP = "chanyang-jamak:";
  const keyOf = () => KP + "tpl";
  function lsGet(k) {
    try {
      return localStorage.getItem(k);
    } catch (e) {
      return null;
    }
  }
  function lsSet(k, v) {
    try {
      localStorage.setItem(k, v);
      return true;
    } catch (e) {
      return false;
    }
  }
  let ST = null, ST_RAW = null;
  function load(force) {
    const raw = lsGet(keyOf());
    if (ST && !force && raw === ST_RAW) return ST;
    let j = null;
    try {
      j = JSON.parse(raw);
    } catch (e) {
      j = null;
    }
    const st = { v: 1, list: null, defaults: {}, fmt: normFmt(j && j.fmt), ph: normPh(j && j.ph), phSeq: 7 };
    if (j && Array.isArray(j.list)) {
      const seen = /* @__PURE__ */ new Set();
      st.list = j.list.slice(0, 200).map(normTpl).filter((t) => t && !seen.has(t.id) && seen.add(t.id));
    } else st.list = builtins();
    if (j && j.defaults && typeof j.defaults === "object") KINDS.forEach(([k]) => {
      const d = j.defaults[k];
      if (!d || typeof d !== "object") return;
      const t = normTpl(Object.assign({}, d, { kind: k }));
      if (t) st.defaults[k] = { id: t.id, name: t.name, boxes: t.boxes, fixed: !!t.fixed };
    });
    st.phSeq = Math.max(7, ...st.ph.map((p) => +p.id.slice(1) || 0), j && +j.phSeq || 0);
    Object.assign(FMT, st.fmt);
    PH = st.ph;
    phSeq = st.phSeq;
    ST = st;
    ST_RAW = raw;
    return st;
  }
  function save(st) {
    st = st || ST || load();
    st.fmt = Object.assign({}, FMT);
    st.ph = PH;
    st.phSeq = phSeq;
    const out = { v: 1, list: st.list, defaults: st.defaults, fmt: st.fmt, ph: st.ph, phSeq: st.phSeq };
    const raw = JSON.stringify(out);
    const ok = lsSet(keyOf(), raw);
    if (ok) {
      ST = st;
      ST_RAW = raw;
    }
    return ok;
  }
  const listOf = (kind) => load().list.filter((t) => t.kind === kind);
  function byId(id, tdefs) {
    if (!id) return null;
    if (isBase(id)) return baseTpl(id.slice(5));
    const st = load();
    const t = st.list.find((x) => x.id === id);
    if (t) return t;
    if (tdefs && tdefs[id]) {
      const d = normTpl(Object.assign({ id }, tdefs[id]));
      if (d) return d;
    }
    return builtin(id);
  }
  function churchDefault(kind) {
    const d = load().defaults[kind];
    return d ? { id: d.id, kind, name: d.name, boxes: d.boxes, fixed: !!d.fixed, church: true } : null;
  }
  const nameOf = (id, tdefs) => {
    if (!id || isBase(id)) return BASE_NAME;
    const t = byId(id, tdefs);
    return t ? t.name : BASE_NAME;
  };
  function commonOf(S, H) {
    S = S || {};
    const tx2 = H.textHex(S);
    const s2 = H.sub2Hex ? H.sub2Hex(S) : "";
    const bar = S.textBox ? S.boxStyle === "full" || S.boxStyle === "band" ? "full" : "fit" : "none";
    return {
      font: fontOk(S.fontFamily) ? S.fontFamily : "pretendard",
      size: Math.max(24, Math.round((+S.fontCap || 13) * 19.2)),
      weight: clamp(Math.round((parseInt(S.fontWeight, 10) || 800) / 100) * 100, 100, 900),
      color: tx2,
      fx: S.outline ? "outline" : S.shadow ? "shadow" : "none",
      olw: +S.outlineW || 0,
      bar,
      barColor: H.boxHex(S, 1),
      barAlpha: Math.round((+S.boxOpacity || 0) * (H.boxAlpha ? H.boxAlpha(S, 1) : 1)),
      l2size: clamp(+S.sub2Size || 65, 30, 100),
      l2color: s2 || tx2,
      swap: !!S.dualSwap,
      posV: ["top", "center", "bottom"].includes(S.posV) ? S.posV : "center",
      alignH: ["left", "center", "right"].includes(S.alignH) ? S.alignH : "center",
      screen: H.bgSolid ? H.bgSolid(S) : "#000000"
    };
  }
  const isTx = (b) => b.type === "text" || b.type === "field";
  const ownOf = (b, k) => !!(b && b.own && b.own[k]);
  function R(b, C) {
    if (!isTx(b)) return b;
    const r = Object.assign({}, b);
    if (!ownOf(b, "font")) r.font = C.font;
    if (!ownOf(b, "size")) r.size = C.size;
    if (!ownOf(b, "weight")) r.weight = C.weight;
    if (!ownOf(b, "color")) r.color = C.color;
    if (!ownOf(b, "fx")) {
      r.fx = C.fx;
      r.olw = C.olw;
    } else r.olw = 0;
    if (!ownOf(b, "bar")) r.bg = { on: C.bar !== "none", mode: C.bar, color: C.barColor, alpha: C.barAlpha, radius: 8 };
    if (b.dual) r.dual = Object.assign({}, b.dual, { size: ownOf(b, "l2size") ? b.dual.size : C.l2size, color: ownOf(b, "l2color") ? b.dual.color : C.l2color });
    return r;
  }
  function boxesOf(tpl, C) {
    return tpl.base ? BASE_BOXES[tpl.kind](C) : tpl.boxes;
  }
  const CSS = `
.tps{position:relative;display:block;width:100%;aspect-ratio:16/9;container-type:inline-size;overflow:hidden;--u:calc(100cqw / 1920);color:#fff;isolation:isolate;text-align:left;font-style:normal;text-transform:none;font-variant:normal}
.tps *,.tps *::before,.tps *::after{box-sizing:border-box}
.tps.tps-meas{position:fixed;left:-30000px;top:0;width:1920px;visibility:hidden;pointer-events:none;contain:layout style}
.tps.tps-ov{position:absolute;left:0;top:0;width:100%;height:100%;aspect-ratio:auto;z-index:0;pointer-events:none}
.tps-host{container-type:size}
.tps.tps-ov.tps-lb{width:min(100cqw,calc(100cqh * 16 / 9));height:auto;aspect-ratio:16/9;left:50%;top:50%;transform:translate(-50%,-50%)}
.tpb{position:absolute}
.tpb-image{display:grid;place-items:center;overflow:hidden}
.tpb-image img{display:block;width:100%;height:100%}
.tpb-image.ph{border:calc(var(--u) * 3) dashed #ffffff4d;color:#ffffff80;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:calc(var(--u) * 6);font-size:calc(var(--u) * 24);font-weight:700;font-family:system-ui,sans-serif}
.tpb-image.ph svg{width:calc(var(--u) * 40);height:calc(var(--u) * 40);fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
.tpi{position:absolute;inset:0;display:flex;flex-direction:column;justify-content:center;line-height:1.36;letter-spacing:-.01em;word-break:keep-all;overflow-wrap:break-word}
.tpi.va-top{justify-content:flex-start}
.tpi.va-bot{justify-content:flex-end}
.tpi.has-bg{padding:.12em .42em}
.tpx{width:100%;white-space:pre-line}
.tpb.nowrap .tpx{white-space:pre}
.tpx p{margin:0}
.tpl2{margin-top:.38em;line-height:1.3;font-weight:600;letter-spacing:0}
.tpv{font-size:.56em;font-weight:800;vertical-align:.58em;margin-right:.2em;opacity:.85}
.tpv.in{font-size:.78em;vertical-align:baseline;margin-right:.32em;opacity:.75}
.tpx.acc .tpk>p:first-child::first-line{color:var(--acc)}
.fx-shadow .tpx{text-shadow:0 .05em .24em #000000e0}
.fx-soft .tpx{text-shadow:0 .03em .16em #00000080}
.fx-tight .tpx{text-shadow:0 .02em .03em #000000a6}
.fx-outline .tpx{--o:var(--ol,.04em);--o2:calc(var(--o) * 1.375);text-shadow:calc(var(--o) * -1) calc(var(--o) * -1) 0 #000,var(--o) calc(var(--o) * -1) 0 #000,calc(var(--o) * -1) var(--o) 0 #000,var(--o) var(--o) 0 #000,0 calc(var(--o2) * -1) 0 #000,0 var(--o2) 0 #000,calc(var(--o2) * -1) 0 0 #000,var(--o2) 0 0 #000}
.tpn{-webkit-box-decoration-break:clone;box-decoration-break:clone}
.bar-fit .tpn{background:var(--bar);padding:.04em .34em;border-radius:.14em}
.bar-full .tpx{background:var(--bar);padding:.24em .5em .28em}
.tpld{display:block;font-weight:600;margin-bottom:.32em;letter-spacing:0}
.tptl{display:block;font-weight:600;margin-top:.4em;letter-spacing:0}
.tpl2i{margin-left:.5em;font-weight:600;letter-spacing:0;white-space:nowrap}
.tpchip{display:inline-block;padding:0 .3em;border:calc(var(--u) * 3) dashed currentColor;border-radius:.22em;background:#ffffff17;line-height:1.3;white-space:nowrap;text-shadow:none}
.tps .tpb.ovf{outline:calc(var(--u) * 4) dashed #ff9d4d;outline-offset:calc(var(--u) * -4)}
`;
  function injectCss() {
    if (document.getElementById("tpl-css")) return;
    const st = document.createElement("style");
    st.id = "tpl-css";
    st.textContent = CSS;
    const h = document.head || document.documentElement;
    h.insertBefore(st, h.firstChild);
  }
  let MEAS = null;
  const fitCache = /* @__PURE__ */ new Map();
  const styleKey = (b) => {
    const { id, x, y, src, ...rest } = b;
    return JSON.stringify(rest);
  };
  function measEl() {
    if (MEAS && MEAS.isConnected) return MEAS;
    injectCss();
    MEAS = mk("div", "tps tps-meas");
    MEAS.setAttribute("aria-hidden", "true");
    MEAS.setAttribute("translate", "no");
    (document.body || document.documentElement).appendChild(MEAS);
    return MEAS;
  }
  function fits(b, c, size) {
    const key = styleKey(b) + "|" + JSON.stringify(c) + "|" + size;
    if (fitCache.has(key)) return fitCache.get(key);
    const el = buildBox(b, c, size, null);
    const m = measEl();
    m.replaceChildren(el);
    const inn = el.firstChild, tx2 = inn && inn.firstChild;
    let ok = true;
    if (inn && tx2) {
      const cs = getComputedStyle(inn);
      const availH = inn.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
      ok = tx2.offsetHeight <= availH + 0.5 && tx2.scrollWidth <= tx2.clientWidth + 1;
    }
    if (fitCache.size > 6e3) fitCache.clear();
    fitCache.set(key, ok);
    return ok;
  }
  function bestSize(b, c, maxS, minS) {
    if (fits(b, c, maxS)) return maxS;
    if (minS >= maxS || !fits(b, c, minS)) return null;
    let lo = minS, hi = maxS;
    while (hi - lo > 1) {
      const m = lo + hi >> 1;
      if (fits(b, c, m)) lo = m;
      else hi = m;
    }
    return lo;
  }
  function fitSingle(b, c) {
    if (b.type !== "field" || !b.over || !b.over.shrink) return { c, size: b.size, ovf: !fits(b, c, b.size) };
    const minS = Math.min(b.over.min, b.size);
    const s = bestSize(b, c, b.size, minS);
    return s == null ? { c, size: minS, ovf: true } : { c, size: s, ovf: false };
  }
  function fieldText(f, d, b) {
    const own = b && hasOwnFmt(b) ? b.fmt : null;
    if (f === "verse_ref") return d.ref ? fmtRef(d.ref.bk, d.ref.ch, d.ref.vs, own || FMT.ref) : d.refRaw || "";
    if (f === "verse_no") return FMT.vn === "off" ? "" : d.ref && d.ref.vs && d.ref.vs.length ? vrange(d.ref.vs) : "";
    if (f === "date") return d.date ? fmtDate(d.date, own || FMT.date) : "";
    if (f === "lyrics" || f === "body") {
      const x = d[f];
      return x ? x.main.map((p) => p.t).join("\n") : "";
    }
    return typeof d[f] === "string" ? d[f] : "";
  }
  const needVn = (main) => !!main && main.length > 1 && main[0].v != null && new Set(main.map((p) => p.v)).size > 1;
  function flowC(x, dual) {
    const main = x && x.main || [], sub = dual && x && x.sub && x.sub.length && x.sub.some((p) => p.t.trim()) ? x.sub : null;
    return { kind: "flow", main, sub, vn: needVn(main) && FMT.vn !== "off" ? FMT.vn : false };
  }
  function ltOf(x, d, ctx) {
    if (x.f) return ctx.mode === "names" ? { t: "{" + FNAME[x.f] + "}", s: x.s, chip: true } : { t: fieldText(x.f, d, null), s: x.s };
    return { t: x.t || "", s: x.s };
  }
  const phText = (b) => {
    const p = b.src ? phById(b.src) : null;
    return p ? p.t : b.text || "";
  };
  function contentFor(b, d, ctx) {
    const lt = (c2) => {
      if (b.lead) c2.lead = ltOf(b.lead, d, ctx);
      if (b.tail) c2.tail = ltOf(b.tail, d, ctx);
      if (c2.tail && !c2.tail.t && ctx.mode !== "names") delete c2.tail;
      return c2;
    };
    if (b.type === "text") return fitSingle(b, lt({ kind: "text", text: phText(b) }));
    if (ctx.mode === "names") return { c: lt({ kind: "chip", dual: FLOW(b.field) && ctx.dual && b.dual.on }), size: b.size, ovf: false };
    const dual = !!ctx.dual && !!b.dual && b.dual.on;
    if (FLOW(b.field)) return fitSingle(b, lt(flowC(d[b.field], dual)));
    const c = lt({ kind: "text", text: fieldText(b.field, d, b) });
    if (b.field === "verse_ref" && dual && d.ref) {
      const l2 = fmtRefL2(d.ref.bk, d.ref.ch, d.ref.vs);
      if (l2) c.l2 = l2;
    }
    return fitSingle(b, c);
  }
  function panelBg(b) {
    if (b.fill === "gradient") {
      const to = { up: "top", down: "bottom", left: "left", right: "right" }[b.dir] || "top";
      return "linear-gradient(to " + to + "," + rgba(b.color, b.alpha) + " 0%," + rgba(b.color, b.alpha) + " 38%," + rgba(b.color, 0) + " 100%)";
    }
    return rgba(b.color, b.alpha);
  }
  function placeStyle(el, b) {
    el.style.left = b.x / 19.2 + "%";
    el.style.top = b.y / 10.8 + "%";
    el.style.width = b.w / 19.2 + "%";
    el.style.height = b.h / 10.8 + "%";
  }
  function imgIcon() {
    const NS = "http://www.w3.org/2000/svg", s = document.createElementNS(NS, "svg");
    s.setAttribute("viewBox", "0 0 24 24");
    s.setAttribute("aria-hidden", "true");
    ["M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z", "M7 9a2 2 0 1 0 4 0a2 2 0 1 0-4 0", "m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"].forEach((dd) => {
      const p = document.createElementNS(NS, "path");
      p.setAttribute("d", dd);
      s.appendChild(p);
    });
    return s;
  }
  function buildBox(b, c, size, ctx) {
    const el = mk("div", "tpb tpb-" + b.type + (b.nowrap ? " nowrap" : ""));
    placeStyle(el, b);
    if (b.type === "panel") {
      el.style.background = panelBg(b);
      if (b.radius) el.style.borderRadius = "calc(var(--u) * " + b.radius + ")";
      return el;
    }
    if (b.type === "image") {
      el.style.opacity = String((b.alpha == null ? 100 : b.alpha) / 100);
      const url = b.src ? imgUrl(b.src) : null;
      if (url) {
        const im = mk("img");
        im.src = url;
        im.alt = "";
        im.draggable = false;
        im.style.objectFit = b.fit;
        el.append(im);
      } else if (ctx && ctx.ph) {
        el.classList.add("ph");
        el.append(imgIcon(), mk("span", "", b.src ? "불러오는 중" : "이미지·로고"));
      }
      return el;
    }
    if (c && c.kind === "text" && !c.text && !c.l2 && !c.lead && !c.tail && !(ctx && ctx.ph)) return el;
    const inn = mk("div", "tpi va-" + b.valign + " fx-" + b.fx);
    inn.style.fontFamily = fontCss(b.font);
    inn.style.fontSize = "calc(var(--u) * " + size + ")";
    inn.style.fontWeight = b.weight;
    inn.style.color = b.color;
    inn.style.textAlign = b.align;
    if (b.ls) inn.style.letterSpacing = b.ls + "em";
    if (b.lh) inn.style.lineHeight = b.lh;
    if (b.fx === "outline" && b.olw > 0) inn.style.setProperty("--ol", "calc(var(--u) * " + b.olw + ")");
    if (b.bg && b.bg.on && (b.bg.mode === "fit" || b.bg.mode === "full")) {
      inn.classList.add("bar-" + b.bg.mode);
      inn.style.setProperty("--bar", rgba(b.bg.color, b.bg.alpha));
    } else if (b.bg && b.bg.on) {
      inn.classList.add("has-bg");
      inn.style.background = rgba(b.bg.color, b.bg.alpha);
      inn.style.borderRadius = "calc(var(--u) * " + b.bg.radius + ")";
    }
    const tx2 = mk("div", "tpx");
    if (b.padX) tx2.style.paddingLeft = tx2.style.paddingRight = "calc(var(--u) * " + b.padX + ")";
    const ltEl = (x, cls) => {
      const dd = mk("span", cls);
      dd.style.fontSize = x.s + "em";
      dd.append(mk("span", x.chip ? "tpchip" : "tpn", x.t));
      return dd;
    };
    if (c && c.lead) tx2.append(ltEl(c.lead, "tpld"));
    if (!c || c.kind === "text") {
      tx2.append(mk("span", "tpn", c ? c.text : ""));
      if (c && c.l2) {
        const s2 = mk("span", "tpl2i tpn", c.l2);
        s2.style.fontSize = b.dual.size / 100 + "em";
        s2.style.color = b.dual.color;
        tx2.append(s2);
      }
    } else if (c.kind === "chip") {
      tx2.append(mk("span", "tpchip", "{" + FNAME[b.field] + "}"));
      if (c.dual) {
        const w = mk("div", "tpl2");
        w.style.fontSize = b.dual.size / 100 + "em";
        w.style.color = b.dual.color;
        w.append(mk("span", "tpchip", "{서브 언어}"));
        tx2.append(w);
      }
    } else if (c.kind === "flow") {
      const kob = mk("div", "tpk");
      c.main.forEach((p) => {
        const q = mk("p");
        if (c.vn && p.first && p.v != null) q.append(mk("span", c.vn === "in" ? "tpv in" : "tpv", String(p.v)));
        q.append(mk("span", "tpn", p.t));
        kob.append(q);
      });
      tx2.append(kob);
      if (c.sub) {
        const w = mk("div", "tpl2");
        w.style.fontSize = b.dual.size / 100 + "em";
        w.style.color = b.dual.color;
        c.sub.forEach((p) => {
          const q = mk("p");
          q.append(mk("span", "tpn", p.t));
          w.append(q);
        });
        tx2.append(w);
      }
      if (b.field === "body" && b.accent && b.accent.on) {
        tx2.classList.add("acc");
        tx2.style.setProperty("--acc", b.accent.color);
      }
    }
    if (c && c.tail) tx2.append(ltEl(c.tail, "tptl"));
    inn.append(tx2);
    el.append(inn);
    return el;
  }
  function render(stage, tpl, ctx) {
    injectCss();
    const C = ctx.C, d = ctx.d || {};
    let boxes = boxesOf(tpl, C).map((b) => R(b, C));
    if (ctx.nowrap) boxes = boxes.map((b) => b.type === "field" ? Object.assign({}, b, { nowrap: true }) : b);
    if (ctx.key) boxes = boxes.filter((b) => b.type !== "panel" || b.alpha >= 50).map((b) => b.type === "panel" ? Object.assign({}, b, { fill: "solid", alpha: 100 }) : b.bg && b.bg.on ? Object.assign({}, b, { bg: Object.assign({}, b.bg, { alpha: 100 }) }) : b);
    if (ctx.bg === "screen") stage.style.background = C.screen || "#000";
    else if (ctx.bg === "none") stage.style.background = "transparent";
    stage.setAttribute("translate", "no");
    const kids = [], out = { ovf: false, boxes: [] };
    boxes.forEach((b) => {
      let r = b.type === "panel" || b.type === "image" ? { c: null, size: 0, ovf: false } : contentFor(b, d, ctx);
      if (ctx.fix) r = ctx.fix(b, r) || r;
      const el = buildBox(b, r.c, r.size, ctx);
      if (r.ovf && ctx.mark) el.classList.add("ovf");
      if (ctx.onBox) ctx.onBox(el, b, r);
      out.boxes.push({ id: b.id, ovf: r.ovf, size: r.size });
      if (r.ovf) out.ovf = true;
      kids.push(el);
    });
    stage.replaceChildren(...kids);
    return out;
  }
  function mount(host, tpl, ctx, lb) {
    injectCss();
    let st = host.querySelector(":scope > .tps-ov");
    if (!st) {
      st = mk("div", "tps tps-ov");
      st.setAttribute("aria-hidden", "true");
      host.insertBefore(st, host.firstChild);
    }
    st.classList.toggle("tps-lb", !!lb);
    host.classList.toggle("tps-host", !!lb);
    return render(st, tpl, ctx);
  }
  function unmount(host) {
    if (!host) return;
    const st = host.querySelector(":scope > .tps-ov");
    if (st) st.remove();
    if (host.classList.contains("tps-host")) host.classList.remove("tps-host");
  }
  const K = ["어둠이 물러가고 새 아침이 밝아 오니", "깨어 일어나 빛을 바라보라", "들판의 풀잎마다 이슬이 맺히고", "바람이 지나가는 길마다 노래가 머무르니", "듣는 이마다 마음을 열고 감사하리라"];
  const E = ["The darkness fades and a new morning dawns", "Wake and rise, look toward the light", "Dew settles on every blade of grass in the field", "A song lingers on every path the wind goes by", "All who hear will open their hearts and give thanks"];
  const SAMPLES = {
    short: { verse: true, book: "새벽서", ch: 1, units: [{ v: 1, ko: K[0], en: E[0] }, { v: 1, ko: K[1], en: E[1] }] },
    long: { verse: true, book: "새벽서", ch: 3, units: [{ v: 4, ko: K[0], en: E[0] }, { v: 4, ko: K[1], en: E[1] }, { v: 5, ko: K[2], en: E[2] }, { v: 5, ko: K[3], en: E[3] }, { v: 6, ko: K[4], en: E[4] }] },
    multi: { verse: true, book: "새벽서", ch: 2, units: [{ v: 1, ko: K[0], en: E[0], join: true }, { v: 1, ko: K[1], en: E[1] }, { v: 2, ko: K[2], en: E[2], join: true }, { v: 2, ko: K[3], en: E[3] }, { v: 3, ko: K[4], en: E[4] }] },
    song: { verse: false, units: [{ ko: "어둠이 걷히는 이 아침에", en: "As morning breaks upon this day" }, { ko: "주의 빛이 우리를 깨우네", en: "Your light awakens all of us" }] }
  };
  Object.values(SAMPLES).forEach((s) => s.units.forEach((u, i, a) => {
    u.first = i === 0 || a[i - 1].v !== u.v;
  }));
  const FIXED = { song_title: "새벽의 노래", section: "후렴", sermon_title: "빛을 향해 걷는 길", preacher: "김은혜 목사", notice_title: "가을 바자회", notice_body: "10월 18일 토요일 오전 10시\n교육관 1층", service_name: "주일예배" };
  function paras(units, key) {
    const out = [];
    let cur = null;
    units.forEach((u) => {
      const t = u[key] || "";
      if (cur && cur.open) {
        cur.t += key === "en" ? ", " + t.charAt(0).toLowerCase() + t.slice(1) : " " + t;
        cur.open = !!u.join;
      } else {
        cur = { v: u.v, first: !!u.first, t, open: !!u.join };
        out.push(cur);
      }
    });
    return out.map((p) => ({ v: p.v, first: p.first, t: p.t }));
  }
  const flowOf = (units, swap) => ({ main: paras(units, swap ? "en" : "ko"), sub: paras(units, swap ? "ko" : "en") });
  function combos(n, k, start, acc, out) {
    start = start || 1;
    acc = acc || [];
    out = out || [];
    if (acc.length === k) {
      out.push(acc.slice());
      return out;
    }
    for (let i = start; i <= n; i++) {
      acc.push(i);
      combos(n, k, i + 1, acc, out);
      acc.pop();
    }
    return out;
  }
  function measLT(b) {
    const o = {};
    const t = (x) => x.f ? x.f === "verse_ref" ? fmtRef(BOOK, 3, [4, 6]) : x.f === "date" ? fmtDate(DAY) : FIXED[x.f] || "" : x.t || "";
    if (b.lead) o.lead = { t: t(b.lead), s: b.lead.s };
    if (b.tail) o.tail = { t: t(b.tail), s: b.tail.s };
    return o;
  }
  const flowM = (b, units, dual, swap) => Object.assign(flowC(flowOf(units, swap), dual), measLT(b));
  function splitGroup(b, g, dual, minS, swap) {
    const n = g.length;
    if (n <= 1) return [g];
    for (let N = 2; N <= n; N++) {
      let best = null, bestScore = Infinity;
      combos(n - 1, N - 1).forEach((cuts) => {
        const parts = [];
        let s = 0;
        cuts.concat([n]).forEach((cc) => {
          parts.push(g.slice(s, cc));
          s = cc;
        });
        if (!parts.every((p) => fits(b, flowM(b, p, dual, swap), minS))) return;
        const lens = parts.map((p) => p.length);
        const inVerse = cuts.filter((cc) => g[cc - 1].v != null && g[cc - 1].v === g[cc].v).length;
        const score = Math.max(...lens) - Math.min(...lens) + 2 * inVerse;
        if (score < bestScore) {
          best = parts;
          bestScore = score;
        }
      });
      if (best) return best;
    }
    return g.map((u) => [u]);
  }
  function paginate(b, units, dual, field, swap) {
    const S0 = b.size, minS = b.over.shrink ? Math.min(b.over.min, S0) : S0;
    let groups, rule = null;
    if (dual && field === "lyrics") {
      groups = units.map((u) => [u]);
      rule = "line";
    } else if (dual && field === "body") {
      groups = [];
      units.forEach((u) => {
        const last = groups[groups.length - 1];
        if (last && last[0].v === u.v) last.push(u);
        else groups.push([u]);
      });
      rule = "verse";
    } else groups = [units];
    const sizes = groups.map((g) => bestSize(b, flowM(b, g, dual, swap), S0, minS));
    if (sizes.every((s) => s != null)) {
      const size2 = Math.min(...sizes);
      return { pages: groups, size: size2, shrunk: size2 < S0, split: false, overflow: false, rule };
    }
    if (!b.over.split) return { pages: groups, size: minS, shrunk: minS < S0, split: false, overflow: true, rule };
    const pages = [];
    groups.forEach((g, i) => {
      if (sizes[i] != null) pages.push(g);
      else pages.push(...splitGroup(b, g, dual, minS, swap));
    });
    const ps = pages.map((p) => bestSize(b, flowM(b, p, dual, swap), S0, minS));
    const ok = ps.every((s) => s != null);
    const size = ok ? Math.min(...ps) : minS;
    return { pages, size, shrunk: size < S0, split: true, overflow: !ok, rule };
  }
  const pageCache = /* @__PURE__ */ new Map();
  function samplePage(tpl, C, sk, dual, page) {
    const sample = SAMPLES[sk] || SAMPLES.short;
    const vKey = sample.verse ? sk : "short";
    const verseSample = SAMPLES[vKey];
    const primaryField = sample.verse ? "body" : "lyrics";
    const boxes = boxesOf(tpl, C).map((b) => R(b, C));
    const pbox = boxes.find((b) => b.type === "field" && b.field === primaryField) || null;
    let L = null;
    if (pbox) {
      const dd = !!dual && pbox.dual.on;
      const sKey = primaryField === "body" ? vKey : SAMPLES[sk] && !SAMPLES[sk].verse ? sk : "song";
      const key = styleKey(pbox) + "|" + sKey + "|" + dd + "|" + FMT.vn + "|" + C.swap;
      L = pageCache.get(key);
      if (!L) {
        L = paginate(pbox, SAMPLES[sKey].units, dd, primaryField, C.swap);
        if (pageCache.size > 400) pageCache.clear();
        pageCache.set(key, L);
      }
    }
    const nPages = L ? L.pages.length : 1;
    const pg = clamp(page || 0, 0, nPages - 1);
    const pageUnits = L ? L.pages[pg] : null;
    const vUnits = primaryField === "body" && pageUnits ? pageUnits : verseSample.units;
    const vs = [...new Set(vUnits.map((u) => u.v))];
    const bodyUnits = primaryField === "body" && pageUnits ? pageUnits : verseSample.units;
    const lyrUnits = primaryField === "lyrics" && pageUnits ? pageUnits : SAMPLES.song.units;
    const d = Object.assign({}, FIXED, {
      lyrics: flowOf(lyrUnits, C.swap),
      body: flowOf(bodyUnits, C.swap),
      ref: { bk: BOOK, ch: verseSample.ch, vs },
      date: DAY
    });
    return { d, L, pbox, primaryField, nPages, pg };
  }
  let DBN = "chanyang-jamak:tpl";
  const IMG = /* @__PURE__ */ new Map(), IMG_WAIT = /* @__PURE__ */ new Map();
  let dbP = null;
  function db() {
    if (dbP) return dbP;
    dbP = new Promise((res, rej) => {
      try {
        if (!window.indexedDB) {
          rej(new Error("noidb"));
          return;
        }
        const rq = indexedDB.open(DBN, 1);
        rq.onupgradeneeded = () => {
          const d = rq.result;
          if (!d.objectStoreNames.contains("img")) d.createObjectStore("img", { keyPath: "id" });
        };
        rq.onsuccess = () => res(rq.result);
        rq.onerror = () => rej(rq.error || new Error("idb"));
        rq.onblocked = () => rej(new Error("blocked"));
      } catch (e) {
        rej(e);
      }
    });
    dbP.catch(() => {
      dbP = null;
    });
    return dbP;
  }
  function tx(mode, fn) {
    return db().then((d) => new Promise((res, rej) => {
      let t;
      try {
        t = d.transaction("img", mode);
      } catch (e) {
        rej(e);
        return;
      }
      const s = t.objectStore("img");
      let out;
      try {
        out = fn(s);
      } catch (e) {
        rej(e);
        return;
      }
      t.oncomplete = () => res(out && "result" in out ? out.result : out);
      t.onerror = () => rej(t.error || new Error("tx"));
      t.onabort = () => rej(t.error || new Error("abort"));
    }));
  }
  function imgUrl(id) {
    if (!id) return null;
    if (IMG.has(id)) return IMG.get(id);
    if (!IMG_WAIT.has(id)) {
      IMG_WAIT.set(id, tx("readonly", (s) => s.get(id)).then((r) => {
        IMG.set(id, r && typeof r.data === "string" ? r.data : null);
        emit("img");
      }).catch(() => {
        IMG.set(id, null);
      }));
    }
    return null;
  }
  function imgLoad(ids) {
    return Promise.all([...new Set(ids.filter(Boolean))].map((id) => {
      imgUrl(id);
      return IMG_WAIT.get(id) || Promise.resolve();
    }));
  }
  function imgPut(file) {
    return new Promise((res, rej) => {
      if (!file || !/^image\/(png|jpe?g|gif|webp|svg\+xml)$/.test(file.type || "")) {
        rej(new Error("type"));
        return;
      }
      if (file.size > 25 * 1024 * 1024) {
        rej(new Error("big"));
        return;
      }
      const url = URL.createObjectURL(file), im = new Image();
      im.onload = () => {
        try {
          const W0 = im.naturalWidth || 1920, H0 = im.naturalHeight || 1080, k = Math.min(1, 1920 / W0, 1080 / H0);
          const cv = document.createElement("canvas");
          cv.width = Math.max(1, Math.round(W0 * k));
          cv.height = Math.max(1, Math.round(H0 * k));
          cv.getContext("2d").drawImage(im, 0, 0, cv.width, cv.height);
          URL.revokeObjectURL(url);
          const png = /png|gif|webp|svg/.test(file.type);
          const data = cv.toDataURL(png ? "image/png" : "image/jpeg", 0.9);
          const id = "img_" + Math.random().toString(36).slice(2, 12);
          tx("readwrite", (s) => s.put({ id, data, name: String(file.name || "").slice(0, 120), at: Date.now() })).then(() => {
            IMG.set(id, data);
            res(id);
            emit("img");
          }).catch((e) => rej(e && e.name === "QuotaExceededError" ? new Error("quota") : new Error("idb")));
        } catch (e) {
          URL.revokeObjectURL(url);
          rej(new Error("read"));
        }
      };
      im.onerror = () => {
        URL.revokeObjectURL(url);
        rej(new Error("read"));
      };
      im.src = url;
    });
  }
  const IMG_MSG = { type: "그림 파일(PNG, JPG, GIF, WEBP, SVG)만 넣을 수 있어요", big: "파일이 너무 커요. 25MB보다 작은 그림을 골라 주세요", read: "그림을 읽지 못했어요", quota: "저장 공간이 부족해서 그림을 넣지 못했어요", idb: "이 브라우저에서는 그림을 저장할 수 없어요. 개인 정보 보호 창이면 일반 창에서 열어 주세요" };
  const imgMsg = (e) => IMG_MSG[e && e.message] || IMG_MSG.idb;
  function hx(c) {
    return String(c || "#000000").replace("#", "").slice(0, 6).toUpperCase();
  }
  function pptAdd(pptx, slide, tpl, ctx) {
    const C = ctx.C, d = ctx.d || {}, IN = 13.333 / 1920;
    const pos = (b) => ({ x: b.x * IN, y: b.y * IN, w: b.w * IN, h: b.h * IN });
    boxesOf(tpl, C).map((b) => R(b, C)).forEach((b) => {
      if (b.type === "panel") {
        const o2 = Object.assign(pos(b), { fill: { color: hx(b.color), transparency: Math.round(100 - b.alpha * (b.fill === "gradient" ? 0.75 : 1)) }, line: { color: hx(b.color), transparency: 100 } });
        if (b.radius) {
          o2.rectRadius = Math.min(b.radius * IN, Math.min(b.w, b.h) * IN / 2);
          slide.addShape(pptx.ShapeType.roundRect, o2);
        } else slide.addShape(pptx.ShapeType.rect, o2);
        return;
      }
      if (b.type === "image") {
        const data = b.src ? IMG.get(b.src) : null;
        if (!data) return;
        const o2 = Object.assign(pos(b), { data, sizing: { type: b.fit === "cover" ? "cover" : "contain", w: b.w * IN, h: b.h * IN } });
        if (b.alpha < 100) o2.transparency = 100 - b.alpha;
        slide.addImage(o2);
        return;
      }
      const r = contentFor(b, d, ctx), c = r.c, pt = Math.max(6, Math.round(r.size * 0.5 * 10) / 10);
      const runs = [], base = { color: hx(b.color), bold: b.weight >= 600 };
      const add = (text, o2) => runs.push({ text, options: Object.assign({}, base, o2 || {}) });
      const brk = () => {
        if (runs.length) runs[runs.length - 1].options.breakLine = true;
      };
      if (c.lead && c.lead.t) {
        add(c.lead.t, { fontSize: Math.max(6, pt * c.lead.s) });
        brk();
      }
      if (c.kind === "text") {
        if (c.text) add(c.text, { fontSize: pt });
        if (c.l2) add("  " + c.l2, { fontSize: Math.max(6, pt * b.dual.size / 100), color: hx(b.dual.color) });
      } else if (c.kind === "flow") {
        c.main.forEach((p, i) => {
          if (i) brk();
          if (c.vn && p.first && p.v != null) add(String(p.v) + " ", { fontSize: Math.max(6, pt * (c.vn === "in" ? 0.78 : 0.56)) });
          add(p.t, { fontSize: pt, color: i === 0 && b.field === "body" && b.accent && b.accent.on ? hx(b.accent.color) : base.color });
        });
        if (c.sub) c.sub.forEach((p) => {
          brk();
          add(p.t, { fontSize: Math.max(6, pt * b.dual.size / 100), color: hx(b.dual.color), bold: false });
        });
      }
      if (c.tail && c.tail.t) {
        brk();
        add(c.tail.t, { fontSize: Math.max(6, pt * c.tail.s) });
      }
      if (!runs.length) return;
      const o = Object.assign(pos(b), { fontFace: "Malgun Gothic", fontSize: pt, align: b.align, valign: b.valign === "top" ? "top" : b.valign === "bot" ? "bottom" : "middle", margin: 0, color: hx(b.color), bold: b.weight >= 600, lineSpacingMultiple: 1.15 });
      if (b.bg && b.bg.on) o.fill = { color: hx(b.bg.color), transparency: Math.round(100 - b.bg.alpha) };
      if (b.fx === "shadow") o.shadow = { type: "outer", color: "000000", opacity: 0.7, blur: 5, offset: 2, angle: 90 };
      if (b.fx === "outline") {
        const ol = { size: Math.round(Math.min(pt * 0.2, Math.max(0.25, (b.olw > 0 ? b.olw / r.size : 0.04) * pt)) * 100) / 100, color: "000000" };
        o.outline = ol;
        runs.forEach((x) => {
          x.options.outline = ol;
        });
      }
      slide.addText(runs, o);
    });
  }
  const SUBS = /* @__PURE__ */ new Set();
  function emit(why) {
    SUBS.forEach((f) => {
      try {
        f(why);
      } catch (e) {
      }
    });
  }
  const on = (f) => {
    SUBS.add(f);
    return () => SUBS.delete(f);
  };
  try {
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {
        fitCache.clear();
        pageCache.clear();
        emit("fonts");
      });
      document.fonts.addEventListener && document.fonts.addEventListener("loadingdone", () => {
        fitCache.clear();
        pageCache.clear();
        emit("fonts");
      });
    }
  } catch (e) {
  }
  function init(o) {
    o = o || {};
    if (typeof o.kp === "string") KP = o.kp;
    if (typeof o.db === "string") DBN = o.db;
    ST = null;
    ST_RAW = null;
    load(true);
    if (document.body) measEl();
  }
  function setFmt(k, v) {
    if (FMT_OK[k] && FMT_OK[k].includes(v)) {
      FMT[k] = v;
      fitCache.clear();
      pageCache.clear();
    }
  }
  function setPh(list, seq) {
    PH = normPh(list);
    if (seq) phSeq = Math.max(phSeq, seq);
    fitCache.clear();
  }
  const clearCache = () => {
    fitCache.clear();
    pageCache.clear();
  };
  window.Tpl = {
    VER,
    COLORS,
    FONTS,
    fontCss,
    fontOk,
    WNAME,
    KINDS,
    KNAME,
    EDIT_KINDS,
    FIELDS,
    FNAME,
    FIELD_GROUPS,
    FHINT,
    FLOW,
    REF_KEYS,
    SEP_KEYS,
    LANG_KEYS,
    VN_KEYS,
    DATE_KEYS,
    VN_NAME,
    VN_SHORT,
    FMT_DEF,
    FMT,
    BOOK,
    BOOK_EX,
    DAY,
    SAMPLES,
    FIXED,
    BASE_NAME,
    BUILT_IDS,
    FRAME_IDS,
    frameOf,
    frames,
    T,
    F,
    P,
    I,
    TBG,
    OWN_KEYS,
    builtin,
    builtins,
    baseTpl,
    isBase,
    baseBoxes: (kind, C) => BASE_BOXES[kind](C),
    boxesOf,
    normBox,
    normTpl,
    normFmt,
    normPh,
    init,
    load,
    save,
    listOf,
    byId,
    churchDefault,
    nameOf,
    keyOf,
    get PH() {
      return PH;
    },
    get phSeq() {
      return phSeq;
    },
    set phSeq(v) {
      phSeq = Math.max(phSeq, +v || 0);
    },
    phById,
    phText,
    setPh,
    setFmt,
    fmtRef,
    fmtRefL2,
    fmtDate,
    exRef,
    vrange,
    hasOwnFmt,
    fieldText,
    commonOf,
    R,
    isTx,
    ownOf,
    contentFor,
    fits,
    bestSize,
    fitSingle,
    paginate,
    samplePage,
    flowOf,
    paras,
    clearCache,
    buildBox,
    render,
    mount,
    unmount,
    placeStyle,
    panelBg,
    rgba,
    injectCss,
    imgUrl,
    imgLoad,
    imgPut,
    imgMsg,
    pptAdd,
    on,
    emit,
    eul,
    ro,
    lastJong,
    rid,
    clamp,
    deep,
    mk
  };
})();

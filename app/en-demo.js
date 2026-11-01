/* Duet Slides (English edition): the first visit starts with the public domain sample songs,
   so a judge or a new church sees real slides instead of an empty song.
   Runs once per browser, and only if the setlist is still the untouched empty one.
   Uses globals from index.html: STATE, VIEW, BOARD, SAMPLE_TXT, parseImportText, pushState, selectSong. */
(function () {
  "use strict";
  const KEY = "duet:seeded";
  const SRC = { "Amazing Grace": "Public domain · John Newton, 1779", "Holy, Holy, Holy": "Public domain · Reginald Heber, 1826",
    "It Is Well with My Soul": "Public domain · Horatio G. Spafford, 1873", "Blessed Assurance": "Public domain · Fanny Crosby, 1873",
    "Doxology": "Public domain · Thomas Ken, c. 1674" };
  try {
    if (VIEW !== "control" || BOARD || localStorage.getItem(KEY)) return;
    const s = STATE.songs || [], first = s[0] || {};
    const untouched = s.length <= 1 && !(first.slides || []).length && !String(first.title || "").trim() && !String(first.draft || "").trim();
    localStorage.setItem(KEY, "1");
    if (!untouched) return;
    const songs = parseImportText(SAMPLE_TXT, "hash", [], false);
    if (!songs.length) return;
    songs.forEach(so => { if (SRC[so.title]) so.ccli = SRC[so.title]; });
    STATE.songs = songs; SEL_SONG = 0;
    pushState(true); selectSong(0, true);
  } catch (e) { console.warn("demo seed skipped:", e && e.message); }
})();

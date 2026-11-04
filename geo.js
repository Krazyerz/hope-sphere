/* Small helpers + country coordinates (lat, lon). A real server would geocode countries itself. */
const $ = id => document.getElementById(id);
const el = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt) e.textContent = txt; return e; };

const COORDS = {
  Argentina:[-34,-64], Australia:[-25,134], Bangladesh:[24,90], Brazil:[-10,-52], Canada:[56,-106], Chile:[-33,-71],
  China:[35,104], Colombia:[4,-73], Egypt:[27,30], Ethiopia:[9,40], France:[46,2], Germany:[51,10], Ghana:[8,-1],
  Greece:[39,22], India:[22,79], Indonesia:[-2,118], Ireland:[53,-8], Italy:[42,13], Japan:[36,138], Kenya:[0,38],
  Malaysia:[4,102], Mexico:[23,-102], Morocco:[32,-6], Nepal:[28,84], Netherlands:[52,5], "New Zealand":[-41,174],
  Nigeria:[9,8], Norway:[61,9], Pakistan:[30,69], Peru:[-10,-76], Philippines:[13,122], Poland:[52,20], Portugal:[39,-8],
  Singapore:[1,104], "South Africa":[-30,25], "South Korea":[36,128], Spain:[40,-4], Sweden:[62,15], Thailand:[15,101],
  Turkey:[39,35], Uganda:[1,32], Ukraine:[49,32], "United Kingdom":[54,-2], "United States":[39,-98], Vietnam:[16,108]
};
const _lc = Object.fromEntries(Object.entries(COORDS).map(([k, v]) => [k.toLowerCase(), v]));
function geo(name) {                       // country name -> [lat, lon]; unknown names get a stable made-up spot
  if (Array.isArray(name)) return name;
  const n = (name || "").trim().toLowerCase();
  if (_lc[n]) return _lc[n];
  let h = 0; for (const ch of n || "earth") h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return [-35 + (h % 90), -165 + ((h >>> 8) % 330)];
}
function km(a, b) {                        // haversine distance
  const r = Math.PI / 180, [la1, lo1] = geo(a), [la2, lo2] = geo(b);
  const h = Math.sin((la2 - la1) * r / 2) ** 2 + Math.cos(la1 * r) * Math.cos(la2 * r) * Math.sin((lo2 - lo1) * r / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(h));
}
function fmtDur(ms) {
  const s = Math.max(0, Math.round(ms / 1000));
  return s >= 60 ? Math.floor(s / 60) + "m " + String(s % 60).padStart(2, "0") + "s" : s + "s";
}
const fmtDate = iso => new Date(iso).toLocaleDateString(document.documentElement.lang === "ms" ? "ms-MY" : "en-GB", { day: "2-digit", month: "short", year: "numeric" }).toUpperCase();

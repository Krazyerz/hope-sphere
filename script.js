/* ==========================================================================
   BACKEND CONTRACT (what the real server should implement later)
   POST /api/letters         body {name, country, text}  -> 201 {id, deliveredTo}
   GET  /api/letters/random  ?exclude=<id,id,...>        -> 200 {id, name, country, text} | 204
   Rules enforced server side too: text 1-80 words, name <= 30 chars, country <= 56 chars
   (letters, spaces, . ' - only), strip HTML, rate limit per IP, never return a letter
   to its author. Optional: prefer delivering to a different country than the sender's.
   To go online, replace the bodies of api.sendLetter / api.getRandomLetter with fetch().
   ========================================================================== */

const MAX_WORDS = 80, MAX_NAME = 30, MAX_COUNTRY = 56;
const wordCount = s => s.trim().split(/\s+/).filter(Boolean).length;
const delay = ms => new Promise(r => setTimeout(r, ms));
const pick = a => a[Math.floor(Math.random() * a.length)];

const store = {
  mem: {},
  get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return this.mem[k] ?? d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { this.mem[k] = v; } }
};

const COUNTRIES = ["Argentina","Australia","Bangladesh","Brazil","Canada","Chile","China","Colombia","Egypt","Ethiopia","France","Germany","Ghana","Greece","India","Indonesia","Ireland","Italy","Japan","Kenya","Malaysia","Mexico","Morocco","Nepal","Netherlands","New Zealand","Nigeria","Norway","Pakistan","Peru","Philippines","Poland","Portugal","Singapore","South Africa","South Korea","Spain","Sweden","Thailand","Turkey","Uganda","Ukraine","United Kingdom","United States","Vietnam"];

const SEED = [
  { id: "s1", name: "Amara", country: "Kenya", text: "I don't know you, but I know that tough weeks end. Last year I thought I would never laugh again. Yesterday a stranger's dog stole my sandwich and I laughed until I cried. Good things arrive sideways. Keep the door open for them." },
  { id: "s2", name: "Kenji", country: "Japan", text: "If today was heavy, put it down for the night. You carried it well. Tomorrow you only need to carry the next small thing. The tea is hot, the sky keeps changing, and you are still here. That counts for a lot." },
  { id: "s3", name: "Marta", country: "Portugal", text: "My grandmother used to say that hope is just remembering that the sun has never skipped a morning. I think of that when I cannot sleep. Wherever you are reading this, the light is already on its way to you." },
  { id: "s4", name: "Anonymous", country: "Canada", text: "I failed my exam twice. Then I passed. Nobody remembers the failures but me, and even I only remember them as the part of the story where I kept going. Your story is also not finished." },
  { id: "s5", name: "Priya", country: "India", text: "Plant something small today, even a seed in a cup. It will not care how your week went. It will just grow toward the light, and quietly remind you that you can do the same." },
  { id: "s6", name: "Tomas", country: "Malaysia", text: "I am writing this on a rainy evening with the window open. Whatever you are worried about, I hope someone sits with you soon. And if no one does, I am sitting with you right now, in this letter." },
  { id: "s7", name: "Léa", country: "France", text: "You do not have to be brave all day. Just brave for the next minute. Then do it again. That is how everyone I admire got through their hardest years. Slowly, and with a lot of snacks." },
  { id: "s8", name: "Joon", country: "South Korea", text: "Somebody out there is glad you exist and has never told you. I am telling you on their behalf. Please be gentle with yourself this week." }
];
const PLACES = ["a quiet town in Norway", "a city in Brazil", "a village in Nepal", "a ferry in Greece", "an apartment in Egypt", "a farm in New Zealand", "a library in Chile"];
let seen = [];

const api = {
  async sendLetter({ name, country, text }) {
    await delay(900);                                   // simulated network
    const n = wordCount(text);
    if (n < 1 || n > MAX_WORDS) throw new Error("Letters need 1 to " + MAX_WORDS + " words.");
    country = country.trim().slice(0, MAX_COUNTRY);
    if (!/^[\p{L} .'\-]*$/u.test(country)) throw new Error("Please enter a valid country name.");
    const letter = {
      id: "u" + Date.now().toString(36),
      name: name.trim().slice(0, MAX_NAME) || "Anonymous",
      country: country || "somewhere on Earth",
      text: text.trim(), createdAt: Date.now()
    };
    const outbox = store.get("outbox", []); outbox.push(letter); store.set("outbox", outbox);
    return { id: letter.id, deliveredTo: pick(PLACES) };
  },
  async getRandomLetter() {
    await delay(700);
    let pool = SEED.filter(l => !seen.includes(l.id));
    if (!pool.length) { seen = []; pool = SEED; }
    const l = pick(pool); seen.push(l.id);
    return l;
  }
};

/* ---------- UI ---------- */
const $ = id => document.getElementById(id);
const nameEl = $("name"), countryEl = $("country"), textEl = $("text"), countEl = $("count"), sendEl = $("send"), statusEl = $("sendStatus");
COUNTRIES.forEach(c => { const o = document.createElement("option"); o.value = c; $("countries").append(o); });

function showTab(which) {
  ["write", "read"].forEach(k => { $(k).hidden = k !== which; $("tab-" + k).setAttribute("aria-selected", String(k === which)); });
}
$("tab-write").onclick = () => showTab("write");
$("tab-read").onclick = () => { showTab("read"); if (!$("letterBox").querySelector(".letter-text")) openLetter(); };

textEl.addEventListener("input", () => {
  const n = wordCount(textEl.value);
  countEl.textContent = n + " / " + MAX_WORDS + " words";
  countEl.classList.toggle("over", n > MAX_WORDS);
  sendEl.disabled = n < 1 || n > MAX_WORDS;
});

sendEl.onclick = async () => {
  sendEl.disabled = true; statusEl.textContent = "Folding your letter...";
  try {
    const res = await api.sendLetter({ name: nameEl.value, country: countryEl.value, text: textEl.value });
    globe.pulse();
    statusEl.textContent = "Your letter is travelling to " + res.deliveredTo + ".";
    textEl.value = ""; textEl.dispatchEvent(new Event("input"));
  } catch (e) { statusEl.textContent = e.message; sendEl.disabled = false; }
};

async function openLetter() {
  const btn = $("open"); btn.disabled = true; btn.textContent = "Looking...";
  const l = await api.getRandomLetter();
  const box = $("letterBox"); box.innerHTML = ""; box.classList.add("letter");
  const p = document.createElement("p"); p.className = "letter-text"; p.textContent = l.text;   // textContent: no HTML injection
  const f = document.createElement("footer"); f.textContent = "with hope, " + l.name + ", " + l.country;
  box.append(p, f);
  box.style.animation = "none"; void box.offsetWidth; box.style.animation = "";
  globe.pulse();
  btn.disabled = false; btn.textContent = "Open another";
}
$("open").onclick = openLetter;

/* ---------- Cartoon globe ----------
   Land is painted once onto a flat map texture (longitude x latitude). Each frame,
   every pixel of the sphere looks up its own spot on that map, so the green can
   never leak or stretch across the globe when it rotates. */
const globe = (() => {
  const cv = $("globe"), ctx = cv.getContext("2d"), S = 260, dpr = Math.min(devicePixelRatio || 1, 2);
  cv.width = cv.height = S * dpr; ctx.scale(dpr, dpr);
  const slow = matchMedia("(prefers-reduced-motion: reduce)").matches ? .2 : 1;
  const INK = "#1c2742", TILT = -.4, cT = Math.cos(TILT), sT = Math.sin(TILT);
  const land = [
    [[-168,66],[-140,70],[-95,72],[-80,63],[-62,58],[-55,48],[-70,43],[-76,35],[-81,25],[-97,26],[-97,18],[-87,21],[-83,10],[-78,8],[-92,14],[-105,20],[-115,30],[-124,40],[-125,49],[-135,58],[-165,60]],
    [[-78,8],[-62,10],[-50,0],[-35,-6],[-40,-22],[-48,-28],[-58,-38],[-66,-46],[-72,-54],[-75,-45],[-71,-30],[-70,-18],[-81,-5]],
    [[-10,36],[-9,43],[-2,48],[5,53],[10,58],[25,70],[60,70],[100,77],[140,72],[180,66],[160,58],[142,52],[135,35],[122,30],[122,22],[108,20],[105,10],[100,2],[98,16],[88,22],[80,10],[73,20],[58,25],[48,30],[36,36],[27,37],[20,40],[12,38],[3,43]],
    [[-17,15],[-10,35],[10,37],[32,31],[43,12],[51,12],[40,-5],[40,-16],[33,-27],[20,-35],[14,-22],[9,-1],[-8,4]],
    [[114,-22],[130,-12],[142,-11],[153,-26],[147,-39],[135,-34],[115,-34]]
  ];
  // 1. paint the flat map once
  const TW = 1024, TH = 512, tex = document.createElement("canvas");
  tex.width = TW; tex.height = TH;
  const tc = tex.getContext("2d");
  tc.beginPath();
  land.forEach(poly => { poly.forEach((p, i) => { const x = (p[0] + 180) / 360 * TW, y = (90 - p[1]) / 180 * TH; i ? tc.lineTo(x, y) : tc.moveTo(x, y); }); tc.closePath(); });
  tc.fillStyle = "#9cc08a"; tc.fill();
  tc.lineWidth = 6; tc.lineJoin = "round"; tc.strokeStyle = INK; tc.stroke();
  const td = tc.getImageData(0, 0, TW, TH).data;
  // 2. precompute, for every pixel of the sphere, where it sits on the map
  const R = 78, c = S / 2, D = R * 4, half = D / 2;          // drawn at 2x then scaled down for smooth edges
  const gc = document.createElement("canvas"); gc.width = gc.height = D;
  const gx = gc.getContext("2d"), img = gx.createImageData(D, D), d = img.data;
  const idx = [], base = new Float32Array(D * D), row = new Int16Array(D * D), shade = new Float32Array(D * D);
  for (let j = 0; j < D; j++) for (let i = 0; i < D; i++) {
    const nx = (i + .5 - half) / half, ny = -(j + .5 - half) / half, r2 = nx * nx + ny * ny;
    if (r2 > 1) continue;
    const z = Math.sqrt(1 - r2), y = ny * cT + z * sT, zz = -ny * sT + z * cT, k = j * D + i;
    base[k] = Math.atan2(nx, zz);
    row[k] = Math.min(TH - 1, Math.max(0, Math.floor((.5 - Math.asin(y) / Math.PI) * TH)));
    shade[k] = (nx * .6 - ny * .4 > .4) ? .84 : 1;
    idx.push(k);
  }
  const OC = [111, 168, 199];
  let rings = [];
  function envelope(x, y, s) {
    ctx.lineWidth = 2.5; ctx.strokeStyle = INK; ctx.fillStyle = "#f6eedb"; ctx.lineJoin = "round";
    ctx.beginPath(); ctx.roundRect(x - s, y - s * .68, s * 2, s * 1.36, 3); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x - s, y - s * .68); ctx.lineTo(x, y + s * .1); ctx.lineTo(x + s, y - s * .68); ctx.stroke();
  }
  function draw(ms) {
    const t = ms / 1000 * slow, off = t * .3 / (2 * Math.PI);
    ctx.clearRect(0, 0, S, S);
    const ea = t * .7, ex = Math.cos(ea) * R * 1.45, ez = Math.sin(ea), ey = -Math.cos(ea) * R * .35 + Math.sin(ea) * R * .3;
    if (ez < 0) envelope(c + ex, c + ey, 11);
    for (let n = 0; n < idx.length; n++) {
      const k = idx[n];
      let u = base[k] / 6.283185 + .5 - off; u -= Math.floor(u);
      const ti = (row[k] * TW + ((u * TW) | 0)) * 4, a = td[ti + 3] / 255, s = shade[k], o = k * 4;
      d[o] = (OC[0] * (1 - a) + td[ti] * a) * s;
      d[o + 1] = (OC[1] * (1 - a) + td[ti + 1] * a) * s;
      d[o + 2] = (OC[2] * (1 - a) + td[ti + 2] * a) * s;
      d[o + 3] = 255;
    }
    gx.putImageData(img, 0, 0);
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(gc, c - R, c - R, R * 2, R * 2);
    ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.beginPath(); ctx.arc(c, c, R, 0, 6.283); ctx.stroke();
    ctx.lineWidth = 3.5; ctx.strokeStyle = "rgba(255,255,255,.7)"; ctx.lineCap = "round";
    ctx.beginPath(); ctx.arc(c, c, R * .8, Math.PI * 1.08, Math.PI * 1.3); ctx.stroke();
    if (ez >= 0) envelope(c + ex, c + ey, 11);
    rings = rings.filter(r => (r.t += .012) < 1);
    rings.forEach(r => { ctx.strokeStyle = "rgba(233,184,114," + (1 - r.t) + ")"; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(c, c, R * (1.08 + r.t * .4), 0, 6.283); ctx.stroke(); });
    requestAnimationFrame(draw);
  }
  requestAnimationFrame(draw);
  return { pulse() { rings.push({ t: 0 }); } };
})();

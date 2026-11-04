/* ==========================================================================
   BACKEND CONTRACT (what the real server should implement later)
   POST /api/letters           body {name, country, text, stamp}
                               -> 201 {id, deliveredTo, reply:{id, from, to, sentAt, arriveAt}}
   GET  /api/letters/random    -> 200 {id, name, country, text, stamp, date} | 204
   GET  /api/inbox             -> 200 [{id, from, to, sentAt, arriveAt, status: transit|landed|read}]
   POST /api/inbox/:id/read    -> 200 letter
   SLOW MAIL: when a letter is sent, the server schedules a reply letter from a stranger.
     arriveAt = sentAt + 30s + distanceKm / 40 seconds   (the demo toggle divides this by 15)
   Rules enforced server side too: text 1-80 words, name <= 30, country <= 56 chars
   (letters, spaces, . ' - only), stamp from a fixed list, strip HTML, rate limit per IP,
   never return a letter to its author, prefer a different country than the sender's.
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
let seen = [];

const STAMPS = [{ id: "coral", c: "#d98a7a" }, { id: "amber", c: "#e9b872" }, { id: "sea", c: "#6fa8c7" }, { id: "sage", c: "#9cc08a" }, { id: "lilac", c: "#b7a6d9" }];
const stampColor = id => (STAMPS.find(x => x.id === id) || STAMPS[0]).c;
SEED.forEach((l, i) => { l.date = "2026-10-" + String(5 + i * 3).padStart(2, "0"); l.stamp = STAMPS[i % 5].id; });

let DEMO = true;                                         // demo speed: mail arrives 15x faster
const mailDelay = (from, to) => { const ms = 30000 + km(from, to) / 40 * 1000; return DEMO ? ms / 15 : ms; };

const glow = {};                                         // country -> how many letters it has sent (drives the glowing dots)
SEED.forEach(l => glow[l.country] = (glow[l.country] || 0) + 2);
const _g = store.get("glow", {}); for (const k in _g) glow[k] = (glow[k] || 0) + _g[k];
function addGlow(c) { glow[c] = (glow[c] || 0) + 1; const m = store.get("glow", {}); m[c] = (m[c] || 0) + 1; store.set("glow", m); }

const api = {
  async sendLetter({ name, country, text, stamp }) {
    await delay(900);                                   // simulated network
    const n = wordCount(text);
    if (n < 1 || n > MAX_WORDS) throw new Error("Letters need 1 to " + MAX_WORDS + " words.");
    country = country.trim().slice(0, MAX_COUNTRY);
    if (!/^[\p{L} .'\-]*$/u.test(country)) throw new Error("Please enter a valid country name.");
    const letter = {
      id: "u" + Date.now().toString(36), name: name.trim().slice(0, MAX_NAME) || "Anonymous",
      country: country || "somewhere on Earth", text: text.trim(),
      stamp: STAMPS.some(x => x.id === stamp) ? stamp : "coral", date: new Date().toISOString().slice(0, 10)
    };
    const outbox = store.get("outbox", []); outbox.push(letter); store.set("outbox", outbox);
    const deliveredTo = pick(COUNTRIES.filter(c => c !== country));
    // schedule the letter you will receive in return
    let pool = SEED.filter(l => l.country !== country && !seen.includes(l.id));
    if (!pool.length) { seen = []; pool = SEED.filter(l => l.country !== country); }
    const r = pick(pool.length ? pool : SEED); seen.push(r.id);
    const now = Date.now(), to = country || "somewhere on Earth";
    const reply = { id: "m" + now.toString(36), letterId: r.id, from: r.country, to, sentAt: now, arriveAt: now + mailDelay(r.country, to), read: false };
    const inbox = store.get("inbox", []); inbox.push(reply); store.set("inbox", inbox);
    return { id: letter.id, deliveredTo, reply };
  },
  async getRandomLetter() {
    await delay(700);
    let pool = SEED.filter(l => !seen.includes(l.id));
    if (!pool.length) { seen = []; pool = SEED; }
    const l = pick(pool); seen.push(l.id);
    return l;
  },
  async getInbox() {
    const now = Date.now();
    return store.get("inbox", []).map(m => ({ ...m, status: m.read ? "read" : now >= m.arriveAt ? "landed" : "transit" }));
  },
  async readLetter(mailId) {
    const inbox = store.get("inbox", []), m = inbox.find(x => x.id === mailId);
    if (!m || Date.now() < m.arriveAt) throw new Error("This letter has not arrived yet.");
    m.read = true; store.set("inbox", inbox);
    return SEED.find(l => l.id === m.letterId);
  }
};

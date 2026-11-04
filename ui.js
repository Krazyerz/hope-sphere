/* ---------- UI ---------- */
const nameEl = $("name"), countryEl = $("country"), textEl = $("text"), countEl = $("count"), sendEl = $("send"), statusEl = $("sendStatus");
const myCountry = () => store.get("me", "");
let stamp = "coral", opening = false;
COUNTRIES.forEach(c => { const o = el("option"); o.value = c; $("countries").append(o); });
globe.setGlow(glow);

/* tabs */
const TABS = ["write", "read", "inbox"];
function showTab(which) { TABS.forEach(k => { $(k).hidden = k !== which; $("tab-" + k).setAttribute("aria-selected", String(k === which)); }); }
TABS.forEach(k => $("tab-" + k).onclick = () => { showTab(k); if (k === "read" && !$("letterBox").querySelector(".letter-text")) openLetter(); });

/* stamp colour picker */
const sw = $("swatches");
STAMPS.forEach(s => {
  const b = el("button", "sw"); b.type = "button"; b.style.background = s.c; b.setAttribute("aria-label", s.id + " stamp"); b.setAttribute("aria-pressed", String(s.id === stamp));
  b.onclick = () => { stamp = s.id; [...sw.children].forEach(x => x.setAttribute("aria-pressed", String(x === b))); };
  sw.append(b);
});

/* writing prompts */
const PROMPTS = ["Something that got better after it got hard was", "A small thing that made me smile this week was", "If I could tell my younger self one thing, it would be", "The kindest thing a stranger ever did for me was", "On heavy days, what helps me is", "Something I am quietly proud of is", "A place that makes me feel calm is", "What I wish someone had told me is"];
let pi = -1;
$("stuck").onclick = () => { pi = (pi + 1) % PROMPTS.length; $("promptText").textContent = PROMPTS[pi] + "..."; $("promptBox").hidden = false; };
$("usePrompt").onclick = () => {
  const v = textEl.value; textEl.value = v.trim() ? v.replace(/\s*$/, " ") + PROMPTS[pi] + " " : PROMPTS[pi] + " ";
  textEl.focus(); textEl.dispatchEvent(new Event("input"));
};

/* word counter + send */
textEl.addEventListener("input", () => {
  const n = wordCount(textEl.value);
  countEl.textContent = n + " / " + MAX_WORDS + " words";
  countEl.classList.toggle("over", n > MAX_WORDS);
  sendEl.disabled = n < 1 || n > MAX_WORDS;
});
sendEl.onclick = async () => {
  sendEl.disabled = true; statusEl.textContent = "Folding your letter...";
  try {
    const country = countryEl.value.trim();
    const res = await api.sendLetter({ name: nameEl.value, country, text: textEl.value, stamp });
    if (country) { store.set("me", country); addGlow(country); }
    globe.fly(country || globe.center(), res.deliveredTo, { dur: 5200 }); globe.pulse();
    statusEl.textContent = "Your letter is flying to " + res.deliveredTo + ". A letter from " + res.reply.from + " will reach you in about " + fmtDur(res.reply.arriveAt - res.reply.sentAt) + ".";
    textEl.value = ""; textEl.dispatchEvent(new Event("input")); live++; tick();
  } catch (e) { statusEl.textContent = e.message; sendEl.disabled = false; }
};
$("demo").onchange = e => { DEMO = e.target.checked; };

/* letter card with stamp + postmark (textContent only: no HTML injection) */
function renderLetter(box, l) {
  const wrap = el("div", "stamp-wrap"), st = el("div", "stamp", "\u2709"), pm = el("div", "postmark");
  st.style.setProperty("--st", stampColor(l.stamp));
  pm.append(el("b", null, l.country.toUpperCase()), el("span", null, fmtDate(l.date)));
  wrap.append(st, pm);
  box.className = "card letter";
  box.replaceChildren(wrap, el("p", "letter-text", l.text), el("footer", null, "with hope, " + l.name + ", " + l.country));
}

/* open a random letter: it flies in from the sender's country first */
async function openLetter() {
  if (opening) return; opening = true;
  const btn = $("open"), box = $("letterBox"); btn.disabled = true; btn.textContent = "Looking...";
  const l = await api.getRandomLetter();
  box.className = "card"; box.replaceChildren(el("div", "empty", "A letter is flying in from " + l.country + "..."));
  btn.textContent = "Flying in...";
  globe.fly(l.country, myCountry() || globe.center(), { dur: 4200, done: () => { renderLetter(box, l); globe.pulse(); btn.disabled = false; btn.textContent = "Open another"; opening = false; } });
}
$("open").onclick = openLetter;

/* inbox + slow mail */
let transit = [], pending = 0, lastSig = "", landedSeen = new Set();
globe.setSlow(() => transit);
async function tick() {
  const items = await api.getInbox(), now = Date.now();
  transit = items.filter(m => m.status === "transit").map(m => ({ from: m.from, to: m.to, u: (now - m.sentAt) / (m.arriveAt - m.sentAt) }));
  pending = transit.length;
  const unread = items.filter(m => m.status !== "read").length;
  $("badge").hidden = !unread; $("badge").textContent = unread;
  items.filter(m => m.status === "landed" && !landedSeen.has(m.id)).forEach(m => { landedSeen.add(m.id); globe.pulse(); });
  renderInbox(items, now); paintLive();
}
function renderInbox(items, now) {
  const list = $("mails"), sig = items.map(m => m.id + m.status).join();
  if (sig !== lastSig) {
    lastSig = sig; list.replaceChildren();
    if (!items.length) list.append(el("li", "empty", "No letters yet. Send one, and a stranger's letter will travel back to you."));
    items.slice().reverse().forEach(m => {
      const li = el("li", "mail " + m.status); li.dataset.id = m.id; li.append(el("span", "mt"));
      if (m.status === "transit") { const bar = el("div", "bar"); bar.append(el("i")); li.append(bar); }
      else {
        const b = el("button", "btn sm", m.status === "landed" ? "Read it" : "Read again");
        b.onclick = async () => { renderLetter($("inboxLetter"), await api.readLetter(m.id)); globe.pulse(); tick(); };
        li.append(b);
      }
      list.append(li);
    });
  }
  items.forEach(m => {
    const li = list.querySelector('[data-id="' + m.id + '"]'); if (!li) return;
    li.querySelector(".mt").textContent = m.status === "transit" ? "A letter from " + m.from + " is on its way. Arrives in " + fmtDur(m.arriveAt - now) + "."
      : m.status === "landed" ? "A letter from " + m.from + " has landed." : "Letter from " + m.from + " (read)";
    const i = li.querySelector(".bar i"); if (i) i.style.width = Math.min(100, (now - m.sentAt) / (m.arriveAt - m.sentAt) * 100) + "%";
  });
}
setInterval(tick, 1000); tick();

/* live counter (simulated world traffic + your own letters) and ambient flights */
let live = 128;
const paintLive = () => { $("liveN").textContent = live + pending; };
setInterval(() => { live = Math.max(70, Math.min(210, live + Math.round((Math.random() - .5) * 8))); paintLive(); }, 2500);
if (!matchMedia("(prefers-reduced-motion: reduce)").matches) {
  setInterval(() => {
    const a = pick(COUNTRIES), b = pick(COUNTRIES.filter(c => c !== a));
    globe.fly(a, b, { dur: 6500, ambient: true }); glow[a] = Math.min(14, (glow[a] || 0) + .3);
  }, 3800);
}

/* Settings: appearance, accessibility, language. Saved in localStorage under "settings". */
const DEFAULTS = {
  theme: "system", globe: true, reduceFx: false,
  fs: "m", dys: false, hc: false, calm: matchMedia("(prefers-reduced-motion: reduce)").matches, keys: true,
  lang: /^ms/i.test(navigator.language) ? "ms" : "en"
};
let S = { ...DEFAULTS, ...store.get("settings", {}) };
const dlg = $("settings"), lightQuery = matchMedia("(prefers-color-scheme: light)");

function applySettings() {
  const root = document.documentElement, d = root.dataset;
  d.theme = S.theme === "system" ? (lightQuery.matches ? "light" : "dark") : S.theme;
  root.style.colorScheme = d.theme;
  d.fs = S.fs; d.dys = S.dys ? "1" : "0"; d.hc = S.hc ? "1" : "0"; d.calm = S.calm ? "1" : "0";
  d.fx = S.reduceFx ? "0" : "1"; d.kb = S.keys ? "1" : "0";
  globe.setOpts({ animated: S.globe, calm: S.calm, fx: !S.reduceFx });
}
function refreshText() {                      // re-render everything that has words in it
  applyLang(S.lang);
  textEl.dispatchEvent(new Event("input"));
  statusEl.textContent = "";
  if (!$("promptBox").hidden) $("promptText").textContent = t("p" + pi) + "...";
  [$("letterBox"), $("inboxLetter")].forEach(b => b._l && renderLetter(b, b._l));
  tick();
}
function syncForm() {
  dlg.querySelectorAll("[data-k]").forEach(i => {
    const v = S[i.dataset.k];
    if (i.type === "radio") i.checked = i.value === v; else if (i.type === "checkbox") i.checked = !!v; else i.value = v;
  });
}
dlg.addEventListener("change", e => {
  const i = e.target, k = i.dataset.k; if (!k) return;
  S[k] = i.type === "checkbox" ? i.checked : i.value;
  store.set("settings", S); applySettings(); if (k === "lang") refreshText();
});
$("resetSettings").onclick = () => { S = { ...DEFAULTS, lang: S.lang }; store.set("settings", S); syncForm(); applySettings(); };
const openSettings = () => { syncForm(); dlg.showModal(); };
$("openSettings").onclick = openSettings;
$("closeSettings").onclick = () => dlg.close();
dlg.addEventListener("click", e => { if (e.target === dlg) dlg.close(); });     // click on the dimmed backdrop
lightQuery.addEventListener("change", () => { if (S.theme === "system") applySettings(); });

/* keyboard: arrow keys move between tabs; optional single-key shortcuts */
const TAB_KEYS = ["write", "read", "inbox"];
$("tabs").addEventListener("keydown", e => {
  let i = TAB_KEYS.findIndex(k => $("tab-" + k).getAttribute("aria-selected") === "true");
  if (e.key === "ArrowRight") i = (i + 1) % 3; else if (e.key === "ArrowLeft") i = (i + 2) % 3;
  else if (e.key === "Home") i = 0; else if (e.key === "End") i = 2; else return;
  e.preventDefault(); $("tab-" + TAB_KEYS[i]).click(); $("tab-" + TAB_KEYS[i]).focus();
});
document.addEventListener("keydown", e => {
  if (!S.keys || dlg.open || e.ctrlKey || e.metaKey || e.altKey) return;
  if (/^(input|textarea|select)$/i.test(e.target.tagName)) return;
  const k = e.key.toLowerCase(), tab = { w: "write", r: "read", i: "inbox" }[k];
  if (tab) { e.preventDefault(); $("tab-" + tab).click(); $("tab-" + tab).focus(); }
  else if (k === "s" || k === ",") { e.preventDefault(); openSettings(); }
});

applySettings(); refreshText();

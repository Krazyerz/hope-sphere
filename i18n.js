/* Translations. To add a language: copy the "en" block, translate it, and add an <option> in the settings dialog. */
const I18N = {
  en: {
    skip: "Skip to content", settings: "Settings", close: "Close",
    tag: "Write a few kind words to someone you will never meet. Open a letter someone else sent.",
    live: "letters in flight right now",
    tab_write: "Write a letter", tab_read: "Open a letter", tab_inbox: "Inbox",
    lbl_name: "Your name (optional)", ph_name: "Anonymous", lbl_country: "Your country", ph_country: "Start typing...",
    lbl_text: "Your letter", ph_text: "Give people some hope...", stuck: "Stuck?", use_prompt: "Start with this",
    lbl_stamp: "Stamp color", count: "{n} / {max} words", send: "Send",
    empty_read: "A letter is waiting for you somewhere.", open: "Open a letter", open_looking: "Looking...",
    open_flying: "Flying in...", open_another: "Open another", flying_in: "A letter is flying in from {c}...",
    note: "Offline mockup: letters are stored in this browser only.", demo: "Demo speed (mail arrives 15x faster)",
    folding: "Folding your letter...", sent: "Your letter is flying to {to}. A letter from {from} will reach you in about {t}.",
    footer: "with hope, {name}, {c}", anon: "Anonymous", somewhere: "somewhere on Earth",
    inbox_empty: "No letters yet. Send one, and a stranger's letter will travel back to you.",
    mail_transit: "A letter from {c} is on its way. Arrives in {t}.", mail_landed: "A letter from {c} has landed.",
    mail_read: "Letter from {c} (read)", btn_read: "Read it", btn_again: "Read again",
    err_words: "Letters need 1 to {max} words.", err_country: "Please enter a valid country name.", err_early: "This letter has not arrived yet.",
    sec_appearance: "Appearance", theme: "Theme", theme_light: "Light", theme_dark: "Dark", theme_system: "System default",
    globe_anim: "Globe animation", reduce_fx: "Reduce visual effects", reduce_fx_d: "Removes glow, stars and shadows.",
    sec_access: "Accessibility", font_size: "Font size", fs_s: "Small", fs_m: "Medium", fs_l: "Large",
    dyslexia: "Dyslexia-friendly font", dyslexia_d: "Uses OpenDyslexic if installed, otherwise a clearer fallback font.",
    contrast: "High contrast", reduce_anim: "Reduce animations", reduce_anim_d: "Stops interface motion and slows the globe.",
    keys: "Keyboard navigation support", keys_d: "Stronger focus outline and shortcuts: W write, R read, I inbox, S settings.",
    sec_lang: "Language", lang_more: "More languages coming soon. Letters stay in the language they were written in.", reset: "Reset to defaults",
    p0: "Something that got better after it got hard was", p1: "A small thing that made me smile this week was",
    p2: "If I could tell my younger self one thing, it would be", p3: "The kindest thing a stranger ever did for me was",
    p4: "On heavy days, what helps me is", p5: "Something I am quietly proud of is",
    p6: "A place that makes me feel calm is", p7: "What I wish someone had told me is"
  },
  ms: {
    skip: "Langkau ke kandungan", settings: "Tetapan", close: "Tutup",
    tag: "Tulis beberapa patah kata baik untuk seseorang yang tidak akan anda temui. Buka surat yang dihantar oleh orang lain.",
    live: "surat sedang dalam perjalanan sekarang",
    tab_write: "Tulis surat", tab_read: "Buka surat", tab_inbox: "Peti masuk",
    lbl_name: "Nama anda (pilihan)", ph_name: "Tanpa nama", lbl_country: "Negara anda", ph_country: "Mula menaip...",
    lbl_text: "Surat anda", ph_text: "Berikan sedikit harapan kepada orang lain...", stuck: "Buntu?", use_prompt: "Mula dengan ini",
    lbl_stamp: "Warna setem", count: "{n} / {max} perkataan", send: "Hantar",
    empty_read: "Sebuah surat sedang menunggu anda di suatu tempat.", open: "Buka surat", open_looking: "Mencari...",
    open_flying: "Sedang terbang...", open_another: "Buka yang lain", flying_in: "Sebuah surat sedang terbang dari {c}...",
    note: "Contoh luar talian: surat disimpan dalam pelayar ini sahaja.", demo: "Kelajuan demo (surat tiba 15x lebih pantas)",
    folding: "Melipat surat anda...", sent: "Surat anda sedang terbang ke {to}. Sebuah surat dari {from} akan sampai kepada anda dalam kira-kira {t}.",
    footer: "dengan penuh harapan, {name}, {c}", anon: "Tanpa nama", somewhere: "di suatu tempat di Bumi",
    inbox_empty: "Belum ada surat. Hantar satu, dan surat daripada orang asing akan dihantar kembali kepada anda.",
    mail_transit: "Sebuah surat dari {c} sedang dalam perjalanan. Tiba dalam {t}.", mail_landed: "Sebuah surat dari {c} telah tiba.",
    mail_read: "Surat dari {c} (sudah dibaca)", btn_read: "Baca", btn_again: "Baca semula",
    err_words: "Surat mesti 1 hingga {max} perkataan.", err_country: "Sila masukkan nama negara yang sah.", err_early: "Surat ini belum tiba.",
    sec_appearance: "Penampilan", theme: "Tema", theme_light: "Cerah", theme_dark: "Gelap", theme_system: "Lalai sistem",
    globe_anim: "Animasi glob", reduce_fx: "Kurangkan kesan visual", reduce_fx_d: "Membuang cahaya, bintang dan bayang.",
    sec_access: "Kebolehcapaian", font_size: "Saiz fon", fs_s: "Kecil", fs_m: "Sederhana", fs_l: "Besar",
    dyslexia: "Fon mesra disleksia", dyslexia_d: "Menggunakan OpenDyslexic jika dipasang, jika tidak fon ganti yang lebih jelas.",
    contrast: "Kontras tinggi", reduce_anim: "Kurangkan animasi", reduce_anim_d: "Menghentikan gerakan antara muka dan memperlahankan glob.",
    keys: "Sokongan navigasi papan kekunci", keys_d: "Garis fokus lebih jelas dan pintasan: W tulis, R baca, I peti masuk, S tetapan.",
    sec_lang: "Bahasa", lang_more: "Lebih banyak bahasa akan datang. Surat kekal dalam bahasa asal penulisnya.", reset: "Set semula ke lalai",
    p0: "Sesuatu yang menjadi lebih baik selepas keadaan menjadi sukar ialah", p1: "Perkara kecil yang membuat saya tersenyum minggu ini ialah",
    p2: "Jika saya boleh memberitahu diri saya yang lebih muda satu perkara, ia ialah", p3: "Perkara paling baik yang pernah dilakukan orang asing untuk saya ialah",
    p4: "Pada hari yang berat, perkara yang membantu saya ialah", p5: "Sesuatu yang saya diam-diam banggakan ialah",
    p6: "Tempat yang membuatkan saya berasa tenang ialah", p7: "Apa yang saya harap seseorang telah beritahu saya ialah"
  }
};
const t = (key, v = {}) => {
  const s = (I18N[document.documentElement.lang] || I18N.en)[key] ?? I18N.en[key] ?? key;
  return s.replace(/\{(\w+)\}/g, (m, k) => v[k] ?? m);
};
const place = c => c === "somewhere on Earth" ? t("somewhere") : c;
const setT = (node, key) => { node.dataset.i18n = key; node.textContent = t(key); };   // text that keeps translating
function applyLang(lang) {
  document.documentElement.lang = lang;
  document.querySelectorAll("[data-i18n]").forEach(n => n.textContent = t(n.dataset.i18n));
  document.querySelectorAll("[data-i18n-ph]").forEach(n => n.placeholder = t(n.dataset.i18nPh));
  document.querySelectorAll("[data-i18n-label]").forEach(n => n.setAttribute("aria-label", t(n.dataset.i18nLabel)));
}

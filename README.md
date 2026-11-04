# hope-sphere

> Write a few kind words to someone you will never meet. Open a letter someone else sent.

**Version:** v1.1 (offline mockup)

hope-sphere is a small website where people send short, hopeful letters to random strangers around the world, and receive letters from strangers in return. This repo holds the **front-end mockup**. It runs fully offline, and every piece of data access sits behind one small fake API (`api.js`), so a real backend can be plugged in later without touching the UI.

## What it does

**Letters**
- **Write a letter** with an optional name, a country (with autocomplete), up to **80 words**, and a stamp color. A live word counter blocks sending past the limit.
- **"Stuck?"** offers a gentle starter sentence, such as "Something that got better after it got hard was...". Press it again for another, or use "Start with this" to put it in the letter.
- **Open a letter** to read a random letter from someone else. It flies in from the sender's country before the card appears.
- Every letter shows a **stamp** in the writer's chosen color and a **postmark** with the origin country and date.

**Slow mail and inbox**
- Sending a letter schedules a reply from a stranger. It arrives after a delay based on distance: `30 seconds + distance in km / 40` seconds (a Kenya-to-Japan reply takes about 5 minutes).
- The **Inbox** tab shows each letter on its way with a countdown bar, then a "Read it" button once it lands. A badge on the tab counts unread letters.
- The **Demo speed** checkbox (on by default) makes mail arrive 15 times faster, so a demo does not need to wait minutes.

**The globe**
- A cartoon Earth that turns slowly. Sending a letter arcs an envelope from your country to a random recipient country, and opening one flies it in from the sender's country.
- **Glowing dots** mark every country that has sent letters, and grow as the count rises. Your own letters add to your country's dot.
- A **live counter** ("128 letters in flight right now") drifts like world traffic, plus your own pending letters. Faint ambient flights cross the globe every few seconds.

**Settings** (gear button in the top right, or press **S**)

| Group | Options |
| --- | --- |
| Appearance | Light, dark or system theme; globe animation on/off; reduce visual effects (no glow, stars or shadows) |
| Accessibility | Font size (small, medium, large); dyslexia-friendly font; high contrast; reduce animations; keyboard navigation support |
| Language | English, Bahasa Melayu (more can be added) |

Settings are saved in `localStorage`. "Reduce animations" starts on if the device already asks for reduced motion, and the language starts from the browser's language.

**Keyboard**
- Arrow keys, Home and End move between the three tabs. A "Skip to content" link appears on the first Tab press.
- With **Keyboard navigation support** on (the default): **W** write, **R** read, **I** inbox, **S** settings, plus a stronger focus outline. Shortcuts are ignored while typing.

## Project structure

```
hope-sphere/
├── index.html    page structure and the settings dialog
├── style.css     styling, themes, accessibility modes
├── geo.js        helpers, country coordinates, distance, date format
├── i18n.js       English + Bahasa Melayu strings, t() helper
├── api.js        mock API: letters, slow mail, inbox, stamps, glow counts
├── globe.js      canvas globe, flights, glowing dots
├── ui.js         tabs, prompts, stamps, inbox, live counter
├── settings.js   appearance, accessibility and language settings
├── fonts/        optional: OpenDyslexic-Regular.woff2
└── README.md
```

No build step and no dependencies. Keep all files in the same folder. The scripts are plain (not modules) and share globals, so the load order in `index.html` matters: `geo`, `i18n`, `api`, `globe`, `ui`, `settings`.

## Run it

Open `index.html` in a browser. Optionally serve it locally:

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Backend contract

The mock `api` object in `api.js` imitates these endpoints. A real server must follow them.

### `POST /api/letters`

```json
{ "name": "Amara", "country": "Kenya", "text": "Your letter, 1 to 80 words.", "stamp": "sea" }
```

Response `201`:

```json
{
  "id": "u1a2b3c",
  "deliveredTo": "Norway",
  "reply": { "id": "m1x2y3", "from": "Japan", "to": "Kenya", "sentAt": 1790000000000, "arriveAt": 1790000300000 }
}
```

The server stores the letter, picks a recipient country, and schedules a reply letter from a stranger.

### `GET /api/letters/random`

Response `200`: `{ "id", "name", "country", "text", "stamp", "date" }`, or `204` if none is available.

### `GET /api/inbox`

Response `200`: a list of `{ id, from, to, sentAt, arriveAt, status }` where `status` is `transit`, `landed` or `read`.

### `POST /api/inbox/:id/read`

Response `200`: the letter. Refuse (error `err_early`) if `arriveAt` is still in the future.

### Rules the server must enforce

- `text`: 1 to 80 words
- `name`: up to 30 characters, defaults to "Anonymous"
- `country`: up to 56 characters, letters, spaces and `. ' -` only, defaults to "somewhere on Earth"
- `stamp`: one of `coral`, `amber`, `sea`, `sage`, `lilac`
- Strip or escape any HTML (the UI already renders with `textContent`)
- Rate limit per IP
- Never return a letter to its own author
- Prefer a different country than the sender's
- Geocode country names server-side (the mockup only has a table of 45 countries; unknown names get a made-up spot on the globe)

Errors should return a code (`err_words`, `err_country`, `err_early`) so the UI can show them in the chosen language.

### Suggested data model

```
letters(id, name, country, text, stamp, created_at, author_token)
inbox(id, letter_id, reader_token, from_country, to_country, sent_at, arrive_at, read_at)
```

The globe's glowing dots come from `SELECT country, COUNT(*) FROM letters GROUP BY country`.

## Connecting a real backend

1. Replace the bodies of `api.sendLetter`, `api.getRandomLetter`, `api.getInbox` and `api.readLetter` in `api.js` with `fetch()` calls to the endpoints above, keeping the same return shapes.
2. Replace the starting `glow` object in `api.js` with data from your server.
3. `ui.js` calls `api.getInbox()` every second to update countdowns. With a real server, fetch it every 15 to 30 seconds and let the client count down locally.

## Known limits of the mockup

- Letters you send are stored in your browser only; nobody else sees them. The "strangers" are 8 sample letters.
- Sample letters and country names are not translated. Letters stay in the language they were written in.
- The Bahasa Melayu text was drafted by an AI assistant and should be checked by a native speaker.
- The dyslexia-friendly font uses OpenDyslexic only if it is installed or provided in `fonts/`; otherwise it falls back to a clearer system font.

## Roadmap

- [ ] Real server (for example Node/Express or FastAPI with SQLite)
- [ ] Anonymous author and reader tokens
- [ ] Fair delivery: least-read letters first
- [ ] "This helped" button that sends a small glow back to the writer
- [ ] Moderation, a report button, and a gentle check for crisis language that shows support resources
- [ ] Rate limiting and spam protection
- [ ] More languages, and translated country names

## Changelog

- **v1.1** Letters travel across the globe, glowing country dots, live counter, slow mail with an inbox, stamps and postmarks with a color picker, "Stuck?" writing prompts, settings panel (appearance, accessibility, language), light theme, English and Bahasa Melayu. `script.js` split into `geo.js`, `i18n.js`, `api.js`, `globe.js`, `ui.js` and `settings.js`.
- **v0.2** Cartoon-calm UI, country field with autocomplete, globe rendering fix, HTML, CSS and JavaScript split into separate files.
- **v0.1** First offline mockup with the write and read flow, 80-word limit and mock API layer. 
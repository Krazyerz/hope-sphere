# hope-sphere

> Write a few kind words to someone you will never meet. Open a letter someone else sent.

**Version:** v1 phase 1 (offline mockup)

hope-sphere is a small website where people send short, hopeful letters to random strangers around the world, and read letters written by strangers in return. This repo currently holds the **front-end mockup**. It runs fully offline, and all of the data access is isolated behind a tiny fake API so a real backend can be plugged in later.

## What the mockup does

- **Write a letter** with an optional name, a country, and up to **80 words**. A live word counter blocks sending past the limit.
- **Open a letter** to read a random letter from someone else, shown as a paper card with their name and country.
- A calm, cartoon-style UI with a slowly spinning globe. A small envelope orbits the globe, and a ring pulses out when a letter is sent or opened.
- Sample letters from 8 countries stand in for "other people". They are cycled without repeats until all have been shown.
- Sent letters are saved in the browser's `localStorage` (with an in-memory fallback). They are not shown to anyone, since there is no server yet.

## Project structure

```
hope-sphere/
├── index.html   page structure
├── style.css    all styling
├── geo.js       helpers, country coordinates, distance
├── api.js       mock API: letters, slow mail, inbox, stamps, glow counts
├── globe.js     canvas globe, flights, glowing dots
├── ui.js        tabs, prompts, stamps, inbox, live counter
└── README.md
```

No build step and no dependencies. Keep all the files in the same folder.

## Run it

Open `index.html` in a browser. That's all.

Optionally, serve it locally:

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

## How `script.js` is organised

| Section | What it does |
| --- | --- |
| Backend contract (top comment) | The endpoints and rules the real server should follow |
| Constants and helpers | Limits (`MAX_WORDS`, `MAX_NAME`, `MAX_COUNTRY`), word counter, storage wrapper |
| `SEED`, `COUNTRIES` | Sample letters and the country autocomplete list |
| `api` object | `sendLetter()` and `getRandomLetter()`, the only code that touches data |
| UI | Tabs, word counter, send and open handlers |
| `globe` | Canvas globe: land is painted once on a flat map, then looked up per pixel each frame |

## Backend contract

The mockup's `api` object imitates this contract:

### `POST /api/letters`

Request body:

```json
{ "name": "Amara", "country": "Kenya", "text": "Your letter, 1 to 80 words." }
```

Response `201`:

```json
{ "id": "u1a2b3c", "deliveredTo": "a village in Nepal" }
```

### `GET /api/letters/random?exclude=<id,id,...>`

Response `200`:

```json
{ "id": "s1", "name": "Amara", "country": "Kenya", "text": "..." }
```

Response `204` if no letter is available.

### Validation rules

The mockup checks these inside the `api` functions, and the real server must enforce them too:

- `text`: 1 to 80 words
- `name`: up to 30 characters, defaults to "Anonymous"
- `country`: up to 56 characters, letters, spaces and `. ' -` only, defaults to "somewhere on Earth"
- Strip or escape any HTML (the UI already renders with `textContent`)
- Rate limit per IP
- Never return a letter to its own author
- Optional: prefer delivering to a different country than the sender's

### Suggested data model

```
letters(id, name, country, text, created_at, author_token)
reads(letter_id, reader_token, read_at)    -- to avoid repeats and self-delivery
```

## Connecting a real backend

1. Find `api.sendLetter` and `api.getRandomLetter` in `script.js`.
2. Replace their bodies with `fetch()` calls to the endpoints above.
3. Keep the return shapes the same, and the UI needs no changes.

## Roadmap

- [ ] Real server (for example Node/Express or FastAPI with SQLite)
- [ ] Anonymous author and reader tokens
- [ ] Moderation and report button for harmful letters
- [ ] Rate limiting and spam protection
- [ ] Show the sender's country on the globe when a letter arrives
- [ ] Reply to a letter

## Changelog

- **v1 phase 1** Letters fly across the globe (sender to recipient), glowing dots for countries that have sent letters, live "in flight" counter, slow mail with an inbox (delay based on distance, demo-speed toggle), stamps and postmarks with a color picker, "Stuck?" writing prompts. `script.js` split into `geo.js`, `api.js`, `globe.js`, `ui.js`.
- **v0.2** Cartoon-calm UI, country field with autocomplete, globe rendering fix (no more green leaking while rotating), HTML, CSS and JavaScript split into separate files.
- **v0.1** First offline mockup with the write and read flow, 80-word limit and mock API layer.

# SOL PATROL — Junior Astronaut Mission Trainer

**Spend the sunshine. Survive the night.**

▶ Demo (30s): *(record and paste your unlisted video URL here before submitting — script below)*
Live play: *(paste your deployed URL here)* · Deploy root = this folder (`junior-astronaut-trainer/`)

NASA Space Apps Challenge 2026 · *Build a Junior Astronaut Mission Trainer* · For kids ages 7–12. Minimum browser: Chrome/Safari 14+.

You command an outpost for **8 days** — pick **Mars (Jezero Plains)** or **the Moon (Shackleton Crater, South Pole)** on the title screen. Each world has its own science: Mars messages take ~12 minutes and dust storms block sunshine; Moon messages take ~1 second and ice hides in dark polar craters. Each morning sunshine gives you limited **Power**. Spend it on mission cards — Make Air, Grow Food, Raise Shields, Do Science, Call Earth, Rest & Fix — then face the night: your crew breathes and eats, and an event (solar storm, dust storm, freezing night, air leak…) tests your choices. Every card costs Power, so no choice is free — exactly like real NASA mission planning. Survive all 8 sols and earn Science Stars for your rank.

## Run it

```
cd junior-astronaut-trainer && npm start
```

Then open http://127.0.0.1:8765/ in a browser. Alternatives: `python3 -m http.server 8765` (Windows: `py -m http.server 8765`), or double-click `index.html`. Any static host works (submit/deploy this folder); there is no build step and no account. Optional: add `?key=YOUR_NASA_KEY` to the URL to use your own free api.nasa.gov key instead of the shared DEMO_KEY; the game caches a live Sun answer for 6 hours.

## How it teaches real trade-offs

- **Power is the budget.** Sunshine gives 9–20 Power a sol; Make Air + Grow Food cost 11, Science costs more each time (4, 6, 8…), and shields cost 5 — you cannot do everything, so storm forecasts force real prioritisation.
- **Actions have hidden costs.** Grow Food also uses Air; Do Science trades Air for stars; Raise Shields only pays off if a storm comes.
- **Tonight's forecast** rewards planning: check the Sun/Dust/Cold watch, then decide.
- **Failure teaches.** Running out of Air/Food/Health launches a friendly rescue ending that names what ran low and what to try next — never a punishment screen.

## NASA datasets used (and why)

| Dataset | How the game uses it |
|---|---|
| **DONKI — Space Weather Database (via NASA Open APIs, api.nasa.gov)** | On load the game fetches real space-weather events from the last 30 days (`DONKI/GST` + `DONKI/SEP`, DEMO_KEY; the `/FLR` gateway returned 404 in live probes on 2026-11-15, so it is not used). The event count and strongest Kp set today's radiation risk. If offline, it falls back to curated real archived events (e.g. the X9.0 flare of 2024-10-03, the May 2024 G5 storm) clearly labelled "ARCHIVED REAL DATA" — static data is never presented as live. DEMO_KEY is rate-limited, so the game makes at most 2 calls and the offline path is a first-class path, not an error. |
| **RadLab / OSDR (NASA Open Science Data Repository)** | Fact cards use real ISS radiation (~0.5 mSv/day vs ~0.01 on Earth) and astronaut sleep/health research behind the Rest and Call Earth cards. |
| **Mars Trek / Mars surface missions** | The Jezero Plains setting, rover ice discovery, dust-storm and blue-sunset facts come from real Mars mission knowledge (Perseverance, Opportunity). |
| **CSA Food Production + NASA Veggie** | The Grow Food card's water/air cost mirrors real space-greenhouse constraints. |

All sources are also credited inside the game (Sun banner + "NASA Science" panel).

## Files

- `index.html` — screens, Mars SVG scene, meters
- `style.css` — kid-friendly styling, reduced-motion support
- `data.js` — mission cards, event deck, real facts
- `game.js` — game loop, night resolution, live DONKI fetch with offline fallback

Game numbers are simplified for ages 7–12; the science facts and Sun data are real.

## Team story

*(Fill with true facts before submitting — do not invent: team name · who built what · the spark, e.g. a classroom/family/kid-tester moment.)*

## Submission notes

- **Exact 30s demo script:** [0–5s, title] "I'm the Commander of Sol Patrol — Spend the sunshine. Survive the night. A sol is a Mars day, and the Sun is your battery — for 8 sols on Mars using NASA's real Sun data today." [5–15s] Show the LIVE FROM NASA badge + "Sun looks grumpy" forecast, tap Raise Shields, Start Night, storm hits shielded. [15–25s] Show the Air warning, tap Make Air then Grow Food, Do Science once, star awarded. [25–30s, rank card] "Not a rescue cartoon — a real NASA-data command sim. Sol Patrol: spend the sunshine, survive the night." If ARCHIVED shows, say: "NASA quota/offline — archived real flare, game still plays."
- **AI declaration:** the title-screen painting was AI-generated (declared here and in `assets/manifest.json`); gameplay art is hand-built SVG, and code/text are human-directed with AI coding assistance. No NASA logos, flags or mission marks appear in generated content.
- **Judging fit:** Relevance/Validity via live DONKI-driven radiation risk + attributed facts; Creativity via the forecast→prepare→consequence loop; Impact via free browser play for classrooms (no account; Sun data falls back to archived real events offline, the page itself needs a first load/host).
- **Checks:** `node test.mjs` (balance/data contracts) must pass; submit only this folder, not the workspace root.

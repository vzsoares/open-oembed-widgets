# Widget backlog

Planned widgets. Each is **client-side only** and follows the existing pattern:

1. add an entry to `src/widgets/manifest.ts`
2. create `<id>/index.html` + `src/widgets/<id>/index.ts`
3. register the page in `vite.config.js` (`build.rollupOptions.input`)

The gallery card and `oembed.json` are then generated from the manifest. All
widgets are monochrome, transparent-background, and support `?theme=light|dark`.

---

## ⏰ Clock / Date — `clock`

Current date + time (hour:minutes). No API — uses the device clock, ticks via
`setInterval`.

- **Config**
    - `?show=time|date|both` (default `both`)
    - `?seconds=1` — include seconds
    - `?tz=Area/City` — IANA timezone (default: viewer's local)
    - `?h24=1` — 24-hour clock (default: locale)
- **Notes** — format with `Intl.DateTimeFormat` (+ `timeZone`). Tick every 1s
  if seconds shown, else align to the next minute.
- **Size** — ~360×140.

## ⏳ Countdown — `countdown`

Counts **down** to a target datetime. Shows days / hours / minutes / seconds.

- **Config**
    - `?to=ISO` — target instant, e.g. `?to=2026-12-31T23:59:59Z` (required)
    - `?label=New%20Year` — caption
    - `?units=dhms|dhm` — granularity
- **Notes** — when it reaches zero, show a "done" state (`?done=...` text).
  Reuse a shared `src/lib/duration.ts` with count-up.
- **Size** — ~420×160.

## ⏱️ Count-up — `countup`

Counts **up** (elapsed) from a start datetime. Same UI as countdown, opposite
direction.

- **Config**
    - `?from=ISO` — start instant (required)
    - `?label=...`, `?units=dhms|dhm`
- **Notes** — share duration formatting + the tick loop with `countdown`
  (consider one `timer` widget with `?mode=up|down`).
- **Size** — ~420×160.

## 🖼️ Image rotator — `images`

Cycles through a list of images — "one then the other", sequentially or
randomly, every X seconds.

- **Config**
    - `?src=url1,url2,url3` — comma-separated image URLs (required)
      _(or `?album=` pointing at a hosted JSON list, TBD)_
    - `?mode=sequential|random` (default `sequential`)
    - `?every=8` — seconds per image (default ~8)
    - `?fit=cover|contain` (default `cover`)
- **Notes** — preload the next image; cross-fade on swap; pause on hover.
  Watch URL length limits when many images are inlined → the hosted-list option
  is the scalable path. CORS only matters if we read pixels (we don't).
- **Size** — ~480×270 (16:9).

---

### Shared building blocks to extract as these land

- `src/lib/duration.ts` — humanized d/h/m/s formatting (countdown + count-up).
- `src/lib/interval.ts` — a self-correcting tick that survives tab throttling.
- A `?theme=` is already handled by `src/lib/theme.ts`.

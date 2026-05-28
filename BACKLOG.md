# Backlog

Ideas and enhancements for the project. Shipped so far: 12 widgets (btc, clock,
timer, counter, images, progress, onthisday, weather, github, links, quote,
bible), a redesigned gallery, a `/showcase/` live-demos page, a `/help/` guide,
fit-to-box scaling, padding/scaling controls, e2e + CI, and a DESIGN.md.

New widgets are **client-side only** and follow the existing pattern:

1. add an entry to `src/widgets/manifest.ts`
2. create `<id>/index.html` + `src/widgets/<id>/index.ts`
3. register the page in `vite.config.js` (`build.rollupOptions.input`)

The gallery card and `oembed.json` are generated from the manifest. All widgets
are monochrome, transparent-background, and support `?theme=light|dark`.

---

## Widget ideas

- **World clock — `worldclock`.** Several timezones at once:
  `?tz=America/Sao_Paulo,Europe/London,Asia/Tokyo` → a row/column of small
  labelled clocks. Reuse `src/widgets/clock/time.ts` (already tz-aware). Pure
  client-side, no API.
- **Crypto/stock ticker — `ticker`.** Generalize the BTC widget to any coin via
  `?coin=ethereum` (CoinGecko is keyless + CORS, already used by `btc`). Same
  chart/price UI; possibly fold `btc` into it as `?coin=bitcoin`.
- **Moon phase — `moon`.** Current phase + illumination %, computed from the
  date with an astronomical formula (no API, deterministic). A monochrome SVG
  moon. Pure client-side.
- **Name day — `nameday`.** Today's name day(s) for a locale
  (`?lang=cz|pl|hu|…`). Needs a **bundled per-locale dataset** (like
  `bible/fallback.json`); name-day calendars are country-specific. No API.

---

## Enhancements

- **Link & social previews.** No `og:image` on any page and no `thumbnail_url`
  in the generated oEmbed, so shared links (Slack/Discord/Twitter/Notion unfurl)
  show no preview. Add `og:image` + `twitter:card` to the gallery and widget
  pages (reuse `docs/screenshot.png` for the gallery; per-widget thumbnails would
  need generated images or a shared default), and `thumbnail_url` to
  `scripts/gen-oembed.ts`.
- **API caching / resilience.** Add a small `localStorage` short-TTL cache (e.g.
  `src/lib/cache.ts`) used by the network widgets (btc, weather, github,
  onthisday, bible). Speeds repeat loads and survives provider outages and
  GitHub's unauthenticated 60-req/hr limit (the gallery alone fires ~5 API calls
  per visit).
- **Accessibility & polish.** `focus-visible` focus rings on buttons/links,
  consistent `aria-live` on async widgets, a `prefers-reduced-motion` audit
  (covered: clock flip; check the image cross-fade and progress-bar transition),
  and keyboard navigation through the gallery.

---

## Shared building blocks (available to reuse)

- `src/lib/duration.ts` — d/h/m/s splitting + display segments (timer).
- `src/lib/interval.ts` — a self-correcting tick that survives tab throttling.
- `src/lib/fit.ts` — scale-to-fit (`?fit=1`) + padding (`?pad=`) for all widgets.
- `src/lib/theme.ts` — `?theme=light|dark` resolution.

---

## Project / repo chores

Non-widget tasks for project health and tooling. **Done:** template sync
(e2e + CI gate), `CONTRIBUTING.md`, GitHub repo About + topics, per-widget e2e
coverage, the major dependency upgrades (Vite 8, Tailwind 4, TypeScript 6,
vitest), the gallery redesign + `DESIGN.md`.

_Nothing outstanding._

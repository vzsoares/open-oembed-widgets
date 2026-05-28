# Backlog

Ideas and enhancements for the project. Shipped so far: 14 widgets (btc, clock,
worldclock, timer, counter, moon, images, progress, onthisday, weather, github,
links, quote, bible), a redesigned gallery, a `/showcase/` live-demos page, a
`/help/` guide, fit-to-box scaling, padding/scaling controls, link/social
previews (og:image + oEmbed `thumbnail_url`), e2e + CI, and a DESIGN.md.

New widgets are **client-side only** and follow the existing pattern:

1. add an entry to `src/widgets/manifest.ts`
2. create `<id>/index.html` + `src/widgets/<id>/index.ts`
3. register the page in `vite.config.js` (`build.rollupOptions.input`)

The gallery card and `oembed.json` are generated from the manifest. All widgets
are monochrome, transparent-background, and support `?theme=light|dark`.

---

## Widget ideas

- **Crypto/stock ticker — `ticker`.** Generalize the BTC widget to any coin via
  `?coin=ethereum` (CoinGecko is keyless + CORS, already used by `btc`). Same
  chart/price UI; possibly fold `btc` into it as `?coin=bitcoin`.
- **Name day — `nameday`.** Today's name day(s) for a locale
  (`?lang=cz|pl|hu|…`). Needs a **bundled per-locale dataset** (like
  `bible/fallback.json`); name-day calendars are country-specific. No API.

---

## Enhancements

- **API caching / resilience.** ⚠️ Re-scoped after measuring. A short-TTL
  `localStorage` cache does **almost nothing for a lone embed**: each iframe
  fetches once per load, most network widgets don't even refresh, and modern
  browsers **partition** third-party storage per top-level site (so a Notion
  embed can't reuse anything, and may have storage blocked entirely). Where it
  *is* measurable: our own multi-widget pages — the gallery and `/showcase/`
  each fire **6 external API calls per visit** (coingecko, github, 2× open-meteo,
  bible, wikipedia), and a reload fires 6 more; a same-origin TTL cache collapses
  the reload to ~0. It also protects the **GitHub 60-req/hr** budget (hit on both
  pages + every reload). Net: only worth it if scoped to first-party pages +
  GitHub, not "for embeds". Decide before building.
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

# Backlog

Ideas and enhancements for the project. Shipped so far: 16 widgets (btc, ticker,
clock, worldclock, timer, counter, moon, images, progress, onthisday, weather,
github, links, quote, bible, nameday), a redesigned gallery, a `/showcase/`
live-demos page, a `/help/` guide, fit-to-box scaling, padding/scaling controls,
link/social previews (og:image + oEmbed `thumbnail_url`), a `prefers-reduced-motion`
+ keyboard-focus accessibility pass, e2e + CI, and a DESIGN.md. `nameday` ships
six locales (cz, sk, fr, it, es, en).

New widgets are **client-side only** and follow the existing pattern:

1. add an entry to `src/widgets/manifest.ts`
2. create `<id>/index.html` + `src/widgets/<id>/index.ts`
3. register the page in `vite.config.js` (`build.rollupOptions.input`)

The gallery card and `oembed.json` are generated from the manifest. All widgets
are monochrome, transparent-background, and support `?theme=light|dark`.

---

## Widget ideas

_Nothing outstanding._

### Considered & declined

- **Stock-index ticker (Ibovespa, Nasdaq, …).** Not viable as a pure client-side
  widget: no keyless **and** CORS-enabled price source exists. Stooq sends no
  `Access-Control-Allow-Origin` (and gates history behind an API key); Yahoo's
  chart API returns the data but also sends no CORS header, so a browser fetch
  from the embed is blocked. Every free stock API needs a key (unsafe to embed
  in a public static page) or a proxy/backend — which breaks the no-account,
  GitHub-Pages model. Crypto works only because CoinGecko sends `ACAO: *`.
  Revisit if the project ever adds a tiny proxy/backend.
- **Portuguese name day.** No standard Portuguese name-day tradition or dataset
  exists (Portugal/Brazil share the Catholic *santoral* but don't observe name
  days); nothing clean to bundle, so `pt` was left out rather than fabricated.

---

## Enhancements

_Nothing outstanding._

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
